"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

export default function TacticsPage() {
  const [data, setData] = useState(null);
  const [selectedFormation, setSelectedFormation] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTactics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tactics`);
        const json = await res.json();
        setData(json);
        setSelectedFormation(Object.keys(json.formations)[0]);
        setSelectedStyle(Object.keys(json.tactical_styles)[0]);
      } catch (err) {
        console.error("Failed to load tactics", err);
      }
      setLoading(false);
    };
    fetchTactics();
  }, []);

  const saveTactics = () => {
    // In a real app we'd save to Supabase here
    localStorage.setItem("user_tactics", JSON.stringify({
      formation: selectedFormation,
      style: selectedStyle
    }));
    alert("Tactics saved successfully! These will affect your team in simulations.");
  };

  if (loading) return <div>Loading tactics board...</div>;
  if (!data) return <div>Error loading tactics</div>;

  const formationData = data.formations[selectedFormation];
  const styleData = data.tactical_styles[selectedStyle];

  const attMod = (formationData.attack_mod * styleData.attack_mod).toFixed(2);
  const defMod = (formationData.defense_mod * styleData.defense_mod).toFixed(2);
  const foulMod = styleData.foul_mod.toFixed(2);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">👔 Manager Mode</h1>
        <p className="text-[var(--text-secondary)]">
          Set up your tactical system. Your choices will directly influence match outcomes in the Sportsbook!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card">
          <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Select Setup</h2>
          
          <div className="mb-4">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Formation</label>
            <select 
              value={selectedFormation} 
              onChange={(e) => setSelectedFormation(e.target.value)}
              className="select-field w-full"
            >
              {Object.keys(data.formations).map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Tactical Style</label>
            <select 
              value={selectedStyle} 
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="select-field w-full"
            >
              {Object.keys(data.tactical_styles).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button onClick={saveTactics} className="btn-primary w-full">
            Lock In Tactics
          </button>
        </div>

        <div className="glass-card">
          <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Analysis</h2>
          
          <div className="mb-4">
            <h3 className="font-bold text-[var(--accent-primary)]">Formation: {selectedFormation}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{formationData.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-[var(--accent-primary)]">Style: {selectedStyle}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{styleData.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-[var(--border-color)] pt-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{attMod}x</div>
              <div className="text-xs text-[var(--text-secondary)]">Attack Mod</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">{defMod}x</div>
              <div className="text-xs text-[var(--text-secondary)]">Defense Mod</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">{foulMod}x</div>
              <div className="text-xs text-[var(--text-secondary)]">Foul Mod</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
