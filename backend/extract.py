import os

files = [
    ('bootstrap.json', '11260'), 
    ('entry_190863.json', '11171'), 
    ('picks_190863.json', '11189')
]

for out_f, step in files:
    in_path = f'/home/gamp/.gemini/antigravity/brain/004d7ac5-a571-4092-a6dc-7a1ecd66b282/.system_generated/steps/{step}/content.md'
    out_path = f'/home/gamp/Desktop/AI-FOOTBALL-DASHBOARD/backend/mock_data/{out_f}'
    
    with open(in_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    parts = content.split('---')
    if len(parts) > 1:
        json_data = parts[1].strip()
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(json_data)
        print(f'Wrote {out_f}')
    else:
        print(f'Failed to parse {out_f}')
