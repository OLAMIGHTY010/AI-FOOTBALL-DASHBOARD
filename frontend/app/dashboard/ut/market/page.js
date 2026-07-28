"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const API_URL = "http://localhost:8000";

export default function TransferMarketPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bankroll, setBankroll] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  const runAiScout = async () => {
    setAiLoading(true);
    const club = JSON.parse(localStorage.getItem('my_club') || '[]');
    try {
      const res = await fetch(`${API_URL}/api/ut/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club })
      });
      const data = await res.json();
      if (data.success) {
        setAiRecommendation(data);
      } else {
        alert(data.error || "Failed to run AI Scout.");
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting AI Scout.");
    }
    setAiLoading(false);
  };

  useEffect(() => {
    fetchMarket();
    setBankroll(parseFloat(localStorage.getItem("bankroll") || "0"));
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUserId(session.user.id);
      }
    });
  }, []);

  const fetchMarket = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ut/market`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch (e) {
      console.error("Error fetching market", e);
    }
    setLoading(false);
  };

  const buyPlayer = async (listing) => {
    if (bankroll < listing.price) {
      alert("Insufficient funds!");
      return;
    }
    
    // Deduct locally
    const newBankroll = bankroll - listing.price;
    setBankroll(newBankroll);
    localStorage.setItem("bankroll", newBankroll.toString());

    if (currentUserId) {
      await supabase.from("wallets").update({ balance: newBankroll }).eq("user_id", currentUserId);
    }

    try {
      const res = await fetch(`${API_URL}/api/ut/market/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listing.id, buyer_id: currentUserId || "guest" })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`Successfully bought ${data.player.name}!`);
        // Add to club
        const club = JSON.parse(localStorage.getItem('my_club') || '[]');
        localStorage.setItem('my_club', JSON.stringify([...club, data.player]));
        
        // Refresh market
        fetchMarket();
      } else {
        alert("Failed to buy player. They may have already been sold.");
        fetchMarket();
      }
    } catch (e) {
      console.error(e);
      alert("Error processing purchase.");
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">💸 Transfer Market</h1>
          <p className="text-[var(--text-secondary)]">Buy and sell players with other managers.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-xl font-black text-[var(--accent-primary)]">
            Bank: ${bankroll.toFixed(2)}
          </div>
          <Link href="/dashboard/ut" className="btn-secondary">
            ⬅ Back to Store
          </Link>
          <button 
            onClick={runAiScout} 
            disabled={aiLoading}
            className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 border-none shadow-[0_0_15px_rgba(168,85,247,0.5)]"
          >
            {aiLoading ? "Scouting..." : "🤖 AI Scout"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--accent-primary)] animate-pulse">Loading Market Listings...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-secondary)] glass-card">
          <div className="text-5xl mb-4">🛒</div>
          <p>No players currently listed on the market.</p>
          <p className="text-sm mt-2">Go to your Club and list someone!</p>
        </div>
      ) : (
        <>
          {aiRecommendation && (
            <div className="mb-8 p-6 glass-card bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-purple-500/50 flex flex-col md:flex-row items-center gap-6">
              <div className="text-6xl animate-pulse">🤖</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-purple-300 mb-2">AI Transfer Recommendation</h3>
                <p className="text-[var(--text-secondary)]">{aiRecommendation.message}</p>
              </div>
              {aiRecommendation.recommendation && (
                <button 
                  onClick={() => buyPlayer(aiRecommendation.recommendation)}
                  className="btn-primary whitespace-nowrap"
                >
                  Buy {aiRecommendation.recommendation.player.name}
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {listings.map((listing) => (
            <div key={listing.id} className="relative group w-full aspect-[2/3] rounded-xl p-3 flex flex-col items-center justify-between shadow-[0_4px_15px_rgba(0,0,0,0.3)] bg-gradient-to-b from-gray-800 to-gray-900 border border-[var(--border-color)]">
              <div className="w-full flex justify-between items-start">
                <div className="text-2xl font-black text-white">{listing.player.rating}</div>
                <div className="text-right">
                  <div className="font-bold text-sm text-[var(--text-secondary)]">{listing.player.position}</div>
                  <div className="text-[10px] text-yellow-400">{listing.player.rarity}</div>
                </div>
              </div>
              
              <div className="text-center w-full">
                <div className="text-lg font-black truncate text-white">{listing.player.name}</div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] truncate">{listing.player.team}</div>
              </div>

              <div className="w-full mt-2 bg-black/60 p-2 rounded text-center">
                <div className="text-xs text-[var(--text-secondary)] uppercase font-bold">Buy Now</div>
                <div className="text-xl font-black text-[var(--accent-primary)]">${listing.price.toFixed(0)}</div>
              </div>
              
              {/* Overlay to Buy */}
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                {listing.seller_id === currentUserId && currentUserId !== null ? (
                  <div className="text-white font-bold text-center p-2 border border-white/20 rounded">
                    Your Listing
                  </div>
                ) : (
                  <button 
                    onClick={() => buyPlayer(listing)}
                    className="btn-primary w-3/4 py-2"
                  >
                    Buy Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
