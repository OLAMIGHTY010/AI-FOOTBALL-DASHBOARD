"use client";
import { useState, useEffect } from "react";

export default function FPLLeagues({ session }) {
  const [activeTab, setActiveTab] = useState("my-leagues");
  const [myLeagues, setMyLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [standings, setStandings] = useState([]);
  
  // Forms
  const [joinCode, setJoinCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("CLASSIC");
  
  const [message, setMessage] = useState("");
  const [leagueFixtures, setLeagueFixtures] = useState([]);
  const [fixtureSubTab, setFixtureSubTab] = useState("standings"); // standings, fixtures

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    if (session) {
      fetchMyLeagues();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchMyLeagues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/team/me/leagues`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyLeagues(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchLeagueDetails = async (leagueId) => {
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/v1/leagues/${leagueId}`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedLeague(data.league);
        setStandings(data.standings);
        setActiveTab("standings");
        setFixtureSubTab("standings");
        
        if (data.league.type === "H2H") {
          const fixRes = await fetch(`${API_URL}/api/v1/leagues/${leagueId}/fixtures`);
          if (fixRes.ok) {
            const fixData = await fixRes.json();
            setLeagueFixtures(fixData);
          }
        } else {
          setLeagueFixtures([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/v1/leagues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name: createName, type: createType, privacy: "PRIVATE" })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`League created! Invite code: ${data.invite_code}`);
        fetchMyLeagues();
        setCreateName("");
      } else {
        setMessage("Failed: " + data.detail);
      }
    } catch (err) {
      setMessage("Error creating league.");
    }
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/v1/leagues/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ invite_code: joinCode })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Successfully joined ${data.league.name}!`);
        fetchMyLeagues();
        setJoinCode("");
      } else {
        setMessage("Failed to join: " + (data.detail?.message || data.detail || JSON.stringify(data.detail)));
      }
    } catch (err) {
      setMessage("Error joining league.");
    }
  };

  const handleGenerateFixtures = async () => {
    if (!selectedLeague) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/leagues/${selectedLeague.id}/generate-fixtures`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchLeagueDetails(selectedLeague.id);
      } else {
        alert("Failed: " + data.detail);
      }
    } catch (err) {
      alert("Error generating fixtures.");
    }
  };

  if (!session) {
    return <div className="text-center p-8 text-[var(--text-secondary)]">Please sign in to manage leagues.</div>;
  }

  return (
    <div className="glass-card flex flex-col min-h-[500px]">
      <div className="flex border-b border-[var(--border-color)]">
        <button 
          onClick={() => { setActiveTab("my-leagues"); setMessage(""); }}
          className={`flex-1 py-3 font-bold text-center ${activeTab === "my-leagues" ? "bg-[var(--accent-primary)] text-black" : "text-[var(--text-secondary)] hover:bg-white/5"}`}
        >
          🏆 My Leagues
        </button>
        <button 
          onClick={() => { setActiveTab("join"); setMessage(""); }}
          className={`flex-1 py-3 font-bold text-center ${activeTab === "join" ? "bg-[var(--accent-primary)] text-black" : "text-[var(--text-secondary)] hover:bg-white/5"}`}
        >
          🤝 Join
        </button>
        <button 
          onClick={() => { setActiveTab("create"); setMessage(""); }}
          className={`flex-1 py-3 font-bold text-center ${activeTab === "create" ? "bg-[var(--accent-primary)] text-black" : "text-[var(--text-secondary)] hover:bg-white/5"}`}
        >
          ➕ Create
        </button>
      </div>

      <div className="p-6 flex-1">
        {message && (
          <div className="bg-[#37003c] text-[var(--accent-primary)] font-bold p-3 rounded mb-4 text-center border border-[var(--accent-primary)]">
            {message}
          </div>
        )}

        {activeTab === "my-leagues" && (
          <div>
            <h3 className="text-xl font-bold mb-4">Your Active Leagues</h3>
            {loading ? (
              <div className="animate-pulse text-[var(--accent-primary)]">Loading...</div>
            ) : myLeagues.length === 0 ? (
              <div className="text-[var(--text-secondary)] italic">You haven't joined any leagues yet. Create or join one!</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myLeagues.map((entry) => (
                  <div 
                    key={entry.league_id} 
                    onClick={() => fetchLeagueDetails(entry.league_id)}
                    className="glass-card p-4 cursor-pointer hover:bg-white/5 hover:border-[var(--accent-primary)] transition-colors border border-transparent"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-lg">{entry.leagues?.name}</h4>
                        <div className="text-sm text-[var(--text-secondary)]">{entry.leagues?.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[var(--text-secondary)]">Invite Code</div>
                        <div className="font-mono bg-black/50 px-2 py-1 rounded">{entry.leagues?.invite_code}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "standings" && selectedLeague && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[var(--accent-primary)]">{selectedLeague.name}</h3>
                <div className="text-sm text-[var(--text-secondary)]">{selectedLeague.type} League</div>
              </div>
              <div className="flex gap-2">
                {selectedLeague.admin_team_id === teamData?.id && selectedLeague.type === "H2H" && leagueFixtures.length === 0 && (
                  <button 
                    onClick={handleGenerateFixtures}
                    className="btn-primary px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-500"
                  >
                    ⚙️ Generate H2H Fixtures
                  </button>
                )}
                <button 
                  onClick={() => setActiveTab("my-leagues")}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Back to Leagues
                </button>
              </div>
            </div>
            
            {selectedLeague.type === "H2H" && (
              <div className="flex gap-4 border-b border-[var(--border-color)] mb-4">
                <button 
                  className={`pb-2 font-bold px-2 ${fixtureSubTab === 'standings' ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}
                  onClick={() => setFixtureSubTab('standings')}
                >
                  Standings
                </button>
                <button 
                  className={`pb-2 font-bold px-2 ${fixtureSubTab === 'fixtures' ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}
                  onClick={() => setFixtureSubTab('fixtures')}
                >
                  Fixtures
                </button>
              </div>
            )}
            
            {fixtureSubTab === "standings" ? (
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] text-sm">
                    <th className="p-3 font-bold">Rank</th>
                    <th className="p-3 font-bold">Manager / Team</th>
                    {selectedLeague.type === "H2H" && (
                      <>
                        <th className="p-3 font-bold text-center">W-D-L</th>
                        <th className="p-3 font-bold text-right text-[var(--accent-primary)]">Pts</th>
                      </>
                    )}
                    <th className="p-3 font-bold text-right">Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry, idx) => (
                    <tr key={entry.virtual_team_id} className="border-b border-[var(--border-color)] hover:bg-white/5">
                      <td className="p-3 font-bold">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{entry.virtual_teams?.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{entry.virtual_teams?.fpl_users?.username}</div>
                      </td>
                      {selectedLeague.type === "H2H" && (
                        <>
                          <td className="p-3 text-center">{entry.h2h_wins}-{entry.h2h_draws}-{entry.h2h_losses}</td>
                          <td className="p-3 text-right font-black text-[var(--accent-primary)]">{entry.h2h_points}</td>
                        </>
                      )}
                      <td className="p-3 text-right font-bold text-green-400">{entry.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
              <div className="space-y-4">
                {leagueFixtures.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-secondary)] italic">
                    Fixtures have not been generated yet. The league admin must generate them.
                  </div>
                ) : (
                  <div>
                    {/* Group fixtures by gameweek */}
                    {[...new Set(leagueFixtures.map(f => f.gameweek_id))].map(gw => (
                      <div key={gw} className="mb-6">
                        <h4 className="font-bold text-lg mb-2 text-[var(--text-secondary)] border-b border-white/10 pb-1">Gameweek {gw}</h4>
                        <div className="grid gap-2">
                          {leagueFixtures.filter(f => f.gameweek_id === gw).map(match => (
                            <div key={match.id} className="flex items-center justify-between glass-card p-3 bg-black/20">
                              <div className="flex-1 text-right font-bold truncate pr-4">{match.team_a?.name || "Unknown"}</div>
                              <div className="px-4 py-1 bg-black rounded font-mono text-xs border border-white/10 shrink-0">
                                {match.is_processed ? `${match.team_a_score} - ${match.team_b_score}` : 'vs'}
                              </div>
                              <div className="flex-1 text-left font-bold truncate pl-4">{match.team_b?.name || "Unknown"}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "join" && (
          <div className="max-w-md mx-auto py-8">
            <h3 className="text-2xl font-bold mb-2 text-center">Join a Private League</h3>
            <p className="text-[var(--text-secondary)] text-center mb-6">Enter the 6-character invite code provided by the league admin.</p>
            <form onSubmit={handleJoinLeague} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="e.g. A1B2C3" 
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="input-field py-4 text-center text-xl tracking-widest font-mono"
                maxLength={6}
                required
              />
              <button type="submit" className="btn-primary py-3 font-bold text-lg rounded-xl">
                Join League
              </button>
            </form>
          </div>
        )}

        {activeTab === "create" && (
          <div className="max-w-md mx-auto py-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Create a New League</h3>
            <form onSubmit={handleCreateLeague} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">League Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Office Mini-League" 
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  className="input-field w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Scoring System</label>
                <div className="flex gap-4">
                  <div 
                    onClick={() => setCreateType("CLASSIC")}
                    className={`flex-1 p-4 cursor-pointer rounded-xl border-2 text-center transition-colors ${createType === "CLASSIC" ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "border-[var(--border-color)] hover:border-white/50"}`}
                  >
                    <div className="font-bold mb-1">Classic</div>
                    <div className="text-xs opacity-70">Total cumulative points</div>
                  </div>
                  <div 
                    onClick={() => setCreateType("H2H")}
                    className={`flex-1 p-4 cursor-pointer rounded-xl border-2 text-center transition-colors ${createType === "H2H" ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "border-[var(--border-color)] hover:border-white/50"}`}
                  >
                    <div className="font-bold mb-1">Head-to-Head</div>
                    <div className="text-xs opacity-70">Weekly W-D-L matchups</div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary py-3 font-bold text-lg rounded-xl mt-4">
                Create League
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
