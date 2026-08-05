import React from 'react';
import { getMarketLabel } from "@/lib/utils";

export default function BetHistory({ settledBets }) {
  if (settledBets.length === 0) {
    return (
      <div className="glass-card !p-4">
        <h3 className="font-bold mb-3 border-b border-[var(--border-color)] pb-2">📜 Bet History</h3>
        <p className="text-sm text-[var(--text-secondary)] text-center py-4">No settled bets yet.</p>
      </div>
    );
  }

  const totalWagered = settledBets.reduce((acc, bet) => acc + parseFloat(bet.wager), 0);
  const totalReturned = settledBets.reduce((acc, bet) => {
    if (bet.status === "WON") return acc + parseFloat(bet.potentialWin);
    if (bet.status === "CASH OUT") return acc + parseFloat(bet.potential_payout || bet.wager);
    return acc;
  }, 0);
  const profitLoss = totalReturned - totalWagered;
  const roi = totalWagered > 0 ? ((profitLoss / totalWagered) * 100).toFixed(1) : 0;

  return (
    <div className="glass-card !p-4">
      <h3 className="font-bold mb-3 border-b border-[var(--border-color)] pb-2">📜 Bet History</h3>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[var(--bg-secondary)] p-2 rounded border border-[var(--border-color)]">
          <div className="text-[10px] text-[var(--text-secondary)]">Total Wagered</div>
          <div className="font-bold">£{totalWagered.toFixed(2)}</div>
        </div>
        <div className={`p-2 rounded border ${profitLoss >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="text-[10px] text-[var(--text-secondary)]">Net Profit / ROI</div>
          <div className={`font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profitLoss >= 0 ? '+' : ''}£{profitLoss.toFixed(2)} ({roi}%)
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {[...settledBets].reverse().map((bet, i) => (
          <div key={i} className={`rounded p-2 text-sm border shadow-inner ${bet.status === 'WON' ? 'bg-green-500/10 border-green-500/50' : bet.status === 'CASH OUT' ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
            <div className="flex justify-between font-bold mb-1">
              <span>Wager: £{bet.wager}</span>
              <span className={bet.status === 'WON' ? 'text-green-400' : bet.status === 'CASH OUT' ? 'text-yellow-400' : 'text-red-400'}>
                {bet.status} {bet.status === 'WON' ? `(+£${bet.potentialWin})` : bet.status === 'CASH OUT' ? `(+£${bet.potential_payout})` : ''}
              </span>
            </div>
            {bet.slip.map((leg, idx) => (
              <div key={idx} className="border-t border-black/20 pt-1 mt-1 text-xs opacity-80">
                <div>{leg.home} vs {leg.away}</div>
                <div className="font-bold">
                  {getMarketLabel(leg.market, leg.home, leg.away)} @ {leg.odds}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
