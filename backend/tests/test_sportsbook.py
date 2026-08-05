import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)

def test_place_parlay_and_cashout():
    # Place a parlay bet
    bet_payload = {
        "legs": [
            {"fixtureId": "fixture1", "market": "1", "odds": 2.0},
            {"fixtureId": "fixture2", "market": "O2.5", "odds": 1.5}
        ],
        "wager": 100.0,
        "user_id": "test_user_id"
    }
    
    response = client.post("/api/bet/parlay", json=bet_payload)
    assert response.status_code == 200
    bet_data = response.json()
    assert bet_data["status"] == "PENDING"
    assert bet_data["potential_payout"] == 300.0
    bet_id = bet_data["id"]
    
    # Check history
    history_resp = client.get(f"/api/bet/history?user_id=test_user_id")
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history["pending"]) > 0
    
    # Cashout the bet
    cashout_payload = {
        "bet_id": bet_id,
        "cash_out_amount": 150.0,
        "user_id": "test_user_id"
    }
    cashout_resp = client.post("/api/bet/cashout", json=cashout_payload)
    assert cashout_resp.status_code == 200
    cashout_data = cashout_resp.json()
    assert cashout_data["status"] == "CASH OUT"
    
    # Verify it moved to settled
    history_resp2 = client.get(f"/api/bet/history?user_id=test_user_id")
    assert history_resp2.status_code == 200
    history2 = history_resp2.json()
    
    assert any(b["id"] == bet_id for b in history2["settled"])
    assert not any(b["id"] == bet_id for b in history2["pending"])
