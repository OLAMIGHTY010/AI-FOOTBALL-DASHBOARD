import random
from data import VIRTUAL_TEAMS

TEAM_PENALTIES = {
    league: {team: {"injuries": 0, "suspensions": 0} for team in teams}
    for league, teams in VIRTUAL_TEAMS.items()
}

def generate_weather():
    return random.choices(["Sunny", "Rain", "Snow"], weights=[0.6, 0.3, 0.1])[0]


def calculate_all_odds(h_team, a_team):
    """Calculate all betting odds for a match."""
    h_power = h_team["power"]
    a_power = a_team["power"]
    total = h_power + a_power
    h_prob = min(max(h_power / total, 0.2), 0.8) * 0.75
    a_prob = min(max(a_power / total, 0.2), 0.8) * 0.75
    d_prob = 1.0 - (h_prob + a_prob)
    house_edge = 0.92

    odds_1 = round((1 / h_prob) * house_edge, 2)
    odds_x = round((1 / d_prob) * house_edge, 2)
    odds_2 = round((1 / a_prob) * house_edge, 2)
    odds_1x = round((1 / (h_prob + d_prob)) * house_edge, 2)
    odds_12 = round((1 / (h_prob + a_prob)) * house_edge, 2)
    odds_x2 = round((1 / (d_prob + a_prob)) * house_edge, 2)

    avg_goals_expected = (total / 100) * 1.5
    over_prob = min(max(avg_goals_expected / 3.0, 0.3), 0.7)
    under_prob = 1.0 - over_prob
    odds_over = round((1 / over_prob) * house_edge, 2)
    odds_under = round((1 / under_prob) * house_edge, 2)

    btts_yes_prob = min(max((h_power * a_power) / (95 * 95), 0.3), 0.7)
    btts_no_prob = 1.0 - btts_yes_prob
    odds_btts_yes = round((1 / btts_yes_prob) * house_edge, 2)
    odds_btts_no = round((1 / btts_no_prob) * house_edge, 2)

    corner_over_prob = min(max((total - 150) / 40.0, 0.3), 0.7)
    corner_under_prob = 1.0 - corner_over_prob
    odds_corner_over = round((1 / corner_over_prob) * house_edge, 2)
    odds_corner_under = round((1 / corner_under_prob) * house_edge, 2)

    power_diff = abs(h_power - a_power)
    card_over_prob = min(max(1.0 - (power_diff / 20.0), 0.3), 0.7)
    card_under_prob = 1.0 - card_over_prob
    odds_card_over = round((1 / card_over_prob) * house_edge, 2)
    odds_card_under = round((1 / card_under_prob) * house_edge, 2)

    red_prob = 0.15
    odds_red_yes = round((1 / red_prob) * house_edge, 2)
    odds_red_no = round((1 / (1 - red_prob)) * house_edge, 2)

    foul_over_prob = card_over_prob
    odds_foul_over = round((1 / foul_over_prob) * house_edge, 2)
    odds_foul_under = round((1 / (1 - foul_over_prob)) * house_edge, 2)

    h_star_prob = min(max(h_prob * 0.45, 0.1), 0.8)
    a_star_prob = min(max(a_prob * 0.45, 0.1), 0.8)
    odds_h_star_yes = round((1 / h_star_prob) * house_edge, 2)
    odds_h_star_no = round((1 / (1 - h_star_prob)) * house_edge, 2)
    odds_a_star_yes = round((1 / a_star_prob) * house_edge, 2)
    odds_a_star_no = round((1 / (1 - a_star_prob)) * house_edge, 2)

    return {
        "1": odds_1, "X": odds_x, "2": odds_2,
        "1X": odds_1x, "12": odds_12, "X2": odds_x2,
        "O2.5": odds_over, "U2.5": odds_under,
        "BTTS_Y": odds_btts_yes, "BTTS_N": odds_btts_no,
        "C_O9.5": odds_corner_over, "C_U9.5": odds_corner_under,
        "Y_O3.5": odds_card_over, "Y_U3.5": odds_card_under,
        "RED_Y": odds_red_yes, "RED_N": odds_red_no,
        "F_O22.5": odds_foul_over, "F_U22.5": odds_foul_under,
        "H_STAR_Y": odds_h_star_yes, "H_STAR_N": odds_h_star_no,
        "A_STAR_Y": odds_a_star_yes, "A_STAR_N": odds_a_star_no,
    }


def calculate_live_odds(h_team, a_team, h_goals, a_goals, minute):
    """Calculate dynamic live odds based on current score and minute."""
    h_power = h_team["power"]
    a_power = a_team["power"]
    
    remaining_mins = max(90 - minute, 1)
    goal_diff = h_goals - a_goals
    
    total = h_power + a_power
    h_prob_rest = min(max(h_power / total, 0.2), 0.8) * 0.75
    a_prob_rest = min(max(a_power / total, 0.2), 0.8) * 0.75
    d_prob_rest = 1.0 - (h_prob_rest + a_prob_rest)
    
    time_factor = remaining_mins / 90.0  # 1.0 at start, 0.0 near end
    
    if goal_diff > 0:
        h_prob = h_prob_rest * time_factor + (1.0 - time_factor) * 0.98
        a_prob = a_prob_rest * time_factor + (1.0 - time_factor) * 0.01
        d_prob = 1.0 - (h_prob + a_prob)
    elif goal_diff < 0:
        a_prob = a_prob_rest * time_factor + (1.0 - time_factor) * 0.98
        h_prob = h_prob_rest * time_factor + (1.0 - time_factor) * 0.01
        d_prob = 1.0 - (h_prob + a_prob)
    else:
        d_prob = d_prob_rest * time_factor + (1.0 - time_factor) * 0.96
        h_prob = h_prob_rest * time_factor + (1.0 - time_factor) * 0.02
        a_prob = 1.0 - (h_prob + d_prob)
        
    house_edge = 0.92
    
    def safe_odds(prob):
        return max(round((1 / max(prob, 0.01)) * house_edge, 2), 1.01)
        
    return {
        "1": safe_odds(h_prob),
        "X": safe_odds(d_prob),
        "2": safe_odds(a_prob)
    }




def generate_fixtures():
    """Generate a full matchweek of fixtures for every league."""
    for l in TEAM_PENALTIES:
        for t in TEAM_PENALTIES[l]:
            if TEAM_PENALTIES[l][t]["injuries"] > 0: TEAM_PENALTIES[l][t]["injuries"] -= 1
            if TEAM_PENALTIES[l][t]["suspensions"] > 0: TEAM_PENALTIES[l][t]["suspensions"] -= 1

    fixtures = []
    match_id_counter = 1
    for league, teams in VIRTUAL_TEAMS.items():
        league_teams = []
        for t, v in teams.items():
            power = v["power"]
            pen = TEAM_PENALTIES[league][t]
            power -= (pen["injuries"] * 5) + (pen["suspensions"] * 3)
            league_teams.append({"name": t, "league": league, "power": max(10, power), "star": v["star"]})

        random.shuffle(league_teams)
        for i in range(0, len(league_teams), 2):
            if i + 1 < len(league_teams):
                t1 = league_teams[i]
                t2 = league_teams[i + 1]
                fixtures.append({
                    "id": f"match_{match_id_counter}",
                    "home": t1,
                    "away": t2,
                    "odds": calculate_all_odds(t1, t2),
                    "weather": generate_weather()
                })
                match_id_counter += 1
    return fixtures


def simulate_match(home_team, away_team, weather='Sunny'):
    """Simulate a full 90-minute match and return the result."""
    match = {
        "home": home_team,
        "away": away_team,
        "h_goals": 0, "a_goals": 0,
        "h_corners": 0, "a_corners": 0,
        "h_yellows": 0, "a_yellows": 0,
        "h_fouls": 0, "a_fouls": 0,
        "red_card": False,
        "h_star_scored": False, "a_star_scored": False,
        "events": [],
    }

    power_diff = abs(home_team["power"] - away_team["power"])
    weather_mod = 1.0
    foul_mod = 1.0
    if weather == 'Rain':
        foul_mod = 1.3
        weather_mod = 0.9
    elif weather == 'Snow':
        weather_mod = 0.7
        foul_mod = 1.1

    h_chance = ((home_team["power"] / 90.0) * 0.02) * weather_mod
    a_chance = ((away_team["power"] / 90.0) * 0.02) * weather_mod
    corner_chance = ((home_team["power"] + away_team["power"]) / 180.0 * 0.12) * weather_mod
    foul_chance = ((1.0 - (power_diff / 50.0)) * 0.25) * foul_mod

    def get_scorer(star_name):
        if random.random() < 0.4:
            return star_name
        
        # Generate a fake name for other players
        first_names = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "J.", "K.", "L.", "M.", "N.", "P.", "R.", "S.", "T.", "V.", "W.", "Y.", "Z."]
        last_names = ["Smith", "Silva", "Gomez", "Kim", "Jones", "Williams", "Brown", "Taylor", "Davies", "Evans", "Thomas", "Johnson", "Roberts", "Walker", "Wright", "Robinson", "Thompson", "White", "Hughes", "Edwards", "Green", "Hall", "Wood", "Harris", "Martin", "Jackson", "Clarke"]
        return f"{random.choice(first_names)} {random.choice(last_names)}"

    for minute in range(1, 91):
        # Goals
        if random.random() < h_chance:
            match["h_goals"] += 1
            scorer = get_scorer(home_team["star"])
            if scorer == home_team["star"]:
                match["h_star_scored"] = True
            match["events"].append({"minute": minute, "type": "goal", "team": "home", "player": scorer, "x": random.randint(85, 95), "y": random.randint(40, 60)})

        if random.random() < a_chance:
            match["a_goals"] += 1
            scorer = get_scorer(away_team["star"])
            if scorer == away_team["star"]:
                match["a_star_scored"] = True
            match["events"].append({"minute": minute, "type": "goal", "team": "away", "player": scorer, "x": random.randint(5, 15), "y": random.randint(40, 60)})

        # Corners
        if random.random() < corner_chance:
            side = "home" if random.random() < 0.5 else "away"
            if side == "home":
                match["h_corners"] += 1
            else:
                match["a_corners"] += 1
            x_coord = 100 if side == "home" else 0
            y_coord = random.choice([0, 100])
            match["events"].append({"minute": minute, "type": "corner", "team": side, "x": x_coord, "y": y_coord})

        # Fouls & Cards
        if random.random() < foul_chance:
            side = "home" if random.random() < 0.5 else "away"
            if side == "home":
                match["h_fouls"] += 1
            else:
                match["a_fouls"] += 1
            match["events"].append({"minute": minute, "type": "foul", "team": side, "x": random.randint(20, 80), "y": random.randint(10, 90)})

            if random.random() < 0.15:
                if random.random() < 0.05 and not match["red_card"]:
                    match["red_card"] = True
                    match["events"].append({"minute": minute, "type": "red_card", "team": side, "x": random.randint(20, 80), "y": random.randint(10, 90)})
                    # apply suspension
                    team_name = home_team["name"] if side == "home" else away_team["name"]
                    league_name = home_team["league"]
                    TEAM_PENALTIES[league_name][team_name]["suspensions"] = 1
                else:
                    if side == "home":
                        match["h_yellows"] += 1
                    else:
                        match["a_yellows"] += 1
                    match["events"].append({"minute": minute, "type": "yellow_card", "team": side, "x": random.randint(20, 80), "y": random.randint(10, 90)})
            
            # Injury chance on fouls
            if random.random() < 0.02:
                injured_side = "away" if side == "home" else "home"
                match["events"].append({"minute": minute, "type": "injury", "team": injured_side, "x": random.randint(20, 80), "y": random.randint(10, 90)})
                team_name = home_team["name"] if injured_side == "home" else away_team["name"]
                league_name = home_team["league"]
                TEAM_PENALTIES[league_name][team_name]["injuries"] = 2

    return match


def check_bet_result(bet_market, match):
    """Check if a bet won based on match results."""
    h_g = match["h_goals"]
    a_g = match["a_goals"]
    total_g = h_g + a_g
    total_c = match["h_corners"] + match["a_corners"]
    total_y = match["h_yellows"] + match["a_yellows"]
    total_f = match["h_fouls"] + match["a_fouls"]

    checks = {
        "1": h_g > a_g, "X": h_g == a_g, "2": h_g < a_g,
        "1X": h_g >= a_g, "12": h_g != a_g, "X2": h_g <= a_g,
        "O2.5": total_g > 2.5, "U2.5": total_g < 2.5,
        "BTTS_Y": h_g > 0 and a_g > 0, "BTTS_N": h_g == 0 or a_g == 0,
        "C_O9.5": total_c > 9.5, "C_U9.5": total_c < 9.5,
        "Y_O3.5": total_y > 3.5, "Y_U3.5": total_y < 3.5,
        "RED_Y": match["red_card"], "RED_N": not match["red_card"],
        "F_O22.5": total_f > 22.5, "F_U22.5": total_f < 22.5,
        "H_STAR_Y": match["h_star_scored"], "H_STAR_N": not match["h_star_scored"],
        "A_STAR_Y": match["a_star_scored"], "A_STAR_N": not match["a_star_scored"],
    }
    return checks.get(bet_market, False)
