import { getMarketLabel } from "@/lib/utils";

export default function BetSlip({ betSlip, setBetSlip, wager, setWager, placeBet }) {
  const totalOdds = betSlip.length > 0 
    ? betSlip.reduce((acc, bet) => acc * bet.odds, 1) 
    : 0.00;
  const potentialWin = (wager * totalOdds).toFixed(2);

  return (
    <div className="hidden lg:block w-80 flex-shrink-0">
      <div className="bet-slip p-4 sticky top-20">
        <h3 className="font-bold text-lg mb-4">
          🎫 Bet Slip
          {betSlip.length > 0 && (
            <span className="ml-2 text-sm bg-[var(--accent-primary)] text-[var(--bg-primary)] px-2 py-0.5 rounded-full">
              {betSlip.length}
            </span>
          )}
        </h3>

        {betSlip.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-8">
            Click on odds to add selections
          </p>
        ) : (
          <>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {betSlip.map((bet, i) => (
                <div key={i} className="bg-[var(--bg-card)] rounded-lg p-3 shadow-inner">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {bet.away ? `${bet.home} vs ${bet.away}` : bet.home}
                      </p>
                      <p className="text-sm font-semibold mt-0.5 text-white">
                        {bet.market.startsWith('WIN_') ? `To Win (${bet.market.replace('WIN_', '')})` : bet.market.startsWith('PLC_') ? `To Place (${bet.market.replace('PLC_', '')})` : getMarketLabel(bet.market, bet.home, bet.away)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--accent-primary)] font-bold">
                        {bet.odds}
                      </span>
                      <button
                        onClick={() => setBetSlip(betSlip.filter((_, idx) => idx !== i))}
                        className="text-red-400 text-xs hover:text-red-300 transition-colors bg-red-400/10 h-5 w-5 rounded flex items-center justify-center"
                        title="Remove selection"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Accumulator Info */}
            {betSlip.length > 1 && (
              <div className="bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30 rounded-lg p-2 mb-3 text-center">
                <span className="text-xs text-[var(--accent-secondary)] font-semibold">
                  🔥 {betSlip.length}-Fold Accumulator
                </span>
              </div>
            )}

            <div className="border-t border-white/10 pt-3 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Total Odds</span>
                <span className="font-bold text-[var(--accent-primary)]">
                  {totalOdds.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Wager ($)</label>
                <input
                  type="number"
                  value={wager}
                  onChange={(e) => setWager(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="input-field mt-1 w-full text-lg"
                  min="1"
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Potential Win</span>
                <span className="font-bold text-[var(--accent-warning)] text-lg">${potentialWin}</span>
              </div>

              <button onClick={placeBet} className="btn-primary w-full py-3 mt-2 text-base font-bold shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                Place Bet — ${wager}
              </button>
              <button
                onClick={() => setBetSlip([])}
                className="btn-danger w-full text-sm mt-1"
              >
                Clear Slip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
