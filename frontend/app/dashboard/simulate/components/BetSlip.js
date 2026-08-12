import React from 'react';
import { getMarketLabel } from "@/lib/utils";

export default function BetSlip({ betSlip, setBetSlip, stake, setStake, placeBet, bankroll }) {
  const removeSelection = (id) => {
    setBetSlip(betSlip.filter(leg => leg.fixtureId !== id));
  };

  const totalOdds = betSlip.reduce((acc, leg) => acc * parseFloat(leg.odds), 1).toFixed(2);
  const potentialWin = (stake * totalOdds).toFixed(2);

  if (betSlip.length === 0) {
    return (
      <div className="glass-card p-4 text-center">
        <h3 className="font-bold text-lg mb-2">🎟️ Bet Slip</h3>
        <p className="text-sm text-[var(--text-secondary)]">Click odds to add to your slip.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 border-[var(--accent-primary)] border-t-4">
      <h3 className="font-bold text-lg mb-4 flex justify-between items-center">
        <span>🎟️ Bet Slip</span>
        <span className="text-xs bg-[var(--bg-secondary)] px-2 py-1 rounded-full">{betSlip.length} Selections</span>
      </h3>
      
      <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
        {betSlip.map((leg, idx) => (
          <div key={idx} className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)] relative group">
            <button 
              onClick={() => removeSelection(leg.fixtureId)}
              className="absolute top-2 right-2 text-[var(--text-secondary)] hover:text-red-500 opacity-50 hover:opacity-100"
            >
              ✕
            </button>
            <div className="text-xs text-[var(--text-secondary)] mb-1">{leg.home} vs {leg.away}</div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-white">{getMarketLabel(leg.market, leg.home, leg.away)}</span>
              <span className="font-bold text-[var(--accent-primary)]">{leg.odds}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-secondary)]">Total Odds</span>
          <span className="font-bold">{totalOdds}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">Stake:</span>
          <input 
            type="number" 
            value={stake} 
            onChange={(e) => setStake(Math.max(1, parseInt(e.target.value) || 1))}
            className="input-field flex-1 py-1 px-2 text-right font-bold"
            min="1"
          />
        </div>

        <div className="flex justify-between items-end">
          <span className="text-sm text-[var(--text-secondary)]">To Win</span>
          <span className="font-black text-xl text-green-400">£{potentialWin}</span>
        </div>

        <button 
          onClick={placeBet}
          disabled={stake > bankroll}
          className={`w-full py-3 rounded font-bold transition-all ${stake > bankroll ? 'bg-red-500/50 cursor-not-allowed' : 'btn-primary'}`}
        >
          {stake > bankroll ? 'Insufficient Funds' : 'Place Bet'}
        </button>
      </div>
    </div>
  );
}
