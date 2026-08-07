"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/app/context/AppContext";

const API_URL = "http://localhost:8000";

const PACKS = [
  { id: "bronze", name: "Bronze Pack", price: 5.0, icon: "🥉", desc: "1 Card (Guarantees at least Bronze)" },
  { id: "silver", name: "Silver Pack", price: 20.0, icon: "🥈", desc: "1 Card (Guarantees at least Silver)" },
  { id: "gold", name: "Gold Pack", price: 100.0, icon: "🥇", desc: "1 Card (Guarantees at least Gold)" },
  { id: "icon", name: "Icon Pack", price: 500.0, icon: "💎", desc: "1 Card (Guarantees Icon player)" },
];

export default function PackStorePage() {
  const { user, aiCoins, deductCoins, syncGameState } = useAppContext();
  const [pulledCards, setPulledCards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [packStage, setPackStage] = useState(0); // 0 = store, 1 = suspense, 2 = walkout, 3 = reveal
  const [walkoutMsg, setWalkoutMsg] = useState("");
  const [flippedCards, setFlippedCards] = useState({});

  const openPack = async (pack) => {
    if (!deductCoins(pack.price)) {
      alert("Insufficient funds! Win more coins in the Virtual Hub or claim Daily Rewards.");
      return;
    }

    setLoading(true);
    setPulledCards(null);
    setPackStage(1); // Suspense
    setFlippedCards({});

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
      
      const club = JSON.parse(localStorage.getItem('ut_club') || '[]');
      const newClub = [...club, ...cards];
      localStorage.setItem('ut_club', JSON.stringify(newClub));
      if (user) syncGameState('ut_club', newClub);

      setTimeout(() => {
        if (hasIcon || hasGold) {
          setPackStage(2); // Walkout
          setWalkoutMsg(hasIcon ? "✨ ICON WALKOUT ✨" : "⭐ GOLD WALKOUT ⭐");
          setTimeout(() => {
            setPulledCards(cards);
            setPackStage(3); // Reveal
            setLoading(false);
          }, 3500);
        } else {
          setPulledCards(cards);
          setPackStage(3); // Reveal
          setLoading(false);
        }
      }, 2500); // Suspense duration
      
    } catch (err) {
      console.error(err);
      setLoading(false);
      setPackStage(0);
    }
  };

  const flipCard = (idx) => {
    setFlippedCards(prev => ({ ...prev, [idx]: true }));
  };

  const getBgImage = (rarity) => {
    switch(rarity) {
      case 'Icon': return 'url(/card_icon.png)';
      case 'Gold': return 'url(/card_gold.png)';
      case 'Silver': return 'url(/card_silver.png)';
      case 'Bronze': return 'url(/card_bronze.png)';
      default: return 'url(/card_bronze.png)';
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto min-h-[80vh] relative">
      
      {packStage === 0 && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              🎴 Ultimate Team Store
            </h1>
            <p className="text-[var(--text-secondary)] mb-4">
              Spend your Sportsbook winnings on packs. Build your ultimate squad!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/dashboard/ut/club" className="btn-secondary px-6">My Club 🏟️</Link>
              <Link href="/dashboard/ut/squad" className="btn-secondary px-6 bg-green-900/40 hover:bg-green-800/40 border-green-500">Squad Builder 📋</Link>
              <Link href="/dashboard/ut/market" className="btn-secondary px-6 bg-blue-900/40 hover:bg-blue-800/40 border-blue-500">Transfer Market 💸</Link>
              <Link href="/dashboard/ut/evolutions" className="btn-secondary px-6 bg-purple-900/40 hover:bg-purple-800/40 border-purple-500">Evolutions 🧬</Link>
              <Link href="/dashboard/ut/sbc" className="btn-secondary px-6 bg-orange-900/40 hover:bg-orange-800/40 border-orange-500">SBCs 🧩</Link>
            </div>
          </div>
          
          <div className="mb-12">
            <Link href="/dashboard/ut/battle" className="block w-full">
              <div className="bg-gradient-to-r from-red-900/60 to-purple-900/60 border-2 border-red-500 rounded-2xl p-8 text-center hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400 mb-2">⚔️ Enter the Card Battle Arena! ⚔️</h2>
                <p className="text-white text-lg font-bold">Play your Squad against the AI in a Top Trumps style TCG mini-game to win Coins!</p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {PACKS.map(pack => (
              <div key={pack.id} className="glass-card text-center hover:-translate-y-2 transition-transform cursor-pointer overflow-hidden relative group">
                <div className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-80 transition-opacity" style={{backgroundImage: 'url(/ut_pack.png)'}}></div>
                <div className="relative z-10 p-4">
                  <div className="text-5xl mb-4 drop-shadow-xl">{pack.icon}</div>
                  <h3 className="font-bold text-lg mb-1 drop-shadow-md text-white">{pack.name}</h3>
                  <p className="text-xs text-white/80 mb-4 font-bold">{pack.desc}</p>
                  <button 
                    disabled={loading}
                    onClick={() => openPack(pack)}
                    className="btn-primary w-full py-2 flex items-center justify-center gap-2 font-black shadow-xl"
                  >
                    <span>💳</span> ${pack.price}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Suspense Phase */}
      {packStage === 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="w-64 h-96 rounded-2xl animate-pack-shake shadow-[0_0_100px_rgba(255,215,0,0.5)] bg-cover bg-center relative" style={{backgroundImage: 'url(/ut_pack.png)'}}>
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl"></div>
          </div>
          <h2 className="absolute bottom-20 text-3xl font-black text-yellow-400 animate-pulse tracking-widest">OPENING...</h2>
        </div>
      )}

      {/* Walkout Phase */}
      {packStage === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent animate-walkout-glow"></div>
          <div className="absolute top-1/2 left-0 w-full h-32 bg-white/10 blur-3xl -translate-y-1/2 animate-pulse"></div>
          <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-500 drop-shadow-[0_0_30px_rgba(253,224,71,0.8)] animate-bounce relative z-10 text-center tracking-widest">
            {walkoutMsg}
          </h2>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
            <div className="w-4 h-4 rounded-full bg-white animate-ping"></div>
            <div className="w-4 h-4 rounded-full bg-yellow-300 animate-ping delay-100"></div>
            <div className="w-4 h-4 rounded-full bg-white animate-ping delay-200"></div>
          </div>
        </div>
      )}

      {/* Reveal Phase */}
      {packStage === 3 && pulledCards && (
        <div className="text-center animate-fade-in flex flex-col items-center mt-10">
          <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 drop-shadow-md">PACK OPENED!</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-8 font-bold">These players have been sent to your Club.</p>
          
          <div className="flex flex-wrap justify-center gap-6">
            {pulledCards.map((card, idx) => {
              const isFlipped = flippedCards[idx];
              const stats = card.stats || {PAC: 70, SHO: 70, PAS: 70, DRI: 70, DEF: 70, PHY: 70};
              
              return (
                <div key={idx} 
                  className="w-56 aspect-[2/3] perspective-1000 cursor-pointer"
                  onClick={() => flipCard(idx)}
                >
                  <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* Card Back (Click to reveal) */}
                    <div className="absolute inset-0 backface-hidden rounded-xl shadow-2xl bg-cover bg-center border-4 border-black/50 hover:scale-105 transition-transform" 
                         style={{backgroundImage: 'url(/ut_pack.png)'}}>
                      <div className="w-full h-full flex items-center justify-center bg-black/40 rounded-lg">
                        <span className="text-white font-black text-2xl drop-shadow-md">?</span>
                      </div>
                    </div>

                    {/* Card Front (Revealed) */}
                    <div className="absolute inset-0 backface-hidden rounded-xl shadow-2xl bg-cover bg-center rotate-y-180 p-3 flex flex-col items-center border border-white/20"
                         style={{backgroundImage: getBgImage(card.rarity)}}>
                      
                      <div className="w-full flex justify-between items-start text-black">
                        <div className="flex flex-col items-center drop-shadow-md">
                          <span className="text-3xl font-black leading-none">{card.rating}</span>
                          <span className="font-bold text-xs">{card.position}</span>
                        </div>
                        <div className="flex flex-col items-end opacity-80 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-black/10 px-1 rounded">{card.rarity}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full flex flex-col items-center justify-center text-black drop-shadow-md">
                        <div className="text-5xl mb-1">👤</div>
                        <div className="text-xl font-black uppercase text-center leading-tight tracking-tight px-2">{card.name}</div>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="w-full grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] font-black text-black/90 border-t border-black/20 pt-2 mb-2 drop-shadow-sm">
                        <div className="flex justify-between"><span>{stats.PAC}</span><span>PAC</span></div>
                        <div className="flex justify-between"><span>{stats.DRI}</span><span>DRI</span></div>
                        <div className="flex justify-between"><span>{stats.SHO}</span><span>SHO</span></div>
                        <div className="flex justify-between"><span>{stats.DEF}</span><span>DEF</span></div>
                        <div className="flex justify-between"><span>{stats.PAS}</span><span>PAS</span></div>
                        <div className="flex justify-between"><span>{stats.PHY}</span><span>PHY</span></div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-12">
            <button onClick={() => setPackStage(0)} className="btn-primary px-12 py-4 text-xl font-black rounded-xl shadow-[0_0_20px_rgba(0,212,170,0.4)] hover:scale-105 transition-transform">
              Open Another Pack
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
