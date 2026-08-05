"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const MOCK_ACHIEVEMENT_LEADERS = [
  { name: "xG_Whisperer", achievements: 12, biggestWin: 2450, profit: 8320 },
  { name: "Parlay_King_99", achievements: 10, biggestWin: 1800, profit: 5640 },
  { name: "TacticsMaster", achievements: 9, biggestWin: 1200, profit: 4100 },
  { name: "BetBot_3000", achievements: 8, biggestWin: 980, profit: 3200 },
  { name: "FPL_Legend", achievements: 7, biggestWin: 750, profit: 2800 },
  { name: "CoinFlip_Carlos", achievements: 6, biggestWin: 600, profit: 1900 },
  { name: "UnderdogHunter", achievements: 5, biggestWin: 500, profit: 1200 },
  { name: "LiveBet_Larry", achievements: 4, biggestWin: 400, profit: 800 },
];

export default function LeaderboardsPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("wealth");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("user_id, balance")
        .order("balance", { ascending: false })
        .limit(50);
        
      if (data) {
        setLeaderboard(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getRankBadge = (balance) => {
    if (balance >= 10000) return { emoji: "🐳", label: "Whale", color: "text-blue-400" };
    if (balance >= 1000) return { emoji: "🦈", label: "Shark", color: "text-teal-400" };
    if (balance >= 100) return { emoji: "🐠", label: "Fish", color: "text-yellow-400" };
    return { emoji: "🦐", label: "Shrimp", color: "text-orange-400" };
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="mb-8 border-b border-[var(--border-color)] pb-4 text-center">
        <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          🏆 Global Leaderboards
        </h1>
        <p className="text-[var(--text-secondary)]">The most legendary managers in AI Football.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 justify-center">
        <button 
          onClick={() => setActiveTab("wealth")}
          className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === "wealth" ? "bg-[var(--accent-primary)] text-black" : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"}`}
        >
          💰 Wealth Rankings
        </button>
        <button 
          onClick={() => setActiveTab("achievements")}
          className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === "achievements" ? "bg-[var(--accent-primary)] text-black" : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"}`}
        >
          🏅 Achievement Board
        </button>
      </div>

      {activeTab === "wealth" && (
        <>
          {loading ? (
            <div className="text-center py-20 animate-pulse text-[var(--accent-primary)]">Loading Rankings...</div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 border-b border-[var(--border-color)] text-[var(--text-secondary)] text-sm">
                    <th className="p-4 font-bold">Rank</th>
                    <th className="p-4 font-bold">Manager ID</th>
                    <th className="p-4 font-bold">Tier</th>
                    <th className="p-4 font-bold text-right">Net Worth</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => {
                    const rank = getRankBadge(entry.balance);
                    return (
                      <tr key={entry.user_id} className="border-b border-[var(--border-color)] hover:bg-white/5 transition-colors">
                        <td className="p-4 font-black text-xl">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </td>
                        <td className="p-4 font-mono text-sm opacity-80">
                          User_{entry.user_id.substring(0, 6)}
                        </td>
                        <td className="p-4">
                          <span className={`font-bold flex items-center gap-2 ${rank.color}`}>
                            <span>{rank.emoji}</span>
                            <span>{rank.label}</span>
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-[var(--accent-primary)] text-lg">
                          ${entry.balance.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {leaderboard.length === 0 && (
                <div className="text-center py-10 text-[var(--text-secondary)]">No leaderboard data found.</div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "achievements" && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-[var(--border-color)] text-[var(--text-secondary)] text-sm">
                <th className="p-4 font-bold">Rank</th>
                <th className="p-4 font-bold">Manager</th>
                <th className="p-4 font-bold text-center">🏅 Achievements</th>
                <th className="p-4 font-bold text-right">Biggest Win</th>
                <th className="p-4 font-bold text-right">Total Profit</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ACHIEVEMENT_LEADERS.map((entry, idx) => (
                <tr key={entry.name} className="border-b border-[var(--border-color)] hover:bg-white/5 transition-colors">
                  <td className="p-4 font-black text-xl">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </td>
                  <td className="p-4 font-bold">{entry.name}</td>
                  <td className="p-4 text-center">
                    <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-black text-sm">
                      {entry.achievements}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-green-400">£{entry.biggestWin.toLocaleString()}</td>
                  <td className="p-4 text-right font-black text-[var(--accent-primary)]">£{entry.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
