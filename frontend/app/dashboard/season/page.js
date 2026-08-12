"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LEAGUES, initSeason, simulateNextWeek, calculateTable } from "@/lib/seasonEngine";
import { useAppContext } from "@/app/context/AppContext";

export default function SeasonHubPage() {
  const [seasonState, setSeasonState] = useState(null);
  const [table, setTable] = useState([]);
  const [isClient, setIsClient] = useState(false);

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

  const handleStartSeason = (leagueId) => {
    const newState = initSeason(leagueId);
    setSeasonState(newState);
    setTable(calculateTable(leagueId, []));
    localStorage.setItem("seasonState", JSON.stringify(newState));
  };

  const handleSimulateWeek = () => {
    if (!seasonState) return;
    const newState = simulateNextWeek(seasonState);
    setSeasonState(newState);
    setTable(calculateTable(newState.leagueId, newState.results));
    localStorage.setItem("seasonState", JSON.stringify(newState));
  };

  const handleResetSeason = () => {
    if(confirm("Are you sure you want to abandon the current season?")) {
      setSeasonState(null);
      setTable([]);
      localStorage.removeItem("seasonState");
    }
  };

  if (!isClient) return <div className="p-8">Loading...</div>;

  // League Selection Screen
  if (!seasonState) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in pt-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-3">
            🏆 Select a League to Simulate
          </h1>
          <p className="text-[var(--text-secondary)]">Start a new 38-game season and place bets on the outcome.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(LEAGUES).map((league) => (
            <div key={league.id} className="glass-card flex flex-col items-center p-8 border-t-4 border-transparent hover:border-[var(--accent-primary)] transition-all">
              <div className="text-5xl mb-4">🌍</div>
              <h2 className="text-2xl font-bold mb-2">{league.name}</h2>
              <p className="text-[var(--text-secondary)] mb-6">{league.teams.length} Teams</p>
              <button 
                onClick={() => handleStartSeason(league.id)}
                className="btn-primary w-full py-3 font-bold"
              >
                Start Season
              </button>
            </div>
          ))}
          <Link href="/dashboard/season/stats" className="glass-card flex flex-col items-center p-8 border-t-4 border-transparent hover:border-amber-500 transition-all bg-gradient-to-b from-transparent to-amber-900/10">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold mb-2">Player Stats & Hall of Fame</h2>
            <p className="text-[var(--text-secondary)] mb-6 text-center text-sm">Track the golden boot race and discover the ultimate legends of the virtual game.</p>
          </Link>
        </div>
      </div>
    );
  }

  // Active Season Screen
  const league = LEAGUES[seasonState.leagueId];
  const isFinished = seasonState.currentWeek >= seasonState.schedule.length;
  
  // Get upcoming fixtures
  const upcomingFixtures = !isFinished ? seasonState.schedule[seasonState.currentWeek] : [];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pt-6">
      <div className="flex justify-between items-center mb-8 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-3xl font-black mb-1">
            🏆 {league.name} <span className="text-[var(--accent-primary)]">Gameweek {seasonState.currentWeek}</span>
          </h1>
          <p className="text-[var(--text-secondary)]">Simulate the season and place weekly bets.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/season/stats" className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
            <span>🏆</span> Player Stats & Hall of Fame
          </Link>
          <button onClick={handleResetSeason} className="btn-secondary px-4 py-2 text-sm text-red-400 hover:text-red-300">
            Abandon Season
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action Bar */}
          <div className="glass-card p-6 flex items-center justify-between bg-gradient-to-r from-[#162032] to-blue-900/20 border-l-4 border-[var(--accent-primary)]">
            <div>
              <h2 className="text-xl font-bold mb-1">
                {isFinished ? "Season Complete! 🎉" : "Ready to Simulate?"}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {isFinished ? "View the final standings or start a new season." : `Next up: Gameweek ${seasonState.currentWeek + 1} of ${seasonState.schedule.length}`}
              </p>
            </div>
            {!isFinished && (
              <button 
                onClick={handleSimulateWeek}
                className="btn-primary px-8 py-4 text-lg font-black animate-pulse-glow"
              >
                Simulate Week ⏭️
              </button>
            )}
          </div>

          {/* Upcoming Fixtures */}
          {!isFinished && (
            <div className="glass-card p-0 overflow-hidden">
              <div className="p-4 border-b border-[var(--border-color)] bg-black/40 flex justify-between items-center">
                <h3 className="font-bold">🗓️ Upcoming Fixtures</h3>
                <Link href="/dashboard/season/futures" className="text-sm text-[var(--accent-primary)] hover:underline">
                  Place Weekly Bets →
                </Link>
              </div>
              <div className="divide-y divide-[var(--border-color)] max-h-[400px] overflow-y-auto">
                {upcomingFixtures.map((fix, idx) => {
                  const home = league.teams.find(t => t.id === fix.home);
                  const away = league.teams.find(t => t.id === fix.away);
                  return (
                    <div key={idx} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                      <div className="flex-1 text-right font-bold">{home.name}</div>
                      <div className="px-4 text-sm text-[var(--text-secondary)]">vs</div>
                      <div className="flex-1 text-left font-bold">{away.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Recent Results (if any) */}
          {seasonState.currentWeek > 0 && (
            <div className="glass-card p-0 overflow-hidden mt-6">
              <div className="p-4 border-b border-[var(--border-color)] bg-black/40">
                <h3 className="font-bold">⚽ GW {seasonState.currentWeek} Results</h3>
              </div>
              <div className="divide-y divide-[var(--border-color)] max-h-[300px] overflow-y-auto">
                {seasonState.results[seasonState.currentWeek - 1].map((res, idx) => {
                  const home = league.teams.find(t => t.id === res.home);
                  const away = league.teams.find(t => t.id === res.away);
                  return (
                    <div key={idx} className="p-3 flex justify-between items-center text-sm">
                      <div className="flex-1 text-right">{home.name}</div>
                      <div className="px-4 font-black text-[var(--accent-primary)] text-lg">
                        {res.homeGoals} - {res.awayGoals}
                      </div>
                      <div className="flex-1 text-left">{away.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Top 5 Table */}
          <div className="glass-card p-0 overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] bg-black/40 flex justify-between items-center">
              <h3 className="font-bold">🏆 Title Race</h3>
              <Link href="/dashboard/season/standings" className="text-sm text-[var(--accent-primary)] hover:underline">
                Full Table
              </Link>
            </div>
            <div className="p-2">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[var(--text-secondary)]">
                    <th className="py-2 pl-2">Team</th>
                    <th className="py-2 text-center">P</th>
                    <th className="py-2 text-right pr-2">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {table.slice(0, 5).map((row, idx) => (
                    <tr key={row.id} className="border-t border-gray-800/50">
                      <td className="py-2 pl-2 font-bold flex gap-2">
                        <span className="text-[var(--text-secondary)]">{idx + 1}.</span> {row.name}
                      </td>
                      <td className="py-2 text-center text-[var(--text-secondary)]">{row.played}</td>
                      <td className="py-2 text-right pr-2 font-black text-green-400">{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* News Feed */}
          <div className="glass-card p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              📰 Latest News
            </h3>
            <div className="space-y-4">
              {seasonState.news.map((item, idx) => (
                <div key={idx} className="border-l-2 border-blue-500 pl-3">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">GW {item.week}</div>
                  <div className="text-sm leading-snug">{item.text}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
