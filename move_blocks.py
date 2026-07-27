with open("app.py", "r") as f:
    lines = f.readlines()

new_lines = []
league_block = []
manager_block = []

state = "normal"
for line in lines:
    if line.startswith("elif page == \"League Season (Live)\":"):
        state = "league"
        continue
    elif line.startswith("elif page == \"Manager Mode\":"):
        state = "manager"
        continue
        
    if state == "league":
        league_block.append(line)
    elif state == "manager":
        manager_block.append(line)
    else:
        new_lines.append(line)

# Remove the sidebar options
final_lines = []
for line in new_lines:
    if '"League Season (Live)",' in line or '"Manager Mode",' in line:
        continue
    final_lines.append(line)

# Inject the tabs into Simulate Match
inject_idx = -1
for i, line in enumerate(final_lines):
    if line.startswith("elif page == \"Simulate Match\":"):
        inject_idx = i
        break

if inject_idx != -1:
    # Find where to put the tabs
    # Right after the title
    final_lines.insert(inject_idx + 2, "    tab_sportsbook, tab_league, tab_manager = st.tabs(['Sportsbook', 'League Season (Live)', 'Manager Mode'])\n")
    final_lines.insert(inject_idx + 3, "    with tab_sportsbook:\n")
    
    # Indent everything in Simulate Match by 4 spaces
    i = inject_idx + 4
    while i < len(final_lines) and (final_lines[i].startswith(" ") or final_lines[i] == "\n"):
        if final_lines[i] != "\n":
            final_lines[i] = "    " + final_lines[i]
        i += 1
        
    # Now inject the other two tabs at the end of the Simulate Match block
    # actually, I can just insert them at i
    insert_str = ["    with tab_league:\n"]
    for l in league_block:
        if l == "\n": insert_str.append(l)
        else: insert_str.append("        " + l[4:] if l.startswith("    ") else "        " + l)
        
    insert_str.append("    with tab_manager:\n")
    for l in manager_block:
        if l == "\n": insert_str.append(l)
        else: insert_str.append("        " + l[4:] if l.startswith("    ") else "        " + l)
        
    final_lines = final_lines[:i] + insert_str + final_lines[i:]

with open("app.py", "w") as f:
    f.writelines(final_lines)
