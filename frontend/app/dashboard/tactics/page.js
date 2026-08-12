"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import VirtualTabs from "../components/VirtualTabs";

const API_URL = "http://localhost:8000";

export default function TacticsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TacticsPage />
    </Suspense>
  );
}

function TacticsPage() {
  const searchParams = useSearchParams();
  const currentSport = searchParams.get("sport") || "football";
  
  const [data, setData] = useState(null);
  const [selectedFormation, setSelectedFormation] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTactics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tactics`);
        const json = await res.json();
        
        // Handle old and new API format gracefully
        let sportData = json;
        if (json.football && json.basketball) {
          sportData = currentSport === "basketball" ? json.basketball : json.football;
        }

        setData(sportData);
        setSelectedFormation(Object.keys(sportData.formations)[0]);
        setSelectedStyle(Object.keys(sportData.tactical_styles)[0]);
        
        // Load user specific tactics
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const loadRes = await fetch(`${API_URL}/api/tactics/load?user_id=${session.user.id}`);
          const loadedData = await loadRes.json();
          if (loadedData.formation) setSelectedFormation(loadedData.formation);
          if (loadedData.style) setSelectedStyle(loadedData.style);
        }
      } catch (err) {
        console.error("Failed to load tactics", err);
      }
      setLoading(false);
    };
    fetchTactics();
  }, [currentSport]);

  const saveTactics = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      try {
        await fetch(`${API_URL}/api/tactics/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: session.user.id,
            formation: selectedFormation,
            style: selectedStyle
          })
        });
        alert("Tactics saved to database successfully! These will affect your Ultimate Team in simulations.");
      } catch (e) {
        console.error("Error saving tactics", e);
        alert("Failed to save tactics.");
      }
    } else {
      // Fallback for guests
      localStorage.setItem("user_tactics", JSON.stringify({
        formation: selectedFormation,
        style: selectedStyle
      }));
      alert("Tactics saved locally! Login to save permanently.");
    }
  };

  if (loading) return <div>Loading tactics board...</div>;
  if (!data) return <div>Error loading tactics</div>;

  const formationData = data.formations[selectedFormation] || { description: "", attack_mod: 1, defense_mod: 1, _3pt_mod: 1 };
  const styleData = data.tactical_styles[selectedStyle] || { description: "", attack_mod: 1, defense_mod: 1, foul_mod: 1, pace_mod: 1 };

  const attMod = (formationData.attack_mod * styleData.attack_mod).toFixed(2);
  const defMod = (formationData.defense_mod * styleData.defense_mod).toFixed(2);
  const foulMod = (styleData.foul_mod || 1.0).toFixed(2);
  const paceMod = (styleData.pace_mod || 1.0).toFixed(2);
  const ptMod = (formationData._3pt_mod || 1.0).toFixed(2);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-20">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Virtual Hub</h1>
        <p className="text-[var(--text-secondary)]">Set up your tactical system. Your choices will directly influence match outcomes!</p>
      </div>
      
      <VirtualTabs />

      {/* Tactics Removed the Coming Soon block, display it naturally */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
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
              <div className="text-xs text-[var(--text-secondary)]">Offense Mod</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">{defMod}x</div>
              <div className="text-xs text-[var(--text-secondary)]">Defense Mod</div>
            </div>
            {currentSport === "basketball" ? (
              <div className="text-center">
                <div className="text-2xl font-black text-white">{paceMod}x</div>
                <div className="text-xs text-[var(--text-secondary)]">Pace Mod</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-black text-white">{foulMod}x</div>
                <div className="text-xs text-[var(--text-secondary)]">Foul Mod</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
