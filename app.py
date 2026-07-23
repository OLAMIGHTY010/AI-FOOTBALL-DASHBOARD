import streamlit as st
import pandas as st_pd
import pandas as pd
import json
import random

st.set_page_config(page_title="Player Dashboard", layout="wide", initial_sidebar_state="expanded")

# --- DATA LOADING ---
@st.cache_data
def load_data():
    with open("data/players.json", "r") as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    # Ensure columns exist
    for col in ['name', 'photo', 'position', 'age', 'citizenship', 'height', 'club', 'form']:
        if col not in df.columns:
            df[col] = None
            
    # Clean form rating
    df['form'] = pd.to_numeric(df['form'], errors='coerce')
    df['age'] = pd.to_numeric(df['age'], errors='coerce')
    return df

df = load_data()

# --- UTILS ---
def generate_summary(row):
    parts = []
    if pd.notna(row['name']):
        age_str = f"{int(row['age'])}-year-old" if pd.notna(row['age']) else ""
        nat_str = row['citizenship'] if pd.notna(row['citizenship']) else ""
        pos_str = str(row['position']).lower() if pd.notna(row['position']) else "player"
        
        intro = f"{row['name']} is a {age_str} {nat_str} {pos_str}".strip().replace("  ", " ")
        club_str = f" at {row['club']}" if pd.notna(row['club']) else ""
        parts.append(f"{intro}{club_str}.")
        
    if pd.notna(row['form']):
        f = row['form']
        if f >= 8.0:
            parts.append("They are currently in strong form.")
        elif 6.0 <= f <= 7.9:
            parts.append("They are currently showing consistent form.")
        else:
            parts.append("They are currently building form.")
            
    parts.append("This profile is based on the available dataset only.")
    return " ".join(parts)

def generate_smart_team(formation="4-4-2"):
    parts = list(map(int, formation.split('-')))
    num_def = parts[0]
    num_mid = parts[1]
    num_fwd = parts[2]
    
    gk = df[df['position'].str.lower() == 'goalkeeper'].sample(1) if not df[df['position'].str.lower() == 'goalkeeper'].empty else pd.DataFrame()
    defs = df[df['position'].str.lower() == 'defender'].sample(n=min(num_def, len(df[df['position'].str.lower() == 'defender'])))
    mids = df[df['position'].str.lower() == 'midfielder'].sample(n=min(num_mid, len(df[df['position'].str.lower() == 'midfielder'])))
    fwds = df[df['position'].str.lower() == 'attacker'].sample(n=min(num_fwd, len(df[df['position'].str.lower() == 'attacker'])))
    
    return pd.concat([fwds, mids, defs, gk]).reset_index(drop=True)

# --- CSS FOR PITCH ---
def render_pitch(team_df, formation):
    # We inject raw HTML/CSS to draw the field, replicating the React version
    pitch_css = """
    <style>
    .pitch-container {
        position: relative;
        width: 500px;
        height: 750px;
        margin: 40px auto;
    }
    .pitch {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(to bottom, #4d8c36, #3b6d28);
        border: 3px solid white;
        box-shadow: inset 0 0 20px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.2);
        box-sizing: border-box;
        overflow: hidden;
    }
    .line { position: absolute; border: 2px solid white; box-sizing: border-box; }
    
    .player-node {
        position: absolute;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 10;
    }
    .player-photo {
        width: 50px; height: 50px; border-radius: 50%;
        object-fit: cover; border: 2px solid white; background-color: white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
    .player-name {
        margin-top: 5px; background: rgba(0,0,0,0.6); color: white;
        padding: 2px 6px; border-radius: 4px; font-size: 10px;
        white-space: nowrap;
    }
    .tooltip .tooltiptext {
      visibility: hidden;
      width: 140px;
      background-color: #333;
      color: #fff;
      text-align: center;
      border-radius: 6px;
      padding: 5px;
      position: absolute;
      z-index: 100;
      bottom: 125%; 
      left: 50%; 
      margin-left: -70px;
      opacity: 0;
      transition: opacity 0.3s;
      font-size: 10px;
    }
    .tooltip:hover .tooltiptext {
      visibility: visible;
      opacity: 1;
    }
    </style>
    """
    
    parts = list(map(int, formation.split('-')))
    fwd_count, mid_count, def_count = parts[2], parts[1], parts[0]
    
    def gen_row(count, top):
        return [{"top": top, "left": f"{int((100 / (count + 1)) * i)}%"} for i in range(1, count + 1)]
        
    positions = gen_row(fwd_count, 15) + gen_row(mid_count, 40) + gen_row(def_count, 68) + [{"top": 88, "left": "50%"}]
    
    players_html = ""
    for idx, row in team_df.iterrows():
        pos = positions[idx] if idx < len(positions) else {"top": 50, "left": "50%"}
        photo = row['photo'] if pd.notna(row['photo']) else 'https://via.placeholder.com/50'
        name = row['name']
        f_pos = row['position']
        age = row['age']
        form = row['form']
        
        players_html += f"""<div class="player-node tooltip" style="top: {pos['top']}%; left: {pos['left']};">
<img class="player-photo" src="{photo}" />
<div class="player-name">{name}</div>
<span class="tooltiptext">Pos: {f_pos}<br>Age: {age}<br>Form: {form}</span>
</div>"""
        
    pitch_html = f"""
{pitch_css}
<div class="pitch-container">
<div class="line" style="top: -20px; left: 50%; transform: translateX(-50%); width: 120px; height: 20px; background: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 10px);"></div>
<div class="line" style="bottom: -20px; left: 50%; transform: translateX(-50%); width: 120px; height: 20px; background: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 10px);"></div>
<div class="pitch">
<div class="line" style="top: 50%; left: 0; width: 100%; height: 0; transform: translateY(-50%);"></div>
<div class="line" style="top: 50%; left: 50%; width: 100px; height: 100px; border-radius: 50%; transform: translate(-50%, -50%);"></div>
<div style="position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; background: white; border-radius: 50%; transform: translate(-50%, -50%);"></div>
<div class="line" style="top: -2px; left: 50%; transform: translateX(-50%); width: 240px; height: 120px;"></div>
<div class="line" style="top: -2px; left: 50%; transform: translateX(-50%); width: 100px; height: 40px;"></div>
<div style="position: absolute; top: 90px; left: 50%; width: 6px; height: 6px; background: white; border-radius: 50%; transform: translateX(-50%);"></div>
<div style="position: absolute; top: 118px; left: 50%; width: 80px; height: 40px; transform: translateX(-50%); overflow: hidden;">
<div style="position: absolute; top: -40px; left: 0; width: 80px; height: 80px; border: 2px solid white; border-radius: 50%; box-sizing: border-box;"></div>
</div>
<div class="line" style="bottom: -2px; left: 50%; transform: translateX(-50%); width: 240px; height: 120px;"></div>
<div class="line" style="bottom: -2px; left: 50%; transform: translateX(-50%); width: 100px; height: 40px;"></div>
<div style="position: absolute; bottom: 90px; left: 50%; width: 6px; height: 6px; background: white; border-radius: 50%; transform: translateX(-50%);"></div>
<div style="position: absolute; bottom: 118px; left: 50%; width: 80px; height: 40px; transform: translateX(-50%); overflow: hidden;">
<div style="position: absolute; bottom: -40px; left: 0; width: 80px; height: 80px; border: 2px solid white; border-radius: 50%; box-sizing: border-box;"></div>
</div>
<div class="line" style="top: -15px; left: -15px; width: 30px; height: 30px; border-radius: 50%;"></div>
<div class="line" style="top: -15px; right: -15px; width: 30px; height: 30px; border-radius: 50%;"></div>
<div class="line" style="bottom: -15px; left: -15px; width: 30px; height: 30px; border-radius: 50%;"></div>
<div class="line" style="bottom: -15px; right: -15px; width: 30px; height: 30px; border-radius: 50%;"></div>
</div>
{players_html}
</div>
"""
    import streamlit.components.v1 as components
    with open("debug_pitch.html", "w") as f:
        f.write(pitch_html)
    components.html(pitch_html, height=850)


# --- UI ---
page = st.sidebar.selectbox("Navigation", ["Player Browser (Compare)", "Team Formation"])

if page == "Player Browser (Compare)":
    st.title("Player Comparison Tool")
    
    col1, col2 = st.columns(2)
    
    def render_selector(col, id_suffix):
        with col:
            st.subheader(f"Player {id_suffix}")
            search = st.text_input("Search players...", key=f"search_{id_suffix}")
            pos_filter = st.selectbox("Position", ["All", "Attacker", "Midfielder", "Defender", "Goalkeeper"], key=f"pos_{id_suffix}")
            sort_by = st.selectbox("Sort by", ["Name (A-Z)", "Name (Z-A)", "Age (Youngest)", "Age (Oldest)", "Form Rating (Highest)", "Form Rating (Lowest)"], key=f"sort_{id_suffix}")
            
            # Apply filters
            filtered = df.copy()
            if search:
                filtered = filtered[filtered['name'].str.contains(search, case=False, na=False)]
            if pos_filter != "All":
                filtered = filtered[filtered['position'].str.lower() == pos_filter.lower()]
                
            # Sort
            if sort_by == "Name (A-Z)": filtered = filtered.sort_values('name', ascending=True)
            elif sort_by == "Name (Z-A)": filtered = filtered.sort_values('name', ascending=False)
            elif sort_by == "Age (Youngest)": filtered = filtered.sort_values('age', ascending=True)
            elif sort_by == "Age (Oldest)": filtered = filtered.sort_values('age', ascending=False)
            elif sort_by == "Form Rating (Highest)": filtered = filtered.sort_values('form', ascending=False)
            elif sort_by == "Form Rating (Lowest)": filtered = filtered.sort_values('form', ascending=True)
            
            player_names = filtered['name'].tolist()
            selected_name = st.selectbox("Select Player", ["Select a player..."] + player_names, key=f"sel_{id_suffix}")
            
            if selected_name != "Select a player...":
                player = df[df['name'] == selected_name].iloc[0]
                
                # Card UI
                st.markdown("---")
                st.image(player['photo'] if pd.notna(player['photo']) else 'https://via.placeholder.com/150', width=120)
                st.markdown(f"### {player['name']}")
                st.markdown(f"**Position:** {player['position']}")
                st.markdown(f"**Age:** {int(player['age']) if pd.notna(player['age']) else '—'}")
                st.markdown(f"**Nationality:** {player['citizenship']}")
                st.markdown(f"**Club:** {player['club']}")
                st.markdown(f"**Form Rating:** {player['form']} / 10")
                
                # Summary
                st.markdown("---")
                st.markdown("##### AI-Generated Summary")
                st.info(generate_summary(player))
                st.caption("This summary is based only on the loaded dataset.")
                
    render_selector(col1, "1")
    render_selector(col2, "2")
    
elif page == "Team Formation":
    st.title("Team Formation Visualizer")
    
    col1, col2 = st.columns([1, 1])
    with col1:
        formation = st.selectbox("Choose Tactical Formation", ["4-4-2", "4-3-3", "3-5-2"])
        
    # Auto-regenerate team if formation changes
    if 'current_formation' not in st.session_state or st.session_state.current_formation != formation:
        st.session_state.team = generate_smart_team(formation)
        st.session_state.current_formation = formation
        
    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("Generate Smart Team"):
            st.session_state.team = generate_smart_team(formation)
            
    render_pitch(st.session_state.team, formation)
