"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import FPLChat from "./components/FPLChat";
import FPLLeagues from "./components/FPLLeagues";
import FPLTransfers from "./components/FPLTransfers";
import FPLLive from "./components/FPLLive";
import PlayerProfileModal from "./components/PlayerProfileModal";

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
  
  const [activeChip, setActiveChip] = useState(null);
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState(null);
  
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  
  // Database filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  
  // Squad and Team state
  const [squad, setSquad] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [punditReport, setPunditReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const fetchTeamData = async (currentSession) => {
    if (competition === "epl" && currentSession) {
      try {
        const headers = { "Authorization": `Bearer ${currentSession.access_token}` };
        const teamRes = await fetch(`${API_URL}/api/v1/team/me`, { headers });
        if (teamRes.ok) {
          const tData = await teamRes.json();
          setTeamData(tData);
          setBudget(tData.bank_balance);
          
          const squadRes = await fetch(`${API_URL}/api/v1/team/${tData.id}/squad/1`, { headers });
          if (squadRes.ok) {
            const sData = await squadRes.json();
            if (sData.snapshot) {
              setActiveChip(sData.snapshot.active_chip);
            }
            if (sData.picks && sData.picks.length === 15) {
              const starters = sData.picks.filter(p => p.position_order <= 11).map(p => ({
                ...p.players,
                is_captain: p.is_captain,
                is_vice_captain: p.is_vice_captain
              }));
              const bench = sData.picks.filter(p => p.position_order > 11).map(p => ({
                ...p.players,
                is_captain: p.is_captain,
                is_vice_captain: p.is_vice_captain
              }));
              const cap = starters.find(p => p.is_captain) || starters[0];
              const vice = starters.find(p => p.is_vice_captain) || starters[1];
              
              setSquad({
                starting_eleven: starters,
                bench: bench,
                captain: cap,
                vice_captain: vice,
                total_expected_points: 0
              });
              return;
            }
          }
        } else if (teamRes.status === 404) {
          setNeedsOnboarding(true);
          return;
        }
      } catch (err) {
        console.error("Failed to load from DB", err);
      }
    }
    setSquad(JSON.parse(localStorage.getItem(`fpl_squad_${competition}`) || "null"));
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
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
      
      await fetchTeamData(session);
    };
    
    init();
  }, [competition]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setSaving(true);
    try {
      const headers = { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      };
      const res = await fetch(`${API_URL}/api/v1/team/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({ team_name: newTeamName })
      });
      const data = await res.json();
      if (res.ok) {
        setTeamData(data);
        setNeedsOnboarding(false);
        alert("Team created successfully! Now use the AI Optimizer or search players to build your squad.");
      } else {
        alert("Failed to create team: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      alert("Error creating team.");
    }
    setSaving(false);
  };

  const saveSquadLocally = async (newSquad) => {
    setSquad(newSquad);
    localStorage.setItem(`fpl_squad_${competition}`, JSON.stringify(newSquad));
    // Kept local storage as a cache
  };

  const saveLineupToDb = async () => {
    if (!squad) return;
    setSaving(true);
    try {
      // Map squad to DB picks format
      let picks = [];
      squad.starting_eleven.forEach((p, index) => {
        picks.push({
          player_id: p.id,
          position_order: index + 1,
          is_captain: squad.captain?.id === p.id,
          is_vice_captain: squad.vice_captain?.id === p.id
        });
      });
      squad.bench.forEach((p, index) => {
        picks.push({
          player_id: p.id,
          position_order: 12 + index,
          is_captain: false,
          is_vice_captain: false
        });
      });

      const payload = {
        gameweek_id: 1,
        picks: picks
      };

      const headers = { 
        "Content-Type": "application/json" 
      };
      
      if (session) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      const targetTeamId = teamData ? teamData.id : 1;

      const res = await fetch(`${API_URL}/api/v1/team/${targetTeamId}/lineup`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Lineup successfully saved to Database!");
      } else {
        alert("Failed to save: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving lineup to DB.");
    }
    setSaving(false);
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

  const playChip = async (chipName) => {
    if (!session || !teamData) return;
    if (!confirm(`Are you sure you want to activate ${chipName}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/team/${teamData.id}/activate-chip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ gameweek_id: 1, chip_name: chipName })
      });
      if (res.ok) {
        alert(chipName + " Activated!");
        fetchTeamData(session);
      } else {
        const d = await res.json();
        alert("Failed to activate chip: " + d.detail);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayerClick = (playerId) => {
    if (selectedPlayerId === null) {
      setSelectedPlayerId(playerId);
    } else {
      if (selectedPlayerId !== playerId) {
        performSwap(selectedPlayerId, playerId);
      }
      setSelectedPlayerId(null);
    }
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

    if (!p1 || !p2) return;

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
    const isSelected = selectedPlayerId === p.id;
    return (
      <div 
        key={p.id} 
        draggable={true}
        onDragStart={(e) => handleDragStart(e, p, isStarter)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, p, isStarter)}
        onClick={() => handlePlayerClick(p.id)}
        className={`relative flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 mx-1 ${isSelected ? 'ring-4 ring-yellow-400 rounded-lg scale-110 z-30' : ''}`}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setSelectedProfilePlayer(p); }}
          className="absolute -top-2 -left-2 w-5 h-5 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center z-40 shadow-lg hover:bg-blue-400"
          title="View Player Profile"
        >
          i
        </button>
        <img 
          src={p.photo || "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"}
          alt={p.name}
          className="w-14 h-16 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] z-10 object-contain"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"; }}
        />
        <div className="bg-[#37003c] rounded-t w-full px-1 py-0.5 text-center mt-1 z-20">
          <div className="text-[10px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis w-full flex items-center justify-center gap-1">
            {p.name.split(' ').pop()} 
            {isCaptain && (
              <span className={`w-3 h-3 rounded-full flex items-center justify-center font-black text-[7px] ${activeChip === "TRIPLE_CAPTAIN" ? "bg-purple-500 text-white" : "bg-white text-[#37003c]"}`}>
                {activeChip === "TRIPLE_CAPTAIN" ? "TC" : "C"}
              </span>
            )}
          </div>
        </div>
        <div className="bg-[#00ff87] rounded-b w-full px-1 py-0.5 text-center text-[#37003c] z-20 shadow-lg">
          <div className="text-[9px] font-bold">{p.team} (H)</div>
        </div>
      </div>
    );
  };

  if (needsOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold mb-2">Welcome to FPL Dashboard!</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            It looks like you don't have a virtual team set up yet. What would you like to call your squad?
          </p>
          <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="e.g. AFC Richmond"
              className="input-field py-3 text-center text-lg"
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary py-3 font-bold text-lg rounded-xl"
            >
              {saving ? "Creating..." : "Create My Team"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12 relative">
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

      {/* Top Nav */}
      <div className="flex flex-wrap gap-2 mb-8 glass-card p-2 rounded-xl sticky top-2 z-50 shadow-lg border border-[var(--border-color)]">
        <button onClick={() => setActiveTab("transfers")} className={`px-4 py-2 rounded font-bold transition-colors ${activeTab === 'transfers' ? 'bg-[var(--accent-primary)] text-black' : 'bg-[var(--bg-card)] hover:bg-white/5'}`}>
          🔄 Transfers
        </button>
        <button onClick={() => setActiveTab("live")} className={`px-4 py-2 rounded font-bold transition-colors ${activeTab === 'live' ? 'bg-red-500 text-white' : 'bg-[var(--bg-card)] hover:bg-white/5'}`}>
          📡 Live
        </button>
        <button onClick={() => setActiveTab("ai")} className={`px-4 py-2 rounded font-bold transition-colors ${activeTab === 'ai' ? 'bg-[var(--accent-primary)] text-black' : 'bg-[var(--bg-card)] hover:bg-white/5'}`}>
          🤖 AI Optimizer
        </button>
        <button onClick={() => setActiveTab("team")} className={`px-4 py-2 rounded font-bold ${activeTab === 'team' ? 'bg-[var(--accent-primary)] text-black' : 'bg-[var(--bg-card)]'}`}>
          👔 My Team
        </button>
        <button onClick={() => setActiveTab("leagues")} className={`px-4 py-2 rounded font-bold ${activeTab === 'leagues' ? 'bg-[var(--accent-primary)] text-black' : 'bg-[var(--bg-card)]'}`}>
          🏆 Leagues
        </button>
        <button onClick={() => setActiveTab("chat")} className={`px-4 py-2 rounded font-bold ${activeTab === 'chat' ? 'bg-[var(--accent-primary)] text-black' : 'bg-[var(--bg-card)]'}`}>
          💬 AI Chat
        </button>
      </div>

      {loading && <div className="text-center p-12 text-[var(--accent-primary)] animate-pulse">Loading Live Data...</div>}

      {/* Transfers / Database */}
      {!loading && activeTab === "transfers" && (
        <FPLTransfers 
          squad={squad}
          teamData={teamData}
          session={session}
          players={players}
          activeChip={activeChip}
          onTransfersComplete={() => fetchTeamData(session)}
        />
      )}

      {/* Live */}
      {!loading && activeTab === "live" && (
        <FPLLive 
          squad={squad}
          teamData={teamData}
          session={session}
          activeChip={activeChip}
        />
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
                max="150.0"
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

                {/* Click to Swap Hint */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full font-bold text-xs shadow-lg z-20 border border-white/20 pointer-events-none">
                  🖱️ Click players to swap them
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

                <div className="glass-card mb-4">
                  <h2 className="font-bold text-lg border-b border-[var(--border-color)] pb-2 mb-4">Power-Ups</h2>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => playChip("TRIPLE_CAPTAIN")}
                      disabled={activeChip === "TRIPLE_CAPTAIN"}
                      className={`w-full py-2 text-xs font-bold rounded transition-colors ${activeChip === "TRIPLE_CAPTAIN" ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-white/5'}`}
                    >
                      {activeChip === "TRIPLE_CAPTAIN" ? "★ Triple Captain Active" : "Play Triple Captain"}
                    </button>
                    <button 
                      onClick={() => playChip("BENCH_BOOST")}
                      disabled={activeChip === "BENCH_BOOST"}
                      className={`w-full py-2 text-xs font-bold rounded transition-colors ${activeChip === "BENCH_BOOST" ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-white/5'}`}
                    >
                      {activeChip === "BENCH_BOOST" ? "★ Bench Boost Active" : "Play Bench Boost"}
                    </button>
                  </div>
                </div>

                <div className="glass-card flex flex-col gap-2">
                   <button 
                     className="btn-primary w-full py-2 font-bold flex items-center justify-center gap-2"
                     onClick={saveLineupToDb}
                     disabled={saving}
                   >
                     {saving ? "⏳ Saving..." : "💾 Save Lineup to Database"}
                   </button>
                   <button className="bg-blue-600 hover:bg-blue-500 text-white w-full py-2 rounded font-bold flex items-center justify-center gap-2 transition-colors">
                     💰 Team Value (£{squad.total_cost ? squad.total_cost.toFixed(1) : "100.0"}m)
                   </button>
                   <button className="bg-purple-600 hover:bg-purple-500 text-white w-full py-2 rounded font-bold flex items-center justify-center gap-2 transition-colors">
                     📅 Gameweek Transfers
                   </button>
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

      {/* Modals */}
      {selectedProfilePlayer && (
        <PlayerProfileModal 
          player={selectedProfilePlayer} 
          session={session} 
          onClose={() => setSelectedProfilePlayer(null)} 
        />
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
