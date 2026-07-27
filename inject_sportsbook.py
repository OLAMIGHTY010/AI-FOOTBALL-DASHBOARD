with open("app.py", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.startswith('elif page == "Simulate Match":'):
        skip = True
        new_lines.append(line)
        
        new_code = """    st.title("🌍 Global Virtual Sportsbook")
    import sportsbook
    
    if "bankroll" not in st.session_state:
        st.session_state.bankroll = 1000.0
    if "bet_slip" not in st.session_state:
        st.session_state.bet_slip = []
    if "fixtures" not in st.session_state:
        st.session_state.fixtures = sportsbook.generate_fixtures(15)
        
    st.markdown(f"### 🏦 Bankroll: **${st.session_state.bankroll:.2f}**")
    
    if "simulating" in st.session_state and st.session_state.simulating:
        st.markdown("## 🔴 LIVE MATCH SIMULATION")
        tracker_placeholder = st.empty()
        
        for minute, matches in sportsbook.run_90_second_simulation(st.session_state.active_matches):
            with tracker_placeholder.container():
                st.markdown(f"### ⏱️ {minute}' MIN")
                for m in matches:
                    col1, col2, col3 = st.columns([3, 1, 3])
                    col1.markdown(f"**{m['home']['name']}**")
                    col2.markdown(f"<h3 style='text-align: center; margin: 0;'>{m['h_goals']} - {m['a_goals']}</h3>", unsafe_allow_html=True)
                    col3.markdown(f"<p style='text-align: right;'><b>{m['away']['name']}</b></p>", unsafe_allow_html=True)
                    
                    if m["events"]:
                        st.caption(f"Latest: {m['events'][0]}")
                    st.divider()
        
        st.session_state.simulating = False
        st.success("🏁 FULL TIME!")
        
        win_acca = True
        total_odds = 1.0
        
        st.markdown("### Bet Slip Results:")
        for bet in st.session_state.bet_slip:
            m = next(m for m in st.session_state.active_matches if m["id"] == bet["match_id"])
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
            st.session_state.fixtures = sportsbook.generate_fixtures(15)
            st.rerun()

    else:
        col_main, col_slip = st.columns([7, 3])
        
        with col_main:
            st.markdown("### 📅 Upcoming Virtual Fixtures")
            if st.button("🔄 Generate New Fixtures"):
                st.session_state.fixtures = sportsbook.generate_fixtures(15)
                st.session_state.bet_slip = []
                st.rerun()
                
            for m in st.session_state.fixtures:
                with st.expander(f"{m['home']['name']} vs {m['away']['name']} ({m['home']['league']})"):
                    st.markdown("##### Match Winner (1X2)")
                    c1, c2, c3 = st.columns(3)
                    
                    def add_bet(m_id, market, odds, desc):
                        st.session_state.bet_slip = [b for b in st.session_state.bet_slip if b["match_id"] != m_id]
                        st.session_state.bet_slip.append({"match_id": m_id, "market": market, "odds": odds, "desc": desc})
                    
                    if c1.button(f"{m['home']['name']} @ {m['odds']['1']}x", key=f"{m['id']}_1"): add_bet(m['id'], "1", m['odds']['1'], f"{m['home']['name']} to Win")
                    if c2.button(f"Draw @ {m['odds']['X']}x", key=f"{m['id']}_X"): add_bet(m['id'], "X", m['odds']['X'], f"Draw ({m['home']['name']} vs {m['away']['name']})")
                    if c3.button(f"{m['away']['name']} @ {m['odds']['2']}x", key=f"{m['id']}_2"): add_bet(m['id'], "2", m['odds']['2'], f"{m['away']['name']} to Win")
                    
                    st.markdown("##### Over/Under 2.5 Goals")
                    c4, c5 = st.columns(2)
                    if c4.button(f"Over 2.5 @ {m['odds']['O2.5']}x", key=f"{m['id']}_O"): add_bet(m['id'], "O2.5", m['odds']['O2.5'], f"Over 2.5 Goals ({m['home']['name']} vs {m['away']['name']})")
                    if c5.button(f"Under 2.5 @ {m['odds']['U2.5']}x", key=f"{m['id']}_U"): add_bet(m['id'], "U2.5", m['odds']['U2.5'], f"Under 2.5 Goals ({m['home']['name']} vs {m['away']['name']})")
                    
                    st.markdown("##### Both Teams To Score (BTTS)")
                    c6, c7 = st.columns(2)
                    if c6.button(f"Yes @ {m['odds']['BTTS_Y']}x", key=f"{m['id']}_BY"): add_bet(m['id'], "BTTS_Y", m['odds']['BTTS_Y'], f"BTTS Yes ({m['home']['name']} vs {m['away']['name']})")
                    if c7.button(f"No @ {m['odds']['BTTS_N']}x", key=f"{m['id']}_BN"): add_bet(m['id'], "BTTS_N", m['odds']['BTTS_N'], f"BTTS No ({m['home']['name']} vs {m['away']['name']})")

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
                wager = st.number_input("Wager Amount ($)", min_value=1.0, max_value=max_wager, value=min(10.0, max_wager), step=1.0)
                st.success(f"Potential Return: **${(wager * total_odds):.2f}**")
                
                if st.button("🗑️ Clear Slip"):
                    st.session_state.bet_slip = []
                    st.rerun()
                
                if st.button("🚀 PLACE ACCUMULATOR", type="primary", use_container_width=True):
                    if wager > st.session_state.bankroll:
                        st.error("Insufficient funds!")
                    else:
                        st.session_state.bankroll -= wager
                        st.session_state.active_wager = wager
                        bet_match_ids = [b["match_id"] for b in st.session_state.bet_slip]
                        st.session_state.active_matches = [m for m in st.session_state.fixtures if m["id"] in bet_match_ids]
                        st.session_state.simulating = True
                        st.rerun()
"""
        new_lines.append(new_code)
        continue
        
    if skip:
        if line.startswith('elif page == "FPL AI Predictor":'):
            skip = False
            new_lines.append(line)
        continue
        
    new_lines.append(line)

with open("app.py", "w") as f:
    f.writelines(new_lines)
