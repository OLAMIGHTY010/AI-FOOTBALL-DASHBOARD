import random
import uuid

def generate_basketball_fixtures(teams_data):
    """Generate matchups for virtual basketball."""
    fixtures = []
    
    for league, teams in teams_data.items():
        team_names = list(teams.keys())
        random.shuffle(team_names)
        
        for i in range(0, len(team_names) - 1, 2):
            home_name = team_names[i]
            away_name = team_names[i+1]
            h_data = teams[home_name]
            a_data = teams[away_name]
            
            fixture_id = str(uuid.uuid4())
            odds = calculate_basketball_odds(h_data["power"], a_data["power"])
            
            fixtures.append({
                "id": fixture_id,
                "league": league,
                "home": {"name": home_name, "power": h_data["power"], "star": h_data["star"]},
                "away": {"name": away_name, "power": a_data["power"], "star": a_data["star"]},
                "odds": odds
            })
    return fixtures

def calculate_basketball_odds(h_power, a_power):
    """
    Basketball is high scoring, so draws (X) are rare (overtime). 
    We will just provide Moneyline (1, 2) and a Total Points Over/Under (O210.5, U210.5).
    """
    total = h_power + a_power
    h_prob = h_power / total
    
    # Home court advantage for basketball is usually strong
    h_prob = min(h_prob + 0.05, 0.95)
    a_prob = 1.0 - h_prob
    
    house_edge = 0.95
    return {
        "1": round(1 / h_prob * house_edge, 2),
        "2": round(1 / a_prob * house_edge, 2),
        "O210.5": 1.90,
        "U210.5": 1.90
    }

def simulate_basketball_match(fixture):
    """
    Simulate a full basketball match spread across 90 ticks (to sync with frontend timer).
    Average NBA score is ~110. Across 90 ticks, a team should score ~1.2 points per tick.
    """
    h_power = fixture["home"]["power"]
    a_power = fixture["away"]["power"]
    
    # Adjust probability of scoring per tick based on power.
    # Since we only have 40 ticks (10s per quarter), base chance must be very high to reach ~100 pts.
    # 40 ticks * 2.5 pts = 100 pts.
    base_score_chance = 0.95 
    
    h_chance = base_score_chance * (h_power / 85)
    a_chance = base_score_chance * (a_power / 85)
    
    events = []
    
    h_score = 0
    a_score = 0
    
    for tick in range(1, 41):
        # Home Possession Check
        if random.random() < h_chance:
            # Did they score 2 or 3? Or 1 (free throw)?
            pt_rand = random.random()
            if pt_rand < 0.3:
                pts = 3
                event_type = "3pt"
            elif pt_rand < 0.8:
                pts = 2
                event_type = "2pt"
            else:
                pts = 1
                event_type = "ft"
                
            h_score += pts
            events.append({
                "minute": tick,
                "team": "home",
                "type": event_type,
                "points": pts,
                "player": fixture["home"]["star"] if random.random() < 0.3 else "Role Player",
                "x": random.randint(5, 45) if event_type != "ft" else 15,
                "y": random.randint(20, 80) if event_type != "ft" else 50
            })
            
        # Away Possession Check
        if random.random() < a_chance:
            pt_rand = random.random()
            if pt_rand < 0.3:
                pts = 3
                event_type = "3pt"
            elif pt_rand < 0.8:
                pts = 2
                event_type = "2pt"
            else:
                pts = 1
                event_type = "ft"
                
            a_score += pts
            events.append({
                "minute": tick,
                "team": "away",
                "type": event_type,
                "points": pts,
                "player": fixture["away"]["star"] if random.random() < 0.3 else "Role Player",
                "x": random.randint(55, 95) if event_type != "ft" else 85,
                "y": random.randint(20, 80) if event_type != "ft" else 50
            })
            
        # Random non-scoring events (fouls, steals, blocks)
        if random.random() < 0.1:
            events.append({
                "minute": tick,
                "team": random.choice(["home", "away"]),
                "type": random.choice(["foul", "steal", "block", "rebound"]),
                "x": random.randint(10, 90),
                "y": random.randint(10, 90)
            })
            
    # Resolve Overtime if tied at tick 40
    if h_score == a_score:
        if random.random() < 0.5:
            h_score += random.randint(2, 8)
            events.append({"minute": 40, "team": "home", "type": "ot_win", "points": h_score - a_score})
        else:
            a_score += random.randint(2, 8)
            events.append({"minute": 40, "team": "away", "type": "ot_win", "points": a_score - h_score})

    return {
        **fixture,
        "h_score": h_score,
        "a_score": a_score,
        "events": events
    }
