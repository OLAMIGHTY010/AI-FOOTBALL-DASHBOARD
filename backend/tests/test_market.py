import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)

@patch("main.supabase")
def test_simulate_market_fluctuations(mock_supabase):
    # Mock authentication dependencies
    app.dependency_overrides = {}  # Clear previous overrides if any
    from auth import get_current_user
    
    def override_get_current_user():
        return {"id": "test-user-id", "email": "test@test.com"}
        
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    # Mock DB response for players
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    
    # Mock select
    mock_select = MagicMock()
    mock_table.select.return_value = mock_select
    mock_execute = MagicMock()
    mock_select.execute.return_value = mock_execute
    
    # Provide mock players data
    # Player 1: High ownership (should rise)
    # Player 2: Low ownership (should fall)
    # Player 3: Medium ownership (might stay)
    mock_execute.data = [
        {"id": 1, "current_price": 10.0, "selected_by_percent": 20.0},
        {"id": 2, "current_price": 5.0, "selected_by_percent": 1.0},
        {"id": 3, "current_price": 7.5, "selected_by_percent": 10.0}
    ]
    
    # Mock upsert
    mock_upsert = MagicMock()
    mock_table.upsert.return_value = mock_upsert
    
    # Force random to return specific values so we know the outcome
    with patch("random.random", side_effect=[0.9, 0.9, 0.9, 0.9]):
        # p1: random > 0.3 -> rise (0.1)
        # p2: random > 0.6 -> drop (-0.1)
        # p3: random > 0.8 -> rise (0.1)
        response = client.post("/api/v1/market/simulate-fluctuations")
        
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    
    # Verify upsert was called with expected data
    mock_table.upsert.assert_called_once()
    upsert_args = mock_table.upsert.call_args[0][0]
    
    # Verify prices updated correctly
    p1_update = next(u for u in upsert_args if u["id"] == 1)
    p2_update = next(u for u in upsert_args if u["id"] == 2)
    p3_update = next(u for u in upsert_args if u["id"] == 3)
    
    assert p1_update["current_price"] == 10.1
    assert p2_update["current_price"] == 4.9
    assert p3_update["current_price"] == 7.6
    
    # Clean up overrides
    app.dependency_overrides = {}
