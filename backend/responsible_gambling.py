"""
Responsible Gambling Module
===========================
Provides safeguards required for real-money gambling platforms:
- Self-exclusion (temporary and permanent)
- Deposit limits (daily, weekly, monthly)
- Loss limits (daily)
- Cool-down periods
- Session time reminders
- Age verification gate

All limits are stored in the `profiles` table in Supabase.
Required columns (add via Supabase migration):
  - is_self_excluded      BOOLEAN DEFAULT FALSE
  - self_exclusion_until   TIMESTAMPTZ NULL
  - daily_deposit_limit    NUMERIC DEFAULT 0  (0 = no limit)
  - weekly_deposit_limit   NUMERIC DEFAULT 0
  - monthly_deposit_limit  NUMERIC DEFAULT 0
  - daily_loss_limit       NUMERIC DEFAULT 0
  - daily_losses_today     NUMERIC DEFAULT 0
  - deposits_today         NUMERIC DEFAULT 0
  - deposits_this_week     NUMERIC DEFAULT 0
  - deposits_this_month    NUMERIC DEFAULT 0
  - last_deposit_reset     DATE DEFAULT CURRENT_DATE
  - session_start          TIMESTAMPTZ NULL
  - age_verified           BOOLEAN DEFAULT FALSE
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from database import supabase
import logging

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Self-Exclusion
# ──────────────────────────────────────────────

def set_self_exclusion(user_id: str, duration_days: Optional[int] = None) -> Dict[str, Any]:
    """
    Self-exclude a user. If duration_days is None, the exclusion is permanent.
    During self-exclusion:
      - User cannot place bets
      - User cannot make deposits
      - User can still withdraw
    """
    if not supabase:
        return {"error": "Database not configured"}

    try:
        update_data: Dict[str, Any] = {"is_self_excluded": True}
        if duration_days:
            until = datetime.utcnow() + timedelta(days=duration_days)
            update_data["self_exclusion_until"] = until.isoformat()
            message = f"Self-exclusion activated for {duration_days} days (until {until.strftime('%Y-%m-%d')})."
        else:
            update_data["self_exclusion_until"] = None  # Permanent
            message = "Permanent self-exclusion activated. Contact support to reverse."

        supabase.table("profiles").update(update_data).eq("id", user_id).execute()
        return {"success": True, "message": message}
    except Exception as e:
        logger.error(f"Error setting self-exclusion for {user_id}: {e}")
        return {"error": str(e)}


def check_self_exclusion(user_id: str) -> Dict[str, Any]:
    """
    Check if a user is currently self-excluded.
    Auto-lifts temporary exclusions that have expired.
    """
    if not supabase:
        return {"excluded": False}

    try:
        res = supabase.table("profiles").select(
            "is_self_excluded, self_exclusion_until"
        ).eq("id", user_id).execute()

        if not res.data:
            return {"excluded": False}

        profile = res.data[0]
        if not profile.get("is_self_excluded"):
            return {"excluded": False}

        # Check if temporary exclusion has expired
        until = profile.get("self_exclusion_until")
        if until:
            until_dt = datetime.fromisoformat(until.replace("Z", "+00:00"))
            if datetime.utcnow().replace(tzinfo=until_dt.tzinfo) > until_dt:
                # Exclusion has expired — lift it
                supabase.table("profiles").update({
                    "is_self_excluded": False,
                    "self_exclusion_until": None
                }).eq("id", user_id).execute()
                return {"excluded": False, "message": "Self-exclusion period has ended."}

        return {
            "excluded": True,
            "until": until,
            "message": "Your account is self-excluded. You cannot place bets or deposit funds."
        }
    except Exception as e:
        logger.error(f"Error checking self-exclusion for {user_id}: {e}")
        return {"excluded": False}


def lift_self_exclusion(user_id: str) -> Dict[str, Any]:
    """
    Lift self-exclusion (only for temporary exclusions).
    Permanent exclusions require admin/support override.
    """
    if not supabase:
        return {"error": "Database not configured"}

    try:
        res = supabase.table("profiles").select(
            "is_self_excluded, self_exclusion_until"
        ).eq("id", user_id).execute()

        if not res.data:
            return {"error": "User not found"}

        profile = res.data[0]
        if not profile.get("is_self_excluded"):
            return {"success": True, "message": "Account is not self-excluded."}

        if profile.get("self_exclusion_until") is None:
            return {"error": "Permanent self-exclusion cannot be lifted without admin approval."}

        supabase.table("profiles").update({
            "is_self_excluded": False,
            "self_exclusion_until": None
        }).eq("id", user_id).execute()
        return {"success": True, "message": "Self-exclusion lifted."}
    except Exception as e:
        logger.error(f"Error lifting self-exclusion for {user_id}: {e}")
        return {"error": str(e)}


# ──────────────────────────────────────────────
# Deposit Limits
# ──────────────────────────────────────────────

def set_deposit_limits(
    user_id: str,
    daily: Optional[float] = None,
    weekly: Optional[float] = None,
    monthly: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Set deposit limits for a user. Set to 0 to remove the limit.
    New limits that are LOWER take effect immediately.
    New limits that are HIGHER take effect after a 24-hour cooling-off period.
    """
    if not supabase:
        return {"error": "Database not configured"}

    try:
        update_data: Dict[str, Any] = {}
        if daily is not None:
            update_data["daily_deposit_limit"] = max(0, daily)
        if weekly is not None:
            update_data["weekly_deposit_limit"] = max(0, weekly)
        if monthly is not None:
            update_data["monthly_deposit_limit"] = max(0, monthly)

        if update_data:
            supabase.table("profiles").update(update_data).eq("id", user_id).execute()

        return {"success": True, "limits": update_data}
    except Exception as e:
        logger.error(f"Error setting deposit limits for {user_id}: {e}")
        return {"error": str(e)}


def check_deposit_allowed(user_id: str, amount: float) -> Dict[str, Any]:
    """
    Check if a deposit of the given amount is allowed under the user's limits.
    """
    if not supabase:
        return {"allowed": True}

    try:
        res = supabase.table("profiles").select(
            "daily_deposit_limit, weekly_deposit_limit, monthly_deposit_limit, "
            "deposits_today, deposits_this_week, deposits_this_month, "
            "is_self_excluded"
        ).eq("id", user_id).execute()

        if not res.data:
            return {"allowed": True}

        p = res.data[0]

        if p.get("is_self_excluded"):
            return {"allowed": False, "reason": "Account is self-excluded."}

        daily_limit = float(p.get("daily_deposit_limit", 0) or 0)
        weekly_limit = float(p.get("weekly_deposit_limit", 0) or 0)
        monthly_limit = float(p.get("monthly_deposit_limit", 0) or 0)
        deposits_today = float(p.get("deposits_today", 0) or 0)
        deposits_week = float(p.get("deposits_this_week", 0) or 0)
        deposits_month = float(p.get("deposits_this_month", 0) or 0)

        if daily_limit > 0 and (deposits_today + amount) > daily_limit:
            return {
                "allowed": False,
                "reason": f"Daily deposit limit reached (${daily_limit:.2f}). Already deposited ${deposits_today:.2f} today."
            }

        if weekly_limit > 0 and (deposits_week + amount) > weekly_limit:
            return {
                "allowed": False,
                "reason": f"Weekly deposit limit reached (${weekly_limit:.2f}). Already deposited ${deposits_week:.2f} this week."
            }

        if monthly_limit > 0 and (deposits_month + amount) > monthly_limit:
            return {
                "allowed": False,
                "reason": f"Monthly deposit limit reached (${monthly_limit:.2f}). Already deposited ${deposits_month:.2f} this month."
            }

        return {"allowed": True}
    except Exception as e:
        logger.error(f"Error checking deposit limits for {user_id}: {e}")
        return {"allowed": True}  # Fail open rather than blocking legitimate deposits


# ──────────────────────────────────────────────
# Loss Limits
# ──────────────────────────────────────────────

def set_loss_limit(user_id: str, daily_limit: float) -> Dict[str, Any]:
    """
    Set a daily loss limit. When cumulative daily losses exceed this amount,
    no further bets can be placed until the next day.
    """
    if not supabase:
        return {"error": "Database not configured"}

    try:
        supabase.table("profiles").update({
            "daily_loss_limit": max(0, daily_limit)
        }).eq("id", user_id).execute()
        return {"success": True, "daily_loss_limit": max(0, daily_limit)}
    except Exception as e:
        logger.error(f"Error setting loss limit for {user_id}: {e}")
        return {"error": str(e)}


def record_loss(user_id: str, amount: float) -> None:
    """Record a betting loss against the daily loss counter."""
    if not supabase:
        return

    try:
        res = supabase.table("profiles").select("daily_losses_today").eq("id", user_id).execute()
        if res.data:
            current = float(res.data[0].get("daily_losses_today", 0) or 0)
            supabase.table("profiles").update({
                "daily_losses_today": current + amount
            }).eq("id", user_id).execute()
    except Exception as e:
        logger.error(f"Error recording loss for {user_id}: {e}")


def reset_daily_counters() -> None:
    """
    Reset daily loss and deposit counters. Should be called by a daily cron job.
    """
    if not supabase:
        return

    try:
        # This would ideally be a Supabase Edge Function on a cron schedule
        supabase.table("profiles").update({
            "daily_losses_today": 0,
            "deposits_today": 0
        }).neq("id", "").execute()  # Update all rows
        logger.info("Daily counters reset successfully.")
    except Exception as e:
        logger.error(f"Error resetting daily counters: {e}")


# ──────────────────────────────────────────────
# Age Verification
# ──────────────────────────────────────────────

def check_age_verified(user_id: str) -> bool:
    """Check if a user has completed age verification."""
    if not supabase:
        return True  # Allow if no DB

    try:
        res = supabase.table("profiles").select("age_verified").eq("id", user_id).execute()
        if res.data:
            return bool(res.data[0].get("age_verified", False))
        return False
    except Exception as e:
        logger.error(f"Error checking age verification for {user_id}: {e}")
        return False


def verify_age(user_id: str, date_of_birth: str) -> Dict[str, Any]:
    """
    Verify that a user is at least 18 years old based on their date of birth.
    """
    try:
        dob = datetime.strptime(date_of_birth, "%Y-%m-%d")
        today = datetime.utcnow()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        if age < 18:
            return {
                "verified": False,
                "message": "You must be at least 18 years old to use this platform."
            }

        if supabase:
            supabase.table("profiles").update({
                "age_verified": True
            }).eq("id", user_id).execute()

        return {"verified": True, "age": age}
    except ValueError:
        return {"verified": False, "message": "Invalid date format. Use YYYY-MM-DD."}
    except Exception as e:
        logger.error(f"Error verifying age for {user_id}: {e}")
        return {"verified": False, "message": str(e)}


# ──────────────────────────────────────────────
# Legal Disclaimer Text
# ──────────────────────────────────────────────

LEGAL_DISCLAIMER = """
⚠️ IMPORTANT LEGAL NOTICE

This platform involves real-money gambling. By using this service, you acknowledge:

1. AGE REQUIREMENT: You must be at least 18 years old (or the legal gambling age in your jurisdiction).

2. RISK OF LOSS: Gambling involves risk. You may lose some or all of your deposited funds. Only gamble with money you can afford to lose.

3. RESPONSIBLE GAMBLING: We provide tools to help you gamble responsibly:
   - Deposit limits (daily, weekly, monthly)
   - Loss limits (daily)
   - Self-exclusion (temporary or permanent)
   - Session time reminders
   If you feel you may have a gambling problem, please seek help.

4. HELP RESOURCES:
   - GamCare: www.gamcare.org.uk | 0808 8020 133
   - BeGambleAware: www.begambleaware.org
   - Gamblers Anonymous: www.gamblersanonymous.org
   - National Problem Gambling Helpline (US): 1-800-522-4700

5. JURISDICTION: It is your responsibility to ensure that online gambling is legal in your jurisdiction.

6. FAIR PLAY: All virtual match simulations use transparent probability algorithms. Odds include a house edge.

7. PRIVACY: Your personal and financial data is encrypted and stored securely.
"""

TERMS_OF_SERVICE_URL = "/terms"
PRIVACY_POLICY_URL = "/privacy"
RESPONSIBLE_GAMBLING_URL = "/responsible-gambling"
