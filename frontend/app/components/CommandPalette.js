"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ACTIONS = [
  { id: "dashboard", name: "Go to Dashboard", shortcut: "H", path: "/dashboard", icon: "🏠" },
  { id: "fpl", name: "FPL Hub", shortcut: "F", path: "/dashboard/fpl", icon: "⚽" },
  { id: "simulate", name: "Virtual Sportsbook", shortcut: "S", path: "/dashboard/simulate", icon: "🎟️" },
  { id: "ut", name: "Ultimate Team", shortcut: "U", path: "/dashboard/ut", icon: "🏆" },
  { id: "profile", name: "My Profile", shortcut: "P", path: "/dashboard/profile", icon: "👔" },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const filteredActions = ACTIONS.filter((action) =>
    action.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    setIsOpen(false);
    setQuery("");
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-xl glass-card overflow-hidden shadow-2xl animate-bounce-subtle border-[var(--accent-primary)] border">
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-color)]">
          <span className="text-[var(--text-secondary)] mr-3">🔍</span>
          <input
            autoFocus
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-[var(--text-secondary)]"
            placeholder="Search commands, pages... (Try 'FPL')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setIsOpen(false)} className="text-xs border border-[var(--border-color)] px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">ESC</button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="p-4 text-center text-[var(--text-secondary)]">No results found.</div>
          ) : (
            filteredActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleSelect(action.path)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--accent-primary)]/20 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{action.icon}</span>
                  <span className="font-bold">{action.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border-color)] text-[var(--text-secondary)]">⌘</span>
                  <span className="text-xs bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border-color)] text-[var(--text-secondary)]">{action.shortcut}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
