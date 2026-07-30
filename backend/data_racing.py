import random

# Virtual Horses for Racing Engine
# Attributes (1-100 scale):
# speed: Base cruising speed (impacts average distance per tick)
# acceleration: How fast they start and respond to bursts
# stamina: How well they maintain speed in the final 20% of the race

HORSES = [
    {"id": "h1", "name": "Thunderbolt", "speed": 92, "acceleration": 85, "stamina": 78},
    {"id": "h2", "name": "Midnight Runner", "speed": 85, "acceleration": 90, "stamina": 88},
    {"id": "h3", "name": "Golden Hoof", "speed": 88, "acceleration": 82, "stamina": 92},
    {"id": "h4", "name": "Silver Blaze", "speed": 89, "acceleration": 88, "stamina": 84},
    {"id": "h5", "name": "Desert Wind", "speed": 94, "acceleration": 95, "stamina": 70}, # Fast but fades
    {"id": "h6", "name": "Ironclad", "speed": 82, "acceleration": 75, "stamina": 98}, # Slow start, strong finish
    {"id": "h7", "name": "Shadowfax", "speed": 90, "acceleration": 89, "stamina": 86},
    {"id": "h8", "name": "Storm Chaser", "speed": 87, "acceleration": 85, "stamina": 87},
    {"id": "h9", "name": "Lucky Star", "speed": 86, "acceleration": 80, "stamina": 85},
    {"id": "h10", "name": "Crimson Comet", "speed": 91, "acceleration": 92, "stamina": 80},
    {"id": "h11", "name": "Pegasus Flight", "speed": 88, "acceleration": 86, "stamina": 90},
    {"id": "h12", "name": "Onyx Spirit", "speed": 84, "acceleration": 81, "stamina": 95}
]

def get_random_runners(num_runners=8):
    """Selects a random group of runners for a race."""
    return random.sample(HORSES, min(num_runners, len(HORSES)))
