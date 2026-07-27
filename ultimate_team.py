import random

# Pack Definitions
PACKS = {
    "Bronze Pack": {
        "price": 100,
        "description": "Contains 5 players. Mostly Bronze, small chance of Silver.",
        "cards": 5,
        "guarantee": "None",
        "weights": {"Bronze": 90, "Silver": 9, "Gold": 1, "Icon": 0}
    },
    "Silver Pack": {
        "price": 500,
        "description": "Contains 5 players. Guaranteed at least 1 Silver player.",
        "cards": 5,
        "guarantee": "Silver",
        "weights": {"Bronze": 40, "Silver": 50, "Gold": 10, "Icon": 0}
    },
    "Premium Gold Pack": {
        "price": 1500,
        "description": "Contains 5 players. Guaranteed at least 1 Gold player.",
        "cards": 5,
        "guarantee": "Gold",
        "weights": {"Bronze": 10, "Silver": 40, "Gold": 48, "Icon": 2}
    },
    "Ultimate Icon Pack": {
        "price": 10000,
        "description": "Contains 1 player. Guaranteed ICON.",
        "cards": 1,
        "guarantee": "Icon",
        "weights": {"Bronze": 0, "Silver": 0, "Gold": 0, "Icon": 100}
    }
}

# Player Database (Mock)
PLAYERS = {
    "Bronze": [
        {"name": "J. Smith", "rating": 62, "position": "DEF"},
        {"name": "T. Davis", "rating": 64, "position": "MID"},
        {"name": "L. Brown", "rating": 61, "position": "FWD"},
        {"name": "M. Evans", "rating": 65, "position": "GK"},
        {"name": "R. Taylor", "rating": 63, "position": "DEF"},
        {"name": "S. Clark", "rating": 60, "position": "MID"},
        {"name": "D. Lewis", "rating": 64, "position": "FWD"},
        {"name": "C. Walker", "rating": 61, "position": "DEF"}
    ],
    "Silver": [
        {"name": "A. Isak", "rating": 78, "position": "FWD"},
        {"name": "C. Palmer", "rating": 77, "position": "MID"},
        {"name": "M. Van de Ven", "rating": 79, "position": "DEF"},
        {"name": "G. Vicario", "rating": 76, "position": "GK"},
        {"name": "L. Bailey", "rating": 75, "position": "FWD"},
        {"name": "D. Szoboszlai", "rating": 78, "position": "MID"},
        {"name": "P. Porro", "rating": 77, "position": "DEF"},
        {"name": "E. Ferguson", "rating": 74, "position": "FWD"}
    ],
    "Gold": [
        {"name": "E. Haaland", "rating": 91, "position": "FWD"},
        {"name": "K. De Bruyne", "rating": 91, "position": "MID"},
        {"name": "M. Salah", "rating": 89, "position": "FWD"},
        {"name": "V. van Dijk", "rating": 89, "position": "DEF"},
        {"name": "Alisson", "rating": 89, "position": "GK"},
        {"name": "B. Saka", "rating": 87, "position": "MID"},
        {"name": "M. Odegaard", "rating": 87, "position": "MID"},
        {"name": "W. Saliba", "rating": 86, "position": "DEF"},
        {"name": "K. Mbappe", "rating": 92, "position": "FWD"},
        {"name": "Vini Jr.", "rating": 90, "position": "FWD"},
        {"name": "J. Bellingham", "rating": 88, "position": "MID"}
    ],
    "Icon": [
        {"name": "Pele", "rating": 98, "position": "FWD"},
        {"name": "D. Maradona", "rating": 97, "position": "MID"},
        {"name": "Z. Zidane", "rating": 96, "position": "MID"},
        {"name": "Ronaldo Nazario", "rating": 96, "position": "FWD"},
        {"name": "P. Maldini", "rating": 94, "position": "DEF"},
        {"name": "L. Yashin", "rating": 94, "position": "GK"}
    ]
}

def pull_random_player(rarity):
    """Pulls a random player from the specified rarity pool."""
    pool = PLAYERS[rarity]
    player = random.choice(pool).copy()
    player["rarity"] = rarity
    # Assign a unique ID so we can have duplicates in the club if needed
    player["id"] = f"{player['name']}_{random.randint(1000, 9999)}"
    return player

def open_pack(pack_name):
    """
    Simulates opening a pack. Returns a list of player dicts.
    """
    if pack_name not in PACKS:
        return []
    
    pack = PACKS[pack_name]
    results = []
    
    # Handle Guarantee
    if pack["guarantee"] != "None":
        results.append(pull_random_player(pack["guarantee"]))
        cards_to_pull = pack["cards"] - 1
    else:
        cards_to_pull = pack["cards"]
        
    # Pull remaining cards based on weights
    rarities = ["Bronze", "Silver", "Gold", "Icon"]
    weights = [pack["weights"]["Bronze"], pack["weights"]["Silver"], pack["weights"]["Gold"], pack["weights"]["Icon"]]
    
    for _ in range(cards_to_pull):
        chosen_rarity = random.choices(rarities, weights=weights, k=1)[0]
        results.append(pull_random_player(chosen_rarity))
        
    return results

def get_sell_value(rarity):
    """Returns the bankroll value for selling a card of this rarity."""
    values = {
        "Bronze": 20,
        "Silver": 100,
        "Gold": 400,
        "Icon": 2500
    }
    return values.get(rarity, 10)
