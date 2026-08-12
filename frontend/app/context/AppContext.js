"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [aiCoins, setAiCoins] = useState(1000);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Daily Rewards
  const [showDailyRewardModal, setShowDailyRewardModal] = useState(false);
  const [loginStreak, setLoginStreak] = useState(0);
  const [dailyRewardAmount, setDailyRewardAmount] = useState(0);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Supabase Auth & Fetch
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        // Logged out
        setAiCoins(1000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (data) {
        setAiCoins(parseFloat(data.bankroll || data.ai_coins || 1000));
        
        // Sync JSON states down to localStorage
        if (data.ut_club) localStorage.setItem('ut_club', JSON.stringify(data.ut_club));
        if (data.active_squad) localStorage.setItem('ut_active_squad', JSON.stringify(data.active_squad));
        if (data.season_state) localStorage.setItem('season_state', JSON.stringify(data.season_state));
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  // Sync Bankroll up to Supabase when it changes
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        supabase.from('profiles').update({ bankroll: aiCoins }).eq('id', user.id).then();
      }, 1000);
      return () => clearTimeout(timer);
    }
    // Also save to localStorage as fallback
    localStorage.setItem('aiCoins', aiCoins.toString());
  }, [aiCoins, user]);

  // Expose a generic sync function for other components (like UT, Season) to push JSON state
  const syncGameState = async (columnName, jsonState) => {
    if (user) {
      const updateObj = {};
      updateObj[columnName] = jsonState;
      await supabase.from('profiles').update(updateObj).eq('id', user.id);
    }
  };

  // Initialize UI settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);

    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');

    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) setLanguage(savedLanguage);

    // Initial fallback for AI coins if not logged in
    if (!user) {
      const savedCoins = localStorage.getItem('aiCoins');
      if (savedCoins) setAiCoins(parseInt(savedCoins));
    }

    // Daily Login Check
    const lastLogin = localStorage.getItem('lastLoginDate');
    const savedStreak = parseInt(localStorage.getItem('loginStreak') || '0');
    
    const todayDateString = new Date().toDateString();
    const yesterdayDateString = new Date(Date.now() - 86400000).toDateString();

    if (lastLogin !== todayDateString) {
      let newStreak = 1;
      if (lastLogin === yesterdayDateString) {
        newStreak = savedStreak + 1;
      }
      
      const reward = 100 + (Math.min(newStreak, 7) * 20); // 100 base + 20 per day (up to 7 days)
      setDailyRewardAmount(reward);
      setLoginStreak(newStreak);
      setShowDailyRewardModal(true);
    }
  }, [user]);

  // Update theme class on body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persist coins and sound
  useEffect(() => {
    localStorage.setItem('aiCoins', aiCoins);
  }, [aiCoins]);

  useEffect(() => {
    localStorage.setItem('soundEnabled', soundEnabled);
  }, [soundEnabled]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    playSound('/sounds/click.wav');
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const playSound = (src) => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio(src);
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio playback failed:', e));
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  const addCoins = (amount) => {
    setAiCoins(prev => prev + amount);
    if (amount > 0) playSound('/sounds/coin.wav');
  };

  const deductCoins = (amount) => {
    if (aiCoins >= amount) {
      setAiCoins(prev => prev - amount);
      return true;
    }
    return false;
  };

  const claimDailyReward = () => {
    addCoins(dailyRewardAmount);
    localStorage.setItem('lastLoginDate', new Date().toDateString());
    localStorage.setItem('loginStreak', loginStreak.toString());
    setShowDailyRewardModal(false);
  };

  return (
    <AppContext.Provider value={{
      user, isLoadingAuth, syncGameState,
      theme, toggleTheme,
      aiCoins, addCoins, deductCoins,
      soundEnabled, toggleSound, playSound,
      showDailyRewardModal,
      setShowDailyRewardModal,
      loginStreak,
      dailyRewardAmount,
      claimDailyReward,
      language,
      changeLanguage,
      toasts,
      addToast,
      removeToast
    }}>
      {children}
      
      {/* Daily Reward Modal */}
      {showDailyRewardModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="glass-card max-w-md w-full p-6 text-center animate-bounce-subtle border-[var(--accent-primary)] border-2">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-black mb-2">Daily Login Bonus!</h2>
            <p className="text-[var(--text-secondary)] mb-4">Welcome back manager! Here are your daily AI Coins.</p>
            
            <div className="bg-[var(--bg-secondary)] rounded-lg p-4 mb-6">
              <div className="text-4xl font-bold text-yellow-400 mb-2">+{dailyRewardAmount}</div>
              <div className="text-sm font-bold text-[var(--accent-primary)]">🔥 {loginStreak} Day Streak!</div>
            </div>
            
            <button 
              onClick={claimDailyReward}
              className="btn-primary w-full py-3 rounded-lg font-bold text-lg"
            >
              Claim Coins
            </button>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
