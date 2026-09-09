"use client";
import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";

export default function PvPPage() {
  const { user, aiCoins, deductCoins } = useAppContext();
  const [lobbies, setLobbies] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [wager, setWager] = useState(10);
  const [teamRating, setTeamRating] = useState(85);

  const fetchLobbies = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/pvp/lobbies");
      if (res.ok) {
        const data = await res.json();
        setLobbies(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLobbies();
    const interval = setInterval(fetchLobbies, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll for active match status
  useEffect(() => {
    if (!activeMatch || activeMatch.status === "resolved") return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/pvp/status/${activeMatch.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "resolved") {
            setActiveMatch(data);
            fetchLobbies();
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [activeMatch]);

  const handleCreate = async () => {
    if (!user) return alert("Must be logged in!");
    if (aiCoins < wager) return alert("Insufficient funds!");
    if (wager <= 0) return alert("Wager must be greater than 0");

    try {
      const res = await fetch("http://localhost:8000/api/pvp/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          username: user.email.split("@")[0],
          wager: parseFloat(wager),
          team_rating: parseInt(teamRating)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      deductCoins(wager);
      alert("Lobby created! Waiting for opponent...");
      
      // Fetch status of new lobby
      const statRes = await fetch(`http://localhost:8000/api/pvp/status/${data.lobby_id}`);
      setActiveMatch(await statRes.json());
      fetchLobbies();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleJoin = async (lobby) => {
    if (!user) return alert("Must be logged in!");
    if (aiCoins < lobby.wager) return alert("Insufficient funds to match this wager!");

    try {
      const res = await fetch("http://localhost:8000/api/pvp/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobby_id: lobby.id,
          user_id: user.id,
          username: user.email.split("@")[0],
          team_rating: parseInt(teamRating)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      deductCoins(lobby.wager);
      setActiveMatch(data);
    } catch (err) {
      alert("Error joining: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text uppercase tracking-widest mb-1">PvP Arena</h1>
          <p className="text-sm text-[var(--text-secondary)]">Challenge other managers to head-to-head simulations.</p>
        </div>
        <div className="glass-card px-4 py-2 border border-[var(--accent-primary)] text-[var(--accent-primary)] font-black text-lg shadow-[0_0_10px_rgba(0,255,170,0.2)]">
          Balance: ₦{aiCoins.toFixed(2)}
        </div>
      </div>

      {activeMatch ? (
        <div className="glass-card p-8 text-center border-t-4 border-[var(--accent-primary)] max-w-2xl mx-auto shadow-2xl">
          <h2 className="text-2xl font-black mb-6 uppercase">Match Status</h2>
          
          <div className="flex justify-between items-center mb-8">
            <div className="flex-1 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
              <div className="text-sm text-[var(--text-secondary)] mb-1">Host</div>
              <div className="font-bold text-lg text-white">{activeMatch.creator_name}</div>
              <div className="text-xs text-[var(--accent-primary)] font-black">OVR: {activeMatch.creator_rating}</div>
            </div>
            
            <div className="px-6 text-2xl font-black italic text-gray-500">VS</div>
            
            <div className="flex-1 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
              <div className="text-sm text-[var(--text-secondary)] mb-1">Challenger</div>
              {activeMatch.status === "waiting" ? (
                <div className="font-bold text-lg text-gray-500 animate-pulse">Waiting...</div>
              ) : (
                <>
                  <div className="font-bold text-lg text-white">{activeMatch.joiner_name}</div>
                  <div className="text-xs text-[var(--accent-primary)] font-black">OVR: {activeMatch.joiner_rating}</div>
                </>
              )}
            </div>
          </div>

          <div className="bg-black/50 p-4 rounded-lg mb-8 border border-white/10">
            <div className="text-sm text-[var(--text-secondary)] uppercase tracking-widest font-bold mb-1">Total Pot</div>
            <div className="text-3xl font-black text-[var(--accent-primary)] drop-shadow-[0_0_8px_rgba(0,255,170,0.5)]">
              ₦{(activeMatch.wager * 2).toFixed(2)}
            </div>
          </div>

          {activeMatch.status === "waiting" && (
            <div className="text-gray-400 text-sm animate-pulse">
              Share your lobby code or wait for a challenger to join from the browser.
            </div>
          )}

          {activeMatch.status === "resolved" && activeMatch.result && (
            <div className="animate-fade-in">
              <div className="text-4xl font-black mb-2 tracking-widest">
                <span className="text-white">{activeMatch.result.creator_goals}</span>
                <span className="text-gray-500 mx-4">-</span>
                <span className="text-white">{activeMatch.result.joiner_goals}</span>
              </div>
              <div className="text-sm text-[var(--text-secondary)] uppercase mb-6 font-bold">Final Score</div>
              
              <div className={`p-4 rounded-xl border-2 ${activeMatch.result.winner === 'draw' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-green-500 bg-green-500/10 text-green-400'}`}>
                {activeMatch.result.winner === "draw" ? (
                  <div className="font-bold text-lg">Match Ended in a Draw! Wagers refunded.</div>
                ) : (
                  <>
                    <div className="font-black text-xl mb-1 uppercase tracking-wider">
                      Winner: {activeMatch.result.winner === "creator" ? activeMatch.creator_name : activeMatch.joiner_name}
                    </div>
                    <div className="text-sm font-bold">
                      Payout: ₦{activeMatch.result.payout.toFixed(2)}
                    </div>
                  </>
                )}
              </div>
              
              <button 
                onClick={() => { setActiveMatch(null); fetchLobbies(); }}
                className="mt-6 w-full py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-white/30 rounded-lg font-bold text-white transition-colors"
              >
                Return to Arena
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Match Panel */}
          <div className="glass-card p-6 border border-[var(--border-color)] h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-[var(--accent-primary)] text-2xl">⚔️</span> 
              Host a Match
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase font-bold mb-2">Wager Amount (₦)</label>
                <input 
                  type="number" 
                  value={wager}
                  onChange={e => setWager(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-white px-4 py-3 rounded-lg font-bold focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase font-bold mb-2">Your Team Rating (OVR)</label>
                <input 
                  type="range" 
                  min="60" max="99" 
                  value={teamRating}
                  onChange={e => setTeamRating(e.target.value)}
                  className="w-full accent-[var(--accent-primary)]"
                />
                <div className="text-right text-sm font-black text-[var(--accent-primary)] mt-1">{teamRating} OVR</div>
              </div>

              <div className="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)] text-sm mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-[var(--text-secondary)]">Potential Pot:</span>
                  <span className="font-bold text-white">₦{(wager * 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">House Fee (Winner):</span>
                  <span className="font-bold text-red-400">10%</span>
                </div>
              </div>

              <button 
                onClick={handleCreate}
                className="w-full bg-[var(--accent-primary)] text-[var(--bg-primary)] font-black uppercase tracking-widest py-4 rounded-lg hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(0,255,170,0.3)]"
              >
                Host Match
              </button>
            </div>
          </div>

          {/* Lobby Browser */}
          <div className="lg:col-span-2 glass-card p-6 border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-blue-400 text-2xl">🌐</span> 
                Open Lobbies
              </h2>
              <button onClick={fetchLobbies} className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-[var(--text-secondary)]">Scanning arena...</div>
            ) : lobbies.length === 0 ? (
              <div className="text-center py-12 bg-black/20 rounded-xl border border-white/5">
                <div className="text-4xl mb-4">🏟️</div>
                <div className="font-bold text-gray-400 mb-1">No open lobbies found.</div>
                <div className="text-sm text-gray-500">Be the first to host a match!</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lobbies.map((lobby, i) => (
                  <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl hover:border-[var(--accent-primary)] transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-primary)]"></div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Host</div>
                        <div className="font-bold text-white">{lobby.creator_name}</div>
                        <div className="text-xs font-black text-blue-400">OVR {lobby.creator_rating}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Wager</div>
                        <div className="font-black text-lg text-[var(--accent-primary)]">₦{lobby.wager.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleJoin(lobby)}
                      className="w-full py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg font-bold text-xs uppercase tracking-wider group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--bg-primary)] group-hover:border-transparent transition-all"
                    >
                      Accept Challenge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
