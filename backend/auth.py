from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import supabase

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    FastAPI dependency that extracts the JWT token from the Authorization header,
    and verifies it using Supabase. Returns the Supabase user object if valid.
    """
    token = credentials.credentials
    try:
        # Supabase auth.get_user() validates the JWT on the server side
        user_resp = supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        return user_resp.user
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
