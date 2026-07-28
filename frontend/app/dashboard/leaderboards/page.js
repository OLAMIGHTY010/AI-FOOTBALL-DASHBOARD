"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LeaderboardsPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Fetch emails for these users (Note: In a real prod app, you might want a public profiles table, but for demo we can mock or use truncated IDs)
        // Since we can't easily fetch auth emails securely from client, we will display truncated user IDs or pseudo names.
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
          🏆 Global Wealth Leaderboard
        </h1>
        <p className="text-[var(--text-secondary)]">The most profitable managers in AI Football.</p>
      </div>

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
    </div>
  );
}
