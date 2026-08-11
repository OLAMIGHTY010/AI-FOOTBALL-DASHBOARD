"use client";
import { useState } from "react";
import Link from "next/link";

export default function SeasonStatsPage() {
  const [activeTab, setActiveTab] = useState("stats"); // 'stats' or 'hall-of-fame'

  // Dummy data for Current Season Stats
  const topScorers = [
    { rank: 1, name: "E. Haaland", team: "Man City", goals: 25 },
    { rank: 2, name: "M. Salah", team: "Liverpool", goals: 18 },
    { rank: 3, name: "B. Saka", team: "Arsenal", goals: 15 },
    { rank: 4, name: "O. Watkins", team: "Aston Villa", goals: 14 },
    { rank: 5, name: "A. Isak", team: "Newcastle", goals: 12 },
  ];

  const topAssists = [
    { rank: 1, name: "K. De Bruyne", team: "Man City", assists: 15 },
    { rank: 2, name: "M. Odegaard", team: "Arsenal", assists: 11 },
    { rank: 3, name: "P. Neto", team: "Chelsea", assists: 10 },
    { rank: 4, name: "J. Maddison", team: "Tottenham", assists: 9 },
    { rank: 5, name: "B. Fernandes", team: "Man Utd", assists: 8 },
  ];

  const cleanSheets = [
    { rank: 1, name: "David Raya", team: "Arsenal", cs: 12 },
    { rank: 2, name: "Ederson", team: "Man City", cs: 10 },
    { rank: 3, name: "Alisson", team: "Liverpool", cs: 9 },
    { rank: 4, name: "G. Vicario", team: "Tottenham", cs: 7 },
    { rank: 5, name: "A. Onana", team: "Man Utd", cs: 6 },
  ];

  // Curated Mock Legends for Hall of Fame
  const hallOfFame = [
    {
      id: "legend-1",
      name: "Lionel Messi",
      era: "2004 - Present",
      status: "GOAT Status",
      description: "The ultimate playmaker and goalscorer. Holder of the most Ballon d'Or awards in history.",
      stats: { goals: 821, assists: 361, matches: 1047 },
      image: "https://resources.premierleague.com/premierleague/photos/players/250x250/Photo-Missing.png", // fallback placeholder
      color: "from-blue-500 to-sky-400"
    },
    {
      id: "legend-2",
      name: "Cristiano Ronaldo",
      era: "2002 - Present",
      status: "GOAT Status",
      description: "The greatest goalscorer in football history, known for his incredible athleticism and clutch performances.",
      stats: { goals: 873, assists: 249, matches: 1205 },
      image: "https://resources.premierleague.com/premierleague/photos/players/250x250/Photo-Missing.png",
      color: "from-red-600 to-rose-500"
    },
    {
      id: "legend-3",
      name: "Pelé",
      era: "1956 - 1977",
      status: "The King",
      description: "Three-time World Cup winner. The global icon who made the number 10 shirt legendary.",
      stats: { goals: 762, assists: 342, matches: 831 }, // Official matches approx
      image: "https://resources.premierleague.com/premierleague/photos/players/250x250/Photo-Missing.png",
      color: "from-yellow-400 to-green-500"
    },
    {
      id: "legend-4",
      name: "Diego Maradona",
      era: "1976 - 1997",
      status: "El Pibe de Oro",
      description: "A flawed genius whose left foot could perform miracles. Led Argentina to World Cup glory in 1986.",
      stats: { goals: 346, assists: 240, matches: 680 },
      image: "https://resources.premierleague.com/premierleague/photos/players/250x250/Photo-Missing.png",
      color: "from-sky-300 to-blue-400"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pt-6 pb-20 animate-fade-in font-sans">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-6">
        <div>
          <Link href="/dashboard/season" className="text-[var(--accent-primary)] hover:underline text-sm font-bold flex items-center gap-2 mb-2">
            ← Back to Season Hub
          </Link>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 uppercase tracking-tight">
            🏆 Player Stats & Hall of Fame
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Track current season leaders or browse the legends of the game.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-6 py-3 font-bold rounded-lg transition-all ${
            activeTab === "stats"
              ? "bg-[var(--accent-primary)] text-white shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.5)]"
              : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white"
          }`}
        >
          📊 Current Season Stats
        </button>
        <button
          onClick={() => setActiveTab("hall-of-fame")}
          className={`px-6 py-3 font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "hall-of-fame"
              ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] border-none"
              : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white border-none"
          }`}
        >
          👑 Hall of Fame
        </button>
      </div>

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Top Scorers */}
          <div className="glass-card p-0 overflow-hidden border-t-4 border-yellow-500">
            <div className="bg-yellow-500/10 p-4 border-b border-[var(--border-color)] flex items-center gap-3">
              <span className="text-2xl">⚽</span>
              <h2 className="text-xl font-black text-yellow-500">Golden Boot</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 px-2">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-8">Player</div>
                <div className="col-span-2 text-right">Gls</div>
              </div>
              <div className="space-y-2">
                {topScorers.map((player) => (
                  <div key={player.rank} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="col-span-2 text-center font-black text-lg text-yellow-500">{player.rank}</div>
                    <div className="col-span-8">
                      <div className="font-bold">{player.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{player.team}</div>
                    </div>
                    <div className="col-span-2 text-right font-black text-xl">{player.goals}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Assists */}
          <div className="glass-card p-0 overflow-hidden border-t-4 border-blue-500">
            <div className="bg-blue-500/10 p-4 border-b border-[var(--border-color)] flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <h2 className="text-xl font-black text-blue-400">Playmaker</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 px-2">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-8">Player</div>
                <div className="col-span-2 text-right">Ast</div>
              </div>
              <div className="space-y-2">
                {topAssists.map((player) => (
                  <div key={player.rank} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="col-span-2 text-center font-black text-lg text-blue-400">{player.rank}</div>
                    <div className="col-span-8">
                      <div className="font-bold">{player.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{player.team}</div>
                    </div>
                    <div className="col-span-2 text-right font-black text-xl">{player.assists}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clean Sheets */}
          <div className="glass-card p-0 overflow-hidden border-t-4 border-emerald-500">
            <div className="bg-emerald-500/10 p-4 border-b border-[var(--border-color)] flex items-center gap-3">
              <span className="text-2xl">🧤</span>
              <h2 className="text-xl font-black text-emerald-400">Golden Glove</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 px-2">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-8">Goalkeeper</div>
                <div className="col-span-2 text-right">CS</div>
              </div>
              <div className="space-y-2">
                {cleanSheets.map((player) => (
                  <div key={player.rank} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="col-span-2 text-center font-black text-lg text-emerald-400">{player.rank}</div>
                    <div className="col-span-8">
                      <div className="font-bold">{player.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{player.team}</div>
                    </div>
                    <div className="col-span-2 text-right font-black text-xl">{player.cs}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === "hall-of-fame" && (
        <div className="animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 mb-4">
              The Immortals
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-[var(--text-secondary)]">
              Welcome to the Hall of Fame. These are the legendary figures whose contributions to the beautiful game echo through eternity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {hallOfFame.map((legend) => (
              <div key={legend.id} className="relative group perspective-1000">
                {/* 3D Card Hover Effect Container */}
                <div className="relative transform-gpu transition-all duration-500 group-hover:rotate-y-12 group-hover:scale-105 h-full">
                  
                  {/* Glowing background blob */}
                  <div className={`absolute -inset-1 bg-gradient-to-r ${legend.color} rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500`}></div>
                  
                  {/* Card Content */}
                  <div className="relative h-full bg-black/80 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 flex flex-col items-center text-center overflow-hidden">
                    
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 rounded-tr-2xl"></div>
                    
                    {/* Placeholder for Player Image (Silhouette) */}
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-black border-4 border-yellow-500/50 mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] relative z-10 overflow-hidden">
                       <span className="text-5xl">👤</span>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-1 drop-shadow-lg">{legend.name}</h3>
                    <div className={`text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${legend.color} mb-4`}>
                      {legend.status}
                    </div>

                    <p className="text-sm text-gray-400 mb-6 italic leading-relaxed flex-1">
                      "{legend.description}"
                    </p>

                    {/* Stats Grid */}
                    <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t border-yellow-500/20">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white">{legend.stats.goals}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Goals</span>
                      </div>
                      <div className="flex flex-col items-center border-l border-r border-yellow-500/20">
                        <span className="text-2xl font-black text-white">{legend.stats.assists}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Assists</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white">{legend.stats.matches}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Matches</span>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
