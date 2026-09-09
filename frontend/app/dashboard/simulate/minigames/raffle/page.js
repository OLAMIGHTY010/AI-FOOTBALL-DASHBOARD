"use client";
import { useState, useEffect } from "react";
import { useAppContext } from "../../../../context/AppContext";
import VirtualTabs from "../../../components/VirtualTabs";

export default function RafflePage() {
  const { user, aiCoins, setAiCoins } = useAppContext();
  const [wager, setWager] = useState(50);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const wagerOptions = [10, 50, 100, 500, 1000, 5000];

  const handlePlay = async () => {
    if (!user) {
      setError("You must be logged in to play.");
      return;
    }
    if (aiCoins < wager) {
      setError("Insufficient aiCoins balance.");
      return;
    }

    setError(null);
    setResult(null);
    setIsSpinning(true);

    try {
      const res = await fetch("http://localhost:8000/api/games/raffle/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          wager: parseFloat(wager)
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Error playing raffle");
      }

      // Fake delay for animation suspense
      setTimeout(() => {
        setResult(data);
        setAiCoins(data.new_balance);
        setIsSpinning(false);
      }, 2000);

    } catch (err) {
      setError(err.message);
      setIsSpinning(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto font-sans animate-fade-in pb-24">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Virtual Hub</h1>
        <p className="text-[var(--text-secondary)]">Instant Win Tickets. Spin for a chance at a 50x Jackpot!</p>
      </div>

      <VirtualTabs />

      <div className="flex justify-between items-center mb-8 mt-8 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">🎰 Virtual Raffle</h1>
        </div>
        <div className="glass-card px-4 py-2 border border-[var(--accent-primary)] text-[var(--accent-primary)] font-black text-xl shadow-[0_0_15px_rgba(0,255,170,0.3)]">
          ₦{aiCoins.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Ticket Purchasing Section */}
        <div className="glass-card p-8 border border-[var(--border-color)] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

          <h2 className="text-xl font-bold mb-6 text-center uppercase tracking-widest w-full border-b border-[var(--border-color)] pb-4">Select Ticket Value</h2>
          
          <div className="flex flex-wrap gap-3 justify-center mb-8 w-full">
            {wagerOptions.map((amount) => (
              <button
                key={amount}
                onClick={() => setWager(amount)}
                className={`px-4 py-2 rounded-xl font-black text-sm border-2 transition-all ${
                  wager === amount 
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-black shadow-[0_0_15px_rgba(0,255,170,0.5)] transform scale-110" 
                  : "border-gray-700 bg-black/40 text-gray-400 hover:border-gray-500"
                }`}
              >
                ₦{amount}
              </button>
            ))}
          </div>

          <div className="bg-black/50 p-4 rounded-xl border border-white/5 w-full mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[var(--text-secondary)] uppercase font-bold tracking-wider">Ticket Cost</span>
              <span className="text-xl font-black">₦{wager}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)] uppercase font-bold tracking-wider">Max Potential Win (50x)</span>
              <span className="text-xl font-black text-[var(--accent-warning)]">₦{(wager * 50).toLocaleString()}</span>
            </div>
          </div>

          {error && <div className="text-red-500 font-bold mb-4 text-sm bg-red-500/10 p-3 rounded w-full text-center border border-red-500/30">{error}</div>}

          <button 
            onClick={handlePlay}
            disabled={isSpinning || !user}
            className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-[0.2em] transition-all relative overflow-hidden ${
              isSpinning ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-[var(--accent-primary)] to-blue-500 text-black shadow-[0_0_20px_rgba(0,255,170,0.4)] hover:shadow-[0_0_30px_rgba(0,255,170,0.6)] hover:scale-[1.02]'
            }`}
          >
            {isSpinning ? (
              <span className="animate-pulse">Revealing...</span>
            ) : (
              "Buy & Reveal Ticket"
            )}
            
            {/* Shimmer effect */}
            {!isSpinning && (
              <div className="absolute inset-0 -translate-x-full hover:animate-[shimmer_1s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            )}
          </button>
        </div>

        {/* Reveal/Result Section */}
        <div className="glass-card p-8 border border-[var(--border-color)] flex flex-col items-center justify-center min-h-[400px]">
          {isSpinning ? (
            <div className="flex flex-col items-center space-y-6">
              <div className="w-24 h-24 border-8 border-gray-800 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
              <p className="text-xl font-black text-[var(--accent-primary)] uppercase tracking-widest animate-pulse">Scratching Ticket...</p>
            </div>
          ) : result ? (
            <div className={`w-full h-full flex flex-col items-center justify-center p-8 rounded-2xl border-4 ${
              result.tier === "Jackpot" ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_40px_rgba(250,204,21,0.5)]' :
              result.tier === "Big Win" ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_0_30px_rgba(0,255,170,0.3)]' :
              result.tier === "Small Win" ? 'border-blue-400 bg-blue-400/10' :
              'border-gray-800 bg-black/40'
            }`}>
              <div className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">Result</div>
              
              <div className={`text-4xl md:text-5xl font-black uppercase mb-6 text-center tracking-tight ${
                result.tier === "Jackpot" ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' :
                result.tier === "Big Win" ? 'text-[var(--accent-primary)]' :
                result.tier === "Small Win" ? 'text-blue-400' :
                'text-gray-500'
              }`}>
                {result.tier === "Jackpot" && "👑 "}
                {result.tier}
                {result.tier === "Jackpot" && " 👑"}
              </div>

              {result.multiplier > 0 ? (
                <>
                  <div className="text-xl font-black mb-2 text-white bg-white/10 px-4 py-1 rounded-full">
                    {result.multiplier}x Multiplier
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] mb-6 uppercase tracking-widest">
                    (10% House fee applied to profit)
                  </div>
                  <div className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Payout</div>
                  <div className="text-4xl font-black text-green-400">
                    +₦{result.payout.toFixed(2)}
                  </div>
                </>
              ) : (
                <div className="text-xl font-black text-gray-500 mt-4">
                  Better luck next time.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center opacity-50">
              <div className="text-6xl mb-4">🎫</div>
              <h2 className="text-xl font-bold uppercase tracking-widest mb-2">Ticket Ready</h2>
              <p className="text-sm">Select your wager and reveal your ticket to win up to 50x your stake instantly.</p>
            </div>
          )}
        </div>
        
      </div>
      
      {/* Odds Table */}
      <div className="mt-12 glass-card p-6 border border-[var(--border-color)]">
        <h3 className="text-lg font-bold mb-4 uppercase tracking-widest border-b border-gray-800 pb-2">Ticket Odds & Payouts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-yellow-400/10 border border-yellow-400/30 p-4 rounded-xl">
            <div className="text-yellow-400 font-black text-xl mb-1">50x</div>
            <div className="text-xs uppercase font-bold">Jackpot (5%)</div>
          </div>
          <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 p-4 rounded-xl">
            <div className="text-[var(--accent-primary)] font-black text-xl mb-1">5x</div>
            <div className="text-xs uppercase font-bold">Big Win (15%)</div>
          </div>
          <div className="bg-blue-400/10 border border-blue-400/30 p-4 rounded-xl">
            <div className="text-blue-400 font-black text-xl mb-1">1.5x</div>
            <div className="text-xs uppercase font-bold">Small Win (20%)</div>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl">
            <div className="text-gray-500 font-black text-xl mb-1">0x</div>
            <div className="text-xs uppercase font-bold">Loss (60%)</div>
          </div>
        </div>
      </div>

    </div>
  );
}
