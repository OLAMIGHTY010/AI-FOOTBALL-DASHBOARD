"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getMarketLabel } from "@/lib/utils";
import VirtualTabs from "../components/VirtualTabs";
import BasketballCourt from "./components/BasketballCourt";
import TennisCourt from "./components/TennisCourt";
import RaceTrack from "./components/RaceTrack";

const API_URL = "http://localhost:8000";

const INITIAL_HOME_PLAYERS = [
  { id: 'h1', base_x: 8, base_y: 50 },
  { id: 'h2', base_x: 20, base_y: 20 },
  { id: 'h3', base_x: 18, base_y: 40 },
  { id: 'h4', base_x: 18, base_y: 60 },
  { id: 'h5', base_x: 20, base_y: 80 },
  { id: 'h6', base_x: 35, base_y: 25 },
  { id: 'h7', base_x: 32, base_y: 42 },
  { id: 'h8', base_x: 32, base_y: 58 },
  { id: 'h9', base_x: 35, base_y: 75 },
  { id: 'h10', base_x: 45, base_y: 40 },
  { id: 'h11', base_x: 45, base_y: 60 }
];

const INITIAL_AWAY_PLAYERS = [
  { id: 'a1', base_x: 92, base_y: 50 },
  { id: 'a2', base_x: 80, base_y: 20 },
  { id: 'a3', base_x: 82, base_y: 40 },
  { id: 'a4', base_x: 82, base_y: 60 },
  { id: 'a5', base_x: 80, base_y: 80 },
  { id: 'a6', base_x: 65, base_y: 25 },
  { id: 'a7', base_x: 68, base_y: 42 },
  { id: 'a8', base_x: 68, base_y: 58 },
  { id: 'a9', base_x: 65, base_y: 75 },
  { id: 'a10', base_x: 55, base_y: 40 },
  { id: 'a11', base_x: 55, base_y: 60 }
];

const BASKETBALL_HOME_PLAYERS = [
  { id: 'bh1', base_x: 45, base_y: 50 }, // PG
  { id: 'bh2', base_x: 35, base_y: 30 }, // SG
  { id: 'bh3', base_x: 35, base_y: 70 }, // SF
  { id: 'bh4', base_x: 20, base_y: 40 }, // PF
  { id: 'bh5', base_x: 20, base_y: 60 }, // C
];

const BASKETBALL_AWAY_PLAYERS = [
  { id: 'ba1', base_x: 55, base_y: 50 }, // PG
  { id: 'ba2', base_x: 65, base_y: 30 }, // SG
  { id: 'ba3', base_x: 65, base_y: 70 }, // SF
  { id: 'ba4', base_x: 80, base_y: 40 }, // PF
  { id: 'ba5', base_x: 80, base_y: 60 }, // C
];

const GENERATE_COMMENTARY = (home, away, minute) => {
  const actions = [
    `Patient build-up play by ${home}.`,
    `${away} pressing high up the pitch.`,
    `Fierce battle in the midfield...`,
    `${home} trying to find an opening.`,
    `${away} holding their defensive shape well.`,
    `The referee waves play on after a strong challenge.`,
    `A dangerous cross is cleared away.`,
    `Possession changes hands quickly.`,
    `Both teams looking to assert dominance.`
  ];
  return actions[Math.floor(Math.random() * actions.length)];
};

export default function SimulatePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SimulatePage />
    </Suspense>
  );
}

function SimulatePage() {
  const searchParams = useSearchParams();
  const currentSport = searchParams.get("sport") || "football";
  const apiEndpointFix = currentSport === "basketball" ? `${API_URL}/api/fixtures/basketball` : currentSport === "tennis" ? `${API_URL}/api/fixtures/tennis` : currentSport === "racing" ? `${API_URL}/api/fixtures/racing` : `${API_URL}/api/fixtures`;
  const apiEndpointSim = currentSport === "basketball" ? `${API_URL}/api/simulate/basketball` : currentSport === "tennis" ? `${API_URL}/api/simulate/tennis` : currentSport === "racing" ? `${API_URL}/api/simulate/racing` : `${API_URL}/api/simulate`;

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [liveEvents, setLiveEvents] = useState([]);
  const [pendingBets, setPendingBets] = useState([]);
  const [settledBets, setSettledBets] = useState([]);
  const [initialStandings, setInitialStandings] = useState(null);
  const [liveStandings, setLiveStandings] = useState({});

  // 2D Viewer State
  const [featuredMatchId, setFeaturedMatchId] = useState(null);
  const [ballPos, setBallPos] = useState({ x: 50, y: 50 });
  const [overlayMsg, setOverlayMsg] = useState(null);
  const [pitchPlayers, setPitchPlayers] = useState({ home: INITIAL_HOME_PLAYERS, away: INITIAL_AWAY_PLAYERS });
  const [courtPlayers, setCourtPlayers] = useState({ home: BASKETBALL_HOME_PLAYERS, away: BASKETBALL_AWAY_PLAYERS });
  const [tennisPlayers, setTennisPlayers] = useState({ home: { name: "", current_x: 5, current_y: 50 }, away: { name: "", current_x: 95, current_y: 50 } });

  const featuredMatch = results ? results.find(m => m.id === featuredMatchId) : null;

  const fetchStandings = async () => {
    try {
      // We don't have separate standings for basketball yet in the backend, but we can reuse the same endpoint for now or skip.
      const res = await fetch(`${API_URL}/api/standings`);
      const data = await res.json();
      setInitialStandings(data);
      setLiveStandings(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load pending bets and initial standings on mount
  useEffect(() => {
    setPendingBets(JSON.parse(localStorage.getItem("pending_bets") || "[]"));
    setSettledBets(JSON.parse(localStorage.getItem("settled_bets") || "[]"));
    fetchStandings();
  }, []);

  // Dynamic Player Movement Effect
  useEffect(() => {
    if (!isLive) return;
    const applyMovement = (players) => {
      return players.map(p => {
        let dx = (Math.random() - 0.5) * 6; // slightly bigger jitter
        let dy = (Math.random() - 0.5) * 6;
        const distToBall = Math.hypot(ballPos.x - p.base_x, ballPos.y - p.base_y);
        if (distToBall < 40 && p.id !== 'h1' && p.id !== 'a1') { // don't move GKs towards ball
          dx += (ballPos.x - p.base_x) * 0.15;
          dy += (ballPos.y - p.base_y) * 0.15;
        }
        return { ...p, current_x: p.base_x + dx, current_y: p.base_y + dy };
      });
    };
    
    if (currentSport === "basketball") {
      setCourtPlayers({
        home: applyMovement(BASKETBALL_HOME_PLAYERS),
        away: applyMovement(BASKETBALL_AWAY_PLAYERS)
      });
    } else if (currentSport === "tennis") {
      setTennisPlayers({
        home: { 
          name: featuredMatch?.home?.name || "", 
          current_x: 5 + (Math.random() - 0.5) * 2 + (ballPos.x < 30 ? (ballPos.x - 5) * 0.2 : 0), 
          current_y: 50 + (Math.random() - 0.5) * 2 + (ballPos.y - 50) * 0.3
        },
        away: { 
          name: featuredMatch?.away?.name || "", 
          current_x: 95 + (Math.random() - 0.5) * 2 + (ballPos.x > 70 ? (ballPos.x - 95) * 0.2 : 0), 
          current_y: 50 + (Math.random() - 0.5) * 2 + (ballPos.y - 50) * 0.3
        }
      });
    } else {
      setPitchPlayers({
        home: applyMovement(INITIAL_HOME_PLAYERS),
        away: applyMovement(INITIAL_AWAY_PLAYERS)
      });
    }
  }, [currentMinute, ballPos, isLive, currentSport, featuredMatch]);

  // Timer effect
  useEffect(() => {
    let timer;
    const maxTime = currentSport === "basketball" ? 40 : 90;
    if (isLive && currentMinute < maxTime) {
      timer = setInterval(() => {
        setCurrentMinute((prev) => prev + 1);
      }, 1000); // 1 second = 1 minute (or 1 second for basketball)
    } else if (isLive && currentMinute >= maxTime) {
      finishSimulation();
    }
    return () => clearInterval(timer);
  }, [isLive, currentMinute, currentSport]);

  // Handle events as minute ticks
  useEffect(() => {
    const maxTime = currentSport === "basketball" ? 40 : 90;
    if (isLive && results && currentMinute > 0 && currentMinute <= maxTime) {
      // 1. Process all events for the commentary feed
      const newEvents = [];
      let featuredEvent = null;

      results.forEach(match => {
        if (currentSport === "racing") {
            const eventNow = match.events.find(e => e.tick === currentMinute);
            if (eventNow) {
              newEvents.push({ matchId: match.id, type: "tick", ...eventNow });
              if (match.id === featuredMatchId) {
                featuredEvent = { type: "tick", ...eventNow };
              }
            }
        } else {
            const eventsNow = match.events.filter(e => e.minute === currentMinute);
            eventsNow.forEach(e => {
              newEvents.push({ matchId: match.id, home: match.home.name, away: match.away.name, ...e });
              if (match.id === featuredMatchId) {
                featuredEvent = e;
              }
            });
        }
      });

      if (newEvents.length > 0) {
        setLiveEvents(prev => [...newEvents, ...prev].slice(0, 15));
      } else {
        if (Math.random() < 0.2) {
          const randomMatch = results[Math.floor(Math.random() * results.length)];
          setLiveEvents(prev => [
            { type: "commentary", minute: currentMinute, text: GENERATE_COMMENTARY(randomMatch.home.name, randomMatch.away.name, currentMinute), home: randomMatch.home.name, away: randomMatch.away.name },
            ...prev
          ].slice(0, 15));
        }
      }

      // 2. Animate 2D Pitch for Featured Match
      if (featuredMatchId) {
        if (featuredEvent) {
          if (featuredEvent.type === "goal") {
            setBallPos({ x: featuredEvent.x || (featuredEvent.team === "home" ? 97 : 3), y: featuredEvent.y || 50 });
            triggerOverlay("⚽ GOAL!");
          } else if (featuredEvent.type === "red_card") {
            if (featuredEvent.x) setBallPos({ x: featuredEvent.x, y: featuredEvent.y });
            triggerOverlay("🟥 RED CARD!");
          } else if (featuredEvent.type === "yellow_card") {
            if (featuredEvent.x) setBallPos({ x: featuredEvent.x, y: featuredEvent.y });
            triggerOverlay("🟨 YELLOW CARD");
          } else if (featuredEvent.type === "corner") {
            setBallPos({ x: featuredEvent.x || (featuredEvent.team === "home" ? 98 : 2), y: featuredEvent.y || 2 });
          } else if (featuredEvent.type === "foul") {
            if (featuredEvent.x) setBallPos({ x: featuredEvent.x, y: featuredEvent.y });
            triggerOverlay("🦵 FOUL");
          } else if (featuredEvent.type === "point") {
            const side = featuredEvent.team === "home" ? 5 : 95;
            setBallPos({ x: side, y: 10 + Math.random() * 80 });
            triggerOverlay(`POINT ${featuredEvent.team === "home" ? featuredMatch.home.name : featuredMatch.away.name}`);
          }
        } else {
          // No event, just pass around (or hit back and forth for tennis)
          if (currentSport === "tennis") {
            // Ball bounces between x=15 and x=85
            setBallPos({
              x: Math.random() < 0.5 ? 15 + Math.random() * 20 : 65 + Math.random() * 20,
              y: 20 + Math.random() * 60,
            });
          } else {
            randomMidfieldPass();
          }
        }
      }
      // 3. Update Live League Tables
      if (initialStandings && results) {
        const newStandings = JSON.parse(JSON.stringify(initialStandings)); 
        
        results.forEach(match => {
          const score = calculateLiveScore(match, currentMinute);
          const league = match.home.league;
          const h_name = match.home.name;
          const a_name = match.away.name;
          
          if (newStandings[league] && newStandings[league][h_name] && newStandings[league][a_name]) {
            const h_st = newStandings[league][h_name];
            const a_st = newStandings[league][a_name];
            
            // Increment Matches Played
            h_st.P += 1;
            a_st.P += 1;
            
            // Goals
            h_st.GF += score.h;
            h_st.GA += score.a;
            h_st.GD = h_st.GF - h_st.GA;
            
            a_st.GF += score.a;
            a_st.GA += score.h;
            a_st.GD = a_st.GF - a_st.GA;
            
            // Points
            if (score.h > score.a) {
              h_st.W += 1;
              h_st.Pts += 3;
              a_st.L += 1;
            } else if (score.h < score.a) {
              a_st.W += 1;
              a_st.Pts += 3;
              h_st.L += 1;
            } else {
              h_st.D += 1;
              h_st.Pts += 1;
              a_st.D += 1;
              a_st.Pts += 1;
            }
          }
        });

        // Re-sort standings for all leagues
        Object.keys(newStandings).forEach(league => {
          const teamsArray = Object.entries(newStandings[league]).map(([name, stats]) => ({ name, ...stats }));
          teamsArray.sort((a, b) => {
            if (b.Pts !== a.Pts) return b.Pts - a.Pts;
            if (b.GD !== a.GD) return b.GD - a.GD;
            return b.GF - a.GF;
          });
          
          const sortedDict = {};
          teamsArray.forEach(t => {
            const { name, ...stats } = t;
            sortedDict[name] = stats;
          });
          newStandings[league] = sortedDict;
        });

        setLiveStandings(newStandings);
      }
    }
  }, [currentMinute, isLive, results, featuredMatchId, initialStandings]);

  const triggerOverlay = (msg) => {
    setOverlayMsg(msg);
    setTimeout(() => {
      setOverlayMsg(null);
    }, 2000);
  };

  const randomMidfieldPass = () => {
    setBallPos({
      x: 30 + Math.random() * 40, // 30% to 70%
      y: 20 + Math.random() * 60, // 20% to 80%
    });
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiEndpointSim, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setResults(data.results);
      
      // Default to first match as featured
      if (data.results && data.results.length > 0) {
        setFeaturedMatchId(data.results[0].id);
      }
      
      // Reset live state
      setCurrentMinute(0);
      setLiveEvents([]);
      setBallPos({ x: 50, y: 50 });
      setIsLive(true);
      
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const finishSimulation = async () => {
    setIsLive(false);
    setCurrentMinute(currentSport === "basketball" ? 40 : 90);
    
    // Process pending bets now that match is officially over
    if (!results) return;
    
    let currentBankroll = parseFloat(localStorage.getItem("bankroll") || "0");
    let totalWinnings = 0;
    let newSettledBets = [...settledBets];

    const updatedPending = pendingBets.filter(bet => {
      let allWon = true;
      let anyMatchFound = false;

      for (const leg of bet.slip) {
        const match = results.find(m => m.id === leg.fixtureId);
        if (match) {
          anyMatchFound = true;
          const h_g = match.h_goals;
          const a_g = match.a_goals;
          const market = leg.market;
          let won = false;
          if (market.startsWith("WIN_")) {
            const runnerId = parseInt(market.split("_")[1]);
            const winner = match.standings[0];
            if (winner && winner.id === runnerId) won = true;
          } else if (market.startsWith("PLC_")) {
            const runnerId = parseInt(market.split("_")[1]);
            const placed = match.standings.slice(0, 3).find(r => r.id === runnerId);
            if (placed) won = true;
          } else {
            if (market === "1" && h_g > a_g) won = true;
            else if (market === "X" && h_g === a_g) won = true;
            else if (market === "2" && h_g < a_g) won = true;
            else if (market === "O2.5" && h_g + a_g > 2.5) won = true;
            else if (market === "U2.5" && h_g + a_g < 2.5) won = true;
            else if (market === "BTTS_Y" && h_g > 0 && a_g > 0) won = true;
            else if (market === "BTTS_N" && (h_g === 0 || a_g === 0)) won = true;
          }
          
          if (!won) allWon = false;
        }
      }
      
      if (anyMatchFound) {
        if (allWon) {
          totalWinnings += parseFloat(bet.potentialWin);
          newSettledBets.push({ ...bet, status: "WON" });
        } else {
          newSettledBets.push({ ...bet, status: "LOST" });
        }
        return false; 
      }
      return true; 
    });

    if (totalWinnings > 0) {
      currentBankroll += totalWinnings;
      localStorage.setItem("bankroll", currentBankroll.toString());
      
      // Dispatch event to update navbar instantly
      window.dispatchEvent(new Event("storage"));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from("wallets")
          .update({ balance: currentBankroll })
          .eq("user_id", session.user.id);
      }
      
      alert(`🎉 Full Time! Bets Settled! You won $${totalWinnings.toFixed(2)}!`);
    } else {
      alert("🏁 Full Time! Simulation Complete.");
    }

    localStorage.setItem("pending_bets", JSON.stringify(updatedPending));
    setPendingBets(updatedPending);

    // Keep only the last 20 settled bets to prevent bloat
    const limitedSettledBets = newSettledBets.slice(-20);
    localStorage.setItem("settled_bets", JSON.stringify(limitedSettledBets));
    setSettledBets(limitedSettledBets);
  };

  const skipToEnd = () => {
    if (isLive) {
      finishSimulation();
    }
  };

  const calculateLiveScore = (match, minute) => {
    if (currentSport === "basketball") {
      const events = match.events.filter(e => e.minute <= minute);
      const hScore = events.filter(e => e.team === "home" && (e.type === "2pt" || e.type === "3pt" || e.type === "ft" || e.type === "ot_win")).reduce((acc, e) => acc + e.points, 0);
      const aScore = events.filter(e => e.team === "away" && (e.type === "2pt" || e.type === "3pt" || e.type === "ft" || e.type === "ot_win")).reduce((acc, e) => acc + e.points, 0);
      return { h: hScore, a: aScore };
    }
    if (currentSport === "tennis") {
      const events = match.events.filter(e => e.minute <= minute);
      if (events.length === 0) return { h: 0, a: 0, score: "0-0", h_sets: 0, a_sets: 0, h_games: 0, a_games: 0 };
      const lastEvent = events[events.length - 1];
      return { h: lastEvent.h_sets, a: lastEvent.a_sets, score: lastEvent.score, h_games: lastEvent.h_games, a_games: lastEvent.a_games, h_sets: lastEvent.h_sets, a_sets: lastEvent.a_sets };
    }
    const goals = match.events.filter(e => e.type === "goal" && e.minute <= minute);
    return {
      h: goals.filter(e => e.team === "home").length,
      a: goals.filter(e => e.team === "away").length
    };
  };

  const evaluateMarket = (market, score, match, minute) => {
    const h_g = score.h;
    const a_g = score.a;
    const total_g = h_g + a_g;
    
    const events = match.events.filter(e => e.minute <= minute);
    const total_c = events.filter(e => e.type === "corner").length;
    const total_y = events.filter(e => e.type === "yellow_card").length;
    const total_f = events.filter(e => e.type === "foul").length;
    const red_card = events.some(e => e.type === "red_card");
    const h_star = events.some(e => e.type === "goal" && e.team === "home" && e.player === match.home.star);
    const a_star = events.some(e => e.type === "goal" && e.team === "away" && e.player === match.away.star);

    const checks = {
      "1": h_g > a_g, "X": h_g === a_g, "2": h_g < a_g,
      "1X": h_g >= a_g, "12": h_g !== a_g, "X2": h_g <= a_g,
      "O2.5": total_g > 2.5, "U2.5": total_g < 2.5,
      "O22.5": total_g > 22.5, "U22.5": total_g < 22.5,
      "BTTS_Y": h_g > 0 && a_g > 0, "BTTS_N": h_g === 0 || a_g === 0,
      "C_O9.5": total_c > 9.5, "C_U9.5": total_c < 9.5,
      "Y_O3.5": total_y > 3.5, "Y_U3.5": total_y < 3.5,
      "RED_Y": red_card, "RED_N": !red_card,
      "F_O22.5": total_f > 22.5, "F_U22.5": total_f < 22.5,
      "H_STAR_Y": h_star, "H_STAR_N": !h_star,
      "A_STAR_Y": a_star, "A_STAR_N": !a_star,
    };
    return checks[market] ?? false;
  };

  const getCashOutValue = (bet) => {
    if (!isLive || !results) return (bet.wager * 0.9).toFixed(2);
    
    let isFavorable = true;
    for (const leg of bet.slip) {
      const match = results.find(m => m.id === leg.fixtureId);
      if (match) {
        const score = calculateLiveScore(match, currentMinute);
        if (!evaluateMarket(leg.market, score, match, currentMinute)) {
          isFavorable = false;
          break;
        }
      }
    }
    
    const maxTime = currentSport === "basketball" ? 40 : 90;
    const base = parseFloat(bet.wager);
    const max = parseFloat(bet.potentialWin);
    const progress = currentMinute / maxTime;
    
    if (isFavorable) {
      const estimated = base + ((max - base) * progress * 0.9);
      return Math.max(estimated, base * 1.05).toFixed(2);
    } else {
      const estimated = base * Math.pow((1.0 - progress), 1.5);
      return Math.max(estimated, base * 0.05).toFixed(2);
    }
  };

  const handleCashOut = async (betIndex) => {
    const bet = pendingBets[betIndex];
    if (!bet || !isLive) return;

    const cashOutAmount = getCashOutValue(bet);
    const bankroll = parseFloat(localStorage.getItem("bankroll") || "0");
    const newBankroll = bankroll + parseFloat(cashOutAmount);
    
    localStorage.setItem("bankroll", newBankroll.toString());
    window.dispatchEvent(new Event("storage"));

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("wallets").update({ balance: newBankroll }).eq("user_id", session.user.id);
    }

    const updatedPending = [...pendingBets];
    updatedPending.splice(betIndex, 1);
    
    const newSettled = [...settledBets, { ...bet, status: 'CASH OUT', potentialWin: cashOutAmount }];
    
    localStorage.setItem("pending_bets", JSON.stringify(updatedPending));
    setPendingBets(updatedPending);
    
    const limitedSettledBets = newSettled.slice(-20);
    localStorage.setItem("settled_bets", JSON.stringify(limitedSettledBets));
    setSettledBets(limitedSettledBets);
    
    alert(`Cashed out for $${cashOutAmount}!`);
  };

  const calculateLiveOdds = (h_power, a_power, h_goals, a_goals, minute) => {
    const maxTime = currentSport === "basketball" ? 40 : 90;
    const remaining_mins = Math.max(maxTime - minute, 1);
    const goal_diff = h_goals - a_goals;
    const total = h_power + a_power;
    const h_prob_rest = Math.min(Math.max(h_power / total, 0.2), 0.8) * 0.75;
    const a_prob_rest = Math.min(Math.max(a_power / total, 0.2), 0.8) * 0.75;
    const d_prob_rest = 1.0 - (h_prob_rest + a_prob_rest);
    const time_factor = remaining_mins / maxTime;
    
    let h_prob, a_prob, d_prob;
    if (goal_diff > 0) {
        h_prob = h_prob_rest * time_factor + (1.0 - time_factor) * 0.98;
        a_prob = a_prob_rest * time_factor + (1.0 - time_factor) * 0.01;
        d_prob = 1.0 - (h_prob + a_prob);
    } else if (goal_diff < 0) {
        a_prob = a_prob_rest * time_factor + (1.0 - time_factor) * 0.98;
        h_prob = h_prob_rest * time_factor + (1.0 - time_factor) * 0.01;
        d_prob = 1.0 - (h_prob + a_prob);
    } else {
        d_prob = d_prob_rest * time_factor + (1.0 - time_factor) * 0.96;
        h_prob = h_prob_rest * time_factor + (1.0 - time_factor) * 0.02;
        a_prob = 1.0 - (h_prob + d_prob);
    }
        
    const house_edge = 0.92;
    const safe_odds = (prob) => Math.max(parseFloat(((1 / Math.max(prob, 0.01)) * house_edge).toFixed(2)), 1.01).toFixed(2);
        
    return { "1": safe_odds(h_prob), "X": safe_odds(d_prob), "2": safe_odds(a_prob) };
  };

  const placeLiveBet = async (market, odds) => {
    const wager = 10; // fixed $10 wager for fast live bets
    const bankroll = parseFloat(localStorage.getItem("bankroll") || "0");
    if (wager > bankroll) {
      alert("Insufficient funds for a $10 live bet!");
      return;
    }
    
    const newBankroll = bankroll - wager;
    localStorage.setItem("bankroll", newBankroll.toString());
    window.dispatchEvent(new Event("storage"));
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("wallets").update({ balance: newBankroll }).eq("user_id", session.user.id);
    }

    const potentialWin = (wager * odds).toFixed(2);
    const newBet = {
      slip: [{
        fixtureId: featuredMatch.id,
        home: featuredMatch.home.name,
        away: featuredMatch.away.name,
        market,
        odds
      }],
      wager,
      totalOdds: odds,
      potentialWin,
      timestamp: Date.now()
    };
    
    const pending = [...pendingBets, newBet];
    localStorage.setItem("pending_bets", JSON.stringify(pending));
    setPendingBets(pending);
  };

  const featuredScore = featuredMatch ? calculateLiveScore(featuredMatch, currentMinute) : { h: 0, a: 0 };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-20">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Virtual Hub</h1>
        <p className="text-[var(--text-secondary)]">Experience the AI-driven 2D match engine.</p>
      </div>
      <VirtualTabs />
      <div className="flex flex-col xl:flex-row gap-6">
      
      <div className="flex-1">
        <div className="text-center mb-8">
          <p className="text-[var(--text-secondary)] mb-6">
            Watch the 90-second live simulation. Select a match to feature it on the 2D viewer.
          </p>
          
          {!isLive && currentMinute === 0 && (
            <button 
              onClick={runSimulation} 
              disabled={loading}
              className="btn-primary px-8 py-3 text-lg"
            >
              {loading ? "Starting..." : "▶ Run Live Simulation"}
            </button>
          )}

          {isLive && (
            <div className="bg-[var(--bg-card)] border border-[var(--accent-primary)] rounded-lg p-4 inline-block shadow-[0_0_15px_rgba(0,212,170,0.2)]">
              <div className="text-3xl font-black text-[var(--accent-primary)] font-mono">
                {currentSport === "basketball" ? (
                  currentMinute > 0 ? `Q${Math.min(4, Math.floor((currentMinute-1) / 10) + 1)} ${((currentMinute - 1) % 10) + 1}s` : `Q1 0s`
                ) : currentSport === "tennis" ? (
                  `Pt ${currentMinute}`
                ) : (
                  `${currentMinute}'`
                )}
              </div>
              <div className="text-sm font-bold text-red-500 animate-pulse mt-1">● LIVE</div>
              <button onClick={skipToEnd} className="btn-secondary mt-3 text-xs">
                ⏭ Skip to Full Time
              </button>
            </div>
          )}

          {!isLive && currentMinute === (currentSport === "basketball" ? 40 : 90) && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 inline-block">
              <div className="text-2xl font-black text-white">FT</div>
              <div className="text-sm font-bold text-[var(--text-secondary)] mt-1">Full Time</div>
              <button onClick={() => { setResults(null); setCurrentMinute(0); setFeaturedMatchId(null); fetchStandings(); }} className="btn-primary mt-3 text-sm">
                Next Matchweek
              </button>
            </div>
          )}
        </div>

        {/* 2D Live Match Viewer */}
        {results && featuredMatch && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">📺 Featured Match</h2>
            
            <div className="glass-card bg-gradient-to-b from-black to-[#0a0a0a] border border-[var(--border-color)] p-0 overflow-hidden rounded-xl">
              {/* Scoreboard Header */}
              {currentSport === "racing" ? (
                <div className="flex justify-center items-center p-4 bg-black/60 border-b border-white/10 relative">
                  <div className="text-center font-black text-xl md:text-2xl">{featuredMatch.name}</div>
                </div>
              ) : (
                <div className="flex justify-between items-center p-4 bg-black/60 border-b border-white/10 relative">
                  <div className="absolute top-2 left-4 text-xs font-bold text-[var(--text-secondary)]">
                    WEATHER: {featuredMatch.weather === "Rain" ? "🌧️ RAIN" : featuredMatch.weather === "Snow" ? "❄️ SNOW" : "☀️ SUNNY"}
                  </div>
                  <div className="flex-1 text-right font-black text-xl md:text-2xl">{featuredMatch.home.name}</div>
                  <div className="px-6 py-2 bg-black rounded-lg border border-[var(--accent-primary)] mx-4 flex flex-col items-center">
                    <span className="text-3xl font-black gradient-text">
                      {currentSport === "tennis" ? (
                        `${featuredScore.h_sets} - ${featuredScore.a_sets}`
                      ) : (
                        `${featuredScore.h} - ${featuredScore.a}`
                      )}
                    </span>
                    {currentSport === "tennis" && featuredScore.score && (
                      <span className="text-xs text-[#c6ff00] font-bold">
                        {featuredScore.h_games}-{featuredScore.a_games} ({featuredScore.score})
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left font-black text-xl md:text-2xl">{featuredMatch.away.name}</div>
                </div>
              )}

              {/* Pitch or Court Container */}
              {currentSport === "racing" ? (
                <RaceTrack 
                  raceData={featuredMatch} 
                  currentEvent={liveEvents.find(e => e.matchId === featuredMatchId && e.type === "tick")} 
                />
              ) : currentSport === "basketball" ? (
                <BasketballCourt 
                  homePlayers={courtPlayers.home}
                  awayPlayers={courtPlayers.away}
                  ballPos={ballPos}
                  weather={featuredMatch.weather}
                  overlayMsg={overlayMsg}
                />
              ) : currentSport === "tennis" ? (
                <TennisCourt 
                  home={tennisPlayers.home}
                  away={tennisPlayers.away}
                  ballPos={ballPos}
                  overlayMsg={overlayMsg}
                />
              ) : (
                <div className={`relative w-full h-[300px] md:h-[400px] overflow-hidden ${featuredMatch.weather === 'Snow' ? 'bg-gradient-to-r from-[#d9d9d9] via-[#f0f0f0] to-[#d9d9d9]' : 'bg-gradient-to-r from-[#1b4d2e] via-[#225c38] to-[#1b4d2e]'}`}>
                  {/* Grass Stripes Pattern via CSS linear-gradient */}
                  {featuredMatch.weather !== 'Snow' && <div className="absolute inset-0 opacity-20" style={{ background: 'repeating-linear-gradient(to right, transparent, transparent 10%, rgba(255,255,255,0.1) 10%, rgba(255,255,255,0.1) 20%)' }}></div>}
                  
                  {/* Weather Overlay Effect */}
                  {featuredMatch.weather === 'Rain' && <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><line x1='10' y1='0' x2='0' y2='100' stroke='rgba(255,255,255,0.2)' stroke-width='1'/></svg>\")", backgroundSize: "20px 20px" }}></div>}
                  
                  {/* Field Markings */}
                  <div className="absolute top-4 bottom-4 left-4 right-4 border-2 border-white/40 pointer-events-none"></div>
                  {/* Center Line */}
                  <div className="absolute top-4 bottom-4 left-1/2 w-0 border-l-2 border-white/40 pointer-events-none"></div>
                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/40 rounded-full pointer-events-none"></div>
                  {/* Center Dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/70 rounded-full pointer-events-none"></div>
                  
                  {/* Left Penalty Box */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 w-1/6 h-1/2 border-2 border-l-0 border-white/40 pointer-events-none"></div>
                  {/* Left Goal Area */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 w-1/12 h-1/4 border-2 border-l-0 border-white/40 pointer-events-none"></div>
                  
                  {/* Right Penalty Box */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 w-1/6 h-1/2 border-2 border-r-0 border-white/40 pointer-events-none"></div>
                  {/* Right Goal Area */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 w-1/12 h-1/4 border-2 border-r-0 border-white/40 pointer-events-none"></div>

                  {/* Home Team */}
                  {pitchPlayers.home.map(p => (
                    <div key={p.id} className="absolute w-4 h-4 bg-blue-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000 ease-in-out" style={{ left: `${p.current_x ?? p.base_x}%`, top: `${p.current_y ?? p.base_y}%`, transform: 'translate(-50%, -50%)' }}></div>
                  ))}

                  {/* Away Team */}
                  {pitchPlayers.away.map(p => (
                    <div key={p.id} className="absolute w-4 h-4 bg-red-500 rounded-full border border-white shadow-lg pointer-events-none transition-all duration-1000 ease-in-out" style={{ left: `${p.current_x ?? p.base_x}%`, top: `${p.current_y ?? p.base_y}%`, transform: 'translate(-50%, -50%)' }}></div>
                  ))}

                  {/* Animated Ball */}
                  <div 
                    className="absolute w-6 h-6 text-2xl drop-shadow-xl z-20 pointer-events-none"
                    style={{
                      left: `${ballPos.x}%`, 
                      top: `${ballPos.y}%`, 
                      transform: 'translate(-50%, -50%)',
                      transition: 'left 0.8s ease-out, top 0.8s ease-out'
                    }}
                  >
                    ⚽
                  </div>

                  {/* Event Overlay Flash */}
                  {overlayMsg && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 animate-fade-in pointer-events-none">
                      <span className="text-4xl md:text-6xl font-black text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] scale-110">
                        {overlayMsg}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Live In-Play Betting */}
            {isLive && currentMinute < 85 && currentSport !== "racing" && (
              <div className="mt-4 glass-card border border-red-500/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="text-red-500 animate-pulse">●</span> FAST IN-PLAY BETS ($10)
                  </h3>
                  <span className="text-[10px] text-[var(--text-secondary)]">Dynamic Odds</span>
                </div>
                
                <div className={`grid ${currentSport === 'basketball' ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                  {(() => {
                    const odds = calculateLiveOdds(featuredMatch.home.power, featuredMatch.away.power, featuredScore.h, featuredScore.a, currentMinute);
                    return (
                      <>
                        <button onClick={() => placeLiveBet("1", odds["1"])} className="btn-secondary py-2 flex flex-col items-center hover:border-[var(--accent-primary)] transition-all">
                          <span className="text-[10px] text-[var(--text-secondary)] truncate w-full px-1">{featuredMatch.home.name}</span>
                          <span className="font-bold text-[var(--accent-primary)]">{odds["1"]}</span>
                        </button>
                        {currentSport !== "basketball" && (
                          <button onClick={() => placeLiveBet("X", odds["X"])} className="btn-secondary py-2 flex flex-col items-center hover:border-[var(--accent-primary)] transition-all">
                            <span className="text-[10px] text-[var(--text-secondary)]">Draw</span>
                            <span className="font-bold text-[var(--accent-primary)]">{odds["X"]}</span>
                          </button>
                        )}
                        <button onClick={() => placeLiveBet("2", odds["2"])} className="btn-secondary py-2 flex flex-col items-center hover:border-[var(--accent-primary)] transition-all">
                          <span className="text-[10px] text-[var(--text-secondary)] truncate w-full px-1">{featuredMatch.away.name}</span>
                          <span className="font-bold text-[var(--accent-primary)]">{odds["2"]}</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other Matches Grid */}
        {results && currentSport !== "racing" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold border-b border-[var(--border-color)] pb-2 flex justify-between">
              <span>All Matches</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {results.map((match, i) => {
                const score = calculateLiveScore(match, currentMinute);
                const isFeatured = match.id === featuredMatchId;
                return (
                  <div 
                    key={i} 
                    onClick={() => setFeaturedMatchId(match.id)}
                    className={`glass-card p-3 cursor-pointer transition-all hover:border-[var(--accent-primary)] 
                      ${isFeatured ? 'ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : ''}
                      ${isLive && (score.h > 0 || score.a > 0) && !isFeatured ? 'border-yellow-500/50' : ''}
                    `}
                  >
                    <div className="text-[10px] text-[var(--accent-primary)] mb-1 font-semibold truncate">
                      {match.home.league}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex-1 text-right font-bold text-sm truncate">{match.home.name}</div>
                      <div className="px-2 text-lg font-black min-w-[50px] text-center">
                        {currentSport === "tennis" ? `${score.h_sets}-${score.a_sets}` : `${score.h}-${score.a}`}
                      </div>
                      <div className="flex-1 text-left font-bold text-sm truncate">{match.away.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live League Tables */}
        {liveStandings && Object.keys(liveStandings).length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold border-b border-[var(--border-color)] pb-2">
              📊 Live Tables {isLive && <span className="text-red-500 text-sm animate-pulse ml-2">● LIVE</span>}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(liveStandings).map(([league, teams]) => (
                <div key={league} className="glass-card !p-0 overflow-hidden">
                  <div className="bg-[var(--accent-primary)]/10 px-3 py-2 border-b border-[var(--border-color)]">
                    <span className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">{league}</span>
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-black/20 text-[var(--text-secondary)]">
                      <tr>
                        <th className="px-2 py-1 w-6 text-center">#</th>
                        <th className="px-2 py-1">Club</th>
                        <th className="px-2 py-1 text-center w-8">PL</th>
                        <th className="px-2 py-1 text-center w-8">GD</th>
                        <th className="px-2 py-1 text-center w-8 font-bold text-white">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(teams).slice(0, 5).map(([team, stats], index) => {
                        return (
                          <tr key={team} className="border-b border-[var(--border-color)]/50 last:border-0 hover:bg-white/5 transition-colors">
                            <td className="px-2 py-1.5 text-center text-[var(--text-secondary)]">{index + 1}</td>
                            <td className="px-2 py-1.5 font-bold truncate max-w-[100px]">{team}</td>
                            <td className="px-2 py-1.5 text-center">{stats.P}</td>
                            <td className="px-2 py-1.5 text-center">{stats.GD > 0 ? `+${stats.GD}` : stats.GD}</td>
                            <td className="px-2 py-1.5 text-center font-bold text-[var(--accent-primary)]">{stats.Pts}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-3 py-1.5 text-[10px] text-center text-[var(--text-secondary)] bg-black/40 border-t border-[var(--border-color)]">
                    Top 5 shown. View full tables in Standings tab.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar (Commentary & Bets) */}
      <div className="w-full xl:w-80 space-y-6 flex-shrink-0">
        
        {/* Pending Bets */}
        <div className="glass-card !p-4">
          <h3 className="font-bold mb-3 border-b border-[var(--border-color)] pb-2">🎫 Active Bets</h3>
          {pendingBets.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] text-center py-4">No active bets.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {pendingBets.map((bet, i) => (
                <div key={i} className="bg-[var(--bg-secondary)] rounded p-2 text-sm border border-[var(--border-color)] shadow-inner">
                  <div className="flex justify-between font-bold text-[var(--accent-warning)] mb-1">
                    <span>Wager: ${bet.wager}</span>
                    <span>Win: ${bet.potentialWin}</span>
                  </div>
                  {bet.slip.map((leg, idx) => (
                    <div key={idx} className="border-t border-[var(--border-color)] pt-1 mt-1 text-xs text-[var(--text-secondary)]">
                      <div>{leg.home} vs {leg.away}</div>
                      <div className="font-bold text-white">
                        {getMarketLabel(leg.market, leg.home, leg.away)} @ {leg.odds}
                      </div>
                    </div>
                  ))}
                  {isLive && currentMinute < 85 && (
                    <div className="mt-2 pt-2 border-t border-[var(--border-color)] flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">Cash Out: <strong className="text-yellow-400 text-sm ml-1">${getCashOutValue(bet)}</strong></span>
                      <button 
                        onClick={() => handleCashOut(i)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1 rounded text-xs transition-colors shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                      >
                        Cash Out
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settled Bets */}
        {settledBets.length > 0 && (
          <div className="glass-card !p-4">
            <h3 className="font-bold mb-3 border-b border-[var(--border-color)] pb-2">📜 Settled Bets</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {[...settledBets].reverse().map((bet, i) => (
                <div key={i} className={`bg-[var(--bg-secondary)] rounded p-2 text-sm border shadow-inner ${bet.status === 'WON' ? 'border-green-500/50' : 'border-red-500/50'}`}>
                  <div className="flex justify-between font-bold mb-1">
                    <span className={bet.status === 'WON' ? 'text-green-400' : 'text-red-400'}>{bet.status}</span>
                    <span>Wager: ${bet.wager}</span>
                    {bet.status === 'WON' && <span className="text-green-400">Won: ${bet.potentialWin}</span>}
                  </div>
                  {bet.slip.map((leg, idx) => (
                    <div key={idx} className="border-t border-[var(--border-color)] pt-1 mt-1 text-xs text-[var(--text-secondary)]">
                      <div>{leg.home} vs {leg.away}</div>
                      <div className="font-bold text-white">
                        {getMarketLabel(leg.market, leg.home, leg.away)} @ {leg.odds}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Commentary Feed */}
        {(isLive || currentMinute === 90) && (
          <div className="glass-card !p-4">
            <h3 className="font-bold mb-3 border-b border-[var(--border-color)] pb-2">🎙️ Match Feed</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {liveEvents.length === 0 && isLive && (
                <div className="text-sm text-[var(--text-secondary)] animate-pulse">Awaiting kickoff...</div>
              )}
              {liveEvents.map((e, idx) => {
                const isFeaturedFeed = e.matchId === featuredMatchId;
                return (
                  <div key={idx} className={`text-sm p-2 rounded border-l-2 ${isFeaturedFeed ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[var(--accent-primary)]">{e.minute}'</span>
                      <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">{e.home} v {e.away}</span>
                    </div>
                    <div className={
                      e.type === "goal" ? "font-bold text-[var(--accent-primary)]" :
                      e.type === "red_card" ? "font-bold text-red-500" :
                      "text-[var(--text-secondary)]"
                    }>
                      {e.type === "commentary" ? e.text :
                       e.type === "goal" ? `⚽ GOAL! ${e.player} scores!` :
                       e.type === "red_card" ? `🟥 RED CARD for ${e.team}!` :
                       e.type === "yellow_card" ? `🟨 Yellow card (${e.team})` :
                       e.type === "corner" ? `🚩 Corner kick for ${e.team}` :
                       `🦵 Foul committed by ${e.team}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
