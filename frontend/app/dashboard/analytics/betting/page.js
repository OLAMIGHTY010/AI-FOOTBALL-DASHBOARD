"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { useAppContext } from "@/app/context/AppContext";

const COLORS = ['#22c55e', '#ef4444', '#eab308']; // Green, Red, Yellow for Won, Lost, Cashout

export default function BettingAnalyticsPage() {
  const [settledBets, setSettledBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bets = JSON.parse(localStorage.getItem("settled_bets") || "[]");
    setSettledBets(bets);
    setLoading(false);
  }, []);

  const generateMockData = () => {
    const mockBets = [];
    const markets = ["1", "X", "2", "O2.5", "U2.5", "BTTS_Y", "BTTS_N"];
    let currentBankroll = 1000;
    
    for (let i = 0; i < 50; i++) {
      const isWin = Math.random() > 0.5;
      const isCashout = !isWin && Math.random() > 0.8;
      const status = isWin ? "WON" : isCashout ? "CASHOUT" : "LOST";
      
      const wager = Math.floor(Math.random() * 50) + 10;
      const odds = (Math.random() * 3 + 1.5).toFixed(2);
      const potentialWin = (wager * odds).toFixed(2);
      
      const market = markets[Math.floor(Math.random() * markets.length)];
      
      mockBets.push({
        status,
        wager,
        potentialWin: status === "CASHOUT" ? (wager * 1.2).toFixed(2) : potentialWin,
        slip: [
          { home: "Team A", away: "Team B", market, odds }
        ]
      });
    }
    
    localStorage.setItem("settled_bets", JSON.stringify(mockBets));
    setSettledBets(mockBets);
    
    // Dispatch bankroll update if we want to simulate having that money, but it's just history mock
  };

  // KPIs
  const totalBets = settledBets.length;
  const totalWagered = settledBets.reduce((acc, bet) => acc + parseFloat(bet.wager), 0);
  
  const totalReturned = settledBets.reduce((acc, bet) => {
    if (bet.status === "WON" || bet.status === "CASHOUT") return acc + parseFloat(bet.potentialWin);
    return acc;
  }, 0);
  
  const netProfit = totalReturned - totalWagered;
  const roi = totalWagered > 0 ? ((netProfit / totalWagered) * 100).toFixed(2) : 0;
  
  const wonBets = settledBets.filter(b => b.status === "WON" || b.status === "CASHOUT").length;
  const winRate = totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(1) : 0;

  // Chart 1: Profit Over Time
  let runningProfit = 0;
  const profitData = settledBets.map((bet, index) => {
    const profit = (bet.status === "WON" || bet.status === "CASHOUT") 
      ? parseFloat(bet.potentialWin) - parseFloat(bet.wager)
      : -parseFloat(bet.wager);
    runningProfit += profit;
    return {
      betNumber: `Bet ${index + 1}`,
      profit: parseFloat(runningProfit.toFixed(2))
    };
  });

  // Chart 2: Win/Loss Ratio
  const lostBets = totalBets - wonBets;
  const pieData = [
    { name: 'Won/Cashout', value: wonBets },
    { name: 'Lost', value: lostBets }
  ];

  // Chart 3: Market Type Profitability
  const marketStats = {};
  settledBets.forEach(bet => {
    if (bet.slip && bet.slip.length > 0) {
      // For simplicity, we just take the first leg's market to categorize the bet
      const market = bet.slip[0].market;
      if (!marketStats[market]) marketStats[market] = { market, profit: 0, count: 0 };
      
      const profit = (bet.status === "WON" || bet.status === "CASHOUT") 
        ? parseFloat(bet.potentialWin) - parseFloat(bet.wager)
        : -parseFloat(bet.wager);
        
      marketStats[market].profit += profit;
      marketStats[market].count += 1;
    }
  });
  
  const barData = Object.values(marketStats)
    .sort((a, b) => b.profit - a.profit)
    .map(d => ({ ...d, profit: parseFloat(d.profit.toFixed(2)) }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isPositive = val >= 0;
      return (
        <div className="bg-black/90 border border-gray-700 p-3 rounded-lg shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className={`font-black ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            ${val.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) return null;

  return (
    <div className="max-w-6xl mx-auto pt-6 pb-20 animate-fade-in font-sans">
      <div className="flex justify-between items-center mb-8 border-b border-[var(--border-color)] pb-6">
        <div>
          <Link href="/dashboard/analytics" className="text-[var(--accent-primary)] hover:underline text-sm font-bold flex items-center gap-2 mb-2">
            ← Back to Analytics
          </Link>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            🎰 Betting History Analytics
          </h1>
        </div>
        <div>
          <button onClick={generateMockData} className="btn-secondary text-sm">
            Generate 50 Mock Bets (Testing)
          </button>
        </div>
      </div>

      {totalBets === 0 ? (
        <div className="glass-card text-center py-20">
          <span className="text-6xl mb-4 block">📉</span>
          <h2 className="text-2xl font-black mb-2">No Betting Data</h2>
          <p className="text-[var(--text-secondary)] mb-6">Place some bets in the sportsbook or generate mock data to see your analytics.</p>
          <Link href="/dashboard/sportsbook" className="btn-primary">Go to Sportsbook</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card !py-4 text-center">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-1">Total Wagered</div>
              <div className="text-2xl font-black">${totalWagered.toFixed(2)}</div>
            </div>
            <div className="glass-card !py-4 text-center">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-1">Total Returned</div>
              <div className="text-2xl font-black">${totalReturned.toFixed(2)}</div>
            </div>
            <div className={`glass-card !py-4 text-center border-t-4 ${netProfit >= 0 ? 'border-green-500' : 'border-red-500'}`}>
              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-1">Net Profit / ROI</div>
              <div className={`text-2xl font-black ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)} ({roi}%)
              </div>
            </div>
            <div className="glass-card !py-4 text-center">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-1">Win Rate</div>
              <div className="text-2xl font-black text-blue-400">{winRate}%</div>
              <div className="text-xs text-[var(--text-secondary)]">{wonBets} W - {lostBets} L</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Profit Line Chart */}
            <div className="lg:col-span-2 glass-card p-6 min-h-[400px] flex flex-col">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <span className="text-green-400">📈</span> Cumulative Profit History
              </h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="betNumber" stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                    <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="url(#colorProfit)" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#fff', strokeWidth: 0 }}
                    />
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Win/Loss Pie Chart */}
            <div className="glass-card p-6 flex flex-col items-center min-h-[400px]">
              <h3 className="font-bold text-lg mb-2 w-full text-left">Hit Rate</h3>
              <div className="flex-1 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? COLORS[0] : COLORS[1]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                  <span className="text-3xl font-black text-white">{winRate}%</span>
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Win Rate</span>
                </div>
              </div>
              <div className="w-full flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-[var(--text-secondary)] font-bold">Won ({wonBets})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-[var(--text-secondary)] font-bold">Lost ({lostBets})</span>
                </div>
              </div>
            </div>
            
            {/* Market Profitability Bar Chart */}
            <div className="lg:col-span-3 glass-card p-6 min-h-[350px] flex flex-col">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <span className="text-blue-400">📊</span> Profit by Market Type
              </h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="market" stroke="#666" tick={{fill: '#888', fontSize: 12, fontWeight: 'bold'}} />
                    <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} />
                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                    <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
