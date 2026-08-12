"use client";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar
} from "recharts";
import Link from "next/link";

const TEAMS = [
  {
    name: "Arsenal",
    form: [
      { gw: "GW1", pts: 3, goals: 2, conceded: 0, xg: 1.8 },
      { gw: "GW2", pts: 1, goals: 1, conceded: 1, xg: 1.5 },
      { gw: "GW3", pts: 3, goals: 3, conceded: 1, xg: 2.4 },
      { gw: "GW4", pts: 3, goals: 1, conceded: 0, xg: 1.2 },
      { gw: "GW5", pts: 0, goals: 0, conceded: 2, xg: 0.8 },
      { gw: "GW6", pts: 3, goals: 2, conceded: 0, xg: 2.1 },
      { gw: "GW7", pts: 1, goals: 2, conceded: 2, xg: 1.9 },
      { gw: "GW8", pts: 3, goals: 4, conceded: 1, xg: 3.2 },
      { gw: "GW9", pts: 3, goals: 2, conceded: 0, xg: 1.7 },
      { gw: "GW10", pts: 3, goals: 3, conceded: 1, xg: 2.6 },
    ]
  },
  {
    name: "Man City",
    form: [
      { gw: "GW1", pts: 3, goals: 3, conceded: 0, xg: 2.5 },
      { gw: "GW2", pts: 3, goals: 2, conceded: 1, xg: 2.0 },
      { gw: "GW3", pts: 1, goals: 1, conceded: 1, xg: 1.3 },
      { gw: "GW4", pts: 3, goals: 5, conceded: 1, xg: 3.8 },
      { gw: "GW5", pts: 3, goals: 2, conceded: 0, xg: 1.9 },
      { gw: "GW6", pts: 0, goals: 1, conceded: 2, xg: 1.1 },
      { gw: "GW7", pts: 3, goals: 3, conceded: 0, xg: 2.7 },
      { gw: "GW8", pts: 1, goals: 1, conceded: 1, xg: 1.4 },
      { gw: "GW9", pts: 3, goals: 4, conceded: 2, xg: 3.1 },
      { gw: "GW10", pts: 3, goals: 2, conceded: 0, xg: 2.2 },
    ]
  },
  {
    name: "Liverpool",
    form: [
      { gw: "GW1", pts: 3, goals: 2, conceded: 1, xg: 1.6 },
      { gw: "GW2", pts: 3, goals: 3, conceded: 0, xg: 2.8 },
      { gw: "GW3", pts: 0, goals: 0, conceded: 1, xg: 0.7 },
      { gw: "GW4", pts: 3, goals: 2, conceded: 0, xg: 1.9 },
      { gw: "GW5", pts: 1, goals: 1, conceded: 1, xg: 1.3 },
      { gw: "GW6", pts: 3, goals: 4, conceded: 2, xg: 3.5 },
      { gw: "GW7", pts: 3, goals: 2, conceded: 1, xg: 1.8 },
      { gw: "GW8", pts: 3, goals: 3, conceded: 0, xg: 2.4 },
      { gw: "GW9", pts: 0, goals: 1, conceded: 3, xg: 1.0 },
      { gw: "GW10", pts: 3, goals: 2, conceded: 0, xg: 2.1 },
    ]
  },
];

export default function FormPage() {
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);
  const [chartType, setChartType] = useState("points");

  const cumulativeData = selectedTeam.form.map((gw, idx) => ({
    ...gw,
    cumPts: selectedTeam.form.slice(0, idx + 1).reduce((s, g) => s + g.pts, 0),
    cumGoals: selectedTeam.form.slice(0, idx + 1).reduce((s, g) => s + g.goals, 0),
  }));

  const formIndex = selectedTeam.form.slice(-5).reduce((s, g) => s + g.pts, 0);
  const formLabel = formIndex >= 13 ? "🔥 Excellent" : formIndex >= 9 ? "✅ Good" : formIndex >= 5 ? "⚠️ Average" : "❌ Poor";

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pt-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-1">
            📈 Form & Trends
          </h1>
          <p className="text-[var(--text-secondary)]">Track team performance over the last 10 gameweeks.</p>
        </div>
        <Link href="/dashboard/analytics" className="btn-secondary px-4 py-2 text-sm">← Back</Link>
      </div>

      {/* Team Selector + Form Index */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4">
          <label className="text-sm text-[var(--text-secondary)] mb-2 block font-bold">Select Team</label>
          <select
            value={selectedTeam.name}
            onChange={(e) => setSelectedTeam(TEAMS.find(t => t.name === e.target.value))}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-white font-bold"
          >
            {TEAMS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
        </div>

        <div className="glass-card p-4 flex flex-col items-center justify-center border-t-4 border-[var(--accent-primary)]">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Form Index (Last 5)</div>
          <div className="text-3xl font-black">{formIndex}/15</div>
          <div className="text-sm font-bold mt-1">{formLabel}</div>
        </div>

        <div className="glass-card p-4 flex flex-col items-center justify-center">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Last 5 Results</div>
          <div className="flex gap-1 mt-2">
            {selectedTeam.form.slice(-5).map((gw, idx) => (
              <span
                key={idx}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                  gw.pts === 3 ? "bg-green-500 text-white" : gw.pts === 1 ? "bg-yellow-500 text-black" : "bg-red-500 text-white"
                }`}
              >
                {gw.pts === 3 ? "W" : gw.pts === 1 ? "D" : "L"}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Type Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "points", label: "Cumulative Points" },
          { id: "goals", label: "Goals per GW" },
          { id: "xg", label: "xG vs Actual" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setChartType(tab.id)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
              chartType === tab.id ? "bg-[var(--accent-primary)] text-black" : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="glass-card p-6">
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "points" ? (
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="gw" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333" }} />
                <Line type="monotone" dataKey="cumPts" stroke="#00ff87" strokeWidth={3} dot={{ r: 5, fill: "#00ff87" }} name="Cumulative Pts" />
              </LineChart>
            ) : chartType === "goals" ? (
              <BarChart data={selectedTeam.form}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="gw" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333" }} />
                <Legend />
                <Bar dataKey="goals" fill="#00ff87" name="Scored" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conceded" fill="#ef4444" name="Conceded" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={selectedTeam.form}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="gw" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333" }} />
                <Legend />
                <Line type="monotone" dataKey="goals" stroke="#00ff87" strokeWidth={2} dot={{ r: 4 }} name="Actual Goals" />
                <Line type="monotone" dataKey="xg" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="xG" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
