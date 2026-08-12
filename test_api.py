import requests
import json
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("API_FOOTBALL_KEY")

headers = {
    "x-apisports-key": api_key
}

res = requests.get("https://v3.football.api-sports.io/players/squads?team=85", headers=headers)
print(json.dumps(res.json(), indent=2))
