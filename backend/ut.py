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

# Player Database
PLAYERS = {
    "Bronze": [
        {"name": "Lamine Yamal", "rating": 64, "position": "FWD"},
        {"name": "Conor Bradley", "rating": 62, "position": "DEF"},
        {"name": "Kobie Mainoo", "rating": 64, "position": "MID"},
        {"name": "Rico Lewis", "rating": 63, "position": "DEF"},
        {"name": "Lewis Miley", "rating": 61, "position": "MID"},
        {"name": "Ethan Nwaneri", "rating": 60, "position": "MID"},
        {"name": "Ben Doak", "rating": 62, "position": "FWD"},
        {"name": "Jarell Quansah", "rating": 64, "position": "DEF"},
        {"name": "Oscar Bobb", "rating": 63, "position": "FWD"},
        {"name": "Stefan Bajcetic", "rating": 64, "position": "MID"},
        {"name": "Harvey Elliott", "rating": 64, "position": "MID"},
        {"name": "Caoimhin Kelleher", "rating": 64, "position": "GK"},
        {"name": "Omari Hutchinson", "rating": 61, "position": "FWD"},
        {"name": "Shea Charles", "rating": 62, "position": "DEF"},
        {"name": "James Trafford", "rating": 63, "position": "GK"}
    ],
    "Silver": [
        {"name": "Alejandro Garnacho", "rating": 78, "position": "FWD"},
        {"name": "Cole Palmer", "rating": 79, "position": "MID"},
        {"name": "Micky van de Ven", "rating": 79, "position": "DEF"},
        {"name": "Guglielmo Vicario", "rating": 79, "position": "GK"},
        {"name": "Leon Bailey", "rating": 77, "position": "FWD"},
        {"name": "Dominik Szoboszlai", "rating": 79, "position": "MID"},
        {"name": "Pedro Porro", "rating": 78, "position": "DEF"},
        {"name": "Evan Ferguson", "rating": 77, "position": "FWD"},
        {"name": "Anthony Gordon", "rating": 78, "position": "FWD"},
        {"name": "Jarrad Branthwaite", "rating": 77, "position": "DEF"},
        {"name": "Sven Botman", "rating": 79, "position": "DEF"},
        {"name": "Destiny Udogie", "rating": 78, "position": "DEF"},
        {"name": "Brennan Johnson", "rating": 76, "position": "FWD"},
        {"name": "Douglas Luiz", "rating": 79, "position": "MID"},
        {"name": "Lucas Paqueta", "rating": 79, "position": "MID"}
    ],
    "Gold": [
        {"name": "Erling Haaland", "rating": 91, "position": "FWD"},
        {"name": "Kevin De Bruyne", "rating": 91, "position": "MID"},
        {"name": "Kylian Mbappe", "rating": 91, "position": "FWD"},
        {"name": "Rodri", "rating": 90, "position": "MID"},
        {"name": "Vinicius Jr.", "rating": 89, "position": "FWD"},
        {"name": "Mohamed Salah", "rating": 89, "position": "FWD"},
        {"name": "Virgil van Dijk", "rating": 89, "position": "DEF"},
        {"name": "Alisson", "rating": 89, "position": "GK"},
        {"name": "Jude Bellingham", "rating": 88, "position": "MID"},
        {"name": "Harry Kane", "rating": 90, "position": "FWD"},
        {"name": "Bukayo Saka", "rating": 87, "position": "FWD"},
        {"name": "Martin Odegaard", "rating": 87, "position": "MID"},
        {"name": "William Saliba", "rating": 86, "position": "DEF"},
        {"name": "Son Heung-min", "rating": 87, "position": "FWD"},
        {"name": "Phil Foden", "rating": 86, "position": "MID"},
        {"name": "Declan Rice", "rating": 86, "position": "MID"},
        {"name": "Bernardo Silva", "rating": 88, "position": "MID"},
        {"name": "Ruben Dias", "rating": 89, "position": "DEF"},
        {"name": "Thibaut Courtois", "rating": 89, "position": "GK"},
        {"name": "Lionel Messi", "rating": 90, "position": "FWD"},
        {"name": "Cristiano Ronaldo", "rating": 86, "position": "FWD"},
        {"name": "Antoine Griezmann", "rating": 88, "position": "FWD"},
        {"name": "Robert Lewandowski", "rating": 89, "position": "FWD"},
        {"name": "Trent Alexander-Arnold", "rating": 86, "position": "DEF"},
        {"name": "Marc-Andre ter Stegen", "rating": 89, "position": "GK"}
    ],
    "Icon": [
        {"name": "Pele", "rating": 98, "position": "FWD"},
        {"name": "Diego Maradona", "rating": 97, "position": "MID"},
        {"name": "Zinedine Zidane", "rating": 96, "position": "MID"},
        {"name": "Ronaldo Nazario", "rating": 96, "position": "FWD"},
        {"name": "Johan Cruyff", "rating": 94, "position": "FWD"},
        {"name": "Paolo Maldini", "rating": 94, "position": "DEF"},
        {"name": "Lev Yashin", "rating": 94, "position": "GK"},
        {"name": "Ronaldinho", "rating": 93, "position": "FWD"},
        {"name": "Thierry Henry", "rating": 93, "position": "FWD"},
        {"name": "Ruud Gullit", "rating": 93, "position": "MID"},
        {"name": "Roberto Carlos", "rating": 92, "position": "DEF"},
        {"name": "Cafu", "rating": 92, "position": "DEF"},
        {"name": "Patrick Vieira", "rating": 91, "position": "MID"},
        {"name": "Peter Schmeichel", "rating": 92, "position": "GK"},
        {"name": "Wayne Rooney", "rating": 90, "position": "FWD"}
    ]
}

def pull_random_player(rarity: str) -> dict:
    """Pulls a random player from the specified rarity pool."""
    pool = PLAYERS.get(rarity, PLAYERS["Bronze"])
    player = random.choice(pool).copy()
    player["rarity"] = rarity
    player["id"] = f"{player['name'].lower().replace(' ', '_')}_{random.randint(1000, 9999)}"
    player["sell_value"] = get_sell_value(rarity)
    player["team"] = "Free Agent"
    
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
        results.append(pull_random_player(pack["guarantee"]))
        cards_to_pull = pack["cards"] - 1
    else:
        cards_to_pull = pack["cards"]

    rarities = ["Bronze", "Silver", "Gold", "Icon"]
    weights = [pack["weights"]["Bronze"], pack["weights"]["Silver"], pack["weights"]["Gold"], pack["weights"]["Icon"]]

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
