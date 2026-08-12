import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from ut import pull_random_player

client = TestClient(app)

def test_pull_random_player_stats():
    # Test that the 6 key stats are generated properly
    player = pull_random_player("Gold")
    
    assert "stats" in player
    stats = player["stats"]
    assert "PAC" in stats
    assert "SHO" in stats
    assert "PAS" in stats
    assert "DRI" in stats
    assert "DEF" in stats
    assert "PHY" in stats
    
    # Ensure stats are within 20-99 bounds
    for stat_val in stats.values():
        assert 20 <= stat_val <= 99

def test_open_ut_pack():
    # Mock authentication dependencies
    app.dependency_overrides = {}
    from auth import get_current_user
    
    def override_get_current_user():
        return {"id": "test-user-id", "email": "test@test.com"}
        
    app.dependency_overrides[get_current_user] = override_get_current_user

    response = client.post("/api/ut/pack", json={"pack_type": "gold"})
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["pack_name"] == "gold"
    assert "cards" in data
    assert len(data["cards"]) == 5
    
    # Gold pack guarantees at least 1 Gold
    has_gold_or_better = any(c["rarity"] in ["Gold", "Icon"] for c in data["cards"])
    assert has_gold_or_better
    
    app.dependency_overrides = {}

def test_ut_market():
    # List a player
    list_payload = {
        "player": {"id": "test_1", "name": "Test Player", "rating": 80, "rarity": "Gold"},
        "price": 1000,
        "seller_id": "user1"
    }
    response = client.post("/api/ut/market/list", json=list_payload)
    assert response.status_code == 200
    assert response.json()["success"] == True

    # Check market
    res_market = client.get("/api/ut/market")
    listings = res_market.json()["listings"]
    assert len(listings) >= 1
    listing_id = listings[-1]["id"]

    # Buy a player
    buy_payload = {
        "listing_id": listing_id,
        "buyer_id": "user2"
    }
    res_buy = client.post("/api/ut/market/buy", json=buy_payload)
    assert res_buy.status_code == 200
    assert res_buy.json()["success"] == True

def test_ut_sbc():
    # Submit SBC
    players = [
        {"id": f"p{i}", "name": f"P{i}", "rating": 76, "team": f"Team{i % 4}"}
        for i in range(11)
    ]
    res = client.post("/api/ut/sbc/submit", json={"players": players})
    assert res.status_code == 200
    assert res.json()["success"] == True
    assert "reward" in res.json()

def test_ut_evolve():
    player = {"id": "p1", "name": "Bronze Player", "rating": 64, "rarity": "Bronze"}
    res = client.post("/api/ut/evolve", json={"player": player})
    assert res.status_code == 200
    assert res.json()["success"] == True
    assert res.json()["player"]["rating"] == 67

def test_ut_simulate_match():
    squad = [
        {"id": f"p{i}", "name": f"P{i}", "rating": 80, "position": "MID"}
        for i in range(11)
    ]
    res = client.post("/api/ut/simulate_match", json={"squad": squad, "user_id": "local_user"})
    assert res.status_code == 200
    assert res.json()["success"] == True
    assert "match" in res.json()
