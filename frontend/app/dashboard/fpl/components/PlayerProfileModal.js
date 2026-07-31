"use client";
import { useState, useEffect } from "react";

export default function PlayerProfileModal({ player, onClose, session }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/players/${player.id}/profile`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error("Failed to fetch player profile", err);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [player.id, session]);

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target.id === "modal-backdrop") {
      onClose();
    }
  };

  const getFdrColor = (fdr) => {
    switch(fdr) {
      case 1: return "bg-green-600 text-white"; // Easy
      case 2: return "bg-green-400 text-black"; // Good
      case 3: return "bg-gray-300 text-black";  // Neutral
      case 4: return "bg-orange-500 text-white"; // Hard
      case 5: return "bg-red-600 text-white"; // Extreme
      default: return "bg-gray-300 text-black";
    }
  };

  const getPriceIndicator = (ownership) => {
    if (!ownership) return null;
    const own = parseFloat(ownership);
    if (own > 15) return <span className="text-green-500 text-[10px] font-black ml-1" title="Price Rise">↑</span>;
    if (own < 2) return <span className="text-red-500 text-[10px] font-black ml-1" title="Price Fall">↓</span>;
    return null;
  };

  return (
    <div 
      id="modal-backdrop" 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="glass-card bg-gradient-to-br from-[var(--bg-card)] to-[#1a1a2e] border-[var(--border-color)] p-6 rounded-2xl w-full max-w-lg relative animate-fadeIn shadow-2xl">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        {loading ? (
          <div className="py-20 text-center text-[var(--text-secondary)]">Loading player data...</div>
        ) : profileData ? (
          <div className="space-y-6">
            
            {/* Header / Info */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-b from-white to-gray-300 rounded-full flex items-center justify-center p-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <img 
                  src={player.photo || "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"}
                  alt={player.name}
                  className="w-full h-full object-contain drop-shadow-md"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_0-66.webp"; }}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-white leading-tight mb-1">{player.name}</h2>
                <div className="text-[var(--text-secondary)] font-bold text-sm mb-2 uppercase tracking-wide">
                  {profileData.player?.real_teams?.name || player.team} • {player.position}
                </div>
                <div className="flex gap-4">
                  <div className="bg-black/40 px-3 py-1 rounded border border-white/10">
                    <span className="text-xs text-gray-400 block">Price</span>
                    <span className="font-bold text-[var(--accent-primary)] flex items-center">
                      £{player.current_price.toFixed(1)}m
                      {getPriceIndicator(profileData.player?.selected_by_percent)}
                    </span>
                  </div>
                  <div className="bg-black/40 px-3 py-1 rounded border border-white/10">
                    <span className="text-xs text-gray-400 block">Selected by</span>
                    <span className="font-bold text-white">{profileData.player?.selected_by_percent || 0.0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Scouting Report */}
            <div className="bg-[#37003c] p-4 rounded-xl border border-[#00ff87]/30 shadow-inner relative overflow-hidden">
              <div className="absolute -top-6 -right-6 text-9xl text-white/5 font-serif font-black select-none pointer-events-none">”</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🤖</span>
                <h3 className="font-bold text-[var(--accent-primary)] text-sm tracking-widest uppercase">AI Scouting Report</h3>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed relative z-10 italic">
                "{profileData.scouting_report}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Form History */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-sm text-[var(--text-secondary)] mb-3 uppercase tracking-wide">Recent Form (Last 5)</h4>
                <div className="flex items-end justify-between h-20 gap-2">
                  {profileData.form_history.map((pts, i) => {
                    const height = Math.max((pts / 15) * 100, 10);
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-8 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {pts} pts
                        </div>
                        <div 
                          className="w-full bg-[var(--accent-primary)] rounded-t opacity-80 group-hover:opacity-100 transition-all"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="text-[10px] text-gray-500 mt-1">GW{i+1}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Fixture Difficulty */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-sm text-[var(--text-secondary)] mb-3 uppercase tracking-wide">Upcoming Fixtures</h4>
                <div className="space-y-2">
                  {profileData.fixtures.map((fix, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300">GW{i+6}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-12 text-right">{fix.opp}</span>
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black shadow-inner ${getFdrColor(fix.fdr)}`}>
                          {fix.fdr}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-red-500">Error loading profile data.</div>
        )}
      </div>
    </div>
  );
}
