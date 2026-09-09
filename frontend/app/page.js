"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import RegistrationModal from "./components/RegistrationModal";

// MOCK DATA for Landing Page UI
const POPULAR_LEAGUES = [
  { id: 1, name: "Premier League", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: 2, name: "La Liga", icon: "🇪🇸" },
  { id: 3, name: "Serie A", icon: "🇮🇹" },
  { id: 4, name: "Bundesliga", icon: "🇩🇪" },
  { id: 5, name: "Ligue 1", icon: "🇫🇷" },
  { id: 6, name: "Champions League", icon: "🌍" },
];

const SPORTS = [
  "Football", "Basketball", "Tennis", "Table Tennis", 
  "Cricket", "Rugby", "Esports", "Virtuals"
];

const MOCK_MATCHES = [
  { id: 101, home: "Arsenal", away: "Liverpool", time: "Today, 17:30", odds: { "1": 2.10, "X": 3.40, "2": 3.25 } },
  { id: 102, home: "Real Madrid", away: "Barcelona", time: "Today, 20:00", odds: { "1": 1.95, "X": 3.80, "2": 3.10 } },
  { id: 103, home: "Juventus", away: "AC Milan", time: "Tomorrow, 14:00", odds: { "1": 2.50, "X": 3.10, "2": 2.80 } },
  { id: 104, home: "Bayern Munich", away: "Dortmund", time: "Tomorrow, 16:30", odds: { "1": 1.45, "X": 4.50, "2": 6.20 } },
  { id: 105, home: "PSG", away: "Marseille", time: "Sun, 21:00", odds: { "1": 1.60, "X": 4.00, "2": 5.50 } },
];

const RECENT_WINNERS = [
  { user: "Alex_99", amount: "₦ 450,200", game: "Sports Betting" },
  { user: "ChiefBet", amount: "₦ 1,200,000", game: "Virtual Crash" },
  { user: "GoalScorer", amount: "₦ 85,000", game: "Raffle Draw" },
  { user: "LuckyStar", amount: "₦ 600,000", game: "PvP Arena" },
];

export default function SportybetLandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [betslip, setBetslip] = useState([]);

  const addToBetslip = (match, selection, odds) => {
    const existing = betslip.find(b => b.matchId === match.id);
    if (existing) {
      if (existing.selection === selection) {
        setBetslip(betslip.filter(b => b.matchId !== match.id));
      } else {
        setBetslip(betslip.map(b => b.matchId === match.id ? { ...b, selection, odds } : b));
      }
    } else {
      setBetslip([...betslip, { matchId: match.id, home: match.home, away: match.away, selection, odds }]);
    }
  };

  const getOddsClass = (matchId, selection) => {
    const isSelected = betslip.some(b => b.matchId === matchId && b.selection === selection);
    return isSelected 
      ? "bg-[var(--accent-primary)] text-black border-[var(--accent-primary)] font-bold group" 
      : "bg-gray-700 hover:bg-[var(--accent-primary)] hover:text-black transition-colors border-gray-600 hover:border-transparent font-bold group";
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = "/dashboard";
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    
    if (!email || !password) {
      setLoginError("Please enter email and password.");
      setIsLoggingIn(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message);
      setIsLoggingIn(false);
      return;
    }
    window.location.href = "/dashboard";
  };

  const handleMockBet = () => {
    setIsRegisterModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans flex flex-col text-white">
      {/* 1. TOP HEADER (Darker Blue/Black) */}
      <header className="bg-[#0b1120] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
            <img src="/logo.png" alt="SimScoutbet" className="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-[0_0_10px_rgba(0,255,170,0.5)]" />
            <span className="text-xl md:text-2xl font-black italic tracking-tighter text-white">
              SimScout<span className="text-[var(--accent-primary)]">bet</span>
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#1e293b] border border-gray-700 text-sm px-3 py-2 rounded focus:outline-none focus:border-[var(--accent-primary)] w-full md:w-40"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1e293b] border border-gray-700 text-sm px-3 py-2 rounded focus:outline-none focus:border-[var(--accent-primary)] w-full md:w-32"
            />
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="bg-[var(--accent-primary)] text-black font-bold text-sm px-4 py-2 rounded hover:brightness-110 transition-all whitespace-nowrap"
            >
              {isLoggingIn ? "..." : "Log In"}
            </button>
            <button 
              type="button" 
              onClick={() => setIsRegisterModalOpen(true)}
              className="border border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold text-sm px-4 py-2 rounded hover:bg-[var(--accent-primary)] hover:text-black transition-all whitespace-nowrap"
            >
              Register
            </button>
          </form>
        </div>
        {loginError && (
          <div className="max-w-7xl mx-auto px-4 pb-2 text-red-500 text-xs text-right">
            {loginError}
          </div>
        )}
      </header>

      {/* 2. SECONDARY NAVIGATION (Sub-header) */}
      <nav className="bg-[#1e293b] shadow-md border-b border-gray-800 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center px-4">
          {["Sports", "Live Betting", "Virtual Hub", "Ultimate Team", "Casino", "FPL Hub", "Jackpot", "Promotions"].map(item => (
            <button 
              key={item}
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-3 text-sm font-bold text-gray-300 hover:text-[var(--accent-primary)] hover:border-b-2 border-[var(--accent-primary)] transition-all whitespace-nowrap"
            >
              {item}
            </button>
          ))}
        </div>
      </nav>

      {/* 3. MAIN CONTENT (3 Columns) */}
      <main className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-4 p-4">
        
        {/* LEFT COLUMN: Navigation Sidebar */}
        <div className="hidden lg:flex flex-col w-64 shrink-0 gap-4">
          <div className="bg-[#1e293b] rounded-lg overflow-hidden border border-[var(--border-color)]">
            <div className="bg-gray-800 px-4 py-2 font-bold text-sm border-b border-gray-700">Popular Leagues</div>
            <div className="flex flex-col">
              {POPULAR_LEAGUES.map(league => (
                <button key={league.id} onClick={handleMockBet} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-sm text-left transition-colors border-b border-gray-800/50 last:border-0">
                  <span>{league.icon}</span>
                  <span className="text-gray-300">{league.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-lg overflow-hidden border border-[var(--border-color)]">
            <div className="bg-gray-800 px-4 py-2 font-bold text-sm border-b border-gray-700">Sports A-Z</div>
            <div className="flex flex-col max-h-[300px] overflow-y-auto">
              {SPORTS.map(sport => (
                <button key={sport} onClick={handleMockBet} className="flex items-center px-4 py-2 hover:bg-gray-700 text-sm text-gray-400 text-left transition-colors border-b border-gray-800/30">
                  {sport}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Action Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Promotional Banner */}
          <div className="bg-gradient-to-r from-gray-900 to-[#1e293b] rounded-lg overflow-hidden border border-[var(--border-color)] relative h-48 sm:h-64 flex items-center p-6 group cursor-pointer" onClick={() => setIsRegisterModalOpen(true)}>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] to-transparent"></div>
            <div className="relative z-10 max-w-md">
              <span className="px-2 py-1 bg-[var(--accent-primary)] text-black text-xs font-bold rounded mb-4 inline-block">WELCOME BONUS</span>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2 uppercase italic">
                Get up to <br/> <span className="text-[var(--accent-primary)]">100% Bonus</span> <br/> on First Deposit!
              </h1>
              <p className="text-gray-300 text-sm mb-4">Join the ultimate AI-powered football betting platform.</p>
              <button className="bg-[var(--accent-primary)] text-black px-6 py-2 rounded font-bold hover:scale-105 transition-transform">
                Claim Now
              </button>
            </div>
          </div>

          {/* Highlights / Match Odds */}
          <div className="bg-[#1e293b] rounded-lg border border-[var(--border-color)] overflow-hidden">
            <div className="flex items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse"></div>
                <h3 className="font-bold">Top Highlights</h3>
              </div>
              <div className="flex gap-4 text-xs font-bold text-gray-400 text-center w-[180px] sm:w-[240px]">
                <div className="flex-1">1</div>
                <div className="flex-1">X</div>
                <div className="flex-1">2</div>
              </div>
            </div>

            <div className="flex flex-col">
              {MOCK_MATCHES.map(match => (
                <div key={match.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">{match.time}</span>
                    <div className="font-bold text-sm text-gray-200">{match.home}</div>
                    <div className="font-bold text-sm text-gray-200">{match.away}</div>
                  </div>
                  
                  {/* Odds Buttons */}
                  <div className="flex gap-2 w-full sm:w-[240px]">
                    <button onClick={() => addToBetslip(match, '1', match.odds['1'])} className={`flex-1 rounded py-2 text-sm flex flex-col items-center justify-center border ${getOddsClass(match.id, '1')}`}>
                      <span className="text-[10px] text-gray-400 group-hover:text-black/70 block sm:hidden">1</span>
                      {match.odds["1"].toFixed(2)}
                    </button>
                    <button onClick={() => addToBetslip(match, 'X', match.odds['X'])} className={`flex-1 rounded py-2 text-sm flex flex-col items-center justify-center border ${getOddsClass(match.id, 'X')}`}>
                      <span className="text-[10px] text-gray-400 group-hover:text-black/70 block sm:hidden">X</span>
                      {match.odds["X"].toFixed(2)}
                    </button>
                    <button onClick={() => addToBetslip(match, '2', match.odds['2'])} className={`flex-1 rounded py-2 text-sm flex flex-col items-center justify-center border ${getOddsClass(match.id, '2')}`}>
                      <span className="text-[10px] text-gray-400 group-hover:text-black/70 block sm:hidden">2</span>
                      {match.odds["2"].toFixed(2)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 text-center">
              <button onClick={() => setIsRegisterModalOpen(true)} className="text-[var(--accent-primary)] text-sm font-bold hover:underline">View All Matches ➔</button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Betslip & Widgets */}
        <div className="hidden lg:flex flex-col w-72 shrink-0 gap-4">
          
          {/* Betslip */}
          <div className="bg-[#1e293b] rounded-lg border border-[var(--border-color)] overflow-hidden flex flex-col min-h-[400px]">
            <div className="bg-gray-800 px-4 py-3 font-bold text-sm border-b border-gray-700 text-center uppercase tracking-wider text-gray-300">
              Betslip
            </div>
            
            <div className="flex-1 overflow-y-auto bg-[#1e293b] p-3 flex flex-col gap-2">
              {betslip.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 mt-10">
                  <span className="text-3xl mb-2">🎫</span>
                  <p className="text-sm text-gray-400 font-semibold mb-2">Your betslip is empty.</p>
                  <p className="text-xs text-gray-500">Please select odds to place a bet.</p>
                </div>
              ) : (
                betslip.map((bet, idx) => (
                  <div key={idx} className="bg-gray-800 rounded p-2 border border-gray-700 relative">
                    <button 
                      onClick={() => setBetslip(betslip.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-400 text-xs transition-colors"
                    >✕</button>
                    <div className="text-xs text-gray-400 mb-1 font-semibold">{bet.home} vs {bet.away}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded">1X2: <span className="text-white">{bet.selection}</span></span>
                      <span className="font-bold text-sm text-[var(--accent-primary)]">{bet.odds.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-gray-800 border-t border-gray-700 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-semibold">Total Odds</span>
                <span className="font-bold text-white text-lg">
                  {betslip.length > 0 ? betslip.reduce((acc, b) => acc * b.odds, 1).toFixed(2) : "0.00"}
                </span>
              </div>
              <button onClick={() => setIsRegisterModalOpen(true)} className={`w-full py-2.5 rounded font-bold text-sm text-center transition-all ${betslip.length > 0 ? 'bg-[var(--accent-primary)] text-black hover:brightness-110 shadow-[0_0_10px_rgba(0,255,170,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'}`}>
                {betslip.length > 0 ? "Login to place bets" : "Select odds to bet"}
              </button>
            </div>
          </div>

          {/* Mini-Games Promo */}
          <div onClick={() => setIsRegisterModalOpen(true)} className="bg-gradient-to-br from-purple-900 to-[#1e293b] rounded-lg border border-purple-500/50 p-4 relative overflow-hidden cursor-pointer group">
            <div className="absolute right-[-20px] top-[-20px] text-8xl opacity-10 group-hover:scale-110 transition-transform">🚀</div>
            <h3 className="font-black text-xl italic mb-1 text-white">VIRTUAL CRASH</h3>
            <p className="text-purple-300 text-xs mb-4">Cash out before it crashes!</p>
            <div className="bg-purple-600 text-white text-xs font-bold py-2 px-4 rounded text-center group-hover:bg-purple-500">
              Play Now
            </div>
          </div>

          {/* Recent Winners Ticker */}
          <div className="bg-[#1e293b] rounded-lg border border-[var(--border-color)] overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 font-bold text-sm border-b border-gray-700 flex justify-between items-center">
              <span>Recent Winners</span>
              <span className="text-[10px] text-[var(--accent-primary)] animate-pulse">● LIVE</span>
            </div>
            <div className="flex flex-col">
              {RECENT_WINNERS.map((winner, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-800/50 last:border-0 bg-gradient-to-r hover:from-gray-800 hover:to-transparent">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-300">{winner.user}</span>
                    <span className="text-[10px] text-gray-500">Won {winner.game}</span>
                  </div>
                  <div className="text-sm font-black text-[var(--accent-primary)]">
                    {winner.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* 4. FOOTER */}
      <footer className="bg-[#0b1120] border-t border-[var(--border-color)] mt-8 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="SimScoutbet" className="w-6 h-6 grayscale opacity-70" />
              <span className="text-lg font-black italic tracking-tighter text-gray-400">SimScoutbet</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              The ultimate AI-powered football betting simulation platform. Play responsibly.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-300 mb-4">Quick Links</h4>
            <ul className="text-xs text-gray-500 space-y-2">
              <li><button onClick={handleMockBet} className="hover:text-[var(--accent-primary)]">Sports Betting</button></li>
              <li><button onClick={handleMockBet} className="hover:text-[var(--accent-primary)]">Live Betting</button></li>
              <li><button onClick={handleMockBet} className="hover:text-[var(--accent-primary)]">Virtual Hub</button></li>
              <li><button onClick={handleMockBet} className="hover:text-[var(--accent-primary)]">Promotions</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-300 mb-4">Help & Support</h4>
            <ul className="text-xs text-gray-500 space-y-2">
              <li><button onClick={handleMockBet} className="hover:text-[var(--accent-primary)]">FAQ</button></li>
              <li><button onClick={handleMockBet} className="hover:text-[var(--accent-primary)]">Contact Us</button></li>
              <li><button onClick={handleMockBet} className="hover:text-[var(--accent-primary)]">Responsible Gambling</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-300 mb-4">Payment Methods</h4>
            <div className="flex gap-2">
              <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center text-[10px] font-bold text-gray-400">VISA</div>
              <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center text-[10px] font-bold text-gray-400">MC</div>
              <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center text-[10px] font-bold text-gray-400">USDT</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-red-900 flex items-center justify-center text-red-500 font-bold text-xs">18+</div>
              <span className="text-xs text-gray-500">Play Responsibly.</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-4 border-t border-gray-800 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} SimScoutbet. All rights reserved.
        </div>
      </footer>

      {/* REGISTRATION MODAL */}
      <RegistrationModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
      />

    </div>
  );
}
