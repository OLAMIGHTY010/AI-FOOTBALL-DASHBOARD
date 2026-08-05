import asyncio
from database import supabase
from datetime import datetime, timedelta

async def seed_gameweeks():
    print("Seeding gameweeks...")
    
    # Check if gameweeks exist
    resp = supabase.table("gameweeks").select("id").execute()
    if len(resp.data) > 0:
        print("Gameweeks already exist.")
        return
        
    start_time = datetime.now() + timedelta(days=2) # Deadline in 2 days
    
    gameweeks = []
    for i in range(1, 39):
        gw_time = start_time + timedelta(days=7*(i-1))
        gameweeks.append({
            "id": i,
            "name": f"Gameweek {i}",
            "deadline_time": gw_time.isoformat(),
            "is_current": (i == 1),
            "is_finished": False
        })
        
    res = supabase.table("gameweeks").insert(gameweeks).execute()
    print(f"Inserted {len(gameweeks)} gameweeks.")

if __name__ == "__main__":
    asyncio.run(seed_gameweeks())
