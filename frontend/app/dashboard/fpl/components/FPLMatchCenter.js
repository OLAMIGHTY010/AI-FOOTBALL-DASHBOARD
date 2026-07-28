"use client";
import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function FPLMatchCenter() {
  const [fixtures, setFixtures] = useState([]);
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("fixtures");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resFixtures, resStandings] = await Promise.all([
        fetch(`${API_URL}/api/fixtures`),
        fetch(`${API_URL}/api/standings`)
      ]);
      const dataFixtures = await resFixtures.json();
      const dataStandings = await resStandings.json();
      
      setFixtures(dataFixtures);
      setStandings(dataStandings);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-20 animate-pulse text-[var(--accent-primary)]">Loading Match Data...</div>;
  }

  // Find Premier League table
  const eplTable = standings ? standings["Premier League"] : null;
  const eplTeams = eplTable ? Object.entries(eplTable).map(([name, stats]) => ({ name, ...stats })) : [];
  eplTeams.sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    return b.GD - a.GD;
  });

  return (
    <div className="glass-card">
      <div className="flex border-b border-[var(--border-color)]">
        <button 
          onClick={() => setActiveTab("fixtures")}
          className={`flex-1 py-3 font-bold text-center ${activeTab === "fixtures" ? "bg-[var(--accent-primary)] text-black" : "text-[var(--text-secondary)] hover:bg-white/5"}`}
        >
          🗓️ Gameweek Fixtures
        </button>
        <button 
          onClick={() => setActiveTab("table")}
          className={`flex-1 py-3 font-bold text-center ${activeTab === "table" ? "bg-blue-600 text-white" : "text-[var(--text-secondary)] hover:bg-white/5"}`}
        >
          📊 Virtual PL Table
        </button>
      </div>

      <div className="p-4 h-[550px] overflow-y-auto bg-black/20">
        {activeTab === "fixtures" && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-bold mb-4">Latest Fixtures & Results</h3>
            {fixtures.filter(f => f.home.league === "Premier League").length === 0 ? (
              <p className="text-[var(--text-secondary)]">No fixtures generated yet. Run a simulation.</p>
            ) : (
              fixtures.filter(f => f.home.league === "Premier League").map(f => (
                <div key={f.id} className="flex items-center justify-between bg-black/40 p-4 rounded-lg border border-white/5">
                  <div className="text-right flex-1 font-bold">{f.home.name}</div>
                  <div className="px-6 font-black text-xl text-[var(--accent-primary)]">
                    {f.status === "finished" ? `${f.score.home} - ${f.score.away}` : 'vs'}
                  </div>
                  <div className="text-left flex-1 font-bold">{f.away.name}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "table" && (
          <div>
            <h3 className="text-xl font-bold mb-4">Premier League Standings</h3>
            {!eplTeams.length ? (
              <p className="text-[var(--text-secondary)]">No standings available.</p>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-[var(--text-secondary)] uppercase bg-black/40 sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Pos</th>
                    <th className="px-3 py-2">Club</th>
                    <th className="px-3 py-2">MP</th>
                    <th className="px-3 py-2">W</th>
                    <th className="px-3 py-2">D</th>
                    <th className="px-3 py-2">L</th>
                    <th className="px-3 py-2">GD</th>
                    <th className="px-3 py-2 font-bold text-white">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {eplTeams.map((team, idx) => (
                    <tr key={team.name} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-3 py-2 font-bold">{idx + 1}</td>
                      <td className="px-3 py-2 font-bold">{team.name}</td>
                      <td className="px-3 py-2">{team.P}</td>
                      <td className="px-3 py-2">{team.W}</td>
                      <td className="px-3 py-2">{team.D}</td>
                      <td className="px-3 py-2">{team.L}</td>
                      <td className="px-3 py-2">{team.GD}</td>
                      <td className="px-3 py-2 font-black text-[var(--accent-primary)]">{team.Pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
