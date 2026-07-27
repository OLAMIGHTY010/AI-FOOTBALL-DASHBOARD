"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const FORMATION = [
  { id: 0, pos: "FWD", top: "15%", left: "35%" },
  { id: 1, pos: "FWD", top: "15%", left: "65%" },
  { id: 2, pos: "MID", top: "40%", left: "15%" },
  { id: 3, pos: "MID", top: "40%", left: "38%" },
  { id: 4, pos: "MID", top: "40%", left: "62%" },
  { id: 5, pos: "MID", top: "40%", left: "85%" },
  { id: 6, pos: "DEF", top: "70%", left: "15%" },
  { id: 7, pos: "DEF", top: "70%", left: "38%" },
  { id: 8, pos: "DEF", top: "70%", left: "62%" },
  { id: 9, pos: "DEF", top: "70%", left: "85%" },
  { id: 10, pos: "GK", top: "90%", left: "50%" }
];

export default function SquadBuilderPage() {
  const [club, setClub] = useState([]);
  const [squad, setSquad] = useState(Array(11).fill(null));
  const [activeSlot, setActiveSlot] = useState(null);

  useEffect(() => {
    setClub(JSON.parse(localStorage.getItem("my_club") || "[]"));
    const savedSquad = JSON.parse(localStorage.getItem("my_squad") || "null");
    if (savedSquad && savedSquad.length === 11) {
      setSquad(savedSquad);
    }
  }, []);

  const saveSquad = (newSquad) => {
    setSquad(newSquad);
    localStorage.setItem("my_squad", JSON.stringify(newSquad));
  };

  const handleSlotClick = (index) => {
    setActiveSlot(index);
  };

  const handlePlayerSelect = (player) => {
    if (activeSlot === null) return;
    
    const alreadyInSquad = squad.some(p => p && p.id === player.id);
    if (alreadyInSquad) {
      alert("This player is already in your starting 11!");
      return;
    }

    const newSquad = [...squad];
    newSquad[activeSlot] = player;
    saveSquad(newSquad);
    setActiveSlot(null);
  };

  const handleRemovePlayer = (e, index) => {
    e.stopPropagation();
    const newSquad = [...squad];
    newSquad[index] = null;
    saveSquad(newSquad);
  };

  const validPlayers = squad.filter(p => p !== null);
  const totalRating = validPlayers.reduce((acc, p) => acc + p.rating, 0);
  const teamRating = validPlayers.length > 0 ? Math.round(totalRating / validPlayers.length) : 0;
  const isComplete = validPlayers.length === 11;

  const availablePlayers = activeSlot !== null 
    ? club.filter(p => p.position === FORMATION[activeSlot].pos)
    : [];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">📋 Squad Builder</h1>
            <p className="text-[var(--text-secondary)]">Construct your Starting 11 (4-4-2).</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard/ut/club" className="btn-secondary">My Club</Link>
            <Link href="/dashboard/ut/play" className={`btn-primary ${!isComplete ? 'opacity-50 pointer-events-none' : ''}`}>
              Play Match 🏟️
            </Link>
          </div>
        </div>

        {/* Pitch UI */}
        <div className="relative w-full aspect-[2/3] max-w-[500px] mx-auto bg-gradient-to-b from-[#1b4d2e] via-[#225c38] to-[#1b4d2e] rounded-xl border-4 border-white/20 overflow-hidden shadow-2xl">
          {/* Pitch Markings */}
          <div className="absolute inset-4 border-2 border-white/30 pointer-events-none"></div>
          <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-white/30 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full pointer-events-none"></div>
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-1/6 border-2 border-t-0 border-white/30 pointer-events-none"></div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-1/6 border-2 border-b-0 border-white/30 pointer-events-none"></div>

          {/* Slots */}
          {FORMATION.map((slot, i) => {
            const player = squad[i];
            const isActive = activeSlot === i;
            
            return (
              <div 
                key={i}
                onClick={() => handleSlotClick(i)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-[80px] h-[110px] sm:w-[100px] sm:h-[140px] cursor-pointer transition-all z-10
                  ${isActive ? 'scale-110 z-20' : 'hover:scale-105'}
                `}
                style={{ top: slot.top, left: slot.left }}
              >
                {player ? (
                  <div className={`w-full h-full rounded flex flex-col justify-between p-1.5 shadow-lg border-2
                    ${player.rarity === 'Icon' ? 'bg-gradient-to-b from-gray-200 to-gray-400 border-white text-black' :
                      player.rarity === 'Gold' ? 'bg-gradient-to-b from-yellow-300 to-yellow-600 border-yellow-200 text-black' :
                      player.rarity === 'Silver' ? 'bg-gradient-to-b from-gray-300 to-gray-500 border-gray-100 text-black' :
                      'bg-gradient-to-b from-orange-300 to-orange-500 border-orange-200 text-black'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-black text-sm sm:text-lg">{player.rating}</span>
                      <button onClick={(e) => handleRemovePlayer(e, i)} className="text-red-600 hover:text-red-800 text-xs font-black bg-white/50 rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center -mr-1 -mt-1">×</button>
                    </div>
                    <div className="text-center w-full">
                      <div className="text-xs sm:text-sm font-black truncate">{player.name}</div>
                      <div className="text-[8px] sm:text-[10px] font-bold opacity-80">{player.position}</div>
                    </div>
                  </div>
                ) : (
                  <div className={`w-full h-full rounded flex items-center justify-center border-2 border-dashed
                    ${isActive ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'border-white/30 bg-black/20 text-white/50 hover:border-white/60 hover:text-white'}
                  `}>
                    <div className="text-center font-bold">
                      <div className="text-2xl">+</div>
                      <div className="text-xs">{slot.pos}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
        <div className="glass-card !p-6 text-center">
          <h3 className="font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Team Rating</h3>
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400">
            {teamRating}
          </div>
          <div className="mt-4 text-sm font-bold">
            {isComplete ? (
              <span className="text-green-400">✅ Squad Complete! Ready to play.</span>
            ) : (
              <span className="text-yellow-400">⚠️ {11 - validPlayers.length} spots remaining.</span>
            )}
          </div>
        </div>

        {activeSlot !== null && (
          <div className="glass-card animate-fade-in max-h-[500px] flex flex-col">
            <h3 className="font-bold border-b border-[var(--border-color)] pb-3 mb-3">
              Select {FORMATION[activeSlot].pos}
            </h3>
            
            <div className="overflow-y-auto space-y-2 pr-2">
              {availablePlayers.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                  No {FORMATION[activeSlot].pos} players in your club. <br/><br/>
                  <Link href="/dashboard/ut" className="text-[var(--accent-primary)] underline">Open Packs</Link>
                </p>
              ) : (
                availablePlayers.map((p, idx) => {
                  const isInSquad = squad.some(sp => sp && sp.id === p.id);
                  return (
                    <div 
                      key={idx}
                      onClick={() => !isInSquad && handlePlayerSelect(p)}
                      className={`p-2 rounded border transition-colors flex justify-between items-center
                        ${isInSquad 
                          ? 'border-[var(--border-color)] opacity-50 bg-black/20 cursor-not-allowed' 
                          : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] cursor-pointer'
                        }`}
                    >
                      <div>
                        <div className="font-bold text-sm">{p.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{p.rarity}</div>
                      </div>
                      <div className={`font-black text-lg
                        ${p.rarity === 'Icon' ? 'text-white' : p.rarity === 'Gold' ? 'text-yellow-400' : p.rarity === 'Silver' ? 'text-gray-300' : 'text-orange-400'}
                      `}>
                        {p.rating}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <button onClick={() => setActiveSlot(null)} className="btn-secondary w-full mt-4 text-xs">
              Cancel Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
