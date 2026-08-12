import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tactics import get_tactics_data

def test_get_tactics_data():
    tactics = get_tactics_data()
    
    assert "football" in tactics
    assert "formations" in tactics["football"]
    
    # Check default formations
    formations = tactics["football"]["formations"]
    assert "4-3-3" in formations
    assert formations["4-3-3"]["attack_mod"] == 1.0
    
    # Check styles
    styles = tactics["football"]["tactical_styles"]
    assert "Gegenpress" in styles
    assert styles["Gegenpress"]["foul_mod"] == 1.2

from fastapi.testclient import TestClient
import uuid
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app

client = TestClient(app)

def test_save_and_load_tactics():
    user_id = str(uuid.uuid4())
    
    payload = {
        "user_id": user_id,
        "formation": "4-3-3",
        "style": "Gegenpress"
    }
    response = client.post("/api/tactics/save", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    if "error" in data and ("Database connection failed" in data["error"] or "PGRST205" in data["error"]):
        pytest.skip("Supabase not configured or missing table for test environment")
        
    assert data.get("success") == True

    response = client.get(f"/api/tactics/load?user_id={user_id}")
    assert response.status_code == 200
    load_data = response.json()
    assert load_data.get("formation") == "4-3-3"
    assert load_data.get("style") == "Gegenpress"

def test_ut_simulate_match():
    payload = {
        "squad": [
            {"name": "Messi", "rating": 94},
            {"name": "Ronaldo", "rating": 93},
            {"name": "Neymar", "rating": 90},
            {"name": "De Bruyne", "rating": 91},
            {"name": "Mbappe", "rating": 92},
            {"name": "Van Dijk", "rating": 90},
            {"name": "Kante", "rating": 89},
            {"name": "Salah", "rating": 90},
            {"name": "Alisson", "rating": 89},
            {"name": "Davies", "rating": 85},
            {"name": "Hakimi", "rating": 85}
        ]
    }
    response = client.post("/api/ut/simulate_match", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "match" in data
    match = data["match"]
    assert match["home"]["name"] == "My Ultimate Team"
    assert match["home"]["power"] > 88
    assert "events" in match
    assert isinstance(match["events"], list)

def test_ut_recommend():
    # Setup test payload
    payload = {
        "club": [
            {"name": "Benchwarmer", "rating": 50, "position": "FWD"},
        ],
        "squad": [
            {"name": "Starting Striker", "rating": 80, "position": "FWD"},
            {"name": "Starting GK", "rating": 85, "position": "GK"}
        ],
        "bankroll": 50000.0
    }
    
    # We don't have control over the global transfer market in the API exactly in this test without mocking,
    # but the logic should target "Starting Striker" (80 FWD) because they are the weakest in the SQUAD,
    # and ignore "Benchwarmer" (50 FWD) who is only in the club.
    response = client.post("/api/ut/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Check if the weakest identified was the starting striker
    assert data["weakest"]["name"] == "Starting Striker"
    assert data["weakest"]["rating"] == 80

