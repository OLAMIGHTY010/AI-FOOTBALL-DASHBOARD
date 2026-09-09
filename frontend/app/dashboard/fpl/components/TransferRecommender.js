"use client";
import { useState, useEffect } from "react";

export default function TransferRecommender() {
  const [data, setData] = useState({ buys: [], sells: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/fpl/recommender")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching transfer recommender:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-sm text-[var(--text-secondary)]">Analyzing transfer market...</div>;
  }

  const getPercentageColor = (pct) => {
    if (pct >= 70) return "bg-green-500";
    if (pct >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="glass-card p-4 border-t-4 border-[var(--accent-primary)] shadow-[0_0_15px_rgba(0,255,170,0.1)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-lg flex items-center gap-2">
          🤖 AI Transfer Recommender
        </h3>
        <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded border border-[var(--border-color)]">
          Live FPL Data
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Buys */}
        <div className="border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-green-500/20 to-transparent px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-2">
            <span className="text-green-500 text-xl">📈</span>
            <div>
              <div className="font-black text-green-400 text-sm uppercase tracking-wide">Top Buys</div>
              <div className="text-[10px] text-[var(--text-secondary)]">AI Recommended Additions</div>
            </div>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {data.buys && data.buys.map((p, idx) => (
              <div key={idx} className="p-3 hover:bg-[var(--bg-primary)]/80 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-bold text-sm text-white">{p.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-bold">{p.team} • {p.position}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[var(--accent-primary)]">£{p.cost}m</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">Form: {p.form}</div>
                  </div>
                </div>
                {/* AI Progress Bar */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-black/50 rounded-full h-1.5 border border-white/5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getPercentageColor(p.ai_percentage)} shadow-[0_0_5px_currentColor]`} 
                      style={{ width: `${p.ai_percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] font-black w-8 text-right text-[var(--text-secondary)]">
                    {p.ai_percentage}%
                  </div>
                </div>
              </div>
            ))}
            {(!data.buys || data.buys.length === 0) && (
              <div className="p-4 text-center text-xs text-[var(--text-secondary)]">No recommendations available.</div>
            )}
          </div>
        </div>

        {/* Top Sells */}
        <div className="border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-red-500/20 to-transparent px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-2">
            <span className="text-red-500 text-xl">📉</span>
            <div>
              <div className="font-black text-red-400 text-sm uppercase tracking-wide">Top Sells</div>
              <div className="text-[10px] text-[var(--text-secondary)]">AI Recommended Drops</div>
            </div>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {data.sells && data.sells.map((p, idx) => (
              <div key={idx} className="p-3 hover:bg-[var(--bg-primary)]/80 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-bold text-sm text-white">{p.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-bold">{p.team} • {p.position}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[var(--accent-primary)]">£{p.cost}m</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">Form: {p.form}</div>
                  </div>
                </div>
                {/* AI Progress Bar */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-black/50 rounded-full h-1.5 border border-white/5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getPercentageColor(p.ai_percentage)} shadow-[0_0_5px_currentColor]`} 
                      style={{ width: `${p.ai_percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] font-black w-8 text-right text-[var(--text-secondary)]">
                    {p.ai_percentage}%
                  </div>
                </div>
              </div>
            ))}
            {(!data.sells || data.sells.length === 0) && (
              <div className="p-4 text-center text-xs text-[var(--text-secondary)]">No recommendations available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
