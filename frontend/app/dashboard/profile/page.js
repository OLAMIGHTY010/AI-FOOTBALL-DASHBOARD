"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from "@/app/context/AppContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { translations } from "@/lib/translations";

export default function ProfilePage() {
  const { aiCoins, loginStreak, language } = useAppContext();
  const t = translations[language] || translations['en'];
  
  const [stats, setStats] = useState({
    totalBets: 0,
    totalWagered: 0,
    totalReturned: 0,
    netProfit: 0,
    roi: 0,
    biggestWin: 0,
  });

  const [achievements, setAchievements] = useState([]);
  const [bankrollHistory, setBankrollHistory] = useState([]);

  useEffect(() => {
    // Calculate betting stats from local storage
    const settledBets = JSON.parse(localStorage.getItem("settled_bets") || "[]");
    
    let totalWagered = 0;
    let totalReturned = 0;
    let biggestWin = 0;

    settledBets.forEach(bet => {
      const wager = parseFloat(bet.wager);
      totalWagered += wager;
      
      let returned = 0;
      if (bet.status === "WON") {
        returned = parseFloat(bet.potentialWin);
      } else if (bet.status === "CASH OUT") {
        returned = parseFloat(bet.potential_payout || bet.wager);
      }
      
      totalReturned += returned;
      
      if (bet.status === "WON" && (returned - wager) > biggestWin) {
        biggestWin = returned - wager;
      }
    });
    
    // Generate Bankroll History data
    let currentBank = 1000; // Starting amount
    const history = [{ name: 'Start', bankroll: 1000 }];
    
    settledBets.forEach((bet, i) => {
      currentBank -= parseFloat(bet.wager);
      if (bet.status === "WON") {
        currentBank += parseFloat(bet.potentialWin);
      } else if (bet.status === "CASH OUT") {
        currentBank += parseFloat(bet.potential_payout || bet.wager);
      }
      history.push({ name: `Bet ${i+1}`, bankroll: currentBank });
    });
    setBankrollHistory(history);

    const netProfit = totalReturned - totalWagered;
    const roi = totalWagered > 0 ? ((netProfit / totalWagered) * 100).toFixed(1) : 0;

    setStats({
      totalBets: settledBets.length,
      totalWagered,
      totalReturned,
      netProfit,
      roi,
      biggestWin
    });

    // Determine Achievements
    const unlocked = [];
    if (settledBets.length >= 1) unlocked.push({ icon: '🎟️', name: 'First Bet Placed', desc: 'You placed your very first bet.' });
    if (settledBets.length >= 10) unlocked.push({ icon: '🔥', name: 'High Roller', desc: 'Placed 10+ bets in the Virtual Sportsbook.' });
    if (netProfit > 500) unlocked.push({ icon: '💰', name: 'Tycoon', desc: 'Earned over £500 in net profit.' });
    if (biggestWin >= 200) unlocked.push({ icon: '🎰', name: 'Jackpot', desc: 'Won over £200 from a single bet.' });
    if (loginStreak >= 3) unlocked.push({ icon: '📅', name: 'Loyal Manager', desc: 'Logged in for 3 consecutive days.' });
    
    if (unlocked.length === 0) {
      unlocked.push({ icon: '🌱', name: 'Rookie', desc: 'Just getting started in the Virtual Hub.' });
    }

    setAchievements(unlocked);
  }, [loginStreak]);

  const shareStats = () => {
    const text = `🏆 AI Football Dashboard Stats 🏆\n💰 Bankroll: £${aiCoins.toFixed(2)}\n🎟️ Total Bets: ${stats.totalBets}\n📈 Net Profit: £${stats.netProfit.toFixed(2)}\n🔥 Login Streak: ${loginStreak} days\n🏅 Achievements: ${achievements.length}`;
    navigator.clipboard.writeText(text).then(() => {
      alert("📋 Stats copied to clipboard! Share them with your mates!");
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">👔 {t.managerProfile || "Manager Profile"}</h1>
        <button onClick={shareStats} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
          📤 Share Stats
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Profile Card */}
        <div className="glass-card p-6 flex flex-col items-center justify-center border-[var(--accent-primary)] border-t-4">
          <div className="w-32 h-32 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-5xl mb-4 border-4 border-[var(--accent-primary)]">
            🧑‍💼
          </div>
          <h2 className="text-xl font-bold mb-1">AI Manager</h2>
          <p className="text-[var(--text-secondary)] mb-4">{t.level || "Level"} 1</p>
          
          <div className="w-full bg-[var(--bg-secondary)] rounded p-3 text-center mb-2 flex justify-between items-center">
            <span className="text-sm font-bold text-[var(--text-secondary)]">{t.bankroll || "Bankroll"}</span>
            <span className="font-black text-xl text-yellow-400">£{aiCoins.toFixed(2)}</span>
          </div>
          
          <div className="w-full bg-[var(--bg-secondary)] rounded p-3 text-center flex justify-between items-center">
            <span className="text-sm font-bold text-[var(--text-secondary)]">{t.loginStreak || "Login Streak"}</span>
            <span className="font-black text-xl text-orange-400">🔥 {loginStreak} Days</span>
          </div>
        </div>

        {/* Betting Stats */}
        <div className="md:col-span-2 glass-card p-6">
          <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">📊 {t.lifetimeStats || "Lifetime Betting Stats"}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
              <div className="text-sm text-[var(--text-secondary)] mb-1">{t.totalBets || "Total Bets"}</div>
              <div className="text-2xl font-black">{stats.totalBets}</div>
            </div>
            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
              <div className="text-sm text-[var(--text-secondary)] mb-1">{t.totalWagered || "Total Wagered"}</div>
              <div className="text-2xl font-black">£{stats.totalWagered.toFixed(2)}</div>
            </div>
            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
              <div className="text-sm text-[var(--text-secondary)] mb-1">{t.totalReturned || "Total Returned"}</div>
              <div className="text-2xl font-black text-blue-400">£{stats.totalReturned.toFixed(2)}</div>
            </div>
            <div className={`p-4 rounded-lg border ${stats.netProfit >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="text-sm text-[var(--text-secondary)] mb-1">{t.netProfit || "Net Profit"}</div>
              <div className={`text-2xl font-black ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.netProfit >= 0 ? '+' : ''}£{stats.netProfit.toFixed(2)}
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${stats.roi >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="text-sm text-[var(--text-secondary)] mb-1">ROI</div>
              <div className={`text-2xl font-black ${stats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.roi}%
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <div className="text-sm text-yellow-500/70 mb-1">{t.biggestWin || "Biggest Win"}</div>
              <div className="text-2xl font-black text-yellow-400">£{stats.biggestWin.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bankroll Chart */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">📈 Bankroll History</h2>
        <div className="h-[300px] w-full">
          {bankrollHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bankrollHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                  itemStyle={{ color: '#00ff87', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="bankroll" stroke="#00ff87" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
              Not enough betting history to display chart. Place some bets!
            </div>
          )}
        </div>
      </div>

      {/* Achievements Box */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">🏆 {t.achievements || "Achievements"}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((ach, idx) => (
            <div key={idx} className="bg-[var(--bg-secondary)] border border-[var(--accent-primary)]/50 rounded-lg p-4 flex flex-col items-center text-center transition-all hover:scale-105 hover:bg-[var(--accent-primary)]/10">
              <div className="text-4xl mb-2">{ach.icon}</div>
              <div className="font-bold mb-1">{ach.name}</div>
              <div className="text-xs text-[var(--text-secondary)]">{ach.desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
