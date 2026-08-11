"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/app/context/AppContext";

export default function PredictorPage() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userEntry, setUserEntry] = useState(null);
  const [weekId, setWeekId] = useState("GW1"); // Hardcoded for now
  
  const { session } = useAppContext();

  useEffect(() => {
    fetchFixtures();
    if (session?.user) {
      fetchUserEntry();
      fetchLeaderboard();
    }
  }, [session]);

  const fetchFixtures = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/fixtures");
      let data = await res.json();
      if (data && data.fixtures) {
        // Take just 5 matches for the predictor
        setFixtures(data.fixtures.slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to fetch fixtures:", err);
    }
    setLoading(false);
  };

  const fetchUserEntry = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from("predictor_entries")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("week_id", weekId)
        .single();
        
      if (data) {
        setUserEntry(data);
        // Pre-fill inputs if they already submitted
        const preds = {};
        data.predictions.forEach(p => {
          preds[p.matchId] = { home: p.homeScore, away: p.awayScore };
        });
        setPredictions(preds);
      }
    } catch (err) {
      console.log("No existing entry found for this week.");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("predictor_leaderboard")
        .select("*")
        .eq("week_id", weekId)
        .order("points", { ascending: false })
        .limit(10);
      
      if (data) setLeaderboard(data);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  };

  const handleScoreChange = (matchId, team, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) && value !== "") return;
    
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: value === "" ? "" : numValue
      }
    }));
  };

  const submitPredictions = async () => {
    if (!session?.user) {
      alert("You must be logged in to submit predictions.");
      return;
    }
    
    // Validate all 5 matches have predictions
    if (Object.keys(predictions).length < 5) {
      alert("Please predict the score for all 5 matches.");
      return;
    }
    
    for (let matchId in predictions) {
      if (predictions[matchId].home === "" || predictions[matchId].away === "" || 
          predictions[matchId].home === undefined || predictions[matchId].away === undefined) {
        alert("Please fill in all scores.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const formattedPredictions = Object.keys(predictions).map(matchId => ({
        matchId,
        homeScore: parseInt(predictions[matchId].home),
        awayScore: parseInt(predictions[matchId].away)
      }));

      if (userEntry) {
        // Update
        const { error } = await supabase
          .from("predictor_entries")
          .update({ predictions: formattedPredictions })
          .eq("id", userEntry.id);
        if (error) throw error;
        alert("Predictions updated successfully!");
      } else {
        // Insert
        const { error } = await supabase
          .from("predictor_entries")
          .insert({
            user_id: session.user.id,
            week_id: weekId,
            predictions: formattedPredictions,
            points: 0
          });
        if (error) throw error;
        alert("Predictions submitted successfully!");
      }
      
      fetchUserEntry();
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
      alert("Error submitting predictions: " + err.message);
    }
    setSubmitting(false);
  };

  // Admin/Testing function to simulate the week and score points
  const simulateAndScore = async () => {
    if (!userEntry) return;
    
    let totalPoints = 0;
    
    // For each prediction, generate a random actual score and compare
    const results = userEntry.predictions.map(pred => {
      // Simulate a random score (0-4)
      const actualHome = Math.floor(Math.random() * 5);
      const actualAway = Math.floor(Math.random() * 5);
      
      let points = 0;
      
      if (pred.homeScore === actualHome && pred.awayScore === actualAway) {
        points = 5; // Exact score
      } else {
        const predDiff = pred.homeScore - pred.awayScore;
        const actualDiff = actualHome - actualAway;
        
        if ((predDiff > 0 && actualDiff > 0) || (predDiff < 0 && actualDiff < 0) || (predDiff === 0 && actualDiff === 0)) {
          points = 2; // Correct result (win/loss/draw)
        }
      }
      
      totalPoints += points;
      return { ...pred, actualHome, actualAway, points };
    });
    
    try {
      // Update entry with new points
      await supabase
        .from("predictor_entries")
        .update({ points: totalPoints })
        .eq("id", userEntry.id);
        
      alert(`Tournament simulated! You scored ${totalPoints} points.`);
      fetchUserEntry();
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-20">Loading fixtures...</div>;

  return (
    <div className="max-w-6xl mx-auto pt-6 pb-20 animate-fade-in font-sans">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-6">
        <div>
          <Link href="/dashboard/sportsbook" className="text-[var(--accent-primary)] hover:underline text-sm font-bold flex items-center gap-2 mb-2">
            ← Back to Sportsbook
          </Link>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-500 uppercase tracking-tight">
            🏆 Weekly Predictor
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Predict the exact scores of 5 matches. 5 pts for Exact Score, 2 pts for Correct Result.
          </p>
        </div>
        {userEntry && (
          <button onClick={simulateAndScore} className="btn-secondary text-sm">
            Simulate Results (Test)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Predictor Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black">Gameweek 1 Fixtures</h2>
            {userEntry && (
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                Predictions Submitted
              </span>
            )}
          </div>
          
          {fixtures.map((match, i) => (
            <div key={match.id} className="glass-card p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-[var(--accent-primary)] transition-colors">
              
              {/* Home Team */}
              <div className="flex-1 flex justify-end items-center gap-3 w-full">
                <span className="font-bold text-lg hidden md:block">{match.home.name}</span>
                <img src={match.home.logo} alt={match.home.name} className="w-10 h-10 object-contain" />
              </div>
              
              {/* Score Inputs */}
              <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-[var(--border-color)]">
                <input 
                  type="number" 
                  min="0" max="9"
                  className="w-12 h-12 text-center text-xl font-black bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded focus:outline-none focus:border-[var(--accent-primary)]"
                  value={predictions[match.id]?.home !== undefined ? predictions[match.id].home : ""}
                  onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                  disabled={userEntry && userEntry.points > 0} // Disable if already scored
                />
                <span className="text-[var(--text-secondary)] font-bold px-2">-</span>
                <input 
                  type="number" 
                  min="0" max="9"
                  className="w-12 h-12 text-center text-xl font-black bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded focus:outline-none focus:border-[var(--accent-primary)]"
                  value={predictions[match.id]?.away !== undefined ? predictions[match.id].away : ""}
                  onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                  disabled={userEntry && userEntry.points > 0}
                />
              </div>
              
              {/* Away Team */}
              <div className="flex-1 flex justify-start items-center gap-3 w-full">
                <img src={match.away.logo} alt={match.away.name} className="w-10 h-10 object-contain" />
                <span className="font-bold text-lg hidden md:block">{match.away.name}</span>
              </div>
              
            </div>
          ))}
          
          <div className="mt-6 text-right pt-4">
            <button 
              onClick={submitPredictions} 
              disabled={submitting || (userEntry && userEntry.points > 0)}
              className="btn-primary text-lg px-8 py-3 w-full md:w-auto"
            >
              {submitting ? "Saving..." : userEntry ? "Update Predictions" : "Submit Predictions"}
            </button>
          </div>
        </div>
        
        {/* Leaderboard */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black mb-4">🏆 GW1 Leaderboard</h2>
          <div className="glass-card p-0 overflow-hidden">
            <div className="bg-black/30 p-3 grid grid-cols-12 gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase">
              <div className="col-span-2 text-center">Rank</div>
              <div className="col-span-7">Manager</div>
              <div className="col-span-3 text-right">Pts</div>
            </div>
            
            <div className="divide-y divide-[var(--border-color)]">
              {leaderboard.length === 0 ? (
                <div className="p-6 text-center text-[var(--text-secondary)]">
                  No entries yet. Be the first!
                </div>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={entry.user_id} className={`p-3 grid grid-cols-12 gap-2 items-center ${entry.user_id === session?.user?.id ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-white/5'}`}>
                    <div className="col-span-2 text-center font-black">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>
                    <div className="col-span-7 flex items-center gap-2 truncate">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} className="w-6 h-6 rounded-full border border-gray-600" alt="" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                          👤
                        </div>
                      )}
                      <span className={`font-bold truncate ${entry.user_id === session?.user?.id ? 'text-[var(--accent-primary)]' : ''}`}>
                        {entry.username || 'Anonymous'}
                      </span>
                    </div>
                    <div className="col-span-3 text-right font-black text-emerald-400">
                      {entry.points}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="glass-card p-4 mt-6 border-l-4 border-emerald-500">
            <h3 className="font-bold mb-2">🎁 Prizes</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li><span className="text-white font-bold">1st Place:</span> 1,000 AI Coins</li>
              <li><span className="text-white font-bold">2nd Place:</span> 500 AI Coins</li>
              <li><span className="text-white font-bold">3rd Place:</span> 250 AI Coins</li>
            </ul>
          </div>
        </div>
        
      </div>
    </div>
  );
}
