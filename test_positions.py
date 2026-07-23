import json
import pandas as pd

def generate_smart_team(formation="4-3-3"):
    with open("data/players.json", "r") as f:
        df = pd.DataFrame(json.load(f))
    parts = list(map(int, formation.split('-')))
    num_def = parts[0]
    num_mid = parts[1]
    num_fwd = parts[2]
    
    gk = df[df['position'].str.lower() == 'goalkeeper'].sample(1)
    defs = df[df['position'].str.lower() == 'defender'].sample(n=min(num_def, len(df[df['position'].str.lower() == 'defender'])))
    mids = df[df['position'].str.lower() == 'midfielder'].sample(n=min(num_mid, len(df[df['position'].str.lower() == 'midfielder'])))
    fwds = df[df['position'].str.lower() == 'attacker'].sample(n=min(num_fwd, len(df[df['position'].str.lower() == 'attacker'])))
    
    return pd.concat([fwds, mids, defs, gk]).reset_index(drop=True)

team = generate_smart_team()
print(f"Team length: {len(team)}")

parts = [4, 3, 3]
fwd_count, mid_count, def_count = parts[2], parts[1], parts[0]
def gen_row(count, top):
    return [{"top": top, "left": f"{(100 / (count + 1)) * i}%"} for i in range(1, count + 1)]
    
positions = gen_row(fwd_count, 15) + gen_row(mid_count, 40) + gen_row(def_count, 68) + [{"top": 88, "left": "50%"}]
print(f"Positions length: {len(positions)}")

for idx, row in team.iterrows():
    pos = positions[idx] if idx < len(positions) else {"top": 50, "left": "50%"}
    print(f"Idx {idx}: {row['name']} ({row['position']}) -> {pos}")
