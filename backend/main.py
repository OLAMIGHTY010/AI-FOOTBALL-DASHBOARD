from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import random
import random
import string
import scraper
from database import supabase
import engine
from auth import get_current_user
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
from data_racing import get_random_runners
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

class UTRecommendRequest(BaseModel):
    club: List[dict]

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
            "name": "Virtual Derby - 1000m Sprint",
            "runners": runners
        }]
    return {"fixtures": current_racing_fixtures}

@app.post("/api/simulate/racing")
def simulate_racing_match(req: SimulateRequest):
    global current_racing_fixtures
    if not current_racing_fixtures:
        return {"results": []}
    
    race = current_racing_fixtures[0]
    results = simulate_race(race.get("runners", []))
    
    # Generate next race
    runners = get_random_runners(8)
    runners = calculate_racing_odds(runners)
    current_racing_fixtures = [{
        "id": f"race_{uuid.uuid4().hex[:8]}",
        "name": "Virtual Derby - 1000m Sprint",
        "runners": runners
    }]
    
    return {"results": [results], "next_fixtures": current_racing_fixtures}

@app.post("/api/simulate/basketball")
def simulate_basketball_matches():
    fixtures = generate_basketball_fixtures(VIRTUAL_BASKETBALL_TEAMS)
    results = [simulate_basketball_match(f) for f in fixtures]
    return {"results": results}

@app.get("/api/fixtures/tennis")
def get_tennis_fixtures():
    fixtures = generate_tennis_fixtures(VIRTUAL_TENNIS_PLAYERS)
    return {"fixtures": fixtures}

@app.post("/api/simulate/tennis")
def simulate_tennis_matches():
    fixtures = generate_tennis_fixtures(VIRTUAL_TENNIS_PLAYERS)
    results = [simulate_tennis_match(f) for f in fixtures]
    return {"results": results}


@app.get("/api/standings/{league}")
def get_standings(league: str):
    if league in standings:
        sorted_standings = dict(
            sorted(standings[league].items(), key=lambda x: (x[1]["Pts"], x[1]["GD"], x[1]["GF"]), reverse=True)
        )
        return sorted_standings
    return {}


@app.get("/api/standings")
def get_all_standings():
    result = {}
    for league in standings:
        result[league] = dict(
            sorted(standings[league].items(), key=lambda x: (x[1]["Pts"], x[1]["GD"], x[1]["GF"]), reverse=True)
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

    # Generate Virtual Fixtures for other sports for next gameweek
    current_fixtures = generate_fixtures()

    return {"results": results, "next_fixtures": current_fixtures}



@app.post("/api/bet/parlay")
def place_parlay(req: ParlayRequest):
    # Calculate combined odds
    combined_odds = 1.0
    for leg in req.legs:
        combined_odds *= leg.get("odds", 1.0)
    
    # In reality, this would just be stored as pending
    return {
        "status": "pending",
        "combined_odds": round(combined_odds, 2),
        "potential_payout": round(req.wager * combined_odds, 2),
        "legs": req.legs
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
    club = req.club
    if not club:
        return {"success": False, "error": "Club is empty."}
        
    # Find weakest player
    weakest = min(club, key=lambda x: x.get("rating", 99))
    target_pos = weakest.get("position")
    
    global transfer_market_listings
    # Find affordable upgrades in the market
    upgrades = []
    for listing in transfer_market_listings:
        p = listing["player"]
        if p.get("position") == target_pos and p.get("rating", 0) > weakest.get("rating", 0):
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
transfer_market_listings = []

@app.get("/api/ut/market")
def get_market():
    return {"listings": transfer_market_listings}

@app.post("/api/ut/market/list")
def list_on_market(req: MarketListRequest):
    listing_id = str(uuid.uuid4())
    listing = {
        "id": listing_id,
        "player": req.player,
        "price": req.price,
        "seller_id": req.seller_id,
        "listed_at": str(datetime.now())
    }
    transfer_market_listings.append(listing)
    return {"success": True, "listing": listing}

@app.post("/api/ut/market/buy")
def buy_from_market(req: MarketBuyRequest):
    global transfer_market_listings
    for listing in transfer_market_listings:
        if listing["id"] == req.listing_id:
            # Here we just remove it from the market. 
            # The frontend deducts balance and adds to club.
            transfer_market_listings = [l for l in transfer_market_listings if l["id"] != req.listing_id]
            return {"success": True, "player": listing["player"], "seller_id": listing["seller_id"], "price": listing["price"]}
    raise HTTPException(status_code=404, detail="Listing not found or already sold")

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

# --- League Management Endpoints ---
class CreateLeagueRequest(BaseModel):
    name: str
    type: str = "CLASSIC"
    privacy: str = "PRIVATE"

class JoinLeagueRequest(BaseModel):
    invite_code: str

def get_user_team_id(user):
    fpl_user_resp = supabase.table("fpl_users").select("id").eq("auth_id", user.id).execute()
    if not fpl_user_resp.data:
        raise HTTPException(status_code=404, detail="No user found")
    team_resp = supabase.table("virtual_teams").select("id").eq("user_id", fpl_user_resp.data[0]["id"]).execute()
    if not team_resp.data:
        raise HTTPException(status_code=404, detail="No virtual team found")
    return team_resp.data[0]["id"]

@app.post("/api/v1/leagues")
def create_league(req: CreateLeagueRequest, user = Depends(get_current_user)):
    team_id = get_user_team_id(user)
    invite_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    try:
        # 1. Create League
        res = supabase.table("leagues").insert({
            "name": req.name,
            "type": req.type,
            "privacy": req.privacy,
            "admin_team_id": team_id,
            "invite_code": invite_code,
            "start_gameweek_id": 1
        }).execute()
        
        league = res.data[0]
        
        # 2. Add creator to league_entries
        supabase.table("league_entries").insert({
            "league_id": league["id"],
            "virtual_team_id": team_id
        }).execute()
        
        return {"success": True, "league": league, "invite_code": invite_code}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/leagues/join")
def join_league(req: JoinLeagueRequest, user = Depends(get_current_user)):
    team_id = get_user_team_id(user)
    
    try:
        # 1. Find League by invite_code
        league_resp = supabase.table("leagues").select("*").eq("invite_code", req.invite_code).execute()
        if not league_resp.data:
            raise HTTPException(status_code=404, detail="Invalid invite code")
        
        league = league_resp.data[0]
        
        # 2. Check if already in league
        entry_resp = supabase.table("league_entries").select("*").eq("league_id", league["id"]).eq("virtual_team_id", team_id).execute()
        if entry_resp.data:
            raise HTTPException(status_code=400, detail="Already a member of this league")
            
        # 3. Add to league
        supabase.table("league_entries").insert({
            "league_id": league["id"],
            "virtual_team_id": team_id
        }).execute()
        
        return {"success": True, "league": league}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/team/me/leagues")
def get_my_leagues(user = Depends(get_current_user)):
    team_id = get_user_team_id(user)
    try:
        # Join league_entries with leagues
        res = supabase.table("league_entries").select("*, leagues(*)").eq("virtual_team_id", team_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/leagues/{league_id}")
def get_league(league_id: int, user = Depends(get_current_user)):
    try:
        league_resp = supabase.table("leagues").select("*").eq("id", league_id).execute()
        if not league_resp.data:
            raise HTTPException(status_code=404, detail="League not found")
            
        league = league_resp.data[0]
        
        # Get standings by joining league_entries with virtual_teams and fpl_users
        standings_resp = supabase.table("league_entries").select(
            "*, virtual_teams(id, name, fpl_users(username))"
        ).eq("league_id", league_id).execute()
        
        standings = standings_resp.data
        # Sort standings depending on league type
        if league["type"] == "CLASSIC":
            standings.sort(key=lambda x: x["total_points"], reverse=True)
        elif league["type"] == "H2H":
            standings.sort(key=lambda x: (x["h2h_points"], x["total_points"]), reverse=True)
            
        return {
            "league": league,
            "standings": standings
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/leagues/{league_id}/generate-fixtures")
def generate_fixtures(league_id: int, user = Depends(get_current_user)):
    try:
        # Get league
        league_resp = supabase.table("leagues").select("*").eq("id", league_id).execute()
        if not league_resp.data:
            raise HTTPException(status_code=404, detail="League not found")
        league = league_resp.data[0]
        
        if league["type"] != "H2H":
            raise HTTPException(status_code=400, detail="Only H2H leagues have fixture generation")
            
        # Get user's team to verify admin
        fpl_user_resp = supabase.table("fpl_users").select("id").eq("auth_id", user.id).execute()
        if not fpl_user_resp.data:
            raise HTTPException(status_code=404, detail="User not found")
        fpl_user_id = fpl_user_resp.data[0]["id"]
        
        team_resp = supabase.table("virtual_teams").select("id").eq("user_id", fpl_user_id).execute()
        if not team_resp.data:
            raise HTTPException(status_code=404, detail="Team not found")
        team_id = team_resp.data[0]["id"]
        
        if league["admin_team_id"] != team_id:
            raise HTTPException(status_code=403, detail="Only the league admin can generate fixtures")
            
        # Check if already generated
        matches_resp = supabase.table("h2h_matches").select("id").eq("league_id", league_id).limit(1).execute()
        if matches_resp.data and len(matches_resp.data) > 0:
            raise HTTPException(status_code=400, detail="Fixtures have already been generated for this league")
            
        # Get entries
        entries_resp = supabase.table("league_entries").select("virtual_team_id").eq("league_id", league_id).execute()
        team_ids = [e["virtual_team_id"] for e in entries_resp.data]
        
        if len(team_ids) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 teams to generate fixtures")
            
        if len(team_ids) % 2 != 0:
            raise HTTPException(status_code=400, detail="Need an even number of teams to generate fixtures (no ghost teams allowed)")
            
        start_gw = league["start_gameweek_id"] or 1
        total_gws = 38 - start_gw + 1
        
        # Circle Method algorithm
        n = len(team_ids)
        fixed = team_ids[0]
        rotating = team_ids[1:]
        rounds = n - 1
        
        matches_to_insert = []
        for gw_offset in range(total_gws):
            round_idx = gw_offset % rounds
            gw_id = start_gw + gw_offset
            
            # Rotate
            current_rotating = rotating[-round_idx:] + rotating[:-round_idx]
            
            # Match 1
            if round_idx % 2 == 0:
                matches_to_insert.append({"league_id": league_id, "gameweek_id": gw_id, "team_a_id": fixed, "team_b_id": current_rotating[0]})
            else:
                matches_to_insert.append({"league_id": league_id, "gameweek_id": gw_id, "team_a_id": current_rotating[0], "team_b_id": fixed})
                
            # Other matches
            for i in range(1, n // 2):
                t1 = current_rotating[i]
                t2 = current_rotating[n - 1 - i]
                if round_idx % 2 == 0:
                    matches_to_insert.append({"league_id": league_id, "gameweek_id": gw_id, "team_a_id": t1, "team_b_id": t2})
                else:
                    matches_to_insert.append({"league_id": league_id, "gameweek_id": gw_id, "team_a_id": t2, "team_b_id": t1})
                    
        supabase.table("h2h_matches").insert(matches_to_insert).execute()
        return {"success": True, "message": f"Generated {len(matches_to_insert)} matches"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/leagues/{league_id}/fixtures")
def get_league_fixtures(league_id: int):
    try:
        # Join with virtual_teams to get team names
        matches_resp = supabase.table("h2h_matches").select(
            "*, team_a:team_a_id(id, name), team_b:team_b_id(id, name)"
        ).eq("league_id", league_id).order("gameweek_id").execute()
        
        return matches_resp.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Squad Management Endpoints ---

class TeamCreateRequest(BaseModel):
    team_name: str

@app.get("/api/v1/team/me")
def get_my_team(user = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        fpl_user_resp = supabase.table("fpl_users").select("*").eq("auth_id", user.id).execute()
        if not fpl_user_resp.data:
            raise HTTPException(status_code=404, detail="No team found for user")
        
        fpl_user_id = fpl_user_resp.data[0]["id"]
        team_resp = supabase.table("virtual_teams").select("*").eq("user_id", fpl_user_id).execute()
        if not team_resp.data:
            raise HTTPException(status_code=404, detail="No virtual team found")
            
        return team_resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/team/create")
def create_my_team(req: TeamCreateRequest, user = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        fpl_user_resp = supabase.table("fpl_users").select("*").eq("auth_id", user.id).execute()
        
        if not fpl_user_resp.data:
            username = user.email.split("@")[0] + "_" + user.id[:4] if user.email else "user_" + user.id[:8]
            new_user = {
                "auth_id": user.id,
                "email": user.email or f"{user.id}@placeholder.com",
                "username": username
            }
            res = supabase.table("fpl_users").insert(new_user).execute()
            fpl_user_id = res.data[0]["id"]
        else:
            fpl_user_id = fpl_user_resp.data[0]["id"]
            
        team_resp = supabase.table("virtual_teams").select("*").eq("user_id", fpl_user_id).execute()
        if team_resp.data:
            raise HTTPException(status_code=400, detail="User already has a team")
            
        new_team = {
            "user_id": fpl_user_id,
            "name": req.team_name,
            "bank_balance": 100.0,
            "free_transfers": 1,
            "total_points": 0
        }
        create_res = supabase.table("virtual_teams").insert(new_team).execute()
        return create_res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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

def verify_team_ownership(team_id: int, user):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        # Fetch team and join with fpl_users to get the auth_id (UUID)
        response = supabase.table("virtual_teams").select("*, fpl_users(auth_id)").eq("id", team_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Team not found")
        
        team = response.data[0]
        fpl_user = team.get("fpl_users")
        
        # Verify Ownership
        if not fpl_user or fpl_user.get("auth_id") != user.id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not own this team")
            
        return team
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/team/{team_id}")
def get_team(team_id: int, user = Depends(get_current_user)):
    team = verify_team_ownership(team_id, user)
    return team

@app.get("/api/v1/team/{team_id}/squad/{gameweek_id}")
def get_squad(team_id: int, gameweek_id: int, user = Depends(get_current_user)):
    verify_team_ownership(team_id, user)
    
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

@app.get("/api/v1/team/{team_id}/h2h-matchup/{gameweek_id}")
def get_live_h2h_matchup(team_id: int, gameweek_id: int, user = Depends(get_current_user)):
    verify_team_ownership(team_id, user)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    try:
        # Fetch the matchup for this team and gameweek
        # A team can be either team_a or team_b
        # Note: supabase Python client doesn't support complex OR filters easily via standard eq().
        # We can fetch both and combine, or just fetch where gameweek_id = X and filter in Python since it's small.
        # But wait, there is `.or_("team_a_id.eq.X,team_b_id.eq.X")` if using postgrest syntax!
        
        matches_resp = supabase.table("h2h_matches").select(
            "*, team_a:team_a_id(id, name), team_b:team_b_id(id, name)"
        ).eq("gameweek_id", gameweek_id).or_(f"team_a_id.eq.{team_id},team_b_id.eq.{team_id}").execute()
        
        if not matches_resp.data:
            return {"matchup": None}
            
        match = matches_resp.data[0]
        
        # Calculate live simulated score for team_a
        # Fetch snapshot for team_a
        snap_a = supabase.table("squad_snapshots").select("gameweek_points, transfer_cost").eq("virtual_team_id", match["team_a_id"]).eq("gameweek_id", gameweek_id).execute()
        pts_a = snap_a.data[0]["gameweek_points"] if snap_a.data else 0
        hits_a = snap_a.data[0]["transfer_cost"] if snap_a.data else 0
        live_a = pts_a - hits_a
        
        # Calculate live simulated score for team_b
        snap_b = supabase.table("squad_snapshots").select("gameweek_points, transfer_cost").eq("virtual_team_id", match["team_b_id"]).eq("gameweek_id", gameweek_id).execute()
        pts_b = snap_b.data[0]["gameweek_points"] if snap_b.data else 0
        hits_b = snap_b.data[0]["transfer_cost"] if snap_b.data else 0
        live_b = pts_b - hits_b
        
        match["live_score_a"] = live_a
        match["live_score_b"] = live_b
        
        return {"matchup": match}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/players/{player_id}/profile")
def get_player_profile(player_id: int, user = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    try:
        player_resp = supabase.table("players").select("*, real_teams(name, short_name)").eq("id", player_id).execute()
        if not player_resp.data:
            raise HTTPException(status_code=404, detail="Player not found")
            
        player = player_resp.data[0]
        
        # Mock 5-week form (historical points)
        import random
        recent_form = [random.randint(0, 12) for _ in range(5)]
        
        # Mock next 5 fixtures (FDR)
        fdr_opponents = ["ARS (A)", "SHU (H)", "MCI (A)", "LIV (H)", "LUT (A)"]
        fixtures = [{"opp": opp, "fdr": random.randint(1, 5)} for opp in fdr_opponents]
        
        # AI Scouting Report
        adjectives = ["electric", "inconsistent", "reliable", "explosive", "under-the-radar"]
        ai_report = f"The AI analysis engine highlights {player['last_name']} as an {random.choice(adjectives)} asset. "
        
        avg_form = sum(recent_form) / 5.0
        if avg_form > 6.0:
            ai_report += "Currently in spectacular form, they are a must-own for managers looking to climb the ranks."
        elif avg_form > 3.0:
            ai_report += "Returning decent points, but upcoming fixtures dictate careful monitoring before a transfer."
        else:
            ai_report += "Struggling to find the net recently. Only consider if you are looking for a differential."
            
        return {
            "player": player,
            "form_history": recent_form,
            "fixtures": fixtures,
            "scouting_report": ai_report
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/market/simulate-fluctuations")
def simulate_market_fluctuations(user = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    try:
        # Fetch all players
        players_resp = supabase.table("players").select("id, current_price, selected_by_percent").execute()
        players = players_resp.data
        
        import random
        
        updates = []
        for p in players:
            ownership = float(p.get("selected_by_percent") or 0.0)
            old_price = float(p.get("current_price"))
            
            # Fluctuation logic
            price_change = 0.0
            
            # Heavy ownership implies lots of transfers in -> price rises
            if ownership > 15.0:
                if random.random() > 0.3: # 70% chance to rise
                    price_change = 0.1
            elif ownership > 5.0:
                if random.random() > 0.8: # 20% chance to rise
                    price_change = 0.1
            elif ownership < 2.0:
                if random.random() > 0.6: # 40% chance to drop
                    price_change = -0.1
            
            # Minor random volatility
            if price_change == 0.0 and random.random() > 0.95:
                price_change = random.choice([0.1, -0.1])
                
            new_price = old_price + price_change
            
            if price_change != 0.0:
                updates.append({
                    "id": p["id"],
                    "current_price": round(new_price, 1)
                })
                
        # Bulk update in Supabase (PostgREST upsert)
        if updates:
            supabase.table("players").upsert(updates).execute()
            
        return {"status": "success", "message": f"Market updated. {len(updates)} player prices changed."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class ChipRequest(BaseModel):
    gameweek_id: int
    chip_name: str # WILDCARD, FREE_HIT, TRIPLE_CAPTAIN, BENCH_BOOST

@app.post("/api/v1/team/{team_id}/activate-chip")
def activate_chip(team_id: int, req: ChipRequest, user = Depends(get_current_user)):
    verify_team_ownership(team_id, user)
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        # Check if chip already used this season
        used_resp = supabase.table("squad_snapshots").select("id").eq("virtual_team_id", team_id).eq("active_chip", req.chip_name).execute()
        if used_resp.data:
            raise HTTPException(status_code=400, detail=f"{req.chip_name} already played this season")
            
        # Update current gameweek snapshot
        snap_resp = supabase.table("squad_snapshots").select("id").eq("virtual_team_id", team_id).eq("gameweek_id", req.gameweek_id).execute()
        if not snap_resp.data:
            raise HTTPException(status_code=404, detail="Squad snapshot not found")
            
        supabase.table("squad_snapshots").update({"active_chip": req.chip_name}).eq("id", snap_resp.data[0]["id"]).execute()
        
        return {"success": True, "message": f"{req.chip_name} activated!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/team/{team_id}/transfers")
def submit_transfers(team_id: int, req: TransferRequest, user = Depends(get_current_user)):
    team = verify_team_ownership(team_id, user)
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        if len(req.transfers_in) != len(req.transfers_out):
            raise HTTPException(status_code=400, detail="Transfers in must match transfers out")
            
        num_transfers = len(req.transfers_in)
        if num_transfers == 0:
            return {"success": True, "message": "No transfers made"}
            
        # 1. Fetch current team budget and free transfers
        bank_balance = float(team.get("bank_balance", 0))
        free_transfers = team.get("free_transfers", 1)
        
        # 2. Fetch prices of players in and out
        players_in_resp = supabase.table("players").select("id, current_price").in_("id", req.transfers_in).execute()
        players_out_resp = supabase.table("players").select("id, current_price").in_("id", req.transfers_out).execute()
        
        in_map = {p["id"]: p["current_price"] for p in players_in_resp.data}
        out_map = {p["id"]: p["current_price"] for p in players_out_resp.data}
        
        if len(in_map) != num_transfers or len(out_map) != num_transfers:
            raise HTTPException(status_code=400, detail="Invalid player IDs provided")
            
        total_bought = sum(in_map.values())
        total_sold = sum(out_map.values())
        
        # 3. Validate budget constraint
        new_bank_balance = bank_balance + total_sold - total_bought
        if new_bank_balance < 0:
            raise HTTPException(status_code=400, detail=f"Insufficient funds. Short by {-new_bank_balance:.1f}m")
            
        # 4. Fetch snapshot to check active chip and update transfer cost
        snap_resp = supabase.table("squad_snapshots").select("id, transfer_cost, active_chip").eq("virtual_team_id", team_id).eq("gameweek_id", req.gameweek_id).execute()
        if not snap_resp.data:
            raise HTTPException(status_code=404, detail="Squad snapshot not found for this gameweek")
            
        snapshot = snap_resp.data[0]
        
        # Calculate point deductions
        transfer_cost = 0
        new_free_transfers = free_transfers
        is_wildcard_active = req.wildcard_active or snapshot.get("active_chip") in ["WILDCARD", "FREE_HIT"]
        
        if not is_wildcard_active:
            if num_transfers > free_transfers:
                transfer_cost = (num_transfers - free_transfers) * 4
                new_free_transfers = 0
            else:
                new_free_transfers -= num_transfers
        else:
            # If wildcard/free hit, transfers are free and next week gets 1 free transfer.
            # But we leave free_transfers as is for this prototype (or reset it to 1)
            transfer_cost = 0
            new_free_transfers = 1
                
        # 5. Update team balance and available transfers
        supabase.table("virtual_teams").update({
            "bank_balance": new_bank_balance,
            "free_transfers": new_free_transfers
        }).eq("id", team_id).execute()
        
        new_total_cost = snapshot.get("transfer_cost", 0) + transfer_cost
        
        # If wildcard/free hit is active, we completely reset transfer_cost for the gameweek to 0
        if is_wildcard_active:
            new_total_cost = 0
            
        supabase.table("squad_snapshots").update({
            "transfer_cost": new_total_cost
        }).eq("id", snapshot["id"]).execute()
        
        # Swap players in squad_picks
        picks_resp = supabase.table("squad_picks").select("*").eq("squad_snapshot_id", snapshot["id"]).execute()
        picks = picks_resp.data
        
        for p_out, p_in in zip(req.transfers_out, req.transfers_in):
            pick = next((p for p in picks if p["player_id"] == p_out), None)
            if pick:
                supabase.table("squad_picks").update({"player_id": p_in}).eq("id", pick["id"]).execute()
                
        return {
            "success": True, 
            "message": f"Processed {num_transfers} transfers. Cost: -{transfer_cost} pts.",
            "new_balance": new_bank_balance,
            "transfer_cost": transfer_cost
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/v1/team/{team_id}/lineup")
def save_lineup(team_id: int, req: LineupRequest, user = Depends(get_current_user)):
    verify_team_ownership(team_id, user)
    
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

# --- Engine Endpoints ---

@app.post("/api/v1/engine/process-gameweek/{gameweek_id}")
def trigger_process_gameweek(gameweek_id: int):
    """
    Triggers the end-of-gameweek engine:
    1. Runs auto-subs
    2. Calculates final points
    3. Resolves H2H matchups
    """
    result = engine.process_gameweek(gameweek_id)
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return result
