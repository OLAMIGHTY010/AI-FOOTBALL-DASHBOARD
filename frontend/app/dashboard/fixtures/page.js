"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [loading, setLoading] = useState(true);

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
        }

        if (Array.isArray(fixturesJson)) {
            // Group by date
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

  return (
    <div className="w-full flex flex-col font-sans">
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
        <div className="text-lg font-bold">Fixtures</div>
        <div className="flex gap-4 text-xl">
          <button>↻</button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="text-center text-gray-500 py-10">Loading fixtures...</div>
        ) : fixtures.length > 0 ? (
          fixtures.map(([date, matches]) => (
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
          ))
        ) : (
          <div className="text-center text-gray-500 py-10">No fixtures available.</div>
        )}
      </div>
    </div>
  );
}
