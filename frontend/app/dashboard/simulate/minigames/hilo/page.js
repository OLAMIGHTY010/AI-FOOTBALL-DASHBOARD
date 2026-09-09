"use client";
import { useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import Link from "next/link";

export default function HiLoPage() {
  const { user, aiCoins, setAiCoins } = useAppContext();
  const [wager, setWager] = useState(50);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentNum, setCurrentNum] = useState(50);

  const wagerOptions = [10, 50, 100, 500, 1000];

  const handlePlay = async (action) => {
    if (!user) return setError("Must be logged in.");
    if (aiCoins < wager) return setError("Insufficient aiCoins.");
    
    setError(null);
    setStatus("playing");
    setResult(null);

    try {
      const res = await fetch("http://localhost:8000/api/games/hilo/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, wager: parseFloat(wager), action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setTimeout(() => {
        setResult(data);
        setCurrentNum(data.next_num);
        setAiCoins(data.new_balance);
        setStatus("idle");
      }, 1000);

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
          <h1 className="text-4xl font-black uppercase tracking-widest text-purple-400">🎲 Over/Under</h1>
        </div>
        <div className="glass-card px-4 py-2 border border-purple-400 text-purple-400 font-black text-xl shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          ₦{aiCoins.toFixed(2)}
        </div>
      </div>

      <div className="glass-card p-8 border border-[var(--border-color)] flex flex-col items-center min-h-[400px]">
        {error && <div className="text-red-500 font-bold mb-4">{error}</div>}
        
        <div className="flex gap-2 justify-center mb-8">
          {wagerOptions.map((amt) => (
            <button key={amt} onClick={() => setWager(amt)} disabled={status === "playing"} className={`px-4 py-2 rounded font-bold ${wager === amt ? 'bg-purple-500 text-white' : 'bg-black/50 text-gray-400'}`}>
              ₦{amt}
            </button>
          ))}
        </div>

        <div className="text-center mb-12">
          <div className="text-sm text-[var(--text-secondary)] uppercase tracking-widest mb-2">Current Number</div>
          <div className={`text-9xl font-black ${status === 'playing' ? 'animate-pulse text-gray-500' : 'text-white'}`}>
            {status === "playing" ? "?" : currentNum}
          </div>
          {result && (
            <div className={`mt-4 text-2xl font-bold uppercase tracking-widest ${result.won ? 'text-green-400' : 'text-red-500'}`}>
              {result.won ? `You Won +₦${result.payout.toFixed(2)}!` : 'You Lost!'}
            </div>
          )}
        </div>

        <div className="flex gap-6 w-full max-w-md">
          <button 
            onClick={() => handlePlay("higher")} 
            disabled={status === "playing"}
            className="flex-1 py-6 bg-gradient-to-t from-purple-900 to-purple-600 hover:to-purple-500 rounded-xl font-black text-2xl border-t-2 border-purple-400 shadow-[0_10px_20px_rgba(168,85,247,0.3)] transition-all active:translate-y-2"
          >
            ⬆️ HIGHER
          </button>
          <button 
            onClick={() => handlePlay("lower")} 
            disabled={status === "playing"}
            className="flex-1 py-6 bg-gradient-to-b from-pink-600 hover:from-pink-500 to-pink-900 rounded-xl font-black text-2xl border-b-2 border-pink-400 shadow-[0_10px_20px_rgba(236,72,153,0.3)] transition-all active:translate-y-2"
          >
            ⬇️ LOWER
          </button>
        </div>

      </div>
    </div>
  );
}
