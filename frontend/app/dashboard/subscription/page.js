"use client";
import { useState } from "react";
import { useAppContext } from "@/app/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

export default function SubscriptionPage() {
  const { addToast } = useAppContext();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addToast("Error", "You must be logged in to subscribe.", "error");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          email: session.user.email,
          product_id: "vip_sub",
          amount: 5000 * 100 // NGN 5000 / month
        })
      });

      if (!res.ok) throw new Error("Failed to initialize checkout");
      
      const data = await res.json();
      if (data && data.authorization_url) {
        window.location.href = data.authorization_url; // Redirect to Paystack
      } else {
        throw new Error("No authorization URL returned");
      }
    } catch (err) {
      console.error(err);
      addToast("Checkout Error", err.message, "error");
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-4 mt-8">
        <div>
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Pro Manager VIP</h1>
          <p className="text-[var(--text-secondary)]">Unlock premium features, daily rewards, and stand out on the leaderboards.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 space-y-6">
          <div className="glass-card !p-8 border border-[#ffd700]/30 shadow-[0_0_30px_rgba(255,215,0,0.1)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700] to-[#b8860b] opacity-10 group-hover:opacity-20 transition-opacity z-0"></div>
            
            <div className="relative z-10 text-center mb-8">
              <div className="text-6xl mb-4">👑</div>
              <h2 className="text-3xl font-black mb-2 text-[#ffd700]">VIP Subscription</h2>
              <p className="text-lg text-[var(--text-secondary)]">The ultimate football manager experience.</p>
            </div>

            <div className="relative z-10 space-y-4 mb-8">
              <div className="flex items-center gap-4 bg-black/20 p-4 rounded">
                <span className="text-2xl">💰</span>
                <p className="font-bold">Daily 1,000 AI Coins Login Bonus</p>
              </div>
              <div className="flex items-center gap-4 bg-black/20 p-4 rounded">
                <span className="text-2xl">⭐</span>
                <p className="font-bold">Exclusive Gold VIP Badge on Leaderboards</p>
              </div>
              <div className="flex items-center gap-4 bg-black/20 p-4 rounded">
                <span className="text-2xl">🍀</span>
                <p className="font-bold">5% Boost to Pack Luck in Ultimate Team</p>
              </div>
              <div className="flex items-center gap-4 bg-black/20 p-4 rounded">
                <span className="text-2xl">📊</span>
                <p className="font-bold">Access to Pro Analytics & Betting Insights</p>
              </div>
            </div>

            <div className="relative z-10 text-center">
              <div className="text-3xl font-bold mb-1">NGN 5,000 <span className="text-sm font-normal text-[var(--text-secondary)]">/ month</span></div>
              <button 
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full mt-6 py-4 bg-gradient-to-r from-[#ffd700] to-[#b8860b] text-black font-black uppercase tracking-wider rounded hover:scale-105 transition-transform"
              >
                {loading ? "Redirecting..." : "Become a VIP Manager"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
