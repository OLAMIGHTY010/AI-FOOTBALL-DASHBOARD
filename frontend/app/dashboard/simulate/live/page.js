"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";
import Pitch3D from "../components/Pitch3D";

export default function LiveBettingPage() {
  const [match, setMatch] = useState(null);
  const [minute, setMinute] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [events, setEvents] = useState([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  
  // Live Betting state
  const [liveBet, setLiveBet] = useState(null); // { team: "home" | "away" | "none", wager: 10 }
  const [nextGoalOdds, setNextGoalOdds] = useState({ home: 2.5, away: 3.0, none: 1.5 });
  const [betSettled, setBetSettled] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 3D Pitch State
  const [show3D, setShow3D] = useState(true);
  const [ballPos, setBallPos] = useState({ x: 50, y: 50 });

  const { deductCoins, playSound } = useAppContext();

  useEffect(() => {
    // Generate a mock match schedule
    const generateMatch = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setMatch(data.results[0]);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    generateMatch();
  }, []);

  // Timer loop
  useEffect(() => {
    let timer;
    if (isLive && minute < 90) {
      timer = setInterval(() => {
        setMinute(m => m + 1);
      }, 500); // Fast forward: 1 min = 0.5 sec
    } else if (isLive && minute >= 90) {
      finishMatch();
    }
    return () => clearInterval(timer);
  }, [isLive, minute]);

  // Handle events per minute
  useEffect(() => {
    if (isLive && match && minute > 0 && minute <= 90) {
      const currentEvents = match.events.filter(e => e.minute === minute);
      
      currentEvents.forEach(e => {
        setEvents(prev => [{ minute, ...e }, ...prev].slice(0, 10));
        if (e.type === "goal") {
          playSound("whistle");
          if (e.team === "home") setHomeScore(s => s + 1);
          if (e.team === "away") setAwayScore(s => s + 1);
          
          // Settle live bet if active
          if (liveBet && !betSettled) {
            if (e.team === liveBet.team) {
              const winAmount = (liveBet.wager * liveBet.odds).toFixed(2);
              let bank = parseFloat(localStorage.getItem("bankroll") || "0");
              bank += parseFloat(winAmount);
              localStorage.setItem("bankroll", bank.toString());
              window.dispatchEvent(new Event("bankrollUpdate"));
              playSound("coin");
              alert(`🎉 You won your Live Bet! ${e.team} scored next! (+£${winAmount})`);
            } else {
              alert(`😭 You lost your Live Bet. ${e.team} scored next.`);
            }
            setBetSettled(true);
            setLiveBet(null);
          }
        } else if (e.type === "red_card" || e.type === "yellow_card") {
           setBallPos({ x: e.x || 50, y: e.y || 50 });
        } else if (e.type === "corner" || e.type === "foul") {
           setBallPos({ x: e.x || (e.team === "home" ? 90 : 10), y: e.y || 50 });
        } else {
           // Random action movement
           setBallPos({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 });
        }
      });
      
      // If no events this minute, slowly move ball back to center or wander
      if (currentEvents.length === 0 && Math.random() > 0.5) {
         setBallPos({ x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 });
      }
      
      // Dynamically shift odds based on time remaining and score
      if (minute % 5 === 0 && !betSettled) {
        const timeRemaining = 90 - minute;
        // As time runs out, 'none' odds plummet, 'home/away' odds skyrocket
        const noneOdds = Math.max(1.05, 1.05 + (timeRemaining / 90));
        const homeOdds = Math.min(20.0, 2.0 + (90 / timeRemaining));
        const awayOdds = Math.min(20.0, 2.5 + (90 / timeRemaining));
        setNextGoalOdds({ home: homeOdds.toFixed(2), away: awayOdds.toFixed(2), none: noneOdds.toFixed(2) });
      }
    }
  }, [minute, isLive, match]);

  const finishMatch = () => {
    setIsLive(false);
    if (liveBet && !betSettled) {
      // If no goals were scored since the bet, 'none' wins.
      if (liveBet.team === "none") {
        const winAmount = (liveBet.wager * liveBet.odds).toFixed(2);
        let bank = parseFloat(localStorage.getItem("bankroll") || "0");
        bank += parseFloat(winAmount);
        localStorage.setItem("bankroll", bank.toString());
        window.dispatchEvent(new Event("bankrollUpdate"));
        playSound("coin");
        alert(`🎉 You won your Live Bet! No goals were scored! (+£${winAmount})`);
      } else {
        alert("😭 You lost your Live Bet. No more goals were scored.");
      }
      setBetSettled(true);
      setLiveBet(null);
    } else if (!liveBet && !betSettled) {
       alert("🏁 Full Time! Match Finished.");
    }
  };

  const placeLiveBet = (teamSelection) => {
    if (liveBet) {
      alert("You already have an active live bet for the next goal!");
      return;
    }
    const bankroll = parseFloat(localStorage.getItem("bankroll") || "0");
    const wager = 20; // Fixed £20
    if (wager > bankroll) {
      alert("Insufficient funds for a £20 live bet!");
      return;
    }

    const odds = nextGoalOdds[teamSelection];
    
    // Deduct coins
    const newBankroll = bankroll - wager;
    localStorage.setItem("bankroll", newBankroll.toString());
    window.dispatchEvent(new Event("bankrollUpdate"));
    deductCoins(wager);
    playSound("coin");
    
    setLiveBet({ team: teamSelection, wager, odds });
    setBetSettled(false);
  };

  if (loading || !match) return <div className="text-center py-20 animate-pulse font-sans">Connecting to live feed...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-sans animate-fade-in pt-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-2">
            🔴 Live In-Play Betting
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Bet on the "Next Goal" as the match happens in real-time.
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setShow3D(!show3D)} 
            className="px-4 py-2 border border-[var(--border-color)] rounded-lg font-bold text-sm hover:bg-white/5 transition-colors"
          >
            {show3D ? "🕹️ 2D View" : "🏟️ 3D View"}
          </button>
          {!isLive && minute === 0 && (
             <button onClick={() => setIsLive(true)} className="btn-primary px-8">KICK OFF</button>
          )}
          <Link href="/dashboard/simulate" className="btn-secondary px-6">Back</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scoreboard */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col items-center justify-center border-t-4 border-red-500 relative">
          <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded animate-pulse">
            LIVE {minute}'
          </div>
          
          <div className="flex w-full justify-between items-center mt-4">
            <div className="flex-1 text-center">
              <h2 className="text-3xl font-black">{match.home.name}</h2>
              <p className="text-[var(--text-secondary)]">Power: {match.home.power}</p>
            </div>
            <div className="px-8 text-5xl font-black bg-black/40 py-4 rounded-xl border border-[var(--border-color)]">
              {homeScore} - {awayScore}
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-3xl font-black">{match.away.name}</h2>
              <p className="text-[var(--text-secondary)]">Power: {match.away.power}</p>
            </div>
          </div>
          
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-800 h-2 rounded-full mt-6 overflow-hidden mb-6">
            <div 
              className="bg-red-500 h-full transition-all duration-500"
              style={{ width: `${(minute / 90) * 100}%` }}
            ></div>
          </div>
          
          {show3D && (
            <div className="w-full mt-4 border-t border-[var(--border-color)] pt-6">
              <Pitch3D ballPos={ballPos} />
            </div>
          )}
        </div>

        {/* Live Betting Odds */}
        <div className="lg:col-span-1 glass-card p-6">
          <h3 className="font-bold text-xl mb-4 text-center">Who Scores Next?</h3>
          
          <div className="space-y-4">
            <button 
              onClick={() => placeLiveBet("home")}
              disabled={!isLive || liveBet}
              className={`w-full flex justify-between items-center p-4 rounded-xl font-bold transition-all ${liveBet?.team === "home" ? 'bg-green-500 text-white' : !isLive || liveBet ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <span>{match.home.name}</span>
              <span className="text-[var(--accent-primary)]">{nextGoalOdds.home}</span>
            </button>
            
            <button 
              onClick={() => placeLiveBet("away")}
              disabled={!isLive || liveBet}
              className={`w-full flex justify-between items-center p-4 rounded-xl font-bold transition-all ${liveBet?.team === "away" ? 'bg-green-500 text-white' : !isLive || liveBet ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <span>{match.away.name}</span>
              <span className="text-[var(--accent-primary)]">{nextGoalOdds.away}</span>
            </button>
            
            <button 
              onClick={() => placeLiveBet("none")}
              disabled={!isLive || liveBet}
              className={`w-full flex justify-between items-center p-4 rounded-xl font-bold transition-all ${liveBet?.team === "none" ? 'bg-green-500 text-white' : !isLive || liveBet ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <span>No More Goals</span>
              <span className="text-[var(--accent-primary)]">{nextGoalOdds.none}</span>
            </button>
          </div>
          
          {liveBet && (
            <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Pending £{liveBet.wager} bet on {liveBet.team === "none" ? "No Goals" : liveBet.team}. To Win: £{(liveBet.wager * liveBet.odds).toFixed(2)}
            </div>
          )}
        </div>

        {/* Live Event Feed */}
        <div className="lg:col-span-3 glass-card p-6 min-h-[200px]">
          <h3 className="font-bold text-lg mb-4">Live Match Feed</h3>
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="text-gray-500 italic">Waiting for kickoff...</div>
            ) : (
              events.map((e, idx) => (
                <div key={idx} className="flex gap-4 items-center p-2 border-b border-gray-800/50">
                  <div className="font-bold text-red-400 w-12">{e.minute}'</div>
                  <div className="text-xl">
                    {e.type === "goal" ? "⚽" : e.type === "yellow_card" ? "🟨" : e.type === "red_card" ? "🟥" : "⏱️"}
                  </div>
                  <div>
                    <span className="font-bold">{e.team ? e.team.toUpperCase() : "EVENT"}: </span>
                    {e.type === "goal" ? "GOAL SCORED!" : e.type === "yellow_card" ? "Yellow card issued." : e.type === "red_card" ? "Player sent off!" : "Play continues..."}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
