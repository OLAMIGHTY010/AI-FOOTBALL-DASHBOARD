"use client";
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../../../context/AppContext";
import Link from "next/link";

export default function CrashPage() {
  const { user, aiCoins, setAiCoins } = useAppContext();
  const [wager, setWager] = useState(50);
  const [multiplier, setMultiplier] = useState(1.00);
  const [status, setStatus] = useState("idle"); // idle, playing, crashed, cashed_out
  const [crashPoint, setCrashPoint] = useState(null);
  const [error, setError] = useState(null);
  const animationRef = useRef(null);

  const wagerOptions = [10, 50, 100, 500, 1000];

  const handlePlay = async () => {
    if (!user) return setError("Must be logged in.");
    if (aiCoins < wager) return setError("Insufficient aiCoins.");
    
    setError(null);
    setMultiplier(1.00);
    setStatus("playing");
    setCrashPoint(null);

    try {
      const res = await fetch("http://localhost:8000/api/games/crash/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, wager: parseFloat(wager) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setAiCoins(data.new_balance); // Deducted instantly
      setCrashPoint(data.crash_point);
      
      let currentMult = 1.00;
      let startTime = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        
        // Exponential growth (e^0.06t)
        currentMult = Math.exp(elapsed * 0.08);

        if (currentMult >= data.crash_point) {
          setMultiplier(data.crash_point);
          setStatus("crashed");
          return; // Stop animation
        }
        
        setMultiplier(currentMult);
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);

    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const handleCashOut = async () => {
    if (status !== "playing") return;
    cancelAnimationFrame(animationRef.current);
    setStatus("cashed_out");

    try {
      const res = await fetch("http://localhost:8000/api/games/crash/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, wager: parseFloat(wager), multiplier: parseFloat(multiplier.toFixed(2)) })
      });
      const data = await res.json();
      if (res.ok) setAiCoins(data.new_balance);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto font-sans pb-24">
      <Link href="/dashboard/simulate/minigames" className="text-[var(--accent-primary)] font-bold mb-4 inline-block">← Back to Hub</Link>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-blue-400">🚀 Virtual Crash</h1>
        </div>
        <div className="glass-card px-4 py-2 border border-blue-400 text-blue-400 font-black text-xl shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          ₦{aiCoins.toFixed(2)}
        </div>
      </div>

      <div className="glass-card p-8 border border-[var(--border-color)] flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
        {/* Graph background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent"></div>
        
        <div className="z-10 text-center w-full">
          {error && <div className="text-red-500 font-bold mb-4">{error}</div>}
          
          <div className={`text-7xl font-black mb-8 ${
            status === "crashed" ? "text-red-500" :
            status === "cashed_out" ? "text-green-400" : "text-white"
          }`}>
            {multiplier.toFixed(2)}x
          </div>

          {status === "crashed" && <div className="text-red-500 font-bold text-2xl mb-8 uppercase tracking-widest animate-pulse">Crashed!</div>}
          {status === "cashed_out" && <div className="text-green-400 font-bold text-2xl mb-8 uppercase tracking-widest">You Won +₦{(wager * multiplier * 0.9).toFixed(2)}!</div>}
          
          {status === "idle" || status === "crashed" || status === "cashed_out" ? (
            <div className="max-w-md mx-auto">
              <div className="flex gap-2 justify-center mb-4">
                {wagerOptions.map((amt) => (
                  <button key={amt} onClick={() => setWager(amt)} className={`px-4 py-2 rounded font-bold ${wager === amt ? 'bg-blue-500 text-white' : 'bg-black/50 text-gray-400'}`}>
                    ₦{amt}
                  </button>
                ))}
              </div>
              <button onClick={handlePlay} className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-black text-xl rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
                Place Bet
              </button>
            </div>
          ) : (
            <button onClick={handleCashOut} className="w-full max-w-md py-4 bg-green-500 hover:bg-green-400 text-black font-black text-2xl rounded-xl uppercase tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.6)] animate-pulse">
              Cash Out
            </button>
          )}
        </div>
        
        {status === "playing" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
        )}
      </div>
    </div>
  );
}
