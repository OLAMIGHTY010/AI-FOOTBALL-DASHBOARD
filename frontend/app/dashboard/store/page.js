"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

const PACKS = [
  { id: "pack_5k", name: "Starter Pack", coins: 5000, price: 500, priceFormatted: "NGN 500", icon: "🥉", bg: "from-[#cd7f32] to-[#8b5a2b]" },
  { id: "pack_25k", name: "Pro Pack", coins: 25000, price: 2000, priceFormatted: "NGN 2,000", icon: "🥈", bg: "from-[#c0c0c0] to-[#808080]" },
  { id: "pack_100k", name: "Ultimate Pack", coins: 100000, price: 5000, priceFormatted: "NGN 5,000", icon: "🥇", bg: "from-[#ffd700] to-[#b8860b]" }
];

export default function StorePageWrapper() {
  return (
    <Suspense fallback={<div>Loading Store...</div>}>
      <StorePage />
    </Suspense>
  );
}

function StorePage() {
  const { addToast } = useAppContext();
  const searchParams = useSearchParams();
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      addToast("Purchase Successful!", "Your AI Coins will be credited to your account shortly.", "success");
    } else if (searchParams.get("canceled") === "true") {
      addToast("Purchase Canceled", "Your transaction was canceled.", "error");
    }
  }, [searchParams]);

  const handlePurchase = async (pack) => {
    setLoadingId(pack.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addToast("Error", "You must be logged in to purchase coins.", "error");
        setLoadingId(null);
        return;
      }

      const res = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          email: session.user.email,
          product_id: pack.id,
          amount: pack.price * 100 // Paystack uses Kobo (cents)
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
      setLoadingId(null);
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-4 mt-8">
        <div>
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Coin Store</h1>
          <p className="text-[var(--text-secondary)]">Purchase AI Coins to use in the Sportsbook and Ultimate Team.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PACKS.map((pack) => (
          <div key={pack.id} className="glass-card flex flex-col justify-between overflow-hidden relative group">
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${pack.bg} opacity-10 group-hover:opacity-20 transition-opacity z-0`}></div>
            
            <div className="relative z-10 text-center py-8">
              <div className="text-6xl mb-4">{pack.icon}</div>
              <h2 className="text-2xl font-black mb-2">{pack.name}</h2>
              <div className="text-[var(--accent-primary)] font-bold text-3xl mb-1">
                {pack.coins.toLocaleString()} <span className="text-sm">Coins</span>
              </div>
            </div>

            <div className="relative z-10 border-t border-white/10 p-6 bg-black/40 text-center">
              <div className="text-2xl font-bold mb-4">{pack.priceFormatted}</div>
              <button 
                onClick={() => handlePurchase(pack)}
                disabled={loadingId === pack.id}
                className="w-full btn-primary py-3"
              >
                {loadingId === pack.id ? "Redirecting..." : "Buy Now"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
