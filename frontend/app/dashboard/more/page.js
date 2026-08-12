"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MorePage() {
  const [tab, setTab] = useState("Tools");

  const tools = [
    { name: "Gameweek History", icon: "📊" },
    { name: "Transfer History", icon: "🔄" },
    { name: "Watchlist", icon: "⭐" },
    { name: "Statistics", icon: "📈" },
    { name: "PL Table", icon: "📋" },
    { name: "FDR Table", icon: "🗓️" },
    { name: "Set Piece Takers", icon: "🎯" },
    { name: "Favourites", icon: "❤️" },
    { name: "Notes", icon: "📝" },
    { name: "Find by ID", icon: "🔍" },
    { name: "Update User Details", icon: "👤" },
  ];

  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fpl/bootstrap");
        const json = await res.json();
        
        if (json.elements) {
            const sortedIn = [...json.elements].sort((a, b) => b.transfers_in_event - a.transfers_in_event);
            const sortedOut = [...json.elements].sort((a, b) => b.transfers_out_event - a.transfers_out_event);
            const sortedInjuries = [...json.elements].filter(p => p.news).sort((a, b) => new Date(b.news_added || 0) - new Date(a.news_added || 0));

            setStatuses([
              { name: `Top Transfers In: ${sortedIn[0]?.web_name} (+${sortedIn[0]?.transfers_in_event})`, icon: "⬆️" },
              { name: `Top Transfers Out: ${sortedOut[0]?.web_name} (-${sortedOut[0]?.transfers_out_event})`, icon: "⬇️" },
              { name: `Latest Injury: ${sortedInjuries[0]?.web_name} (${sortedInjuries[0]?.news})`, icon: "🚑" },
              { name: `Most Selected: ${[...json.elements].sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))[0]?.web_name}`, icon: "⭐" },
            ]);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    if (tab === "Status") {
      fetchStatus();
    }
  }, [tab]);

  return (
    <div className="w-full flex flex-col font-sans">
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
        <div className="text-lg font-bold">More</div>
        <div className="flex gap-4 text-xl">
          <button>⚙️</button>
        </div>
      </div>

      <div className="flex border-b border-gray-800 text-sm font-medium">
        <button 
          onClick={() => setTab("Tools")} 
          className={`flex-1 py-3 text-center border-b-2 ${tab === 'Tools' ? 'border-[#37003c] text-white' : 'border-transparent text-gray-400'}`}
        >
          Tools
        </button>
        <button 
          onClick={() => setTab("Status")} 
          className={`flex-1 py-3 text-center border-b-2 ${tab === 'Status' ? 'border-[#37003c] text-white' : 'border-transparent text-gray-400'}`}
        >
          Status
        </button>
      </div>

      <div className="p-4">
        {tab === "Tools" ? (
          <div className="space-y-2">
            {tools.map(tool => (
              <div key={tool.name} className="bg-[#162032] p-4 rounded-xl border border-gray-800 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tool.icon}</span>
                  <span className="font-bold text-sm">{tool.name}</span>
                </div>
                <span className="text-gray-500">›</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#162032] p-4 rounded-xl border border-gray-800">
                <div className="text-[#6495ED] font-bold text-sm mb-4">Latest Status Updates</div>
                <div className="space-y-2">
                    {loading ? (
                        <div className="text-gray-400 py-4 text-center">Loading live FPL data...</div>
                    ) : statuses.length > 0 ? (
                        statuses.map(status => (
                            <div key={status.name} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0 cursor-pointer hover:bg-white/5 px-2 rounded">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{status.icon}</span>
                                    <span className="font-medium text-sm">{status.name}</span>
                                </div>
                                <span className="text-gray-500">›</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-400 py-4 text-center">No status updates available.</div>
                    )}
                </div>
            </div>
            
            <div className="bg-[#162032] p-4 rounded-xl border border-gray-800">
                <div className="text-center">
                    <p className="text-sm text-gray-300">Data automatically updates directly from the official FPL API.</p>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
