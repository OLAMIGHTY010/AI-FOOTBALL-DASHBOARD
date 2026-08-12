from typing import List, Dict, Any, Optional
import pulp
import requests

def get_fpl_data() -> List[Dict[str, Any]]:
    """Fetches live FPL data from the official API."""
    url = "https://fantasy.premierleague.com/api/bootstrap-static/"
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        if response.status_code == 200:
            data = response.json()
            teams = {t["id"]: t["name"] for t in data["teams"]}
            pos_map = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD"}

            players = []
            for p in data["elements"]:
                # Only active players
                if p["status"] != "a":
                    continue
                
                ep_api = float(p["ep_next"]) if p["ep_next"] else 0.0
                historical_ep = p["total_points"] / 38.0
                ep = round((ep_api * 1.5) + historical_ep, 1)
                
                # Real FPL picture URL
                photo_url = f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{p['code']}.png"

                players.append(
                    {
                        "id": p["id"],
                        "name": f"{p['first_name']} {p['second_name']}",
                        "team_id": p["team"],
                        "team": teams.get(p["team"], "Unknown"),
                        "position": pos_map.get(p["element_type"], "Unknown"),
                        "price": p["now_cost"] / 10.0,
                        "expected_points": ep,
                        "live_points": p.get("event_points", 0),
                        "form": p["form"],
                        "selected_by": p["selected_by_percent"],
                        "photo": photo_url,
                    }
                )
            
            # Take the top 200 players by expected points to ensure the PuLP solver is fast
            return sorted(players, key=lambda x: x["expected_points"], reverse=True)[:200]
    except Exception as e:
        print("Error fetching FPL data:", e)
        
    return []


def optimize_fpl_squad(budget: float = 100.0, max_per_team: int = 3, formation: str = "3-4-3") -> Dict[str, Any]:
    """
    Optimizes FPL squad selection using PuLP Integer Linear Programming.
    Constraints:
    - 15 players total (2 GK, 5 DEF, 5 MID, 3 FWD)
    - Total cost <= budget (default 100.0m)
    - Max max_per_team players from the same Premier League club
    Objective: Maximize total expected_points
    """
    players = get_fpl_data()
    
    if not players:
        return {"error": "Failed to fetch players"}

    # Set up PuLP problem
    prob = pulp.LpProblem("FPL_Squad_Optimization", pulp.LpMaximize)

    # Decision variables: x[i] = 1 if player i is selected, 0 otherwise
    player_vars = {i: pulp.LpVariable(f"x_{i}", cat=pulp.LpBinary) for i in range(len(players))}

    # Objective Function: Maximize sum(expected_points)
    prob += pulp.lpSum([player_vars[i] * players[i]["expected_points"] for i in range(len(players))])

    # Constraint 1: Total budget
    prob += pulp.lpSum([player_vars[i] * players[i]["price"] for i in range(len(players))]) <= budget

    # Constraint 2: Squad size
    prob += pulp.lpSum([player_vars[i] for i in range(len(players))]) == 15

    # Constraint 3: Position limits
    prob += pulp.lpSum([player_vars[i] for i in range(len(players)) if players[i]["position"] == "GK"]) == 2
    prob += pulp.lpSum([player_vars[i] for i in range(len(players)) if players[i]["position"] == "DEF"]) == 5
    prob += pulp.lpSum([player_vars[i] for i in range(len(players)) if players[i]["position"] == "MID"]) == 5
    prob += pulp.lpSum([player_vars[i] for i in range(len(players)) if players[i]["position"] == "FWD"]) == 3

    # Constraint 4: Max players per team
    teams = set(p["team"] for p in players)
    for team in teams:
        prob += pulp.lpSum([player_vars[i] for i in range(len(players)) if players[i]["team"] == team]) <= max_per_team

    # Solve
    solver = pulp.PULP_CBC_CMD(msg=False)
    prob.solve(solver)

    selected_players = []
    if prob.status == pulp.LpStatusOptimal:
        for i in range(len(players)):
            if pulp.value(player_vars[i]) == 1:
                selected_players.append(players[i])
    else:
        # Fallback greedy selection if infeasible budget
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

    # Select starting 11 based on requested formation
    selected_players.sort(key=lambda p: p["expected_points"], reverse=True)

    gks = [p for p in selected_players if p["position"] == "GK"]
    defs = [p for p in selected_players if p["position"] == "DEF"]
    mids = [p for p in selected_players if p["position"] == "MID"]
    fwds = [p for p in selected_players if p["position"] == "FWD"]

    try:
        def_count, mid_count, fwd_count = map(int, formation.split("-"))
    except:
        def_count, mid_count, fwd_count = 3, 4, 3

    starting_11 = [gks[0]] + defs[:def_count] + mids[:mid_count] + fwds[:fwd_count]
    bench = [gks[1]] + defs[def_count:] + mids[mid_count:] + fwds[fwd_count:]

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
