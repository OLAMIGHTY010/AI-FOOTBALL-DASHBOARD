"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PACKS = [
  { id: "pack_5k", name: "Starter Pack", coins: 5000, price: 500, priceFormatted: "NGN 500", icon: "🥉", bg: "from-[#cd7f32] to-[#8b5a2b]" },
  { id: "pack_25k", name: "Pro Pack", coins: 25000, price: 2000, priceFormatted: "NGN 2,000", icon: "🥈", bg: "from-[#c0c0c0] to-[#808080]" },
  { id: "pack_100k", name: "Ultimate Pack", coins: 100000, price: 5000, priceFormatted: "NGN 5,000", icon: "🥇", bg: "from-[#ffd700] to-[#b8860b]" }
];

export default function WalletPageWrapper() {
  return (
    <Suspense fallback={<div>Loading Wallet...</div>}>
      <WalletPage />
    </Suspense>
  );
}

function WalletPage() {
  const { user, aiCoins, addToast } = useAppContext();
  const searchParams = useSearchParams();
  const [loadingId, setLoadingId] = useState(null);
  const [activeTab, setActiveTab] = useState("deposit"); // "deposit" | "withdraw"
  
  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({data}) => {
         if (data) setUserProfile(data);
      });
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      addToast("Deposit Successful!", "Your AI Coins have been credited to your account.", "success");
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (searchParams.get("canceled") === "true") {
      addToast("Transaction Canceled", "Your transaction was canceled.", "error");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const handlePurchase = async (pack) => {
    setLoadingId(pack.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addToast("Error", "You must be logged in to deposit funds.", "error");
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

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast("Error", "You must be logged in to withdraw funds.", "error");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast("Error", "Please enter a valid amount.", "error");
      return;
    }

    if (amount > aiCoins) {
      addToast("Error", "Insufficient bankroll.", "error");
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          amount: amount,
          bank_code: bankCode,
          account_number: accountNumber
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Withdrawal failed");
      }

      addToast("Withdrawal Initiated", data.message || "Your funds are on the way!", "success");
      setWithdrawAmount("");
      setAccountNumber("");
      setBankCode("");
    } catch (err) {
      console.error(err);
      addToast("Withdrawal Error", err.message, "error");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="animate-fade-in pb-20 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-4 mt-8">
        <div>
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Wallet</h1>
          <p className="text-[var(--text-secondary)]">Manage your bankroll. Deposit funds or withdraw your winnings.</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-[var(--text-secondary)] uppercase font-bold tracking-wider">Current Bankroll</div>
          <div className="text-4xl font-black text-yellow-400">₦{aiCoins.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab("deposit")} 
          className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === "deposit" ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"}`}
        >
          Deposit Funds
        </button>
        <button 
          onClick={() => setActiveTab("withdraw")} 
          className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === "withdraw" ? "bg-red-500 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"}`}
        >
          Withdraw Winnings
        </button>
      </div>

      {activeTab === "deposit" && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold mb-6">Select a Deposit Pack</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKS.map((pack) => (
              <div key={pack.id} className="glass-card flex flex-col justify-between overflow-hidden relative group">
                <div className={`absolute inset-0 bg-gradient-to-br ${pack.bg} opacity-10 group-hover:opacity-20 transition-opacity z-0`}></div>
                
                <div className="relative z-10 text-center py-8">
                  <div className="text-6xl mb-4">{pack.icon}</div>
                  <h2 className="text-2xl font-black mb-2">{pack.name}</h2>
                  <div className="text-[var(--accent-primary)] font-bold text-3xl mb-1">
                    ₦{pack.coins.toLocaleString()}
                  </div>
                </div>

                <div className="relative z-10 border-t border-white/10 p-6 bg-black/40 text-center">
                  <div className="text-2xl font-bold mb-4">{pack.priceFormatted}</div>
                  <button 
                    onClick={() => handlePurchase(pack)}
                    disabled={loadingId === pack.id}
                    className="w-full btn-primary py-3"
                  >
                    {loadingId === pack.id ? "Redirecting to Paystack..." : "Deposit Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "withdraw" && (
        <div className="animate-fade-in glass-card p-8 max-w-2xl mx-auto border-t-4 border-red-500">
          <h2 className="text-2xl font-bold mb-2">Withdraw to Bank Account</h2>
          
          {(!userProfile || !userProfile.full_name) ? (
            <div className="bg-yellow-500/10 border border-yellow-500/50 p-6 rounded-lg text-center my-8">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold mb-2 text-yellow-500">KYC Verification Required</h3>
              <p className="text-[var(--text-secondary)] mb-6">You must set your Legal Full Name in your profile before withdrawing funds. This must strictly match your bank account name to prevent fraud.</p>
              <a href="/dashboard/profile" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg transition-colors inline-block">Update Profile Identity</a>
            </div>
          ) : (
            <>
              <p className="text-[var(--text-secondary)] mb-8">
                Withdrawing as: <strong className="text-white">{userProfile.full_name}</strong>
                <br/>
                <span className="text-sm">Enter your details to initiate a Paystack Transfer.</span>
              </p>
              
              <form onSubmit={handleWithdrawal} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Withdrawal Amount (₦)</label>
                  <input 
                    type="number" 
                    className="input-field w-full text-2xl font-black p-4" 
                    placeholder="e.g. 5000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="100"
                    max={aiCoins}
                    required 
                  />
                  <div className="mt-2 text-sm text-[var(--text-secondary)] flex justify-between">
                    <span>Min: ₦100</span>
                    <span>Max: ₦{aiCoins.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Bank Name / Code</label>
                    <select 
                      className="select-field w-full"
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      required
                    >
                      <option value="">Select Bank...</option>
                      <option value="044">Access Bank</option>
                      <option value="011">First Bank</option>
                      <option value="058">Guaranty Trust Bank (GTB)</option>
                      <option value="033">United Bank for Africa (UBA)</option>
                      <option value="057">Zenith Bank</option>
                      <option value="123">Opay</option>
                      <option value="456">Moniepoint</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Account Number</label>
                    <input 
                      type="text" 
                      className="input-field w-full" 
                      placeholder="10 digit account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      maxLength="10"
                      required 
                    />
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-8 flex items-start gap-4">
                  <div className="text-2xl">⚠️</div>
                  <div className="text-sm">
                    <strong>Important:</strong> Ensure your bank details are correct. Transfers via Paystack are typically processed within 24 hours. Your bankroll will be deducted immediately.
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-lg py-4 rounded-lg transition-colors flex justify-center items-center gap-2"
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? "Processing..." : "Initiate Withdrawal"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
