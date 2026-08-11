"use client";
import Link from "next/link";

const ANALYTICS_SECTIONS = [
  {
    icon: "🆚",
    title: "Player Comparison",
    desc: "Compare two players side-by-side with radar charts across Pace, Shooting, Passing, Dribbling, Defence and Physical.",
    href: "/dashboard/analytics/compare",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: "🔥",
    title: "Heat Map",
    desc: "Visualize action density across the pitch. See where goals, fouls, and key passes happen most frequently.",
    href: "/dashboard/analytics/heatmap",
    gradient: "from-red-500 to-orange-500",
  },
  {
    icon: "📈",
    title: "Form & Trends",
    desc: "Track team and player form over the last 10 matches with interactive line charts and performance indices.",
    href: "/dashboard/analytics/form",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: "🎰",
    title: "Betting History Analytics",
    desc: "Visualize your virtual sports betting performance. Track ROI, most profitable markets, and win/loss ratio.",
    href: "/dashboard/analytics/betting",
    gradient: "from-yellow-400 to-orange-500",
  },
];

export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in pt-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-3">
          📊 Advanced Analytics Hub
        </h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
          Deep dive into the data. Compare players, visualize pitch activity, and track form trends.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ANALYTICS_SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <div className="glass-card h-full group cursor-pointer hover:scale-[1.02] transition-all duration-300 border-t-4 border-transparent hover:border-[var(--accent-primary)]">
              <div className={`text-5xl mb-4 w-16 h-16 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center`}>
                {section.icon}
              </div>
              <h3 className="text-xl font-black mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                {section.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {section.desc}
              </p>
              <div className="mt-4 text-sm font-bold text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                Explore →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
