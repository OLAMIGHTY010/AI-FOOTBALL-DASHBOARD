"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/app/context/AppContext";
import LiveTicker from "@/app/dashboard/components/LiveTicker";
import CommandPalette from "@/app/components/CommandPalette";
import AIChatbot from "@/app/dashboard/components/AIChatbot";
import NotificationBell from "@/app/dashboard/components/NotificationBell";
import MobileBottomNav from "@/app/components/MobileBottomNav";
import { translations } from "@/lib/translations";

const API_URL = "http://localhost:8000";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", id: "dashboard" },
  { href: "/dashboard/season", label: "Season Mode", id: "seasonMode" },
  { href: "/dashboard/simulate", label: "Virtual Hub", id: "virtualHub" },
  { href: "/dashboard/ut", label: "Ultimate Team", id: "ultimateTeam" },
  { href: "/dashboard/fpl", label: "FPL Hub", id: "fplHub" },
  { href: "/dashboard/analytics", label: "Analytics", id: "analytics" },
  { href: "/dashboard/leaderboards", label: "Global Ranks", id: "globalRanks" },
  { href: "/dashboard/chat", label: "Global Chat", id: "globalChat" },
  { href: "/dashboard/profile", label: "Profile", id: "profile" },
];

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [bankroll, setBankroll] = useState(0);
  const [debt, setDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { theme, toggleTheme, soundEnabled, toggleSound, language, changeLanguage } = useAppContext();
  const t = translations[language] || translations['en'];

  const isFPLApp = pathname.startsWith("/dashboard/fpl") || 
                   pathname.startsWith("/dashboard/leagues") || 
                   pathname.startsWith("/dashboard/fixtures") || 
                   pathname.startsWith("/dashboard/community") || 
                   pathname.startsWith("/dashboard/more");

  const isVirtualApp = pathname.startsWith("/dashboard/simulate");
  const isAnalyticsApp = pathname.startsWith("/dashboard/analytics");
  const isSeasonApp = pathname.startsWith("/dashboard/season");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/";
        return;
      }
      
      setUser(session.user);
      
      // Fetch wallet balance
      const { data: walletData, error } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", session.user.id)
        .single();
        
      if (walletData) {
        setBankroll(parseFloat(walletData.balance));
        // Keep in local storage for simulate page if needed, but ideally we'd pass it down
        localStorage.setItem("bankroll", walletData.balance.toString());
      } else {
        // Fallback or handle missing wallet
        setBankroll(1000);
      }
      
      setLoading(false);
    };
    
    checkUser();

    // Listen for cross-component and cross-tab bankroll updates
    const syncBankroll = () => {
      const bal = localStorage.getItem("bankroll");
      if (bal) {
        setBankroll(parseFloat(bal));
      }
      const db = localStorage.getItem("virtual_debt");
      if (db) {
        setDebt(parseFloat(db));
      }
    };
    window.addEventListener("storage", syncBankroll);
    return () => window.removeEventListener("storage", syncBankroll);
  }, []);

  const handleDeposit = async () => {
    if (!user) return;
    const newBal = bankroll + 1000;
    
    // Update local state immediately
    setBankroll(newBal);
    localStorage.setItem("bankroll", newBal.toString());
    
    // Update Supabase
    await supabase
      .from("wallets")
      .update({ balance: newBal })
      .eq("user_id", user.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "/";
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading dashboard...</div>;


  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="navbar px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold gradient-text">
              ⚽ AI Football
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link key={item.id} href={item.href} className="nav-link">
                  {t[item.id] || item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {debt > 0 && (
              <div className="hidden sm:block text-red-500 font-bold text-sm bg-red-500/10 px-3 py-1.5 rounded border border-red-500/50" title="Virtual Loan Debt">
                Debt: ${debt.toFixed(2)}
              </div>
            )}
            {/* Wallet */}
            <div className="glass-card !p-2 !px-4 flex items-center gap-3">
              <span className="text-sm text-[var(--text-secondary)]">💳</span>
              <span className="font-bold text-[var(--accent-primary)]">
                ${bankroll.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleDeposit}
              className="text-xs bg-[var(--accent-primary)] text-[var(--bg-primary)] px-2 py-1 rounded-md font-bold hover:opacity-90 transition-opacity"
            >
              + $1K
            </button>

            {/* Language Selector */}
            <select 
              value={language} 
              onChange={(e) => changeLanguage(e.target.value)}
              className="hidden md:block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)]"
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
            </select>

            {/* Toggles */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              <NotificationBell />
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>
              <button 
                onClick={toggleSound} 
                className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-colors"
                title="Toggle Sound"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
            </div>
            {/* Mobile Notification Bell (only bell visible on mobile header) */}
            <div className="md:hidden flex items-center mr-2">
              <NotificationBell />
            </div>

            {/* User */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-secondary)] hidden md:block">
                {user.email}
              </span>
              <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300">
                {t.logout || "Logout"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="md:hidden flex gap-1 p-2 overflow-x-auto border-b border-[var(--border-color)]">
        {NAV_ITEMS.map((item) => (
          <Link key={item.id} href={item.href} className="nav-link whitespace-nowrap text-xs">
            {t[item.id] || item.label}
          </Link>
        ))}
      </div>

      {/* FPL Sub-Navbar */}
      {isFPLApp && (
        <div className="bg-[#162032] border-b border-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center overflow-x-auto">
            <Link href="/dashboard/fpl" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname === '/dashboard/fpl' ? 'text-white border-b-2 border-[#00ff87]' : 'text-gray-400 hover:text-white'}`}>
              🛡️ Pitch
            </Link>
            <Link href="/dashboard/leagues" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/leagues') ? 'text-white border-b-2 border-[#00ff87]' : 'text-gray-400 hover:text-white'}`}>
              🏆 Leagues
            </Link>
            <Link href="/dashboard/fixtures" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/fixtures') ? 'text-white border-b-2 border-[#00ff87]' : 'text-gray-400 hover:text-white'}`}>
              📅 Live Fixtures
            </Link>
            <Link href="/dashboard/community" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/community') ? 'text-white border-b-2 border-[#00ff87]' : 'text-gray-400 hover:text-white'}`}>
              💬 Community
            </Link>
            <Link href="/dashboard/fpl/set-pieces" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/fpl/set-pieces') ? 'text-white border-b-2 border-[#00ff87]' : 'text-gray-400 hover:text-white'}`}>
              🎯 Set Pieces
            </Link>
            <Link href="/dashboard/fpl/stats" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/fpl/stats') ? 'text-white border-b-2 border-[#00ff87]' : 'text-gray-400 hover:text-white'}`}>
              📊 xG Stats
            </Link>
            <Link href="/dashboard/more" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/more') ? 'text-white border-b-2 border-[#00ff87]' : 'text-gray-400 hover:text-white'}`}>
              ••• More
            </Link>
          </div>
        </div>
      )}

      {/* Virtual Sub-Navbar */}
      {isVirtualApp && (
        <div className="bg-[#162032] border-b border-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center overflow-x-auto">
            <Link href="/dashboard/simulate" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname === '/dashboard/simulate' ? 'text-white border-b-2 border-[#00ff87]' : 'text-gray-400 hover:text-white'}`}>
              🎲 Betting Hub
            </Link>
            <Link href="/dashboard/simulate/tournament" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/tournament') ? 'text-white border-b-2 border-[#00ff87]' : 'text-gray-400 hover:text-white'}`}>
              🏆 Virtual Champions League
            </Link>
            <Link href="/dashboard/simulate/live" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/live') ? 'text-white border-b-2 border-[#00ff87]' : 'text-gray-400 hover:text-white'}`}>
              🔴 Live In-Play
            </Link>
          </div>
        </div>
      )}

      {/* Analytics Sub-Navbar */}
      {isAnalyticsApp && (
        <div className="bg-[#162032] border-b border-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center overflow-x-auto">
            <Link href="/dashboard/analytics" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname === '/dashboard/analytics' ? 'text-white border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
              📊 Hub
            </Link>
            <Link href="/dashboard/analytics/compare" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/compare') ? 'text-white border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
              🆚 Compare
            </Link>
            <Link href="/dashboard/analytics/heatmap" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/heatmap') ? 'text-white border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
              🔥 Heat Map
            </Link>
            <Link href="/dashboard/analytics/form" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/form') ? 'text-white border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
              📈 Form & Trends
            </Link>
          </div>
        </div>
      )}

      {/* Season Sub-Navbar */}
      {isSeasonApp && (
        <div className="bg-[#162032] border-b border-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center overflow-x-auto">
            <Link href="/dashboard/season" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname === '/dashboard/season' ? 'text-white border-b-2 border-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              🏠 Season Hub
            </Link>
            <Link href="/dashboard/season/standings" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/standings') ? 'text-white border-b-2 border-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              📊 Standings
            </Link>
            <Link href="/dashboard/season/futures" className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors ${pathname.includes('/futures') ? 'text-white border-b-2 border-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              💰 Futures Betting
            </Link>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 mb-20 md:mb-12">
        {children}
      </main>

      {/* Live Ticker */}
      <LiveTicker />

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      {/* AI Chatbot Assistant */}
      <AIChatbot />

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
