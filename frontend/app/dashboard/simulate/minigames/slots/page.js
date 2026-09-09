"use client";
import { useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import Link from "next/link";

export default function SlotsPage() {
  const { user, aiCoins, setAiCoins } = useAppContext();
  const [wager, setWager] = useState(50);
  const [status, setStatus] = useState("idle");
  const [reels, setReels] = useState(["⚽", "⚽", "⚽"]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const wagerOptions = [10, 50, 100, 500, 1000];

  const handleSpin = async () => {
    if (!user) return setError("Must be logged in.");
    if (aiCoins < wager) return setError("Insufficient aiCoins.");
    
    setError(null);
    setStatus("spinning");
    setResult(null);

    // Initial random spin visual effect
    let spinInterval = setInterval(() => {
      const symbols = ["⚽", "🏆", "🟨", "🟥", "👟"];
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
    }, 100);

    try {
      const res = await fetch("http://localhost:8000/api/games/slots/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, wager: parseFloat(wager) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setTimeout(() => {
        clearInterval(spinInterval);
        setReels(data.reels);
        setResult(data);
        setAiCoins(data.new_balance);
        setStatus("idle");
      }, 2000);

    } catch (err) {
      clearInterval(spinInterval);
      setError(err.message);
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto font-sans pb-24">
      <Link href="/dashboard/simulate/minigames" className="text-[var(--accent-primary)] font-bold mb-4 inline-block">← Back to Hub</Link>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-yellow-400">🎰 Football Slots</h1>
        </div>
        <div className="glass-card px-4 py-2 border border-yellow-400 text-yellow-400 font-black text-xl shadow-[0_0_15px_rgba(250,204,21,0.3)]">
          ₦{aiCoins.toFixed(2)}
        </div>
      </div>

      <div className="glass-card p-8 border border-[var(--border-color)] flex flex-col items-center min-h-[400px] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl"></div>

        {error && <div className="text-red-500 font-bold mb-4 z-10">{error}</div>}
        
        <div className="flex gap-2 justify-center mb-8 z-10">
          {wagerOptions.map((amt) => (
            <button key={amt} onClick={() => setWager(amt)} disabled={status === "spinning"} className={`px-4 py-2 rounded font-bold ${wager === amt ? 'bg-yellow-500 text-black' : 'bg-black/50 text-gray-400'}`}>
              ₦{amt}
            </button>
          ))}
        </div>

        {/* Slot Machine */}
        <div className="bg-gradient-to-b from-gray-800 to-black border-4 border-yellow-500 p-8 rounded-3xl shadow-[0_0_50px_rgba(250,204,21,0.2)] mb-8 z-10">
          <div className="flex gap-4 bg-black p-4 rounded-xl shadow-inner">
            {reels.map((symbol, idx) => (
              <div key={idx} className="w-24 h-32 bg-gradient-to-b from-gray-100 to-gray-300 rounded border-2 border-gray-400 flex items-center justify-center text-6xl shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <span className={status === "spinning" ? "animate-pulse" : ""}>{symbol}</span>
              </div>
            ))}
          </div>
        </div>

        {result && status === "idle" && (
          <div className={`text-2xl font-black uppercase tracking-widest mb-6 z-10 ${result.tier !== 'Loss' ? 'text-green-400 animate-bounce' : 'text-gray-500'}`}>
            {result.tier !== 'Loss' ? `${result.tier}! Won ₦${result.payout.toFixed(2)}` : 'No Match'}
          </div>
        )}

        <button 
          onClick={handleSpin} 
          disabled={status === "spinning"}
          className={`w-full max-w-sm py-4 rounded-full font-black text-2xl uppercase tracking-widest border-b-4 transition-all z-10 ${
            status === "spinning" 
            ? 'bg-gray-700 border-gray-900 text-gray-500 cursor-not-allowed' 
            : 'bg-yellow-500 border-yellow-700 text-black hover:bg-yellow-400 active:translate-y-1 active:border-b-0'
          }`}
        >
          {status === "spinning" ? 'Spinning...' : 'SPIN'}
        </button>

      </div>
    </div>
  );
}
