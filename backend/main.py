from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import random
import scraper

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
