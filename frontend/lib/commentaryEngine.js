// AI Commentary Engine
// Generates realistic, dynamic match commentary based on events

const COMMENTARY_STYLES = {
  goal: [
    (player, team, min) => `⚽ ${min}' GOOOAAL! ${player} finds the net for ${team}! What a strike!`,
    (player, team, min) => `⚽ ${min}' IT'S IN! ${player} scores! ${team} are absolutely buzzing!`,
    (player, team, min) => `⚽ ${min}' GOAL! ${player} makes no mistake! Clinical finish for ${team}!`,
    (player, team, min) => `⚽ ${min}' SPECTACULAR! ${player} unleashes a rocket into the top corner! ${team} lead!`,
    (player, team, min) => `⚽ ${min}' ${player} with the composure to slot it home! The fans are on their feet!`,
    (player, team, min) => `⚽ ${min}' OH MY! ${player} with a moment of pure genius! ${team} won't believe this!`,
    (player, team, min) => `⚽ ${min}' And it's there! ${player} taps it in from close range! ${team} extend their advantage!`,
  ],
  corner: [
    (team, min) => `🚩 ${min}' Corner kick to ${team}. The ball is swung in...`,
    (team, min) => `🚩 ${min}' ${team} win a corner. Good pressure building here.`,
    (team, min) => `🚩 ${min}' Another corner for ${team}. They're piling on the pressure!`,
  ],
  yellow_card: [
    (team, min) => `🟡 ${min}' Yellow card shown! A reckless challenge from ${team}. The ref had no choice.`,
    (team, min) => `🟡 ${min}' That's a booking! ${team} player goes into the book for a cynical foul.`,
    (team, min) => `🟡 ${min}' Caution! ${team} need to be careful now, that's another card.`,
  ],
  red_card: [
    (team, min) => `🔴 ${min}' RED CARD! ${team} are down to 10 men! That changes everything!`,
    (team, min) => `🔴 ${min}' SENT OFF! A moment of madness from ${team}! This could be a turning point!`,
    (team, min) => `🔴 ${min}' The referee shows red! ${team} will have to dig deep now!`,
  ],
  foul: [
    (team, min) => `⚠️ ${min}' Foul by ${team}. Free kick in a dangerous area.`,
    (team, min) => `⚠️ ${min}' ${team} give away a free kick. Sloppy challenge.`,
    (team, min) => `⚠️ ${min}' Hard tackle from ${team}. The referee blows immediately.`,
  ],
  atmosphere: {
    early: [
      "The atmosphere is electric as both sides look to gain an early foothold.",
      "A cagey opening few minutes as both teams feel each other out.",
      "Plenty of energy here in the opening exchanges!",
    ],
    midFirst: [
      "The tempo has really picked up now. End-to-end stuff!",
      "Both managers will be pleased with the intensity so far.",
      "The midfield battle is absolutely fascinating to watch.",
    ],
    halfTime: [
      "⏸️ HALF TIME. Both teams head to the dressing room. What a half of football!",
      "⏸️ The whistle blows for half time. Plenty to discuss at the break.",
    ],
    earlySecond: [
      "And we're back! Can either side find that crucial breakthrough?",
      "The second half is underway. Fresh legs and fresh tactics!",
    ],
    latePressure: [
      "We're into the final 15 minutes! The tension is palpable!",
      "Time is running out. Every pass, every challenge matters now.",
      "The clock is ticking down. Can they find a late winner?",
    ],
    finalWhistle: [
      "🏁 FULL TIME! What a match that was!",
      "🏁 The final whistle goes! That was an incredible 90 minutes!",
    ],
  },
};

const AMBIENT_COMMENTARY = [
  (home, away, min) => `${min}' Possession is being shared evenly between ${home} and ${away}.`,
  (home, away, min) => `${min}' ${home} trying to work an opening down the left flank.`,
  (home, away, min) => `${min}' ${away} with some nice passing in midfield but no end product yet.`,
  (home, away, min) => `${min}' The ball is played long but it's comfortably dealt with by the defence.`,
  (home, away, min) => `${min}' A dangerous cross comes in but the keeper claims it confidently.`,
  (home, away, min) => `${min}' ${home} break quickly on the counter! But the final ball lets them down.`,
  (home, away, min) => `${min}' A long-range effort from ${away}! Goes just wide of the post.`,
  (home, away, min) => `${min}' Good defensive work there. The backline is holding firm.`,
  (home, away, min) => `${min}' The crowd are getting restless, they want to see more action.`,
  (home, away, min) => `${min}' Beautiful one-two in the box... but it's blocked! So close.`,
  (home, away, min) => `${min}' ${home} building patiently from the back. They're not rushing things.`,
  (home, away, min) => `${min}' A speculative shot from distance by ${away}. Easy save for the keeper.`,
];

export function generateCommentary(event, homeName, awayName, homeScore, awayScore) {
  const min = event.minute;
  const teamName = event.team === "home" ? homeName : awayName;
  
  switch (event.type) {
    case "goal": {
      const templates = COMMENTARY_STYLES.goal;
      const template = templates[Math.floor(Math.random() * templates.length)];
      const playerName = event.player || "Unknown Player";
      return {
        text: template(playerName, teamName, min),
        type: "goal",
        importance: "critical",
      };
    }
    case "corner": {
      const templates = COMMENTARY_STYLES.corner;
      return {
        text: templates[Math.floor(Math.random() * templates.length)](teamName, min),
        type: "corner",
        importance: "low",
      };
    }
    case "yellow_card": {
      const templates = COMMENTARY_STYLES.yellow_card;
      return {
        text: templates[Math.floor(Math.random() * templates.length)](teamName, min),
        type: "yellow_card",
        importance: "medium",
      };
    }
    case "red_card": {
      const templates = COMMENTARY_STYLES.red_card;
      return {
        text: templates[Math.floor(Math.random() * templates.length)](teamName, min),
        type: "red_card",
        importance: "critical",
      };
    }
    case "foul": {
      const templates = COMMENTARY_STYLES.foul;
      return {
        text: templates[Math.floor(Math.random() * templates.length)](teamName, min),
        type: "foul",
        importance: "low",
      };
    }
    default:
      return null;
  }
}

export function generateAmbientCommentary(minute, homeName, awayName) {
  const template = AMBIENT_COMMENTARY[Math.floor(Math.random() * AMBIENT_COMMENTARY.length)];
  return {
    text: template(homeName, awayName, minute),
    type: "ambient",
    importance: "low",
  };
}

export function generateAtmosphere(minute) {
  const atm = COMMENTARY_STYLES.atmosphere;
  let pool;
  
  if (minute <= 5) pool = atm.early;
  else if (minute > 5 && minute < 45) pool = atm.midFirst;
  else if (minute === 45) pool = atm.halfTime;
  else if (minute > 45 && minute <= 50) pool = atm.earlySecond;
  else if (minute >= 75 && minute < 90) pool = atm.latePressure;
  else if (minute >= 90) pool = atm.finalWhistle;
  else return null;
  
  return {
    text: pool[Math.floor(Math.random() * pool.length)],
    type: "atmosphere",
    importance: minute === 45 || minute >= 90 ? "critical" : "medium",
  };
}

export function getScoreContext(homeScore, awayScore, homeName, awayName) {
  const diff = homeScore - awayScore;
  if (homeScore === 0 && awayScore === 0) return "It's still goalless here.";
  if (diff === 0) return `It's all square at ${homeScore}-${awayScore}! Either side could nick it.`;
  if (diff > 0) return `${homeName} lead ${homeScore}-${awayScore}. They're in control.`;
  return `${awayName} lead ${awayScore}-${homeScore}. Can ${homeName} find a way back?`;
}
