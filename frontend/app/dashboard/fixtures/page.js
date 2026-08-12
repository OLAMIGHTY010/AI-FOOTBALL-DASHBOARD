"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState([]);
  const [rawFixtures, setRawFixtures] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [teamsData, setTeamsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("fdr"); // "list" or "fdr"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fixturesRes, bootstrapRes] = await Promise.all([
          fetch("http://localhost:8000/api/fpl/fixtures"),
          fetch("http://localhost:8000/api/fpl/bootstrap")
        ]);
        
        const fixturesJson = await fixturesRes.json();
        const bootstrapJson = await bootstrapRes.json();
        
        if (bootstrapJson.teams) {
            const tMap = {};
            bootstrapJson.teams.forEach(t => {
                tMap[t.id] = t.name;
            });
            setTeamsMap(tMap);
            setTeamsData(bootstrapJson.teams);
        }

        if (Array.isArray(fixturesJson)) {
            setRawFixtures(fixturesJson);
            // Group by date for List View
            const grouped = fixturesJson.reduce((acc, curr) => {
                if (!curr.kickoff_time) return acc;
                const date = new Date(curr.kickoff_time).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
                if (!acc[date]) acc[date] = [];
                acc[date].push(curr);
                return acc;
            }, {});
            setFixtures(Object.entries(grouped));
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Calculate FDR for the next 5 gameweeks
  const getFDR = () => {
    if (!teamsData.length || !rawFixtures.length) return [];
    
    // Find the next 5 upcoming gameweeks
    const upcomingGWs = [...new Set(rawFixtures.filter(f => !f.finished && f.event).map(f => f.event))].sort((a,b)=>a-b).slice(0, 5);
    
    const fdrData = teamsData.map(team => {
      const next5 = upcomingGWs.map(gw => {
        const match = rawFixtures.find(f => f.event === gw && (f.team_h === team.id || f.team_a === team.id));
        if (!match) return { gw, opponent: "BLANK", difficulty: 5, isHome: false };
        
        const isHome = match.team_h === team.id;
        const oppId = isHome ? match.team_a : match.team_h;
        const difficulty = isHome ? match.team_h_difficulty : match.team_a_difficulty;
        
        return {
          gw,
          opponent: teamsMap[oppId] || oppId,
          difficulty,
          isHome
        };
      });
      
      const totalDifficulty = next5.reduce((sum, m) => sum + m.difficulty, 0);
      
      return {
        ...team,
        next5,
        totalDifficulty
      };
    });
    
    // Sort by easiest upcoming fixtures (lowest total difficulty)
    return fdrData.sort((a, b) => a.totalDifficulty - b.totalDifficulty);
  };

  const fdrGrid = getFDR();

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 1: return "bg-green-600 text-white"; // Easiest
      case 2: return "bg-green-400 text-black";
      case 3: return "bg-gray-300 text-black";
      case 4: return "bg-red-400 text-white";
      case 5: return "bg-red-600 text-white"; // Hardest
      default: return "bg-black/50 text-white"; // Blank
    }
  };

  return (
    <div className="w-full flex flex-col font-sans">
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800 bg-[#162032]">
        <div className="text-lg font-bold">Fixtures & FDR</div>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode("fdr")} 
            className={`px-3 py-1 text-sm font-bold rounded ${viewMode === 'fdr' ? 'bg-[#00ff87] text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            FDR Matrix
          </button>
          <button 
            onClick={() => setViewMode("list")} 
            className={`px-3 py-1 text-sm font-bold rounded ${viewMode === 'list' ? 'bg-[#00ff87] text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            List View
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-10">Loading fixtures data...</div>
        ) : viewMode === 'fdr' ? (
          <div className="glass-card overflow-hidden">
            <div className="bg-[#37003c] text-white p-4 font-bold">Fixture Difficulty Rating (Next 5 Gameweeks)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-black/40 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    {fdrGrid[0]?.next5.map(gw => (
                      <th key={gw.gw} className="px-4 py-3 text-center">GW {gw.gw}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {fdrGrid.map(team => (
                    <tr key={team.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-bold">{team.name}</td>
                      {team.next5.map((match, idx) => (
                        <td key={idx} className="p-1">
                          <div className={`w-full h-full p-2 rounded flex flex-col items-center justify-center font-bold ${getDifficultyColor(match.difficulty)}`}>
                            <span>{match.opponent.substring(0, 3).toUpperCase()}</span>
                            <span className="text-[10px] opacity-80">{match.isHome ? '(H)' : '(A)'}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {fixtures.map(([date, matches]) => (
              <div key={date} className="bg-[#162032] rounded-xl border border-gray-800 overflow-hidden">
                <div className="bg-[#37003c] text-white font-bold text-sm p-2 text-center">
                  {date}
                </div>
                <div className="divide-y divide-gray-800">
                  {matches.map(match => {
                    const time = new Date(match.kickoff_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    return (
                      <div key={match.id} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                        <div className="flex-1 flex justify-end items-center gap-2">
                          <span className="text-sm font-bold">{teamsMap[match.team_h] || match.team_h}</span>
                          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs">🛡️</div>
                        </div>
                        
                        <div className="px-4 text-center">
                          {match.finished ? (
                             <div className="font-bold text-lg">{match.team_h_score} - {match.team_a_score}</div>
                          ) : (
                             <div className="text-xs font-bold bg-white/10 px-2 py-1 rounded">{time}</div>
                          )}
                        </div>

                        <div className="flex-1 flex justify-start items-center gap-2">
                          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs">🛡️</div>
                          <span className="text-sm font-bold">{teamsMap[match.team_a] || match.team_a}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
