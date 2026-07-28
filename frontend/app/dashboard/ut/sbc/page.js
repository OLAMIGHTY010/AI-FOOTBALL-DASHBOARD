"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

export default function SBCPage() {
  const [club, setClub] = useState([]);
  const [squad, setSquad] = useState(Array(11).fill(null));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setClub(JSON.parse(localStorage.getItem("my_club") || "[]"));
  }, []);

  const addToSBC = (card, clubIndex) => {
    const emptySlot = squad.findIndex(slot => slot === null);
    if (emptySlot !== -1) {
      const newSquad = [...squad];
      newSquad[emptySlot] = card;
      setSquad(newSquad);
      
      const newClub = [...club];
      newClub.splice(clubIndex, 1);
      setClub(newClub);
    } else {
      alert("SBC Squad is full! Remove a player first.");
    }
  };

  const removeFromSBC = (card, squadIndex) => {
    const newSquad = [...squad];
    newSquad[squadIndex] = null;
    setSquad(newSquad);
    
    setClub([...club, card]);
  };

  const calculateRating = () => {
    const players = squad.filter(p => p !== null);
    if (players.length === 0) return 0;
    const sum = players.reduce((acc, p) => acc + (p.rating || 0), 0);
    return (sum / players.length).toFixed(1);
  };

  const submitSBC = async () => {
    const players = squad.filter(p => p !== null);
    if (players.length < 11) {
      alert("You must submit exactly 11 players.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/ut/sbc/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`SBC Completed! You earned a ${data.pack_name}!`);
        // Save remaining club
        localStorage.setItem("my_club", JSON.stringify(club));
        // Add rewarded cards to club
        const currentClub = JSON.parse(localStorage.getItem("my_club") || "[]");
        localStorage.setItem("my_club", JSON.stringify([...currentClub, ...data.reward]));
        // Clear SBC
        setSquad(Array(11).fill(null));
      } else {
        alert("SBC Failed: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting SBC.");
    }
    setSubmitting(false);
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">🧩 Squad Building Challenges</h1>
          <p className="text-[var(--text-secondary)]">Exchange your unwanted club players for premium packs!</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard/ut" className="btn-secondary">
            ⬅ Back to Store
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* SBC Template Builder */}
        <div className="flex-1 glass-card bg-gradient-to-br from-purple-900/40 to-black p-6 border-purple-500/30">
          <h2 className="text-xl font-bold mb-4 text-purple-300">Gold Upgrade SBC</h2>
          <div className="mb-6 bg-black/40 p-4 rounded text-sm text-[var(--text-secondary)]">
            <p className="mb-1"><strong>Requirements:</strong></p>
            <ul className="list-disc list-inside">
              <li>Exactly 11 Players</li>
              <li>Min. Squad Rating: 75</li>
              <li>Max 3 players from same club</li>
            </ul>
            <p className="mt-2 text-yellow-400 font-bold">Reward: 1x Gold Pack (Guarantees Gold or Icon)</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {squad.map((slot, i) => (
              <div 
                key={i} 
                className={`aspect-[2/3] rounded-lg border-2 border-dashed ${slot ? 'border-transparent' : 'border-purple-500/50 flex flex-col items-center justify-center bg-black/40'}`}
              >
                {slot ? (
                  <div 
                    onClick={() => removeFromSBC(slot, i)}
                    className="w-full h-full cursor-pointer relative group rounded-lg overflow-hidden bg-gradient-to-b from-gray-700 to-gray-900 border border-gray-500 flex flex-col items-center justify-center p-2"
                  >
                    <div className="text-lg font-black text-white">{slot.rating}</div>
                    <div className="text-xs text-yellow-400 font-bold truncate max-w-full">{slot.name}</div>
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="font-bold text-white text-xs">Remove</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-purple-500/50 text-2xl font-black">{i + 1}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-black/60 p-4 rounded-lg">
            <div>
              <div className="text-[var(--text-secondary)] text-sm">Squad Rating</div>
              <div className="text-3xl font-black text-white">{calculateRating()}</div>
            </div>
            <button 
              onClick={submitSBC}
              disabled={submitting}
              className="btn-primary py-3 px-8 text-lg"
            >
              {submitting ? "Submitting..." : "Submit SBC"}
            </button>
          </div>
        </div>

        {/* Club Players Sidebar */}
        <div className="w-full lg:w-80 glass-card">
          <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Your Club</h2>
          <div className="overflow-y-auto max-h-[600px] flex flex-col gap-2 pr-2">
            {club.length === 0 && <p className="text-sm text-[var(--text-secondary)]">No players available.</p>}
            {club.map((card, i) => (
              <div 
                key={i}
                className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5 hover:border-[var(--accent-primary)] transition-colors"
              >
                <div>
                  <span className={`font-black mr-2 ${card.rarity === 'Gold' || card.rarity === 'Icon' ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {card.rating}
                  </span>
                  <span className="font-bold text-sm truncate max-w-[120px] inline-block align-bottom">{card.name}</span>
                </div>
                <button 
                  onClick={() => addToSBC(card, i)}
                  className="bg-[var(--accent-primary)] text-black text-xs font-bold px-2 py-1 rounded"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
