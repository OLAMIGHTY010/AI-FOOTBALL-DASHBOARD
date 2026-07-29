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
  }, []);

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/real-standings`);
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

      {currentSport === "basketball" ? (
        <div className="glass-card text-center py-20">
          <div className="text-4xl mb-4">🏀</div>
          <h2 className="text-xl font-bold mb-2">Basketball Season Tracking Coming Soon</h2>
          <p className="text-[var(--text-secondary)]">Currently, basketball matches are isolated simulations. Season standings are in development.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="league-table w-full">
            <thead className="bg-black/20">
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Club</th>
                <th className="text-center">MP</th>
                <th className="text-center">W</th>
                <th className="text-center">D</th>
                <th className="text-center">L</th>
                <th className="text-center">GF</th>
                <th className="text-center">GA</th>
                <th className="text-center">GD</th>
                <th className="text-center text-[var(--accent-primary)]">Pts</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(currentStandings) && currentStandings.map((team, index) => (
                <tr key={team.Team}>
                  <td className="text-center font-bold text-[var(--text-secondary)]">{team.Rank || index + 1}</td>
                  <td className="font-semibold">{team.Team}</td>
                  <td className="text-center text-[var(--text-secondary)]">{team.GP}</td>
                  <td className="text-center">{team.W}</td>
                  <td className="text-center">{team.D}</td>
                  <td className="text-center">{team.L}</td>
                  <td className="text-center">{team.GF}</td>
                  <td className="text-center">{team.GA}</td>
                  <td className="text-center">{typeof team.GD === 'number' ? (team.GD > 0 ? `+${team.GD}` : team.GD) : team.GD}</td>
                  <td className="text-center font-bold text-[var(--accent-primary)]">{team.Pts}</td>
                </tr>
              ))}
              {(!currentStandings || currentStandings.length === 0) && (
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
      )}
    </div>
  );
}
