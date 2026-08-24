import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client = None

if url and key:
    supabase = create_client(url, key)
else:
    print("Warning: Supabase credentials not found. Database features will be disabled.")
