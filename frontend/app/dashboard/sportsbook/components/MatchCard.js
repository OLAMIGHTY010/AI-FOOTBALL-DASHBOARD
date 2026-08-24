import { MARKET_LABELS } from "@/lib/utils";

export default function MatchCard({ fixture, currentSport, isSelected, addToBetSlip }) {
  if (currentSport === "racing") {
    return (
      <div className="glass-card mb-3 transition-transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
          <span className="text-sm text-[var(--accent-primary)] font-black uppercase">
            🏁 {fixture.name}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          {fixture.runners?.map((runner, rIdx) => (
            <div key={runner.id} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5 hover:border-[var(--accent-primary)] transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 w-4">{rIdx + 1}.</span>
                <span className="text-sm font-bold truncate max-w-[120px]">{runner.name}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addToBetSlip(fixture, `WIN_${runner.id}`, runner.odds.win_decimal)}
                  className={`odds-btn px-3 py-1 ${isSelected(fixture.id, `WIN_${runner.id}`) ? "selected" : ""}`}
                >
                  <span className="text-[9px] block text-[var(--text-secondary)]">Win</span>
                  {runner.odds.win_decimal}
                </button>
                <button
                  onClick={() => addToBetSlip(fixture, `PLC_${runner.id}`, runner.odds.place_decimal)}
                  className={`odds-btn px-3 py-1 ${isSelected(fixture.id, `PLC_${runner.id}`) ? "selected" : ""}`}
                >
                  <span className="text-[9px] block text-[var(--text-secondary)]">Place</span>
                  {runner.odds.place_decimal}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card mb-3 transition-transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--accent-primary)] font-semibold">
          {fixture.home?.league}
        </span>
        <span className="text-xs text-[var(--text-secondary)]">
          ⭐ {fixture.home?.star} vs {fixture.away?.star}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="font-bold">{fixture.home?.name}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            PWR {fixture.home?.power}
          </p>
        </div>
        <div className="px-4 text-lg font-bold text-[var(--text-secondary)]">vs</div>
        <div className="flex-1 text-right">
          <p className="font-bold">{fixture.away?.name}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            PWR {fixture.away?.power}
          </p>
        </div>
      </div>

      {/* Main Odds */}
      <div className={`grid ${currentSport === 'basketball' || currentSport === 'tennis' ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mb-2`}>
        {(currentSport === 'basketball' || currentSport === 'tennis' ? ["1", "2"] : ["1", "X", "2"]).map((m) => (
          <button
            key={m}
            onClick={() => addToBetSlip(fixture, m, fixture.odds[m])}
            className={`odds-btn ${isSelected(fixture.id, m) ? "selected" : ""}`}
          >
            <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">
              {currentSport === 'basketball' ? (m === "1" ? "Home Win" : "Away Win") : currentSport === 'tennis' ? (m === "1" ? "Home Win" : "Away Win") : MARKET_LABELS[m]}
            </div>
            {fixture.odds[m]}
          </button>
        ))}
      </div>

      {/* More Markets */}
      <details className="mt-2 group">
        <summary className="text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--accent-primary)] outline-none">
          + More Markets
        </summary>
        <div className={`grid gap-2 mt-3 ${currentSport === 'basketball' || currentSport === 'tennis' ? 'grid-cols-2' : 'grid-cols-4'} animate-fade-in`}>
          {(currentSport === 'basketball' 
            ? ["O210.5", "U210.5"] 
            : currentSport === 'tennis'
            ? ["O22.5", "U22.5"]
            : ["O2.5", "U2.5", "BTTS_Y", "BTTS_N", "1X", "X2", "C_O9.5", "C_U9.5", "Y_O3.5", "Y_U3.5", "RED_Y", "RED_N"]
          ).map((m) => (
            <button
              key={m}
              onClick={() => addToBetSlip(fixture, m, fixture.odds[m])}
              className={`odds-btn text-xs ${isSelected(fixture.id, m) ? "selected" : ""}`}
            >
              <div className="text-[9px] text-[var(--text-secondary)] mb-0.5">
                {currentSport === 'basketball' ? (m === "O210.5" ? "Over 210.5 Pts" : "Under 210.5 Pts") : currentSport === 'tennis' ? (m === "O22.5" ? "Over 22.5 Games" : "Under 22.5 Games") : MARKET_LABELS[m]}
              </div>
              {fixture.odds[m]}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
