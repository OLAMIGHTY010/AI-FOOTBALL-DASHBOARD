"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LEAGUES, calculateTable } from "@/lib/seasonEngine";

export default function SeasonStandingsPage() {
  const [seasonState, setSeasonState] = useState(null);
  const [table, setTable] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("seasonState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSeasonState(parsed);
        setTable(calculateTable(parsed.leagueId, parsed.results));
      } catch(e) {}
    }
  }, []);

  if (!isClient) return <div className="p-8">Loading...</div>;

  if (!seasonState) {
    return (
      <div className="text-center p-20 animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">No Active Season</h2>
        <Link href="/dashboard/season" className="btn-primary px-6 py-3">Start a Season</Link>
      </div>
    );
  }

  const league = LEAGUES[seasonState.leagueId];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pt-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">
            📊 {league.name} Standings
          </h1>
          <p className="text-[var(--text-secondary)]">Current standings after Gameweek {seasonState.currentWeek}</p>
        </div>
        <Link href="/dashboard/season" className="btn-secondary px-4 py-2 text-sm">
          ← Back to Hub
        </Link>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-[var(--border-color)] text-[var(--text-secondary)] text-sm">
              <th className="p-4 font-bold w-12 text-center">Pos</th>
              <th className="p-4 font-bold">Team</th>
              <th className="p-4 font-bold text-center">Played</th>
              <th className="p-4 font-bold text-center">W</th>
              <th className="p-4 font-bold text-center">D</th>
              <th className="p-4 font-bold text-center">L</th>
              <th className="p-4 font-bold text-center hidden md:table-cell">GF</th>
              <th className="p-4 font-bold text-center hidden md:table-cell">GA</th>
              <th className="p-4 font-bold text-center">GD</th>
              <th className="p-4 font-bold text-right text-[var(--accent-primary)] text-lg">Pts</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, idx) => {
              // Highlight zones
              let zoneClass = "";
              if (idx < 4) zoneClass = "border-l-4 border-blue-500"; // Champions League
              else if (idx === 4) zoneClass = "border-l-4 border-orange-500"; // Europa
              else if (idx >= table.length - 3) zoneClass = "border-l-4 border-red-500"; // Relegation
              else zoneClass = "border-l-4 border-transparent";

              return (
                <tr key={row.id} className={`border-b border-gray-800/50 hover:bg-white/5 transition-colors ${zoneClass}`}>
                  <td className="p-4 font-black text-[var(--text-secondary)] text-center">{idx + 1}</td>
                  <td className="p-4 font-bold">{row.name}</td>
                  <td className="p-4 text-center">{row.played}</td>
                  <td className="p-4 text-center text-green-400">{row.won}</td>
                  <td className="p-4 text-center text-yellow-400">{row.drawn}</td>
                  <td className="p-4 text-center text-red-400">{row.lost}</td>
                  <td className="p-4 text-center hidden md:table-cell">{row.gf}</td>
                  <td className="p-4 text-center hidden md:table-cell">{row.ga}</td>
                  <td className={`p-4 text-center font-bold ${row.gd > 0 ? "text-green-400" : row.gd < 0 ? "text-red-400" : ""}`}>
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </td>
                  <td className="p-4 text-right font-black text-xl text-white">
                    {row.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex gap-6 text-xs text-[var(--text-secondary)] justify-center">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Champions League</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div> Europa League</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Relegation</div>
      </div>
    </div>
  );
}
