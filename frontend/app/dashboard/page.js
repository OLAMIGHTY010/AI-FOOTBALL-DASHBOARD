"use client";
import Link from "next/link";

const FEATURES = [
  {
    icon: "📊",
    title: "Sportsbook",
    desc: "Browse live odds across 10+ leagues. Place single bets or build accumulators.",
    href: "/dashboard/sportsbook",
    color: "#00d4aa",
  },
  {
    icon: "⚽",
    title: "Simulate Matches",
    desc: "Watch AI-simulated matches unfold in real-time with live commentary.",
    href: "/dashboard/simulate",
    color: "#7c3aed",
  },
  {
    icon: "🏆",
    title: "League Standings",
    desc: "Track all league tables updated live after every simulated gameweek.",
    href: "/dashboard/standings",
    color: "#f59e0b",
  },
];

export default function DashboardHome() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-[var(--text-secondary)]">
          Your AI-powered football betting and simulation platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <Link key={f.title} href={f.href}>
            <div className="glass-card cursor-pointer group h-full">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">{f.desc}</p>
              <div
                className="mt-4 text-sm font-semibold"
                style={{ color: f.color }}
              >
                Open →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
