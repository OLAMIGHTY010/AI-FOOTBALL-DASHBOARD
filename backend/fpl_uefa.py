from typing import List, Dict, Any, Optional
import pulp
import random
import uuid

UEFA_CLUBS = {
    "ucl": ["Real Madrid", "Man City", "Bayern Munich", "PSG", "Arsenal", "Inter Milan", "Barcelona", "Liverpool"],
    "uel": ["Roma", "Man United", "Tottenham", "Porto", "Athletic Club", "Ajax", "Lazio", "Fenerbahce"],
    "uecl": ["Chelsea", "Fiorentina", "Real Betis", "Heidenheim", "Panathinaikos", "Copenhagen", "Legia Warsaw", "Gent"]
}

# Pre-generate mock players to keep them consistent across requests
MOCK_UEFA_PLAYERS = {"ucl": [], "uel": [], "uecl": []}

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
                    "team": team,
                    "position": pos,
                    "price": price,
                    "expected_points": max(1.0, expected_points),
                    "live_points": int(max(0, expected_points + random.uniform(-3, 5))),
                    "form": str(round(random.uniform(2.0, 8.0), 1)),
                    "selected_by": str(round(random.uniform(0.1, 40.0), 1)),
                    "photo": "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png",
                })

_generate_mock_players()

def get_uefa_data(competition: str) -> List[Dict[str, Any]]:
    """Returns mock UEFA Fantasy data for a given competition (ucl, uel, uecl)."""
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
            pos = p["position"]
            tm = p["team"]
            if counts[pos] < limits[pos] and team_counts.get(tm, 0) < max_per_team and (curr_price + p["price"]) <= budget:
                selected_players.append(p)
                counts[pos] += 1
                team_counts[tm] = team_counts.get(tm, 0) + 1
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
