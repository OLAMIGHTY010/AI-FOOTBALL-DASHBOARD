"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ProfilePage() {
  const [session, setSession] = useState(null);
  const [club, setClub] = useState([]);
  const [bankroll, setBankroll] = useState(0);
  const [fplSquad, setFplSquad] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    setClub(JSON.parse(localStorage.getItem('my_club') || '[]'));
    setBankroll(parseFloat(localStorage.getItem('bankroll') || '0'));
    setFplSquad(JSON.parse(localStorage.getItem('fpl_squad') || 'null'));
  }, []);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-bold mb-2">Not Logged In</h2>
        <p className="text-[var(--text-secondary)] mb-6">You need to sign in to view your Manager Profile.</p>
        <Link href="/" className="btn-primary px-8">Go to Login</Link>
      </div>
    );
  }

  // Trophies logic (mocked based on club size and bankroll for now)
  const trophies = [];
  if (bankroll > 1000) trophies.push({ icon: "🏆", name: "High Roller", desc: "Accumulate $1,000 Bankroll" });
  if (bankroll > 5000) trophies.push({ icon: "👑", name: "Billionaire Boys Club", desc: "Accumulate $5,000 Bankroll" });
  if (club.length > 10) trophies.push({ icon: "🏟️", name: "Squad Builder", desc: "Collect 10+ UT Players" });
  if (club.some(p => p.rating >= 90)) trophies.push({ icon: "⭐", name: "Galactico", desc: "Own a 90+ rated player" });
  if (fplSquad) trophies.push({ icon: "👔", name: "Tactician", desc: "Build an FPL Squad" });

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-10 p-8 glass-card bg-gradient-to-br from-gray-900 to-black border-l-4 border-[var(--accent-primary)]">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-black shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          {session.user.email.substring(0,2).toUpperCase()}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black text-white mb-1">{session.user.email}</h1>
          <p className="text-[var(--text-secondary)] mb-4">Joined: {new Date(session.user.created_at).toLocaleDateString()}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="bg-black/50 px-4 py-2 rounded-lg border border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-secondary)] block uppercase font-bold">Net Worth</span>
              <span className="text-xl font-black text-[var(--accent-primary)]">${bankroll.toFixed(2)}</span>
            </div>
            <div className="bg-black/50 px-4 py-2 rounded-lg border border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-secondary)] block uppercase font-bold">Club Size</span>
              <span className="text-xl font-black text-white">{club.length} Players</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trophies */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Trophy Cabinet</h2>
          {trophies.length === 0 ? (
            <p className="text-[var(--text-secondary)] italic">Play the game to earn trophies!</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {trophies.map((t, i) => (
                <div key={i} className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5">
                  <div className="text-3xl drop-shadow-md">{t.icon}</div>
                  <div>
                    <div className="font-bold text-sm text-white">{t.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Players */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Top Club Players</h2>
          {club.length === 0 ? (
            <p className="text-[var(--text-secondary)] italic">Open packs to get players!</p>
          ) : (
            <div className="space-y-3">
              {club.sort((a,b) => b.rating - a.rating).slice(0, 4).map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${p.rating >= 85 ? 'bg-yellow-500 text-black' : p.rating >= 75 ? 'bg-gray-300 text-black' : 'bg-[#cd7f32] text-white'}`}>
                      {p.rating}
                    </div>
                    <span className="font-bold text-sm">{p.name}</span>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">{p.position} | {p.team}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
