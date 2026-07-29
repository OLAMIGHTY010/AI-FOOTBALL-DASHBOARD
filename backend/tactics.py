# Manager Mode Tactics Definitions

FORMATIONS = {
    "4-3-3": {"description": "Balanced attack and defense. Winger focused.", "attack_mod": 1.0, "defense_mod": 1.0},
    "3-5-2": {"description": "Midfield overload. Vulnerable on wings.", "attack_mod": 1.05, "defense_mod": 0.95},
    "4-4-2": {"description": "Classic rigid structure.", "attack_mod": 0.98, "defense_mod": 1.02},
    "5-3-2": {"description": "Ultra defensive.", "attack_mod": 0.85, "defense_mod": 1.15},
    "4-2-3-1": {"description": "Modern balanced control.", "attack_mod": 1.02, "defense_mod": 1.0}
}

TACTICAL_STYLES = {
    "Gegenpress": {
        "description": "High intensity pressing. Increases goals but leaves you vulnerable.",
        "attack_mod": 1.10, "defense_mod": 0.90, "foul_mod": 1.2, "corner_mod": 1.1
    },
    "Park the Bus": {
        "description": "Deep defensive block. Hard to score against, but hard to score.",
        "attack_mod": 0.70, "defense_mod": 1.25, "foul_mod": 0.8, "corner_mod": 0.6
    },
    "Tiki-Taka": {
        "description": "Possession based. Reduces chaos and fouls.",
        "attack_mod": 1.0, "defense_mod": 1.05, "foul_mod": 0.7, "corner_mod": 0.9
    },
    "Counter Attack": {
        "description": "Soak up pressure and hit fast.",
        "attack_mod": 1.05, "defense_mod": 1.10, "foul_mod": 1.0, "corner_mod": 0.8
    },
    "Balanced": {
        "description": "Standard approach.",
        "attack_mod": 1.0, "defense_mod": 1.0, "foul_mod": 1.0, "corner_mod": 1.0
    }
}

BBALL_FORMATIONS = {
    "Pace & Space": {"description": "Spread the floor and shoot lots of 3s.", "attack_mod": 1.05, "defense_mod": 0.95, "_3pt_mod": 1.3},
    "Twin Towers": {"description": "Two dominant big men. Strong interior defense and rebounding.", "attack_mod": 0.95, "defense_mod": 1.10, "_3pt_mod": 0.7},
    "Triangle Offense": {"description": "Structured ball movement and spacing.", "attack_mod": 1.05, "defense_mod": 1.0, "_3pt_mod": 1.0},
    "Small Ball": {"description": "Fast and versatile, sacrifices rebounding for speed.", "attack_mod": 1.10, "defense_mod": 0.90, "_3pt_mod": 1.2},
    "Standard": {"description": "Balanced approach.", "attack_mod": 1.0, "defense_mod": 1.0, "_3pt_mod": 1.0}
}

BBALL_STYLES = {
    "Run and Gun": {
        "description": "High pace, fast breaks, maximizing possessions.",
        "attack_mod": 1.15, "defense_mod": 0.85, "pace_mod": 1.2
    },
    "Grit and Grind": {
        "description": "Physical, slow pace, locking down opponents.",
        "attack_mod": 0.85, "defense_mod": 1.20, "pace_mod": 0.8
    },
    "Pick and Roll Focus": {
        "description": "Methodical offensive execution.",
        "attack_mod": 1.05, "defense_mod": 1.0, "pace_mod": 1.0
    },
    "Balanced": {
        "description": "Standard approach.",
        "attack_mod": 1.0, "defense_mod": 1.0, "pace_mod": 1.0
    }
}

def get_tactics_data() -> dict:
    """Returns available formations and tactical styles for all sports."""
    return {
        "football": {
            "formations": FORMATIONS,
            "tactical_styles": TACTICAL_STYLES
        },
        "basketball": {
            "formations": BBALL_FORMATIONS,
            "tactical_styles": BBALL_STYLES
        }
    }
