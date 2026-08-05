from typing import List, Dict, Any, Optional
import pulp
import random
import uuid

import os
from dotenv import load_dotenv
import requests
import json
import time

load_dotenv()
API_FOOTBALL_KEY = os.getenv("API_FOOTBALL_KEY")
CACHE_FILE = "cache_uefa_players.json"

UEFA_CLUBS = {
    "ucl": [("Real Madrid", 541), ("Man City", 50), ("Bayern Munich", 157), ("PSG", 85), ("Arsenal", 42), ("Inter Milan", 505), ("Barcelona", 529), ("Liverpool", 40)],
    "uel": [("Man United", 33), ("Rangers", 257), ("Benfica", 211), ("Anderlecht", 554), ("Porto", 212), ("Ajax", 194), ("Besiktas", 549), ("Fenerbahce", 611)],
    "uecl": [("Chelsea", 49), ("Fiorentina", 502), ("Real Betis", 543), ("Heidenheim", 73), ("Heart Of Midlothian", 254), ("Larne", 5354), ("Shamrock Rovers", 652), ("Molde", 329)]
}

# Pre-generate mock players to keep them consistent across requests
MOCK_UEFA_PLAYERS = {"ucl": [], "uel": [], "uecl": []}
TEAMS_CACHE_FILE = "cache_uefa_teams.json"

def fetch_uefa_teams_from_api(season=2024):
    if os.path.exists(TEAMS_CACHE_FILE):
        if time.time() - os.path.getmtime(TEAMS_CACHE_FILE) < 86400 * 7: # Cache for 7 days
            try:
                with open(TEAMS_CACHE_FILE, "r") as f:
                    cached = json.load(f)
                    UEFA_CLUBS.update(cached)
                    return
            except Exception as e:
                print(f"Error loading teams cache: {e}")

    if not API_FOOTBALL_KEY or API_FOOTBALL_KEY == "your_api_key_here":
        return

    print("Fetching confirmed UEFA teams from API-Football...")
    headers = {"x-apisports-key": API_FOOTBALL_KEY}
    
    # Mapping league to ID
    leagues = {"uel": 3, "uecl": 848, "ucl": 2}
    updated_clubs = {}
    
    for comp, league_id in leagues.items():
        try:
            res = requests.get(f"https://v3.football.api-sports.io/standings?league={league_id}&season={season}", headers=headers, timeout=5)
            data = res.json()
            if data.get("response"):
                standings = data["response"][0]["league"]["standings"][0]
                teams = []
                # Only take up to 8 top teams for our simulation
                for t in standings[:8]:
                    teams.append((t["team"]["name"], t["team"]["id"]))
                
                if teams:
                    updated_clubs[comp] = teams
                    UEFA_CLUBS[comp] = teams
        except Exception as e:
            print(f"Failed to fetch {comp} teams: {e}")
            
    if updated_clubs:
        with open(TEAMS_CACHE_FILE, "w") as f:
            json.load(f) if False else json.dump(updated_clubs, f)

# Try fetching dynamic teams before generating players
fetch_uefa_teams_from_api()

def _generate_mock_players():
    pos_map = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD"}
    first_names = ["L.", "J.", "M.", "K.", "A.", "E.", "D.", "C.", "R.", "V."]
    last_names = ["Silva", "Martinez", "Mbappe", "Kane", "Saka", "Bellingham", "Vinicius", "Rodri", "Wirtz", "Musiala"]

    for comp, clubs in UEFA_CLUBS.items():
        for team_idx, team in enumerate(clubs):
            # Generate exactly 2 GKs, 5 DEFs, 5 MIDs, 3 FWDs per team (15 players)
            squad_positions = ["GK"]*2 + ["DEF"]*5 + ["MID"]*5 + ["FWD"]*3
            for p_idx, pos in enumerate(squad_positions):
                price = round(random.uniform(4.0, 12.0) if pos in ["MID", "FWD"] else random.uniform(4.0, 7.0), 1)
                expected_points = round(price * 1.5 + random.uniform(-2, 4), 1)
                
                MOCK_UEFA_PLAYERS[comp].append({
                    "id": f"{comp}_{team_idx}_{p_idx}",
                    "name": f"{random.choice(first_names)} {random.choice(last_names)}",
                    "team_id": team_idx,
                    "team": team[0],
                    "position": pos,
                    "price": price,
                    "expected_points": max(1.0, expected_points),
                    "live_points": int(max(0, expected_points + random.uniform(-3, 5))),
                    "form": str(round(random.uniform(2.0, 8.0), 1)),
                    "selected_by": str(round(random.uniform(0.1, 40.0), 1)),
                    "photo": "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png",
                })

_generate_mock_players()

def fetch_real_squads_from_api():
    if os.path.exists(CACHE_FILE):
        # Check cache age (24 hours = 86400 seconds)
        if time.time() - os.path.getmtime(CACHE_FILE) < 86400:
            try:
                with open(CACHE_FILE, "r") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading cache: {e}")
                
    if not API_FOOTBALL_KEY or API_FOOTBALL_KEY == "your_api_key_here":
        return None
        
    print("Fetching real UEFA squads from API-Football...")
    headers = {
        "x-apisports-key": API_FOOTBALL_KEY
    }
    
    real_players = {"ucl": [], "uel": [], "uecl": []}
    
    for comp, clubs in UEFA_CLUBS.items():
        for team_name, team_id in clubs:
            try:
                res = requests.get(f"https://v3.football.api-sports.io/players/squads?team={team_id}", headers=headers, timeout=2)
                data = res.json()
                
                if data.get("errors") or not data.get("response"):
                    print(f"API Error for {team_name}: {data.get('errors')}")
                    continue
                    
                squad = data["response"][0]["players"]
                for p in squad:
                    pos_str = p.get("position", "Unknown")
                    if pos_str == "Goalkeeper": pos = "GK"
                    elif pos_str == "Defender": pos = "DEF"
                    elif pos_str == "Midfielder": pos = "MID"
                    elif pos_str == "Attacker": pos = "FWD"
                    else: continue
                    
                    # Generate dynamic price/expected points based on position and random offset
                    price_base = {"GK": 5.0, "DEF": 5.5, "MID": 7.5, "FWD": 9.0}[pos]
                    price = round(price_base + random.uniform(-1.0, 3.0), 1)
                    expected_points = round(price * 1.5 + random.uniform(-2, 4), 1)
                    
                    real_players[comp].append({
                        "id": str(p["id"]),
                        "name": p["name"],
                        "team_id": team_id,
                        "team": team_name,
                        "position": pos,
                        "price": price,
                        "expected_points": max(1.0, expected_points),
                        "live_points": int(max(0, expected_points + random.uniform(-3, 5))),
                        "form": str(round(random.uniform(2.0, 8.0), 1)),
                        "selected_by": str(round(random.uniform(0.1, 40.0), 1)),
                        "photo": p.get("photo", "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png")
                    })
            except requests.exceptions.ConnectionError as e:
                print(f"Network unreachable, aborting fetch to use fallback. Error: {e}")
                return None
            except Exception as e:
                print(f"Error fetching {team_name}: {e}")
                continue
    if sum(len(lst) for lst in real_players.values()) > 0:
        try:
            with open(CACHE_FILE, "w") as f:
                json.dump(real_players, f)
        except Exception as e:
            print(f"Error saving cache: {e}")
        return real_players
        
    return None

def get_uefa_data(competition: str) -> List[Dict[str, Any]]:
    """Returns real UEFA Fantasy data if available, otherwise mock data."""
    real_data = fetch_real_squads_from_api()
    if real_data and real_data.get(competition):
        return real_data[competition]
    return MOCK_UEFA_PLAYERS.get(competition, [])

def optimize_uefa_squad(competition: str, budget: float = 100.0, max_per_team: int = 3, formation: str = "3-4-3") -> Dict[str, Any]:
    """
    Optimizes a UEFA Fantasy squad using PuLP Integer Linear Programming.
    """
    players = get_uefa_data(competition)
    
    if not players:
        return {"error": "Invalid competition or failed to fetch players"}

    prob = pulp.LpProblem(f"UEFA_{competition}_Optimization", pulp.LpMaximize)
    player_vars = {i: pulp.LpVariable(f"x_{i}", cat=pulp.LpBinary) for i in range(len(players))}

    prob += pulp.lpSum([player_vars[i] * players[i]["expected_points"] for i in range(len(players))])
    prob += pulp.lpSum([player_vars[i] * players[i]["price"] for i in range(len(players))]) <= budget
    prob += pulp.lpSum([player_vars[i] for i in range(len(players))]) == 15
    prob += pulp.lpSum([player_vars[i] for i in range(len(players)) if players[i]["position"] == "GK"]) == 2
    prob += pulp.lpSum([player_vars[i] for i in range(len(players)) if players[i]["position"] == "DEF"]) == 5
    prob += pulp.lpSum([player_vars[i] for i in range(len(players)) if players[i]["position"] == "MID"]) == 5
    prob += pulp.lpSum([player_vars[i] for i in range(len(players)) if players[i]["position"] == "FWD"]) == 3

    teams = set(p["team"] for p in players)
    for team in teams:
        prob += pulp.lpSum([player_vars[i] for i in range(len(players)) if players[i]["team"] == team]) <= max_per_team

    solver = pulp.PULP_CBC_CMD(msg=False)
    prob.solve(solver)

    selected_players = []
    if prob.status == pulp.LpStatusOptimal:
        for i in range(len(players)):
            if pulp.value(player_vars[i]) == 1:
                selected_players.append(players[i])
    else:
        # Fallback greedy
        sorted_players = sorted(players, key=lambda p: p["expected_points"] / p["price"], reverse=True)
        counts = {"GK": 0, "DEF": 0, "MID": 0, "FWD": 0}
        limits = {"GK": 2, "DEF": 5, "MID": 5, "FWD": 3}
        team_counts = {}
        curr_price = 0.0

        for p in sorted_players:
            if sum(counts.values()) >= 15: break
            pos = p["position"]
            tm = p["team"]
            if counts[pos] < limits[pos] and team_counts.get(tm, 0) < max_per_team and (curr_price + p["price"]) <= budget:
                selected_players.append(p)
                counts[pos] += 1
                team_counts[tm] = team_counts.get(tm, 0) + 1
                curr_price += p["price"]

        # If we didn't get a full squad due to budget, ignore budget
        if sum(counts.values()) < 15:
            cheapest_players = sorted(players, key=lambda p: p["price"])
            for p in cheapest_players:
                if sum(counts.values()) >= 15: break
                if p not in selected_players:
                    pos = p["position"]
                    tm = p["team"]
                    if counts[pos] < limits[pos] and team_counts.get(tm, 0) < max_per_team:
                        selected_players.append(p)
                        counts[pos] += 1
                        team_counts[tm] = team_counts.get(tm, 0) + 1
                        curr_price += p["price"]

        # If we still don't have 15, ignore max_per_team
        if sum(counts.values()) < 15:
            for p in sorted(players, key=lambda p: p["expected_points"], reverse=True):
                if sum(counts.values()) >= 15: break
                if p not in selected_players:
                    pos = p["position"]
                    if counts[pos] < limits[pos]:
                        selected_players.append(p)
                        counts[pos] += 1
                        curr_price += p["price"]

    selected_players.sort(key=lambda p: p["expected_points"], reverse=True)

    gks = [p for p in selected_players if p["position"] == "GK"]
    defs = [p for p in selected_players if p["position"] == "DEF"]
    mids = [p for p in selected_players if p["position"] == "MID"]
    fwds = [p for p in selected_players if p["position"] == "FWD"]

    try:
        def_count, mid_count, fwd_count = map(int, formation.split("-"))
    except:
        def_count, mid_count, fwd_count = 3, 4, 3

    starting_11 = [gks[0]] + defs[:def_count] + mids[:mid_count] + fwds[:fwd_count] if len(gks) > 0 else []
    bench = [gks[1]] + defs[def_count:] + mids[mid_count:] + fwds[fwd_count:] if len(gks) > 1 else []

    captain = selected_players[0] if selected_players else None
    vice_captain = selected_players[1] if len(selected_players) > 1 else None

    total_price = round(sum(p["price"] for p in selected_players), 2)
    total_expected_points = round(sum(p["expected_points"] for p in selected_players), 2)

    return {
        "status": "optimal" if prob.status == pulp.LpStatusOptimal else "heuristic",
        "budget": budget,
        "total_cost": total_price,
        "total_expected_points": total_expected_points,
        "squad": selected_players,
        "starting_eleven": starting_11,
        "bench": bench,
        "captain": captain,
        "vice_captain": vice_captain
    }
