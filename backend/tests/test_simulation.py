import pytest
from simulation import calculate_all_odds, generate_fixtures, simulate_match

def test_calculate_all_odds():
    # Test valid teams
    home_team = {"name": "Arsenal", "power": 85}
    away_team = {"name": "Chelsea", "power": 84}
    
    odds = calculate_all_odds(home_team, away_team)
    
    # Check structure
    assert "1" in odds
    assert "X" in odds
    assert "2" in odds
    assert "O2.5" in odds
    assert "U2.5" in odds
    
    # Arsenal has a slight power advantage 85 vs 84. Arsenal is favorite.
    # Therefore home odds should be less than away odds
    assert odds["1"] < odds["2"]

def test_generate_fixtures():
    fixtures = generate_fixtures()
    assert len(fixtures) > 0
    
    match = fixtures[0]
    assert "id" in match
    assert "home" in match
    assert "away" in match
    assert "odds" in match
    
    # Ensure weather is set
    assert match["weather"] in ["Sunny", "Rain", "Snow"]

def test_simulate_match():
    home = {"name": "Liverpool", "power": 88, "star": "Salah", "league": "Premier League"}
    away = {"name": "Everton", "power": 78, "star": "Pickford", "league": "Premier League"}
    
    match = simulate_match(home, away, "Rain")
    
    assert isinstance(match, dict)
    
    # Verify every event has required keys
    assert "h_goals" in match
    assert "a_goals" in match
    assert "events" in match
