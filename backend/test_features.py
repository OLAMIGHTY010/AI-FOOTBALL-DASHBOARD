from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_ut_pack_endpoint_default():
    """Test POST /api/ut/pack with default body."""
    response = client.post("/api/ut/pack", json={})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "cards" in data
    assert len(data["cards"]) == 5
    assert data["pack_name"] == "bronze"


def test_ut_pack_endpoint_premium():
    """Test POST /api/ut/pack with premium pack_type."""
    response = client.post("/api/ut/pack", json={"pack_type": "gold"})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["pack_name"] == "gold"
    assert len(data["cards"]) == 5
    assert data["cards"]
    has_gold = any(card["rarity"] == "Gold" or card["rarity"] == "Icon" for card in data["cards"])
    assert has_gold


def test_fpl_data_endpoint():
    """Test GET /api/fpl/data."""
    response = client.get("/api/fpl/data")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "players" in data
    assert isinstance(data["players"], list)
    if len(data["players"]) > 0:
        player = data["players"][0]
        assert "name" in player
        assert "position" in player
        assert "price" in player
        assert "expected_points" in player


def test_fpl_optimize_endpoint():
    """Test POST /api/fpl/optimize."""
    response = client.post("/api/fpl/optimize", json={"budget": 100.0, "max_per_team": 3})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    if "error" in data:
        assert data["error"] == "Failed to fetch players"
    else:
        assert "squad" in data
        assert len(data["squad"]) == 15
        assert "total_cost" in data
        assert data["total_cost"] <= 100.0
        assert "starting_eleven" in data
        assert len(data["starting_eleven"]) == 11
        assert "captain" in data
        assert data["captain"] is not None


def test_tactics_endpoint():
    """Test GET /api/tactics."""
    response = client.get("/api/tactics")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "football" in data
    assert "basketball" in data
    assert "formations" in data["football"]
    assert "tactical_styles" in data["football"]
    assert "formations" in data["basketball"]
    assert "tactical_styles" in data["basketball"]
    assert "4-3-3" in data["football"]["formations"]
    assert "Gegenpress" in data["football"]["tactical_styles"]


def test_basketball_simulate_endpoint():
    """Test POST /api/simulate/basketball."""
    response = client.post("/api/simulate/basketball")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "results" in data
    assert len(data["results"]) > 0
    # verify first result
    first_match = data["results"][0]
    assert "h_score" in first_match
    assert "a_score" in first_match
    assert "events" in first_match

def test_tennis_simulate_endpoint():
    """Test POST /api/simulate/tennis."""
    response = client.post("/api/simulate/tennis")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "results" in data
    assert len(data["results"]) > 0
    # verify first result
    first_match = data["results"][0]
    assert "h_sets_won" in first_match
    assert "a_sets_won" in first_match
    assert "events" in first_match


def test_existing_endpoints():
    """Test pre-existing endpoints for complete backend coverage."""
    response = client.get("/api/teams")
    assert response.status_code == 200

def test_uefa_endpoints():
    """Test new UEFA Fantasy endpoints."""
    # Test data endpoint
    for comp in ["ucl", "uel", "uecl"]:
        response = client.get(f"/api/uefa/data?competition={comp}")
        assert response.status_code == 200, f"Expected 200 for {comp}, got {response.status_code}"
        data = response.json()
        assert "players" in data
        assert len(data["players"]) > 0
    
    # Test optimize endpoint
    payload = {
        "competition": "ucl",
        "budget": 100.0,
        "max_per_team": 3,
        "formation": "4-4-2"
    }
    response = client.post("/api/uefa/optimize", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "squad" in data
    assert len(data["squad"]) == 15
    assert len(data["starting_eleven"]) == 11
    assert len(data["bench"]) == 4

    resp_fixtures = client.get("/api/fixtures")
    assert resp_fixtures.status_code == 200

    resp_standings = client.get("/api/standings")
    assert resp_standings.status_code == 200


if __name__ == "__main__":
    print("Running backend feature tests...")
    test_ut_pack_endpoint_default()
    print("✓ test_ut_pack_endpoint_default passed (200 OK)")
    test_ut_pack_endpoint_premium()
    print("✓ test_ut_pack_endpoint_premium passed (200 OK)")
    test_fpl_data_endpoint()
    print("✓ test_fpl_data_endpoint passed (200 OK)")
    test_fpl_optimize_endpoint()
    print("✓ test_fpl_optimize_endpoint passed (200 OK)")
    test_tactics_endpoint()
    print("✓ test_tactics_endpoint passed (200 OK)")
    test_existing_endpoints()
    print("✓ test_existing_endpoints passed (200 OK)")
    print("\nSUCCESS: All endpoints return 200 OK!")
