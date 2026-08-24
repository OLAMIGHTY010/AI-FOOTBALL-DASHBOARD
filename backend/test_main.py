from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch, MagicMock

client = TestClient(app)

def test_read_standings():
    response = client.get("/api/standings?sport=football")
    assert response.status_code == 200
    data = response.json()
    assert "Premier League" in data
    assert isinstance(data["Premier League"], dict)
    assert len(data["Premier League"]) > 0
    assert "Man City" in data["Premier League"]
    assert "Pts" in data["Premier League"]["Man City"]

@patch("main.supabase")
def test_init_profile_existing(mock_supabase):
    # Mock supabase response for existing user
    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [{"id": "test_user_1", "bankroll": 500, "username": "Manager_test"}]
    mock_supabase.table.return_value.select.return_value.eq.return_value = mock_execute

    response = client.post("/api/profile/init", json={"user_id": "test_user_1"})
    assert response.status_code == 200
    assert response.json() == {"id": "test_user_1", "bankroll": 500, "username": "Manager_test"}

@patch("main.supabase")
def test_init_profile_new(mock_supabase):
    # Mock supabase response for new user
    mock_select_execute = MagicMock()
    mock_select_execute.execute.return_value.data = []
    mock_supabase.table.return_value.select.return_value.eq.return_value = mock_select_execute
    
    mock_insert_execute = MagicMock()
    mock_insert_execute.execute.return_value = None
    mock_supabase.table.return_value.insert.return_value = mock_insert_execute

    response = client.post("/api/profile/init", json={"user_id": "new_user_123"})
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "new_user_123"
    assert data["bankroll"] == 1000
    assert data["username"] == "Manager_new_user"

def test_get_fpl_recommender():
    response = client.get("/api/fpl/recommender")
    assert response.status_code == 200
    data = response.json()
    assert "buys" in data
    assert "sells" in data
    assert isinstance(data["buys"], list)
    assert isinstance(data["sells"], list)

def test_simulate_football():
    response = client.post("/api/simulate", json={})
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "next_fixtures" in data
    assert isinstance(data["results"], list)
    if len(data["results"]) > 0:
        assert "home" in data["results"][0]
        assert "away" in data["results"][0]
        assert "h_goals" in data["results"][0]
        assert "a_goals" in data["results"][0]
