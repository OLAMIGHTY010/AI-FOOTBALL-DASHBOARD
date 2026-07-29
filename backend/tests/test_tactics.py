import pytest
from tactics import get_tactics_data

def test_get_tactics_data():
    tactics = get_tactics_data()
    
    assert "formations" in tactics
    assert "tactical_styles" in tactics
    
    # Check default formations
    formations = tactics["formations"]
    assert "4-3-3" in formations
    assert formations["4-3-3"]["attack_mod"] == 1.0
    
    # Check styles
    styles = tactics["tactical_styles"]
    assert "Gegenpress" in styles
    assert styles["Gegenpress"]["foul_mod"] == 1.2

