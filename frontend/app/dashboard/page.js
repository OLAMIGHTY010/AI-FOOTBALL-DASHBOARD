"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";
import { 
  WelcomeWidget, 
  QuickStatsWidget, 
  BankrollChartWidget, 
  RecentBetsWidget, 
  AiTipWidget, 
  QuickLinksWidget 
} from "./components/DashboardWidgets";

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
    welcome: <WelcomeWidget />,
    quickStats: <QuickStatsWidget bankroll={bankroll} loginStreak={loginStreak} wins={wins} losses={losses} />,
    bankrollChart: <BankrollChartWidget bankrollHistory={bankrollHistory} />,
    recentBets: <RecentBetsWidget recentBets={recentBets} />,
    aiTip: <AiTipWidget tip={todayTip} />,
    quickLinks: <QuickLinksWidget />,
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
