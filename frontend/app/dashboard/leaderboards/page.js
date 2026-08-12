"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState("bankroll"); // 'bankroll', 'club_value', 'tipsters'
  const [tipsterSort, setTipsterSort] = useState("profit"); // 'profit' or 'winrate'
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, tipsterSort]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      if (activeTab === "bankroll") {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, bankroll")
          .order("bankroll", { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        const mapped = data.map((u, i) => ({
          rank: i + 1,
          username: u.username || "Anonymous",
          score: parseFloat(u.bankroll || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          metric: "AI Coins"
        }));
        setLeaders(mapped);
      } else if (activeTab === "club_value") {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, ut_club");
          
        if (error) throw error;
        
        let mapped = data.map(u => {
          let val = 0;
          if (u.ut_club && Array.isArray(u.ut_club)) {
            val = u.ut_club.reduce((sum, card) => sum + (card.rating || 0), 0);
          }
          return {
            username: u.username || "Anonymous",
            rawValue: val,
            score: val.toLocaleString(),
            metric: "Club Value"
          };
        });
        
        mapped.sort((a, b) => b.rawValue - a.rawValue);
        mapped = mapped.slice(0, 50).map((u, i) => ({ ...u, rank: i + 1 }));
        
        setLeaders(mapped);
      } else if (activeTab === "tipsters") {
        let query = supabase.from("tipster_leaderboard").select("*");
        
        if (tipsterSort === "winrate") {
          // Minimum 5 bets to qualify for win rate leaderboard
          query = query.gte("total_bets", 5).order("win_rate", { ascending: false });
        } else {
          query = query.order("net_profit", { ascending: false });
        }
        
        const { data, error } = await query.limit(50);
        
        if (error) throw error;
        
        const mapped = data.map((u, i) => ({
          rank: i + 1,
          username: u.username || "Anonymous",
          score: tipsterSort === "profit" 
            ? `$${parseFloat(u.net_profit || 0).toFixed(2)}`
            : `${parseFloat(u.win_rate || 0).toFixed(1)}%`,
          subtext: `${u.total_bets} Bets (${u.bets_won}W - ${u.bets_lost}L)`,
          metric: tipsterSort === "profit" ? "Net Profit" : "Win Rate"
        }));
        setLeaders(mapped);
      }
    } catch (err) {
      console.error("Error fetching leaderboards:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center border-2 border-[var(--accent-primary)]">
          <span className="text-2xl">🏆</span>
        </div>
        <div>
          <h1 className="text-3xl font-black gradient-text">Global Leaderboards</h1>
          <p className="text-[var(--text-secondary)] font-bold">Compete against managers worldwide.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <button
          onClick={() => setActiveTab("bankroll")}
          className={`flex-1 py-4 font-black rounded-lg transition-all ${
            activeTab === "bankroll"
              ? "bg-[var(--accent-primary)] text-black shadow-[0_0_20px_rgba(0,255,135,0.4)]"
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80"
          }`}
        >
          Richest Managers (Bankroll)
        </button>
        <button
          onClick={() => setActiveTab("club_value")}
          className={`flex-1 py-4 font-black rounded-lg transition-all ${
            activeTab === "club_value"
              ? "bg-[var(--accent-primary)] text-black shadow-[0_0_20px_rgba(0,255,135,0.4)]"
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80"
          }`}
        >
          Best Ultimate Teams (Club Value)
        </button>
        <button
          onClick={() => setActiveTab("tipsters")}
          className={`flex-1 py-4 font-black rounded-lg transition-all ${
            activeTab === "tipsters"
              ? "bg-[var(--accent-primary)] text-black shadow-[0_0_20px_rgba(0,255,135,0.4)]"
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80"
          }`}
        >
          Best Tipsters (Betting)
        </button>
      </div>

      <div className="glass-card !p-0 overflow-hidden">
        {activeTab === "tipsters" && (
          <div className="flex bg-[var(--bg-secondary)]/50 p-4 gap-4 border-b border-[var(--border-color)]">
            <button
              onClick={() => setTipsterSort("profit")}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                tipsterSort === "profit" ? "bg-[var(--accent-primary)] text-black" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              Sort by Net Profit
            </button>
            <button
              onClick={() => setTipsterSort("winrate")}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                tipsterSort === "winrate" ? "bg-[var(--accent-primary)] text-black" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              Sort by Win Rate (Min 5 Bets)
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="p-12 text-center text-[var(--text-secondary)] font-bold animate-pulse">
            Loading ranks...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--bg-secondary)]">
                <th className="p-4 font-black text-[var(--text-secondary)] w-24 text-center">RANK</th>
                <th className="p-4 font-black text-[var(--text-secondary)]">MANAGER</th>
                <th className="p-4 font-black text-[var(--text-secondary)] text-right">
                  {activeTab === "bankroll" ? "BANKROLL" : activeTab === "club_value" ? "CLUB VALUE" : tipsterSort === "profit" ? "NET PROFIT" : "WIN RATE"}
                </th>
              </tr>
            </thead>
            <tbody>
              {leaders.length > 0 ? (
                leaders.map((leader, i) => (
                  <tr 
                    key={i} 
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-secondary)]/30 transition-colors"
                  >
                    <td className="p-4 text-center">
                      {leader.rank === 1 && <span className="text-2xl" title="1st Place">🥇</span>}
                      {leader.rank === 2 && <span className="text-2xl" title="2nd Place">🥈</span>}
                      {leader.rank === 3 && <span className="text-2xl" title="3rd Place">🥉</span>}
                      {leader.rank > 3 && <span className="font-bold text-[var(--text-secondary)]">#{leader.rank}</span>}
                    </td>
                    <td className="p-4">
                      <div className="font-bold">{leader.username}</div>
                      {leader.subtext && <div className="text-xs text-[var(--text-secondary)] mt-1">{leader.subtext}</div>}
                    </td>
                    <td className="p-4 font-black text-right text-[var(--accent-primary)]">
                      {activeTab === "bankroll" && "$"}
                      {leader.score}
                      {activeTab === "club_value" && " Pts"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-[var(--text-secondary)] font-bold">
                    No data available yet. Be the first to rank up!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
