"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

export default function TransferMarketPage() {
  const { user, aiCoins, deductCoins, syncGameState } = useAppContext();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMarket();
  }, []);

  const fetchMarket = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transfer_market')
        .select(`
          id,
          card,
          price,
          seller_id,
          profiles:seller_id (username)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.error("Failed to fetch market:", err);
    } finally {
      setLoading(false);
    }
  };

  const buyPlayer = async (listing) => {
    if (!user) {
      alert("You must be logged in to use the transfer market.");
      return;
    }
    if (user.id === listing.seller_id) {
      alert("You cannot buy your own listing!");
      return;
    }
    if (aiCoins < listing.price) {
      alert("Not enough AI Coins!");
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('execute_transfer', {
        p_listing_id: listing.id,
        p_buyer_id: user.id
      });

      if (error) throw error;
      
      if (data && data.success) {
        // Transfer successful on backend
        alert(`Successfully bought ${listing.card.name}!`);
        
        // Update local context
        deductCoins(listing.price);
        
        // Update local club state
        const currentClub = JSON.parse(localStorage.getItem('ut_club') || '[]');
        const newClub = [...currentClub, data.card];
        localStorage.setItem('ut_club', JSON.stringify(newClub));
        // Note: The RPC already updated the DB, so we don't strictly need to sync it up, 
        // but calling syncGameState keeps Context happy. We could just rely on context reloading,
        // but let's push the new state to Context.
        syncGameState('ut_club', newClub);
        
        // Refresh market listings
        fetchMarket();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to buy player. They might have already been sold!");
    } finally {
      setProcessing(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Bronze': return 'from-[#cd7f32] to-[#8b5a2b]';
      case 'Silver': return 'from-[#e6e8fa] to-[#8a8d91]';
      case 'Gold': return 'from-[#ffd700] to-[#b8860b]';
      case 'Icon': return 'from-[#fff] to-[#d4af37] border border-[#d4af37]';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text">Transfer Market</h1>
          <p className="text-[var(--text-secondary)] font-bold">Buy and sell players with other managers.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-card flex items-center gap-2 !py-2 !px-4">
            <span className="text-xl">🪙</span>
            <span className="font-black text-xl text-[var(--accent-primary)]">{aiCoins.toLocaleString()}</span>
          </div>
          <Link href="/dashboard/ut/club" className="btn-primary">
            Sell Players
          </Link>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={fetchMarket} className="btn-secondary flex items-center gap-2">
          <span>🔄</span> Refresh Market
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-xl font-bold animate-pulse text-[var(--text-secondary)]">
          Scouting the market...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing, index) => {
            const p = listing.card;
            return (
              <div key={listing.id} className="glass-card !p-0 overflow-hidden group hover:scale-105 transition-transform duration-300 relative">
                <div className={`h-24 bg-gradient-to-br ${getRarityColor(p.rarity)} p-4 flex flex-col justify-end relative overflow-hidden`}>
                  <div className="absolute top-2 right-2 text-3xl font-black opacity-30">{p.rating}</div>
                  <div className="absolute top-2 left-2 text-sm font-bold bg-black/50 px-2 rounded backdrop-blur-sm">
                    {p.position}
                  </div>
                  <h3 className="font-black text-xl text-white drop-shadow-md relative z-10">{p.name}</h3>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[var(--text-secondary)] font-bold text-sm">Seller</span>
                    <span className="font-bold">{listing.profiles?.username || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[var(--text-secondary)] font-bold text-sm">Buy Now Price</span>
                    <span className="font-black text-[var(--accent-primary)] text-lg">${listing.price.toLocaleString()}</span>
                  </div>
                  
                  <button 
                    onClick={() => buyPlayer(listing)}
                    disabled={processing || (user && user.id === listing.seller_id)}
                    className="w-full btn-primary !py-2 flex items-center justify-center gap-2"
                  >
                    <span>💸</span> {processing ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            );
          })}
          
          {listings.length === 0 && (
            <div className="col-span-full glass-card p-12 text-center">
              <span className="text-4xl mb-4 block">🏜️</span>
              <h3 className="text-xl font-bold mb-2">The market is quiet...</h3>
              <p className="text-[var(--text-secondary)]">No players are currently listed for sale.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
