"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function FPLLeagues({ session }) {
  const [activeTab, setActiveTab] = useState("classic");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cup state (mocked bracket)
  const [cupOpponent, setCupOpponent] = useState(null);

  useEffect(() => {
    fetchScores();
    // Generate a fake cup opponent for flavor
    setCupOpponent({
      name: `Manager_${Math.floor(Math.random()*9000)+1000}`,
      score: Math.floor(Math.random() * 60) + 30
    });
  }, []);

  const fetchScores = async () => {
    const { data, error } = await supabase
      .from('fpl_scores')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(100);
      
    if (data) setLeaderboard(data);
    setLoading(false);
  };

  return (
    <div className="glass-card">
      <div className="flex border-b border-[var(--border-color)]">
        <button 
          onClick={() => setActiveTab("classic")}
          className={`flex-1 py-3 font-bold text-center ${activeTab === "classic" ? "bg-[var(--accent-primary)] text-black" : "text-[var(--text-secondary)] hover:bg-white/5"}`}
        >
          🏆 Global Classic
        </button>
        <button 
          onClick={() => setActiveTab("cup")}
          className={`flex-1 py-3 font-bold text-center ${activeTab === "cup" ? "bg-purple-600 text-white" : "text-[var(--text-secondary)] hover:bg-white/5"}`}
        >
          ⚔️ League Cup
        </button>
      </div>

      <div className="p-4">
        {activeTab === "classic" && (
          <div>
            <h3 className="text-xl font-bold mb-4 text-center">Overall Global League</h3>
            {loading ? (
              <div className="text-center py-10 animate-pulse text-[var(--accent-primary)]">Loading Ranks...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-secondary)] italic">No managers ranked yet. Save your squad to join!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] text-sm">
                      <th className="p-3 font-bold">Rank</th>
                      <th className="p-3 font-bold">Manager</th>
                      <th className="p-3 font-bold text-right">GW</th>
                      <th className="p-3 font-bold text-right">Total Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => (
                      <tr key={entry.user_id} className={`border-b border-[var(--border-color)] ${entry.user_id === session?.user?.id ? 'bg-[var(--accent-primary)]/20' : 'hover:bg-white/5'}`}>
                        <td className="p-3 font-bold">{idx + 1}</td>
                        <td className="p-3 font-mono text-sm opacity-90">{entry.email.split('@')[0]}</td>
                        <td className="p-3 text-right">{entry.gw_points}</td>
                        <td className="p-3 text-right font-black text-green-400">{entry.total_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "cup" && (
          <div className="py-6">
            <h3 className="text-xl font-bold mb-6 text-center text-purple-400">Round of 64 - Matchweek 1</h3>
            
            <div className="flex items-center justify-center gap-4">
              <div className="glass-card bg-black/40 p-6 flex-1 text-center border-l-4 border-green-500">
                <div className="text-sm text-[var(--text-secondary)] mb-2">You</div>
                <div className="text-2xl font-black truncate">{session ? session.user.email.split('@')[0] : "Guest"}</div>
                <div className="mt-4 text-sm font-bold text-green-400 animate-pulse">Live Score</div>
                <div className="text-4xl font-black text-white">TBD</div>
              </div>
              
              <div className="text-2xl font-black text-gray-500 italic">VS</div>
              
              <div className="glass-card bg-black/40 p-6 flex-1 text-center border-r-4 border-red-500">
                <div className="text-sm text-[var(--text-secondary)] mb-2">Opponent</div>
                <div className="text-2xl font-black truncate">{cupOpponent?.name}</div>
                <div className="mt-4 text-sm font-bold text-red-400">Live Score</div>
                <div className="text-4xl font-black text-white">{cupOpponent?.score}</div>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
              Win this head-to-head match based on Gameweek points to advance to the Round of 32!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
