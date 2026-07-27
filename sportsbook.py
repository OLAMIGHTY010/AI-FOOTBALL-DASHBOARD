import random
import time
import streamlit as st

# 1. Global Virtual Database
# Format: "Team": {"power": int, "star": "Player Name"}
VIRTUAL_TEAMS = {
    "Premier League": {
        "Man City": {"power": 92, "star": "E. Haaland"},
        "Arsenal": {"power": 89, "star": "B. Saka"},
        "Liverpool": {"power": 88, "star": "M. Salah"},
        "Chelsea": {"power": 85, "star": "C. Palmer"},
        "Tottenham": {"power": 83, "star": "H. Son"},
        "Man United": {"power": 82, "star": "B. Fernandes"},
        "Newcastle": {"power": 81, "star": "A. Isak"},
        "Aston Villa": {"power": 80, "star": "O. Watkins"},
        "West Ham": {"power": 78, "star": "J. Bowen"},
        "Brighton": {"power": 77, "star": "K. Mitoma"},
        "Crystal Palace": {"power": 76, "star": "E. Eze"},
        "Fulham": {"power": 75, "star": "A. Robinson"},
        "Bournemouth": {"power": 74, "star": "D. Solanke"},
        "Wolves": {"power": 73, "star": "P. Neto"},
        "Everton": {"power": 74, "star": "J. Pickford"},
        "Brentford": {"power": 75, "star": "I. Toney"},
        "Nott'm Forest": {"power": 73, "star": "M. Gibbs-White"},
        "Leicester": {"power": 72, "star": "K. Dewsbury-Hall"},
        "Southampton": {"power": 71, "star": "A. Armstrong"},
        "Ipswich Town": {"power": 70, "star": "C. Chaplin"},
    },
    "La Liga": {
        "Real Madrid": {"power": 93, "star": "K. Mbappe"},
        "Barcelona": {"power": 88, "star": "R. Lewandowski"},
        "Atletico Madrid": {"power": 85, "star": "A. Griezmann"},
        "Girona": {"power": 80, "star": "A. Dovbyk"},
        "Real Sociedad": {"power": 79, "star": "M. Oyarzabal"},
        "Athletic Club": {"power": 78, "star": "I. Williams"},
        "Real Betis": {"power": 77, "star": "I. Isco"},
        "Villarreal": {"power": 76, "star": "G. Moreno"},
        "Valencia": {"power": 75, "star": "H. Duro"},
        "Osasuna": {"power": 74, "star": "A. Budimir"},
        "Getafe": {"power": 73, "star": "B. Mayoral"},
        "Celta Vigo": {"power": 74, "star": "I. Aspas"},
        "Sevilla": {"power": 75, "star": "Y. En-Nesyri"},
        "Mallorca": {"power": 73, "star": "V. Muriqi"},
        "Alaves": {"power": 72, "star": "S. Omorodion"},
        "Las Palmas": {"power": 72, "star": "K. Rodriguez"},
        "Rayo Vallecano": {"power": 71, "star": "I. Palazon"},
        "Leganes": {"power": 70, "star": "M. Garcia"},
        "Real Valladolid": {"power": 69, "star": "S. Sylla"},
        "Espanyol": {"power": 71, "star": "J. Puado"},
    },
    "Serie A": {
        "Inter Milan": {"power": 88, "star": "L. Martinez"},
        "AC Milan": {"power": 85, "star": "R. Leao"},
        "Juventus": {"power": 84, "star": "D. Vlahovic"},
        "Napoli": {"power": 82, "star": "V. Osimhen"},
        "AS Roma": {"power": 81, "star": "P. Dybala"},
        "Atalanta": {"power": 80, "star": "G. Scamacca"},
        "Lazio": {"power": 79, "star": "M. Zaccagni"},
        "Fiorentina": {"power": 78, "star": "N. Gonzalez"},
        "Torino": {"power": 77, "star": "D. Zapata"},
        "Bologna": {"power": 79, "star": "J. Zirkzee"},
        "Monza": {"power": 75, "star": "M. Pessina"},
        "Genoa": {"power": 74, "star": "A. Gudmundsson"},
        "Lecce": {"power": 73, "star": "N. Krstovic"},
        "Udinese": {"power": 74, "star": "L. Samardzic"},
        "Hellas Verona": {"power": 72, "star": "T. Noslin"},
        "Cagliari": {"power": 71, "star": "Z. Luvumbo"},
        "Empoli": {"power": 70, "star": "N. Cambiaghi"},
        "Parma": {"power": 71, "star": "D. Man"},
        "Como": {"power": 70, "star": "P. Cutrone"},
        "Venezia": {"power": 69, "star": "J. Pohjanpalo"},
    },
    "Bundesliga": {
        "Bayern Munich": {"power": 90, "star": "H. Kane"},
        "B. Leverkusen": {"power": 88, "star": "F. Wirtz"},
        "Borussia Dortmund": {"power": 85, "star": "J. Brandt"},
        "RB Leipzig": {"power": 84, "star": "X. Simons"},
        "VfB Stuttgart": {"power": 82, "star": "S. Guirassy"},
        "Eintracht Frankfurt": {"power": 79, "star": "O. Marmoush"},
        "SC Freiburg": {"power": 78, "star": "V. Grifo"},
        "Hoffenheim": {"power": 77, "star": "M. Beier"},
        "Werder Bremen": {"power": 75, "star": "M. Ducksch"},
        "FC Heidenheim": {"power": 74, "star": "T. Kleindienst"},
        "FC Augsburg": {"power": 73, "star": "E. Demirovic"},
        "VfL Wolfsburg": {"power": 75, "star": "J. Wind"},
        "Mainz 05": {"power": 74, "star": "J. Burkardt"},
        "Bor. M'gladbach": {"power": 76, "star": "A. Plea"},
        "Union Berlin": {"power": 75, "star": "R. Gosens"},
        "VfL Bochum": {"power": 72, "star": "T. Asano"},
        "St. Pauli": {"power": 70, "star": "M. Irvine"},
        "Holstein Kiel": {"power": 69, "star": "S. Skrzybski"},
    },
    "Ligue 1": {
        "PSG": {"power": 89, "star": "O. Dembele"},
        "Monaco": {"power": 82, "star": "W. Ben Yedder"},
        "Brest": {"power": 80, "star": "R. Del Castillo"},
        "Lille": {"power": 81, "star": "J. David"},
        "Nice": {"power": 79, "star": "T. Moffi"},
        "Lyon": {"power": 78, "star": "A. Lacazette"},
        "Lens": {"power": 80, "star": "F. Sotoca"},
        "Marseille": {"power": 81, "star": "P. Aubameyang"},
        "Reims": {"power": 76, "star": "O. Diakite"},
        "Rennes": {"power": 77, "star": "A. Kalimuendo"},
        "Toulouse": {"power": 75, "star": "T. Dallinga"},
        "Montpellier": {"power": 74, "star": "T. Savanier"},
        "Strasbourg": {"power": 73, "star": "E. Emegha"},
        "Nantes": {"power": 72, "star": "M. Mohamed"},
        "Le Havre": {"power": 71, "star": "M. Bayo"},
        "Auxerre": {"power": 70, "star": "G. Hein"},
        "Angers": {"power": 69, "star": "L. Diony"},
        "Saint-Etienne": {"power": 71, "star": "I. Sissoko"},
    },
    "Saudi Pro League": {
        "Al Hilal": {"power": 82, "star": "Neymar Jr."},
        "Al Nassr": {"power": 81, "star": "C. Ronaldo"},
        "Al Ahli": {"power": 79, "star": "R. Mahrez"},
        "Al Ittihad": {"power": 80, "star": "K. Benzema"},
        "Al Taawoun": {"power": 74, "star": "M. Barrow"},
        "Al Ettifaq": {"power": 75, "star": "M. Dembele"},
        "Al Fateh": {"power": 73, "star": "C. Tello"},
        "Al Shabab": {"power": 74, "star": "Y. Carrasco"},
        "Al Fayha": {"power": 71, "star": "F. Sakala"},
        "Damac": {"power": 72, "star": "G. N'Koudou"},
        "Al Khaleej": {"power": 70, "star": "F. Martins"},
        "Al Raed": {"power": 69, "star": "J. Tavares"},
        "Al Wehda": {"power": 71, "star": "O. Ighalo"},
        "Al Riyadh": {"power": 68, "star": "K. Musona"},
        "Al Okhdood": {"power": 67, "star": "F. Tanase"},
        "Al Qadsiah": {"power": 73, "star": "P. Aubameyang"},
    },
    "MLS (USA)": {
        "Inter Miami": {"power": 77, "star": "L. Messi"},
        "Columbus Crew": {"power": 75, "star": "C. Hernandez"},
        "LAFC": {"power": 74, "star": "D. Bouanga"},
        "FC Cincinnati": {"power": 74, "star": "L. Acosta"},
        "LA Galaxy": {"power": 73, "star": "R. Puig"},
        "Real Salt Lake": {"power": 72, "star": "C. Arango"},
        "NY Red Bulls": {"power": 71, "star": "E. Forsberg"},
        "Orlando City": {"power": 72, "star": "F. Torres"},
        "Seattle Sounders": {"power": 73, "star": "J. Morris"},
        "Atlanta United": {"power": 71, "star": "T. Almada"},
        "Philadelphia Union": {"power": 72, "star": "D. Gazdag"},
        "NYCFC": {"power": 70, "star": "S. Rodriguez"},
        "Portland Timbers": {"power": 71, "star": "Evander"},
        "Houston Dynamo": {"power": 70, "star": "H. Herrera"},
    },
    "World Cup": {
        "Argentina": {"power": 92, "star": "L. Messi"},
        "France": {"power": 91, "star": "K. Mbappe"},
        "Brazil": {"power": 89, "star": "Vini Jr."},
        "England": {"power": 88, "star": "J. Bellingham"},
        "Spain": {"power": 87, "star": "L. Yamal"},
        "Germany": {"power": 86, "star": "F. Wirtz"},
        "Portugal": {"power": 85, "star": "C. Ronaldo"},
        "Netherlands": {"power": 84, "star": "V. van Dijk"},
        "Italy": {"power": 83, "star": "N. Barella"},
        "Belgium": {"power": 82, "star": "K. De Bruyne"},
        "Uruguay": {"power": 83, "star": "F. Valverde"},
        "Croatia": {"power": 81, "star": "L. Modric"},
        "USA": {"power": 78, "star": "C. Pulisic"},
        "Mexico": {"power": 77, "star": "S. Gimenez"},
        "Colombia": {"power": 80, "star": "L. Diaz"},
        "Japan": {"power": 77, "star": "K. Mitoma"},
    },
    "AFCON": {
        "Senegal": {"power": 81, "star": "S. Mane"},
        "Morocco": {"power": 82, "star": "A. Hakimi"},
        "Nigeria": {"power": 80, "star": "V. Osimhen"},
        "Ivory Coast": {"power": 79, "star": "S. Haller"},
        "Egypt": {"power": 78, "star": "M. Salah"},
        "Algeria": {"power": 77, "star": "R. Mahrez"},
        "Cameroon": {"power": 76, "star": "A. Onana"},
        "Ghana": {"power": 75, "star": "M. Kudus"},
        "Mali": {"power": 74, "star": "Y. Bissouma"},
        "South Africa": {"power": 73, "star": "P. Tau"},
        "DR Congo": {"power": 74, "star": "C. Mbemba"},
        "Burkina Faso": {"power": 72, "star": "E. Tapsoba"},
        "Guinea": {"power": 73, "star": "S. Guirassy"},
        "Cape Verde": {"power": 71, "star": "Bebe"},
    },
}


def generate_fixtures(num_matches=10):
    fixtures = []
    match_id_counter = 1

    # Generate a full matchweek for every league
    for league, teams in VIRTUAL_TEAMS.items():
        league_teams = [
            {"name": t, "league": league, "power": v["power"], "star": v["star"]}
            for t, v in teams.items()
        ]

        # Shuffle to randomize matchups
        random.shuffle(league_teams)

        # Pair them up (0 vs 1, 2 vs 3, etc.)
        for i in range(0, len(league_teams), 2):
            if i + 1 < len(league_teams):
                t1 = league_teams[i]
                t2 = league_teams[i + 1]

                fixtures.append(
                    {
                        "id": f"match_{match_id_counter}",
                        "home": t1,
                        "away": t2,
                        "odds": calculate_all_odds(t1, t2),
                    }
                )
                match_id_counter += 1

    return fixtures


def calculate_all_odds(h_team, a_team):
    h_power = h_team["power"]
    a_power = a_team["power"]

    user_tactics = st.session_state.get("user_tactics")
    if user_tactics and user_tactics["team"]:
        ut_name = user_tactics["team"].split(" (")[0]
        import tactics

        f_data = tactics.FORMATIONS.get(
            user_tactics["formation"], {"attack_mod": 1.0, "defense_mod": 1.0}
        )
        s_data = tactics.TACTICAL_STYLES.get(
            user_tactics["style"],
            {"attack_mod": 1.0, "defense_mod": 1.0, "foul_mod": 1.0, "corner_mod": 1.0},
        )

        att_mod = f_data["attack_mod"] * s_data["attack_mod"]
        def_mod = f_data["defense_mod"] * s_data["defense_mod"]

        if h_team["name"] == ut_name:
            h_power = h_power * att_mod
            a_power = a_power * (2.0 - def_mod)
        elif a_team["name"] == ut_name:
            a_power = a_power * att_mod
            h_power = h_power * (2.0 - def_mod)
    total = h_power + a_power
    h_prob = min(max(h_power / total, 0.2), 0.8) * 0.75
    a_prob = min(max(a_power / total, 0.2), 0.8) * 0.75
    d_prob = 1.0 - (h_prob + a_prob)

    house_edge = 0.92

    # 1X2
    odds_1 = round((1 / h_prob) * house_edge, 2)
    odds_x = round((1 / d_prob) * house_edge, 2)
    odds_2 = round((1 / a_prob) * house_edge, 2)

    # Double Chance
    odds_1x = round((1 / (h_prob + d_prob)) * house_edge, 2)
    odds_12 = round((1 / (h_prob + a_prob)) * house_edge, 2)
    odds_x2 = round((1 / (d_prob + a_prob)) * house_edge, 2)

    # Goals O/U 2.5
    avg_goals_expected = (total / 100) * 1.5
    over_prob = min(max(avg_goals_expected / 3.0, 0.3), 0.7)
    under_prob = 1.0 - over_prob
    odds_over = round((1 / over_prob) * house_edge, 2)
    odds_under = round((1 / under_prob) * house_edge, 2)

    # BTTS
    btts_yes_prob = min(max((h_power * a_power) / (95 * 95), 0.3), 0.7)
    btts_no_prob = 1.0 - btts_yes_prob
    odds_btts_yes = round((1 / btts_yes_prob) * house_edge, 2)
    odds_btts_no = round((1 / btts_no_prob) * house_edge, 2)

    # Corners O/U 9.5
    corner_over_prob = min(max((total - 150) / 40.0, 0.3), 0.7)
    corner_under_prob = 1.0 - corner_over_prob
    odds_corner_over = round((1 / corner_over_prob) * house_edge, 2)
    odds_corner_under = round((1 / corner_under_prob) * house_edge, 2)

    # Yellow Cards O/U 3.5
    power_diff = abs(h_power - a_power)
    card_over_prob = min(max(1.0 - (power_diff / 20.0), 0.3), 0.7)
    card_under_prob = 1.0 - card_over_prob
    odds_card_over = round((1 / card_over_prob) * house_edge, 2)
    odds_card_under = round((1 / card_under_prob) * house_edge, 2)

    # Red Card (Yes/No)
    red_prob = 0.15
    odds_red_yes = round((1 / red_prob) * house_edge, 2)
    odds_red_no = round((1 / (1 - red_prob)) * house_edge, 2)

    # Fouls O/U 22.5
    foul_over_prob = card_over_prob
    odds_foul_over = round((1 / foul_over_prob) * house_edge, 2)
    odds_foul_under = round((1 / (1 - foul_over_prob)) * house_edge, 2)

    # Star Player Anytime Goalscorer
    h_star_prob = min(max(h_prob * 0.45, 0.1), 0.8)
    a_star_prob = min(max(a_prob * 0.45, 0.1), 0.8)
    odds_h_star_yes = round((1 / h_star_prob) * house_edge, 2)
    odds_h_star_no = round((1 / (1 - h_star_prob)) * house_edge, 2)
    odds_a_star_yes = round((1 / a_star_prob) * house_edge, 2)
    odds_a_star_no = round((1 / (1 - a_star_prob)) * house_edge, 2)

    return {
        "1": odds_1,
        "X": odds_x,
        "2": odds_2,
        "1X": odds_1x,
        "12": odds_12,
        "X2": odds_x2,
        "O2.5": odds_over,
        "U2.5": odds_under,
        "BTTS_Y": odds_btts_yes,
        "BTTS_N": odds_btts_no,
        "C_O9.5": odds_corner_over,
        "C_U9.5": odds_corner_under,
        "Y_O3.5": odds_card_over,
        "Y_U3.5": odds_card_under,
        "RED_Y": odds_red_yes,
        "RED_N": odds_red_no,
        "F_O22.5": odds_foul_over,
        "F_U22.5": odds_foul_under,
        "H_STAR_Y": odds_h_star_yes,
        "H_STAR_N": odds_h_star_no,
        "A_STAR_Y": odds_a_star_yes,
        "A_STAR_N": odds_a_star_no,
    }


def run_90_second_simulation(matches_to_sim):
    """
    Simulates a list of matches over 90 seconds.
    Yields events back to the UI to update the tracker.
    """
    for m in matches_to_sim:
        m["h_goals"] = 0
        m["a_goals"] = 0
        m["h_corners"] = 0
        m["a_corners"] = 0
        m["h_yellows"] = 0
        m["a_yellows"] = 0
        m["h_fouls"] = 0
        m["a_fouls"] = 0
        m["red_card"] = False
        m["h_star_scored"] = False
        m["a_star_scored"] = False
        m["events"] = []
        m["completed"] = False

        m["h_chance_per_min"] = (m["home"]["power"] / 90.0) * 0.02
        m["a_chance_per_min"] = (m["away"]["power"] / 90.0) * 0.02
        m["corner_chance"] = (m["home"]["power"] + m["away"]["power"]) / 180.0 * 0.12
        power_diff = abs(m["home"]["power"] - m["away"]["power"])
        m["foul_chance"] = (1.0 - (power_diff / 50.0)) * 0.25

        user_tactics = st.session_state.get("user_tactics")
        if user_tactics and user_tactics["team"]:
            ut_name = user_tactics["team"].split(" (")[0]
            import tactics

            f_data = tactics.FORMATIONS.get(
                user_tactics["formation"], {"attack_mod": 1.0, "defense_mod": 1.0}
            )
            s_data = tactics.TACTICAL_STYLES.get(
                user_tactics["style"],
                {
                    "attack_mod": 1.0,
                    "defense_mod": 1.0,
                    "foul_mod": 1.0,
                    "corner_mod": 1.0,
                },
            )

            att_mod = f_data["attack_mod"] * s_data["attack_mod"]
            def_mod = f_data["defense_mod"] * s_data["defense_mod"]
            foul_mod = s_data["foul_mod"]
            corner_mod = s_data["corner_mod"]

            if m["home"]["name"] == ut_name:
                m["h_chance_per_min"] *= att_mod
                m["a_chance_per_min"] *= 2.0 - def_mod
                m["foul_chance"] *= foul_mod
                m["corner_chance"] *= corner_mod
            elif m["away"]["name"] == ut_name:
                m["a_chance_per_min"] *= att_mod
                m["h_chance_per_min"] *= 2.0 - def_mod
                m["foul_chance"] *= foul_mod
                m["corner_chance"] *= corner_mod

    def get_scorer(star_name):
        if random.random() < 0.4:
            return star_name
        if random.random() < 0.1 and "fpl_starters" in st.session_state and st.session_state.fpl_starters:
            return random.choice(st.session_state.fpl_starters)["name"]
        return "Unknown Player"
        
    def check_fpl_goal(scorer_name, match_obj):
        if "fpl_starters" in st.session_state:
            for p in st.session_state.fpl_starters:
                if p["name"] == scorer_name:
                    pts = 6 if p["position"] in ["Defender", "Goalkeeper"] else (5 if p["position"] == "Midfielder" else 4)
                    if p["id"] == st.session_state.get("fpl_captain_id"):
                        pts *= 2
                    if "fpl_live_score" not in st.session_state:
                        st.session_state.fpl_live_score = 0
                    st.session_state.fpl_live_score += pts
                    match_obj["events"].insert(0, f"🌟 FPL ALERT: {scorer_name} scored! (+{pts} pts)")
                    break

    for minute in range(1, 91):
        for m in matches_to_sim:
            # Goals
            if random.random() < m["h_chance_per_min"]:
                m["h_goals"] += 1
                scorer = get_scorer(m["home"]["star"])
                if scorer == m["home"]["star"]:
                    m["h_star_scored"] = True
                m["events"].insert(
                    0, f"⚽ {minute}' GOAL for {m['home']['name']}! ({scorer})"
                )
                check_fpl_goal(scorer, m)

            if random.random() < m["a_chance_per_min"]:
                m["a_goals"] += 1
                scorer = get_scorer(m["away"]["star"])
                if scorer == m["away"]["star"]:
                    m["a_star_scored"] = True
                m["events"].insert(
                    0, f"⚽ {minute}' GOAL for {m['away']['name']}! ({scorer})"
                )
                check_fpl_goal(scorer, m)

            # Corners
            if random.random() < m["corner_chance"]:
                if random.random() < 0.5:
                    m["h_corners"] += 1
                    m["events"].insert(
                        0, f"🚩 {minute}' Corner to {m['home']['name']}."
                    )
                else:
                    m["a_corners"] += 1
                    m["events"].insert(
                        0, f"🚩 {minute}' Corner to {m['away']['name']}."
                    )

            # Fouls & Cards
            if random.random() < m["foul_chance"]:
                team_f = "home" if random.random() < 0.5 else "away"
                if team_f == "home":
                    m["h_fouls"] += 1
                    m["events"].insert(0, f"🦵 {minute}' Foul by {m['home']['name']}.")
                else:
                    m["a_fouls"] += 1
                    m["events"].insert(0, f"🦵 {minute}' Foul by {m['away']['name']}.")

                # Card check on foul
                if random.random() < 0.15:
                    if random.random() < 0.05 and not m["red_card"]:
                        m["red_card"] = True
                        team_name = (
                            m["home"]["name"] if team_f == "home" else m["away"]["name"]
                        )
                        m["events"].insert(0, f"🟥 {minute}' RED CARD for {team_name}!")
                    else:
                        if team_f == "home":
                            m["h_yellows"] += 1
                        else:
                            m["a_yellows"] += 1
                        team_name = (
                            m["home"]["name"] if team_f == "home" else m["away"]["name"]
                        )
                        m["events"].insert(
                            0, f"🟨 {minute}' Yellow Card for {team_name}."
                        )

            if minute == 90:
                m["completed"] = True

                # Update league standings
                league = m["home"]["league"]
                h_team = m["home"]["name"]
                a_team = m["away"]["name"]

                if "league_standings" in st.session_state:
                    if league in st.session_state.league_standings:
                        ls = st.session_state.league_standings[league]

                        # Home team stats
                        if h_team in ls and a_team in ls:
                            ls[h_team]["P"] += 1
                            ls[h_team]["GF"] += m["h_goals"]
                            ls[h_team]["GA"] += m["a_goals"]
                            ls[h_team]["GD"] = ls[h_team]["GF"] - ls[h_team]["GA"]

                            # Away team stats
                            ls[a_team]["P"] += 1
                            ls[a_team]["GF"] += m["a_goals"]
                            ls[a_team]["GA"] += m["h_goals"]
                            ls[a_team]["GD"] = ls[a_team]["GF"] - ls[a_team]["GA"]

                            # Points
                            if m["h_goals"] > m["a_goals"]:
                                ls[h_team]["W"] += 1
                                ls[h_team]["Pts"] += 3
                                ls[a_team]["L"] += 1
                            elif m["h_goals"] < m["a_goals"]:
                                ls[a_team]["W"] += 1
                                ls[a_team]["Pts"] += 3
                                ls[h_team]["L"] += 1
                            else:
                                ls[h_team]["D"] += 1
                                ls[h_team]["Pts"] += 1
                                ls[a_team]["D"] += 1
                                ls[a_team]["Pts"] += 1

        yield minute, matches_to_sim
        time.sleep(1)


def check_bet_result(bet, match):
    h_g = match["h_goals"]
    a_g = match["a_goals"]
    total_g = h_g + a_g
    total_c = match["h_corners"] + match["a_corners"]
    total_y = match["h_yellows"] + match["a_yellows"]
    total_f = match["h_fouls"] + match["a_fouls"]

    if bet["market"] == "1":
        return h_g > a_g
    if bet["market"] == "X":
        return h_g == a_g
    if bet["market"] == "2":
        return h_g < a_g
    if bet["market"] == "1X":
        return h_g >= a_g
    if bet["market"] == "12":
        return h_g != a_g
    if bet["market"] == "X2":
        return h_g <= a_g
    if bet["market"] == "O2.5":
        return total_g > 2.5
    if bet["market"] == "U2.5":
        return total_g < 2.5
    if bet["market"] == "BTTS_Y":
        return h_g > 0 and a_g > 0
    if bet["market"] == "BTTS_N":
        return h_g == 0 or a_g == 0

    if bet["market"] == "C_O9.5":
        return total_c > 9.5
    if bet["market"] == "C_U9.5":
        return total_c < 9.5

    if bet["market"] == "Y_O3.5":
        return total_y > 3.5
    if bet["market"] == "Y_U3.5":
        return total_y < 3.5

    if bet["market"] == "RED_Y":
        return match["red_card"] == True
    if bet["market"] == "RED_N":
        return match["red_card"] == False

    if bet["market"] == "F_O22.5":
        return total_f > 22.5
    if bet["market"] == "F_U22.5":
        return total_f < 22.5

    if bet["market"] == "H_STAR_Y":
        return match["h_star_scored"] == True
    if bet["market"] == "H_STAR_N":
        return match["h_star_scored"] == False
    if bet["market"] == "A_STAR_Y":
        return match["a_star_scored"] == True
    if bet["market"] == "A_STAR_N":
        return match["a_star_scored"] == False

    return False
