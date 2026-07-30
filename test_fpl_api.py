import requests

try:
    res = requests.get("https://fantasy.premierleague.com/api/bootstrap-static/", timeout=5)
    print(f"Status: {res.status_code}")
except Exception as e:
    print(f"Error: {e}")
