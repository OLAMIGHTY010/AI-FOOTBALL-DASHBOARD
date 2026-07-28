"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

export default function MyClubPage() {
  const [club, setClub] = useState([]);

  useEffect(() => {
    setClub(JSON.parse(localStorage.getItem("my_club") || "[]"));
  }, []);

  const sellCard = async (index, value) => {
    // Deduct
    const newClub = [...club];
    newClub.splice(index, 1);
    setClub(newClub);
    localStorage.setItem("my_club", JSON.stringify(newClub));

    // Give money
    let currentBankroll = parseFloat(localStorage.getItem("bankroll") || "0");
    currentBankroll += value;
    localStorage.setItem("bankroll", currentBankroll.toString());

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("wallets").update({ balance: currentBankroll }).eq("user_id", session.user.id);
    }
  };

  const listOnMarket = async (index, card) => {
    const price = prompt(`Enter listing price for ${card.name} (Min $${card.sell_value}):`, (card.sell_value * 2).toString());
    if (!price || isNaN(price)) return;
    const numPrice = parseFloat(price);
    
    const { data: { session } } = await supabase.auth.getSession();
    const seller_id = session ? session.user.id : "guest_" + Math.random().toString(36).substr(2, 9);
    
    try {
      const res = await fetch(`${API_URL}/api/ut/market/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: card, price: numPrice, seller_id })
      });
      const data = await res.json();
      if (data.success) {
        alert("Listed on market!");
        const newClub = [...club];
        newClub.splice(index, 1);
        setClub(newClub);
        localStorage.setItem("my_club", JSON.stringify(newClub));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to list on market");
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">🏟️ My Club</h1>
          <p className="text-[var(--text-secondary)]">View and manage your Ultimate Team players.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/ut/squad" className="btn-primary">
            Squad Builder 📋
          </Link>
          <Link href="/dashboard/ut" className="btn-secondary">
            ⬅ Back to Store
          </Link>
        </div>
      </div>

      {club.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">
          <div className="text-6xl mb-4">🎴</div>
          <p>Your club is empty. Go open some packs!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {club.map((card, index) => (
            <div key={index} className={`relative group w-full aspect-[2/3] rounded-xl p-3 flex flex-col items-center justify-between shadow-[0_4px_15px_rgba(0,0,0,0.3)]
              ${card.rarity === 'Icon' ? 'bg-gradient-to-b from-gray-200 to-gray-500 text-black border-4 border-white' :
                card.rarity === 'Gold' ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 text-black border-4 border-yellow-300' :
                card.rarity === 'Silver' ? 'bg-gradient-to-b from-gray-300 to-gray-400 text-black border-4 border-gray-200' :
                'bg-gradient-to-b from-orange-300 to-orange-500 text-black border-4 border-orange-200'
              }`}
            >
              <div className="w-full flex justify-between items-start">
                <div className="text-2xl font-black">{card.rating}</div>
                <div className="text-right">
                  <div className="font-bold text-sm">{card.position}</div>
                  <div className="text-[10px] opacity-75">{card.rarity}</div>
                </div>
              </div>
              
              <div className="text-center w-full">
                <div className="text-3xl mb-1">⚽</div>
                <div className="text-lg font-black truncate">{card.name}</div>
                <div className="text-xs font-semibold opacity-75">{card.team}</div>
              </div>
              
              {/* Overlay for quick sell & list */}
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <button 
                  onClick={() => listOnMarket(index, card)}
                  className="bg-blue-600 text-white font-bold py-1 px-3 rounded-full text-sm hover:bg-blue-500 w-3/4"
                >
                  List on Market
                </button>
                <button 
                  onClick={() => sellCard(index, card.sell_value)}
                  className="bg-red-500 text-white font-bold py-1 px-3 rounded-full text-sm hover:bg-red-400 w-3/4"
                >
                  Quick Sell (${card.sell_value})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
