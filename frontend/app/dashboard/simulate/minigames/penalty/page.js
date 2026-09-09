"use client";
import { useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import Link from "next/link";

export default function PenaltyPage() {
  const { user, aiCoins, setAiCoins } = useAppContext();
  const [wager, setWager] = useState(50);
  const [status, setStatus] = useState("idle"); // idle, playing
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const wagerOptions = [10, 50, 100, 500, 1000];

  const handleShoot = async (target) => {
    if (!user) return setError("Must be logged in.");
    if (aiCoins < wager) return setError("Insufficient aiCoins.");
    
    setError(null);
    setStatus("playing");
    setResult(null);

    try {
      const res = await fetch("http://localhost:8000/api/games/penalty/shoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, wager: parseFloat(wager), action: target })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      // Fake animation delay
      setTimeout(() => {
        setResult(data);
        setAiCoins(data.new_balance);
        setStatus("idle");
      }, 1500);

    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto font-sans pb-24">
      <Link href="/dashboard/simulate/minigames" className="text-[var(--accent-primary)] font-bold mb-4 inline-block">← Back to Hub</Link>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-green-400">⚽ Penalty Shootout</h1>
        </div>
        <div className="glass-card px-4 py-2 border border-green-400 text-green-400 font-black text-xl shadow-[0_0_15px_rgba(74,222,128,0.3)]">
          ₦{aiCoins.toFixed(2)}
        </div>
      </div>

      <div className="glass-card p-8 border border-[var(--border-color)] flex flex-col items-center min-h-[400px]">
        {error && <div className="text-red-500 font-bold mb-4">{error}</div>}
        
        {/* Wager Selection */}
        <div className="flex gap-2 justify-center mb-8">
          {wagerOptions.map((amt) => (
            <button key={amt} onClick={() => setWager(amt)} className={`px-4 py-2 rounded font-bold ${wager === amt ? 'bg-green-500 text-black' : 'bg-black/50 text-gray-400'}`}>
              ₦{amt}
            </button>
          ))}
        </div>

        {/* Goal UI */}
        <div className="relative w-full max-w-2xl aspect-[2/1] border-8 border-white border-b-0 rounded-t-lg bg-[url('/pitch-bg.jpg')] bg-green-900 bg-cover bg-center overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
          
          {/* Net */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
          
          {/* Goalkeeper (AI) */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-24 bg-yellow-500 rounded-t-xl transition-all duration-500 z-10 ${
            status === 'playing' ? 'animate-bounce' : ''
          }`}></div>

          {/* Targets */}
          {status === "idle" && !result && (
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-4 z-20">
              {['Top Left', 'Top Right', 'Bottom Left', 'Bottom Right'].map((target) => (
                <button
                  key={target}
                  onClick={() => handleShoot(target)}
                  className="bg-white/10 hover:bg-white/30 border-2 border-white/50 border-dashed rounded-xl flex items-center justify-center font-black text-white/50 hover:text-white transition-all hover:scale-[1.02]"
                >
                  {target}
                </button>
              ))}
            </div>
          )}

          {status === "playing" && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="text-4xl animate-spin">⚽</div>
            </div>
          )}

          {result && status === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-40 backdrop-blur-sm">
              <div className={`text-6xl font-black uppercase tracking-widest mb-4 ${result.is_goal ? 'text-green-400' : 'text-red-500'}`}>
                {result.is_goal ? 'GOAL!' : 'SAVED!'}
              </div>
              {result.is_goal && (
                <div className="text-2xl font-bold text-white mb-6">
                  +₦{result.payout.toFixed(2)}
                </div>
              )}
              <button onClick={() => setResult(null)} className="px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-gray-200">
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
