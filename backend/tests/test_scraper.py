import pytest
from scraper import get_real_standings, MOCK_DATA

def test_get_real_standings():
    # Test valid league
    all_standings = get_real_standings()
    assert isinstance(all_standings, dict)
    assert len(all_standings) > 0
    
    premier_league = all_standings.get("Premier League")
    assert isinstance(premier_league, list)
    assert len(premier_league) > 0
    
    # Verify the structure for a team
    man_city = next((team for team in premier_league if team["Team"] == "Manchester City"), None)
    assert man_city is not None
    assert "GP" in man_city
    assert "Pts" in man_city

def test_mock_data_structure():
    # Verify MOCK_DATA has the expected leagues
    expected_leagues = [
        "Premier League",
        "LaLiga",
        "Serie A",

        "Chinese Super League",
        "MLS",
        "Saudi Pro League"
    ]
    for league in expected_leagues:
        assert league in MOCK_DATA
