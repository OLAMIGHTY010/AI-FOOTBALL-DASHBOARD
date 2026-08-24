import requests

FPL_BASE_URL = "https://fantasy.premierleague.com/api"

def get_fpl_bootstrap():
    try:
        res = requests.get(f"{FPL_BASE_URL}/bootstrap-static/", headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        return res.json()
    except Exception as e:
        print(f"Error fetching FPL bootstrap: {e}")
        return {"error": "Failed to fetch FPL data"}

def get_fpl_fixtures():
    try:
        res = requests.get(f"{FPL_BASE_URL}/fixtures/", headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        data = res.json()
        
        # Check if the API is returning old/future data (e.g., 2027 pre-season maintenance)
        if isinstance(data, list) and len(data) > 0:
            first_game = data[0]
            if first_game.get("kickoff_time") and "2027" in first_game.get("kickoff_time", ""):
                # Override with mock Gameweek 1 for 26/27 season (Aug 2026)
                mock_gw1 = [
                    {"id": 101, "event": 1, "finished": False, "kickoff_time": "2026-08-15T12:30:00Z", "team_h": 1, "team_a": 8, "team_h_score": None, "team_a_score": None},
                    {"id": 102, "event": 1, "finished": False, "kickoff_time": "2026-08-15T15:00:00Z", "team_h": 2, "team_a": 19, "team_h_score": None, "team_a_score": None},
                    {"id": 103, "event": 1, "finished": False, "kickoff_time": "2026-08-15T15:00:00Z", "team_h": 9, "team_a": 13, "team_h_score": None, "team_a_score": None},
                    {"id": 104, "event": 1, "finished": False, "kickoff_time": "2026-08-15T15:00:00Z", "team_h": 14, "team_a": 5, "team_h_score": None, "team_a_score": None},
                    {"id": 105, "event": 1, "finished": False, "kickoff_time": "2026-08-15T15:00:00Z", "team_h": 16, "team_a": 7, "team_h_score": None, "team_a_score": None},
                    {"id": 106, "event": 1, "finished": False, "kickoff_time": "2026-08-15T17:30:00Z", "team_h": 18, "team_a": 10, "team_h_score": None, "team_a_score": None},
                    {"id": 107, "event": 1, "finished": False, "kickoff_time": "2026-08-16T14:00:00Z", "team_h": 4, "team_a": 6, "team_h_score": None, "team_a_score": None},
                    {"id": 108, "event": 1, "finished": False, "kickoff_time": "2026-08-16T16:30:00Z", "team_h": 12, "team_a": 11, "team_h_score": None, "team_a_score": None},
                    {"id": 109, "event": 1, "finished": False, "kickoff_time": "2026-08-17T20:00:00Z", "team_h": 17, "team_a": 3, "team_h_score": None, "team_a_score": None},
                    {"id": 110, "event": 1, "finished": False, "kickoff_time": "2026-08-17T20:00:00Z", "team_h": 15, "team_a": 20, "team_h_score": None, "team_a_score": None}
                ]
                return mock_gw1
        
        return data
    except Exception as e:
        print(f"Error fetching FPL fixtures: {e}")
        return {"error": "Failed to fetch FPL fixtures"}

def get_fpl_league(league_id: int):
    try:
        res = requests.get(f"{FPL_BASE_URL}/leagues-classic/{league_id}/standings/", headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        return res.json()
    except Exception as e:
        print(f"Error fetching FPL league {league_id}: {e}")
        return {"error": "Failed to fetch league"}

def get_fpl_entry(entry_id: int):
    try:
        res = requests.get(f"{FPL_BASE_URL}/entry/{entry_id}/", headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        return res.json()
    except Exception as e:
        print(f"Error fetching FPL entry {entry_id}: {e}")
        return {"error": "Failed to fetch entry"}

def get_fpl_entry_history(entry_id: int):
    try:
        res = requests.get(f"{FPL_BASE_URL}/entry/{entry_id}/history/", headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        return res.json()
    except Exception as e:
        print(f"Error fetching FPL entry history {entry_id}: {e}")
        return {"error": "Failed to fetch entry history"}

def get_fpl_picks(entry_id: int, event_id: int):
    try:
        res = requests.get(f"{FPL_BASE_URL}/entry/{entry_id}/event/{event_id}/picks/", headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        return res.json()
    except Exception as e:
        print(f"Error fetching FPL picks for {entry_id} event {event_id}: {e}")
        return {"error": "Failed to fetch entry picks"}
