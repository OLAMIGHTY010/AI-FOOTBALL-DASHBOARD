"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import VirtualTabs from "../components/VirtualTabs";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/app/context/AppContext";
import { MARKET_LABELS, getMarketLabel } from "@/lib/utils";
import MatchCard from "./components/MatchCard";
import BetSlip from "./components/BetSlip";

const API_URL = "http://localhost:8000";

export default function SportsbookPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SportsbookPage />
    </Suspense>
  );
}

function SportsbookPage() {
  const searchParams = useSearchParams();
  const { addToast, aiCoins, deductCoins, setAiCoins } = useAppContext();
  const currentSport = searchParams.get("sport") || "football";
  const apiEndpoint = currentSport === "basketball" ? `${API_URL}/api/fixtures/basketball` : currentSport === "tennis" ? `${API_URL}/api/fixtures/tennis` : currentSport === "racing" ? `${API_URL}/api/fixtures/racing` : `${API_URL}/api/fixtures`;

  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [betSlip, setBetSlip] = useState([]);
  const [wager, setWager] = useState(10);
  const [selectedLeague, setSelectedLeague] = useState("All");
  const [leagues, setLeagues] = useState([]);
  const [activeTab, setActiveTab] = useState("odds"); // 'odds', 'history', 'leaderboard'
  const [isBetBuilderMode, setIsBetBuilderMode] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [pendingBets, setPendingBets] = useState([]);
  const [settledBets, setSettledBets] = useState([]);

  useEffect(() => {
    fetchFixtures();
    fetchBetHistory();
    fetchLeaderboard();
  }, []);

  const fetchBetHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      try {
        const res = await fetch(`${API_URL}/api/bet/history?user_id=${session.user.id}`);
        const data = await res.json();
        setPendingBets(data.pending || []);
        setSettledBets(data.settled || []);
      } catch (e) {
        console.error("Failed to fetch bet history", e);
      }
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("user_id, balance")
        .order("balance", { ascending: false })
        .limit(100);
      if (data) setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFixtures = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint);
      let data = await res.json();
      
      if (data && data.fixtures) {
        data = data.fixtures;
      }
      
      setFixtures(data);
      if (currentSport === "racing") {
        setLeagues([]);
        setSelectedLeague("All");
      } else {
        const uniqueLeagues = [...new Set(data.map((f) => f.home?.league).filter(Boolean))];
        setLeagues(uniqueLeagues);
      }
    } catch (err) {
      console.error("Failed to fetch fixtures:", err);
    }
    setLoading(false);
  };

  const addToBetSlip = (fixture, market, odds) => {
    setBetSlip(prevSlip => {
      const exists = prevSlip.find((b) => b.fixtureId === fixture.id && b.market === market);
      if (exists) {
        return prevSlip.filter((b) => !(b.fixtureId === fixture.id && b.market === market));
      }
      
      if (isBetBuilderMode) {
        const sameFixtureBets = prevSlip.filter(b => b.fixtureId === fixture.id);
        const mutuallyExclusive = {
          "1": ["2", "X", "X2", "12"], "2": ["1", "X", "1X", "12"], "X": ["1", "2", "12"],
          "1X": ["2"], "X2": ["1"], "12": ["X"],
          "O2.5": ["U2.5"], "U2.5": ["O2.5"],
          "BTTS_Y": ["BTTS_N"], "BTTS_N": ["BTTS_Y"],
          "C_O9.5": ["C_U9.5"], "C_U9.5": ["C_O9.5"],
          "Y_O3.5": ["Y_U3.5"], "Y_U3.5": ["Y_O3.5"],
          "RED_Y": ["RED_N"], "RED_N": ["RED_Y"],
          "F_O22.5": ["F_U22.5"], "F_U22.5": ["F_O22.5"],
          "H_STAR_Y": ["H_STAR_N"], "H_STAR_N": ["H_STAR_Y"],
          "A_STAR_Y": ["A_STAR_N"], "A_STAR_N": ["A_STAR_Y"]
        };
        
        const hasConflict = sameFixtureBets.some(b => 
          mutuallyExclusive[market] && mutuallyExclusive[market].includes(b.market)
        );
        if (hasConflict) {
          addToast("Bet Builder Error", "You cannot combine mutually exclusive markets!", "error");
          return prevSlip;
        }
        return [...prevSlip, { fixtureId: fixture.id, home: fixture.home?.name || fixture.name, away: fixture.away?.name || null, market, odds }];
      } else {
        return [...prevSlip.filter((b) => b.fixtureId !== fixture.id), { fixtureId: fixture.id, home: fixture.home?.name || fixture.name, away: fixture.away?.name || null, market, odds }];
      }
    });
  };

  const isSelected = (fixtureId, market) => {
    return betSlip.some((b) => b.fixtureId === fixtureId && b.market === market);
  };

  const totalOdds = betSlip.reduce((acc, b) => acc * b.odds, 1);
  const potentialWin = (wager * totalOdds).toFixed(2);

  const placeBet = async () => {
    if (betSlip.length === 0) return;
    
    if (wager > aiCoins) {
      if (aiCoins === 0) {
        setShowBankModal(true);
      } else {
        addToast("Insufficient Funds", "Lower your wager or go bankrupt to visit the virtual bank.", "error");
      }
      return;
    }
    
    deductCoins(wager);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // The backend API will now handle the Supabase wallet deduction.
      // API Call for Phase 4 Bets
      if (betSlip.length > 0) {
        try {
          await fetch(`${API_URL}/api/bet/parlay`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ legs: betSlip, wager: parseFloat(wager), user_id: session.user.id })
          });
          fetchBetHistory(); // Refresh bets
        } catch (e) {
          console.error("Failed to register parlay on backend", e);
        }
      }
    }
    
    setBetSlip([]);
    addToast("Bet Placed!", `Wager: $${wager} | Potential Win: $${potentialWin}`, "success");
  };

  const takeLoan = async () => {
    let debt = parseFloat(localStorage.getItem("virtual_debt") || "0");
    
    debt += 550;
    const newBankroll = aiCoins + 500;
    
    localStorage.setItem("virtual_debt", debt.toString());
    setAiCoins(newBankroll);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("profiles").update({ bankroll: newBankroll }).eq("id", session.user.id);
    }
    
    setShowBankModal(false);
    addToast("Loan Approved!", "$500 added to your account. You now owe the bank $550.", "success");
  };

  const filteredFixtures = selectedLeague === "All" || currentSport === "racing"
    ? fixtures
    : fixtures.filter((f) => f.home?.league === selectedLeague);

  return (
    <div className="flex gap-6 animate-fade-in flex-col lg:flex-row pb-20">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        
        <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-4 mt-8">
          <div>
            <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Sportsbook</h1>
            <p className="text-[var(--text-secondary)]">Live odds, bet builder, and instant settlement.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard/sportsbook/predictor" className="btn-secondary flex items-center gap-2">
              <span>🏆</span> Weekly Predictor
            </Link>
            <button onClick={() => setShowBankModal(true)} className="btn-primary">
              Deposit Funds 🏦
            </button>
          </div>
        </div>

        <VirtualTabs />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Sportsbook</h1>
            <div className="flex gap-4 border-b border-[var(--border-color)] pb-2">
              <button 
                onClick={() => setActiveTab("odds")} 
                className={`text-sm font-bold pb-2 -mb-2.5 ${activeTab === "odds" ? "text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]" : "text-[var(--text-secondary)]"}`}
              >
                Live Odds
              </button>
              <button 
                onClick={() => setActiveTab("history")} 
                className={`text-sm font-bold pb-2 -mb-2.5 ${activeTab === "history" ? "text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]" : "text-[var(--text-secondary)]"}`}
              >
                My Bets History
              </button>
              <button 
                onClick={() => setActiveTab("leaderboard")} 
                className={`text-sm font-bold pb-2 -mb-2.5 ${activeTab === "leaderboard" ? "text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]" : "text-[var(--text-secondary)]"}`}
              >
                Leaderboards
              </button>
            </div>
          </div>
          {activeTab === "odds" && (
            <div className="flex gap-2">
              <button onClick={() => {setIsBetBuilderMode(!isBetBuilderMode); setBetSlip([]);}} className={`btn-secondary text-sm ${isBetBuilderMode ? 'bg-[var(--accent-primary)] text-black border-[var(--accent-primary)]' : ''}`}>
                🛠️ Bet Builder {isBetBuilderMode ? 'ON' : 'OFF'}
              </button>
              <button onClick={fetchFixtures} className="btn-secondary text-sm">
                🔄 Refresh Odds
              </button>
            </div>
          )}
        </div>

        {activeTab === "odds" && (
          <>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-3 pt-1 scroll-smooth">
          <button
            onClick={() => setSelectedLeague("All")}
            className={`odds-btn flex-shrink-0 ${selectedLeague === "All" ? "selected" : ""}`}
          >
            All
          </button>
          {leagues.map((l) => (
            <button
              key={l}
              onClick={() => setSelectedLeague(l)}
              className={`odds-btn flex-shrink-0 whitespace-nowrap ${selectedLeague === l ? "selected" : ""}`}
            >
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-[var(--text-secondary)]">Loading fixtures...</div>
        ) : (
          <div className="space-y-3">
            {filteredFixtures.map((fixture) => (
              <MatchCard 
                key={fixture.id} 
                fixture={fixture} 
                currentSport={currentSport} 
                isSelected={isSelected} 
                addToBetSlip={addToBetSlip} 
              />
            ))}
          </div>
        )}
          </>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-[var(--accent-warning)]">●</span> Pending Bets
              </h2>
              {pendingBets.length === 0 ? (
                <div className="glass-card text-center text-[var(--text-secondary)] py-8">
                  No active bets currently.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingBets.map((bet, i) => (
                    <div key={i} className="glass-card !p-4 border-l-4 border-[var(--accent-warning)]">
                      <div className="flex justify-between font-bold mb-3">
                        <span>Wager: ${bet.wager}</span>
                        <span className="text-[var(--accent-warning)]">Win: ${bet.potentialWin}</span>
                      </div>
                      <div className="space-y-2">
                        {bet.slip.map((leg, idx) => (
                          <div key={idx} className="bg-[var(--bg-secondary)] p-2 rounded text-sm">
                            <div className="text-[var(--text-secondary)] mb-1">{leg.away ? `${leg.home} vs ${leg.away}` : leg.home}</div>
                            <div className="font-bold">{leg.market.startsWith('WIN_') ? `To Win (${leg.market.replace('WIN_', '')})` : leg.market.startsWith('PLC_') ? `To Place (${leg.market.replace('PLC_', '')})` : getMarketLabel(leg.market, leg.home, leg.away)} @ {leg.odds}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">📜</span> Settled Bets
              </h2>
              {settledBets.length === 0 ? (
                <div className="glass-card text-center text-[var(--text-secondary)] py-8">
                  No settled bets yet. Run a simulation to see results.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...settledBets].reverse().map((bet, i) => (
                    <div key={i} className={`glass-card !p-4 border-l-4 ${bet.status === 'WON' ? 'border-green-500' : 'border-red-500'}`}>
                      <div className="flex justify-between font-bold mb-3">
                        <span className={bet.status === 'WON' ? 'text-green-500' : 'text-red-500'}>{bet.status}</span>
                        <span>Wager: ${bet.wager}</span>
                        {bet.status === 'WON' && <span className="text-green-500">Won: ${bet.potentialWin}</span>}
                      </div>
                      <div className="space-y-2">
                        {bet.slip.map((leg, idx) => (
                          <div key={idx} className="bg-[var(--bg-secondary)] p-2 rounded text-sm opacity-80">
                            <div className="text-[var(--text-secondary)] mb-1">{leg.away ? `${leg.home} vs ${leg.away}` : leg.home}</div>
                            <div className="font-bold">{leg.market.startsWith('WIN_') ? `To Win (${leg.market.replace('WIN_', '')})` : leg.market.startsWith('PLC_') ? `To Place (${leg.market.replace('PLC_', '')})` : getMarketLabel(leg.market, leg.home, leg.away)} @ {leg.odds}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === "leaderboard" && (
          <div className="glass-card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🌍 Global Top 100 Richest Managers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/20 text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-4 py-2 w-12 text-center">Rank</th>
                    <th className="px-4 py-2">Manager ID</th>
                    <th className="px-4 py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user, i) => (
                    <tr key={i} className="border-b border-[var(--border-color)] hover:bg-white/5">
                      <td className="px-4 py-3 text-center font-bold text-[var(--text-secondary)]">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs">{user.user_id.split('-')[0]}***</td>
                      <td className="px-4 py-3 text-right font-black text-[var(--accent-primary)]">${user.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-[var(--text-secondary)]">Loading Leaderboard...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full border border-[var(--accent-primary)] shadow-[0_0_50px_rgba(0,212,170,0.2)]">
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2">🏦 Virtual Bank</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              You are bankrupt! The bank is offering you a lifeline loan of <strong className="text-white">$500</strong> with a 10% interest rate. 
              <br/><br/>
              Total Debt to Repay: <strong className="text-red-400">$550</strong>
            </p>
            <div className="flex gap-4">
              <button onClick={takeLoan} className="btn-primary flex-1 py-3 text-lg">Sign Loan Agreement</button>
              <button onClick={() => setShowBankModal(false)} className="btn-secondary px-6 py-3">Decline</button>
            </div>
          </div>
        </div>
      )}

      <BetSlip 
        betSlip={betSlip} 
        setBetSlip={setBetSlip} 
        wager={wager} 
        setWager={setWager} 
        placeBet={placeBet} 
      />
    </div>
  );
}
