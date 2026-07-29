import random
import uuid

def generate_tennis_fixtures(teams_data):
    """Generate matchups for virtual tennis."""
    fixtures = []
    
    for league, players in teams_data.items():
        player_names = list(players.keys())
        random.shuffle(player_names)
        
        for i in range(0, len(player_names) - 1, 2):
            home_name = player_names[i]
            away_name = player_names[i+1]
            h_data = players[home_name]
            a_data = players[away_name]
            
            fixture_id = str(uuid.uuid4())
            odds = calculate_tennis_odds(h_data["power"], a_data["power"])
            
            fixtures.append({
                "id": fixture_id,
                "league": league, # ATP or WTA
                "home": {"name": home_name, "power": h_data["power"], "serve": h_data["serve"], "return": h_data["return"], "star": h_data["star"]},
                "away": {"name": away_name, "power": a_data["power"], "serve": a_data["serve"], "return": a_data["return"], "star": a_data["star"]},
                "odds": odds
            })
    return fixtures

def calculate_tennis_odds(h_power, a_power):
    """
    Tennis Match Odds. No draws.
    Markets: 1, 2, Over 22.5 Games, Under 22.5 Games
    """
    total = h_power + a_power
    h_prob = h_power / total
    a_prob = 1.0 - h_prob
    
    house_edge = 0.95
    return {
        "1": round(1 / h_prob * house_edge, 2),
        "2": round(1 / a_prob * house_edge, 2),
        "O22.5": 1.90,
        "U22.5": 1.90
    }

def simulate_tennis_match(fixture):
    """
    Simulate a Tennis match. Best of 3 Sets.
    Runs for 90 ticks. 1 tick = 1 point. 
    If not finished by tick 90, auto-resolves the rest.
    """
    h_p = fixture["home"]
    a_p = fixture["away"]
    
    events = []
    
    h_sets = 0
    a_sets = 0
    h_games = 0
    a_games = 0
    h_pts = 0
    a_pts = 0
    
    match_winner = None
    server = "home" # Home serves first
    
    def get_point_winner():
        if server == "home":
            p = h_p["serve"] / (h_p["serve"] + a_p["return"])
            return "home" if random.random() < p else "away"
        else:
            p = a_p["serve"] / (a_p["serve"] + h_p["return"])
            return "away" if random.random() < p else "home"
            
    def format_score(hp, ap, is_tiebreak):
        if is_tiebreak:
            return f"{hp}-{ap}"
        scores = {0: "0", 1: "15", 2: "30", 3: "40"}
        if hp >= 3 and ap >= 3:
            if hp == ap:
                return "Deuce"
            elif hp > ap:
                return "Ad-In" if server == "home" else "Ad-Out"
            else:
                return "Ad-Out" if server == "home" else "Ad-In"
        return f"{scores.get(hp, hp)}-{scores.get(ap, ap)}"

    tick = 1
    while match_winner is None:
        if tick > 90:
            break # Resolve later
            
        is_tiebreak = (h_games == 6 and a_games == 6)
        point_winner = get_point_winner()
        
        if point_winner == "home":
            h_pts += 1
        else:
            a_pts += 1
            
        # Check game win
        game_won = False
        if is_tiebreak:
            if (h_pts >= 7 or a_pts >= 7) and abs(h_pts - a_pts) >= 2:
                game_won = True
        else:
            if (h_pts >= 4 or a_pts >= 4) and abs(h_pts - a_pts) >= 2:
                game_won = True
                
        if game_won:
            if h_pts > a_pts:
                h_games += 1
            else:
                a_games += 1
                
            h_pts = 0
            a_pts = 0
            server = "away" if server == "home" else "home"
            
            # Check set win
            if (h_games >= 6 or a_games >= 6) and abs(h_games - a_games) >= 2 or (h_games == 7 or a_games == 7):
                if h_games > a_games:
                    h_sets += 1
                else:
                    a_sets += 1
                h_games = 0
                a_games = 0
                
                # Check match win
                if h_sets == 2:
                    match_winner = "home"
                elif a_sets == 2:
                    match_winner = "away"
        else:
            if is_tiebreak and (h_pts + a_pts) % 2 == 1:
                server = "away" if server == "home" else "home"

        # Record event for tick
        events.append({
            "minute": tick,
            "team": point_winner,
            "type": "point",
            "server": server,
            "score": format_score(h_pts, a_pts, is_tiebreak),
            "h_sets": h_sets,
            "a_sets": a_sets,
            "h_games": h_games,
            "a_games": a_games
        })
        tick += 1

    # If we hit 90 ticks and no winner, fast forward the rest instantly
    while match_winner is None:
        is_tiebreak = (h_games == 6 and a_games == 6)
        pw = get_point_winner()
        if pw == "home": h_pts += 1
        else: a_pts += 1
        
        game_won = False
        if is_tiebreak:
            if (h_pts >= 7 or a_pts >= 7) and abs(h_pts - a_pts) >= 2: game_won = True
        else:
            if (h_pts >= 4 or a_pts >= 4) and abs(h_pts - a_pts) >= 2: game_won = True
                
        if game_won:
            if h_pts > a_pts: h_games += 1
            else: a_games += 1
            h_pts = 0
            a_pts = 0
            server = "away" if server == "home" else "home"
            if (h_games >= 6 or a_games >= 6) and abs(h_games - a_games) >= 2 or (h_games == 7 or a_games == 7):
                if h_games > a_games: h_sets += 1
                else: a_sets += 1
                h_games = 0
                a_games = 0
                if h_sets == 2: match_winner = "home"
                elif a_sets == 2: match_winner = "away"
        else:
            if is_tiebreak and (h_pts + a_pts) % 2 == 1:
                server = "away" if server == "home" else "home"

    # Save final score to match object
    return {
        **fixture,
        "match_winner": match_winner,
        "h_sets_won": h_sets,
        "a_sets_won": a_sets,
        "events": events
    }
