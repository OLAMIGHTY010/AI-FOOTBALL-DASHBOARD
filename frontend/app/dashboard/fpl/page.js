"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import FPLChat from "./components/FPLChat";
import FPLLeagues from "./components/FPLLeagues";

const API_URL = "http://localhost:8000";

export default function FPLPage() {
  const [activeTab, setActiveTab] = useState("transfers");
  const [competition, setCompetition] = useState("epl"); // epl, ucl, uel, uecl
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  
  // Optimizer state
  const [budget, setBudget] = useState(100.0);
  const [formation, setFormation] = useState("3-4-3");
  const [optimizing, setOptimizing] = useState(false);
  
  // Squad state
  const [squad, setSquad] = useState(null);
  const [punditReport, setPunditReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchPunditReport = async () => {
    setReportLoading(true);
    try {
      const resStandings = await fetch(`${API_URL}/api/standings`);
      const standings = await resStandings.json();
      
      const res = await fetch(`${API_URL}/api/fpl/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standings })
      });
      const data = await res.json();
      if (data.success) {
        setPunditReport(data.report);
      }
    } catch (err) {
      console.error(err);
    }
    setReportLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const fetchFpl = async () => {
      setLoading(true);
      try {
        const endpoint = competition === "epl" ? `${API_URL}/api/fpl/data` : `${API_URL}/api/uefa/data?competition=${competition}`;
        const res = await fetch(endpoint);
        const json = await res.json();
        setPlayers(json.players || json || []);
      } catch (err) {
        console.error(`Failed to load ${competition} data`, err);
      }
      setLoading(false);
    };
    fetchFpl();
    
    // Load from local storage if exists
    setSquad(JSON.parse(localStorage.getItem(`fpl_squad_${competition}`) || "null"));
  }, [competition]);

  const saveSquadLocally = async (newSquad) => {
    setSquad(newSquad);
    localStorage.setItem(`fpl_squad_${competition}`, JSON.stringify(newSquad));

    // Sync to fpl_scores in Supabase
    if (session) {
      const gwPoints = newSquad.starting_eleven.reduce((acc, p) => {
        let pts = p.live_points || 0;
        if (newSquad.captain && newSquad.captain.id === p.id) pts *= 2;
        return acc + pts;
      }, 0);

      await supabase.from("fpl_scores").upsert({
        user_id: session.user.id,
        email: session.user.email,
        total_points: newSquad.total_expected_points + gwPoints,
        gw_points: gwPoints,
        updated_at: new Date()
      });
    }
  };

  const runOptimizer = async () => {
    setOptimizing(true);
    try {
      let endpoint = `${API_URL}/api/fpl/optimize`;
      let payload = { budget, formation };
      if (competition !== "epl") {
        endpoint = `${API_URL}/api/uefa/optimize`;
        payload = { competition, budget, formation };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        alert("Optimizer Error: " + data.error);
        setOptimizing(false);
        return;
      }
      saveSquadLocally(data);
      setActiveTab("team");
    } catch (err) {
      alert("Failed to run optimization");
      console.error(err);
    }
    setOptimizing(false);
  };

  const handleDragStart = (e, p, isStarter) => {
    e.dataTransfer.setData("playerId", p.id);
    e.dataTransfer.setData("isStarter", isStarter);
  };

  const handleDrop = (e, targetPlayer, targetIsStarter) => {
    e.preventDefault();
    const draggedPlayerId = e.dataTransfer.getData("playerId");
    if (!draggedPlayerId || draggedPlayerId === targetPlayer.id) return;

    performSwap(draggedPlayerId, targetPlayer.id);
  };

  const performSwap = (p1Id, p2Id) => {
    // Find the players
    const allPlayers = [...squad.starting_eleven, ...squad.bench];
    const p1 = allPlayers.find(p => p.id === p1Id);
    const p2 = allPlayers.find(p => p.id === p2Id);

    const isP1Starter = squad.starting_eleven.some(p => p.id === p1Id);
    const isP2Starter = squad.starting_eleven.some(p => p.id === p2Id);

    if (isP1Starter === isP2Starter) {
      // Swapping two starters or two bench players does nothing structural
      return;
    }

    // Attempt the swap
    const newStarters = squad.starting_eleven.filter(p => p.id !== p1Id && p.id !== p2Id);
    const newBench = squad.bench.filter(p => p.id !== p1Id && p.id !== p2Id);

    if (isP1Starter) {
      newStarters.push(p2);
      newBench.push(p1);
    } else {
      newStarters.push(p1);
      newBench.push(p2);
    }

    // Validate formation
    const gkCount = newStarters.filter(p => p.position === "GK").length;
    const defCount = newStarters.filter(p => p.position === "DEF").length;
    const midCount = newStarters.filter(p => p.position === "MID").length;
    const fwdCount = newStarters.filter(p => p.position === "FWD").length;

    if (gkCount !== 1) {
      alert("You must have exactly 1 Goalkeeper in your Starting XI.");
      return;
    }
    if (defCount < 3 || defCount > 5) {
      alert("You must have between 3 and 5 Defenders in your Starting XI.");
      return;
    }
    if (midCount < 3 || midCount > 5) {
      alert("You must have between 3 and 5 Midfielders in your Starting XI.");
      return;
    }
    if (fwdCount < 1 || fwdCount > 3) {
      alert("You must have between 1 and 3 Attackers in your Starting XI.");
      return;
    }

    // Recalculate points
    let newExpectedPoints = 0;
    newStarters.forEach(p => {
      newExpectedPoints += p.expected_points;
      if (squad.captain && p.id === squad.captain.id) {
        newExpectedPoints += p.expected_points; // double points
      }
    });

    const newSquad = {
      ...squad,
      starting_eleven: newStarters,
      bench: newBench,
      total_expected_points: newExpectedPoints
    };
    saveSquadLocally(newSquad);
  };

  const setCaptain = (playerId) => {
    const newCaptain = squad.starting_eleven.find(p => p.id === playerId);
    if (!newCaptain) return;

    let newExpectedPoints = 0;
    squad.starting_eleven.forEach(p => {
      newExpectedPoints += p.expected_points;
      if (p.id === newCaptain.id) {
        newExpectedPoints += p.expected_points; 
      }
    });

    saveSquadLocally({
      ...squad,
      captain: newCaptain,
      total_expected_points: newExpectedPoints
    });
  };

  const renderPlayerNode = (p, isStarter) => {
    const isCaptain = squad.captain && p.id === squad.captain.id;
    return (
      <div 
        key={p.id} 
        draggable={true}
        onDragStart={(e) => handleDragStart(e, p, isStarter)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, p, isStarter)}
        className="relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-transform hover:scale-105 mx-1"
      >
        <img 
          src={p.photo || "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"}
          alt={p.name}
          className="w-14 h-16 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] z-10 object-contain"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"; }}
        />
        <div className="bg-[#37003c] rounded px-2 py-0.5 text-center shadow-lg border-b-2 border-green-400 min-w-[70px] -mt-2 z-20">
          <div className="text-[10px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis w-full flex items-center justify-center gap-1">
            {p.name.split(' ').pop()} {isCaptain && <span className="text-yellow-400 font-black text-[9px]">(C)</span>}
          </div>
          <div className="text-[10px] text-green-400 font-black">£{p.price.toFixed(1)}m</div>
        </div>
        <div className="flex gap-1 mt-1">
          <div className="text-[9px] text-[var(--text-secondary)] font-bold bg-black/60 px-1 py-0.5 rounded shadow-sm">
            Exp: {p.expected_points.toFixed(1)}
          </div>
          <div className="text-[9px] text-[var(--accent-primary)] font-bold bg-black/60 px-1 py-0.5 rounded shadow-sm">
            Live: {p.live_points !== undefined ? p.live_points : "-"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {competition === "epl" ? "🦁 FPL AI Predictor" : competition === "ucl" ? "⭐️ UCL Fantasy AI" : competition === "uel" ? "🌍 UEL Fantasy AI" : "🟢 UECL Fantasy AI"}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {competition === "epl" 
            ? "Connects to the official Fantasy Premier League API to predict expected points and build the mathematically optimal squad."
            : "Generate optimal UEFA Fantasy squads using advanced predictive modeling and LP solvers."}
        </p>
      </div>

      {/* Competition Selector */}
      <div className="flex justify-center gap-2 mb-4 max-w-4xl mx-auto">
        <button onClick={() => setCompetition("epl")} className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${competition === 'epl' ? 'bg-[#38003c] border-purple-400 text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'}`}>
          🦁 Premier League
        </button>
        <button onClick={() => setCompetition("ucl")} className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${competition === 'ucl' ? 'bg-[#001c54] border-blue-400 text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'}`}>
          ⭐️ Champions League
        </button>
        <button onClick={() => setCompetition("uel")} className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${competition === 'uel' ? 'bg-[#f47321] border-orange-400 text-black' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'}`}>
          🌍 Europa League
        </button>
        <button onClick={() => setCompetition("uecl")} className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${competition === 'uecl' ? 'bg-[#00b140] border-green-400 text-black' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'}`}>
          🟢 Conference League
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-4xl mx-auto">
        <button onClick={() => setActiveTab("transfers")} className={`px-4 py-2 rounded font-bold ${activeTab === 'transfers' ? 'bg-[var(--accent-primary)] text-black' : 'bg-[var(--bg-card)]'}`}>
          🔄 Player Database
        </button>
        <button onClick={() => setActiveTab("ai")} className={`px-4 py-2 rounded font-bold ${activeTab === 'ai' ? 'bg-[var(--accent-primary)] text-black' : 'bg-[var(--bg-card)]'}`}>
          🤖 AI Optimizer
        </button>
        <button onClick={() => setActiveTab("team")} className={`px-4 py-2 rounded font-bold ${activeTab === 'team' ? 'bg-[var(--accent-primary)] text-black' : 'bg-[var(--bg-card)]'}`}>
          👔 My Team
        </button>
        <button onClick={() => setActiveTab("leagues")} className={`px-4 py-2 rounded font-bold ${activeTab === 'leagues' ? 'bg-yellow-500 text-black' : 'bg-[var(--bg-card)]'}`}>
          🏆 Leagues
        </button>
        <button onClick={() => setActiveTab("chat")} className={`px-4 py-2 rounded font-bold ${activeTab === 'chat' ? 'bg-purple-500 text-white' : 'bg-[var(--bg-card)]'}`}>
          💬 FPL Chat
        </button>
      </div>

      {loading && <div className="text-center p-12 text-[var(--accent-primary)] animate-pulse">Loading Live FPL Data...</div>}

      {/* Transfers / Database */}
      {!loading && activeTab === "transfers" && (
        <div className="glass-card">
          <h2 className="font-bold text-lg mb-4">Player Database</h2>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--bg-secondary)] sticky top-0 z-20">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Pos</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Expected Pts</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={i} className="border-b border-[var(--border-color)]">
                    <td className="px-4 py-3 font-bold">{p.name}</td>
                    <td className="px-4 py-3">{p.team}</td>
                    <td className="px-4 py-3">{p.position}</td>
                    <td className="px-4 py-3">£{p.price}m</td>
                    <td className="px-4 py-3 text-[var(--accent-primary)]">{p.expected_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Optimizer */}
      {!loading && activeTab === "ai" && (
        <div className="glass-card max-w-2xl mx-auto">
          <h2 className="font-bold text-lg mb-4">Linear Programming Solver</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            The solver uses Python's Pulp library to calculate the mathematically optimal 15-man squad within your budget constraints.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2 text-[var(--text-secondary)]">Max Budget (£M)</label>
              <input 
                type="number" 
                value={budget} 
                onChange={(e) => setBudget(parseFloat(e.target.value))}
                className="input-field"
                step="0.1"
                max="100.0"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[var(--text-secondary)]">Formation</label>
              <select 
                value={formation} 
                onChange={(e) => setFormation(e.target.value)}
                className="select-field w-full"
              >
                <option value="3-4-3">3-4-3</option>
                <option value="3-5-2">3-5-2</option>
                <option value="4-4-2">4-4-2</option>
                <option value="4-3-3">4-3-3</option>
                <option value="5-3-2">5-3-2</option>
                <option value="5-4-1">5-4-1</option>
              </select>
            </div>
          </div>

          <button 
            onClick={runOptimizer} 
            disabled={optimizing} 
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {optimizing ? "Solving Matrix..." : "⚙️ Generate Optimal Squad"}
          </button>
        </div>
      )}

      {/* My Team (Visual Pitch) */}
      {!loading && activeTab === "team" && (
        <div>
          {!squad || squad.error || !squad.starting_eleven ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              No team generated yet. Go to the AI Optimizer tab to build one.
            </div>
          ) : (
            <div className="flex flex-col xl:flex-row gap-6">
              
              {/* Pitch Area */}
              <div className="flex-1 glass-card bg-gradient-to-b from-[#1e5c36] to-[#123d21] border-[#2d8a4e] p-4 relative overflow-hidden min-h-[600px] flex flex-col justify-between rounded-xl shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                
                {/* Field Markings */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[15%] border-2 border-white/30 rounded-b-lg border-t-0 pointer-events-none"></div>
                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[25%] h-[6%] border-2 border-white/30 rounded-b-lg border-t-0 pointer-events-none"></div>
                <div className="absolute top-[11%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/50 rounded-full pointer-events-none"></div>
                
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[15%] border-2 border-white/30 rounded-t-lg border-b-0 pointer-events-none"></div>
                <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[25%] h-[6%] border-2 border-white/30 rounded-t-lg border-b-0 pointer-events-none"></div>
                <div className="absolute bottom-[11%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/50 rounded-full pointer-events-none"></div>

                <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-white/30 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white/30 rounded-full pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rounded-full pointer-events-none"></div>
                
                {/* Corner arcs */}
                <div className="absolute top-0 left-0 w-8 h-8 border-2 border-white/30 rounded-br-full border-t-0 border-l-0 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-2 border-white/30 rounded-bl-full border-t-0 border-r-0 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-2 border-white/30 rounded-tr-full border-b-0 border-l-0 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-2 border-white/30 rounded-tl-full border-b-0 border-r-0 pointer-events-none"></div>

                {/* Players */}
                {(() => {
                  const fwds = squad.starting_eleven.filter(p => p.position === "FWD");
                  const mids = squad.starting_eleven.filter(p => p.position === "MID");
                  const defs = squad.starting_eleven.filter(p => p.position === "DEF");
                  const gks = squad.starting_eleven.filter(p => p.position === "GK");

                  return (
                    <div className="flex-1 flex flex-col justify-between py-6 relative z-10">
                      <div className="w-full flex justify-around">
                        {fwds.map(p => renderPlayerNode(p, true))}
                      </div>
                      <div className="w-full flex justify-around">
                        {mids.map(p => renderPlayerNode(p, true))}
                      </div>
                      <div className="w-full flex justify-around">
                        {defs.map(p => renderPlayerNode(p, true))}
                      </div>
                      <div className="w-full flex justify-around">
                        {gks.map(p => renderPlayerNode(p, true))}
                      </div>
                    </div>
                  );
                })()}

                {/* Drag and Drop Hint */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full font-bold text-xs shadow-lg z-20 border border-white/20 pointer-events-none">
                  🖱️ Drag & Drop players to substitute
                </div>
              </div>
              
              {/* Sidebar (Bench & Tools) */}
              <div className="w-full xl:w-80 flex flex-col gap-6">
                
                <div className="glass-card">
                  <h2 className="font-bold text-lg border-b border-[var(--border-color)] pb-2 mb-4">Substitutes</h2>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">Click a starter on the pitch, then click a bench player here to make a substitution.</p>
                  
                  <div className="flex flex-wrap justify-center gap-2 bg-gradient-to-r from-[#123d21] to-[#1b4d2e] border-2 border-[#2d8a4e] rounded-xl p-4 shadow-inner">
                    {squad.bench.map(p => renderPlayerNode(p, false))}
                  </div>
                </div>

                <div className="glass-card">
                  <h2 className="font-bold text-lg border-b border-[var(--border-color)] pb-2 mb-4">Select Captain</h2>
                  <select 
                    className="select-field w-full mb-2 text-sm font-bold bg-[#1a1a1a]"
                    value={squad.captain ? squad.captain.id : ""}
                    onChange={(e) => setCaptain(e.target.value)}
                  >
                    {squad.starting_eleven.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--text-secondary)]">Your captain's points are doubled.</p>
                </div>

                <div className="glass-card mt-auto border-t-4 border-[var(--accent-primary)]">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[var(--text-secondary)]">Formation:</span>
                    <span className="font-black text-white text-lg">
                      {squad.starting_eleven.filter(p => p.position === 'DEF').length}-
                      {squad.starting_eleven.filter(p => p.position === 'MID').length}-
                      {squad.starting_eleven.filter(p => p.position === 'FWD').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[var(--text-secondary)]">Total Cost:</span>
                    <span className="font-bold text-[var(--text-secondary)]">£{squad.total_cost.toFixed(1)}m</span>
                  </div>
                  <div className="flex justify-between items-end mt-6">
                    <span className="font-bold text-[var(--text-secondary)]">Projected Pts</span>
                    <span className="font-black text-4xl text-[var(--accent-primary)]">{squad.total_expected_points.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-end mt-4 border-t border-[var(--border-color)] pt-4">
                    <span className="font-bold text-white">LIVE MATCHWEEK PTS</span>
                    <span className="font-black text-4xl text-green-400 animate-pulse">
                      {squad.starting_eleven.reduce((acc, p) => {
                        let pts = p.live_points || 0;
                        if (squad.captain && squad.captain.id === p.id) pts *= 2;
                        return acc + pts;
                      }, 0)}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    onClick={fetchPunditReport}
                    disabled={reportLoading}
                    className="w-full btn-secondary bg-blue-900/40 hover:bg-blue-800/40 border-blue-500 py-3"
                  >
                    {reportLoading ? "Analyzing League..." : "🎙️ Generate Pundit Report"}
                  </button>
                  {punditReport && (
                    <div className="mt-4 p-4 glass-card bg-black/40 border-l-4 border-l-blue-500 text-sm italic text-gray-300">
                      {punditReport}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* Leagues */}
      {!loading && activeTab === "leagues" && (
        <FPLLeagues session={session} />
      )}

      {/* Chat */}
      {!loading && activeTab === "chat" && (
        <FPLChat session={session} />
      )}
    </div>
  );
}
