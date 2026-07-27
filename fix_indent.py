with open("app.py", "r") as f:
    lines = f.readlines()

new_lines = []
in_expander = False
for i, line in enumerate(lines):
    if "with st.expander(" in line:
        in_expander = True
        new_lines.append(line)
        continue
    
    if in_expander:
        if line.strip() == "with col_slip:":
            in_expander = False
            new_lines.append(line)
            continue
        
        # Indent by 4 more spaces if it's inside the expander (after line 998)
        if i >= 998 and not line.isspace():
            if line.startswith("                    "):
                new_lines.append("    " + line)
            else:
                new_lines.append("                        " + line.lstrip())
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open("app.py", "w") as f:
    f.writelines(new_lines)
