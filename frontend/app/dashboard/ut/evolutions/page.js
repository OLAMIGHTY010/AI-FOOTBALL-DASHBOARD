"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

export default function EvolutionsPage() {
  const [club, setClub] = useState([]);
  const [bankroll, setBankroll] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const EVOLUTION_COST = 50.0;

  useEffect(() => {
    setClub(JSON.parse(localStorage.getItem("my_club") || "[]"));
    setBankroll(parseFloat(localStorage.getItem("bankroll") || "0"));
  }, []);

  const evolvePlayer = async () => {
    if (!selectedPlayer) return;
    if (bankroll < EVOLUTION_COST) {
      alert("Insufficient funds for this Evolution.");
      return;
    }

    setLoading(true);
    
    // Deduct cost
    const newBankroll = bankroll - EVOLUTION_COST;
    setBankroll(newBankroll);
    localStorage.setItem("bankroll", newBankroll.toString());
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("wallets").update({ balance: newBankroll }).eq("user_id", session.user.id);
    }

    try {
      const res = await fetch(`${API_URL}/api/ut/evolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: selectedPlayer })
      });
      const data = await res.json();
      
      if (data.success) {
        // Update club
        const currentClub = JSON.parse(localStorage.getItem("my_club") || "[]");
        // replace the old player instance with the evolved one
        const index = currentClub.findIndex(p => p.name === selectedPlayer.name && p.rating === selectedPlayer.rating);
        if (index > -1) {
          currentClub[index] = data.player;
        } else {
          currentClub.push(data.player);
        }
        
        localStorage.setItem("my_club", JSON.stringify(currentClub));
        setClub(currentClub);
        setSelectedPlayer(data.player);
        alert(`Evolution Complete! ${data.player.name} is now upgraded!`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to evolve player.");
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">🧬 Player Evolutions</h1>
          <p className="text-[var(--text-secondary)]">Permanently upgrade a player's stats by spending bankroll.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-xl font-black text-[var(--accent-primary)]">
            Bank: ${bankroll.toFixed(2)}
          </div>
          <Link href="/dashboard/ut" className="btn-secondary">
            ⬅ Back to Store
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Selection Sidebar */}
        <div className="w-full lg:w-1/3 glass-card">
          <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Select a Player</h2>
          <div className="overflow-y-auto max-h-[600px] flex flex-col gap-2 pr-2">
            {club.filter(p => !p.is_evolved).map((card, i) => (
              <div 
                key={i}
                onClick={() => setSelectedPlayer(card)}
                className={`cursor-pointer flex items-center justify-between p-3 rounded transition-colors ${selectedPlayer === card ? 'bg-[var(--accent-primary)] text-black' : 'bg-black/40 border border-white/5 hover:border-[var(--accent-primary)]'}`}
              >
                <div>
                  <span className="font-black mr-2">{card.rating}</span>
                  <span className="font-bold text-sm truncate max-w-[120px] inline-block align-bottom">{card.name}</span>
                </div>
                <div className="text-xs opacity-70">{card.rarity}</div>
              </div>
            ))}
            {club.length === 0 && <p className="text-[var(--text-secondary)]">Your club is empty.</p>}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 glass-card flex flex-col items-center justify-center p-12 bg-gradient-to-br from-green-900/20 to-black">
          {!selectedPlayer ? (
            <div className="text-center text-[var(--text-secondary)]">
              <div className="text-6xl mb-4">🔬</div>
              <p>Select a player to preview their Evolution.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full max-w-sm">
              <h2 className="text-2xl font-black mb-6 text-green-400">Evolution Preview</h2>
              
              <div className="flex items-center gap-8 mb-8 w-full justify-center">
                
                {/* Current Card */}
                <div className="w-32 aspect-[2/3] rounded-lg bg-gradient-to-b from-gray-700 to-gray-900 border border-gray-500 flex flex-col items-center justify-center p-2 opacity-60">
                  <div className="text-2xl font-black text-white">{selectedPlayer.rating}</div>
                  <div className="text-sm text-yellow-400 font-bold truncate max-w-full">{selectedPlayer.name}</div>
                </div>

                <div className="text-3xl animate-pulse text-green-400">➡</div>

                {/* Evolved Card Preview */}
                <div className="w-40 aspect-[2/3] rounded-lg bg-gradient-to-b from-green-600 to-green-900 border-2 border-green-400 flex flex-col items-center justify-center p-2 shadow-[0_0_20px_rgba(74,222,128,0.5)]">
                  <div className="text-4xl font-black text-white">{selectedPlayer.rating + 3}</div>
                  <div className="text-sm text-yellow-300 font-bold text-center">
                    {selectedPlayer.name} 🌟
                  </div>
                  <div className="mt-2 bg-black/50 px-2 py-1 rounded text-[10px] font-bold text-green-300 uppercase">
                    Evolved
                  </div>
                </div>
              </div>

              <div className="bg-black/60 p-4 rounded w-full mb-6 text-center border border-[var(--border-color)]">
                <div className="text-sm text-[var(--text-secondary)] mb-1">Evolution Cost</div>
                <div className="text-2xl font-black text-red-400">-${EVOLUTION_COST.toFixed(2)}</div>
              </div>

              <button 
                onClick={evolvePlayer}
                disabled={loading || selectedPlayer.is_evolved}
                className="btn-primary w-full py-4 text-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,212,170,0.4)]"
              >
                {loading ? "Evolving..." : "🧬 Confirm Evolution"}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
