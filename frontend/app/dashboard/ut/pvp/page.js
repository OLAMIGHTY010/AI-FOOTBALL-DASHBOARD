"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

export default function PvPPage() {
  const [squad, setSquad] = useState([]);
  const [teamRating, setTeamRating] = useState(0);
  const [lobbies, setLobbies] = useState([]);
  const [view, setView] = useState("browse"); // browse, creating, waiting, simulating, result
  const [myLobbyId, setMyLobbyId] = useState(null);
  const [wagerAmount, setWagerAmount] = useState(100);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  // Simulation State
  const [simulationEvents, setSimulationEvents] = useState([]);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [activeSimulationInterval, setActiveSimulationInterval] = useState(null);

  useEffect(() => {
    // Load Squad
    const savedSquad = JSON.parse(localStorage.getItem("my_squad") || "null");
    if (savedSquad && savedSquad.length === 11 && !savedSquad.includes(null)) {
      setSquad(savedSquad);
      const total = savedSquad.reduce((acc, p) => acc + p.rating, 0);
      setTeamRating(Math.round(total / 11));
    }

    // Load User
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserProfile(session.user);
      }
    };
    fetchUser();

    fetchLobbies();
    const interval = setInterval(fetchLobbies, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLobbies = async () => {
    if (view !== "browse") return;
    try {
      const res = await fetch(`${API_URL}/api/pvp/lobbies`);
      const data = await res.json();
      setLobbies(data);
    } catch (err) {
      console.error("Failed to fetch lobbies");
    }
  };

  // Poll for result if waiting
  useEffect(() => {
    if (view === "waiting" && myLobbyId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/pvp/status/${myLobbyId}`);
          const data = await res.json();
          if (data.status === "resolved") {
            setMatchResult(data);
            startSimulation(data, true);
          }
        } catch (err) {
          console.error(err);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [view, myLobbyId]);

  const handlePayout = async (data, isCreator) => {
    const iWon = (isCreator && data.result.winner === "creator") || (!isCreator && data.result.winner === "joiner");
    const isDraw = data.result.winner === "draw";
    
    if (iWon || isDraw) {
      let currentBankroll = parseFloat(localStorage.getItem("bankroll") || "0");
      currentBankroll += data.result.payout;
      localStorage.setItem("bankroll", currentBankroll.toString());
      window.dispatchEvent(new Event("storage"));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("wallets").update({ balance: currentBankroll }).eq("user_id", session.user.id);
      }
    }
  };

  const deductWager = async (amount) => {
    let currentBankroll = parseFloat(localStorage.getItem("bankroll") || "0");
    if (currentBankroll < amount) return false;

    currentBankroll -= amount;
    localStorage.setItem("bankroll", currentBankroll.toString());
    window.dispatchEvent(new Event("storage"));

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("wallets").update({ balance: currentBankroll }).eq("user_id", session.user.id);
    }
    return true;
  };

  const createLobby = async () => {
    setLoading(true);
    const canAfford = await deductWager(wagerAmount);
    if (!canAfford) {
      alert("Insufficient funds!");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/pvp/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userProfile?.id || "guest",
          username: userProfile?.email?.split("@")[0] || "Guest Manager",
          wager: wagerAmount,
          team_rating: teamRating
        })
      });
      const data = await res.json();
      setMyLobbyId(data.lobby_id);
      setView("waiting");
    } catch (err) {
      console.error(err);
      alert("Failed to create lobby");
    }
    setLoading(false);
  };

  const joinLobby = async (lobby) => {
    if (userProfile?.id === lobby.creator_id) {
      alert("You cannot join your own lobby! Open a second browser window to test.");
      return;
    }

    const canAfford = await deductWager(lobby.wager);
    if (!canAfford) {
      alert("Insufficient funds to match this wager!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/pvp/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobby_id: lobby.id,
          user_id: userProfile?.id || "guest2",
          username: userProfile?.email?.split("@")[0] || "Challenger",
          team_rating: teamRating
        })
      });
      const data = await res.json();
      setMatchResult(data);
      startSimulation(data, false);
    } catch (err) {
      console.error(err);
      alert("Failed to join lobby or lobby closed.");
    }
  };

  const startSimulation = (data, isCreator) => {
    const winner = data.result.winner;
    const eventsToPlay = [];
    
    if (winner === "creator") {
       eventsToPlay.push({ min: 23, text: "GOAL! Great strike by the creator team!", team: "home" });
       eventsToPlay.push({ min: 67, text: "GOAL! A beautiful team play finishes in the net!", team: "home" });
    } else if (winner === "joiner") {
       eventsToPlay.push({ min: 34, text: "GOAL! Challenger breaks the deadlock!", team: "away" });
       eventsToPlay.push({ min: 82, text: "GOAL! That surely seals it for the challenger!", team: "away" });
    } else {
       eventsToPlay.push({ min: 41, text: "GOAL! Creator takes the lead!", team: "home" });
       eventsToPlay.push({ min: 76, text: "GOAL! Challenger equalizes late in the game!", team: "away" });
    }

    setSimulationEvents(eventsToPlay);
    setCurrentMinute(0);
    setScore({ home: 0, away: 0 });
    setView("simulating");

    let min = 0;
    let hScore = 0;
    let aScore = 0;
    
    const interval = setInterval(() => {
      min += 2; // 45 seconds to reach 90 minutes
      if (min >= 90) {
        clearInterval(interval);
        setTimeout(() => {
           setView("result");
           handlePayout(data, isCreator);
        }, 1500);
      }
      
      const eventThisMinute = eventsToPlay.find(e => e.min === min || e.min === min - 1);
      if (eventThisMinute) {
         if (eventThisMinute.team === "home") hScore++;
         if (eventThisMinute.team === "away") aScore++;
         setScore({ home: hScore, away: aScore });
      }
      setCurrentMinute(min > 90 ? 90 : min);
    }, 1000);
    
    setActiveSimulationInterval(interval);
  };

  const skipSimulation = () => {
    if (activeSimulationInterval) {
      clearInterval(activeSimulationInterval);
    }
    setCurrentMinute(90);
    // Determine final score based on winner
    const winner = matchResult.result.winner;
    if (winner === "creator") setScore({ home: 2, away: 0 });
    else if (winner === "joiner") setScore({ home: 0, away: 2 });
    else setScore({ home: 1, away: 1 });
    
    setTimeout(() => {
      setView("result");
      const isCreator = userProfile?.id === matchResult.creator_id;
      handlePayout(matchResult, isCreator);
    }, 500);
  };

  if (squad.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--text-secondary)] animate-fade-in">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4 text-white">Incomplete Squad</h2>
        <p className="mb-6">You must build a full Starting 11 before playing Multiplayer.</p>
        <Link href="/dashboard/ut/squad" className="btn-primary">Go to Squad Builder</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🌐 Multiplayer Arena</h1>
        <p className="text-[var(--text-secondary)]">Wager your Ultimate Team against real managers.</p>
      </div>

      {view === "browse" && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Open Challenges</h2>
            <button onClick={() => setView("creating")} className="btn-primary">
              + Create Wager Match
            </button>
          </div>

          {lobbies.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              <p>No open matches found. Be the first to create one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lobbies.map(lobby => (
                <div key={lobby.id} className="flex justify-between items-center bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
                  <div>
                    <div className="font-bold text-lg">{lobby.creator_name}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Team Rating: <span className="text-[var(--accent-primary)] font-bold">{lobby.creator_rating}</span></div>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div>
                      <div className="text-xs text-[var(--text-secondary)]">Wager</div>
                      <div className="font-bold text-xl text-yellow-400">${lobby.wager}</div>
                    </div>
                    <button onClick={() => joinLobby(lobby)} className="btn-secondary !bg-green-600 hover:!bg-green-500 !text-white border-0">
                      Accept Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "creating" && (
        <div className="glass-card p-8 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">Create Wager Match</h2>
          <div className="mb-6 text-left">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Wager Amount ($)</label>
            <input 
              type="number" 
              value={wagerAmount} 
              onChange={e => setWagerAmount(Number(e.target.value))}
              className="w-full bg-black/30 border border-[var(--border-color)] rounded-lg p-3 text-xl font-bold focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              The winner takes the total pot minus a 10% company fee.
            </p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setView("browse")} className="btn-secondary flex-1">Cancel</button>
            <button onClick={createLobby} disabled={loading} className="btn-primary flex-1">
              {loading ? "Posting..." : "Post Challenge"}
            </button>
          </div>
        </div>
      )}

      {view === "waiting" && (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Waiting for Opponent...</h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Your ${wagerAmount} wager is active. Waiting for another manager to accept.
          </p>
          <p className="text-xs text-yellow-400 bg-yellow-400/10 p-3 rounded max-w-xs mx-auto">
            Test mode: Open an Incognito window, log in to a second account, and accept this match!
          </p>
        </div>
      )}

      {view === "simulating" && matchResult && (
        <div className="animate-fade-in max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">📺 Live Wager Match</h2>
          </div>
          
          <div className="glass-card bg-gradient-to-b from-black to-[#0a0a0a] border border-[var(--border-color)] p-0 overflow-hidden rounded-xl">
            {/* Scoreboard Header */}
            <div className="flex justify-between items-center p-4 bg-black/60 border-b border-white/10">
              <div className="flex-1 text-right">
                <div className="font-black text-xl md:text-2xl truncate">{matchResult.creator_name}</div>
                <div className="text-sm text-[var(--accent-primary)] font-bold">OVR: {matchResult.creator_rating}</div>
              </div>
              <div className="px-6 py-2 bg-black rounded-lg border border-[var(--accent-primary)] mx-4 flex flex-col items-center">
                <span className="text-sm font-bold text-red-500 animate-pulse mb-1">{currentMinute}'</span>
                <span className="text-3xl font-black gradient-text">
                  {score.home} - {score.away}
                </span>
              </div>
              <div className="flex-1 text-left">
                <div className="font-black text-xl md:text-2xl truncate">{matchResult.joiner_name}</div>
                <div className="text-sm text-red-500 font-bold">OVR: {matchResult.joiner_rating}</div>
              </div>
            </div>

            {/* Pitch Container */}
            <div className="relative w-full h-[300px] md:h-[400px] bg-gradient-to-r from-[#1b4d2e] via-[#225c38] to-[#1b4d2e] overflow-hidden">
              {/* Grass Stripes Pattern */}
              <div className="absolute inset-0 opacity-20" style={{ background: 'repeating-linear-gradient(to right, transparent, transparent 10%, rgba(255,255,255,0.1) 10%, rgba(255,255,255,0.1) 20%)' }}></div>
              
              {/* Field Markings */}
              <div className="absolute top-4 bottom-4 left-4 right-4 border-2 border-white/40 pointer-events-none"></div>
              <div className="absolute top-4 bottom-4 left-1/2 w-0 border-l-2 border-white/40 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/40 rounded-full pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/70 rounded-full pointer-events-none"></div>
              <div className="absolute top-1/2 -translate-y-1/2 left-4 w-1/6 h-1/2 border-2 border-l-0 border-white/40 pointer-events-none"></div>
              <div className="absolute top-1/2 -translate-y-1/2 left-4 w-1/12 h-1/4 border-2 border-l-0 border-white/40 pointer-events-none"></div>
              <div className="absolute top-1/2 -translate-y-1/2 right-4 w-1/6 h-1/2 border-2 border-r-0 border-white/40 pointer-events-none"></div>
              <div className="absolute top-1/2 -translate-y-1/2 right-4 w-1/12 h-1/4 border-2 border-r-0 border-white/40 pointer-events-none"></div>

              {/* Creator Team (Left Side - 4-4-2) */}
              <div className="absolute left-[8%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${8 + Math.random()*2}%`, top: `${50 + Math.random()*5 - 2.5}%`}}></div>
              <div className="absolute left-[20%] top-[20%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${20 + Math.random()*5}%`, top: `${20 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute left-[18%] top-[40%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${18 + Math.random()*5}%`, top: `${40 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute left-[18%] top-[60%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${18 + Math.random()*5}%`, top: `${60 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute left-[20%] top-[80%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${20 + Math.random()*5}%`, top: `${80 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute left-[35%] top-[25%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${35 + Math.random()*15}%`, top: `${25 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute left-[32%] top-[42%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${32 + Math.random()*15}%`, top: `${42 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute left-[32%] top-[58%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${32 + Math.random()*15}%`, top: `${58 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute left-[35%] top-[75%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${35 + Math.random()*15}%`, top: `${75 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute left-[45%] top-[40%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${45 + Math.random()*30}%`, top: `${40 + Math.random()*20 - 10}%`}}></div>
              <div className="absolute left-[45%] top-[60%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ left: `${45 + Math.random()*30}%`, top: `${60 + Math.random()*20 - 10}%`}}></div>

              {/* Joiner Team (Right Side - 4-4-2) */}
              <div className="absolute right-[8%] top-[50%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${8 + Math.random()*2}%`, top: `${50 + Math.random()*5 - 2.5}%`}}></div>
              <div className="absolute right-[20%] top-[20%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${20 + Math.random()*5}%`, top: `${20 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute right-[18%] top-[40%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${18 + Math.random()*5}%`, top: `${40 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute right-[18%] top-[60%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${18 + Math.random()*5}%`, top: `${60 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute right-[20%] top-[80%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${20 + Math.random()*5}%`, top: `${80 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute right-[35%] top-[25%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${35 + Math.random()*15}%`, top: `${25 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute right-[32%] top-[42%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${32 + Math.random()*15}%`, top: `${42 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute right-[32%] top-[58%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${32 + Math.random()*15}%`, top: `${58 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute right-[35%] top-[75%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${35 + Math.random()*15}%`, top: `${75 + Math.random()*10 - 5}%`}}></div>
              <div className="absolute right-[45%] top-[40%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${45 + Math.random()*30}%`, top: `${40 + Math.random()*20 - 10}%`}}></div>
              <div className="absolute right-[45%] top-[60%] translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000" style={{ right: `${45 + Math.random()*30}%`, top: `${60 + Math.random()*20 - 10}%`}}></div>

              {/* Soccer Ball */}
              <div className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none transition-all duration-500 z-10" 
                style={{ 
                  left: `${30 + Math.random()*40}%`, 
                  top: `${20 + Math.random()*60}%`,
                  backgroundImage: 'radial-gradient(circle at 30% 30%, #fff, #ddd)',
                  boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4)'
                }}>
              </div>
              
              {/* Live Events Overlay */}
              {simulationEvents.filter(e => currentMinute >= e.min && currentMinute <= e.min + 8).map((e, idx) => (
                <div key={idx} className="absolute inset-x-0 bottom-10 flex justify-center animate-fade-in pointer-events-none z-20">
                  <div className={`px-6 py-2 rounded-full font-black text-white shadow-2xl ${e.team === 'home' ? 'bg-blue-600/90 border-2 border-blue-400' : 'bg-red-600/90 border-2 border-red-400'}`}>
                    {e.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "result" && matchResult && (
        <div className="glass-card p-8 text-center animate-fade-in">
          <h2 className="text-3xl font-black mb-8">MATCH COMPLETE</h2>
          
          <div className="flex justify-between items-center mb-8 max-w-lg mx-auto bg-black/30 p-6 rounded-xl border border-[var(--border-color)]">
            <div className="text-center w-1/3">
              <div className="font-bold truncate">{matchResult.creator_name}</div>
              <div className="text-2xl font-black text-[var(--accent-primary)]">{matchResult.creator_rating}</div>
              {matchResult.result.winner === "creator" && <div className="text-green-400 font-bold mt-2">WINNER</div>}
            </div>
            <div className="text-2xl font-black text-[var(--text-secondary)] px-4">VS</div>
            <div className="text-center w-1/3">
              <div className="font-bold truncate">{matchResult.joiner_name}</div>
              <div className="text-2xl font-black text-red-500">{matchResult.joiner_rating}</div>
              {matchResult.result.winner === "joiner" && <div className="text-green-400 font-bold mt-2">WINNER</div>}
            </div>
          </div>

          <div className="mb-8">
            {matchResult.result.winner === "draw" ? (
              <h3 className="text-2xl font-bold text-yellow-400">IT'S A DRAW!</h3>
            ) : (
              <h3 className="text-2xl font-bold text-white">
                {(matchResult.result.winner === "creator" && userProfile?.id === matchResult.creator_id) || 
                 (matchResult.result.winner === "joiner" && userProfile?.id === matchResult.joiner_id) 
                 ? <span className="text-green-400">YOU WON!</span> 
                 : <span className="text-red-400">YOU LOST!</span>}
              </h3>
            )}
            
            <p className="mt-4 text-lg">
              Payout: <strong className="text-yellow-400">${matchResult.result.payout.toFixed(2)}</strong>
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              (Total Pot: ${matchResult.wager * 2} • 10% Fee Deducted)
            </p>
          </div>

          <button onClick={() => {
            setView("browse");
            setMyLobbyId(null);
            setMatchResult(null);
            fetchLobbies();
          }} className="btn-primary px-8 py-3">
            Back to Arena
          </button>
        </div>
      )}
    </div>
  );
}
