"use client";
import React, { useState, useEffect, useRef } from "react";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Load notifications from localStorage
    const saved = JSON.parse(localStorage.getItem("notifications") || "[]");
    setNotifications(saved);
    setUnreadCount(saved.filter(n => !n.read).length);

    // Listen for new notifications
    const handleNewNotification = (e) => {
      const detail = e.detail || { message: "Something happened!", type: "info" };
      const newNotif = {
        id: Date.now(),
        message: detail.message,
        type: detail.type || "info",
        timestamp: new Date().toLocaleTimeString(),
        read: false,
      };
      setNotifications(prev => {
        const updated = [newNotif, ...prev].slice(0, 20);
        localStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener("notification", handleNewNotification);

    // Auto-generate a welcome notification if none exist
    if (saved.length === 0) {
      const welcome = {
        id: Date.now(),
        message: "Welcome to AI Football Dashboard! 🎉",
        type: "success",
        timestamp: new Date().toLocaleTimeString(),
        read: false,
      };
      setNotifications([welcome]);
      setUnreadCount(1);
      localStorage.setItem("notifications", JSON.stringify([welcome]));
    }

    return () => window.removeEventListener("notification", handleNewNotification);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    localStorage.setItem("notifications", JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.setItem("notifications", JSON.stringify([]));
  };

  const typeIcon = (type) => {
    switch (type) {
      case "success": return "✅";
      case "warning": return "⚠️";
      case "bet_won": return "🎉";
      case "bet_lost": return "😭";
      case "achievement": return "🏆";
      default: return "🔔";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllRead();
        }}
        className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-colors relative"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-[#162032] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex justify-between items-center p-3 border-b border-[var(--border-color)]">
            <h4 className="font-bold text-sm">Notifications</h4>
            <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300">
              Clear All
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-secondary)] text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 border-b border-gray-800/50 flex gap-3 items-start text-sm ${
                    !n.read ? "bg-white/5" : ""
                  }`}
                >
                  <span className="text-lg">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] leading-snug">{n.message}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{n.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
