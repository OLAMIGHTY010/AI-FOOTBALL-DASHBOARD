import { supabase } from "@/lib/supabaseClient";

// Configuration for badges
export const BADGES = {
  first_bet: { id: 'first_bet', icon: '🎟️', name: 'First Bet Placed', desc: 'You placed your very first bet in the sportsbook.', xp: 50 },
  high_roller: { id: 'high_roller', icon: '🔥', name: 'High Roller', desc: 'Placed 10+ bets in the Virtual Sportsbook.', xp: 200 },
  predictor_king: { id: 'predictor_king', icon: '👑', name: 'Predictor King', desc: 'Submitted predictions for a weekly tournament.', xp: 150 },
  tycoon: { id: 'tycoon', icon: '💰', name: 'Tycoon', desc: 'Earned over £500 in net profit.', xp: 500 },
  jackpot: { id: 'jackpot', icon: '🎰', name: 'Jackpot', desc: 'Won over £200 from a single bet.', xp: 300 },
  loyal_manager: { id: 'loyal_manager', icon: '📅', name: 'Loyal Manager', desc: 'Logged in for 3 consecutive days.', xp: 100 },
  level_10: { id: 'level_10', icon: '🌟', name: 'Veteran', desc: 'Reached Level 10.', xp: 1000 },
};

// Calculate how much XP is needed for a specific level.
// Formula: Level 1 -> 0 XP. Level N -> (N-1)^2 * 100
export const getXpForLevel = (level) => {
  return Math.pow(level - 1, 2) * 100;
};

// Determine current level based on total XP
export const getLevelFromXp = (xp) => {
  let level = 1;
  while (xp >= getXpForLevel(level + 1)) {
    level++;
  }
  return level;
};

// Handle awarding XP, leveling up, and giving AI Coin rewards
export const awardXp = async (userId, currentXp, currentLevel, amountAwarded) => {
  try {
    const newXp = currentXp + amountAwarded;
    const newLevel = getLevelFromXp(newXp);
    let levelUpReward = 0;

    // Check if they leveled up
    if (newLevel > currentLevel) {
      // Reward = New Level * 100 AI Coins
      // If they jumped multiple levels at once, sum them up
      for (let l = currentLevel + 1; l <= newLevel; l++) {
        levelUpReward += (l * 100);
      }
    }

    // Update profile
    const updateData = { xp: newXp, level: newLevel };
    
    await supabase.from("profiles").update(updateData).eq("id", userId);

    return {
      newXp,
      newLevel,
      leveledUp: newLevel > currentLevel,
      rewardCoins: levelUpReward
    };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return null;
  }
};

// Unlock a badge for a user if they don't already have it
export const unlockBadge = async (userId, badgeId) => {
  try {
    // Check if it exists
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badgeId)
      .single();

    if (existing) return false; // Already unlocked

    // Insert
    await supabase
      .from("user_achievements")
      .insert({ user_id: userId, badge_id: badgeId });
      
    return true; // Successfully unlocked just now
  } catch (error) {
    console.error("Error unlocking badge:", error);
    return false;
  }
};
