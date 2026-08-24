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

  return (
    <div className="glass-card p-4">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        🤖 AI Transfer Recommender
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Buys */}
        <div className="border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] overflow-hidden">
          <div className="bg-green-500/20 px-3 py-2 border-b border-[var(--border-color)] flex items-center gap-2">
            <span className="text-green-500">📈</span>
            <span className="font-bold text-green-400 text-sm">Top Buys</span>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {data.buys && data.buys.map((p, idx) => (
              <div key={idx} className="p-3 flex justify-between items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div>
                  <div className="font-bold text-sm">{p.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{p.team} • {p.position}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--accent-primary)]">£{p.cost}m</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Form: {p.form}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sells */}
        <div className="border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] overflow-hidden">
          <div className="bg-red-500/20 px-3 py-2 border-b border-[var(--border-color)] flex items-center gap-2">
            <span className="text-red-500">📉</span>
            <span className="font-bold text-red-400 text-sm">Top Sells</span>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {data.sells && data.sells.map((p, idx) => (
              <div key={idx} className="p-3 flex justify-between items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div>
                  <div className="font-bold text-sm">{p.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{p.team} • {p.position}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--accent-primary)]">£{p.cost}m</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Form: {p.form}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
