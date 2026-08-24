import Link from "next/link";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

export function WelcomeWidget() {
  return (
    <div className="glass-card col-span-full bg-gradient-to-r from-[#00ff87]/10 to-[#7c3aed]/10 border-[var(--accent-primary)] border-l-4 h-full">
      <h1 className="text-3xl font-black mb-2">Welcome back, Manager! 👋</h1>
      <p className="text-[var(--text-secondary)]">
        Your AI-powered football betting & simulation command center. Drag widgets to customize your layout.
      </p>
    </div>
  );
}

export function QuickStatsWidget({ bankroll, loginStreak, wins, losses }) {
  return (
    <div className="glass-card h-full">
      <h3 className="font-bold text-lg mb-4 border-b border-[var(--border-color)] pb-2">⚡ Quick Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--bg-secondary)] p-3 rounded-lg text-center shadow-inner">
          <div className="text-xs text-[var(--text-secondary)]">Bankroll</div>
          <div className="text-xl font-black text-yellow-400 font-mono">£{bankroll?.toFixed(0) || 0}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] p-3 rounded-lg text-center shadow-inner">
          <div className="text-xs text-[var(--text-secondary)]">Login Streak</div>
          <div className="text-xl font-black text-orange-400">🔥 {loginStreak || 0}</div>
        </div>
        <div className="bg-green-500/10 p-3 rounded-lg text-center border border-green-500/20 shadow-inner">
          <div className="text-xs text-green-400">Wins</div>
          <div className="text-xl font-black text-green-400 font-mono">{wins || 0}</div>
        </div>
        <div className="bg-red-500/10 p-3 rounded-lg text-center border border-red-500/20 shadow-inner">
          <div className="text-xs text-red-400">Losses</div>
          <div className="text-xl font-black text-red-400 font-mono">{losses || 0}</div>
        </div>
      </div>
    </div>
  );
}

export function BankrollChartWidget({ bankrollHistory }) {
  return (
    <div className="glass-card h-full flex flex-col">
      <h3 className="font-bold text-lg mb-4 border-b border-[var(--border-color)] pb-2">📈 Bankroll Trend</h3>
      <div className="flex-1 min-h-[140px]">
        {bankrollHistory && bankrollHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bankrollHistory}>
              <Tooltip 
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                itemStyle={{ color: "#00ff87", fontWeight: "bold" }}
              />
              <Line type="monotone" dataKey="bankroll" stroke="#00ff87" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#00ff87" }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm italic">
            Place bets to see your trend!
          </div>
        )}
      </div>
    </div>
  );
}

export function RecentBetsWidget({ recentBets }) {
  return (
    <div className="glass-card h-full flex flex-col">
      <h3 className="font-bold text-lg mb-4 border-b border-[var(--border-color)] pb-2">🎟️ Recent Bets</h3>
      {!recentBets || recentBets.length === 0 ? (
        <div className="text-[var(--text-secondary)] text-sm text-center py-8 italic flex-1 flex items-center justify-center">No bets placed yet.</div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {recentBets.map((bet, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg text-sm shadow-inner transition-colors hover:bg-white/5">
              <span className={`font-bold ${bet.status === "WON" ? "text-green-400" : bet.status === "LOST" ? "text-red-400" : "text-yellow-400"}`}>
                {bet.status}
              </span>
              <span className="text-[var(--text-secondary)] font-mono">£{bet.wager} → <span className="text-white">£{bet.potentialWin || bet.potential_payout || bet.wager}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AiTipWidget({ tip }) {
  return (
    <div className="glass-card h-full bg-gradient-to-br from-purple-900/40 to-blue-900/20 border-purple-500/30 border">
      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
        <span className="text-xl">🤖</span> AI Tip of the Day
      </h3>
      <p className="text-sm text-purple-100 leading-relaxed font-medium">
        {tip}
      </p>
    </div>
  );
}

export function QuickLinksWidget() {
  const links = [
    { href: "/dashboard/simulate", icon: "🎲", label: "Virtual Hub" },
    { href: "/dashboard/simulate/tournament", icon: "🏆", label: "Champions League" },
    { href: "/dashboard/simulate/live", icon: "🔴", label: "Live Betting" },
    { href: "/dashboard/ut", icon: "⚽", label: "Ultimate Team" },
    { href: "/dashboard/fpl", icon: "🛡️", label: "FPL Hub" },
    { href: "/dashboard/profile", icon: "👔", label: "Profile" },
  ];

  return (
    <div className="glass-card h-full">
      <h3 className="font-bold text-lg mb-4 border-b border-[var(--border-color)] pb-2">🚀 Quick Links</h3>
      <div className="grid grid-cols-2 gap-2">
        {links.map(link => (
          <Link key={link.href} href={link.href} className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--accent-primary)] hover:text-black transition-all text-sm font-bold shadow-inner group">
            <span className="text-lg group-hover:scale-110 transition-transform">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
