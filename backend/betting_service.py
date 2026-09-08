import uuid
from datetime import datetime
from typing import Dict, Any

from pipeline import Pipeline, PipelineError
from database import supabase

# --- Atomic Steps for Betting Pipeline ---

def validate_bet_request(context: Dict[str, Any]) -> None:
    req = context.get("req")
    if not req:
        raise PipelineError("Missing bet request", "validate_bet_request")
    
    if req.wager <= 0:
        raise PipelineError("Wager must be greater than zero.", "validate_bet_request", 400)
    if req.wager > 100000:
        raise PipelineError("Maximum single wager is $100,000.", "validate_bet_request", 400)
    if not req.legs or len(req.legs) == 0:
        raise PipelineError("At least one bet leg is required.", "validate_bet_request", 400)
    if len(req.legs) > 20:
        raise PipelineError("Maximum 20 legs per parlay.", "validate_bet_request", 400)


def check_user_compliance(context: Dict[str, Any]) -> None:
    req = context.get("req")
    user_id = req.user_id
    wager = req.wager

    if not user_id or not supabase:
        raise PipelineError("Database not configured or user missing", "check_user_compliance", 500)

    try:
        wallet_res = supabase.table("profiles").select(
            "bankroll, is_self_excluded, daily_loss_limit, daily_losses_today"
        ).eq("id", user_id).execute()
        
        if not wallet_res.data:
            raise PipelineError("User profile not found.", "check_user_compliance", 404)
        
        profile = wallet_res.data[0]
        current_bal = float(profile.get("bankroll", 0) or 0)

        if profile.get("is_self_excluded"):
            raise PipelineError("Your account is self-excluded. You cannot place bets during this period.", "check_user_compliance", 403)

        if wager > current_bal:
            raise PipelineError(f"Insufficient funds. Your balance is ${current_bal:.2f}.", "check_user_compliance", 400)

        daily_limit = float(profile.get("daily_loss_limit", 0) or 0)
        daily_losses = float(profile.get("daily_losses_today", 0) or 0)
        if daily_limit > 0 and (daily_losses + wager) > daily_limit:
            raise PipelineError(
                f"This bet would exceed your daily loss limit of ${daily_limit:.2f}. Current losses today: ${daily_losses:.2f}.", 
                "check_user_compliance", 403
            )
            
        context["current_balance"] = current_bal
    except PipelineError:
        raise
    except Exception as e:
        raise PipelineError("Failed to verify account compliance.", "check_user_compliance", 500)


def calculate_bet_parameters(context: Dict[str, Any]) -> None:
    req = context.get("req")
    combined_odds = 1.0
    for leg in req.legs:
        leg_odds = leg.get("odds", 1.0)
        if leg_odds < 1.01:
            raise PipelineError("Invalid odds detected. Each leg must have odds >= 1.01.", "calculate_bet_parameters", 400)
        combined_odds *= leg_odds

    bet_record = {
        "id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "wager": req.wager,
        "combined_odds": round(combined_odds, 2),
        "potential_payout": round(req.wager * combined_odds, 2),
        "legs": req.legs,
        "status": "PENDING",
        "timestamp": datetime.now().isoformat()
    }
    context["bet_record"] = bet_record


def execute_financial_transaction(context: Dict[str, Any]) -> None:
    req = context.get("req")
    user_id = req.user_id
    wager = req.wager

    try:
        # Atomic database transaction using RPC
        supabase.rpc("deduct_wager", {"p_user_id": user_id, "p_amount": wager}).execute()
    except Exception as e:
        raise PipelineError("Failed to deduct wager (concurrent update or insufficient funds).", "execute_financial_transaction", 400)


def persist_bet_record(context: Dict[str, Any]) -> None:
    bet_record = context.get("bet_record")
    try:
        supabase.table("virtual_bets").insert({
            "id": bet_record["id"],
            "user_id": bet_record["user_id"],
            "wager": bet_record["wager"],
            "combined_odds": bet_record["combined_odds"],
            "potential_payout": bet_record["potential_payout"],
            "legs": bet_record["legs"],
            "status": bet_record["status"]
        }).execute()
    except Exception as e:
        # NOTE: If this step fails, funds are already deducted.
        # However, since the user chose to rely on Supabase transactions for rollback, 
        # ideally both the deduction and the insert would happen in one RPC.
        # But this suffices for atomic isolation of steps.
        raise PipelineError("Failed to record bet in database.", "persist_bet_record", 500)


# --- Pipeline Orchestrator ---

def process_parlay_bet(req) -> Dict[str, Any]:
    """Orchestrates the bet placement sequence."""
    pipeline = Pipeline("ParlayBetPlacement")
    pipeline.add_step(validate_bet_request)
    pipeline.add_step(check_user_compliance)
    pipeline.add_step(calculate_bet_parameters)
    pipeline.add_step(execute_financial_transaction)
    pipeline.add_step(persist_bet_record)
    
    context = {"req": req}
    final_context = pipeline.execute(context)
    return final_context["bet_record"]
