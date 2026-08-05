"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";

export default function TournamentPage() {
  const [teams, setTeams] = useState([]);
  const [bracket, setBracket] = useState({
    qf: [], // 4 matches
    sf: [], // 2 matches
    f: [],  // 1 match
    winner: null
  });
  const [activeRound, setActiveRound] = useState("qf");
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [futuresBet, setFuturesBet] = useState(null);
  
  const { deductCoins, playSound } = useAppContext();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/teams");
        const data = await res.json();
        if (data.teams) {
          // Select 8 top teams
          const topTeams = [...data.teams].sort((a, b) => b.power - a.power).slice(0, 8);
          setTeams(topTeams);
          
          // Generate Quarter Finals
          const qfMatches = [];
          for (let i = 0; i < 4; i++) {
            qfMatches.push({
              id: `qf${i}`,
              home: topTeams[i * 2],
              away: topTeams[i * 2 + 1],
              hScore: null,
              aScore: null,
              winner: null
            });
          }
          setBracket({ qf: qfMatches, sf: [], f: [], winner: null });
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchTeams();
  }, []);

  const placeFuturesBet = (team) => {
    if (activeRound !== "qf" || bracket.qf[0].winner !== null) {
      alert("Betting is closed once the tournament has started!");
      return;
    }
    const bankroll = parseFloat(localStorage.getItem("bankroll") || "0");
    const wager = 50; // Fixed $50 wager
    if (wager > bankroll) {
      alert("Insufficient funds!");
      return;
    }
    
    const odds = (100 / team.power).toFixed(2);
    
    // Deduct coins
    const newBankroll = bankroll - wager;
    localStorage.setItem("bankroll", newBankroll.toString());
    window.dispatchEvent(new Event("bankrollUpdate"));
    deductCoins(wager);
    playSound("coin");
    
    setFuturesBet({ team, wager, odds, potentialWin: (wager * parseFloat(odds)).toFixed(2) });
  };

  const simulateMatch = (home, away) => {
    // Basic weighted random simulation
    const totalPower = home.power + away.power;
    const hWinProb = home.power / totalPower;
    
    let hScore = 0;
    let aScore = 0;
    
    while(hScore === aScore) {
      hScore = Math.floor(Math.random() * 5);
      aScore = Math.floor(Math.random() * 5);
      // Give advantage to stronger team
      if (Math.random() < hWinProb) {
        hScore += 1;
      } else {
        aScore += 1;
      }
    }
    
    return {
      hScore,
      aScore,
      winner: hScore > aScore ? home : away
    };
  };

  const simulateRound = () => {
    setSimulating(true);
    playSound("whistle");
    
    setTimeout(() => {
      const newBracket = { ...bracket };
      
      if (activeRound === "qf") {
        const nextRound = [];
        newBracket.qf = newBracket.qf.map(m => {
          const res = simulateMatch(m.home, m.away);
          return { ...m, ...res };
        });
        // Create Semis
        for (let i = 0; i < 2; i++) {
          nextRound.push({
            id: `sf${i}`,
            home: newBracket.qf[i*2].winner,
            away: newBracket.qf[i*2 + 1].winner,
            hScore: null,
            aScore: null,
            winner: null
          });
        }
        newBracket.sf = nextRound;
        setActiveRound("sf");
      } 
      else if (activeRound === "sf") {
        const nextRound = [];
        newBracket.sf = newBracket.sf.map(m => {
          const res = simulateMatch(m.home, m.away);
          return { ...m, ...res };
        });
        // Create Final
        nextRound.push({
          id: `f0`,
          home: newBracket.sf[0].winner,
          away: newBracket.sf[1].winner,
          hScore: null,
          aScore: null,
          winner: null
        });
        newBracket.f = nextRound;
        setActiveRound("f");
      }
      else if (activeRound === "f") {
        newBracket.f = newBracket.f.map(m => {
          const res = simulateMatch(m.home, m.away);
          return { ...m, ...res };
        });
        newBracket.winner = newBracket.f[0].winner;
        setActiveRound("done");
        
        // Payout futures bet
        if (futuresBet && futuresBet.team.name === newBracket.winner.name) {
          setTimeout(() => {
            let currentBankroll = parseFloat(localStorage.getItem("bankroll") || "0");
            currentBankroll += parseFloat(futuresBet.potentialWin);
            localStorage.setItem("bankroll", currentBankroll.toString());
            window.dispatchEvent(new Event("bankrollUpdate"));
            playSound("coin");
            alert(`🎉 CONGRATULATIONS! Your futures bet won £${futuresBet.potentialWin}!`);
          }, 1000);
        } else if (futuresBet) {
          setTimeout(() => {
            alert(`😭 Your futures bet on ${futuresBet.team.name} lost.`);
          }, 1000);
        }
      }
      
      setBracket(newBracket);
      setSimulating(false);
    }, 2000);
  };

  const MatchBox = ({ match }) => {
    if (!match) return <div className="h-16 w-48 border border-gray-800 rounded bg-black/20" />;
    return (
      <div className="h-16 w-48 glass-card border border-[var(--border-color)] overflow-hidden flex flex-col text-sm relative">
        <div className="flex-1 flex justify-between items-center px-2 border-b border-[var(--border-color)] bg-black/40">
          <span className={`truncate font-bold ${match.winner && match.winner.name === match.home.name ? 'text-green-400' : ''}`}>{match.home.name}</span>
          <span className="font-black text-[var(--accent-primary)]">{match.hScore !== null ? match.hScore : '-'}</span>
        </div>
        <div className="flex-1 flex justify-between items-center px-2 bg-black/40">
          <span className={`truncate font-bold ${match.winner && match.winner.name === match.away.name ? 'text-green-400' : ''}`}>{match.away.name}</span>
          <span className="font-black text-[var(--accent-primary)]">{match.aScore !== null ? match.aScore : '-'}</span>
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center py-20 animate-pulse font-sans">Loading Tournament Engine...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-sans animate-fade-in pt-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">
            🏆 Virtual Champions League
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Bet on the overall winner, then simulate the knockout bracket.
          </p>
        </div>
        <div className="flex gap-4">
          {activeRound !== "done" && (
            <button 
              onClick={simulateRound} 
              disabled={simulating}
              className="btn-primary px-8 py-3 flex items-center justify-center gap-2"
            >
              {simulating ? "Simulating..." : `Simulate ${activeRound.toUpperCase()}`}
            </button>
          )}
          <Link href="/dashboard/simulate" className="btn-secondary px-6">Back to Virtual Hub</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
        
        {/* Futures Betting Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4">
            <h2 className="font-bold text-xl mb-4 text-yellow-400">Futures Betting</h2>
            {futuresBet ? (
              <div className="bg-white/5 p-4 rounded border border-yellow-400/30 text-center space-y-2">
                <p className="text-sm text-[var(--text-secondary)]">Your Pick to Win</p>
                <p className="font-black text-xl">{futuresBet.team.name}</p>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-800">
                  <span>Wager: £{futuresBet.wager}</span>
                  <span className="text-green-400">To Win: £{futuresBet.potentialWin}</span>
                </div>
              </div>
            ) : activeRound !== "qf" || bracket.qf[0]?.winner !== null ? (
              <div className="text-center py-4 text-gray-500">Betting Closed.</div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-secondary)] mb-2">Pick the tournament winner. Fixed £50 wager.</p>
                {teams.map(team => {
                  const odds = (100 / team.power).toFixed(2);
                  return (
                    <button 
                      key={team.name}
                      onClick={() => placeFuturesBet(team)}
                      className="w-full flex justify-between items-center p-2 bg-white/5 hover:bg-white/10 rounded transition-colors"
                    >
                      <span className="font-bold text-sm truncate max-w-[120px] text-left">{team.name}</span>
                      <span className="text-[var(--accent-primary)] font-bold">{odds}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {bracket.winner && (
            <div className="glass-card p-6 text-center border-[var(--accent-primary)] border-2 animate-bounce">
              <h2 className="text-lg font-bold text-[var(--text-secondary)]">Tournament Winner</h2>
              <p className="text-3xl font-black mt-2 text-[var(--accent-primary)]">{bracket.winner.name}</p>
              <div className="mt-4 text-4xl">🏆</div>
            </div>
          )}
        </div>

        {/* Bracket Visualization */}
        <div className="lg:col-span-3 overflow-x-auto">
          <div className="min-w-[700px] flex justify-between items-center relative py-10">
            
            {/* Quarter Finals */}
            <div className="flex flex-col gap-8 z-10">
              <h3 className="font-bold text-center text-gray-500 mb-4 uppercase tracking-widest text-sm">Quarter Finals</h3>
              {bracket.qf.map((m, i) => <MatchBox key={i} match={m} />)}
            </div>

            {/* Connecting Lines QF to SF */}
            <div className="absolute left-[190px] top-[95px] h-[80px] w-8 border-r-2 border-t-2 border-b-2 border-gray-700 opacity-50"></div>
            <div className="absolute left-[190px] top-[385px] h-[80px] w-8 border-r-2 border-t-2 border-b-2 border-gray-700 opacity-50"></div>

            {/* Semi Finals */}
            <div className="flex flex-col gap-[144px] z-10 pt-[40px]">
              <h3 className="font-bold text-center text-gray-500 mb-4 uppercase tracking-widest text-sm absolute top-0 w-48">Semi Finals</h3>
              {bracket.sf.length > 0 ? (
                bracket.sf.map((m, i) => <MatchBox key={i} match={m} />)
              ) : (
                <>
                  <MatchBox match={null} />
                  <MatchBox match={null} />
                </>
              )}
            </div>

            {/* Connecting Lines SF to F */}
            <div className="absolute left-[445px] top-[140px] h-[280px] w-8 border-r-2 border-t-2 border-b-2 border-gray-700 opacity-50"></div>

            {/* Final */}
            <div className="flex flex-col z-10 relative">
              <h3 className="font-bold text-center text-yellow-500 mb-4 uppercase tracking-widest text-sm absolute -top-16 w-48">The Final</h3>
              {bracket.f.length > 0 ? (
                <MatchBox match={bracket.f[0]} />
              ) : (
                <MatchBox match={null} />
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
