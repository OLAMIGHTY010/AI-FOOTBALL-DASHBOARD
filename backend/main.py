from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import random
import random
import string
import scraper
import requests
import os
import hmac
import hashlib
import json
from database import supabase
# from fpl_uefa import refresh_uefa_teams_cache
from data import VIRTUAL_TEAMS
from data_basketball import VIRTUAL_BASKETBALL_TEAMS
from simulation import generate_fixtures, simulate_match, check_bet_result, calculate_all_odds
from simulation_basketball import generate_basketball_fixtures, simulate_basketball_match
from data_tennis import VIRTUAL_TENNIS_PLAYERS
from simulation_tennis import generate_tennis_fixtures, simulate_tennis_match
from ut import open_pack, PACKS, get_sell_value
from tactics import get_tactics_data, FORMATIONS, TACTICAL_STYLES
from fpl import get_fpl_data, optimize_fpl_squad
from fpl_uefa import get_uefa_data, optimize_uefa_squad
from data_racing import get_random_runners, CARS
from simulation_racing import calculate_racing_odds, simulate_race
from fpl_proxy import (
    get_fpl_bootstrap, get_fpl_fixtures, get_fpl_league,
    get_fpl_entry, get_fpl_entry_history
)

app = FastAPI(title="AI Football Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8501"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory state
standings = {}
for league, teams in VIRTUAL_TEAMS.items():
    standings[league] = {}
    for team in teams.keys():
        standings[league][team] = {"P": 0, "W": 0, "D": 0, "L": 0, "GF": 0, "GA": 0, "GD": 0, "Pts": 0}

standings_basketball = {}
for league, teams in VIRTUAL_BASKETBALL_TEAMS.items():
    standings_basketball[league] = {}
    for team in teams.keys():
        standings_basketball[league][team] = {"P": 0, "W": 0, "L": 0, "PF": 0, "PA": 0, "PD": 0, "Pts": 0}

standings_tennis = {}
for league, players in VIRTUAL_TENNIS_PLAYERS.items():
    standings_tennis[league] = {}
    for player in players.keys():
        standings_tennis[league][player] = {"P": 0, "W": 0, "L": 0, "SetsW": 0, "SetsL": 0, "Pts": 0}

standings_racing = {"Global Leaderboard": {}}
for car in CARS:
    standings_racing["Global Leaderboard"][car["name"]] = {"P": 0, "W": 0, "Pts": 0}

current_fixtures = []
current_racing_fixtures = []


class BetRequest(BaseModel):
    match_id: str
    market: str
    odds: float
    wager: float


class SimulateRequest(BaseModel):
    fixture_ids: Optional[List[str]] = None
    sport: Optional[str] = "football"


class PackRequest(BaseModel):
    pack_type: Optional[str] = None
    pack_name: Optional[str] = None



class MarketListRequest(BaseModel):
    player: dict
    price: float
    seller_id: str

class MarketBuyRequest(BaseModel):
    listing_id: str
    buyer_id: str

class SBCSubmitRequest(BaseModel):
    players: List[dict]

class EvolveRequest(BaseModel):
    player: dict



class ParlayRequest(BaseModel):
    legs: List[dict]
    wager: float
    user_id: Optional[str] = None

class UTRecommendRequest(BaseModel):
    club: List[dict] = []
    squad: List[dict] = []
    bankroll: float = 0.0

class FPLAnalyzeRequest(BaseModel):
    standings: dict

class FPLOptimizeRequest(BaseModel):
    budget: Optional[float] = 100.0
    max_per_team: Optional[int] = 3
    formation: Optional[str] = "3-4-3"

class UEFAOptimizeRequest(BaseModel):
    competition: str
    budget: Optional[float] = 100.0
    max_per_team: Optional[int] = 3
    formation: Optional[str] = "3-4-3"

@app.get("/api/teams")
def get_teams():
    return VIRTUAL_TEAMS


class LiveOddsRequest(BaseModel):
    home_power: int
    away_power: int
    home_goals: int
    away_goals: int
    minute: int

@app.post("/api/odds/live")
def get_live_odds(req: LiveOddsRequest):
    h_team = {"power": req.home_power}
    a_team = {"power": req.away_power}
    from simulation import calculate_live_odds
    return calculate_live_odds(h_team, a_team, req.home_goals, req.away_goals, req.minute)

@app.get("/api/fixtures")
def get_fixtures():
    global current_fixtures
    if not current_fixtures:
        current_fixtures = generate_fixtures()
    return current_fixtures


@app.post("/api/fixtures/new")
def new_fixtures():
    global current_fixtures
    current_fixtures = generate_fixtures()
    return current_fixtures

@app.get("/api/fixtures/basketball")
def get_basketball_fixtures():
    fixtures = generate_basketball_fixtures(VIRTUAL_BASKETBALL_TEAMS)
    return {"fixtures": fixtures}

@app.get("/api/fixtures/racing")
def get_racing_fixtures():
    global current_racing_fixtures
    if not current_racing_fixtures:
        runners = get_random_runners(8)
        runners = calculate_racing_odds(runners)
        current_racing_fixtures = [{
            "id": f"race_{uuid.uuid4().hex[:8]}",
            "name": "Virtual Grand Prix - 1000m Sprint",
            "runners": runners
        }]
    return {"fixtures": current_racing_fixtures}

@app.post("/api/simulate/racing")
def simulate_racing_match(req: SimulateRequest):
    global current_racing_fixtures
    if not current_racing_fixtures:
        runners = get_random_runners(8)
        runners = calculate_racing_odds(runners)
        current_racing_fixtures = [{
            "id": f"race_{uuid.uuid4().hex[:8]}",
            "name": "Virtual Grand Prix - 1000m Sprint",
            "runners": runners
        }]

    results = simulate_race(current_racing_fixtures[0]["runners"])
    
    # Update Racing Standings (Global Leaderboard)
    ls = standings_racing["Global Leaderboard"]
    for i, runner in enumerate(results["standings"]):
        name = runner["name"]
        if name not in ls:
            ls[name] = {"P": 0, "W": 0, "Pts": 0}
        
        ls[name]["P"] += 1
        if i == 0:
            ls[name]["W"] += 1
            ls[name]["Pts"] += 10
        elif i == 1:
            ls[name]["Pts"] += 5
        elif i == 2:
            ls[name]["Pts"] += 2
    
    # Inject fixture metadata so the frontend can display the race
    results["id"] = current_racing_fixtures[0]["id"]
    results["name"] = current_racing_fixtures[0]["name"]
    results["runners"] = current_racing_fixtures[0]["runners"]

    # Generate next race
    runners = get_random_runners(8)
    runners = calculate_racing_odds(runners)
    current_racing_fixtures = [{
        "id": f"race_{uuid.uuid4().hex[:8]}",
        "name": "Virtual Grand Prix - 1000m Sprint",
        "runners": runners
    }]
    
    return {"results": [results], "next_fixtures": current_racing_fixtures}

@app.post("/api/simulate/basketball")
def simulate_basketball_matches():
    fixtures = generate_basketball_fixtures(VIRTUAL_BASKETBALL_TEAMS)
    results = [simulate_basketball_match(f) for f in fixtures]

    for match_result in results:
        home = match_result["home"]
        away = match_result["away"]
        league = match_result["league"]
        h_name = home["name"]
        a_name = away["name"]
        
        if league in standings_basketball and h_name in standings_basketball[league] and a_name in standings_basketball[league]:
            ls = standings_basketball[league]
            ls[h_name]["P"] += 1
            ls[h_name]["PF"] += match_result["h_score"]
            ls[h_name]["PA"] += match_result["a_score"]
            ls[h_name]["PD"] = ls[h_name]["PF"] - ls[h_name]["PA"]
            
            ls[a_name]["P"] += 1
            ls[a_name]["PF"] += match_result["a_score"]
            ls[a_name]["PA"] += match_result["h_score"]
            ls[a_name]["PD"] = ls[a_name]["PF"] - ls[a_name]["PA"]
            
            if match_result["h_score"] > match_result["a_score"]:
                ls[h_name]["W"] += 1
                ls[h_name]["Pts"] += 2
                ls[a_name]["L"] += 1
            else:
                ls[a_name]["W"] += 1
                ls[a_name]["Pts"] += 2
                ls[h_name]["L"] += 1

    return {"results": results}

@app.get("/api/fixtures/tennis")
def get_tennis_fixtures():
    fixtures = generate_tennis_fixtures(VIRTUAL_TENNIS_PLAYERS)
    return {"fixtures": fixtures}

@app.post("/api/simulate/tennis")
def simulate_tennis_matches():
    fixtures = generate_tennis_fixtures(VIRTUAL_TENNIS_PLAYERS)
    results = [simulate_tennis_match(f) for f in fixtures]

    for match_result in results:
        home = match_result["home"]
        away = match_result["away"]
        league = home.get("league", "ATP") # Handle missing league if any
        h_name = home["name"]
        a_name = away["name"]

        if league in standings_tennis and h_name in standings_tennis[league] and a_name in standings_tennis[league]:
            ls = standings_tennis[league]
            ls[h_name]["P"] += 1
            ls[a_name]["P"] += 1

            if match_result["match_winner"] == "home":
                ls[h_name]["W"] += 1
                ls[h_name]["Pts"] += 10
                ls[h_name]["SetsW"] += 2
                ls[h_name]["SetsL"] += match_result["a_sets_won"]
                ls[a_name]["L"] += 1
                ls[a_name]["SetsW"] += match_result["a_sets_won"]
                ls[a_name]["SetsL"] += 2
            else:
                ls[a_name]["W"] += 1
                ls[a_name]["Pts"] += 10
                ls[a_name]["SetsW"] += 2
                ls[a_name]["SetsL"] += match_result["h_sets_won"]
                ls[h_name]["L"] += 1
                ls[h_name]["SetsW"] += match_result["h_sets_won"]
                ls[h_name]["SetsL"] += 2

    return {"results": results}


@app.get("/api/standings/{league}")
def get_standings(league: str, sport: str = "football"):
    s_dict = standings
    if sport == "basketball": s_dict = standings_basketball
    elif sport == "tennis": s_dict = standings_tennis
    elif sport == "racing": s_dict = standings_racing

    if league in s_dict:
        # Generic sort by Pts
        sorted_standings = dict(
            sorted(s_dict[league].items(), key=lambda x: x[1]["Pts"], reverse=True)
        )
        return sorted_standings
    return {}


@app.get("/api/standings")
def get_all_standings(sport: str = "football"):
    s_dict = standings
    if sport == "basketball": s_dict = standings_basketball
    elif sport == "tennis": s_dict = standings_tennis
    elif sport == "racing": s_dict = standings_racing

    result = {}
    for league in s_dict:
        result[league] = dict(
            sorted(s_dict[league].items(), key=lambda x: x[1]["Pts"], reverse=True)
        )
    return result


@app.post("/api/simulate")
def run_simulation(req: SimulateRequest):
    global current_fixtures, standings
    sport = req.sport
    selected_fixtures = current_fixtures if not req.fixture_ids else [f for f in current_fixtures if f["id"] in req.fixture_ids]
    
    if sport == "basketball":
        results = [simulate_basketball_match(f) for f in selected_fixtures]
        return {"sport": "basketball", "results": results}
        
    if sport == "tennis":
        results = [simulate_tennis_match(f) for f in selected_fixtures]
        return {"sport": "tennis", "results": results}
        
    if sport == "racing":
        return {"error": "Use /api/simulate/racing instead for racing"}

    if not current_fixtures:
        current_fixtures = generate_fixtures()

    results = []
    for fixture in current_fixtures:
        home = fixture["home"]
        away = fixture["away"]
        match_result = simulate_match(home, away, fixture.get("weather", "Sunny"))
        match_result["id"] = fixture["id"]
        match_result["odds"] = fixture["odds"]
        match_result["weather"] = fixture.get("weather", "Sunny")

        # Update standings
        league = home["league"]
        h_name = home["name"]
        a_name = away["name"]
        if league in standings and h_name in standings[league] and a_name in standings[league]:
            ls = standings[league]
            ls[h_name]["P"] += 1
            ls[h_name]["GF"] += match_result["h_goals"]
            ls[h_name]["GA"] += match_result["a_goals"]
            ls[h_name]["GD"] = ls[h_name]["GF"] - ls[h_name]["GA"]
            ls[a_name]["P"] += 1
            ls[a_name]["GF"] += match_result["a_goals"]
            ls[a_name]["GA"] += match_result["h_goals"]
            ls[a_name]["GD"] = ls[a_name]["GF"] - ls[a_name]["GA"]
            if match_result["h_goals"] > match_result["a_goals"]:
                ls[h_name]["W"] += 1
                ls[h_name]["Pts"] += 3
                ls[a_name]["L"] += 1
            elif match_result["h_goals"] < match_result["a_goals"]:
                ls[a_name]["W"] += 1
                ls[a_name]["Pts"] += 3
                ls[h_name]["L"] += 1
            else:
                ls[h_name]["D"] += 1
                ls[h_name]["Pts"] += 1
                ls[a_name]["D"] += 1
                ls[a_name]["Pts"] += 1

        results.append(match_result)
        
        # Evaluate pending bets for this match
        for bet in pending_virtual_bets:
            for leg in bet["legs"]:
                if leg["fixtureId"] == match_result["id"]:
                    # evaluate
                    won = check_bet_result(leg["market"], match_result)
                    leg["won"] = won

    # Settlement pass for all pending bets
    settled_this_round = []
    for bet in pending_virtual_bets[:]:
        all_resolved = True
        any_lost = False
        
        for leg in bet["legs"]:
            if "won" not in leg:
                all_resolved = False
            elif not leg["won"]:
                any_lost = True
        
        if any_lost or all_resolved:
            pending_virtual_bets.remove(bet)
            if any_lost:
                bet["status"] = "LOST"
            else:
                bet["status"] = "WON"
                # Add to wallet balance
                if bet.get("user_id") and supabase:
                    try:
                        wallet_res = supabase.table("profiles").select("bankroll").eq("id", bet["user_id"]).execute()
                        if wallet_res.data:
                            current_bal = float(wallet_res.data[0].get("bankroll", 0) or 0)
                            new_bal = current_bal + bet["potential_payout"]
                            supabase.table("profiles").update({"bankroll": new_bal}).eq("id", bet["user_id"]).execute()
                    except Exception as e:
                        print("Error updating wallet for bet:", e)
            settled_this_round.append(bet)
            settled_virtual_bets.append(bet)
            
            # Sync settlement to Supabase
            if supabase:
                try:
                    supabase.table("virtual_bets").update({
                        "status": bet["status"]
                    }).eq("id", bet["id"]).execute()
                except Exception as e:
                    print("Error updating bet status in Supabase:", e)

    # Generate Virtual Fixtures for other sports for next gameweek
    current_fixtures = generate_fixtures()

    return {"results": results, "next_fixtures": current_fixtures, "settled_bets": settled_this_round}



pending_virtual_bets = []
settled_virtual_bets = []

@app.post("/api/bet/parlay")
def place_parlay(req: ParlayRequest):
    combined_odds = 1.0
    for leg in req.legs:
        combined_odds *= leg.get("odds", 1.0)
    
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
    
    # Deduct wager from wallet
    if req.user_id and supabase:
        try:
            wallet_res = supabase.table("profiles").select("bankroll").eq("id", req.user_id).execute()
            if wallet_res.data:
                current_bal = float(wallet_res.data[0].get("bankroll", 0) or 0)
                new_bal = current_bal - req.wager
                supabase.table("profiles").update({"bankroll": new_bal}).eq("id", req.user_id).execute()
        except Exception as e:
            print("Error deducting wager:", e)

    pending_virtual_bets.append(bet_record)
    
    # Sync placement to Supabase
    if supabase:
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
            print("Error inserting bet into Supabase:", e)
    
    return bet_record

class CashOutRequest(BaseModel):
    bet_id: str
    cash_out_amount: float
    user_id: Optional[str] = None

@app.post("/api/bet/cashout")
def cashout_bet(req: CashOutRequest):
    global pending_virtual_bets, settled_virtual_bets
    bet_to_cashout = None
    for b in pending_virtual_bets:
        if b["id"] == req.bet_id:
            bet_to_cashout = b
            break
            
    if not bet_to_cashout:
        return {"error": "Bet not found or already settled"}
        
    pending_virtual_bets.remove(bet_to_cashout)
    bet_to_cashout["status"] = "CASH OUT"
    bet_to_cashout["potential_payout"] = req.cash_out_amount
    settled_virtual_bets.append(bet_to_cashout)
    
    # Add cash out amount to wallet
    if req.user_id and supabase:
        try:
            wallet_res = supabase.table("profiles").select("bankroll").eq("id", req.user_id).execute()
            if wallet_res.data:
                current_bal = float(wallet_res.data[0].get("bankroll", 0) or 0)
                new_bal = current_bal + req.cash_out_amount
                supabase.table("profiles").update({"bankroll": new_bal}).eq("id", req.user_id).execute()
        except Exception as e:
            print("Error adding cash out to wallet:", e)
            
    # Sync cashout to Supabase
    if supabase:
        try:
            supabase.table("virtual_bets").update({
                "status": "CASH OUT",
                "potential_payout": req.cash_out_amount
            }).eq("id", bet_to_cashout["id"]).execute()
        except Exception as e:
            print("Error updating cashout in Supabase:", e)
            
    return bet_to_cashout

@app.get("/api/bet/history")
def get_bet_history(user_id: str = None):
    # Retrieve pending and settled bets
    user_pending = [b for b in pending_virtual_bets if not user_id or b.get("user_id") == user_id]
    user_settled = [b for b in settled_virtual_bets if not user_id or b.get("user_id") == user_id]
    return {
        "pending": user_pending,
        "settled": user_settled
    }


@app.post("/api/bet/check")
def check_bet(bet: BetRequest):
    # This would normally look up a stored match result
    return {"market": bet.market, "status": "pending"}


# --- Ultimate Team Endpoints ---
@app.post("/api/ut/pack")
def open_ut_pack(req: Optional[PackRequest] = None):
    pack_name = "bronze"
    if req:
        if req.pack_type:
            pack_name = req.pack_type
        elif req.pack_name:
            pack_name = req.pack_name

    if pack_name not in PACKS:
        # Fallback if invalid pack name provided
        pack_name = "bronze"

    cards = open_pack(pack_name)
    return {
        "pack_name": pack_name,
        "pack_info": PACKS[pack_name],
        "cards": cards
    }


@app.post("/api/ut/recommend")
def recommend_transfer(req: UTRecommendRequest):
    # Filter out empty slots from squad
    valid_squad = [p for p in req.squad if p]
    
    # Analyze squad first, fallback to club if squad is empty
    target_players = valid_squad if valid_squad else req.club
    
    if not target_players:
        return {"success": False, "error": "Squad and Club are both empty."}

    # Find weakest player in the starting 11
    weakest = min(target_players, key=lambda x: x.get("rating", 99))
    target_pos = weakest.get("position")

    global transfer_market_listings
    # Find affordable upgrades in the market
    upgrades = []
    for listing in transfer_market_listings:
        p = listing["player"]
        price = listing["price"]
        if p.get("position") == target_pos and p.get("rating", 0) > weakest.get("rating", 0):
            if price <= req.bankroll:
                upgrades.append(listing)
            
    if not upgrades:
        return {"success": True, "weakest": weakest, "recommendation": None, "message": f"Your weakest link is {weakest['name']} (Rating: {weakest['rating']}), but no upgrades were found on the market for {target_pos}."}
        
    # Recommend the best value upgrade (rating / price)
    best_value = max(upgrades, key=lambda l: l["player"].get("rating", 0) / max(l["price"], 1))
    
    return {
        "success": True,
        "weakest": weakest,
        "recommendation": best_value,
        "message": f"Your weakest link is {weakest['name']}. We recommend buying {best_value['player']['name']} ({best_value['player']['rating']} OVR) for ${best_value['price']}."
    }


# --- Ultimate Team Transfer Market ---
# The transfer market has been completely migrated to PostgreSQL/Supabase!
# All logic for listing and buying is handled securely via the DB and RPC functions.

# --- Ultimate Team SBC ---
@app.post("/api/ut/sbc/submit")
def submit_sbc(req: SBCSubmitRequest):
    if len(req.players) != 11:
        return {"success": False, "error": "SBC requires exactly 11 players."}
    
    # Calculate Team Rating
    avg_rating = sum(p.get("rating", 0) for p in req.players) / 11.0
    if avg_rating < 75:
        return {"success": False, "error": f"Squad rating too low (Required: 75+, Provided: {avg_rating:.1f})"}
    
    # Check max players from same club constraint (e.g. max 3)
    clubs = {}
    for p in req.players:
        team = p.get("team", "Unknown")
        clubs[team] = clubs.get(team, 0) + 1
        if clubs[team] > 3:
            return {"success": False, "error": "Max 3 players from the same club allowed."}
    
    # Give reward
    reward_cards = open_pack("gold")
    return {"success": True, "reward": reward_cards, "pack_name": "SBC Gold Reward"}

# --- Ultimate Team Evolutions ---
@app.post("/api/ut/evolve")
def evolve_player(req: EvolveRequest):
    p = req.player
    # Add +3 to rating
    p["rating"] = p.get("rating", 60) + 3
    p["name"] = p.get("name", "Player") + " 🌟"
    p["is_evolved"] = True
    # If silver/bronze and rating >= 80, bump rarity
    if p["rating"] >= 80 and p.get("rarity") in ["Bronze", "Silver"]:
        p["rarity"] = "Gold"
    return {"success": True, "player": p}
class UTSimulateRequest(BaseModel):
    squad: list
    user_id: Optional[str] = None
    tactics: Optional[dict] = None

@app.post("/api/ut/simulate_match")
def ut_simulate_match(req: UTSimulateRequest):
    # Base AI Team
    ai_team = {
        "name": "FC Nexus (AI)",
        "power": 82,
        "star": "AI Striker",
        "league": "Ultimate Team"
    }
    
    # Calculate User UT Team Power based on average rating
    valid_players = [p for p in req.squad if p]
    if not valid_players:
        return {"error": "Squad is empty"}
        
    avg_rating = sum(p.get("rating", 70) for p in valid_players) / len(valid_players)
    
    # Find star player (highest rating)
    star_player = max(valid_players, key=lambda x: x.get("rating", 70))
    
    user_team = {
        "name": "My Ultimate Team",
        "power": avg_rating,
        "star": star_player.get("name", "Star Player"),
        "league": "Ultimate Team"
    }
    
    # Load User Tactics directly from payload, or fallback to DB
    h_tactics = req.tactics
    if not h_tactics and req.user_id and supabase:
        try:
            res = supabase.table("user_tactics").select("*").eq("user_id", req.user_id).execute()
            if res.data:
                h_tactics = res.data[0]
        except Exception as e:
            print("Error loading tactics for UT match:", e)
            
    # Default AI Tactics
    a_tactics = {"formation": "4-4-2", "style": "Balanced"}
    
    from simulation import simulate_match
    match_result = simulate_match(user_team, ai_team, h_tactics=h_tactics, a_tactics=a_tactics)
    
    return {"success": True, "match": match_result}




# --- FPL Endpoints ---
@app.get("/api/fpl/data")
def get_fpl_player_data():
    return {"players": get_fpl_data()}


@app.post("/api/fpl/optimize")
def optimize_fpl(req: Optional[FPLOptimizeRequest] = None):
    budget = req.budget if req and req.budget is not None else 100.0
    max_per_team = req.max_per_team if req and req.max_per_team is not None else 3
    formation = req.formation if req and req.formation is not None else "3-4-3"
    result = optimize_fpl_squad(budget=budget, max_per_team=max_per_team, formation=formation)
    return result



@app.post("/api/fpl/analyze")
def fpl_analyze(req: FPLAnalyzeRequest):
    standings = req.standings
    if not standings:
        return {"success": False, "error": "No standings data provided."}
        
    # Analyze the standings dictionary
    # Assuming standings maps team_name to a dictionary of stats including 'Pts' and 'GD'
    teams = []
    for league, league_teams in standings.items():
        for t_name, t_stats in league_teams.items():
            teams.append({"name": t_name, "pts": t_stats.get("Pts", 0), "gd": t_stats.get("GD", 0)})
            
    if not teams:
        return {"success": False, "error": "Standings empty."}
        
    # Sort teams by points desc
    teams.sort(key=lambda x: (x["pts"], x["gd"]), reverse=True)
    
    top_team = teams[0]
    bottom_team = teams[-1]
    
    report = f"🎙️ **Pundit Report**: What a gameweek! **{top_team['name']}** is absolutely flying at the top with {top_team['pts']} points. They look unstoppable right now. On the other hand, serious questions need to be asked about **{bottom_team['name']}**. Rooted to the bottom with just {bottom_team['pts']} points... the manager's seat must be getting hot! They need a tactical rethink immediately."
    
    return {"success": True, "report": report}

# @app.post("/api/uefa/refresh-teams")
# def api_refresh_uefa_teams():
#     """
#     Forces a refresh of the UEFA Europa League and Conference League teams
#     from the API, ensuring they are up to date with the latest playoff results.
#     """
#     updated_clubs = refresh_uefa_teams_cache()
#     return {"success": True, "message": "UEFA teams updated successfully", "clubs": updated_clubs}


# --- UEFA Fantasy Endpoints ---
@app.get("/api/uefa/data")
def get_uefa_player_data(competition: str):
    data = get_uefa_data(competition)
    if not data:
        raise HTTPException(status_code=404, detail="Competition not found or no data")
    return {"players": data}

@app.post("/api/uefa/optimize")
def optimize_uefa(req: UEFAOptimizeRequest):
    budget = req.budget if req.budget is not None else 100.0
    max_per_team = req.max_per_team if req.max_per_team is not None else 3
    formation = req.formation if req.formation is not None else "3-4-3"
    result = optimize_uefa_squad(competition=req.competition, budget=budget, max_per_team=max_per_team, formation=formation)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# --- Tactics Endpoints ---
@app.get("/api/tactics")
def get_tactics():
    return get_tactics_data()

class TacticsSaveRequest(BaseModel):
    user_id: str
    formation: str
    style: str

@app.post("/api/tactics/save")
def save_tactics(req: TacticsSaveRequest):
    if not supabase:
        return {"error": "Database connection failed"}
    
    try:
        # Upsert user tactics
        res = supabase.table("user_tactics").upsert({
            "user_id": req.user_id,
            "formation": req.formation,
            "style": req.style,
            "updated_at": "now()"
        }).execute()
        return {"success": True}
    except Exception as e:
        print("Error saving tactics:", e)
        return {"error": str(e)}

@app.get("/api/tactics/load")
def load_tactics(user_id: str):
    if not supabase:
        return {"error": "Database connection failed"}
        
    try:
        res = supabase.table("user_tactics").select("*").eq("user_id", user_id).execute()
        if res.data:
            return res.data[0]
        return {} # No tactics saved yet
    except Exception as e:
        print("Error loading tactics:", e)
        return {"error": str(e)}

# --- PvP Multiplayer Endpoints ---
pvp_lobbies = {}

class CreateLobbyRequest(BaseModel):
    user_id: str
    username: str
    wager: float
    team_rating: int

class JoinLobbyRequest(BaseModel):
    lobby_id: str
    user_id: str
    username: str
    team_rating: int

@app.post("/api/pvp/create")
def create_pvp_lobby(req: CreateLobbyRequest):
    lobby_id = str(uuid.uuid4())
    pvp_lobbies[lobby_id] = {
        "id": lobby_id,
        "creator_id": req.user_id,
        "creator_name": req.username,
        "creator_rating": req.team_rating,
        "wager": req.wager,
        "status": "waiting",
        "result": None,
        "created_at": str(datetime.now()) if 'datetime' in globals() else ""
    }
    return {"lobby_id": lobby_id}

@app.get("/api/pvp/lobbies")
def get_pvp_lobbies():
    # Return all lobbies waiting for opponents
    return [l for l in pvp_lobbies.values() if l["status"] == "waiting"]

@app.post("/api/pvp/join")
def join_pvp_lobby(req: JoinLobbyRequest):
    lobby_id = req.lobby_id
    if lobby_id not in pvp_lobbies:
        raise HTTPException(status_code=404, detail="Lobby not found")
    
    lobby = pvp_lobbies[lobby_id]
    if lobby["status"] != "waiting":
        raise HTTPException(status_code=400, detail="Lobby already closed")
    
    # Simulate match
    # Baseline chance based on ratings
    creator_chance = lobby["creator_rating"] / (lobby["creator_rating"] + req.team_rating)
    roll = random.random()
    
    winner = "creator" if roll <= creator_chance else "joiner"
    
    # 20% chance of draw if teams are within 5 rating of each other
    if abs(lobby["creator_rating"] - req.team_rating) <= 5 and random.random() < 0.2:
        winner = "draw"

    wager = lobby["wager"]
    total_pot = wager * 2
    
    if winner == "draw":
        # Draw returns original wager to both
        payout = wager
    else:
        # 10% company fee taken from the total pot
        house_fee = total_pot * 0.10
        payout = total_pot - house_fee

    lobby["status"] = "resolved"
    lobby["joiner_id"] = req.user_id
    lobby["joiner_name"] = req.username
    lobby["joiner_rating"] = req.team_rating
    
    lobby["result"] = {
        "winner": winner,
        "payout": payout,
        "creator_chance_percent": round(creator_chance * 100, 1)
    }

    return lobby

@app.get("/api/pvp/status/{lobby_id}")
def get_pvp_status(lobby_id: str):
    if lobby_id not in pvp_lobbies:
        raise HTTPException(status_code=404, detail="Lobby not found")
    return pvp_lobbies[lobby_id]

# --- Real-World Standings Endpoint ---
@app.get("/api/real-standings")
def get_real_standings():
    return scraper.get_real_standings()

# --- Official FPL API Endpoints ---
@app.get("/api/fpl/bootstrap")
def fpl_bootstrap():
    return get_fpl_bootstrap()

@app.get("/api/fpl/fixtures")
def fpl_fixtures():
    return get_fpl_fixtures()

@app.get("/api/fpl/league/{league_id}")
def fpl_league(league_id: int):
    return get_fpl_league(league_id)

@app.get("/api/fpl/entry/{entry_id}")
def fpl_entry(entry_id: int):
    return get_fpl_entry(entry_id)

@app.get("/api/fpl/entry/{entry_id}/history")
def fpl_entry_history(entry_id: int):
    return get_fpl_entry_history(entry_id)

# --- Real Supabase Endpoints ---
class CreateLeagueRequest(BaseModel):
    name: str
    type: str = "CLASSIC"
    privacy: str = "PRIVATE"
    admin_team_id: Optional[int] = None

@app.post("/api/v1/leagues")
def create_league(req: CreateLeagueRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    invite_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    try:
        data, count = supabase.table("leagues").insert({
            "name": req.name,
            "type": req.type,
            "privacy": req.privacy,
            "admin_team_id": req.admin_team_id,
            "invite_code": invite_code,
            "start_gameweek_id": 1
        }).execute()
        return {"success": True, "league": data[1][0] if len(data) > 1 and len(data[1]) > 0 else None, "invite_code": invite_code}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/leagues/{league_id}")
def get_league(league_id: int):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    try:
        response = supabase.table("leagues").select("*").eq("id", league_id).execute()
        if len(response.data) == 0:
            raise HTTPException(status_code=404, detail="League not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Squad Management Endpoints ---

class TransferRequest(BaseModel):
    gameweek_id: int
    transfers_in: List[int]
    transfers_out: List[int]
    wildcard_active: bool = False

class Pick(BaseModel):
    player_id: int
    position_order: int
    is_captain: bool = False
    is_vice_captain: bool = False

class LineupRequest(BaseModel):
    gameweek_id: int
    picks: List[Pick]

@app.get("/api/v1/team/{team_id}")
def get_team(team_id: int):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        response = supabase.table("virtual_teams").select("*").eq("id", team_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Team not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/team/{team_id}/squad/{gameweek_id}")
def get_squad(team_id: int, gameweek_id: int):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        # Get squad snapshot
        snap_resp = supabase.table("squad_snapshots").select("id, active_chip, gameweek_points, transfer_cost").eq("virtual_team_id", team_id).eq("gameweek_id", gameweek_id).execute()
        if not snap_resp.data:
            return {"picks": []} # No squad for this gameweek
        
        snapshot_id = snap_resp.data[0]["id"]
        
        # Get picks
        picks_resp = supabase.table("squad_picks").select("*, players(*)").eq("squad_snapshot_id", snapshot_id).order("position_order").execute()
        
        return {
            "snapshot": snap_resp.data[0],
            "picks": picks_resp.data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/team/{team_id}/transfers")
def submit_transfers(team_id: int, req: TransferRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        # In a real implementation, you would:
        # 1. Fetch current team budget and free transfers
        # 2. Fetch prices of players in and out
        # 3. Validate budget constraint
        # 4. Calculate point deductions (-4 per extra transfer) if wildcard not active
        # 5. Update team balance and available transfers
        # 6. Update squad_snapshots and squad_picks
        # For this prototype, we'll just mock a success response.
        return {"success": True, "message": f"Processed {len(req.transfers_in)} transfers for Gameweek {req.gameweek_id}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/v1/team/{team_id}/lineup")
def save_lineup(team_id: int, req: LineupRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        # In a real implementation, you would:
        # 1. Validate exactly 11 starters (position_order 1-11) and 4 bench (12-15)
        # 2. Validate formation constraints (min 3 DEF, min 2 MID, min 1 FWD, 1 GK starting)
        # 3. Validate exactly 1 captain and 1 vice-captain
        # 4. Fetch squad_snapshot_id for this team_id and gameweek_id
        # 5. Update/Upsert squad_picks with the new order and captaincy
        # For this prototype, we'll mock success.
        return {"success": True, "message": "Lineup saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class CheckoutRequest(BaseModel):
    user_id: str
    email: str
    product_id: str
    amount: int  # in Kobo

@app.post("/api/checkout")
def create_paystack_checkout(req: CheckoutRequest):
    PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET_KEY", "")
    if not PAYSTACK_SECRET:
        raise HTTPException(status_code=500, detail="Paystack secret key not configured")
        
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET}",
        "Content-Type": "application/json"
    }
    
    # Store user_id and product_id in metadata so webhook knows what to credit
    payload = {
        "email": req.email,
        "amount": req.amount,
        "metadata": {
            "user_id": req.user_id,
            "product_id": req.product_id
        },
        "callback_url": "http://localhost:3000/dashboard/store?success=true",
        "cancel_url": "http://localhost:3000/dashboard/store?canceled=true"
    }
    
    res = requests.post("https://api.paystack.co/transaction/initialize", json=payload, headers=headers)
    if res.status_code == 200:
        return res.json().get("data", {})
    else:
        raise HTTPException(status_code=400, detail=res.text)

@app.post("/api/webhook/paystack")
async def paystack_webhook(request: Request, background_tasks: BackgroundTasks):
    PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET_KEY", "")
    signature = request.headers.get("x-paystack-signature")
    body = await request.body()
    
    # Verify signature
    hash_obj = hmac.new(PAYSTACK_SECRET.encode('utf-8'), body, hashlib.sha512)
    expected_sig = hash_obj.hexdigest()
    
    if not signature or signature != expected_sig:
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    event = json.loads(body)
    
    if event.get("event") == "charge.success":
        data = event.get("data", {})
        metadata = data.get("metadata", {})
        user_id = metadata.get("user_id")
        product_id = metadata.get("product_id")
        
        if user_id and product_id and supabase:
            # Credit logic
            def process_credit():
                try:
                    if product_id == "vip_sub":
                        supabase.table("profiles").update({"is_vip": True}).eq("id", user_id).execute()
                    else:
                        coins_map = {
                            "pack_5k": 5000,
                            "pack_25k": 25000,
                            "pack_100k": 100000
                        }
                        coins_to_add = coins_map.get(product_id, 0)
                        if coins_to_add > 0:
                            wallet_res = supabase.table("profiles").select("bankroll").eq("id", user_id).execute()
                            if wallet_res.data:
                                current_bal = float(wallet_res.data[0].get("bankroll", 0) or 0)
                                new_bal = current_bal + coins_to_add
                                supabase.table("profiles").update({"bankroll": new_bal}).eq("id", user_id).execute()
                except Exception as e:
                    print("Error crediting paystack webhook:", e)
                    
            background_tasks.add_task(process_credit)
            
    return {"status": "success"}
