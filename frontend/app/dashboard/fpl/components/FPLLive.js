"use client";
import { useState, useEffect } from "react";
import PlayerProfileModal from "./PlayerProfileModal";

export default function FPLLive({ squad, teamData, session, activeChip }) {
  const [matchup, setMatchup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState(null);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    const fetchMatchup = async () => {
      if (!session || !teamData) return;
      try {
        const res = await fetch(`${API_URL}/api/v1/team/${teamData.id}/h2h-matchup/1`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMatchup(data.matchup);
        }
      } catch (err) {
        console.error("Failed to fetch H2H matchup", err);
      }
      setLoading(false);
    };

    fetchMatchup();
  }, [session, teamData]);

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading live data...</div>;
  }

  if (!squad || !squad.starting_eleven) {
    return (
      <div className="text-center py-12 text-[var(--text-secondary)]">
        No team found for this Gameweek.
      </div>
    );
  }

  const renderPlayerNode = (p, isStarter) => {
    const isCaptain = squad.captain?.id === p.id;
    const isVice = squad.vice_captain?.id === p.id;
    const isBenchBoost = activeChip === "BENCH_BOOST";
    const isTripleCaptain = activeChip === "TRIPLE_CAPTAIN" && isCaptain;
    
    let basePoints = p.total_points || 0; // Using total_points as gameweek_points for prototype
    let multiplier = 1;
    
    if (isStarter || isBenchBoost) {
      if (isCaptain) multiplier = isTripleCaptain ? 3 : 2;
    } else {
      multiplier = 0; // Bench players don't score unless Bench Boost is active
    }
    
    const finalPoints = basePoints * multiplier;

    return (
      <div key={p.id} className={`relative flex flex-col items-center w-16 group ${(!isStarter && !isBenchBoost) ? 'opacity-60' : ''}`}>
        <button 
          onClick={() => setSelectedProfilePlayer(p)}
          className="absolute -top-2 -left-2 w-5 h-5 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center z-40 shadow-lg hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
        
        {/* Points Badge */}
        <div className={`absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold border-2 border-black z-20 ${finalPoints >= 10 ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'bg-white text-black'}`}>
          {finalPoints}
        </div>

        {/* C / TC / V Indicator */}
        {(isCaptain || isVice) && (
          <div className={`absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border border-black z-20 ${isCaptain ? (isTripleCaptain ? "bg-purple-500 text-white" : "bg-black text-white") : "bg-gray-300 text-black"}`}>
            {isCaptain ? (isTripleCaptain ? "TC" : "C") : "V"}
          </div>
        )}

        <div className="bg-[#37003c] rounded-t w-full px-1 py-0.5 text-center mt-1 z-20">
          <div className="text-[10px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis w-full">
            {p.name.split(' ').pop()}
          </div>
        </div>
        <div className="bg-white rounded-b w-full px-1 py-0.5 text-center text-black z-20 shadow-lg border-t border-gray-200">
          <div className="text-[9px] font-bold">{p.team}</div>
        </div>
      </div>
    );
  };

  const fwds = squad.starting_eleven.filter(p => p.position === "FWD");
  const mids = squad.starting_eleven.filter(p => p.position === "MID");
  const defs = squad.starting_eleven.filter(p => p.position === "DEF");
  const gks = squad.starting_eleven.filter(p => p.position === "GK");
  
  // Calculate total live points (including hits)
  // For the prototype, we recalculate it here to match the UI
  let livePoints = 0;
  [...squad.starting_eleven, ...squad.bench].forEach(p => {
    const isStarter = squad.starting_eleven.some(s => s.id === p.id);
    const isBenchBoost = activeChip === "BENCH_BOOST";
    if (isStarter || isBenchBoost) {
      let multiplier = 1;
      if (squad.captain?.id === p.id) {
        multiplier = activeChip === "TRIPLE_CAPTAIN" ? 3 : 2;
      }
      livePoints += (p.total_points || 0) * multiplier;
    }
  });

  return (
    <div className="space-y-6">
      {/* Live Matchup Banner */}
      {matchup && (
        <div className="glass-card bg-gradient-to-r from-[var(--bg-card)] via-[#37003c] to-[var(--bg-card)] border-[#00ff87]/30 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff87] to-transparent"></div>
          <h3 className="text-center text-[var(--accent-primary)] font-bold mb-4 tracking-widest text-sm">LIVE H2H MATCHUP</h3>
          
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex-1 text-center">
              <div className="text-xl font-bold truncate px-4">{matchup.team_a?.name || "Unknown"}</div>
              {matchup.team_a_id === teamData.id && <div className="text-xs text-[var(--accent-primary)] font-bold mt-1">YOU</div>}
            </div>
            
            <div className="flex items-center justify-center gap-4 px-6 shrink-0">
              <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{matchup.live_score_a}</div>
              <div className="text-sm font-bold text-[var(--text-secondary)]">VS</div>
              <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{matchup.live_score_b}</div>
            </div>
            
            <div className="flex-1 text-center">
              <div className="text-xl font-bold truncate px-4">{matchup.team_b?.name || "Unknown"}</div>
              {matchup.team_b_id === teamData.id && <div className="text-xs text-[var(--accent-primary)] font-bold mt-1">YOU</div>}
            </div>
          </div>
        </div>
      )}

      {/* Gameweek Summary Header */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="glass-card p-4 flex-1 flex flex-col justify-center items-center">
          <div className="text-sm text-[var(--text-secondary)]">Gameweek Points</div>
          <div className="text-4xl font-black text-[var(--accent-primary)] drop-shadow-[0_0_15px_rgba(0,255,135,0.4)]">{livePoints}</div>
        </div>
        <div className="glass-card p-4 flex-1 flex flex-col justify-center items-center">
          <div className="text-sm text-[var(--text-secondary)]">Active Chip</div>
          <div className="text-xl font-bold mt-1 text-white">
            {activeChip === "WILDCARD" && "★ Wildcard"}
            {activeChip === "FREE_HIT" && "★ Free Hit"}
            {activeChip === "TRIPLE_CAPTAIN" && "★ Triple Captain"}
            {activeChip === "BENCH_BOOST" && "★ Bench Boost"}
            {!activeChip && "None"}
          </div>
        </div>
        <div className="glass-card p-4 flex-1 flex flex-col justify-center items-center">
          <div className="text-sm text-[var(--text-secondary)]">Gameweek Status</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-bold text-red-500">LIVE</span>
          </div>
        </div>
      </div>

      {/* Pitch Area */}
      <div className="glass-card bg-gradient-to-b from-[#1e5c36] to-[#123d21] border-[#2d8a4e] p-4 relative overflow-hidden min-h-[600px] flex flex-col justify-between rounded-xl shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
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
        
        {/* Players */}
        <div className="flex-1 flex flex-col justify-between py-6 relative z-10">
          <div className="w-full flex justify-around">{fwds.map(p => renderPlayerNode(p, true))}</div>
          <div className="w-full flex justify-around">{mids.map(p => renderPlayerNode(p, true))}</div>
          <div className="w-full flex justify-around">{defs.map(p => renderPlayerNode(p, true))}</div>
          <div className="w-full flex justify-around">{gks.map(p => renderPlayerNode(p, true))}</div>
        </div>
      </div>

      {/* Live Bench */}
      <div className="glass-card">
        <h2 className="font-bold text-lg border-b border-[var(--border-color)] pb-2 mb-4">Substitutes</h2>
        <div className={`flex flex-wrap justify-center gap-6 p-4 rounded-xl shadow-inner ${activeChip === "BENCH_BOOST" ? "bg-emerald-900/40 border-2 border-emerald-500" : "bg-black/30 border border-white/10"}`}>
          {squad.bench.map(p => renderPlayerNode(p, false))}
        </div>
      </div>

      {selectedProfilePlayer && (
        <PlayerProfileModal 
          player={selectedProfilePlayer} 
          session={session} 
          onClose={() => setSelectedProfilePlayer(null)} 
        />
      )}

    </div>
  );
}
