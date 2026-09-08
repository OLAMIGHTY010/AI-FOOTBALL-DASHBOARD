"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResponsibleGamblingPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Form state
  const [dailyDepositLimit, setDailyDepositLimit] = useState("");
  const [weeklyDepositLimit, setWeeklyDepositLimit] = useState("");
  const [monthlyDepositLimit, setMonthlyDepositLimit] = useState("");
  const [dailyLossLimit, setDailyLossLimit] = useState("");
  const [exclusionDays, setExclusionDays] = useState("7");
  const [showExclusionConfirm, setShowExclusionConfirm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/";
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile(data);
        setDailyDepositLimit(data.daily_deposit_limit || "");
        setWeeklyDepositLimit(data.weekly_deposit_limit || "");
        setMonthlyDepositLimit(data.monthly_deposit_limit || "");
        setDailyLossLimit(data.daily_loss_limit || "");
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const saveLimits = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:8000/api/responsible-gambling/deposit-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          daily: dailyDepositLimit ? parseFloat(dailyDepositLimit) : 0,
          weekly: weeklyDepositLimit ? parseFloat(weeklyDepositLimit) : 0,
          monthly: monthlyDepositLimit ? parseFloat(monthlyDepositLimit) : 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ Deposit limits saved successfully.");
      } else {
        setMessage("❌ " + (data.error || "Failed to save."));
      }
    } catch (e) {
      setMessage("❌ Network error.");
    }

    try {
      const res2 = await fetch("http://localhost:8000/api/responsible-gambling/loss-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          daily_limit: dailyLossLimit ? parseFloat(dailyLossLimit) : 0,
        }),
      });
      await res2.json();
    } catch {}
    setSaving(false);
  };

  const activateSelfExclusion = async () => {
    setSaving(true);
    setMessage("");
    try {
      const days = exclusionDays === "permanent" ? null : parseInt(exclusionDays);
      const res = await fetch("http://localhost:8000/api/responsible-gambling/self-exclude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, duration_days: days }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ " + data.message);
        setShowExclusionConfirm(false);
        setProfile({ ...profile, is_self_excluded: true });
      } else {
        setMessage("❌ " + (data.error || "Failed."));
      }
    } catch (e) {
      setMessage("❌ Network error.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4">
      <h1 className="text-3xl font-bold gradient-text">🛡️ Responsible Gambling</h1>
      <p className="text-[var(--text-secondary)]">
        We are committed to providing a safe gambling environment. Use the tools below
        to manage your limits and protect yourself.
      </p>

      {/* Status Banner */}
      {profile?.is_self_excluded && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400">
          <strong>⛔ Your account is self-excluded.</strong> You cannot place bets or make deposits
          during this period.
          {profile.self_exclusion_until && (
            <p className="mt-1 text-sm">
              Exclusion ends: {new Date(profile.self_exclusion_until).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.startsWith("✅")
            ? "bg-green-500/15 border border-green-500/30 text-green-400"
            : "bg-red-500/15 border border-red-500/30 text-red-400"
        }`}>
          {message}
        </div>
      )}

      {/* Deposit Limits */}
      <div className="glass-card">
        <h2 className="text-xl font-bold mb-4">💰 Deposit Limits</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Set maximum amounts you can deposit in a given time period. Set to 0 to remove the limit.
          Lowered limits take effect immediately; raised limits take 24 hours.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Daily Limit ($)</label>
            <input
              type="number" min="0" step="100"
              value={dailyDepositLimit}
              onChange={(e) => setDailyDepositLimit(e.target.value)}
              className="input-field"
              placeholder="e.g. 1000"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Weekly Limit ($)</label>
            <input
              type="number" min="0" step="100"
              value={weeklyDepositLimit}
              onChange={(e) => setWeeklyDepositLimit(e.target.value)}
              className="input-field"
              placeholder="e.g. 5000"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Monthly Limit ($)</label>
            <input
              type="number" min="0" step="500"
              value={monthlyDepositLimit}
              onChange={(e) => setMonthlyDepositLimit(e.target.value)}
              className="input-field"
              placeholder="e.g. 10000"
            />
          </div>
        </div>
      </div>

      {/* Loss Limits */}
      <div className="glass-card">
        <h2 className="text-xl font-bold mb-4">📉 Daily Loss Limit</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Set a maximum amount you can lose per day. Once reached, you will be blocked from
          placing further bets until the next day.
        </p>
        <div className="max-w-xs">
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Daily Loss Limit ($)</label>
          <input
            type="number" min="0" step="100"
            value={dailyLossLimit}
            onChange={(e) => setDailyLossLimit(e.target.value)}
            className="input-field"
            placeholder="e.g. 500"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveLimits}
        disabled={saving}
        className="btn-primary w-full disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Limits"}
      </button>

      {/* Self-Exclusion */}
      <div className="glass-card border-red-500/30 border">
        <h2 className="text-xl font-bold mb-4 text-red-400">⛔ Self-Exclusion</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          If you feel you need a break from gambling, you can exclude yourself from the platform.
          During self-exclusion, you <strong>cannot place bets or deposit funds</strong>, but you can
          still withdraw your balance.
        </p>

        {!profile?.is_self_excluded && (
          <>
            <div className="mb-4">
              <label className="block text-sm text-[var(--text-secondary)] mb-1">
                Exclusion Period
              </label>
              <select
                value={exclusionDays}
                onChange={(e) => setExclusionDays(e.target.value)}
                className="select-field"
              >
                <option value="1">24 Hours</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="180">6 Months</option>
                <option value="365">1 Year</option>
                <option value="permanent">Permanent (requires support to reverse)</option>
              </select>
            </div>

            {!showExclusionConfirm ? (
              <button
                onClick={() => setShowExclusionConfirm(true)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
              >
                Activate Self-Exclusion
              </button>
            ) : (
              <div className="p-4 bg-red-500/10 rounded-lg space-y-3">
                <p className="text-red-400 font-bold">
                  ⚠️ Are you sure? This action cannot be reversed for the selected period.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={activateSelfExclusion}
                    disabled={saving}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                  >
                    {saving ? "Processing..." : "Yes, Exclude Me"}
                  </button>
                  <button
                    onClick={() => setShowExclusionConfirm(false)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Help Resources */}
      <div className="glass-card">
        <h2 className="text-xl font-bold mb-4">🆘 Need Help?</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          If you or someone you know has a gambling problem, help is available:
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>🇬🇧 GamCare:</strong>{" "}
            <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener" className="text-green-400 hover:underline">
              gamcare.org.uk
            </a>{" "}
            | 0808 8020 133
          </li>
          <li>
            <strong>🇬🇧 BeGambleAware:</strong>{" "}
            <a href="https://www.begambleaware.org" target="_blank" rel="noopener" className="text-green-400 hover:underline">
              begambleaware.org
            </a>
          </li>
          <li>
            <strong>🇺🇸 National Problem Gambling Helpline:</strong> 1-800-522-4700
          </li>
          <li>
            <strong>🌍 Gamblers Anonymous:</strong>{" "}
            <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener" className="text-green-400 hover:underline">
              gamblersanonymous.org
            </a>
          </li>
          <li>
            <strong>🇳🇬 Nigeria:</strong> National Drug Law Enforcement Agency (NDLEA) Helpline
          </li>
        </ul>
      </div>

      {/* Legal Footer */}
      <div className="text-center text-xs text-[var(--text-secondary)] py-4 space-y-1">
        <p>🔞 You must be 18+ to use this platform. Gamble responsibly.</p>
        <p>
          <a href="/terms" className="text-green-400 hover:underline">Terms of Service</a>
          {" · "}
          <a href="/privacy" className="text-green-400 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
