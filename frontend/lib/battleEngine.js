// battleEngine.js
// Handles the Top Trumps style card battler

const STATS = ["pac", "sho", "pas", "dri", "def", "phy"];
const STAT_NAMES = {
  pac: "Pace",
  sho: "Shooting",
  pas: "Passing",
  dri: "Dribbling",
  def: "Defending",
  phy: "Physical"
};

// Generate a random opponent deck (mock data)
export function generateOpponentDeck(playerOverall = 80) {
  const deck = [];
  for (let i = 0; i < 11; i++) {
    // Generate stats around the player's overall level (+/- 10)
    const variance = () => Math.floor(Math.random() * 20) - 10;
    
    // Create a specialized profile (e.g. fast attacker, strong defender)
    const profile = Math.random();
    let stats = {};
    
    if (profile > 0.6) {
      // Attacker
      stats = {
        pac: Math.min(99, Math.max(50, playerOverall + 5 + variance())),
        sho: Math.min(99, Math.max(50, playerOverall + 8 + variance())),
        pas: Math.min(99, Math.max(50, playerOverall + variance())),
        dri: Math.min(99, Math.max(50, playerOverall + 5 + variance())),
        def: Math.max(30, playerOverall - 20 + variance()),
        phy: Math.min(99, Math.max(50, playerOverall - 5 + variance()))
      };
    } else if (profile > 0.3) {
      // Midfielder
      stats = {
        pac: Math.min(99, Math.max(50, playerOverall - 2 + variance())),
        sho: Math.min(99, Math.max(50, playerOverall + variance())),
        pas: Math.min(99, Math.max(50, playerOverall + 8 + variance())),
        dri: Math.min(99, Math.max(50, playerOverall + 5 + variance())),
        def: Math.min(99, Math.max(50, playerOverall + 2 + variance())),
        phy: Math.min(99, Math.max(50, playerOverall + variance()))
      };
    } else {
      // Defender
      stats = {
        pac: Math.min(99, Math.max(50, playerOverall - 5 + variance())),
        sho: Math.max(30, playerOverall - 20 + variance()),
        pas: Math.min(99, Math.max(50, playerOverall - 2 + variance())),
        dri: Math.min(99, Math.max(50, playerOverall - 5 + variance())),
        def: Math.min(99, Math.max(50, playerOverall + 10 + variance())),
        phy: Math.min(99, Math.max(50, playerOverall + 8 + variance()))
      };
    }
    
    // Calculate simple OVR
    const ovr = Math.floor(Object.values(stats).reduce((a, b) => a + b) / 6) + 2;

    deck.push({
      id: `ai_card_${i}`,
      name: `AI Player ${i + 1}`,
      ovr: ovr,
      rarity: ovr >= 85 ? "gold" : ovr >= 75 ? "silver" : "bronze",
      stats: stats
    });
  }
  return deck;
}

export function resolveRound(playerCard, aiCard, chosenStat, isPlayerTurn) {
  const pStat = playerCard.stats[chosenStat];
  const aStat = aiCard.stats[chosenStat];
  
  let winner = "draw";
  if (pStat > aStat) {
    winner = "player";
  } else if (aStat > pStat) {
    winner = "ai";
  }
  
  return {
    winner,
    pStat,
    aStat,
    statName: STAT_NAMES[chosenStat],
    message: `${playerCard.name} (${pStat}) vs ${aiCard.name} (${aStat}) in ${STAT_NAMES[chosenStat]}`
  };
}

export function pickAIStat(aiCard) {
  // AI picks its best stat
  let bestStat = "pac";
  let maxVal = 0;
  
  for (const stat of STATS) {
    if (aiCard.stats[stat] > maxVal) {
      maxVal = aiCard.stats[stat];
      bestStat = stat;
    }
  }
  return bestStat;
}
