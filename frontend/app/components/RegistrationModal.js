"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const COUNTRIES = [
  "United States", "United Kingdom", "Nigeria", "Ghana",
  "South Africa", "Canada", "Australia", "Other",
];

export default function RegistrationModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || !firstName || !lastName || !phone || !dob || !username) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
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

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        { id: data.user.id, username: username }
      ]);
      if (profileError && profileError.code !== '23505') {
        console.error("Profile creation error:", profileError);
      }
    }

    setSuccess("Registration successful! Please log in.");
    setLoading(false);
    
    // Auto close after 2s if successful
    setTimeout(() => {
      onClose();
    }, 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-card max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        
        <div className="text-center mb-6 mt-4">
          <h2 className="text-2xl font-bold gradient-text">Create Account</h2>
          <p className="text-[var(--text-secondary)] text-sm">Join SimScoutbet today</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500 text-[var(--accent-primary)] p-3 rounded text-sm text-center">{success}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">First Name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded p-2 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="John" required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded p-2 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="Doe" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded p-2 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="johndoe123" required />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded p-2 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="john@example.com" required />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded p-2 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="+1234567890" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded p-2 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]" required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded p-2 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]">
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded p-2 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="••••••••" required minLength="6" />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[var(--accent-primary)] text-black font-bold rounded hover:opacity-90 transition-opacity mt-4"
          >
            {loading ? "Processing..." : "Register"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-color)]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)]">OR</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white text-black font-bold rounded hover:bg-gray-100 transition-colors"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Sign up with Google
          </button>
        </div>
        
        <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
          By registering, you agree to our Terms & Conditions and confirm you are 18+ years old.
        </p>
      </div>
    </div>
  );
}
