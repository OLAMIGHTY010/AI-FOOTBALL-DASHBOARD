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
