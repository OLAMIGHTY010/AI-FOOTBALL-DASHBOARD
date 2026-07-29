import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/api/teams")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

def test_sportsbook_fixtures():
    response = client.get("/api/fixtures")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "home" in data[0]
        assert "odds" in data[0]

def test_real_standings():
    response = client.get("/api/real-standings")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)

def test_fpl_analyze():
    payload = {
        "standings": {
            "Premier League": {
                "Team A": {"Pts": 10, "GD": 5},
                "Team B": {"Pts": 2, "GD": -5}
            }
        }
    }
    response = client.post("/api/fpl/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "report" in data

def test_tactics_config():
    response = client.get("/api/tactics")
    assert response.status_code == 200
    data = response.json()
    assert "formations" in data
    assert "tactical_styles" in data

def test_simulate_live():
    response = client.post("/api/simulate", json={"fixture_ids": []})
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "next_fixtures" in data
