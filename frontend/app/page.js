"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const COUNTRIES = [
  "United States", "United Kingdom", "Nigeria", "Ghana",
  "South Africa", "Canada", "Australia", "Other",
];

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = "/dashboard";
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    if (!email || !password) {
      setError("Please provide both email and password.");
      setLoading(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Login successful
    window.location.href = "/dashboard";
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || !firstName || !lastName || !phone || !dob) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          dob: dob,
          country: country,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess("Sign up successful! Please check your email to confirm your account.");
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 70%)" }}>
      <div className="w-full max-w-md mt-8 mb-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">⚽ AI Football</h1>
          <p className="text-[var(--text-secondary)]">
            Real-money sports betting & gaming platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-card">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setTab("login"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                tab === "login"
                  ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                tab === "signup"
                  ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field" placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field" placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-color)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[var(--bg-glass)] px-3 text-[var(--text-secondary)]">or</span>
                </div>
              </div>

              <button type="button" onClick={handleGoogleLogin} className="btn-secondary w-full flex items-center justify-center gap-2">
                <span>🌐</span> Sign in with Google
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">First Name</label>
                  <input
                    type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="input-field" placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Last Name</label>
                  <input
                    type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="input-field" placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Phone Number</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="input-field" placeholder="+234 801 234 5678"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Date of Birth</label>
                <input
                  type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Country of Residence</label>
                <select
                  value={country} onChange={(e) => setCountry(e.target.value)}
                  className="select-field"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field" placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field" placeholder="Min 6 characters"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
