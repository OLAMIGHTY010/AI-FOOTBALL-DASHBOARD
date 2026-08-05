"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SetPiecesPage() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fpl/bootstrap");
        const json = await res.json();
        if (json.teams && json.elements) {
          setTeams(json.teams);
          setPlayers(json.elements);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const getSetPieceTakers = (teamId, orderField) => {
    return players
      .filter(p => p.team === teamId && p[orderField] > 0)
      .sort((a, b) => a[orderField] - b[orderField])
      .map(p => p.web_name);
  };

  const isPremiumAsset = (player) => {
    return player.penalties_order === 1 && player.direct_freekicks_order === 1 && player.corners_and_indirect_freekicks_order === 1;
  };

  const premiumAssets = players.filter(isPremiumAsset).map(p => p.web_name);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-sans animate-fade-in pt-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00ff87] to-cyan-400 mb-2">
            🎯 Set Piece Takers
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Identify which players are on penalties, free kicks, and corners.
          </p>
        </div>
        <Link href="/dashboard/fpl" className="btn-secondary px-6">Back to FPL Hub</Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10 animate-pulse">Loading set piece data from FPL API...</div>
      ) : (
        <div className="space-y-8">
          
          {premiumAssets.length > 0 && (
            <div className="glass-card p-6 border-l-4 border-yellow-400">
              <h2 className="text-xl font-bold text-yellow-400 mb-2">⭐ Premium Assets (On All Set Pieces)</h2>
              <p className="text-sm mb-2 text-[var(--text-secondary)]">These players take penalties, free kicks, and corners for their respective teams.</p>
              <div className="flex flex-wrap gap-2">
                {premiumAssets.map(name => (
                  <span key={name} className="px-3 py-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 rounded font-bold">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#37003c] text-white">
                  <tr>
                    <th className="px-6 py-4 font-black">Team</th>
                    <th className="px-6 py-4 font-bold text-red-400">Penalties</th>
                    <th className="px-6 py-4 font-bold text-blue-400">Direct Free Kicks</th>
                    <th className="px-6 py-4 font-bold text-green-400">Corners</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {teams.map(team => {
                    const penalties = getSetPieceTakers(team.id, 'penalties_order');
                    const freekicks = getSetPieceTakers(team.id, 'direct_freekicks_order');
                    const corners = getSetPieceTakers(team.id, 'corners_and_indirect_freekicks_order');

                    return (
                      <tr key={team.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-black text-lg border-r border-gray-800">{team.name}</td>
                        <td className="px-6 py-4">
                          <ol className="list-decimal pl-4 space-y-1">
                            {penalties.map((name, i) => (
                              <li key={i} className={i === 0 ? "font-bold text-white" : "text-[var(--text-secondary)] text-sm"}>{name}</li>
                            ))}
                            {penalties.length === 0 && <span className="text-gray-600 text-sm">Unknown</span>}
                          </ol>
                        </td>
                        <td className="px-6 py-4 bg-white/[0.02]">
                          <ol className="list-decimal pl-4 space-y-1">
                            {freekicks.map((name, i) => (
                              <li key={i} className={i === 0 ? "font-bold text-white" : "text-[var(--text-secondary)] text-sm"}>{name}</li>
                            ))}
                            {freekicks.length === 0 && <span className="text-gray-600 text-sm">Unknown</span>}
                          </ol>
                        </td>
                        <td className="px-6 py-4">
                          <ol className="list-decimal pl-4 space-y-1">
                            {corners.map((name, i) => (
                              <li key={i} className={i === 0 ? "font-bold text-white" : "text-[var(--text-secondary)] text-sm"}>{name}</li>
                            ))}
                            {corners.length === 0 && <span className="text-gray-600 text-sm">Unknown</span>}
                          </ol>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
