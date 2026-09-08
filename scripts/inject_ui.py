import re

with open("app.py", "r") as f:
    code = f.read()

# Replace Tab Team
team_code = """        with tab_team:
            user_team_db = load_user_team()
            if user_team_db is None or not user_team_db.get("starters"):
                st.warning("You don't have a team saved yet! Go to the 'Transfers' tab or use the 'AI Assistant' to build one.")
            else:
                st.markdown("### 🏟️ Your Active Squad")
                starters_df = pd.DataFrame(user_team_db["starters"])
                bench_df = pd.DataFrame(user_team_db["bench"])
                captain_id = user_team_db.get("captain_id")
                
                # Metrics
                col_cap, col_vp, col_pts, col_chip = st.columns(4)
                
                if captain_id:
                    cap_name = starters_df.loc[starters_df['id'] == captain_id, 'name']
                    cap_name = cap_name.values[0] if not cap_name.empty else "None"
                    col_cap.metric("Captain (x2 Pts)", cap_name)
                else:
                    col_cap.metric("Captain", "None")
                    
                total_ep = starters_df['ep_next'].sum()
                if captain_id and not starters_df[starters_df['id'] == captain_id].empty:
                    total_ep += starters_df[starters_df['id'] == captain_id]['ep_next'].values[0]
                
                col_pts.metric("Projected Points", f"{total_ep:.1f} pts")
                col_chip.metric("Active Chip", user_team_db.get("active_chip", "None"))
                
                # Select Captain
                new_captain = st.selectbox("Assign Captain", starters_df["name"].tolist(), index=starters_df["name"].tolist().index(cap_name) if cap_name != "None" else 0)
                if st.button("Save Captain"):
                    c_id = starters_df[starters_df["name"] == new_captain].iloc[0]['id']
                    save_user_team(starters_df, bench_df, user_team_db["budget"], user_team_db["formation"], captain_id=c_id)
                    st.rerun()

                render_fpl_pitch(starters_df, bench_df, formation=user_team_db["formation"], captain_id=captain_id)
"""

transfers_code = """        with tab_transfers:
            st.markdown("### 🔄 Transfer Market")
            user_team_db = load_user_team()
            budget = user_team_db["budget"] if user_team_db else 100.0
            
            col_b1, col_b2 = st.columns(2)
            col_b1.metric("Bank Balance", f"£{budget:.1f}m")
            
            st.markdown("#### All Players")
            search_query = st.text_input("Search Player by Name")
            
            display_df = fpl_df.copy()
            if search_query:
                display_df = display_df[display_df["name"].str.contains(search_query, case=False)]
            
            st.dataframe(
                display_df[["name", "team", "position", "price", "ep_next", "total_points", "selected_by", "price_pred"]],
                use_container_width=True,
                height=400
            )
"""

fixtures_code = """        with tab_fixtures:
            st.markdown("### 📅 Upcoming Fixtures & FDR")
            st.info("Coming soon: Integrating live fixture difficulty ratings from FPL.")
"""

code = re.sub(
    r"        with tab_team:.*?st\.info\(.*?Please provide your Supabase keys to continue.\"\n            \)",
    team_code,
    code,
    flags=re.DOTALL
)

code = re.sub(
    r"        with tab_transfers:.*?st\.info\(\"The Transfers Market is being built!\"\)",
    transfers_code,
    code,
    flags=re.DOTALL
)

code = re.sub(
    r"        with tab_fixtures:.*?st\.info\(\"The Fixtures and FDR page is being built!\"\)",
    fixtures_code,
    code,
    flags=re.DOTALL
)

with open("app.py", "w") as f:
    f.write(code)
