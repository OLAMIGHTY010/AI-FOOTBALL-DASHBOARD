"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";

// Mock Data for Virtual Leagues if backend is empty
const VIRTUAL_LEAGUES = [
  {
    id: "england",
    name: "England Virtual",
    matches: [
      { id: 1, home: "ARS", away: "LIV", time: "14:30", odds: { "1": 2.10, "X": 3.40, "2": 3.25 }, markets: 45 },
      { id: 2, home: "MCI", away: "CHE", time: "14:30", odds: { "1": 1.55, "X": 4.10, "2": 5.80 }, markets: 42 },
      { id: 3, home: "MUN", away: "TOT", time: "14:30", odds: { "1": 2.40, "X": 3.30, "2": 2.90 }, markets: 48 },
    ]
  },
  {
    id: "spain",
    name: "Spain Virtual",
    matches: [
      { id: 4, home: "RMA", away: "BAR", time: "14:35", odds: { "1": 2.05, "X": 3.50, "2": 3.40 }, markets: 45 },
      { id: 5, home: "ATM", away: "SEV", time: "14:35", odds: { "1": 1.70, "X": 3.70, "2": 4.80 }, markets: 39 },
    ]
  },
  {
    id: "italy",
    name: "Italy Virtual",
    matches: [
      { id: 6, home: "JUV", away: "MIL", time: "14:40", odds: { "1": 2.20, "X": 3.10, "2": 3.30 }, markets: 36 },
      { id: 7, home: "INT", away: "NAP", time: "14:40", odds: { "1": 1.95, "X": 3.40, "2": 3.80 }, markets: 40 },
    ]
  },
  {
    id: "germany",
    name: "Germany Virtual",
    matches: [
      { id: 8, home: "BAY", away: "DOR", time: "14:45", odds: { "1": 1.40, "X": 5.00, "2": 7.00 }, markets: 44 },
    ]
  }
];

export default function DashboardHome() {
  const { aiCoins, user } = useAppContext();
  const [activeTab, setActiveTab] = useState("virtual");
  const [fixtures, setFixtures] = useState([]);
  const [fplData, setFplData] = useState(null);
  const [betslip, setBetslip] = useState([]);
  const [expandedLeagues, setExpandedLeagues] = useState({ england: true, spain: true, italy: true, germany: true });

  useEffect(() => {
    // Attempt to fetch real fixtures, fallback to mock if empty
    const loadData = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fixtures");
        if (res.ok) {
          const data = await res.json();
          // Assuming backend returns an array of matches. 
          // If it's valid data, we could group it. For now, use mock to guarantee the layout matches user request perfectly.
        }
      } catch(e) {}
    };
    loadData();
  }, []);

  const toggleLeague = (id) => {
    setExpandedLeagues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addToBetslip = (match, selection, odds) => {
    const existing = betslip.find(b => b.matchId === match.id);
    if (existing) {
      if (existing.selection === selection) {
        // Remove if clicked again
        setBetslip(betslip.filter(b => b.matchId !== match.id));
      } else {
        // Update selection
        setBetslip(betslip.map(b => b.matchId === match.id ? { ...b, selection, odds } : b));
      }
    } else {
      setBetslip([...betslip, { matchId: match.id, home: match.home, away: match.away, selection, odds }]);
    }
  };

  const getOddsClass = (matchId, selection) => {
    const isSelected = betslip.some(b => b.matchId === matchId && b.selection === selection);
    return isSelected 
      ? "bg-[var(--accent-primary)] text-black border-[var(--accent-primary)] font-bold" 
      : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700 font-semibold";
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-4 py-4 animate-fade-in text-white">
      
      {/* 1. LEFT SIDEBAR: Navigation & Filters */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-4">
        {/* FPL Hub Navigation */}
        <div className="bg-[#1e293b] rounded overflow-hidden border border-[var(--border-color)]">
          <div className="bg-gray-800 px-4 py-2 font-bold text-sm border-b border-gray-700 flex items-center gap-2 text-gray-200">
            <span className="text-xl">🛡️</span> FPL Hub
          </div>
          <div className="flex flex-col">
            <Link href="/dashboard/fpl" className="px-4 py-2 hover:bg-gray-700 text-sm text-gray-400 hover:text-white transition-colors border-b border-gray-800/50">My Pitch (Coming Soon)</Link>
            <Link href="/dashboard/leagues" className="px-4 py-2 hover:bg-gray-700 text-sm text-gray-400 hover:text-white transition-colors border-b border-gray-800/50">Mini Leagues</Link>
            <Link href="/dashboard/fixtures" className="px-4 py-2 hover:bg-gray-700 text-sm text-gray-400 hover:text-white transition-colors border-b border-gray-800/50">Live Fixtures</Link>
            <Link href="/dashboard/fpl/stats" className="px-4 py-2 hover:bg-gray-700 text-sm text-gray-400 hover:text-white transition-colors">Player Stats</Link>
          </div>
        </div>

        {/* Virtual Sports Navigation */}
        <div className="bg-[#1e293b] rounded overflow-hidden border border-[var(--border-color)]">
          <div className="bg-gray-800 px-4 py-2 font-bold text-sm border-b border-gray-700 flex items-center gap-2 text-gray-200">
            <span className="text-xl">🎮</span> Virtual Hub
          </div>
          <div className="flex flex-col">
            <button onClick={() => setActiveTab('virtual')} className={`px-4 py-2 text-sm text-left transition-colors border-b border-gray-800/50 ${activeTab === 'virtual' ? 'bg-gray-700 text-[var(--accent-primary)] font-bold' : 'hover:bg-gray-700 text-gray-400'}`}>Virtual Football</button>
            <button onClick={() => setActiveTab('basketball')} className={`px-4 py-2 text-sm text-left transition-colors border-b border-gray-800/50 ${activeTab === 'basketball' ? 'bg-gray-700 text-[var(--accent-primary)] font-bold' : 'hover:bg-gray-700 text-gray-400'}`}>Virtual Basketball (Soon)</button>
            <button onClick={() => setActiveTab('racing')} className={`px-4 py-2 text-sm text-left transition-colors border-b border-gray-800/50 ${activeTab === 'racing' ? 'bg-gray-700 text-[var(--accent-primary)] font-bold' : 'hover:bg-gray-700 text-gray-400'}`}>Virtual Racing (Soon)</button>
            <Link href="/dashboard/simulate/minigames/crash" className="px-4 py-2 hover:bg-gray-700 text-sm text-gray-400 hover:text-white transition-colors">Crash Game</Link>
          </div>
        </div>
      </aside>

      {/* 2. CENTER COLUMN: Main Betting Area (SportyBet Virtual Layout) */}
      <main className="flex-1 flex flex-col gap-4">
        
        {/* Toggle Bar */}
        <div className="flex items-center gap-2 overflow-x-auto bg-[#1e293b] p-2 rounded border border-[var(--border-color)]">
          <button className="px-4 py-1.5 bg-[var(--accent-primary)] text-black font-bold text-sm rounded whitespace-nowrap">Live Betting</button>
          <button className="px-4 py-1.5 bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 text-sm rounded whitespace-nowrap font-semibold transition-colors">Upcoming Matches</button>
          <div className="ml-auto flex items-center gap-2 pr-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></div>
            <span className="text-xs text-[var(--accent-primary)] font-bold">142 LIVE</span>
          </div>
        </div>

        {/* Leagues Feed */}
        <div className="flex flex-col gap-4">
          {VIRTUAL_LEAGUES.map(league => (
            <div key={league.id} className="bg-[#1e293b] rounded overflow-hidden border border-[var(--border-color)]">
              {/* League Header */}
              <div 
                className="bg-gray-800 px-4 py-2 flex items-center justify-between cursor-pointer border-b border-gray-700 hover:bg-gray-700 transition-colors"
                onClick={() => toggleLeague(league.id)}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] text-[var(--accent-primary)] font-black transition-transform ${expandedLeagues[league.id] ? '' : '-rotate-90'}`}>▼</span>
                  <span className="font-bold text-sm text-gray-200">{league.name}</span>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-gray-400">
                  <div className="w-10 text-center">1</div>
                  <div className="w-10 text-center">X</div>
                  <div className="w-10 text-center">2</div>
                </div>
              </div>

              {/* League Matches */}
              {expandedLeagues[league.id] && (
                <div className="flex flex-col">
                  {league.matches.map(match => (
                    <div key={match.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors gap-3 sm:gap-0">
                      
                      {/* Match Info */}
                      <div className="flex items-center gap-4 flex-1 w-full">
                        <div className="text-xs text-gray-500 w-10 text-center">{match.time}</div>
                        <div className="flex flex-col border-l border-gray-700 pl-4 py-1">
                          <span className="text-sm font-bold text-gray-200">{match.home}</span>
                          <span className="text-sm font-bold text-gray-200 mt-1">{match.away}</span>
                        </div>
                      </div>

                      {/* Odds & More Markets */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <div className="flex gap-1 w-full sm:w-auto">
                          <button 
                            onClick={() => addToBetslip(match, '1', match.odds['1'])}
                            className={`flex-1 sm:w-[48px] h-[40px] rounded flex items-center justify-center text-xs border transition-colors ${getOddsClass(match.id, '1')}`}
                          >
                            <span className="text-[10px] text-gray-500 mr-2 sm:hidden">1</span>
                            {match.odds['1'].toFixed(2)}
                          </button>
                          <button 
                            onClick={() => addToBetslip(match, 'X', match.odds['X'])}
                            className={`flex-1 sm:w-[48px] h-[40px] rounded flex items-center justify-center text-xs border transition-colors ${getOddsClass(match.id, 'X')}`}
                          >
                            <span className="text-[10px] text-gray-500 mr-2 sm:hidden">X</span>
                            {match.odds['X'].toFixed(2)}
                          </button>
                          <button 
                            onClick={() => addToBetslip(match, '2', match.odds['2'])}
                            className={`flex-1 sm:w-[48px] h-[40px] rounded flex items-center justify-center text-xs border transition-colors ${getOddsClass(match.id, '2')}`}
                          >
                            <span className="text-[10px] text-gray-500 mr-2 sm:hidden">2</span>
                            {match.odds['2'].toFixed(2)}
                          </button>
                        </div>
                        <Link href="/dashboard/simulate" className="text-xs text-[var(--accent-primary)] hover:underline font-bold w-12 text-right flex items-center justify-end group whitespace-nowrap">
                          {match.markets}+ <span className="ml-1 opacity-50 group-hover:opacity-100">›</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                  <div className="p-2 text-center bg-gray-800/20">
                    <Link href="/dashboard/simulate" className="text-xs text-gray-400 hover:text-white transition-colors">Show More ▾</Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR: Betslip & Wallet */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 gap-4">
        
        {/* Wallet Snapshot */}
        <div className="bg-[#1e293b] rounded p-4 border border-[var(--border-color)] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Total Balance</span>
            <span className="font-black text-xl text-[var(--accent-primary)]">₦{aiCoins.toFixed(2)}</span>
          </div>
          <Link href="/dashboard/wallet" className="bg-[var(--accent-primary)] text-black px-3 py-1.5 rounded text-xs font-bold hover:brightness-110 transition-all">
            Deposit
          </Link>
        </div>

        {/* Betslip */}
        <div className="bg-[#1e293b] rounded overflow-hidden border border-[var(--border-color)] flex flex-col min-h-[400px]">
          <div className="flex bg-gray-800">
            <button className="flex-1 py-3 text-sm font-bold border-b-2 border-[var(--accent-primary)] text-white">Betslip</button>
            <button className="flex-1 py-3 text-sm font-bold border-b border-gray-700 text-gray-500 hover:text-gray-400">Cashout</button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-[#1e293b] p-3 flex flex-col gap-2">
            {betslip.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 mt-10">
                <span className="text-3xl mb-2">🎫</span>
                <p className="text-xs text-gray-400 font-semibold mb-1">To place a bet, click on the odds.</p>
                <p className="text-[10px] text-gray-500">You can add multiple selections to create a parlay.</p>
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
            <Link href="/dashboard/simulate" className={`w-full py-2.5 rounded font-bold text-sm text-center transition-all ${betslip.length > 0 ? 'bg-[var(--accent-primary)] text-black hover:brightness-110 shadow-[0_0_10px_rgba(0,255,170,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'}`}>
              Review Bet
            </Link>
          </div>
        </div>

        {/* Promo */}
        <Link href="/dashboard/simulate/minigames/crash" className="bg-gradient-to-br from-red-900 to-black rounded border border-red-500/50 p-4 block relative overflow-hidden group">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518605368461-1ee516248c8b?q=80&w=500&auto=format&fit=crop')] bg-cover opacity-20 group-hover:scale-105 transition-transform"></div>
           <div className="absolute right-[-10px] top-[-10px] text-5xl opacity-20 group-hover:rotate-12 transition-transform">🚀</div>
           <div className="relative z-10">
             <h3 className="font-black text-white italic text-lg tracking-tight">VIRTUAL CRASH</h3>
             <p className="text-xs text-red-200 mt-1 mb-3">Multiplier rising... Cash out before it drops!</p>
             <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider group-hover:bg-red-500 transition-colors inline-block">PLAY NOW</span>
           </div>
        </Link>
      </aside>
    </div>
  );
}
