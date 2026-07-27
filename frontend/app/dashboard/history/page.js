"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function HistoryPage() {
  const [pendingBets, setPendingBets] = useState([]);
  const [settledBets, setSettledBets] = useState([]);

  useEffect(() => {
    setPendingBets(JSON.parse(localStorage.getItem("pending_bets") || "[]"));
    setSettledBets(JSON.parse(localStorage.getItem("settled_bets") || "[]"));
    
    // Auto refresh every 5 seconds to catch live updates
    const interval = setInterval(() => {
      setPendingBets(JSON.parse(localStorage.getItem("pending_bets") || "[]"));
      setSettledBets(JSON.parse(localStorage.getItem("settled_bets") || "[]"));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getMarketLabel = (market, home, away) => {
    if (market === "1") return `${home} Win`;
    if (market === "X") return "Draw";
    if (market === "2") return `${away} Win`;
    if (market === "O2.5") return "Over 2.5 Goals";
    if (market === "U2.5") return "Under 2.5 Goals";
    if (market === "BTTS_Y") return "BTTS - Yes";
    if (market === "BTTS_N") return "BTTS - No";
    return market;
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">📜 Bet History</h1>
          <p className="text-[var(--text-secondary)]">Track all your active and settled wagers.</p>
        </div>
        <Link href="/dashboard/sportsbook" className="btn-primary">
          Place New Bet 📊
        </Link>
      </div>

      <div className="space-y-12">
        {/* PENDING BETS */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <span className="text-[var(--accent-warning)] animate-pulse">●</span> Active Bets
          </h2>
          {pendingBets.length === 0 ? (
            <div className="glass-card text-center text-[var(--text-secondary)] py-12">
              <div className="text-5xl mb-4">🎫</div>
              <p>No active bets currently.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingBets.map((bet, i) => (
                <div key={i} className="glass-card !p-5 border-l-4 border-[var(--accent-warning)] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between font-bold mb-4 bg-black/30 p-3 rounded-lg">
                      <div>
                        <div className="text-[10px] text-[var(--text-secondary)] uppercase">Wager</div>
                        <div className="text-lg">${bet.wager}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[var(--text-secondary)] uppercase">To Win</div>
                        <div className="text-lg text-[var(--accent-warning)]">${bet.potentialWin}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {bet.slip.map((leg, idx) => (
                        <div key={idx} className="bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border-color)] text-sm relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent-warning)]"></div>
                          <div className="text-[var(--text-secondary)] mb-1 pl-2">{leg.home} vs {leg.away}</div>
                          <div className="font-bold pl-2">{getMarketLabel(leg.market, leg.home, leg.away)} @ <span className="text-white">{leg.odds}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <span className="inline-block px-4 py-1 bg-yellow-500/10 text-[var(--accent-warning)] rounded-full text-xs font-bold border border-yellow-500/20">
                      Awaiting Results...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SETTLED BETS */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <span className="text-[var(--text-secondary)]">✅</span> Settled Bets
          </h2>
          {settledBets.length === 0 ? (
            <div className="glass-card text-center text-[var(--text-secondary)] py-12">
              <div className="text-5xl mb-4 opacity-50">📉</div>
              <p>No settled bets yet. Run a simulation to see results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...settledBets].reverse().map((bet, i) => (
                <div key={i} className={`glass-card !p-5 border-l-4 ${bet.status === 'WON' || bet.status === 'CASHOUT' ? 'border-green-500' : 'border-red-500'}`}>
                  <div className={`flex justify-between font-bold mb-4 bg-black/30 p-3 rounded-lg ${bet.status === 'WON' || bet.status === 'CASHOUT' ? 'border border-green-500/20' : 'border border-red-500/20'}`}>
                    <div>
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase">Wager</div>
                      <div className="text-lg">${bet.wager}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase">Result</div>
                      <div className={`text-lg ${bet.status === 'WON' || bet.status === 'CASHOUT' ? 'text-green-500' : 'text-red-500'}`}>
                        {bet.status === 'WON' || bet.status === 'CASHOUT' ? `+$${bet.potentialWin}` : `-$${bet.wager}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mb-4">
                    <span className={`inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                      bet.status === 'WON' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      bet.status === 'CASHOUT' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {bet.status}
                    </span>
                  </div>

                  <div className="space-y-3 opacity-70 hover:opacity-100 transition-opacity">
                    {bet.slip.map((leg, idx) => (
                      <div key={idx} className="bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border-color)] text-sm">
                        <div className="text-[var(--text-secondary)] mb-1 text-xs">{leg.home} vs {leg.away}</div>
                        <div className="font-bold">{getMarketLabel(leg.market, leg.home, leg.away)} @ {leg.odds}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
