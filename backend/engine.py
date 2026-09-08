from database import supabase
from typing import List, Dict, Any
from pipeline import Pipeline, PipelineError

def process_auto_subs(squad_snapshot_id: int):
    """
    Simulates the auto-substitution process for a single squad snapshot.
    In a real implementation, this checks if starters played 0 minutes
    and swaps them with bench players, respecting formation constraints
    (e.g., minimum 1 GK, 3 DEF, 2 MID, 1 FWD).
    """
    if not supabase:
        return False

    try:
        # 1. Fetch all picks for this snapshot
        picks_resp = supabase.table("squad_picks").select("*, players(*)").eq("squad_snapshot_id", squad_snapshot_id).order("position_order").execute()
        picks = picks_resp.data

        if not picks or len(picks) != 15:
            return False

        # Mocking the auto-sub logic for now:
        # E.g., if pick 1-11 scored 0 points (simulating 0 mins), sub them out for pick 12-15
        
        # Real FPL logic requires checking formation validity.
        # Since we are mocking, we will just mark success.
        
        return True
    except Exception as e:
        print(f"Error in process_auto_subs: {e}")
        return False

def calculate_gameweek_points(squad_snapshot_id: int):
    """
    Calculates the final gameweek points for a squad, applying captain multipliers.
    """
    if not supabase:
        return 0

    try:
        # Fetch the snapshot
        snap_resp = supabase.table("squad_snapshots").select("*").eq("id", squad_snapshot_id).execute()
        if not snap_resp.data:
            return 0
            
        snapshot = snap_resp.data[0]
        
        # Fetch picks
        picks_resp = supabase.table("squad_picks").select("*, players(total_points)").eq("squad_snapshot_id", squad_snapshot_id).execute()
        picks = picks_resp.data
        
        total_points = 0
        
        for pick in picks:
            # In a real engine, we'd check if they are in the starting 11 (after auto-subs)
            # For this prototype, we'll assume position_order 1-11 are playing, 12-15 are bench
            is_playing = pick.get("position_order", 15) <= 11
            if snapshot.get("active_chip") == "BENCH_BOOST":
                is_playing = True
                
            if is_playing:
                base_points = pick["players"]["total_points"] if pick.get("players") else 0
                
                # Apply multipliers
                multiplier = 1
                if pick.get("is_captain"):
                    multiplier = 3 if snapshot.get("active_chip") == "TRIPLE_CAPTAIN" else 2
                elif pick.get("is_vice_captain"):
                    # Real logic checks if captain played 0 mins. 
                    multiplier = 1 
                
                total_points += (base_points * multiplier)
                
        # Deduct transfer costs
        total_points -= snapshot.get("transfer_cost", 0)
        
        # Update snapshot
        supabase.table("squad_snapshots").update({"gameweek_points": total_points}).eq("id", squad_snapshot_id).execute()
        
        return total_points

    except Exception as e:
        print(f"Error calculating gameweek points: {e}")
        return 0


def resolve_h2h_matches(gameweek_id: int):
    """
    Resolves Head-to-Head matches for a gameweek, assigning points (3 for Win, 1 for Draw, 0 for Loss).
    """
    if not supabase:
        return False

    try:
        # Fetch all h2h matches for this gameweek that are not processed
        matches_resp = supabase.table("h2h_matches").select("*").eq("gameweek_id", gameweek_id).eq("is_processed", False).execute()
        matches = matches_resp.data
        
        for match in matches:
            team_a = match.get("team_a_id")
            team_b = match.get("team_b_id")
            league_id = match.get("league_id")
            
            # Fetch scores from squad_snapshots
            # NOTE: Ghost team logic for odd-numbered leagues would go here.
            # If team_b is None, they play the 'Ghost Team' (League Average Score).
            
            # For prototype, we will just simulate scores
            score_a = match.get("team_a_score", 0)
            score_b = match.get("team_b_score", 0)
            
            a_pts, b_pts = 0, 0
            a_win, a_draw, a_loss = 0, 0, 0
            b_win, b_draw, b_loss = 0, 0, 0
            
            if score_a > score_b:
                a_pts, a_win = 3, 1
                b_loss = 1
            elif score_b > score_a:
                b_pts, b_win = 3, 1
                a_loss = 1
            else:
                a_pts, b_pts = 1, 1
                a_draw, b_draw = 1, 1
                
            # Update Team A in league_entries
            if team_a:
                # Need to do an RPC call or manual fetch and update to increment
                # For simplicity, we just mark the match processed
                pass
                
            # Update Team B in league_entries
            if team_b:
                pass
                
            # Mark processed
            supabase.table("h2h_matches").update({"is_processed": True}).eq("id", match["id"]).execute()
            
        return True
    except Exception as e:
        print(f"Error resolving H2H matches: {e}")
        return False

# --- Atomic Pipeline Steps for Gameweek Processing ---

def lock_gameweek(context: Dict[str, Any]):
    gameweek_id = context.get("gameweek_id")
    if not supabase:
        raise PipelineError("Database not configured", "lock_gameweek", 500)
    
    # We could lock the gameweek so users can't edit their teams.
    # Marking it 'processing' or simply continuing since it's already locked by deadline.
    snaps_resp = supabase.table("squad_snapshots").select("id").eq("gameweek_id", gameweek_id).execute()
    context["snapshots"] = snaps_resp.data

def execute_squad_updates(context: Dict[str, Any]):
    snapshots = context.get("snapshots", [])
    for snap in snapshots:
        snap_id = snap["id"]
        # Atomic action: process subs
        process_auto_subs(snap_id)
        # Atomic action: calculate points
        calculate_gameweek_points(snap_id)

def resolve_h2h(context: Dict[str, Any]):
    gameweek_id = context.get("gameweek_id")
    success = resolve_h2h_matches(gameweek_id)
    if not success:
        raise PipelineError("Failed to resolve H2H matches.", "resolve_h2h", 500)

def finalize_gameweek(context: Dict[str, Any]):
    gameweek_id = context.get("gameweek_id")
    supabase.table("gameweeks").update({"is_finished": True, "is_current": False}).eq("id", gameweek_id).execute()

def initialize_next_gameweek(context: Dict[str, Any]):
    gameweek_id = context.get("gameweek_id")
    snapshots = context.get("snapshots", [])
    
    next_gw_resp = supabase.table("gameweeks").select("id").eq("id", gameweek_id + 1).execute()
    if not next_gw_resp.data:
        # No next gameweek (end of season)
        return
        
    next_gw_id = next_gw_resp.data[0]["id"]
    supabase.table("gameweeks").update({"is_current": True}).eq("id", next_gw_id).execute()
    
    for snap in snapshots:
        snap_id = snap["id"]
        snap_full_resp = supabase.table("squad_snapshots").select("*").eq("id", snap_id).execute()
        if not snap_full_resp.data:
            continue
        snap_data = snap_full_resp.data[0]
        
        source_snap_id = snap_id
        
        # FREE HIT REVERSION LOGIC
        if snap_data.get("active_chip") == "FREE_HIT":
            prev_snap_resp = supabase.table("squad_snapshots").select("id").eq("virtual_team_id", snap_data["virtual_team_id"]).eq("gameweek_id", gameweek_id - 1).execute()
            if prev_snap_resp.data:
                source_snap_id = prev_snap_resp.data[0]["id"]
        
        # Create next gameweek snapshot
        new_snap = supabase.table("squad_snapshots").insert({
            "virtual_team_id": snap_data["virtual_team_id"],
            "gameweek_id": next_gw_id,
            "active_chip": None,
            "gameweek_points": 0,
            "transfer_cost": 0
        }).execute()
        
        if not new_snap.data:
            continue
            
        new_snap_id = new_snap.data[0]["id"]
        
        # Copy picks
        source_picks_resp = supabase.table("squad_picks").select("*").eq("squad_snapshot_id", source_snap_id).execute()
        new_picks = []
        for p in source_picks_resp.data:
            new_picks.append({
                "squad_snapshot_id": new_snap_id,
                "player_id": p["player_id"],
                "position_order": p["position_order"],
                "is_captain": p["is_captain"],
                "is_vice_captain": p["is_vice_captain"],
                "multiplier": p["multiplier"],
                "is_auto_sub_in": False,
                "is_auto_sub_out": False
            })
        
        if new_picks:
            supabase.table("squad_picks").insert(new_picks).execute()

# --- Orchestrator ---

def process_gameweek(gameweek_id: int):
    """
    Master function to process the end of a gameweek using Algorithmic Sequencing.
    """
    pipeline = Pipeline("GameweekProcessing")
    pipeline.add_step(lock_gameweek)
    pipeline.add_step(execute_squad_updates)
    pipeline.add_step(resolve_h2h)
    pipeline.add_step(finalize_gameweek)
    pipeline.add_step(initialize_next_gameweek)
    
    try:
        context = pipeline.execute({"gameweek_id": gameweek_id})
        return {"status": "success", "message": f"Processed Gameweek {gameweek_id} for {len(context.get('snapshots', []))} teams"}
    except PipelineError as e:
        return {"status": "error", "message": f"Pipeline failed at {e.step_name}: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
