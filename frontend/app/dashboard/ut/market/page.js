"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";

const API_URL = "http://localhost:8000";

export default function TransferMarketPage() {
  const { aiCoins, addCoins, deductCoins } = useAppContext();
  const [listings, setListings] = useState([]);
  const [myClub, setMyClub] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellMode, setSellMode] = useState(false);

  useEffect(() => {
    fetchMarket();
    const club = JSON.parse(localStorage.getItem('my_club') || '[]');
    setMyClub(club);
  }, []);

  const fetchMarket = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ut/market`);
      const data = await res.json();
      setListings(data.listings || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch market:", err);
      setLoading(false);
    }
  };

  const buyPlayer = async (listing) => {
    if (aiCoins < listing.price) {
      alert("Not enough AI Coins!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/ut/market/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listing.id, buyer_id: "local_user" })
      });
      const data = await res.json();
      
      if (data.success) {
        deductCoins(listing.price);
        const newClub = [...myClub, listing.player];
        setMyClub(newClub);
        localStorage.setItem("my_club", JSON.stringify(newClub));
        fetchMarket(); // Refresh market
        alert(`Successfully bought ${listing.player.name}!`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to buy player.");
    }
  };

  const listPlayer = async (player) => {
    const price = prompt(`Enter listing price for ${player.name} (Suggested: ${player.sell_value * 2}):`);
    if (!price || isNaN(price) || parseFloat(price) <= 0) return;

    const numPrice = parseFloat(price);

    try {
      const res = await fetch(`${API_URL}/api/ut/market/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: player, price: numPrice, seller_id: "local_user" })
      });
      const data = await res.json();
      
      if (data.success) {
        // Remove from club locally
        const newClub = myClub.filter(p => p.id !== player.id);
        setMyClub(newClub);
        localStorage.setItem("my_club", JSON.stringify(newClub));
        fetchMarket();
        alert(`Listed ${player.name} on the market! (Wait for someone to buy it)`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "Icon": return "text-white bg-gradient-to-r from-gray-300 to-gray-500 border-white";
      case "Gold": return "text-yellow-900 bg-gradient-to-r from-yellow-300 to-yellow-600 border-yellow-300";
      case "Silver": return "text-gray-900 bg-gradient-to-r from-gray-300 to-gray-400 border-gray-300";
      case "Bronze": return "text-orange-900 bg-gradient-to-r from-orange-300 to-orange-500 border-orange-300";
      default: return "text-white bg-gray-700 border-gray-600";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black mb-2">💸 Transfer Market</h1>
          <p className="text-[var(--text-secondary)]">Buy and sell players with other managers.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setSellMode(!sellMode)} 
            className={`btn-secondary ${sellMode ? 'bg-[var(--accent-primary)] text-black' : ''}`}
          >
            {sellMode ? 'Cancel Selling' : 'List My Players'}
          </button>
          <Link href="/dashboard/ut" className="btn-primary">Back to Hub</Link>
        </div>
      </div>

      {sellMode ? (
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold mb-4">Select Player to List</h2>
          {myClub.length === 0 ? (
            <p className="text-[var(--text-secondary)]">Your club is empty.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {myClub.map((p, idx) => (
                <div key={idx} className={`border-2 rounded-lg p-3 text-center cursor-pointer transition-transform hover:scale-105 shadow-lg ${getRarityColor(p.rarity)}`} onClick={() => listPlayer(p)}>
                  <div className="font-black text-2xl">{p.rating}</div>
                  <div className="font-bold text-sm truncate">{p.name}</div>
                  <div className="text-xs opacity-80">{p.position}</div>
                  <div className="mt-2 text-xs font-black bg-black/20 rounded py-1 border border-black/10">Est: {p.sell_value} Coins</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold mb-4 border-b border-[var(--border-color)] pb-2 flex justify-between">
            <span>Live Listings</span>
            <button onClick={fetchMarket} className="text-sm font-normal text-[var(--accent-primary)] hover:underline">Refresh</button>
          </h2>
          
          {loading ? (
            <div className="text-center py-10 animate-pulse">Loading market data...</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-secondary)]">
              No players currently listed on the market.<br/>
              Be the first to list a player!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {listings.map(listing => (
                <div key={listing.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 flex justify-between items-center group hover:border-[var(--accent-primary)] transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className={`w-16 h-20 rounded border-2 flex flex-col justify-center items-center shadow ${getRarityColor(listing.player.rarity)}`}>
                      <span className="font-black text-xl">{listing.player.rating}</span>
                      <span className="text-[10px] font-bold">{listing.player.position}</span>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{listing.player.name}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{listing.player.rarity}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">Listed by: {listing.seller_id === 'local_user' ? 'You' : (listing.seller_id ? listing.seller_id.substring(0, 6) : 'System')}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => buyPlayer(listing)}
                    disabled={listing.seller_id === 'local_user'}
                    className={`font-bold px-4 py-2 rounded ${listing.seller_id === 'local_user' ? 'bg-gray-700 cursor-not-allowed opacity-50' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                  >
                    Buy <br/> 💳 {listing.price}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
