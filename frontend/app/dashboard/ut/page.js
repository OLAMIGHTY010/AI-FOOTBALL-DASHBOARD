"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

const PACKS = [
  { id: "bronze", name: "Bronze Pack", price: 5.0, icon: "🥉", desc: "1 Card (Guarantees at least Bronze)" },
  { id: "silver", name: "Silver Pack", price: 20.0, icon: "🥈", desc: "1 Card (Guarantees at least Silver)" },
  { id: "gold", name: "Gold Pack", price: 100.0, icon: "🥇", desc: "1 Card (Guarantees at least Gold)" },
  { id: "icon", name: "Icon Pack", price: 500.0, icon: "💎", desc: "1 Card (Guarantees Icon player)" },
];

export default function PackStorePage() {
  const [bankroll, setBankroll] = useState(0);
  const [pulledCards, setPulledCards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isWalkout, setIsWalkout] = useState(false);
  const [walkoutMsg, setWalkoutMsg] = useState("");

  useEffect(() => {
    // Read bankroll from local storage for instant sync (set by layout.js)
    setBankroll(parseFloat(localStorage.getItem("bankroll") || "0"));
  }, []);

  const openPack = async (pack) => {
    if (bankroll < pack.price) {
      alert("Insufficient funds! Use the Sportsbook to win more or click the deposit button.");
      return;
    }

    setLoading(true);
    setPulledCards(null);
    setIsWalkout(false);

    // Deduct locally and from Supabase
    const newBankroll = bankroll - pack.price;
    setBankroll(newBankroll);
    localStorage.setItem("bankroll", newBankroll.toString());

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("wallets").update({ balance: newBankroll }).eq("user_id", session.user.id);
    }

    try {
      const res = await fetch(`${API_URL}/api/ut/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_type: pack.id }),
      });
      const data = await res.json();
      
      const cards = data.cards;
      const hasIcon = cards.some(c => c.rarity === 'Icon');
      const hasGold = cards.some(c => c.rarity === 'Gold');
      
      const reveal = () => {
        setPulledCards(cards);
        setLoading(false);
        setIsWalkout(false);
        // Auto-save to Club
        const club = JSON.parse(localStorage.getItem('my_club') || '[]');
        localStorage.setItem('my_club', JSON.stringify([...club, ...cards]));
      };

      if (hasIcon || hasGold) {
        setIsWalkout(true);
        setWalkoutMsg(hasIcon ? "✨ ICON WALKOUT ✨" : "⭐ GOLD WALKOUT ⭐");
        setTimeout(reveal, 3500);
      } else {
        setTimeout(reveal, 1000);
      }
      
    } catch (err) {
      console.error(err);
      setLoading(false);
      setIsWalkout(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
          🎴 Ultimate Team Store
        </h1>
        <p className="text-[var(--text-secondary)] mb-4">
          Spend your Sportsbook winnings on packs. Build your ultimate squad!
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard/ut/club" className="btn-secondary px-6">
            View My Club 🏟️
          </Link>
          <Link href="/dashboard/ut/pvp" className="btn-primary px-6">
            Multiplayer PvP 🌐
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {PACKS.map(pack => (
          <div key={pack.id} className="glass-card text-center hover:-translate-y-2 transition-transform cursor-pointer">
            <div className="text-5xl mb-4">{pack.icon}</div>
            <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{pack.desc}</p>
            <button 
              disabled={loading}
              onClick={() => openPack(pack)}
              className="btn-primary w-full py-2 flex items-center justify-center gap-2 font-bold"
            >
              <span>💳</span> ${pack.price}
            </button>
          </div>
        ))}
      </div>

      {isWalkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--accent-primary)]/20 to-transparent animate-pulse"></div>
          <div className="absolute top-1/2 left-0 w-full h-32 bg-white/10 blur-3xl -translate-y-1/2 animate-pulse"></div>
          <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-500 drop-shadow-[0_0_30px_rgba(253,224,71,0.8)] animate-bounce relative z-10 text-center tracking-widest">
            {walkoutMsg}
          </h2>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
            <div className="w-4 h-4 rounded-full bg-white animate-ping"></div>
            <div className="w-4 h-4 rounded-full bg-white animate-ping delay-100"></div>
            <div className="w-4 h-4 rounded-full bg-white animate-ping delay-200"></div>
          </div>
        </div>
      )}

      {!isWalkout && loading && (
        <div className="text-center animate-pulse">
          <div className="inline-block w-48 h-64 bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] rounded-xl opacity-50 shadow-[0_0_30px_rgba(0,212,170,0.5)]"></div>
          <p className="mt-4 font-bold text-[var(--accent-primary)]">Opening Pack...</p>
        </div>
      )}

      {pulledCards && (
        <div className="text-center animate-fade-in flex flex-col items-center">
          <h2 className="text-2xl font-black mb-2 text-[var(--accent-primary)]">PACK OPENED!</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">These cards have been sent to your Club.</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {pulledCards.map((card, idx) => (
              <div key={idx} className={`w-48 aspect-[2/3] rounded-xl p-3 flex flex-col items-center justify-between shadow-[0_0_20px_rgba(255,255,255,0.1)]
                ${card.rarity === 'Icon' ? 'bg-gradient-to-b from-gray-200 to-gray-500 text-black border-4 border-white' :
                  card.rarity === 'Gold' ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 text-black border-4 border-yellow-300' :
                  card.rarity === 'Silver' ? 'bg-gradient-to-b from-gray-300 to-gray-400 text-black border-4 border-gray-200' :
                  'bg-gradient-to-b from-orange-300 to-orange-500 text-black border-4 border-orange-200'
                }`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="w-full flex justify-between items-start">
                  <div className="text-3xl font-black">{card.rating}</div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{card.position}</div>
                    <div className="text-[10px] font-black uppercase opacity-75">{card.rarity}</div>
                  </div>
                </div>
                
                <div className="text-center w-full">
                  <div className="text-4xl mb-2">⚽</div>
                  <div className="text-lg font-black truncate">{card.name}</div>
                  <div className="text-xs font-semibold opacity-75">{card.team}</div>
                </div>
                
                <div className="w-full grid grid-cols-2 gap-1 text-[10px] font-bold bg-black/20 rounded p-1.5 mt-2">
                  <div>Sell: ${card.sell_value}</div>
                  <div className="text-right">Stat: {card.rating + 10}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <button onClick={() => setPulledCards(null)} className="btn-primary px-12 py-3 text-lg">
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
