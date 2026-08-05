"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";

const API_URL = "http://localhost:8000";

export default function EvolutionsPage() {
  const { aiCoins, deductCoins } = useAppContext();
  const [myClub, setMyClub] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [evolving, setEvolving] = useState(false);

  useEffect(() => {
    const club = JSON.parse(localStorage.getItem('my_club') || '[]');
    setMyClub(club);
  }, []);

  const eligiblePlayers = myClub.filter(p => !p.is_evolved && (p.rarity === 'Bronze' || p.rarity === 'Silver'));

  const handleEvolve = async () => {
    if (!selectedPlayer) return;
    if (aiCoins < 50) {
      alert("Not enough AI Coins to evolve! Requires 50 coins.");
      return;
    }

    setEvolving(true);

    try {
      const res = await fetch(`${API_URL}/api/ut/evolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: selectedPlayer })
      });
      const data = await res.json();
      
      if (data.success) {
        deductCoins(50);
        
        // Update club
        const newClub = myClub.map(p => p.id === selectedPlayer.id ? data.player : p);
        setMyClub(newClub);
        localStorage.setItem("my_club", JSON.stringify(newClub));
        
        setTimeout(() => {
          setSelectedPlayer(data.player); // Show updated player
          setEvolving(false);
          alert("Evolution Complete!");
        }, 2000); // Fake animation delay
      }
    } catch (err) {
      console.error(err);
      setEvolving(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "Icon": return "text-white bg-gradient-to-b from-gray-300 to-gray-500 border-white";
      case "Gold": return "text-yellow-900 bg-gradient-to-b from-yellow-300 to-yellow-600 border-yellow-300";
      case "Silver": return "text-gray-900 bg-gradient-to-b from-gray-300 to-gray-400 border-gray-300";
      case "Bronze": return "text-orange-900 bg-gradient-to-b from-orange-300 to-orange-500 border-orange-300";
      default: return "text-white bg-gray-700 border-gray-600";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-md">🧬 Player Evolutions</h1>
          <p className="text-[var(--text-secondary)]">Upgrade your Bronze and Silver players into Gold superstars!</p>
        </div>
        <Link href="/dashboard/ut" className="btn-primary">Back to Hub</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Selection Area */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Eligible Players</h2>
          <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2">
            {eligiblePlayers.length === 0 ? (
              <p className="text-[var(--text-secondary)]">No eligible Bronze or Silver players found in your club.</p>
            ) : (
              eligiblePlayers.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPlayer(p)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${selectedPlayer?.id === p.id ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/20' : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/50'}`}
                >
                  <div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs opacity-70">{p.rarity} - {p.position}</div>
                  </div>
                  <div className={`font-black text-xl ${p.rarity === 'Silver' ? 'text-gray-300' : 'text-orange-400'}`}>
                    {p.rating}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Evolution Station */}
        <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[400px] relative border-[var(--accent-primary)] border">
          {selectedPlayer ? (
            <div className="text-center w-full">
              <h2 className="text-xl font-bold mb-6">Evolution Preview</h2>
              
              <div className="flex items-center justify-center gap-8 mb-8">
                {/* Current */}
                <div className={`w-32 h-44 rounded flex flex-col justify-center items-center shadow-lg border-2 ${getRarityColor(selectedPlayer.rarity)}`}>
                  <span className="font-black text-4xl">{selectedPlayer.rating}</span>
                  <span className="font-bold text-sm mt-2">{selectedPlayer.name}</span>
                </div>

                {/* Arrow */}
                <div className="text-4xl text-[var(--accent-primary)] animate-pulse">➡️</div>

                {/* Future */}
                <div className={`w-32 h-44 rounded flex flex-col justify-center items-center shadow-[0_0_20px_rgba(0,255,135,0.5)] border-2 ${selectedPlayer.is_evolved ? getRarityColor(selectedPlayer.rarity) : getRarityColor(selectedPlayer.rating + 3 >= 80 ? 'Gold' : selectedPlayer.rarity)} ${evolving ? 'animate-pack-shake' : ''}`}>
                  <span className="font-black text-4xl">{selectedPlayer.is_evolved ? selectedPlayer.rating : selectedPlayer.rating + 3}</span>
                  <span className="font-bold text-sm mt-2">{selectedPlayer.name}{!selectedPlayer.is_evolved && " 🌟"}</span>
                </div>
              </div>

              {!selectedPlayer.is_evolved ? (
                <button 
                  onClick={handleEvolve}
                  disabled={evolving}
                  className="btn-primary w-full max-w-sm mx-auto text-lg py-3 flex items-center justify-center gap-2"
                >
                  {evolving ? "Evolving..." : "Begin Evolution (💳 50 Coins)"}
                </button>
              ) : (
                <div className="text-green-400 font-bold text-xl">Evolution Complete!</div>
              )}
            </div>
          ) : (
            <div className="text-center text-[var(--text-secondary)]">
              <div className="text-6xl mb-4 opacity-20">🧬</div>
              <p>Select a player from the list<br/>to preview their evolution.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
