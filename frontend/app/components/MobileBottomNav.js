"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppContext } from "@/app/context/AppContext";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "🏠", label: "Home" },
  { href: "/dashboard/simulate", icon: "🎲", label: "Betting" },
  { href: "/dashboard/season", icon: "🏆", label: "Season" },
  { href: "/dashboard/fpl", icon: "🛡️", label: "FPL" },
];

const MORE_ITEMS = [
  { href: "/dashboard/ut", icon: "⚽", label: "Ultimate Team" },
  { href: "/dashboard/analytics", icon: "📊", label: "Analytics" },
  { href: "/dashboard/leaderboards", icon: "🥇", label: "Leaderboards" },
  { href: "/dashboard/chat", icon: "💬", label: "Global Chat" },
  { href: "/dashboard/profile", icon: "👔", label: "Profile" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const { theme, toggleTheme, soundEnabled, toggleSound, language, changeLanguage } = useAppContext();

  // Close the more menu if we navigate
  const handleNavClick = () => {
    setShowMore(false);
  };

  return (
    <>
      {/* Overlay & More Menu */}
      {showMore && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-fade-in flex flex-col justify-end pb-20">
          <div className="bg-[#162032] rounded-t-3xl border-t border-[var(--border-color)] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="font-black text-xl">More</h2>
              <button onClick={() => setShowMore(false)} className="text-gray-400 text-2xl p-2">&times;</button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {MORE_ITEMS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className="flex flex-col items-center gap-2 p-2 rounded-xl active:bg-white/10 transition-colors"
                >
                  <div className={`text-2xl w-12 h-12 rounded-full flex items-center justify-center ${pathname.startsWith(item.href) && item.href !== '/dashboard' ? 'bg-[var(--accent-primary)] text-black shadow-[0_0_15px_rgba(0,255,135,0.4)]' : 'bg-black/40'}`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-6 border-t border-[var(--border-color)] pt-4">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] mb-3">Settings</h3>
              <div className="flex justify-around items-center">
                <button onClick={toggleTheme} className="flex flex-col items-center gap-1">
                  <div className="bg-black/40 p-3 rounded-full text-xl">{theme === 'dark' ? '🌙' : '☀️'}</div>
                  <span className="text-[10px] font-bold">Theme</span>
                </button>
                <button onClick={toggleSound} className="flex flex-col items-center gap-1">
                  <div className="bg-black/40 p-3 rounded-full text-xl">{soundEnabled ? '🔊' : '🔇'}</div>
                  <span className="text-[10px] font-bold">Sound</span>
                </button>
                <div className="flex flex-col items-center gap-1">
                  <select 
                    value={language} 
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="bg-black/40 border border-[var(--border-color)] rounded-full px-3 py-2 text-sm font-bold"
                  >
                    <option value="en">EN</option>
                    <option value="es">ES</option>
                    <option value="fr">FR</option>
                  </select>
                  <span className="text-[10px] font-bold mt-1">Language</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0f18]/95 backdrop-blur-md border-t border-[var(--border-color)] z-50 px-2 pb-safe pt-2">
        <div className="flex justify-around items-center">
          {NAV_ITEMS.map((item) => {
            // Determine active state carefully (exact match for home, startsWith for others)
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard' 
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center p-2 w-16"
                onClick={handleNavClick}
              >
                <div className={`text-2xl transition-transform ${isActive ? 'scale-125 -translate-y-1' : 'opacity-70'}`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] mt-1 font-bold transition-colors ${isActive ? 'text-[var(--accent-primary)]' : 'text-gray-500'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-[var(--accent-primary)] rounded-full shadow-[0_0_10px_var(--accent-primary)]"></div>
                )}
              </Link>
            );
          })}
          
          {/* More Menu Toggle */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center p-2 w-16"
          >
            <div className={`text-2xl transition-transform ${showMore ? 'scale-125 -translate-y-1' : 'opacity-70'}`}>
              ☰
            </div>
            <span className={`text-[10px] mt-1 font-bold transition-colors ${showMore ? 'text-[var(--accent-primary)]' : 'text-gray-500'}`}>
              Menu
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
