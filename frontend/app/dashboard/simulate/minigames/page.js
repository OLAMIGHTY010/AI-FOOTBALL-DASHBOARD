"use client";
import Link from "next/link";
import VirtualTabs from "../../components/VirtualTabs";

export default function MiniGamesHub() {
  const games = [
    {
      id: "crash",
      name: "🚀 Virtual Crash",
      desc: "Cash out before the multiplier crashes! High risk, high reward.",
      path: "/dashboard/simulate/minigames/crash",
      color: "from-blue-500 to-cyan-400"
    },
    {
      id: "penalty",
      name: "⚽ Penalty Shootout",
      desc: "Beat the keeper. Score goals to increase your multiplier.",
      path: "/dashboard/simulate/minigames/penalty",
      color: "from-green-500 to-[var(--accent-primary)]"
    },
    {
      id: "hilo",
      name: "🎲 Over/Under",
      desc: "Guess if the next number will be higher or lower.",
      path: "/dashboard/simulate/minigames/hilo",
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "slots",
      name: "🎰 Football Slots",
      desc: "Spin the reels to match football symbols for massive payouts.",
      path: "/dashboard/simulate/minigames/slots",
      color: "from-yellow-400 to-orange-500"
    },
    {
      id: "raffle",
      name: "🎫 Instant Raffle",
      desc: "Buy a ticket and instantly reveal to win up to 50x your wager.",
      path: "/dashboard/simulate/minigames/raffle",
      color: "from-gray-600 to-gray-400"
    }
  ];

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto font-sans animate-fade-in pb-24">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Virtual Hub</h1>
        <p className="text-[var(--text-secondary)]">Experience the thrill of our casino-style mini games.</p>
      </div>

      <VirtualTabs />

      <div className="mb-8 mt-8 border-b border-[var(--border-color)] pb-4">
        <h1 className="text-2xl font-bold mb-1">🎲 Mini Games Casino</h1>
        <p className="text-sm text-[var(--text-secondary)]">Select a game to play and win `aiCoins` instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Link href={game.path} key={game.id}>
            <div className={`glass-card !p-0 overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] group`}>
              <div className={`h-32 bg-gradient-to-br ${game.color} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <h2 className="text-2xl font-black text-white relative z-10 drop-shadow-md">{game.name}</h2>
              </div>
              <div className="p-6 bg-black/40">
                <p className="text-sm text-[var(--text-secondary)] mb-4 h-10">{game.desc}</p>
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] group-hover:text-white transition-colors">
                  Play Now →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
