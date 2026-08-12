"use client";
import { useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip
} from "recharts";
import Link from "next/link";

const PLAYER_DATABASE = [
  { name: "Erling Haaland", team: "Man City", pace: 89, shooting: 94, passing: 65, dribbling: 80, defence: 45, physical: 88 },
  { name: "Mohamed Salah", team: "Liverpool", pace: 90, shooting: 89, passing: 82, dribbling: 90, defence: 45, physical: 75 },
  { name: "Kevin De Bruyne", team: "Man City", pace: 74, shooting: 86, passing: 93, dribbling: 88, defence: 64, physical: 78 },
  { name: "Bukayo Saka", team: "Arsenal", pace: 86, shooting: 80, passing: 83, dribbling: 88, defence: 65, physical: 72 },
  { name: "Bruno Fernandes", team: "Man Utd", pace: 72, shooting: 85, passing: 90, dribbling: 84, defence: 64, physical: 76 },
  { name: "Virgil van Dijk", team: "Liverpool", pace: 78, shooting: 60, passing: 72, dribbling: 65, defence: 92, physical: 86 },
  { name: "Phil Foden", team: "Man City", pace: 84, shooting: 82, passing: 85, dribbling: 92, defence: 52, physical: 65 },
  { name: "Son Heung-min", team: "Spurs", pace: 88, shooting: 90, passing: 79, dribbling: 86, defence: 42, physical: 69 },
  { name: "Martin Ødegaard", team: "Arsenal", pace: 74, shooting: 80, passing: 88, dribbling: 87, defence: 56, physical: 62 },
  { name: "Declan Rice", team: "Arsenal", pace: 74, shooting: 70, passing: 78, dribbling: 76, defence: 87, physical: 84 },
  { name: "Jude Bellingham", team: "Real Madrid", pace: 78, shooting: 82, passing: 84, dribbling: 86, defence: 72, physical: 80 },
  { name: "Kylian Mbappé", team: "Real Madrid", pace: 97, shooting: 92, passing: 80, dribbling: 92, defence: 36, physical: 78 },
];

export default function ComparePage() {
  const [playerA, setPlayerA] = useState(PLAYER_DATABASE[0]);
  const [playerB, setPlayerB] = useState(PLAYER_DATABASE[1]);

  const stats = ["pace", "shooting", "passing", "dribbling", "defence", "physical"];

  const radarData = stats.map(stat => ({
    stat: stat.charAt(0).toUpperCase() + stat.slice(1),
    [playerA.name]: playerA[stat],
    [playerB.name]: playerB[stat],
  }));

  const overallA = Math.round(stats.reduce((sum, s) => sum + playerA[s], 0) / stats.length);
  const overallB = Math.round(stats.reduce((sum, s) => sum + playerB[s], 0) / stats.length);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pt-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-1">
            🆚 Player Comparison
          </h1>
          <p className="text-[var(--text-secondary)]">Select two players and compare their attributes.</p>
        </div>
        <Link href="/dashboard/analytics" className="btn-secondary px-4 py-2 text-sm">← Back</Link>
      </div>

      {/* Player Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-4 border-t-4 border-blue-500">
          <label className="text-sm text-[var(--text-secondary)] mb-2 block font-bold">Player A</label>
          <select
            value={playerA.name}
            onChange={(e) => setPlayerA(PLAYER_DATABASE.find(p => p.name === e.target.value))}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-white font-bold"
          >
            {PLAYER_DATABASE.map(p => (
              <option key={p.name} value={p.name}>{p.name} ({p.team})</option>
            ))}
          </select>
          <div className="mt-3 text-center">
            <span className="text-5xl font-black text-blue-400">{overallA}</span>
            <span className="text-sm text-[var(--text-secondary)] ml-2">OVR</span>
          </div>
        </div>

        <div className="glass-card p-4 border-t-4 border-red-500">
          <label className="text-sm text-[var(--text-secondary)] mb-2 block font-bold">Player B</label>
          <select
            value={playerB.name}
            onChange={(e) => setPlayerB(PLAYER_DATABASE.find(p => p.name === e.target.value))}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-white font-bold"
          >
            {PLAYER_DATABASE.map(p => (
              <option key={p.name} value={p.name}>{p.name} ({p.team})</option>
            ))}
          </select>
          <div className="mt-3 text-center">
            <span className="text-5xl font-black text-red-400">{overallB}</span>
            <span className="text-sm text-[var(--text-secondary)] ml-2">OVR</span>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="glass-card p-6 mb-8">
        <h3 className="font-bold text-lg mb-4 text-center">Attribute Comparison</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis dataKey="stat" tick={{ fill: '#aaa', fontSize: 13 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#666' }} />
              <Radar name={playerA.name} dataKey={playerA.name} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
              <Radar name={playerB.name} dataKey={playerB.name} stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} strokeWidth={2} />
              <Legend />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stat Bars */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-lg mb-4">Head to Head</h3>
        <div className="space-y-4">
          {stats.map(stat => {
            const valA = playerA[stat];
            const valB = playerB[stat];
            return (
              <div key={stat} className="flex items-center gap-4">
                <span className={`font-black w-8 text-right ${valA > valB ? 'text-blue-400' : valA < valB ? 'text-[var(--text-secondary)]' : ''}`}>{valA}</span>
                <div className="flex-1 flex gap-1">
                  <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden flex justify-end">
                    <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${valA}%` }}></div>
                  </div>
                  <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${valB}%` }}></div>
                  </div>
                </div>
                <span className={`font-black w-8 ${valB > valA ? 'text-red-400' : valB < valA ? 'text-[var(--text-secondary)]' : ''}`}>{valB}</span>
                <span className="text-xs text-[var(--text-secondary)] w-16 text-center uppercase">{stat}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
