from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import random

from data import VIRTUAL_TEAMS
from simulation import generate_fixtures, simulate_match, check_bet_result, calculate_all_odds
from ut import open_pack, PACKS, get_sell_value
from tactics import get_tactics_data, FORMATIONS, TACTICAL_STYLES
from fpl import get_fpl_data, optimize_fpl_squad

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


class BetRequest(BaseModel):
    match_id: str
    market: str
    odds: float
    wager: float


class SimulateRequest(BaseModel):
    fixture_ids: Optional[List[str]] = None


class PackRequest(BaseModel):
    pack_type: Optional[str] = None
    pack_name: Optional[str] = None


class FPLOptimizeRequest(BaseModel):
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
    if not current_fixtures:
        current_fixtures = generate_fixtures()

    results = []
    for fixture in current_fixtures:
        home = fixture["home"]
        away = fixture["away"]
        match_result = simulate_match(home, away)
        match_result["id"] = fixture["id"]
        match_result["odds"] = fixture["odds"]

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

    # Generate new fixtures for next gameweek
    current_fixtures = generate_fixtures()

    return {"results": results, "next_fixtures": current_fixtures}


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
