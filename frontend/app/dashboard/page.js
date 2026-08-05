"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";
import {
  LineChart, Line, ResponsiveContainer, Tooltip
} from "recharts";

const DEFAULT_WIDGET_ORDER = [
  "welcome", "quickStats", "bankrollChart", "recentBets", "aiTip", "quickLinks"
];

const AI_TIPS = [
  "💡 Tip: Haaland has scored in 5 consecutive home games. Consider captaining him this week!",
  "💡 Tip: Over 2.5 goals has hit in 70% of Arsenal's last 10 matches. Great parlay leg!",
  "💡 Tip: Don't chase losses! Flat staking is statistically more profitable long-term.",
  "💡 Tip: The Virtual Champions League bracket heavily favors top-seeded teams in QF rounds.",
  "💡 Tip: Set piece takers are goldmines for FPL points. Check the Set Pieces dashboard!",
  "💡 Tip: Live In-Play odds shift dramatically after the 70th minute. Time your bets wisely.",
  "💡 Tip: Diversify your parlays across different sports for better risk management.",
  "💡 Tip: Check the xG Stats page — players outperforming their xG are due for regression.",
];

export default function DashboardHome() {
  const { aiCoins, loginStreak } = useAppContext();
  const [widgetOrder, setWidgetOrder] = useState(DEFAULT_WIDGET_ORDER);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [bankrollHistory, setBankrollHistory] = useState([]);
  const [recentBets, setRecentBets] = useState([]);
  const [todayTip, setTodayTip] = useState("");

  useEffect(() => {
    // Load widget order from localStorage
    const saved = localStorage.getItem("dashboardWidgetOrder");
    if (saved) {
      try { setWidgetOrder(JSON.parse(saved)); } catch(e) {}
    }

    // Load bankroll history
    const settledBets = JSON.parse(localStorage.getItem("settled_bets") || "[]");
    let currentBank = 1000;
    const history = [{ name: "Start", bankroll: 1000 }];
    settledBets.forEach((bet, i) => {
      currentBank -= parseFloat(bet.wager);
      if (bet.status === "WON") currentBank += parseFloat(bet.potentialWin);
      else if (bet.status === "CASH OUT") currentBank += parseFloat(bet.potential_payout || bet.wager);
      history.push({ name: `B${i + 1}`, bankroll: currentBank });
    });
    setBankrollHistory(history);
    setRecentBets(settledBets.slice(-5).reverse());

    // Pick tip of the day
    const dayIndex = new Date().getDate() % AI_TIPS.length;
    setTodayTip(AI_TIPS[dayIndex]);
  }, []);

  const saveOrder = useCallback((newOrder) => {
    setWidgetOrder(newOrder);
    localStorage.setItem("dashboardWidgetOrder", JSON.stringify(newOrder));
  }, []);

  const handleDragStart = (e, widgetId) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetId) return;
    const newOrder = [...widgetOrder];
    const fromIdx = newOrder.indexOf(draggedWidget);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedWidget);
    saveOrder(newOrder);
    setDraggedWidget(null);
  };

  const bankroll = parseFloat(localStorage.getItem("bankroll") || "0");
  const settledAll = JSON.parse(localStorage.getItem("settled_bets") || "[]");
  const wins = settledAll.filter(b => b.status === "WON").length;
  const losses = settledAll.filter(b => b.status === "LOST").length;

  const WIDGETS = {
    welcome: (
      <div className="glass-card col-span-full bg-gradient-to-r from-[#00ff87]/10 to-[#7c3aed]/10 border-[var(--accent-primary)] border-l-4">
        <h1 className="text-3xl font-black mb-2">Welcome back, Manager! 👋</h1>
        <p className="text-[var(--text-secondary)]">
          Your AI-powered football betting & simulation command center. Drag widgets to customize your layout.
        </p>
      </div>
    ),
    quickStats: (
      <div className="glass-card">
        <h3 className="font-bold text-lg mb-4 border-b border-[var(--border-color)] pb-2">⚡ Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-secondary)] p-3 rounded-lg text-center">
            <div className="text-xs text-[var(--text-secondary)]">Bankroll</div>
            <div className="text-xl font-black text-yellow-400">£{bankroll.toFixed(0)}</div>
          </div>
          <div className="bg-[var(--bg-secondary)] p-3 rounded-lg text-center">
            <div className="text-xs text-[var(--text-secondary)]">Login Streak</div>
            <div className="text-xl font-black text-orange-400">🔥 {loginStreak}</div>
          </div>
          <div className="bg-green-500/10 p-3 rounded-lg text-center border border-green-500/20">
            <div className="text-xs text-green-400">Wins</div>
            <div className="text-xl font-black text-green-400">{wins}</div>
          </div>
          <div className="bg-red-500/10 p-3 rounded-lg text-center border border-red-500/20">
            <div className="text-xs text-red-400">Losses</div>
            <div className="text-xl font-black text-red-400">{losses}</div>
          </div>
        </div>
      </div>
    ),
    bankrollChart: (
      <div className="glass-card">
        <h3 className="font-bold text-lg mb-4 border-b border-[var(--border-color)] pb-2">📈 Bankroll Trend</h3>
        <div className="h-[140px]">
          {bankrollHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bankrollHistory}>
                <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333" }} />
                <Line type="monotone" dataKey="bankroll" stroke="#00ff87" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">
              Place bets to see your trend!
            </div>
          )}
        </div>
      </div>
    ),
    recentBets: (
      <div className="glass-card">
        <h3 className="font-bold text-lg mb-4 border-b border-[var(--border-color)] pb-2">🎟️ Recent Bets</h3>
        {recentBets.length === 0 ? (
          <div className="text-[var(--text-secondary)] text-sm text-center py-4">No bets placed yet.</div>
        ) : (
          <div className="space-y-2">
            {recentBets.map((bet, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-[var(--bg-secondary)] rounded text-sm">
                <span className={`font-bold ${bet.status === "WON" ? "text-green-400" : "text-red-400"}`}>
                  {bet.status}
                </span>
                <span className="text-[var(--text-secondary)]">£{bet.wager} → £{bet.potentialWin}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    aiTip: (
      <div className="glass-card bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 border">
        <h3 className="font-bold text-lg mb-3">🤖 AI Tip of the Day</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{todayTip}</p>
      </div>
    ),
    quickLinks: (
      <div className="glass-card">
        <h3 className="font-bold text-lg mb-4 border-b border-[var(--border-color)] pb-2">🚀 Quick Links</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/dashboard/simulate", icon: "🎲", label: "Virtual Hub" },
            { href: "/dashboard/simulate/tournament", icon: "🏆", label: "Champions League" },
            { href: "/dashboard/simulate/live", icon: "🔴", label: "Live Betting" },
            { href: "/dashboard/ut", icon: "⚽", label: "Ultimate Team" },
            { href: "/dashboard/fpl", icon: "🛡️", label: "FPL Hub" },
            { href: "/dashboard/profile", icon: "👔", label: "Profile" },
          ].map(link => (
            <Link key={link.href} href={link.href} className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] rounded hover:bg-white/10 transition-colors text-sm font-bold">
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgetOrder.map((widgetId) => (
          <div
            key={widgetId}
            draggable
            onDragStart={(e) => handleDragStart(e, widgetId)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widgetId)}
            className={`cursor-grab active:cursor-grabbing transition-all ${
              draggedWidget === widgetId ? "opacity-50 scale-95" : ""
            } ${widgetId === "welcome" ? "md:col-span-2 lg:col-span-3" : ""}`}
          >
            {WIDGETS[widgetId]}
          </div>
        ))}
      </div>
    </div>
  );
}
