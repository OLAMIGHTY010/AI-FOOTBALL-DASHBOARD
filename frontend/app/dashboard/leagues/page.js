"use client";
import { useState, useEffect } from "react";

export default function LeaguesPage() {
  const [tab, setTab] = useState("Leagues");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entryId, setEntryId] = useState("1");
  const [inputVal, setInputVal] = useState("1");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/fpl/entry/${entryId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    if (entryId) {
        fetchData();
    }
  }, [entryId]);

  const handleLoadTeam = () => {
      setEntryId(inputVal);
  };

  const renderLeagueItem = (league) => (
    <div key={league.id} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0 hover:bg-white/5 px-2 rounded transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="text-gray-400 text-sm">--</div>
        <div className="text-sm font-medium">{league.name}</div>
      </div>
      <div className="text-gray-400 text-sm">--</div>
    </div>
  );

  const leagues = data?.leagues || { classic: [], h2h: [], cup: {"matches": []} };

  return (
    <div className="w-full flex flex-col font-sans">
      <div className="p-4 border-b border-gray-800 bg-[#162032] flex gap-2 items-center">
        <label className="text-sm font-bold whitespace-nowrap">FPL ID:</label>
        <input 
            type="number" 
            className="input-field py-1 px-2 text-sm max-w-[150px]" 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
        />
        <button onClick={handleLoadTeam} className="btn-primary py-1 px-4 text-sm font-bold">Load</button>
      </div>
      
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
        <div>
          <div className="text-lg font-bold">{data?.name || "Team Name"}</div>
          <div className="text-xs text-gray-400">Gameweek 1</div>
        </div>
        <div className="flex gap-4 text-xl">
          <button>↻</button>
          <button>🏆</button>
        </div>
      </div>

      <div className="flex border-b border-gray-800 text-sm font-medium">
        <button 
          onClick={() => setTab("Leagues")} 
          className={`flex-1 py-3 text-center border-b-2 ${tab === 'Leagues' ? 'border-[#37003c] text-white' : 'border-transparent text-gray-400'}`}
        >
          Leagues
        </button>
        <button 
          onClick={() => setTab("Cups")} 
          className={`flex-1 py-3 text-center border-b-2 ${tab === 'Cups' ? 'border-[#37003c] text-white' : 'border-transparent text-gray-400'}`}
        >
          Cups
        </button>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 py-10">Loading leagues...</div>
        ) : tab === "Leagues" ? (
          <>
            <div className="bg-[#162032] rounded-xl border border-gray-800 p-2">
              <div className="text-[#6495ED] font-bold text-sm p-2 border-b border-gray-800">Classic Leagues</div>
              <div className="px-2">
                {leagues.classic.filter(l => l.league_type !== 's').map(renderLeagueItem)}
                {leagues.classic.filter(l => l.league_type !== 's').length === 0 && <div className="text-gray-500 text-xs py-2">No classic leagues.</div>}
              </div>
            </div>

            <div className="bg-[#162032] rounded-xl border border-gray-800 p-2">
              <div className="text-[#6495ED] font-bold text-sm p-2 border-b border-gray-800">Head-to-Head Leagues</div>
              <div className="px-2">
                {leagues.h2h.map(renderLeagueItem)}
                {leagues.h2h.length === 0 && <div className="text-gray-500 text-xs py-2">No H2H leagues.</div>}
              </div>
            </div>

            <div className="bg-[#162032] rounded-xl border border-gray-800 p-2">
              <div className="text-[#6495ED] font-bold text-sm p-2 border-b border-gray-800">General Leagues</div>
              <div className="px-2">
                {leagues.classic.filter(l => l.league_type === 's').map(renderLeagueItem)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#162032] rounded-xl border border-gray-800 p-2">
              <div className="text-[#6495ED] font-bold text-sm p-2 border-b border-gray-800">League Cups</div>
              <div className="px-2">
                <div className="text-gray-500 text-xs py-2">No league cups available.</div>
              </div>
            </div>

            <div className="bg-[#162032] rounded-xl border border-gray-800 p-2">
              <div className="text-[#6495ED] font-bold text-sm p-2 border-b border-gray-800">General Cups</div>
              <div className="px-2">
                 <div className="text-gray-500 text-xs py-2">No general cups available.</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
