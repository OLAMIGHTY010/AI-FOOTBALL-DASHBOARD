"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

export default function UTPlayPage() {
  const [squad, setSquad] = useState([]);
  const [teamRating, setTeamRating] = useState(0);
  const [matchState, setMatchState] = useState("prematch"); // prematch, playing, postmatch
  const [minute, setMinute] = useState(0);
  const [score, setScore] = useState({ home: 0, away: 0 }); // Home = User, Away = AI
  const [events, setEvents] = useState([]);
  
  const AI_RATING = 82;
  const AI_TEAM_NAME = "FC Nexus (AI)";

  useEffect(() => {
    const savedSquad = JSON.parse(localStorage.getItem("my_squad") || "null");
    if (savedSquad && savedSquad.length === 11 && !savedSquad.includes(null)) {
      setSquad(savedSquad);
      const total = savedSquad.reduce((acc, p) => acc + p.rating, 0);
      setTeamRating(Math.round(total / 11));
    }
  }, []);

  const simulateMatch = () => {
    if (squad.length !== 11) return;
    
    setMatchState("playing");
    setMinute(0);
    setScore({ home: 0, away: 0 });
    setEvents([]);

    // We will do a fast 15-second simulation loop (6 mins per tick)
    let currentMin = 0;
    let homeG = 0;
    let awayG = 0;
    const newEvents = [];

    const interval = setInterval(() => {
      currentMin += 6;
      
      // Goal logic based on ratings
      // Higher rating = higher chance to score every 6 minutes
      const homeChance = (teamRating / 100) * 0.15;
      const awayChance = (AI_RATING / 100) * 0.15;

      if (Math.random() < homeChance) {
        homeG += 1;
        const scorer = squad[Math.floor(Math.random() * squad.length)].name;
        newEvents.push({ minute: currentMin, text: `⚽ GOAL! ${scorer} scores for your UT!`, team: "home" });
        setScore({ home: homeG, away: awayG });
      } else if (Math.random() < awayChance) {
        awayG += 1;
        newEvents.push({ minute: currentMin, text: `🔴 GOAL! ${AI_TEAM_NAME} scores.`, team: "away" });
        setScore({ home: homeG, away: awayG });
      }

      setMinute(currentMin);
      setEvents([...newEvents].reverse());

      if (currentMin >= 90) {
        clearInterval(interval);
        handlePostMatch(homeG, awayG);
      }
    }, 500); // Fast simulation tick
  };

  const handlePostMatch = async (h, a) => {
    setMatchState("postmatch");
    
    let payout = 0;
    let resultText = "";
    if (h > a) {
      payout = 500;
      resultText = "YOU WON!";
    } else if (h === a) {
      payout = 150;
      resultText = "DRAW";
    } else {
      payout = 0;
      resultText = "YOU LOST!";
    }

    if (payout > 0) {
      let currentBankroll = parseFloat(localStorage.getItem("bankroll") || "0");
      currentBankroll += payout;
      localStorage.setItem("bankroll", currentBankroll.toString());
      window.dispatchEvent(new Event("storage"));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("wallets").update({ balance: currentBankroll }).eq("user_id", session.user.id);
      }
      
      setTimeout(() => alert(`Match finished: ${resultText}\nYou earned $${payout} for your club!`), 500);
    } else {
      setTimeout(() => alert(`Match finished: ${resultText}\nBetter luck next time.`), 500);
    }
  };

  if (squad.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--text-secondary)] animate-fade-in">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4 text-white">Incomplete Squad</h2>
        <p className="mb-6">You must build a full Starting 11 before playing Manager Mode.</p>
        <Link href="/dashboard/ut/squad" className="btn-primary">Go to Squad Builder</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">👔 Manager Mode</h1>
        <p className="text-[var(--text-secondary)]">Take your Ultimate Team to the pitch and earn bankroll.</p>
      </div>

      <div className="glass-card mb-8">
        <div className="flex justify-between items-center px-4 md:px-12 py-8">
          {/* User Team */}
          <div className="text-center flex-1">
            <div className="text-5xl font-black text-[var(--accent-primary)] mb-2">{teamRating}</div>
            <div className="font-bold text-xl">My Ultimate Team</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Managed by You</div>
          </div>

          {/* VS */}
          <div className="text-4xl font-black text-[var(--text-secondary)] opacity-50 px-8">
            VS
          </div>

          {/* AI Team */}
          <div className="text-center flex-1">
            <div className="text-5xl font-black text-red-500 mb-2">{AI_RATING}</div>
            <div className="font-bold text-xl">{AI_TEAM_NAME}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">World Class AI</div>
          </div>
        </div>

        {matchState === "prematch" && (
          <div className="border-t border-[var(--border-color)] p-6 text-center">
            <h3 className="font-bold mb-2">Match Rewards</h3>
            <div className="flex justify-center gap-6 mb-6 text-sm text-[var(--text-secondary)]">
              <div>Win: <strong className="text-green-400">$500</strong></div>
              <div>Draw: <strong className="text-yellow-400">$150</strong></div>
              <div>Loss: <strong className="text-red-400">$0</strong></div>
            </div>
            <button onClick={simulateMatch} className="btn-primary px-12 py-4 text-xl">
              ▶ START MATCH
            </button>
          </div>
        )}

        {(matchState === "playing" || matchState === "postmatch") && (
          <div className="border-t border-[var(--border-color)] p-0">
            <div className="bg-black/40 p-6 flex justify-between items-center text-center">
              <div className="flex-1 text-5xl font-black text-[var(--accent-primary)]">{score.home}</div>
              <div className="flex flex-col items-center mx-4">
                <div className={`text-3xl font-mono font-bold ${matchState === "playing" ? "text-white animate-pulse" : "text-[var(--text-secondary)]"}`}>
                  {matchState === "playing" ? `${minute}'` : "FT"}
                </div>
                {matchState === "playing" && <div className="text-[10px] text-red-500 font-bold tracking-widest mt-1 uppercase">Live Simulation</div>}
              </div>
              <div className="flex-1 text-5xl font-black text-red-500">{score.away}</div>
            </div>
            
            <div className="p-4 h-64 overflow-y-auto bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
              {events.length === 0 ? (
                <div className="text-center text-[var(--text-secondary)] py-8">Kicking off...</div>
              ) : (
                events.map((e, idx) => (
                  <div key={idx} className="flex gap-4 mb-3 text-sm animate-fade-in">
                    <div className="font-bold text-[var(--accent-primary)] w-8 text-right">{e.minute}'</div>
                    <div className={e.team === 'home' ? 'text-white font-bold' : 'text-red-300'}>{e.text}</div>
                  </div>
                ))
              )}
            </div>
            
            {matchState === "postmatch" && (
              <div className="p-4 text-center border-t border-[var(--border-color)] bg-black/20">
                <button onClick={() => setMatchState("prematch")} className="btn-secondary">
                  Play Another Match
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
