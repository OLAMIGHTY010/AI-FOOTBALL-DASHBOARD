import random

# Virtual Cars for Racing Engine
# Attributes (1-100 scale):
# speed: Base cruising speed (impacts average distance per tick)
# acceleration: How fast they start and respond to bursts
# stamina: Fuel efficiency / Tire wear (How well they maintain speed in the final 20% of the race)

CARS = [
    {"id": "c1", "name": "Apex Predator", "speed": 92, "acceleration": 85, "stamina": 78},
    {"id": "c2", "name": "Midnight Runner", "speed": 85, "acceleration": 90, "stamina": 88},
    {"id": "c3", "name": "Golden Pistons", "speed": 88, "acceleration": 82, "stamina": 92},
    {"id": "c4", "name": "Silver Blaze", "speed": 89, "acceleration": 88, "stamina": 84},
    {"id": "c5", "name": "Desert Wind", "speed": 94, "acceleration": 95, "stamina": 70}, # Fast but high tire wear
    {"id": "c6", "name": "Ironclad V8", "speed": 82, "acceleration": 75, "stamina": 98}, # Slow start, strong finish
    {"id": "c7", "name": "Shadowfax GT", "speed": 90, "acceleration": 89, "stamina": 86},
    {"id": "c8", "name": "Storm Chaser", "speed": 87, "acceleration": 85, "stamina": 87},
    {"id": "c9", "name": "Lucky Star RS", "speed": 86, "acceleration": 80, "stamina": 85},
    {"id": "c10", "name": "Crimson Comet", "speed": 91, "acceleration": 92, "stamina": 80},
    {"id": "c11", "name": "Pegasus Flight", "speed": 88, "acceleration": 86, "stamina": 90},
    {"id": "c12", "name": "Onyx Spirit", "speed": 84, "acceleration": 81, "stamina": 95}
]

def get_random_runners(num_runners=8):
    """Selects a random group of cars for a race."""
    return random.sample(CARS, min(num_runners, len(CARS)))
