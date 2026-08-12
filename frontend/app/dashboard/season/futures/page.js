"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LEAGUES, calculateTable } from "@/lib/seasonEngine";
import { useAppContext } from "@/app/context/AppContext";

export default function SeasonFuturesPage() {
  const { aiCoins, addAiCoins } = useAppContext();
  const [seasonState, setSeasonState] = useState(null);
  const [table, setTable] = useState([]);
  const [isClient, setIsClient] = useState(false);
  
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState(null);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("seasonState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSeasonState(parsed);
        setTable(calculateTable(parsed.leagueId, parsed.results));
      } catch(e) {}
    }
  }, []);

  if (!isClient) return <div className="p-8">Loading...</div>;

  if (!seasonState) {
    return (
      <div className="text-center p-20 animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">No Active Season</h2>
        <Link href="/dashboard/season" className="btn-primary px-6 py-3">Start a Season to Bet</Link>
      </div>
    );
  }

  const league = LEAGUES[seasonState.leagueId];
  const isFinished = seasonState.currentWeek >= seasonState.schedule.length;

  // Calculate dynamic odds based on current table position and remaining games
  const remainingGames = seasonState.schedule.length - seasonState.currentWeek;
  const maxPossiblePoints = remainingGames * 3;
  const leaderPts = table.length > 0 ? table[0].pts : 0;

  const getWinnerOdds = (team) => {
    if (isFinished) return team.id === table[0].id ? 1.0 : 0;
    
    // Base odds derived from team overall rating
    const baseProb = Math.pow(team.ovr / 100, 5); 
    
    // Adjust based on current points deficit
    const deficit = leaderPts - team.pts;
    if (deficit > maxPossiblePoints) return 0; // Mathematically eliminated
    
    const deficitPenalty = Math.exp(-deficit / 5);
    const rawProb = baseProb * deficitPenalty;
    
    // Convert to odds (min 1.01, max 5000)
    let odds = (1 / rawProb) * 0.9; // 10% house edge
    if (odds < 1.01) odds = 1.01;
    if (odds > 5000) odds = 5000;
    
    return odds.toFixed(2);
  };

  const handlePlaceBet = () => {
    if (!selectedBet) return;
    if (aiCoins < betAmount) {
      alert("Insufficient Bankroll!");
      return;
    }

    // Deduct coins
    addAiCoins(-betAmount);

    // Save bet to season state
    const newBet = {
      id: Date.now(),
      teamId: selectedBet.teamId,
      teamName: selectedBet.teamName,
      type: "LEAGUE_WINNER",
      odds: selectedBet.odds,
      stake: betAmount,
      potentialPayout: (betAmount * selectedBet.odds).toFixed(2),
      weekPlaced: seasonState.currentWeek,
      status: "PENDING"
    };

    const newState = {
      ...seasonState,
      futuresBets: [...(seasonState.futuresBets || []), newBet]
    };
    
    setSeasonState(newState);
    localStorage.setItem("seasonState", JSON.stringify(newState));
    
    alert(`Bet Placed! £${betAmount} on ${selectedBet.teamName} to win the league.`);
    setSelectedBet(null);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pt-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">
            💰 Futures Betting Market
          </h1>
          <p className="text-[var(--text-secondary)]">Predict the League Winner. Odds shift after every Gameweek.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#162032] border border-[var(--border-color)] px-4 py-2 rounded-lg font-black text-yellow-400">
            Bankroll: £{aiCoins.toFixed(2)}
          </div>
          <Link href="/dashboard/season" className="btn-secondary px-4 py-2 text-sm">
            ← Back to Hub
          </Link>
        </div>
      </div>

      {isFinished ? (
        <div className="glass-card p-10 text-center border-t-4 border-[var(--accent-primary)]">
          <h2 className="text-2xl font-bold mb-2">Season Complete!</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            The league has finished. Return to the hub to start a new season and place new futures bets.
          </p>
          <Link href="/dashboard/season" className="btn-primary px-6 py-3">View Final Standings</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Odds List */}
          <div className="lg:col-span-2 glass-card p-0 overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] bg-black/40">
              <h3 className="font-bold">🏆 Outright Winner Odds (GW {seasonState.currentWeek})</h3>
            </div>
            <div className="divide-y divide-[var(--border-color)] max-h-[600px] overflow-y-auto">
              {table.map((team, idx) => {
                const rawTeam = league.teams.find(t => t.id === team.id);
                const odds = getWinnerOdds(rawTeam);
                
                if (odds == 0) return null; // Eliminated

                const isSelected = selectedBet?.teamId === team.id;

                return (
                  <div 
                    key={team.id} 
                    className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/30' : 'hover:bg-white/5'}`}
                    onClick={() => setSelectedBet({ teamId: team.id, teamName: team.name, odds })}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--text-secondary)] font-mono text-sm w-4">{idx + 1}.</span>
                      <span className="font-bold">{team.name}</span>
                    </div>
                    <div className={`font-black px-4 py-1 rounded bg-[#162032] border ${isSelected ? 'border-blue-400 text-blue-400' : 'border-[var(--border-color)] text-[var(--accent-primary)]'}`}>
                      {odds}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bet Slip */}
          <div className="space-y-6">
            <div className="glass-card p-6 sticky top-6">
              <h3 className="font-bold mb-4 border-b border-[var(--border-color)] pb-2">🎟️ Bet Slip</h3>
              
              {!selectedBet ? (
                <div className="text-center py-10 text-[var(--text-secondary)] text-sm border-2 border-dashed border-[var(--border-color)] rounded-xl">
                  Select a team's odds to place a bet.
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-[#162032] p-3 rounded-lg border border-blue-500/30">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">League Winner</div>
                    <div className="font-bold">{selectedBet.teamName}</div>
                    <div className="text-sm font-black text-[var(--accent-primary)] mt-1">Odds: {selectedBet.odds}</div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-[var(--text-secondary)] block mb-2">Stake (£)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={betAmount} 
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="w-full bg-[#162032] border border-[var(--border-color)] rounded px-3 py-2 text-white font-bold"
                        min="1"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[10, 50, 100, 500].map(amt => (
                        <button 
                          key={amt} 
                          onClick={() => setBetAmount(amt)}
                          className="flex-1 bg-white/5 hover:bg-white/10 rounded py-1 text-xs font-bold transition-colors"
                        >
                          +£{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-t border-[var(--border-color)]">
                    <span className="text-sm text-[var(--text-secondary)]">Potential Win:</span>
                    <span className="font-black text-green-400">£{(betAmount * selectedBet.odds).toFixed(2)}</span>
                  </div>

                  <button 
                    onClick={handlePlaceBet}
                    className="btn-primary w-full py-3 font-black text-lg shadow-[0_0_15px_rgba(0,255,135,0.3)] hover:shadow-[0_0_25px_rgba(0,255,135,0.5)] transition-all"
                  >
                    Place Bet
                  </button>
                </div>
              )}
            </div>
            
            {/* Active Bets */}
            {seasonState.futuresBets && seasonState.futuresBets.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-bold mb-3 text-sm border-b border-[var(--border-color)] pb-2">Active Futures</h3>
                <div className="space-y-3">
                  {seasonState.futuresBets.map(bet => (
                    <div key={bet.id} className="bg-black/40 p-3 rounded text-sm border-l-2 border-yellow-400">
                      <div className="flex justify-between font-bold mb-1">
                        <span>{bet.teamName}</span>
                        <span className="text-[var(--accent-primary)]">{bet.odds}</span>
                      </div>
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <span>Stake: £{bet.stake}</span>
                        <span>To Win: £{bet.potentialPayout}</span>
                      </div>
                      <div className="mt-1 text-[10px] text-gray-500 text-right">Placed GW{bet.weekPlaced}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
