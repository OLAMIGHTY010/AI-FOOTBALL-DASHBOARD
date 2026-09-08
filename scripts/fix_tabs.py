with open("app.py", "r") as f:
    lines = f.readlines()

new_lines = []
in_fpl = False
optimizer_started = False

for i, line in enumerate(lines):
    if line.startswith("    if not fpl_df.empty:"):
        new_lines.append(line)
        new_lines.append('        st.markdown("---")\n')
        new_lines.append('        tab_team, tab_transfers, tab_fixtures, tab_ai = st.tabs(["👔 My Team", "🔄 Transfers", "📅 Fixtures", "🤖 AI Assistant"])\n')
        new_lines.append('        with tab_team:\n')
        new_lines.append('            st.info("The persistent My Team page is being built! Please provide your Supabase keys to continue.")\n')
        new_lines.append('        with tab_transfers:\n')
        new_lines.append('            st.info("The Transfers Market is being built!")\n')
        new_lines.append('        with tab_fixtures:\n')
        new_lines.append('            st.info("The Fixtures and FDR page is being built!")\n')
        new_lines.append('        with tab_ai:\n')
        optimizer_started = True
        continue
        
    if optimizer_started:
        if i >= 901: # Where `st.markdown("---")` originally was
            if line.strip() == "":
                new_lines.append(line)
            else:
                new_lines.append("    " + line)
    else:
        new_lines.append(line)

with open("app.py", "w") as f:
    f.writelines(new_lines)
