import random
import uuid
import math
from data_racing import get_random_runners

def calculate_racing_odds(runners):
    """
    Calculates fractional and decimal odds for racing.
    Higher combined stats -> lower odds.
    """
    total_rating = 0
    for r in runners:
        r["power"] = r["speed"] * 1.2 + r["acceleration"] * 0.8 + r["stamina"] * 1.0
        total_rating += r["power"]
        
    for r in runners:
        prob = r["power"] / total_rating
        
        # House edge
        adj_prob = min(0.95, prob * 1.1)
        decimal_odds = round(1 / adj_prob, 2)
        
        # Calculate To Place odds (roughly 1/4 of win odds)
        place_odds = round(1 + ((decimal_odds - 1) / 4), 2)

        r["odds"] = {
            "win_decimal": decimal_odds,
            "win_fractional": decimal_to_fractional(decimal_odds),
            "place_decimal": place_odds
        }
    
    return runners

def decimal_to_fractional(decimal):
    frac_map = {
        1.1: "1/10", 1.2: "1/5", 1.33: "1/3", 1.5: "1/2", 1.8: "4/5",
        2.0: "1/1", 2.5: "6/4", 3.0: "2/1", 4.0: "3/1", 5.0: "4/1",
        6.0: "5/1", 8.0: "7/1", 11.0: "10/1", 21.0: "20/1"
    }
    closest = min(frac_map.keys(), key=lambda k: abs(k - decimal))
    if abs(closest - decimal) < 1.0:
        return frac_map[closest]
    return f"{int(decimal-1)}/1"

def simulate_race(runners):
    """
    Simulates a race over 90 ticks (representing seconds).
    Runners must reach distance 100.0.
    """
    # Initialize distances
    state = {r["id"]: {"name": r["name"], "distance": 0.0, "finished": False, "finish_time": None} for r in runners}
    
    events = [] # To record the positions at each tick
    
    # 90 ticks total
    for tick in range(1, 91):
        tick_event = {"tick": tick, "positions": {}}
        
        for r in runners:
            rid = r["id"]
            if state[rid]["finished"]:
                tick_event["positions"][rid] = 100.0
                continue
                
            dist = state[rid]["distance"]
            
            # Base move per tick (average needs to hit 100 in ~80-90 ticks)
            # So average move is ~1.1 to 1.3 per tick
            base_move = (r["speed"] / 100.0) * 1.0 + random.uniform(0, 0.4)
            
            # Acceleration phase (first 20 ticks)
            if tick < 20:
                base_move += (r["acceleration"] / 100.0) * 0.3
                
            # Stamina phase (distance > 75)
            if dist > 75.0:
                stamina_penalty = (100 - r["stamina"]) / 100.0 * 0.4
                base_move -= stamina_penalty
                
            # Random event (burst or stumble)
            if random.random() < 0.05:
                base_move += random.uniform(-0.5, 0.8) # stumble or surge
                
            new_dist = min(100.0, dist + max(0.1, base_move))
            state[rid]["distance"] = round(new_dist, 2)
            
            if new_dist >= 100.0:
                state[rid]["finished"] = True
                # Use sub-tick interpolation for exact finish time to resolve ties
                overflow = dist + max(0.1, base_move) - 100.0
                state[rid]["finish_time"] = tick - (overflow / max(0.1, base_move))
                
            tick_event["positions"][rid] = state[rid]["distance"]
            
        events.append(tick_event)
        
        # If all finished, stop early
        if all(s["finished"] for s in state.values()):
            break
            
    # Sort results
    finished_runners = [(rid, s["finish_time"] if s["finish_time"] else 999) for rid, s in state.items()]
    finished_runners.sort(key=lambda x: x[1])
    
    standings = []
    for rank, (rid, ftime) in enumerate(finished_runners):
        standings.append({
            "rank": rank + 1,
            "id": rid,
            "name": state[rid]["name"],
            "finish_time": round(ftime, 2) if ftime != 999 else None
        })

    return {
        "events": events,
        "standings": standings
    }
