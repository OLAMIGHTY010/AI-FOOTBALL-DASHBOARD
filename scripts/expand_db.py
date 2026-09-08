with open("sportsbook.py", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.startswith("VIRTUAL_TEAMS = {"):
        skip = True
        new_lines.append("""VIRTUAL_TEAMS = {
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
        "Ipswich Town": {"power": 70, "star": "C. Chaplin"}
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
        "Espanyol": {"power": 71, "star": "J. Puado"}
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
        "Venezia": {"power": 69, "star": "J. Pohjanpalo"}
    },
    "International": {
        "Argentina": {"power": 92, "star": "L. Messi"},
        "France": {"power": 91, "star": "K. Mbappe"},
        "Brazil": {"power": 89, "star": "Vini Jr."},
        "England": {"power": 88, "star": "H. Kane"},
        "Spain": {"power": 87, "star": "L. Yamal"},
        "Germany": {"power": 86, "star": "J. Musiala"},
        "Portugal": {"power": 85, "star": "C. Ronaldo"},
        "Netherlands": {"power": 83, "star": "C. Gakpo"},
        "Senegal": {"power": 80, "star": "S. Mane"},
        "Morocco": {"power": 81, "star": "H. Ziyech"},
        "Nigeria": {"power": 79, "star": "V. Osimhen"},
        "Ivory Coast": {"power": 78, "star": "S. Haller"},
        "Egypt": {"power": 77, "star": "M. Salah"},
        "Algeria": {"power": 76, "star": "R. Mahrez"},
        "Italy": {"power": 84, "star": "N. Barella"},
        "Uruguay": {"power": 82, "star": "F. Valverde"},
        "Belgium": {"power": 83, "star": "K. De Bruyne"},
        "Croatia": {"power": 82, "star": "L. Modric"},
        "USA": {"power": 78, "star": "C. Pulisic"},
        "Mexico": {"power": 77, "star": "S. Gimenez"}
    }
}

def generate_fixtures(num_matches=10):
    fixtures = []
    match_id_counter = 1
    
    # Generate a full matchweek for every league
    for league, teams in VIRTUAL_TEAMS.items():
        league_teams = [{"name": t, "league": league, "power": v["power"], "star": v["star"]} for t, v in teams.items()]
        
        # Shuffle to randomize matchups
        random.shuffle(league_teams)
        
        # Pair them up (0 vs 1, 2 vs 3, etc.)
        for i in range(0, len(league_teams), 2):
            if i + 1 < len(league_teams):
                t1 = league_teams[i]
                t2 = league_teams[i+1]
                
                fixtures.append({
                    "id": f"match_{match_id_counter}",
                    "home": t1,
                    "away": t2,
                    "odds": calculate_all_odds(t1, t2)
                })
                match_id_counter += 1
                
    return fixtures
""")
        continue
    
    if skip:
        if line.startswith("def calculate_all_odds("):
            skip = False
            new_lines.append(line)
        continue
        
    new_lines.append(line)

with open("sportsbook.py", "w") as f:
    f.writelines(new_lines)
