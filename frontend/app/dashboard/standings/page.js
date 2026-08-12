"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import VirtualTabs from "../components/VirtualTabs";

const API_URL = "http://localhost:8000";

export default function StandingsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StandingsPage />
    </Suspense>
  );
}

function StandingsPage() {
  const searchParams = useSearchParams();
  const currentSport = searchParams.get("sport") || "football";
  const [standings, setStandings] = useState({});
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandings();
  }, [currentSport]);

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/standings?sport=${currentSport}`);
      const data = await res.json();
      setStandings(data);
      setLeagues(Object.keys(data));
      if (Object.keys(data).length > 0) {
        setSelectedLeague(Object.keys(data)[0]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-20 text-[var(--text-secondary)]">Loading standings...</div>;
  }

  const currentStandings = standings[selectedLeague] || [];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🏆 League Standings</h1>
          <p className="text-sm text-[var(--text-secondary)]">Live tables updated after every match</p>
        </div>
        <button onClick={fetchStandings} className="btn-secondary text-sm">
          🔄 Refresh
        </button>
      </div>

      <VirtualTabs />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-3 pt-1 scroll-smooth">
        {leagues.map((l) => (
          <button
            key={l}
            onClick={() => setSelectedLeague(l)}
            className={`odds-btn flex-shrink-0 whitespace-nowrap ${selectedLeague === l ? "selected" : ""}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="league-table w-full">
          <thead className="bg-black/20">
            <tr>
              <th className="w-12 text-center">#</th>
              <th>{currentSport === 'tennis' ? 'Player' : currentSport === 'racing' ? 'Driver' : 'Club'}</th>
              <th className="text-center">MP</th>
              <th className="text-center">W</th>
              {currentSport === 'football' && <th className="text-center">D</th>}
              <th className="text-center">L</th>
              <th className="text-center">{currentSport === 'basketball' ? 'PF' : currentSport === 'tennis' ? 'Sets W' : currentSport === 'racing' ? '-' : 'GF'}</th>
              <th className="text-center">{currentSport === 'basketball' ? 'PA' : currentSport === 'tennis' ? 'Sets L' : currentSport === 'racing' ? '-' : 'GA'}</th>
              <th className="text-center">{currentSport === 'basketball' ? 'PD' : currentSport === 'tennis' ? 'Sets Diff' : currentSport === 'racing' ? 'Wins' : 'GD'}</th>
              <th className="text-center text-[var(--accent-primary)]">Pts</th>
            </tr>
          </thead>
          <tbody>
            {currentStandings && Object.entries(currentStandings).map(([team, stats], index) => {
              let secondaryStat = stats.GD;
              let pf = stats.GF;
              let pa = stats.GA;
              if (currentSport === 'basketball') {
                secondaryStat = stats.PD;
                pf = stats.PF;
                pa = stats.PA;
              }
              else if (currentSport === 'tennis') {
                secondaryStat = stats.SetsW - stats.SetsL;
                pf = stats.SetsW;
                pa = stats.SetsL;
              }
              else if (currentSport === 'racing') {
                secondaryStat = stats.W;
                pf = '-';
                pa = '-';
              }

              return (
                <tr key={team}>
                  <td className="text-center font-bold text-[var(--text-secondary)]">{index + 1}</td>
                  <td className="font-semibold">{team}</td>
                  <td className="text-center text-[var(--text-secondary)]">{stats.P}</td>
                  <td className="text-center">{stats.W}</td>
                  {currentSport === 'football' && <td className="text-center">{stats.D || 0}</td>}
                  <td className="text-center">{stats.L || 0}</td>
                  <td className="text-center">{pf}</td>
                  <td className="text-center">{pa}</td>
                  <td className="text-center">{currentSport === 'football' || currentSport === 'basketball' || currentSport === 'tennis' ? (secondaryStat > 0 ? `+${secondaryStat}` : secondaryStat) : secondaryStat}</td>
                  <td className="text-center font-bold text-[var(--accent-primary)]">{stats.Pts}</td>
                </tr>
              );
            })}
            {(!currentStandings || Object.keys(currentStandings).length === 0) && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-[var(--text-secondary)]">
                  No matches played yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
