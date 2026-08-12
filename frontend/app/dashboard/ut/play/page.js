"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";

const API_URL = "http://localhost:8000";

export default function PlayMatchPage() {
  const { addCoins } = useAppContext();
  const [squad, setSquad] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [teamRating, setTeamRating] = useState(0);

  useEffect(() => {
    const savedSquad = JSON.parse(localStorage.getItem('ut_active_squad') || '[]');
    setSquad(savedSquad);
    
    const validPlayers = savedSquad.filter(p => p !== null);
    if (validPlayers.length === 11) {
      const avg = validPlayers.reduce((sum, p) => sum + p.rating, 0) / 11;
      setTeamRating(Math.round(avg));
    }
  }, []);

  const handleSimulate = async () => {
    if (squad.filter(p => p !== null).length < 11) {
      alert("You need a full squad of 11 players to play a match!");
      return;
    }

    setSimulating(true);

    try {
      const res = await fetch(`${API_URL}/api/ut/simulate_match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squad: squad, user_id: "local_user" })
      });
      const data = await res.json();
      
      if (data.success) {
        setTimeout(() => {
          setMatchResult(data.match);
          if (data.match.home_score > data.match.away_score) {
            addCoins(500); // Win bonus
          } else if (data.match.home_score === data.match.away_score) {
            addCoins(100); // Draw bonus
          }
          setSimulating(false);
        }, 3000); // 3 seconds suspense
      } else {
        alert(data.error);
        setSimulating(false);
      }
    } catch (err) {
      console.error(err);
      setSimulating(false);
    }
  };

  const isComplete = squad.filter(p => p !== null).length === 11;

  if (matchResult) {
    const isWin = matchResult.home_score > matchResult.away_score;
    const isDraw = matchResult.home_score === matchResult.away_score;
    const coinsWon = isWin ? 500 : (isDraw ? 100 : 0);

    return (
      <div className="max-w-4xl mx-auto p-4 text-center animate-fade-in space-y-6 pt-10">
        <h1 className={`text-5xl font-black mb-2 ${isWin ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-red-400'}`}>
          {isWin ? "VICTORY!" : isDraw ? "DRAW" : "DEFEAT"}
        </h1>
        <p className="text-[var(--text-secondary)] text-xl">Match Simulation Complete</p>
        
        <div className="glass-card p-8 flex justify-between items-center max-w-2xl mx-auto my-8 border border-[var(--border-color)]">
          <div className="text-center w-1/3">
            <h2 className="font-bold text-2xl mb-2 text-[var(--accent-primary)]">Your UT</h2>
            <div className="text-6xl font-black">{matchResult.home_score}</div>
          </div>
          <div className="text-center text-3xl font-black text-[var(--text-secondary)]">-</div>
          <div className="text-center w-1/3">
            <h2 className="font-bold text-2xl mb-2 text-red-400">AI Nexus</h2>
            <div className="text-6xl font-black">{matchResult.away_score}</div>
          </div>
        </div>

        <div className="glass-card p-4 inline-block mb-8">
          <div className="text-lg text-[var(--text-secondary)]">Match Earnings</div>
          <div className="text-3xl font-black text-yellow-400">+{coinsWon} AI Coins</div>
        </div>

        <div>
          <button onClick={() => setMatchResult(null)} className="btn-primary px-8 py-3 mr-4">Play Again</button>
          <Link href="/dashboard/ut" className="btn-secondary px-8 py-3">Back to Hub</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 animate-fade-in text-center pt-10">
      <h1 className="text-4xl font-black mb-2">🏟️ Ultimate Team Match</h1>
      <p className="text-[var(--text-secondary)]">Take your custom squad onto the pitch to earn AI Coins!</p>

      {!isComplete ? (
        <div className="glass-card p-10 max-w-2xl mx-auto mt-10">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Incomplete Squad</h2>
          <p className="mb-6">You must build a full starting 11 before you can play a match.</p>
          <Link href="/dashboard/ut/squad" className="btn-primary">Go to Squad Builder</Link>
        </div>
      ) : (
        <div className="glass-card p-10 max-w-3xl mx-auto mt-10 relative overflow-hidden">
          {simulating ? (
            <div className="py-20 animate-pulse">
              <div className="text-6xl mb-4">⚽</div>
              <h2 className="text-2xl font-bold text-[var(--accent-primary)] mb-2">Simulating Match...</h2>
              <p className="text-[var(--text-secondary)]">Your AI Manager is calculating tactics and player stats.</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-10">
                <div className="w-2/5 p-4 bg-[var(--bg-secondary)] border border-[var(--accent-primary)] rounded-lg">
                  <h3 className="font-bold text-xl text-[var(--accent-primary)] mb-1">Your UT</h3>
                  <div className="text-sm text-[var(--text-secondary)]">Rating: <span className="font-bold text-white">{teamRating}</span></div>
                </div>
                <div className="text-4xl font-black italic text-gray-500">VS</div>
                <div className="w-2/5 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                  <h3 className="font-bold text-xl text-red-400 mb-1">FC Nexus (AI)</h3>
                  <div className="text-sm text-[var(--text-secondary)]">Rating: <span className="font-bold text-white">82</span></div>
                </div>
              </div>

              <button 
                onClick={handleSimulate}
                className="btn-primary w-full py-4 text-2xl font-black bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-black border-none shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:scale-105"
              >
                KICK OFF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
