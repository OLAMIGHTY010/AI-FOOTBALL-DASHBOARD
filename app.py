import streamlit as st
import pandas as st_pd
import pandas as pd
import json
import random
import os
import requests
import datetime
from dotenv import load_dotenv
import plotly.graph_objects as go
import math
from supabase import create_client, Client

load_dotenv()
API_KEY = os.getenv("API_FOOTBALL_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        if "access_token" in st.session_state and "refresh_token" in st.session_state:
            try:
                supabase.auth.set_session(st.session_state.access_token, st.session_state.refresh_token)
            except Exception:
                pass
    else:
        supabase = None
except Exception as e:
    supabase = None

import sportsbook
import tactics

st.set_page_config(
    page_title="Player Dashboard", layout="wide", initial_sidebar_state="expanded"
)

if "user" not in st.session_state:
    st.session_state.user = None

if not st.session_state.user:
    st.title("🔐 AI Football Dashboard")
    st.markdown("Please log in or sign up to access the real-money platform.")

    tab_login, tab_signup = st.tabs(["Login", "Sign Up"])

    with tab_login:
        st.subheader("Login to your account")
        with st.form("login_form"):
            login_email = st.text_input("Email")
            login_password = st.text_input("Password", type="password")
            
            login_submit = st.form_submit_button("Login", type="primary", use_container_width=True)
            if login_submit:
                if not login_email or not login_password:
                    st.error("Please provide both email and password.")
                elif supabase:
                    try:
                        res = supabase.auth.sign_in_with_password(
                            {"email": login_email, "password": login_password}
                        )
                        st.session_state.user = res.user
                        st.session_state.access_token = res.session.access_token
                        st.session_state.refresh_token = res.session.refresh_token
                        
                        wallet_res = (
                            supabase.table("wallets")
                            .select("balance, country")
                            .eq("user_id", res.user.id)
                            .execute()
                        )
                        if wallet_res.data:
                            st.session_state.bankroll = float(wallet_res.data[0]["balance"])
                            st.session_state.user_country = wallet_res.data[0].get("country", "Unknown")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Login Failed: {e}")
                else:
                    st.error("Supabase is not configured.")

        st.markdown("---")
        st.markdown("### Or Login with Google")
        if st.button("Sign in with Google 🌐", use_container_width=True):
            if supabase:
                try:
                    res = supabase.auth.sign_in_with_oauth(
                        {
                            "provider": "google",
                            "options": {"redirect_to": "http://localhost:8501"},
                        }
                    )
                    st.success(
                        f"Redirecting to Google... Please click [here]({res.url}) if you are not redirected automatically."
                    )
                except Exception as e:
                    st.error(f"Google OAuth failed: {e}")

    with tab_signup:
        st.subheader("Create a new account")
        with st.form("signup_form"):
            signup_first = st.text_input("First Name")
            signup_last = st.text_input("Last Name")
            signup_phone = st.text_input("Phone Number")
            signup_dob = st.date_input(
                "Date of Birth",
                min_value=datetime.date(1900, 1, 1),
                max_value=datetime.date.today(),
            )

            signup_country = st.selectbox(
                "Country of Residence",
                [
                    "United States",
                    "United Kingdom",
                    "Nigeria",
                    "Ghana",
                    "South Africa",
                    "Canada",
                    "Australia",
                    "Other",
                ]
            )

            signup_email = st.text_input("Email")
            signup_password = st.text_input("Password", type="password")

            signup_submit = st.form_submit_button("Sign Up", type="primary", use_container_width=True)
            if signup_submit:
                if not signup_email or not signup_password:
                    st.error("Please provide an email and password.")
                elif supabase:
                    try:
                        res = supabase.auth.sign_up(
                            {
                                "email": signup_email,
                                "password": signup_password,
                                "options": {
                                    "data": {
                                        "first_name": signup_first,
                                        "last_name": signup_last,
                                        "phone": signup_phone,
                                        "dob": str(signup_dob),
                                        "country": signup_country,
                                    }
                                },
                            }
                        )
                        st.success("Sign up successful! Please check your email inbox to confirm your account before logging in.")
                    except Exception as e:
                        st.error(f"Sign Up Failed: {e}")
                else:
                    st.error("Supabase is not configured.")

    st.stop()

# ----------------- PROFILE COMPLETION GATE -----------------
# If the user logged in via Google, they might be missing KYC data
meta = (
    st.session_state.user.user_metadata
    if hasattr(st.session_state.user, "user_metadata")
    else {}
)
if not meta.get("country") or not meta.get("dob") or not meta.get("phone"):
    st.title("Finish Your Profile")
    st.markdown(
        "We need a few more details for KYC compliance before you can place bets."
    )

    comp_phone = st.text_input("Phone Number")
    comp_dob = st.date_input(
        "Date of Birth",
        min_value=datetime.date(1900, 1, 1),
        max_value=datetime.date.today(),
    )
    comp_country = st.selectbox(
        "Country of Residence",
        [
            "United States",
            "United Kingdom",
            "Nigeria",
            "Ghana",
            "South Africa",
            "Canada",
            "Australia",
            "Other",
        ],
    )

    if st.button("Complete Profile", type="primary"):
        try:
            # Update the user metadata in Supabase
            supabase.auth.update_user(
                {
                    "data": {
                        "phone": comp_phone,
                        "dob": str(comp_dob),
                        "country": comp_country,
                    }
                }
            )

            # Also update the wallets table with the new country just in case
            supabase.table("wallets").update({"country": comp_country}).eq(
                "user_id", st.session_state.user.id
            ).execute()

            # Update local session
            st.session_state.user_country = comp_country
            st.session_state.user.user_metadata["phone"] = comp_phone
            st.session_state.user.user_metadata["dob"] = str(comp_dob)
            st.session_state.user.user_metadata["country"] = comp_country

            st.success("Profile updated!")
            st.rerun()
        except Exception as e:
            st.error(f"Failed to update profile: {e}")

    st.stop()


# Initialize initial bankroll for sync check
if "bankroll" not in st.session_state:
    st.session_state.bankroll = 0.0
st.session_state._initial_bankroll = st.session_state.bankroll

if "league_standings" not in st.session_state:
    standings = {}
    for league, teams in sportsbook.VIRTUAL_TEAMS.items():
        standings[league] = {}
        for team in teams.keys():
            standings[league][team] = {
                "P": 0,
                "W": 0,
                "D": 0,
                "L": 0,
                "GF": 0,
                "GA": 0,
                "GD": 0,
                "Pts": 0,
            }
    st.session_state.league_standings = standings

if "user_tactics" not in st.session_state:
    st.session_state.user_tactics = {
        "team": None,
        "formation": "4-3-3",
        "style": "Balanced",
    }

if "my_club_players" not in st.session_state:
    st.session_state.my_club_players = []


# --- DATA LOADING ---
@st.cache_data
def load_data():
    with open("data/players.json", "r") as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    # Ensure columns exist
    for col in [
        "name",
        "photo",
        "position",
        "age",
        "citizenship",
        "height",
        "club",
        "form",
    ]:
        if col not in df.columns:
            df[col] = None

    # Clean form rating
    df["form"] = pd.to_numeric(df["form"], errors="coerce")
    df["age"] = pd.to_numeric(df["age"], errors="coerce")
    return df


@st.cache_data(ttl=3600)
def fetch_live_team_data(team_id):
    if not API_KEY:
        st.error("API_FOOTBALL_KEY not found in environment!")
        return pd.DataFrame()

    url = "https://v3.football.api-sports.io/players"
    headers = {
        "x-rapidapi-host": "v3.football.api-sports.io",
        "x-rapidapi-key": API_KEY,
    }
    params = {"team": team_id, "season": "2023", "page": 1}

    players_data = []

    with st.spinner(f"Fetching live data for Team..."):
        while True:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code != 200:
                st.error(f"API Error: {response.status_code}")
                break

            data = response.json()
            if not data.get("response"):
                break

            for item in data["response"]:
                player = item["player"]
                stats = item["statistics"][0] if item["statistics"] else {}
                games = stats.get("games", {})
                team = stats.get("team", {})

                players_data.append(
                    {
                        "name": player.get("name"),
                        "photo": player.get("photo"),
                        "position": games.get("position"),
                        "age": player.get("age"),
                        "citizenship": player.get("nationality"),
                        "height": player.get("height"),
                        "club": team.get("name"),
                        "form": games.get("rating"),
                    }
                )

            paging = data.get("paging", {})
            if paging.get("current", 1) >= paging.get("total", 1):
                break
            params["page"] += 1

    # Clean form rating
    df_live = pd.DataFrame(players_data)
    if not df_live.empty:
        df_live["form"] = pd.to_numeric(df_live["form"], errors="coerce")
        df_live["age"] = pd.to_numeric(df_live["age"], errors="coerce")
    return df_live


@st.cache_data(ttl=3600)
def fetch_fpl_data():
    url = "https://fantasy.premierleague.com/api/bootstrap-static/"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            teams = {t["id"]: t["name"] for t in data["teams"]}
            pos_map = {1: "Goalkeeper", 2: "Defender", 3: "Midfielder", 4: "Attacker"}

            players = []
            for p in data["elements"]:
                if p["status"] != "a":
                    continue
                ep_api = float(p["ep_next"]) if p["ep_next"] else 0.0
                # Artificial boost for pre-season using historical points
                historical_ep = p["total_points"] / 38.0
                ep = ep_api * 1.5 + historical_ep
                photo_url = f"https://resources.premierleague.com/premierleague/photos/players/110x140/p{p['code']}.png"

                transfers_in = p.get("transfers_in_event", 0)
                transfers_out = p.get("transfers_out_event", 0)
                net_transfers = transfers_in - transfers_out

                if net_transfers > 50000:
                    price_pred = "UP 📈"
                elif net_transfers < -50000:
                    price_pred = "DOWN 📉"
                else:
                    price_pred = "STABLE ➖"

                players.append(
                    {
                        "id": p["id"],
                        "name": f"{p['first_name']} {p['second_name']}",
                        "team_id": p["team"],
                        "team": teams.get(p["team"], "Unknown"),
                        "position": pos_map.get(p["element_type"], "Unknown"),
                        "pos_id": p["element_type"],
                        "price": p["now_cost"] / 10.0,
                        "ep_next": ep,
                        "total_points": p["total_points"],
                        "selected_by": p["selected_by_percent"],
                        "photo": photo_url,
                        "net_transfers": net_transfers,
                        "price_pred": price_pred,
                    }
                )
            return pd.DataFrame(players).sort_values("ep_next", ascending=False)
    except Exception as e:
        st.error(f"Failed to fetch FPL data: {e}")
        return pd.DataFrame()


def load_user_team():
    if supabase is None:
        return None
    try:
        response = supabase.table("fpl_team").select("*").eq("id", 1).execute()
        if len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        return None


def save_user_team(
    starters_df,
    bench_df,
    budget,
    formation,
    captain_id=None,
    vice_captain_id=None,
    active_chip=None,
    free_transfers=1,
    points_hit=0,
):
    if supabase is None:
        return
    try:
        data = {
            "id": 1,
            "starters": (
                starters_df.to_dict(orient="records")
                if isinstance(starters_df, pd.DataFrame)
                else starters_df
            ),
            "bench": (
                bench_df.to_dict(orient="records")
                if isinstance(bench_df, pd.DataFrame)
                else bench_df
            ),
            "budget": float(budget),
            "formation": formation,
            "captain_id": int(captain_id) if captain_id else None,
            "vice_captain_id": int(vice_captain_id) if vice_captain_id else None,
            "active_chip": active_chip,
            "free_transfers": int(free_transfers),
            "points_hit": int(points_hit),
        }
        supabase.table("fpl_team").upsert(data).execute()
    except Exception as e:
        print(f"Error saving to supabase: {e}")


def optimize_fpl_squad(df, budget=100.0):
    df = df.sort_values("ep_next", ascending=False)
    squad = []
    pos_counts = {1: 0, 2: 0, 3: 0, 4: 0}
    pos_limits = {1: 2, 2: 5, 3: 5, 4: 3}
    team_counts = {}
    current_cost = 0.0

    for _, row in df.iterrows():
        pos = row["pos_id"]
        team = row["team_id"]
        price = row["price"]

        if pos_counts[pos] >= pos_limits[pos]:
            continue
        if team_counts.get(team, 0) >= 3:
            continue

        min_pos_cost = {1: 4.0, 2: 4.0, 3: 4.5, 4: 4.5}
        cost_of_remaining_needed = 0.0

        for pos_id, max_allowed in pos_limits.items():
            needed = max_allowed - pos_counts[pos_id]
            if pos_id == pos:
                needed -= 1  # Since we are evaluating this player right now
            if needed > 0:
                cost_of_remaining_needed += needed * min_pos_cost[pos_id]

        if current_cost + price + cost_of_remaining_needed <= budget:
            squad.append(row)
            pos_counts[pos] += 1
            team_counts[team] = team_counts.get(team, 0) + 1
            current_cost += price

        if len(squad) == 15:
            break

    return pd.DataFrame(squad)


def split_fpl_squad(squad, formation="3-4-3"):
    squad = squad.sort_values("ep_next", ascending=False)
    starters = []
    bench = []

    gk = squad[squad["pos_id"] == 1]
    defenders = squad[squad["pos_id"] == 2]
    midfielders = squad[squad["pos_id"] == 3]
    forwards = squad[squad["pos_id"] == 4]

    if len(gk) > 0:
        starters.append(gk.iloc[0])
    for i in range(1, len(gk)):
        bench.append(gk.iloc[i])

    req_def, req_mid, req_fwd = map(int, formation.split("-"))

    for i in range(req_def):
        if i < len(defenders):
            starters.append(defenders.iloc[i])
    for i in range(req_def, len(defenders)):
        bench.append(defenders.iloc[i])

    for i in range(req_mid):
        if i < len(midfielders):
            starters.append(midfielders.iloc[i])
    for i in range(req_mid, len(midfielders)):
        bench.append(midfielders.iloc[i])

    for i in range(req_fwd):
        if i < len(forwards):
            starters.append(forwards.iloc[i])
    for i in range(req_fwd, len(forwards)):
        bench.append(forwards.iloc[i])

    return pd.DataFrame(starters) if starters else pd.DataFrame(), (
        pd.DataFrame(bench) if bench else pd.DataFrame()
    )


def render_fpl_pitch(starters, bench, formation="3-4-3", captain_id=None):
    pitch_css = """
    <style>
    .fpl-pitch-container {
        position: relative; width: 100%; max-width: 600px; margin: 0 auto;
        background: repeating-linear-gradient(0deg, #3a7c29, #3a7c29 50px, #428c30 50px, #428c30 100px);
        border: 2px solid #fff; border-radius: 8px; overflow: hidden; padding-bottom: 20px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
    }
    .fpl-row {
        display: flex; justify-content: space-evenly; align-items: center;
        width: 100%; padding: 15px 0; min-height: 120px;
    }
    .fpl-bench-row {
        display: flex; justify-content: space-evenly; align-items: center;
        width: 100%; max-width: 600px; margin: 5px auto 0 auto;
        background: #e0e0e0; border-radius: 8px; padding: 15px 0; border: 2px solid #ccc;
    }
    .fpl-node {
        display: flex; flex-direction: column; align-items: center; width: 70px; position: relative;
    }
    .fpl-node .tooltiptext {
        visibility: hidden; width: 130px; background-color: rgba(0,0,0,0.85); color: #fff;
        text-align: center; border-radius: 6px; padding: 6px; position: absolute; z-index: 2;
        bottom: 105%; left: 50%; margin-left: -65px; font-size: 11px; font-family: sans-serif;
        opacity: 0; transition: opacity 0.3s; pointer-events: none; line-height: 1.4;
    }
    .fpl-node:hover .tooltiptext { visibility: visible; opacity: 1; }
    .fpl-shirt {
        width: 60px; height: 75px;
        margin-bottom: 4px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
    }
    .fpl-badge {
        background: #37003c; color: white; font-size: 10px; font-weight: bold; font-family: sans-serif;
        text-align: center; border-radius: 3px; overflow: hidden; width: 100%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .fpl-name { padding: 3px 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fpl-points { background: #00ff85; color: #37003c; padding: 3px 2px; }
    .fpl-points.bench-points { background: #ccc; color: #333; }
    </style>
    """

    def render_row(df, expected_count=0, is_bench=False, captain_id=None):
        html = ""
        count = 0
        if not df.empty:
            for _, row in df.iterrows():
                count += 1
                points_class = "fpl-points bench-points" if is_bench else "fpl-points"
                photo_url = row.get(
                    "photo",
                    "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp",
                )
                net_transfers = row.get("net_transfers", 0)
                price_pred = row.get("price_pred", "STABLE ➖")

                is_captain = (row["id"] == captain_id) and not is_bench
                display_name = (
                    f"{row['name'].split()[-1]} (C)"
                    if is_captain
                    else row["name"].split()[-1]
                )
                ep_display = row["ep_next"] * 2.0 if is_captain else row["ep_next"]

                html += f"""
                <div class="fpl-node">
                    <div class="fpl-shirt" style="background: url('{photo_url}') center/contain no-repeat, url('https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp') center/contain no-repeat;"></div>
                    <div class="fpl-badge">
                        <div class="fpl-name">{display_name}</div>
                        <div class="{points_class}">£{row['price']:.1f}m</div>
                    </div>
                    <span class="tooltiptext">
                        <b>{row['name']}</b><br>
                        Team: {row['team']}<br>
                        Exp. Points: {ep_display:.1f}{' (x2)' if is_captain else ''}<br>
                        Net Transfers: {net_transfers:,}<br>
                        Price: {price_pred}
                    </span>
                </div>
                """
        while count < expected_count:
            count += 1
            points_class = "fpl-points bench-points" if is_bench else "fpl-points"
            html += f"""
            <div class="fpl-node" style="opacity: 0.5;">
                <div class="fpl-shirt" style="background: url('https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp') no-repeat center/contain;"></div>
                <div class="fpl-badge">
                    <div class="fpl-name">Empty</div>
                    <div class="{points_class}">£0.0m</div>
                </div>
            </div>
            """
        return html

    gks = starters[starters["pos_id"] == 1] if not starters.empty else pd.DataFrame()
    defs = starters[starters["pos_id"] == 2] if not starters.empty else pd.DataFrame()
    mids = starters[starters["pos_id"] == 3] if not starters.empty else pd.DataFrame()
    fwds = starters[starters["pos_id"] == 4] if not starters.empty else pd.DataFrame()

    req_def, req_mid, req_fwd = map(int, formation.split("-"))

    pitch_html = f"""
    {pitch_css}
    <div class="fpl-pitch-container">
        <div class="fpl-row">{render_row(gks, expected_count=1, captain_id=captain_id)}</div>
        <div class="fpl-row">{render_row(defs, expected_count=req_def, captain_id=captain_id)}</div>
        <div class="fpl-row">{render_row(mids, expected_count=req_mid, captain_id=captain_id)}</div>
        <div class="fpl-row">{render_row(fwds, expected_count=req_fwd, captain_id=captain_id)}</div>
    </div>
    <div style="text-align:center; font-family:sans-serif; margin-top:10px; font-weight:bold; color:#555;">BENCH</div>
    <div class="fpl-bench-row">
        {render_row(bench, expected_count=4, is_bench=True)}
    </div>
    """
    import streamlit.components.v1 as components

    components.html(pitch_html, height=750)


def calculate_team_stats(team_df):
    # Overall Rating (Based on average form)
    avg_form = team_df["form"].mean()
    overall_rating = int((avg_form / 10.0) * 100) if pd.notna(avg_form) else 75

    # Team Chemistry
    chemistry = 50
    # Bonus for same club
    club_counts = team_df["club"].value_counts()
    for count in club_counts:
        if count >= 2:
            chemistry += count * 5

    # Bonus for same nationality
    nat_counts = team_df["citizenship"].value_counts()
    for count in nat_counts:
        if count >= 2:
            chemistry += count * 2

    chemistry = min(100, chemistry)
    return overall_rating, chemistry


def generate_player_stats(player):
    # Procedurally generate 6 FIFA stats based on position and form
    base_form = player["form"] if pd.notna(player["form"]) else 6.0
    base = base_form * 8.5
    pos = str(player["position"]).lower()

    stats = {
        "Pace": base + random.randint(-10, 10),
        "Shooting": base + random.randint(-10, 10),
        "Passing": base + random.randint(-10, 10),
        "Dribbling": base + random.randint(-10, 10),
        "Defending": base + random.randint(-10, 10),
        "Physical": base + random.randint(-10, 10),
    }

    if "attacker" in pos or "forward" in pos:
        stats["Shooting"] += 15
        stats["Pace"] += 10
        stats["Defending"] -= 20
    elif "midfielder" in pos:
        stats["Passing"] += 15
        stats["Dribbling"] += 10
    elif "defender" in pos:
        stats["Defending"] += 20
        stats["Physical"] += 15
        stats["Shooting"] -= 15
    elif "goalkeeper" in pos:
        stats = {
            "Diving": base + 15,
            "Handling": base + 10,
            "Kicking": base,
            "Reflexes": base + 20,
            "Speed": base - 20,
            "Positioning": base + 15,
        }

    for k in stats:
        stats[k] = max(30, min(99, int(stats[k])))
    return stats


def render_radar_chart(stats):
    categories = list(stats.keys())
    values = list(stats.values())

    fig = go.Figure()
    fig.add_trace(
        go.Scatterpolar(
            r=values + [values[0]],
            theta=categories + [categories[0]],
            fill="toself",
            line_color="#1DB954",
            name="Stats",
        )
    )
    fig.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
        showlegend=False,
        margin=dict(l=20, r=20, t=20, b=20),
        height=300,
    )
    return fig


if "live_df" in st.session_state and not st.session_state["live_df"].empty:
    df = st.session_state["live_df"]
else:
    df = load_data()


# --- UTILS ---
def generate_summary(row):
    parts = []
    if pd.notna(row["name"]):
        age_str = f"{int(row['age'])}-year-old" if pd.notna(row["age"]) else ""
        nat_str = row["citizenship"] if pd.notna(row["citizenship"]) else ""
        pos_str = (
            str(row["position"]).lower() if pd.notna(row["position"]) else "player"
        )

        intro = f"{row['name']} is a {age_str} {nat_str} {pos_str}".strip().replace(
            "  ", " "
        )
        club_str = f" at {row['club']}" if pd.notna(row["club"]) else ""
        parts.append(f"{intro}{club_str}.")

    if pd.notna(row["form"]):
        f = row["form"]
        if f >= 8.0:
            parts.append("They are currently in strong form.")
        elif 6.0 <= f <= 7.9:
            parts.append("They are currently showing consistent form.")
        else:
            parts.append("They are currently building form.")

    parts.append("This profile is based on the available dataset only.")
    return " ".join(parts)


def generate_smart_team(formation="4-4-2"):
    parts = list(map(int, formation.split("-")))
    num_def = parts[0]
    num_mid = parts[1]
    num_fwd = parts[2]

    gk = (
        df[df["position"].str.lower() == "goalkeeper"].sample(1)
        if not df[df["position"].str.lower() == "goalkeeper"].empty
        else pd.DataFrame()
    )
    defs = df[df["position"].str.lower() == "defender"].sample(
        n=min(num_def, len(df[df["position"].str.lower() == "defender"]))
    )
    mids = df[df["position"].str.lower() == "midfielder"].sample(
        n=min(num_mid, len(df[df["position"].str.lower() == "midfielder"]))
    )
    fwds = df[df["position"].str.lower() == "attacker"].sample(
        n=min(num_fwd, len(df[df["position"].str.lower() == "attacker"]))
    )

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

    parts = list(map(int, formation.split("-")))
    fwd_count, mid_count, def_count = parts[2], parts[1], parts[0]

    def gen_row(count, top):
        return [
            {"top": top, "left": f"{int((100 / (count + 1)) * i)}%"}
            for i in range(1, count + 1)
        ]

    positions = (
        gen_row(fwd_count, 15)
        + gen_row(mid_count, 40)
        + gen_row(def_count, 68)
        + [{"top": 88, "left": "50%"}]
    )

    players_html = ""
    for idx, row in team_df.iterrows():
        pos = positions[idx] if idx < len(positions) else {"top": 50, "left": "50%"}
        photo = (
            row["photo"] if pd.notna(row["photo"]) else "https://via.placeholder.com/50"
        )
        name = row["name"]
        f_pos = row["position"]
        age = row["age"]
        form = row["form"]

        players_html += f"""<div class="player-node tooltip" draggable="true" style="top: {pos['top']}%; left: {pos['left']}; cursor: grab;">
<img class="player-photo" src="{photo}" draggable="false" />
<div class="player-name">{name}</div>
<span class="tooltiptext">Pos: {f_pos}<br>Age: {age}<br>Form: {form}</span>
</div>"""

    pitch_html = (
        f"""
{pitch_css}
<div class="pitch-container" id="pitch-container">
<button onclick="exportLineup()" style="position:absolute; top: 10px; right: 10px; padding: 10px 15px; background: #1DB954; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">📸 Download Lineup</button>
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
        + """
<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
<script>
let draggedNode = null;
const nodes = document.querySelectorAll('.player-node');
nodes.forEach(node => {
    node.addEventListener('dragstart', (e) => {
        draggedNode = node;
        e.dataTransfer.effectAllowed = 'move';
        node.style.opacity = '0.5';
    });
    node.addEventListener('dragend', (e) => {
        draggedNode = null;
        node.style.opacity = '1';
    });
    node.addEventListener('dragover', (e) => {
        e.preventDefault();
        return false;
    });
    node.addEventListener('drop', (e) => {
        e.stopPropagation();
        if (draggedNode !== node) {
            const tempTop = draggedNode.style.top;
            const tempLeft = draggedNode.style.left;
            draggedNode.style.top = node.style.top;
            draggedNode.style.left = node.style.left;
            node.style.top = tempTop;
            node.style.left = tempLeft;
        }
        return false;
    });
});

function exportLineup() {
    html2canvas(document.getElementById("pitch-container"), {backgroundColor: null}).then(canvas => {
        let link = document.createElement("a");
        link.download = "lineup.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}
</script>
"""
    )
    import streamlit.components.v1 as components

    with open("debug_pitch.html", "w") as f:
        f.write(pitch_html)
    components.html(pitch_html, height=850)


# --- UI ---
st.sidebar.header("Live API Data")
team_options = {
    "Arsenal": 42,
    "Manchester City": 50,
    "Liverpool": 40,
    "Manchester United": 33,
    "Chelsea": 49,
    "Tottenham": 47,
}
selected_team_name = st.sidebar.selectbox("Fetch Live Squad", list(team_options.keys()))
if st.sidebar.button("Fetch Team from API"):
    team_id = team_options[selected_team_name]
    live_df = fetch_live_team_data(team_id)
    if not live_df.empty:
        st.session_state["live_df"] = live_df
        st.sidebar.success(
            f"Fetched {len(live_df)} players! App is now using live data."
        )
        st.rerun()

st.sidebar.markdown("---")
page = st.sidebar.selectbox(
    "Navigation",
    [
        "Player Browser (Compare)",
        "Team Formation",
        "Simulate Match",
        "Ultimate Team",
        "FPL AI Predictor",
    ],
)

st.sidebar.markdown("---")
st.sidebar.header("💳 Wallet")
if "bankroll" not in st.session_state:
    st.session_state.bankroll = 1000.0

user_country = st.session_state.get("user_country", "Unknown")

st.sidebar.markdown(f"**Balance:** ${st.session_state.bankroll:.2f}")
st.sidebar.caption(f"🌍 Region: {user_country}")

with st.sidebar.expander("Deposit Real Funds"):
    if user_country in ["Nigeria", "Ghana", "South Africa"]:
        st.markdown("**Local Payment Gateway:**")
        if st.button(
            "Fund with Paystack 🇳🇬🇬🇭🇿🇦", type="primary", use_container_width=True
        ):
            st.info("Redirecting to Paystack Checkout...")
    elif user_country in ["United States", "United Kingdom", "Canada", "Australia"]:
        st.markdown("**Local Payment Gateway:**")
        if st.button("Fund with Stripe 💳", type="primary", use_container_width=True):
            st.info("Redirecting to Stripe Checkout...")
    else:
        st.markdown("**Local Payment Gateway:**")
        st.warning(
            "No native fiat gateway available for your region. Please use Crypto."
        )

    st.markdown("---")
    st.markdown("**Global Gateway:**")
    if st.button("Fund with Crypto (USDC) ⛓️", use_container_width=True):
        st.info("Connecting to Web3 Wallet...")

st.sidebar.markdown("---")
if st.sidebar.button("➕ Mock Deposit ($1,000)"):
    st.session_state.bankroll += 1000.0
    st.sidebar.success("Deposited $1,000!")
    st.rerun()

if page == "Player Browser (Compare)":
    st.title("Player Comparison Tool")

    col1, col2 = st.columns(2)

    def render_selector(col, id_suffix):
        with col:
            st.subheader(f"Player {id_suffix}")
            search = st.text_input("Search players...", key=f"search_{id_suffix}")
            pos_filter = st.selectbox(
                "Position",
                ["All", "Attacker", "Midfielder", "Defender", "Goalkeeper"],
                key=f"pos_{id_suffix}",
            )
            sort_by = st.selectbox(
                "Sort by",
                [
                    "Name (A-Z)",
                    "Name (Z-A)",
                    "Age (Youngest)",
                    "Age (Oldest)",
                    "Form Rating (Highest)",
                    "Form Rating (Lowest)",
                ],
                key=f"sort_{id_suffix}",
            )

            # Apply filters
            filtered = df.copy()
            if search:
                filtered = filtered[
                    filtered["name"].str.contains(search, case=False, na=False)
                ]
            if pos_filter != "All":
                filtered = filtered[
                    filtered["position"].str.lower() == pos_filter.lower()
                ]

            # Sort
            if sort_by == "Name (A-Z)":
                filtered = filtered.sort_values("name", ascending=True)
            elif sort_by == "Name (Z-A)":
                filtered = filtered.sort_values("name", ascending=False)
            elif sort_by == "Age (Youngest)":
                filtered = filtered.sort_values("age", ascending=True)
            elif sort_by == "Age (Oldest)":
                filtered = filtered.sort_values("age", ascending=False)
            elif sort_by == "Form Rating (Highest)":
                filtered = filtered.sort_values("form", ascending=False)
            elif sort_by == "Form Rating (Lowest)":
                filtered = filtered.sort_values("form", ascending=True)

            player_names = filtered["name"].tolist()
            selected_name = st.selectbox(
                "Select Player",
                ["Select a player..."] + player_names,
                key=f"sel_{id_suffix}",
            )

            if selected_name != "Select a player...":
                player = df[df["name"] == selected_name].iloc[0]

                # Card UI
                st.markdown("---")
                st.image(
                    (
                        player["photo"]
                        if pd.notna(player["photo"])
                        else "https://via.placeholder.com/150"
                    ),
                    width=120,
                )
                st.markdown(f"### {player['name']}")
                st.markdown(f"**Position:** {player['position']}")
                st.markdown(
                    f"**Age:** {int(player['age']) if pd.notna(player['age']) else '—'}"
                )
                st.markdown(f"**Nationality:** {player['citizenship']}")
                st.markdown(f"**Club:** {player['club']}")
                st.markdown(f"**Form Rating:** {player['form']} / 10")

                # Radar Chart
                stats = generate_player_stats(player)
                fig = render_radar_chart(stats)
                st.plotly_chart(fig, use_container_width=True)

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
        formation = st.selectbox(
            "Choose Tactical Formation", ["4-4-2", "4-3-3", "3-5-2"]
        )

    # Auto-regenerate team if formation changes
    if (
        "current_formation" not in st.session_state
        or st.session_state.current_formation != formation
    ):
        st.session_state.team = generate_smart_team(formation)
        st.session_state.current_formation = formation

    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("Generate Smart Team"):
            st.session_state.team = generate_smart_team(formation)

    rating, chemistry = calculate_team_stats(st.session_state.team)
    st.markdown("---")
    mcol1, mcol2, mcol3, mcol4 = st.columns(4)
    mcol1.metric("Overall Rating", f"{rating} / 100")
    mcol2.metric("Team Chemistry", f"{chemistry} / 100")

    render_pitch(st.session_state.team, formation)

elif page == "Simulate Match":
    st.title("🌍 Global Virtual Sportsbook")
    tab_sportsbook, tab_league, tab_manager = st.tabs(
        ["Sportsbook", "League Season (Live)", "Manager Mode"]
    )
    with tab_sportsbook:
        import sportsbook

        if "bankroll" not in st.session_state:
            st.session_state.bankroll = 1000.0
        if "bet_slip" not in st.session_state:
            st.session_state.bet_slip = []
        if "fixtures" not in st.session_state:
            st.session_state.fixtures = sportsbook.generate_fixtures(15)

        st.markdown(f"### 🏦 Bankroll: **${st.session_state.bankroll:.2f}**")

        user_team_db = load_user_team()
        if user_team_db:
            st.session_state.fpl_starters = user_team_db.get("starters", [])
            st.session_state.fpl_captain_id = user_team_db.get("captain_id")

        if "simulating" in st.session_state and st.session_state.simulating:
            st.markdown("## 🔴 LIVE MATCH SIMULATION")
            fpl_score_placeholder = st.empty()
            tracker_placeholder = st.empty()

            bet_match_ids = [b["match_id"] for b in st.session_state.bet_slip]

            for minute, matches in sportsbook.run_90_second_simulation(
                st.session_state.active_matches
            ):
                fpl_score_placeholder.metric(
                    "🌟 Live FPL Gameweek Score",
                    st.session_state.get("fpl_live_score", 0),
                )
                with tracker_placeholder.container():
                    st.markdown(f"### ⏱️ {minute}' MIN")
                    for m in matches:
                        if m["id"] not in bet_match_ids:
                            continue
                        col1, col2, col3 = st.columns([3, 1, 3])
                        col1.markdown(f"**{m['home']['name']}**")
                        col2.markdown(
                            f"<h3 style='text-align: center; margin: 0;'>{m['h_goals']} - {m['a_goals']}</h3>",
                            unsafe_allow_html=True,
                        )
                        col3.markdown(
                            f"<p style='text-align: right;'><b>{m['away']['name']}</b></p>",
                            unsafe_allow_html=True,
                        )

                        if m["events"]:
                            st.caption(f"Latest: {m['events'][0]}")
                        st.divider()

            st.session_state.simulating = False
            st.success("🏁 FULL TIME!")

            win_acca = True
            total_odds = 1.0

            st.markdown("### Bet Slip Results:")
            for bet in st.session_state.bet_slip:
                m = next(
                    m
                    for m in st.session_state.active_matches
                    if m["id"] == bet["match_id"]
                )
                won = sportsbook.check_bet_result(bet, m)
                total_odds *= bet["odds"]
                if won:
                    st.success(f"✅ {bet['desc']} (Won!)")
                else:
                    st.error(f"❌ {bet['desc']} (Lost!)")
                    win_acca = False

            if win_acca:
                payout = st.session_state.active_wager * total_odds
                st.session_state.bankroll += payout
                st.balloons()
                st.success(f"🎉 ACCUMULATOR WON! Payout: ${payout:.2f}")
            else:
                st.error("💀 ACCUMULATOR LOST!")
                if st.session_state.bankroll <= 0:
                    st.session_state.bankroll = 500.0
                    st.warning("You went broke! Here is a $500 pity refill.")

            if st.button("Back to Sportsbook"):
                st.session_state.bet_slip = []
                st.session_state.fixtures = sportsbook.generate_fixtures()
                st.rerun()

        else:
            col_main, col_slip = st.columns([7, 3])

            with col_main:
                st.markdown("### 📅 Upcoming Virtual Fixtures")
                if st.button("🔄 Generate New Matchweek"):
                    st.session_state.fixtures = sportsbook.generate_fixtures()
                    st.session_state.bet_slip = []
                    st.rerun()

                # Group fixtures by league
                grouped_fixtures = {}
                for m in st.session_state.fixtures:
                    league = m["home"]["league"]
                    if league not in grouped_fixtures:
                        grouped_fixtures[league] = []
                    grouped_fixtures[league].append(m)

                # League Filter
                available_leagues = ["All Leagues"] + list(grouped_fixtures.keys())
                selected_league = st.selectbox(
                    "Filter by League / Tournament", available_leagues
                )

                for league, matches in grouped_fixtures.items():
                    if selected_league != "All Leagues" and league != selected_league:
                        continue
                    st.markdown(f"#### 🏆 {league}")
                    for m in matches:
                        with st.expander(f"{m['home']['name']} vs {m['away']['name']}"):
                            tab_main, tab_stats, tab_cards, tab_players = st.tabs(
                                ["Main", "Stats (Corners/Fouls)", "Cards", "Scorers"]
                            )

                            def add_bet(m_id, market, odds, desc):
                                st.session_state.bet_slip = [
                                    b
                                    for b in st.session_state.bet_slip
                                    if b["match_id"] != m_id
                                ]
                                st.session_state.bet_slip.append(
                                    {
                                        "match_id": m_id,
                                        "market": market,
                                        "odds": odds,
                                        "desc": desc,
                                    }
                                )

                            with tab_main:
                                st.markdown("##### Match Winner (1X2)")
                                c1, c2, c3 = st.columns(3)
                                if c1.button(
                                    f"{m['home']['name']} @ {m['odds']['1']}x",
                                    key=f"{m['id']}_1",
                                ):
                                    add_bet(
                                        m["id"],
                                        "1",
                                        m["odds"]["1"],
                                        f"{m['home']['name']} to Win",
                                    )
                                if c2.button(
                                    f"Draw @ {m['odds']['X']}x", key=f"{m['id']}_X"
                                ):
                                    add_bet(
                                        m["id"],
                                        "X",
                                        m["odds"]["X"],
                                        f"Draw ({m['home']['name']} vs {m['away']['name']})",
                                    )
                                if c3.button(
                                    f"{m['away']['name']} @ {m['odds']['2']}x",
                                    key=f"{m['id']}_2",
                                ):
                                    add_bet(
                                        m["id"],
                                        "2",
                                        m["odds"]["2"],
                                        f"{m['away']['name']} to Win",
                                    )

                                st.markdown("##### Over/Under 2.5 Goals")
                                c4, c5 = st.columns(2)
                                if c4.button(
                                    f"Over 2.5 @ {m['odds']['O2.5']}x",
                                    key=f"{m['id']}_O",
                                ):
                                    add_bet(
                                        m["id"],
                                        "O2.5",
                                        m["odds"]["O2.5"],
                                        f"Over 2.5 Goals ({m['home']['name']} vs {m['away']['name']})",
                                    )
                                if c5.button(
                                    f"Under 2.5 @ {m['odds']['U2.5']}x",
                                    key=f"{m['id']}_U",
                                ):
                                    add_bet(
                                        m["id"],
                                        "U2.5",
                                        m["odds"]["U2.5"],
                                        f"Under 2.5 Goals ({m['home']['name']} vs {m['away']['name']})",
                                    )

                                st.markdown("##### Both Teams To Score (BTTS)")
                                c6, c7 = st.columns(2)
                                if c6.button(
                                    f"Yes @ {m['odds']['BTTS_Y']}x", key=f"{m['id']}_BY"
                                ):
                                    add_bet(
                                        m["id"],
                                        "BTTS_Y",
                                        m["odds"]["BTTS_Y"],
                                        f"BTTS Yes ({m['home']['name']} vs {m['away']['name']})",
                                    )
                                if c7.button(
                                    f"No @ {m['odds']['BTTS_N']}x", key=f"{m['id']}_BN"
                                ):
                                    add_bet(
                                        m["id"],
                                        "BTTS_N",
                                        m["odds"]["BTTS_N"],
                                        f"BTTS No ({m['home']['name']} vs {m['away']['name']})",
                                    )

                            with tab_stats:
                                st.markdown("##### Total Match Corners")
                                c_c1, c_c2 = st.columns(2)
                                if c_c1.button(
                                    f"Over 9.5 @ {m['odds']['C_O9.5']}x",
                                    key=f"{m['id']}_CO",
                                ):
                                    add_bet(
                                        m["id"],
                                        "C_O9.5",
                                        m["odds"]["C_O9.5"],
                                        f"Over 9.5 Corners ({m['home']['name']} vs {m['away']['name']})",
                                    )
                                if c_c2.button(
                                    f"Under 9.5 @ {m['odds']['C_U9.5']}x",
                                    key=f"{m['id']}_CU",
                                ):
                                    add_bet(
                                        m["id"],
                                        "C_U9.5",
                                        m["odds"]["C_U9.5"],
                                        f"Under 9.5 Corners ({m['home']['name']} vs {m['away']['name']})",
                                    )

                                st.markdown("##### Total Match Fouls")
                                f_c1, f_c2 = st.columns(2)
                                if f_c1.button(
                                    f"Over 22.5 @ {m['odds']['F_O22.5']}x",
                                    key=f"{m['id']}_FO",
                                ):
                                    add_bet(
                                        m["id"],
                                        "F_O22.5",
                                        m["odds"]["F_O22.5"],
                                        f"Over 22.5 Fouls ({m['home']['name']} vs {m['away']['name']})",
                                    )
                                if f_c2.button(
                                    f"Under 22.5 @ {m['odds']['F_U22.5']}x",
                                    key=f"{m['id']}_FU",
                                ):
                                    add_bet(
                                        m["id"],
                                        "F_U22.5",
                                        m["odds"]["F_U22.5"],
                                        f"Under 22.5 Fouls ({m['home']['name']} vs {m['away']['name']})",
                                    )

                            with tab_cards:
                                st.markdown("##### Total Yellow Cards")
                                y_c1, y_c2 = st.columns(2)
                                if y_c1.button(
                                    f"Over 3.5 @ {m['odds']['Y_O3.5']}x",
                                    key=f"{m['id']}_YO",
                                ):
                                    add_bet(
                                        m["id"],
                                        "Y_O3.5",
                                        m["odds"]["Y_O3.5"],
                                        f"Over 3.5 Yellows ({m['home']['name']} vs {m['away']['name']})",
                                    )
                                if y_c2.button(
                                    f"Under 3.5 @ {m['odds']['Y_U3.5']}x",
                                    key=f"{m['id']}_YU",
                                ):
                                    add_bet(
                                        m["id"],
                                        "Y_U3.5",
                                        m["odds"]["Y_U3.5"],
                                        f"Under 3.5 Yellows ({m['home']['name']} vs {m['away']['name']})",
                                    )

                                st.markdown("##### Red Card in Match?")
                                r_c1, r_c2 = st.columns(2)
                                if r_c1.button(
                                    f"Yes @ {m['odds']['RED_Y']}x", key=f"{m['id']}_RY"
                                ):
                                    add_bet(
                                        m["id"],
                                        "RED_Y",
                                        m["odds"]["RED_Y"],
                                        f"Red Card Yes ({m['home']['name']} vs {m['away']['name']})",
                                    )
                                if r_c2.button(
                                    f"No @ {m['odds']['RED_N']}x", key=f"{m['id']}_RN"
                                ):
                                    add_bet(
                                        m["id"],
                                        "RED_N",
                                        m["odds"]["RED_N"],
                                        f"Red Card No ({m['home']['name']} vs {m['away']['name']})",
                                    )

                            with tab_players:
                                st.markdown("##### Anytime Goalscorer")
                                p_c1, p_c2 = st.columns(2)
                                if p_c1.button(
                                    f"{m['home']['star']} (Yes) @ {m['odds']['H_STAR_Y']}x",
                                    key=f"{m['id']}_HSY",
                                ):
                                    add_bet(
                                        m["id"],
                                        "H_STAR_Y",
                                        m["odds"]["H_STAR_Y"],
                                        f"{m['home']['star']} to score anytime",
                                    )
                                if p_c2.button(
                                    f"{m['away']['star']} (Yes) @ {m['odds']['A_STAR_Y']}x",
                                    key=f"{m['id']}_ASY",
                                ):
                                    add_bet(
                                        m["id"],
                                        "A_STAR_Y",
                                        m["odds"]["A_STAR_Y"],
                                        f"{m['away']['star']} to score anytime",
                                    )

            with col_slip:
                st.markdown("### 🧾 Bet Slip")
                if not st.session_state.bet_slip:
                    st.info("Your bet slip is empty. Click on odds to add selections.")
                else:
                    total_odds = 1.0
                    for i, bet in enumerate(st.session_state.bet_slip):
                        st.markdown(f"**{bet['desc']}**")
                        st.markdown(f"Odds: **{bet['odds']}x**")
                        total_odds *= bet["odds"]
                        st.divider()

                    st.markdown(f"### Total Odds: {total_odds:.2f}x")

                    max_wager = max(1.0, float(st.session_state.bankroll))
                    wager = st.number_input(
                        "Wager Amount ($)",
                        min_value=1.0,
                        max_value=max_wager,
                        value=min(10.0, max_wager),
                        step=1.0,
                    )
                    st.success(f"Potential Return: **${(wager * total_odds):.2f}**")

                    if st.button("🗑️ Clear Slip"):
                        st.session_state.bet_slip = []
                        st.rerun()

                    if st.button(
                        "🚀 PLACE ACCUMULATOR", type="primary", use_container_width=True
                    ):
                        if wager > st.session_state.bankroll:
                            st.error("Insufficient funds!")
                        else:
                            st.session_state.bankroll -= wager
                            st.session_state.active_wager = wager
                            st.session_state.active_matches = st.session_state.fixtures
                            st.session_state.simulating = True
                            st.session_state.fpl_live_score = 0
                            st.rerun()
    with tab_league:
        st.title("🏆 Live League Standings")
        st.markdown(
            "Watch the tables evolve as you simulate matches in the Global Sportsbook!"
        )

        standings = st.session_state.league_standings
        tabs = st.tabs(list(standings.keys()))

        for tab, league in zip(tabs, standings.keys()):
            with tab:
                df = pd.DataFrame.from_dict(standings[league], orient="index")
                if df.empty:
                    st.info("No data yet. Go simulate some matches!")
                    continue

                df.index.name = "Team"
                df = df.reset_index()
                # Sort by Points, then Goal Difference, then Goals For
                df = df.sort_values(
                    by=["Pts", "GD", "GF"], ascending=[False, False, False]
                ).reset_index(drop=True)
                df.index = df.index + 1  # 1-indexed positions

                st.dataframe(
                    df,
                    column_config={
                        "Team": "Club",
                        "P": "Played",
                        "W": "Wins",
                        "D": "Draws",
                        "L": "Losses",
                        "GF": "Goals For",
                        "GA": "Goals Against",
                        "GD": "Goal Difference",
                        "Pts": "Points",
                    },
                    use_container_width=True,
                )

    with tab_manager:
        st.title("👔 Manager Mode")
        st.markdown(
            "Take control of a team! Your tactics will directly influence their performance in the Global Sportsbook simulations."
        )

        col1, col2 = st.columns([1, 1])

        with col1:
            st.subheader("Select Your Club")
            # Flatten teams for selectbox
            all_teams = []
            for league, teams in sportsbook.VIRTUAL_TEAMS.items():
                for team in teams.keys():
                    all_teams.append(f"{team} ({league})")

            current_team = st.session_state.user_tactics["team"]
            default_idx = (
                all_teams.index(current_team) if current_team in all_teams else 0
            )

            selected_team_str = st.selectbox(
                "Club to Manage", all_teams, index=default_idx
            )
            st.session_state.user_tactics["team"] = selected_team_str

        with col2:
            st.subheader("Tactical Setup")
            formation = st.selectbox(
                "Formation",
                list(tactics.FORMATIONS.keys()),
                index=list(tactics.FORMATIONS.keys()).index(
                    st.session_state.user_tactics["formation"]
                ),
            )
            style = st.selectbox(
                "Tactical Style",
                list(tactics.TACTICAL_STYLES.keys()),
                index=list(tactics.TACTICAL_STYLES.keys()).index(
                    st.session_state.user_tactics["style"]
                ),
            )

            st.session_state.user_tactics["formation"] = formation
            st.session_state.user_tactics["style"] = style

        st.markdown("---")
        st.subheader("📊 Tactical Analysis")
        f_data = tactics.FORMATIONS[formation]
        s_data = tactics.TACTICAL_STYLES[style]

        st.info(f"**Formation ({formation}):** {f_data['description']}")
        st.info(f"**Style ({style}):** {s_data['description']}")

        # Calculate modifiers
        att_mod = f_data["attack_mod"] * s_data["attack_mod"]
        def_mod = f_data["defense_mod"] * s_data["defense_mod"]

        c1, c2, c3 = st.columns(3)
        c1.metric("Attacking Power Modifier", f"{att_mod:.2f}x")
        c2.metric("Defensive Solidity Modifier", f"{def_mod:.2f}x")
        c3.metric("Foul Frequency Modifier", f"{s_data['foul_mod']:.2f}x")

        st.success(
            "Tactics Locked! Go to the 'Simulate Match' page to see them in action."
        )
elif page == "FPL AI Predictor":
    st.title("🦁 FPL AI Predictor & Squad Optimizer")
    st.write(
        "This page connects to the official Fantasy Premier League API to predict expected points and build the mathematically optimal 15-man squad under £100.0m."
    )

    with st.spinner("Fetching live FPL data..."):
        fpl_df = fetch_fpl_data()

    if not fpl_df.empty:
        st.markdown("---")
        tab_team, tab_transfers, tab_fixtures, tab_ai = st.tabs(
            ["👔 My Team", "🔄 Transfers", "📅 Fixtures", "🤖 AI Assistant"]
        )
        with tab_team:
            user_team_db = load_user_team()
            if user_team_db is None or not user_team_db.get("starters"):
                st.warning(
                    "You don't have a team saved yet! Go to the 'Transfers' tab or use the 'AI Assistant' to build one."
                )
            else:
                st.markdown("### 🏟️ Your Active Squad")
                starters_df = pd.DataFrame(user_team_db["starters"])
                bench_df = pd.DataFrame(user_team_db["bench"])
                captain_id = user_team_db.get("captain_id")

                # Metrics
                col_cap, col_vp, col_pts, col_chip = st.columns(4)

                if captain_id:
                    cap_name = starters_df.loc[starters_df["id"] == captain_id, "name"]
                    cap_name = cap_name.values[0] if not cap_name.empty else "None"
                    col_cap.metric("Captain (x2 Pts)", cap_name)
                else:
                    col_cap.metric("Captain", "None")

                total_ep = starters_df["ep_next"].sum()
                if (
                    captain_id
                    and not starters_df[starters_df["id"] == captain_id].empty
                ):
                    total_ep += starters_df[starters_df["id"] == captain_id][
                        "ep_next"
                    ].values[0]

                col_pts.metric("Projected Points", f"{total_ep:.1f} pts")
                col_chip.metric("Active Chip", user_team_db.get("active_chip", "None"))

                # Select Captain
                new_captain = st.selectbox(
                    "Assign Captain",
                    starters_df["name"].tolist(),
                    index=(
                        starters_df["name"].tolist().index(cap_name)
                        if cap_name != "None"
                        else 0
                    ),
                )
                if st.button("Save Captain"):
                    c_id = starters_df[starters_df["name"] == new_captain].iloc[0]["id"]
                    save_user_team(
                        starters_df,
                        bench_df,
                        user_team_db["budget"],
                        user_team_db["formation"],
                        captain_id=c_id,
                    )
                    st.rerun()

                render_fpl_pitch(
                    starters_df,
                    bench_df,
                    formation=user_team_db["formation"],
                    captain_id=captain_id,
                )

                st.markdown("### 🔄 Substitutions (Drag and Drop)")
                st.caption(
                    "Drag players between Starting XI and Bench to make substitutions."
                )

                from streamlit_sortables import sort_items
                import re

                start_items = [
                    f"{row['name']} ({row['position']}) | ID:{row['id']}"
                    for _, row in starters_df.iterrows()
                ]
                bench_items = [
                    f"{row['name']} ({row['position']}) | ID:{row['id']}"
                    for _, row in bench_df.iterrows()
                ]

                sort_data = [
                    {
                        "header": "Starting XI (Must have exactly 11 players)",
                        "items": start_items,
                    },
                    {"header": "Bench (4 players)", "items": bench_items},
                ]

                sorted_result = sort_items(
                    sort_data,
                    multi_containers=True,
                    direction="vertical",
                    key="sub_drag",
                )

                if sorted_result:
                    new_start_items = sorted_result[0]["items"]
                    new_bench_items = sorted_result[1]["items"]

                    if new_start_items != start_items:
                        if len(new_start_items) != 11:
                            st.error(
                                "Starting XI must have exactly 11 players! Drag players back."
                            )
                        else:

                            def extract_ids(item_list):
                                ids = []
                                for item in item_list:
                                    match = re.search(r"ID:(\d+)", item)
                                    if match:
                                        ids.append(int(match.group(1)))
                                return ids

                            new_start_ids = extract_ids(new_start_items)
                            new_bench_ids = extract_ids(new_bench_items)

                            combined_df = pd.concat([starters_df, bench_df])
                            new_starters_df = combined_df[
                                combined_df["id"].isin(new_start_ids)
                            ]
                            new_bench_df = combined_df[
                                combined_df["id"].isin(new_bench_ids)
                            ]

                            gk_count = len(
                                new_starters_df[
                                    new_starters_df["position"] == "Goalkeeper"
                                ]
                            )
                            def_count = len(
                                new_starters_df[
                                    new_starters_df["position"] == "Defender"
                                ]
                            )
                            mid_count = len(
                                new_starters_df[
                                    new_starters_df["position"] == "Midfielder"
                                ]
                            )
                            fwd_count = len(
                                new_starters_df[
                                    new_starters_df["position"] == "Attacker"
                                ]
                            )

                            if gk_count != 1:
                                st.error(
                                    "You must have exactly 1 Goalkeeper in your Starting XI!"
                                )
                            elif def_count < 3 or def_count > 5:
                                st.error(
                                    "You must have between 3 and 5 Defenders in your Starting XI!"
                                )
                            elif fwd_count < 1 or fwd_count > 3:
                                st.error(
                                    "You must have between 1 and 3 Attackers in your Starting XI!"
                                )
                            else:
                                new_formation = f"{def_count}-{mid_count}-{fwd_count}"
                                if st.button(
                                    f"Confirm Substitutions (New Formation: {new_formation})",
                                    type="primary",
                                ):
                                    save_user_team(
                                        new_starters_df,
                                        new_bench_df,
                                        user_team_db["budget"],
                                        new_formation,
                                        captain_id=captain_id,
                                    )
                                    st.rerun()

        with tab_transfers:
            st.markdown("### 🔄 Transfer Market")
            user_team_db = load_user_team()
            budget = user_team_db["budget"] if user_team_db else 100.0

            col_b1, col_b2 = st.columns(2)
            col_b1.metric("Bank Balance", f"£{budget:.1f}m")

            st.markdown("#### Your Current Squad (Sell Players)")

            if user_team_db:
                current_squad_df = pd.DataFrame(
                    user_team_db["starters"] + user_team_db["bench"]
                )
            else:
                current_squad_df = pd.DataFrame()

            if not current_squad_df.empty:
                col1, col2 = st.columns(2)
                with col1:
                    sell_player = st.selectbox(
                        "Select a player to SELL",
                        [""] + current_squad_df["name"].tolist(),
                    )
                with col2:
                    st.write("")
                    st.write("")
                    if st.button("SELL Player", type="primary") and sell_player:
                        p_price = current_squad_df[
                            current_squad_df["name"] == sell_player
                        ].iloc[0]["price"]
                        s_df = pd.DataFrame(user_team_db["starters"])
                        b_df = pd.DataFrame(user_team_db["bench"])
                        s_df = s_df[s_df["name"] != sell_player]
                        b_df = b_df[b_df["name"] != sell_player]
                        new_budget = budget + p_price
                        save_user_team(
                            s_df,
                            b_df,
                            new_budget,
                            user_team_db["formation"],
                            user_team_db.get("captain_id"),
                        )
                        st.rerun()

            st.markdown("---")
            st.markdown("#### All Players (Buy Players)")

            buy_player = st.selectbox(
                "Select a player to BUY", [""] + fpl_df["name"].tolist()
            )
            if st.button("BUY Player", type="primary") and buy_player:
                p_data = fpl_df[fpl_df["name"] == buy_player].iloc[0]
                if (
                    not current_squad_df.empty
                    and buy_player in current_squad_df["name"].values
                ):
                    st.error("You already own this player!")
                elif p_data["price"] > budget:
                    st.error(
                        f"Not enough budget! {buy_player} costs £{p_data['price']}m."
                    )
                elif not current_squad_df.empty and len(current_squad_df) >= 15:
                    st.error("Squad is full (15 players maximum).")
                else:
                    b_df = (
                        pd.DataFrame(user_team_db["bench"])
                        if user_team_db
                        else pd.DataFrame()
                    )
                    s_df = (
                        pd.DataFrame(user_team_db["starters"])
                        if user_team_db
                        else pd.DataFrame()
                    )
                    b_df = pd.concat([b_df, pd.DataFrame([p_data])], ignore_index=True)
                    new_budget = budget - p_data["price"]
                    save_user_team(
                        s_df,
                        b_df,
                        new_budget,
                        user_team_db["formation"] if user_team_db else "3-4-3",
                        user_team_db.get("captain_id") if user_team_db else None,
                    )
                    st.rerun()

            st.markdown("---")
            st.markdown("#### Player Database")
            search_query = st.text_input("Search Player by Name")

            display_df = fpl_df.copy()
            if search_query:
                display_df = display_df[
                    display_df["name"].str.contains(search_query, case=False)
                ]

            st.dataframe(
                display_df[
                    [
                        "name",
                        "team",
                        "position",
                        "price",
                        "ep_next",
                        "total_points",
                        "selected_by",
                        "price_pred",
                    ]
                ],
                use_container_width=True,
                height=400,
            )

        with tab_fixtures:
            st.markdown("### 📅 Upcoming Fixtures & FDR")
            st.info(
                "Coming soon: Integrating live fixture difficulty ratings from FPL."
            )

        with tab_ai:
            st.markdown("---")

            # Optimizer Section
            st.subheader("🛠️ AI Squad Optimizer")

            c_opt1, c_opt2 = st.columns(2)
            with c_opt1:
                budget = st.slider(
                    "Set Maximum Budget (£M)",
                    min_value=75.0,
                    max_value=100.0,
                    value=100.0,
                    step=0.1,
                )
            with c_opt2:
                formation_choice = st.selectbox(
                    "Select Formation",
                    ["3-4-3", "3-5-2", "4-4-2", "4-3-3", "5-3-2", "5-4-1"],
                )

            if "fpl_squad" not in st.session_state:
                st.session_state.fpl_squad = pd.DataFrame()
                st.session_state.fpl_starters = pd.DataFrame()
                st.session_state.fpl_bench = pd.DataFrame()
                st.session_state.fpl_formation = "3-4-3"
                st.session_state.fpl_budget = 100.0

            if st.button("Generate Optimal Squad", type="primary"):
                st.session_state.fpl_squad = optimize_fpl_squad(fpl_df, budget=budget)
                st.session_state.fpl_budget = budget
                st.session_state.fpl_formation = formation_choice
                st.session_state.fpl_starters, st.session_state.fpl_bench = (
                    split_fpl_squad(
                        st.session_state.fpl_squad, formation=formation_choice
                    )
                )

                # Auto-assign captain based on highest expected points
                s = st.session_state.fpl_starters
                c_id = s.loc[s["ep_next"].idxmax(), "id"] if not s.empty else None

                # Save to Supabase
                save_user_team(
                    st.session_state.fpl_starters,
                    st.session_state.fpl_bench,
                    budget,
                    formation_choice,
                    captain_id=c_id,
                )

                st.success(
                    "Squad optimized and saved to your cloud database! Go to 'My Team' tab to view it."
                )

            if not st.session_state.fpl_squad.empty:
                optimal_squad = st.session_state.fpl_squad

                total_cost = optimal_squad["price"].sum()

                starters = st.session_state.fpl_starters
                if not starters.empty:
                    captain_idx = starters["ep_next"].idxmax()
                    captain_id = starters.loc[captain_idx, "id"]
                    captain_ep = starters.loc[captain_idx, "ep_next"]
                    total_ep = starters["ep_next"].sum() + captain_ep
                else:
                    captain_id = None
                    total_ep = 0.0

                c1, c2, c3 = st.columns(3)
                c1.metric("Squad Size", f"{len(optimal_squad)} / 15")
                c2.metric(
                    "Total Budget Used",
                    f"£{total_cost:.1f}m",
                    f"£{st.session_state.fpl_budget - total_cost:.1f}m remaining",
                )
                c3.metric("Starting XI Expected Pts", f"{total_ep:.1f} pts")

                st.markdown(
                    f"### 📋 The Optimized 15-Man Squad ({st.session_state.fpl_formation})"
                )
                render_fpl_pitch(
                    st.session_state.fpl_starters,
                    st.session_state.fpl_bench,
                    formation=st.session_state.fpl_formation,
                    captain_id=captain_id,
                )

                st.markdown("---")
                st.subheader("🔄 Substitutions")
                col_sub1, col_sub2, col_sub3 = st.columns([2, 2, 1])
                with col_sub1:
                    sub_out_name = st.selectbox(
                        "Sub OUT (Starter)",
                        (
                            st.session_state.fpl_starters["name"].tolist()
                            if not st.session_state.fpl_starters.empty
                            else []
                        ),
                    )
                with col_sub2:
                    sub_in_name = st.selectbox(
                        "Sub IN (Bench)",
                        (
                            st.session_state.fpl_bench["name"].tolist()
                            if not st.session_state.fpl_bench.empty
                            else []
                        ),
                    )

                with col_sub3:
                    st.write("")
                    st.write("")
                    if st.button("Make Substitution"):
                        if sub_out_name and sub_in_name:
                            out_idx = st.session_state.fpl_starters.index[
                                st.session_state.fpl_starters["name"] == sub_out_name
                            ][0]
                            in_idx = st.session_state.fpl_bench.index[
                                st.session_state.fpl_bench["name"] == sub_in_name
                            ][0]

                            out_player = st.session_state.fpl_starters.loc[out_idx]
                            in_player = st.session_state.fpl_bench.loc[in_idx]

                            if out_player["pos_id"] == 1 and in_player["pos_id"] != 1:
                                st.error(
                                    "Cannot swap a Goalkeeper for an Outfield player!"
                                )
                            elif out_player["pos_id"] != 1 and in_player["pos_id"] == 1:
                                st.error(
                                    "Cannot swap an Outfield player for a Goalkeeper!"
                                )
                            else:
                                st.session_state.fpl_starters.loc[out_idx] = in_player
                                st.session_state.fpl_bench.loc[in_idx] = out_player

                                defs = len(
                                    st.session_state.fpl_starters[
                                        st.session_state.fpl_starters["pos_id"] == 2
                                    ]
                                )
                                mids = len(
                                    st.session_state.fpl_starters[
                                        st.session_state.fpl_starters["pos_id"] == 3
                                    ]
                                )
                                fwds = len(
                                    st.session_state.fpl_starters[
                                        st.session_state.fpl_starters["pos_id"] == 4
                                    ]
                                )

                                if defs < 3:
                                    st.error(
                                        "Invalid formation! Must have at least 3 Defenders."
                                    )
                                    st.session_state.fpl_starters.loc[out_idx] = (
                                        out_player
                                    )
                                    st.session_state.fpl_bench.loc[in_idx] = in_player
                                elif fwds < 1:
                                    st.error(
                                        "Invalid formation! Must have at least 1 Forward."
                                    )
                                    st.session_state.fpl_starters.loc[out_idx] = (
                                        out_player
                                    )
                                    st.session_state.fpl_bench.loc[in_idx] = in_player
                                else:
                                    st.session_state.fpl_formation = (
                                        f"{defs}-{mids}-{fwds}"
                                    )
                                    st.rerun()

                st.markdown("---")
                st.markdown("### 📈 Squad Analytics")
                col_chart1, col_chart2 = st.columns(2)

                with col_chart1:
                    # Scatter Plot: Price vs Expected Points
                    fig_scatter = go.Figure()
                    for pos in ["Goalkeeper", "Defender", "Midfielder", "Attacker"]:
                        pos_data = optimal_squad[optimal_squad["position"] == pos]
                        if not pos_data.empty:
                            fig_scatter.add_trace(
                                go.Scatter(
                                    x=pos_data["price"],
                                    y=pos_data["ep_next"],
                                    mode="markers+text",
                                    name=pos,
                                    text=pos_data["name"],
                                    textposition="top center",
                                    marker=dict(
                                        size=10,
                                        line=dict(width=1, color="DarkSlateGrey"),
                                    ),
                                )
                            )
                    fig_scatter.update_layout(
                        title="💰 Cost vs. Expected Points",
                        xaxis_title="Price (£M)",
                        yaxis_title="Expected Points",
                        template="plotly_white",
                        height=400,
                    )
                    st.plotly_chart(fig_scatter, use_container_width=True)

                with col_chart2:
                    # Pie Chart: Budget Distribution
                    budget_by_pos = (
                        optimal_squad.groupby("position")["price"].sum().reset_index()
                    )
                    fig_pie = go.Figure(
                        data=[
                            go.Pie(
                                labels=budget_by_pos["position"],
                                values=budget_by_pos["price"],
                                hole=0.3,
                                marker_colors=[
                                    "#F1C40F",
                                    "#3498DB",
                                    "#E74C3C",
                                    "#2ECC71",
                                ],
                            )
                        ]
                    )
                    fig_pie.update_layout(title="🥧 Budget Distribution", height=400)
                    st.plotly_chart(fig_pie, use_container_width=True)

            st.markdown("---")
            # Analytics Section
            st.subheader("📊 FPL Player Analytics (Top Expected Points)")
            st.dataframe(
                fpl_df[
                    [
                        "name",
                        "team",
                        "position",
                        "price",
                        "ep_next",
                        "selected_by",
                        "total_points",
                    ]
                ].head(30),
                column_config={
                    "name": "Player",
                    "team": "Team",
                    "position": "Position",
                    "price": st.column_config.NumberColumn("Price (£)", format="£%.1f"),
                    "ep_next": st.column_config.NumberColumn(
                        "Expected Pts", format="%.1f"
                    ),
                    "selected_by": st.column_config.NumberColumn(
                        "Selected By %", format="%.1f%%"
                    ),
                    "total_points": "Total Points",
                },
                hide_index=True,
                use_container_width=True,
            )

elif page == "Ultimate Team":
    st.title("🎴 Ultimate Team")
    st.markdown(
        "Open packs, collect players, and build your dream squad using your virtual bankroll!"
    )
    import ultimate_team

    if "bankroll" not in st.session_state:
        st.session_state.bankroll = 1000.0

    st.markdown(f"### 🏦 Virtual Balance: **${st.session_state.bankroll:.2f}**")

    tab_store, tab_club, tab_transfer, tab_play = st.tabs(
        ["🛒 Pack Store", "🏟️ My Club", "🔁 Transfer Market", "⚽ Play Match"]
    )

    with tab_store:
        st.subheader("Buy Packs")
        cols = st.columns(4)
        for idx, (pack_name, pack_data) in enumerate(ultimate_team.PACKS.items()):
            col = cols[idx % 4]
            with col:
                st.markdown(f"**{pack_name}**")
                st.caption(pack_data["description"])
                st.markdown(f"💰 Price: **${pack_data['price']}**")

                if st.button(f"Buy {pack_name}", key=f"buy_{pack_name}"):
                    if st.session_state.bankroll >= pack_data["price"]:
                        st.session_state.bankroll -= pack_data["price"]
                        with st.spinner("Opening Pack... 🎴✨"):
                            import time

                            time.sleep(1.5)
                            pulled_players = ultimate_team.open_pack(pack_name)
                            st.session_state.my_club_players.extend(pulled_players)

                        st.success(f"Successfully opened {pack_name}!")
                        for p in pulled_players:
                            color = "gray"
                            if p["rarity"] == "Bronze":
                                color = "#cd7f32"
                            elif p["rarity"] == "Silver":
                                color = "silver"
                            elif p["rarity"] == "Gold":
                                color = "gold"
                            elif p["rarity"] == "Icon":
                                color = "#f8f9fa"
                            st.markdown(
                                f"<div style='padding: 10px; margin: 5px; border-left: 5px solid {color}; background-color: #2c2c2c; border-radius: 5px;'><b>{p['name']}</b> ({p['position']}) - {p['rating']} OVR <br><small>{p['rarity']}</small></div>",
                                unsafe_allow_html=True,
                            )

                    else:
                        st.error(
                            "Not enough funds! Go win some bets in the Sportsbook."
                        )

    with tab_club:
        st.subheader(f"My Players ({len(st.session_state.my_club_players)})")
        if not st.session_state.my_club_players:
            st.info("Your club is empty! Go buy some packs in the Store.")
        else:
            club = sorted(
                st.session_state.my_club_players,
                key=lambda x: x["rating"],
                reverse=True,
            )
            club_cols = st.columns(4)
            for idx, p in enumerate(club):
                color = "gray"
                if p["rarity"] == "Bronze":
                    color = "#cd7f32"
                elif p["rarity"] == "Silver":
                    color = "silver"
                elif p["rarity"] == "Gold":
                    color = "gold"
                elif p["rarity"] == "Icon":
                    color = "white"

                with club_cols[idx % 4]:
                    st.markdown(
                        f"""
                    <div style='padding: 15px; margin-bottom: 10px; border: 2px solid {color}; border-radius: 8px; text-align: center; background: linear-gradient(145deg, #1e1e1e, #2c2c2c);'>
                        <h4 style='color: {color}; margin:0;'>{p['rating']}</h4>
                        <p style='margin:0;'><b>{p['name']}</b></p>
                        <p style='margin:0; font-size: 12px;'>{p['position']}</p>
                    </div>
                    """,
                        unsafe_allow_html=True,
                    )

    with tab_transfer:
        st.subheader("Transfer Market (Quick Sell)")
        st.markdown("Sell unwanted players from your club to increase your bankroll.")

        if not st.session_state.my_club_players:
            st.info("You don't have any players to sell!")
        else:
            col1, col2 = st.columns([3, 1])
            with col2:
                if st.button("🗑️ Quick Sell All Bronze", type="primary"):
                    bronze_players = [
                        p
                        for p in st.session_state.my_club_players
                        if p["rarity"] == "Bronze"
                    ]
                    if bronze_players:
                        revenue = sum(
                            [
                                ultimate_team.get_sell_value("Bronze")
                                for _ in bronze_players
                            ]
                        )
                        st.session_state.bankroll += revenue
                        st.session_state.my_club_players = [
                            p
                            for p in st.session_state.my_club_players
                            if p["rarity"] != "Bronze"
                        ]
                        st.success(
                            f"Sold {len(bronze_players)} Bronze players for ${revenue:.2f}!"
                        )
                        st.rerun()
                    else:
                        st.warning("No Bronze players to sell.")

            st.markdown("### Individual Sell")
            for i, p in enumerate(st.session_state.my_club_players):
                sell_val = ultimate_team.get_sell_value(p["rarity"])
                scol1, scol2, scol3 = st.columns([4, 2, 2])
                scol1.markdown(
                    f"**{p['name']}** ({p['position']}) - {p['rating']} OVR ({p['rarity']})"
                )
                scol2.markdown(f"Value: **${sell_val}**")
                if scol3.button("Sell", key=f"sell_{p['id']}_{i}"):
                    st.session_state.bankroll += sell_val
                    st.session_state.my_club_players.pop(i)
                    st.rerun()

    with tab_play:
        st.subheader("Play Match")
        st.markdown(
            "Select 11 players from your club to form a starting XI and play a match against a random AI team! (Entry Fee: $100)"
        )

        club_options = [
            f"{p['name']} ({p['position']} - {p['rating']} OVR) | ID:{p['id']}"
            for p in st.session_state.my_club_players
        ]

        selected_players_str = st.multiselect(
            "Select your Starting XI (Exactly 11)", club_options
        )

        if len(selected_players_str) == 11:
            import re

            selected_ids = []
            for s in selected_players_str:
                match = re.search(r"ID:(.+)", s)
                if match:
                    selected_ids.append(match.group(1))

            selected_players = [
                p for p in st.session_state.my_club_players if p["id"] in selected_ids
            ]

            avg_rating = int(sum([p["rating"] for p in selected_players]) / 11)
            st.success(f"**Squad Power: {avg_rating} OVR**")

            import sportsbook

            opponent_league = random.choice(list(sportsbook.VIRTUAL_TEAMS.keys()))
            opponent_name = random.choice(
                list(sportsbook.VIRTUAL_TEAMS[opponent_league].keys())
            )
            opponent_data = sportsbook.VIRTUAL_TEAMS[opponent_league][opponent_name]

            st.markdown(
                f"### 🆚 Opponent: **{opponent_name}** ({opponent_data['power']} OVR)"
            )

            if st.button("🚀 Start Match ($100 Entry)"):
                if st.session_state.bankroll < 100:
                    st.error("Insufficient funds for entry fee!")
                else:
                    st.session_state.bankroll -= 100
                    st.session_state.ut_match_active = True
                    st.session_state.ut_custom_team = {
                        "name": "Ultimate Team",
                        "power": avg_rating,
                        "star": "UT Captain",
                    }
                    st.session_state.ut_opponent = {
                        "name": opponent_name,
                        "power": opponent_data["power"],
                        "star": opponent_data["star"],
                    }
                    st.rerun()

        elif len(selected_players_str) > 11:
            st.error("You can only select exactly 11 players!")

        if st.session_state.get("ut_match_active", False):
            st.markdown("---")
            st.markdown("## 🔴 LIVE ULTIMATE TEAM MATCH")

            tracker = st.empty()

            import sportsbook

            custom_home = st.session_state.ut_custom_team
            custom_away = st.session_state.ut_opponent

            match_obj = {
                "id": "ut_match",
                "home": {
                    "name": custom_home["name"],
                    "power": custom_home["power"],
                    "star": custom_home["star"],
                    "league": "UT",
                },
                "away": {
                    "name": custom_away["name"],
                    "power": custom_away["power"],
                    "star": custom_away["star"],
                    "league": "UT",
                },
                "odds": sportsbook.calculate_all_odds(
                    {"power": custom_home["power"]}, {"power": custom_away["power"]}
                ),
            }

            win_prize = 500 + (custom_away["power"] * 10)

            for minute, matches in sportsbook.run_90_second_simulation([match_obj]):
                m = matches[0]
                with tracker.container():
                    st.markdown(f"### ⏱️ {minute}' MIN")
                    col1, col2, col3 = st.columns([3, 1, 3])
                    col1.markdown(f"**{m['home']['name']}**")
                    col2.markdown(
                        f"<h3 style='text-align: center; margin: 0;'>{m['h_goals']} - {m['a_goals']}</h3>",
                        unsafe_allow_html=True,
                    )
                    col3.markdown(
                        f"<p style='text-align: right;'><b>{m['away']['name']}</b></p>",
                        unsafe_allow_html=True,
                    )
                    if m["events"]:
                        st.caption(f"Latest: {m['events'][0]}")

            st.session_state.ut_match_active = False
            m = match_obj
            if m["h_goals"] > m["a_goals"]:
                st.session_state.bankroll += win_prize
                st.balloons()
                st.success(f"🎉 YOU WON! Prize: **${win_prize}** added to bankroll.")
            elif m["h_goals"] < m["a_goals"]:
                st.error("💀 You Lost. Better luck next time!")
            else:
                st.session_state.bankroll += 100
                st.info("🤝 Draw! Entry fee refunded.")

# Sync wallet with Supabase at the end of the run if it changed
if st.session_state.user and supabase:
    if st.session_state.bankroll != st.session_state._initial_bankroll:
        try:
            supabase.table("wallets").update({"balance": st.session_state.bankroll}).eq(
                "user_id", st.session_state.user.id
            ).execute()
            st.session_state._initial_bankroll = st.session_state.bankroll
        except Exception as e:
            pass
