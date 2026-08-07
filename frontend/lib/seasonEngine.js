export const LEAGUES = {
  EPL: {
    id: "epl",
    name: "Premier League",
    teams: [
      { id: "MCI", name: "Man City", att: 92, def: 88, ovr: 90 },
      { id: "ARS", name: "Arsenal", att: 88, def: 89, ovr: 88 },
      { id: "LIV", name: "Liverpool", att: 89, def: 84, ovr: 87 },
      { id: "CHE", name: "Chelsea", att: 84, def: 81, ovr: 83 },
      { id: "TOT", name: "Spurs", att: 85, def: 79, ovr: 82 },
      { id: "MUN", name: "Man Utd", att: 82, def: 80, ovr: 81 },
      { id: "NEW", name: "Newcastle", att: 83, def: 81, ovr: 82 },
      { id: "AST", name: "Aston Villa", att: 81, def: 78, ovr: 79 },
      { id: "BHA", name: "Brighton", att: 80, def: 76, ovr: 78 },
      { id: "WHU", name: "West Ham", att: 79, def: 77, ovr: 78 },
      { id: "CRY", name: "Crystal Palace", att: 77, def: 78, ovr: 77 },
      { id: "FUL", name: "Fulham", att: 76, def: 75, ovr: 75 },
      { id: "BOU", name: "Bournemouth", att: 75, def: 74, ovr: 74 },
      { id: "WOL", name: "Wolves", att: 74, def: 76, ovr: 75 },
      { id: "EVE", name: "Everton", att: 73, def: 78, ovr: 75 },
      { id: "BRE", name: "Brentford", att: 76, def: 74, ovr: 75 },
      { id: "NFO", name: "Nottm Forest", att: 74, def: 73, ovr: 73 },
      { id: "LUT", name: "Luton Town", att: 71, def: 68, ovr: 70 },
      { id: "BUR", name: "Burnley", att: 72, def: 70, ovr: 71 },
      { id: "SHU", name: "Sheffield Utd", att: 69, def: 68, ovr: 68 },
    ]
  },
  LALIGA: {
    id: "laliga",
    name: "La Liga",
    teams: [
      { id: "RMA", name: "Real Madrid", att: 92, def: 87, ovr: 90 },
      { id: "BAR", name: "Barcelona", att: 88, def: 85, ovr: 87 },
      { id: "ATM", name: "Atletico Madrid", att: 85, def: 88, ovr: 86 },
      { id: "GIR", name: "Girona", att: 83, def: 78, ovr: 80 },
      { id: "ATH", name: "Athletic Club", att: 81, def: 82, ovr: 81 },
      { id: "RSO", name: "Real Sociedad", att: 80, def: 81, ovr: 80 },
      { id: "BET", name: "Real Betis", att: 79, def: 78, ovr: 79 },
      { id: "VIL", name: "Villarreal", att: 81, def: 75, ovr: 78 },
      { id: "VAL", name: "Valencia", att: 76, def: 77, ovr: 77 },
      { id: "GET", name: "Getafe", att: 74, def: 78, ovr: 76 },
      { id: "OSA", name: "Osasuna", att: 75, def: 76, ovr: 75 },
      { id: "ALA", name: "Alaves", att: 72, def: 75, ovr: 73 },
      { id: "SEV", name: "Sevilla", att: 77, def: 74, ovr: 75 },
      { id: "MLL", name: "Mallorca", att: 73, def: 76, ovr: 74 },
      { id: "LAS", name: "Las Palmas", att: 74, def: 72, ovr: 73 },
      { id: "RAY", name: "Rayo Vallecano", att: 73, def: 74, ovr: 73 },
      { id: "CEL", name: "Celta Vigo", att: 75, def: 71, ovr: 73 },
      { id: "CAD", name: "Cadiz", att: 70, def: 73, ovr: 71 },
      { id: "GRA", name: "Granada", att: 72, def: 69, ovr: 70 },
      { id: "ALM", name: "Almeria", att: 71, def: 68, ovr: 69 },
    ]
  },
  SERIEA: {
    id: "seriea",
    name: "Serie A",
    teams: [
      { id: "INT", name: "Inter Milan", att: 89, def: 90, ovr: 89 },
      { id: "JUV", name: "Juventus", att: 84, def: 88, ovr: 86 },
      { id: "MIL", name: "AC Milan", att: 86, def: 83, ovr: 85 },
      { id: "NAP", name: "Napoli", att: 85, def: 81, ovr: 83 },
      { id: "ATA", name: "Atalanta", att: 84, def: 82, ovr: 83 },
      { id: "ROM", name: "Roma", att: 83, def: 81, ovr: 82 },
      { id: "LAZ", name: "Lazio", att: 81, def: 82, ovr: 81 },
      { id: "FIO", name: "Fiorentina", att: 80, def: 79, ovr: 80 },
      { id: "BOL", name: "Bologna", att: 79, def: 81, ovr: 80 },
      { id: "TOR", name: "Torino", att: 76, def: 80, ovr: 78 },
      { id: "MON", name: "Monza", att: 75, def: 76, ovr: 75 },
      { id: "GEN", name: "Genoa", att: 74, def: 77, ovr: 75 },
      { id: "LEC", name: "Lecce", att: 73, def: 74, ovr: 73 },
      { id: "EMP", name: "Empoli", att: 72, def: 73, ovr: 72 },
      { id: "UDI", name: "Udinese", att: 73, def: 73, ovr: 73 },
      { id: "HEL", name: "Hellas Verona", att: 71, def: 74, ovr: 72 },
      { id: "CAL", name: "Cagliari", att: 72, def: 72, ovr: 72 },
      { id: "FRO", name: "Frosinone", att: 74, def: 69, ovr: 71 },
      { id: "SAS", name: "Sassuolo", att: 75, def: 68, ovr: 71 },
      { id: "SAL", name: "Salernitana", att: 70, def: 68, ovr: 69 },
    ]
  }
};

// Generate a round-robin schedule for a given array of team IDs
export function generateSchedule(teamIds) {
  const numTeams = teamIds.length;
  const totalRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  const schedule = [];
  
  // Clone to not mutate original
  let currentIds = [...teamIds];
  
  if (numTeams % 2 !== 0) {
    currentIds.push('BYE');
  }
  
  for (let round = 0; round < totalRounds; round++) {
    const roundMatches = [];
    for (let match = 0; match < matchesPerRound; match++) {
      const home = currentIds[match];
      const away = currentIds[currentIds.length - 1 - match];
      if (home !== 'BYE' && away !== 'BYE') {
        // Alternate home/away based on round to balance
        if (match === 0 && round % 2 === 1) {
          roundMatches.push({ home: away, away: home });
        } else {
          roundMatches.push({ home, away });
        }
      }
    }
    schedule.push(roundMatches);
    
    // Rotate teams (keep the first team fixed)
    currentIds.splice(1, 0, currentIds.pop());
  }

  // Double the schedule for away fixtures
  const secondHalf = schedule.map(round => 
    round.map(match => ({ home: match.away, away: match.home }))
  );
  
  return [...schedule, ...secondHalf];
}

// Simulate a single match
function simulateMatch(homeTeam, awayTeam) {
  // Simple Poisson-ish calculation based on ratings
  const homeAdvantage = 1.1; // 10% boost for home team
  
  const homeExpectedGoals = (homeTeam.att / awayTeam.def) * 1.5 * homeAdvantage;
  const awayExpectedGoals = (awayTeam.att / homeTeam.def) * 1.5;

  const homeGoals = poissonRandomNumber(homeExpectedGoals);
  const awayGoals = poissonRandomNumber(awayExpectedGoals);

  return { homeGoals, awayGoals };
}

// Helper for Poisson distribution
function poissonRandomNumber(lambda) {
  let L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Initialize a new season
export function initSeason(leagueId) {
  const league = LEAGUES[leagueId];
  if (!league) return null;
  
  const teamIds = league.teams.map(t => t.id);
  const schedule = generateSchedule(teamIds);
  
  return {
    leagueId,
    currentWeek: 0,
    schedule,
    results: [], // Array of arrays of match results corresponding to schedule
    news: [{ week: 0, text: `Welcome to the new ${league.name} season!` }],
    futuresBets: [],
    weeklyBets: []
  };
}

// Simulate the next gameweek
export function simulateNextWeek(seasonState) {
  if (seasonState.currentWeek >= seasonState.schedule.length) {
    return seasonState; // Season is over
  }
  
  const weekIdx = seasonState.currentWeek;
  const fixtures = seasonState.schedule[weekIdx];
  const league = LEAGUES[seasonState.leagueId];
  
  const weekResults = [];
  
  fixtures.forEach(fixture => {
    const homeTeam = league.teams.find(t => t.id === fixture.home);
    const awayTeam = league.teams.find(t => t.id === fixture.away);
    const result = simulateMatch(homeTeam, awayTeam);
    weekResults.push({
      ...fixture,
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals
    });
  });
  
  // Generate some random news
  const newsItem = generateRandomNews(league.teams);
  
  return {
    ...seasonState,
    currentWeek: weekIdx + 1,
    results: [...seasonState.results, weekResults],
    news: [{ week: weekIdx + 1, text: newsItem }, ...seasonState.news].slice(0, 10)
  };
}

// Helper to generate fake news
function generateRandomNews(teams) {
  const events = [
    "injury", "manager", "transfer", "record"
  ];
  const evt = events[Math.floor(Math.random() * events.length)];
  const team = teams[Math.floor(Math.random() * teams.length)];
  
  switch(evt) {
    case "injury": return `${team.name} star player out for 3 weeks with a hamstring injury.`;
    case "manager": return `Rumors circulating about the manager's future at ${team.name}.`;
    case "transfer": return `${team.name} linked with a major signing in the upcoming window.`;
    case "record": return `${team.name} sets a new club record for most passes in a single half.`;
    default: return `${team.name} fans optimistic after recent performances.`;
  }
}

// Calculate the current league table from results
export function calculateTable(leagueId, results) {
  const league = LEAGUES[leagueId];
  if (!league) return [];
  
  // Initialize table
  const table = league.teams.map(t => ({
    id: t.id,
    name: t.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0
  }));
  
  const tableMap = table.reduce((acc, team) => {
    acc[team.id] = team;
    return acc;
  }, {});
  
  // Process all results
  results.forEach(week => {
    week.forEach(match => {
      const home = tableMap[match.home];
      const away = tableMap[match.away];
      
      home.played++;
      away.played++;
      home.gf += match.homeGoals;
      home.ga += match.awayGoals;
      away.gf += match.awayGoals;
      away.ga += match.homeGoals;
      
      if (match.homeGoals > match.awayGoals) {
        home.won++;
        away.lost++;
        home.pts += 3;
      } else if (match.homeGoals < match.awayGoals) {
        away.won++;
        home.lost++;
        away.pts += 3;
      } else {
        home.drawn++;
        away.drawn++;
        home.pts += 1;
        away.pts += 1;
      }
    });
  });
  
  // Calculate GD and sort
  table.forEach(t => t.gd = t.gf - t.ga);
  
  table.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
  
  return table;
}
