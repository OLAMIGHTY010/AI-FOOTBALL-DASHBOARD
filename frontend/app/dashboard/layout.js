"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

const NAV_ITEMS = [
  { href: "/dashboard", label: "🏠 Dashboard", id: "dashboard" },
  { href: "/dashboard/sportsbook", label: "📊 Sportsbook", id: "sportsbook" },
  { href: "/dashboard/simulate", label: "⚽ Simulate", id: "simulate" },
  { href: "/dashboard/standings", label: "🏆 Standings", id: "standings" },
  { href: "/dashboard/tactics", label: "👔 Tactics", id: "tactics" },
  { href: "/dashboard/history", label: "📜 Bet History", id: "history" },
  { href: "/dashboard/ut", label: "🎴 Ultimate Team", id: "ut" },
  { href: "/dashboard/fpl", label: "🦁 FPL", id: "fpl" },
];

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [bankroll, setBankroll] = useState(0);
  const [debt, setDebt] = useState(0);
  const [loading, setLoading] = useState(true);

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
                  {item.label}
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

            {/* User */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-secondary)] hidden md:block">
                {user.email}
              </span>
              <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="md:hidden flex gap-1 p-2 overflow-x-auto border-b border-[var(--border-color)]">
        {NAV_ITEMS.map((item) => (
          <Link key={item.id} href={item.href} className="nav-link whitespace-nowrap text-xs">
            {item.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
