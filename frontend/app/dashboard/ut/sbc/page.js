"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";

const API_URL = "http://localhost:8000";

export default function SBCPage() {
  const { user, syncGameState } = useAppContext();
  const [myClub, setMyClub] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const club = JSON.parse(localStorage.getItem('ut_club') || '[]');
    setMyClub(club);
  }, []);

  const togglePlayer = (player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      if (selectedPlayers.length < 11) {
        setSelectedPlayers([...selectedPlayers, player]);
      }
    }
  };

  const avgRating = selectedPlayers.length > 0
    ? (selectedPlayers.reduce((sum, p) => sum + p.rating, 0) / 11).toFixed(1)
    : 0;

  const handleSubmit = async () => {
    if (selectedPlayers.length < 11) {
      setErrorMsg("You must submit exactly 11 players.");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/api/ut/sbc/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: selectedPlayers })
      });
      const data = await res.json();
      
      if (data.success) {
        // Remove submitted players from club
        const usedIds = new Set(selectedPlayers.map(p => p.id));
        const remainingClub = myClub.filter(p => !usedIds.has(p.id));
        
        // Add rewards to club
        const finalClub = [...remainingClub, ...data.reward];
        setMyClub(finalClub);
        localStorage.setItem("ut_club", JSON.stringify(finalClub));
        if (user) syncGameState("ut_club", finalClub);
        
        setReward(data.reward);
        setSelectedPlayers([]);
      } else {
        setErrorMsg(data.error || "SBC Failed to meet requirements.");
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to server.");
      setLoading(false);
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

  if (reward) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center animate-fade-in space-y-6">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">SBC COMPLETED!</h1>
        <p className="text-xl">You received a Gold Reward Pack!</p>
        
        <div className="flex flex-wrap justify-center gap-4 py-8">
          {reward.map((p, i) => (
            <div key={i} className={`w-40 h-56 rounded flex flex-col justify-center items-center shadow-[0_0_30px_rgba(255,215,0,0.4)] border-2 animate-bounce-subtle ${getRarityColor(p.rarity)}`} style={{animationDelay: `${i*100}ms`}}>
              <span className="font-black text-4xl">{p.rating}</span>
              <span className="font-bold text-sm mt-2">{p.name}</span>
              <span className="text-xs mt-1">{p.position}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setReward(null)} className="btn-primary px-8 py-3">Complete Another SBC</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black mb-2">🧩 Squad Building Challenges (SBC)</h1>
          <p className="text-[var(--text-secondary)]">Exchange your unwanted players for packs.</p>
        </div>
        <Link href="/dashboard/ut" className="btn-primary">Back to Hub</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active SBC Requirements */}
        <div className="glass-card p-6 border-[var(--accent-primary)] border-t-4">
          <h2 className="text-xl font-bold mb-4">Gold Upgrade SBC</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">Trade a squad of 11 players for a Gold Pack.</p>
          
          <ul className="space-y-3 mb-6">
            <li className="flex justify-between items-center bg-black/20 p-2 rounded">
              <span>Players in Squad:</span>
              <span className={`font-bold ${selectedPlayers.length === 11 ? 'text-green-400' : 'text-yellow-400'}`}>{selectedPlayers.length} / 11</span>
            </li>
            <li className="flex justify-between items-center bg-black/20 p-2 rounded">
              <span>Min. Team Rating:</span>
              <span className={`font-bold ${parseFloat(avgRating) >= 75 ? 'text-green-400' : 'text-red-400'}`}>{avgRating} / 75.0</span>
            </li>
            <li className="flex justify-between items-center bg-black/20 p-2 rounded">
              <span>Max Players from Same Club:</span>
              <span className="font-bold text-green-400">3</span>
            </li>
          </ul>

          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm font-bold">
              {errorMsg}
            </div>
          )}

          <button 
            onClick={handleSubmit}
            disabled={loading || selectedPlayers.length < 11}
            className={`w-full py-3 rounded font-bold text-lg transition-transform ${selectedPlayers.length === 11 ? 'bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 hover:scale-105 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
          >
            {loading ? "Submitting..." : "Submit Squad"}
          </button>
        </div>

        {/* Squad Selection */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-xl font-bold mb-4 flex justify-between">
            <span>Select Players ({selectedPlayers.length}/11)</span>
          </h2>
          
          <div className="h-[400px] overflow-y-auto border border-[var(--border-color)] bg-black/10 rounded-lg p-2">
            {myClub.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[var(--text-secondary)]">Your club is empty.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {myClub.map(p => {
                  const isSelected = selectedPlayers.find(sp => sp.id === p.id);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => togglePlayer(p)}
                      className={`relative rounded flex flex-col justify-between p-2 cursor-pointer transition-all ${getRarityColor(p.rarity)} ${isSelected ? 'ring-4 ring-[var(--accent-primary)] scale-95 opacity-50' : 'hover:scale-105 shadow-lg'}`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl text-green-400 z-10 drop-shadow-md">✓</div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-black">{p.rating}</span>
                      </div>
                      <div className="text-center mt-2">
                        <div className="font-bold text-xs truncate">{p.name}</div>
                        <div className="text-[10px]">{p.position}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
