import random

# Pack Definitions
PACKS = {
    "bronze": {
        "price": 5,
        "description": "Contains 5 players. Mostly Bronze, small chance of Silver.",
        "cards": 5,
        "guarantee": "None",
        "weights": {"Bronze": 90, "Silver": 9, "Gold": 1, "Icon": 0}
    },
    "silver": {
        "price": 20,
        "description": "Contains 5 players. Guaranteed at least 1 Silver player.",
        "cards": 5,
        "guarantee": "Silver",
        "weights": {"Bronze": 40, "Silver": 50, "Gold": 10, "Icon": 0}
    },
    "gold": {
        "price": 100,
        "description": "Contains 5 players. Guaranteed at least 1 Gold player.",
        "cards": 5,
        "guarantee": "Gold",
        "weights": {"Bronze": 10, "Silver": 40, "Gold": 48, "Icon": 2}
    },
    "icon": {
        "price": 500,
        "description": "Contains 5 players. Guaranteed ICON.",
        "cards": 5,
        "guarantee": "Icon",
        "weights": {"Bronze": 10, "Silver": 40, "Gold": 49, "Icon": 1}
    }
}

from typing import List, Dict, Any
from fpl import get_fpl_data

def get_real_players() -> Dict[str, List[Dict[str, Any]]]:
    fpl_players = get_fpl_data()
    
    categorized: Dict[str, List[Dict[str, Any]]] = {
        "Bronze": [],
        "Silver": [],
        "Gold": [],
        "Icon": []
    }
    
    if not fpl_players:
        return categorized

    # Sort players by expected points to find "Icons"
    sorted_by_ep = sorted(fpl_players, key=lambda p: p["expected_points"], reverse=True)
    icons = sorted_by_ep[:15]
    
    for p in fpl_players:
        ut_player = {
            "name": p["name"],
            "rating": int(p["expected_points"] * 10 + 30),
            "position": p["position"],
            "team": p["team"],
            "photo": p["photo"],
            "fpl_price": p["price"]
        }
        
        ut_player["rating"] = min(99, max(40, ut_player["rating"]))

        if p in icons:
            ut_player["rating"] = max(90, ut_player["rating"])
            categorized["Icon"].append(ut_player)
        elif p["price"] >= 8.0:
            categorized["Gold"].append(ut_player)
        elif p["price"] >= 5.5:
            categorized["Silver"].append(ut_player)
        else:
            categorized["Bronze"].append(ut_player)
            
    # Fallback if pools are empty
    for rarity in categorized:
        if not categorized[rarity]:
            categorized[rarity].append({
                "name": f"Unknown {rarity}",
                "rating": 50,
                "position": "MID",
                "team": "Unknown",
                "photo": "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png",
                "fpl_price": 5.0
            })
            
    return categorized

REAL_PLAYERS_CACHE: Any = None

def get_players_db() -> Dict[str, List[Dict[str, Any]]]:
    global REAL_PLAYERS_CACHE
    if REAL_PLAYERS_CACHE is None:
        REAL_PLAYERS_CACHE = get_real_players()
    return REAL_PLAYERS_CACHE

def pull_random_player(rarity: str) -> dict:
    """Pulls a random player from the specified rarity pool."""
    db = get_players_db()
    pool = db.get(rarity, db.get("Bronze", []))
    player = random.choice(pool).copy()
    player["rarity"] = rarity
    player["id"] = f"{player['name'].lower().replace(' ', '_')}_{random.randint(1000, 9999)}"
    player["sell_value"] = get_sell_value(rarity)
    
    # Generate 6 stats scaled around the player's overall rating
    base = player["rating"]
    def generate_stat(is_key: bool):
        variance = 4 if is_key else 15
        val = base + random.randint(-variance, variance)
        return min(max(val, 20), 99)
        
    pos = player["position"]
    player["stats"] = {
        "PAC": generate_stat(pos in ["FWD", "MID"]),
        "SHO": generate_stat(pos == "FWD"),
        "PAS": generate_stat(pos == "MID"),
        "DRI": generate_stat(pos in ["FWD", "MID"]),
        "DEF": generate_stat(pos == "DEF"),
        "PHY": generate_stat(pos in ["DEF", "MID"])
    }
    
    return player

def open_pack(pack_name: str) -> list:
    """Simulates opening a pack. Returns a list of player dicts."""
    if pack_name not in PACKS:
        # Fallback if matching key is slightly different or default
        pack_name = "Bronze Pack"

    pack = PACKS[pack_name]
    results = []

    # Handle Guarantee
    if pack["guarantee"] != "None":
        results.append(pull_random_player(str(pack["guarantee"])))
        cards_to_pull = int(pack["cards"]) - 1
    else:
        cards_to_pull = int(pack["cards"])

    rarities = ["Bronze", "Silver", "Gold", "Icon"]
    weights = [float(pack["weights"]["Bronze"]), float(pack["weights"]["Silver"]), float(pack["weights"]["Gold"]), float(pack["weights"]["Icon"])]

    for _ in range(cards_to_pull):
        chosen_rarity = random.choices(rarities, weights=weights, k=1)[0]
        results.append(pull_random_player(chosen_rarity))

    return results

def get_sell_value(rarity: str) -> int:
    """Returns bankroll value for selling a card of this rarity."""
    values = {
        "Bronze": 20,
        "Silver": 100,
        "Gold": 400,
        "Icon": 2500
    }
    return values.get(rarity, 10)
