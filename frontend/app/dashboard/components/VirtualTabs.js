"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VirtualTabsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSport = searchParams.get('sport') || 'football';

  const buildHref = (path) => `${path}?sport=${currentSport}`;

  const tabs = [
    { name: '🎮 Matches', path: '/dashboard/simulate' },
    { name: '🏆 Standings', path: '/dashboard/standings' },
    { name: '📊 Sportsbook', path: '/dashboard/sportsbook' },
    { name: '📜 Bet History', path: '/dashboard/history' },
    { name: '👔 Tactics', path: '/dashboard/tactics' },
  ];

  return (
    <div className="flex flex-col items-center mb-6">
      {/* Sport Selector */}
      <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-[var(--border-color)] mb-4">
        <Link 
          href={`${pathname}?sport=football`}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${currentSport === 'football' ? 'bg-[var(--accent-primary)] text-black shadow-[0_0_15px_rgba(0,255,136,0.5)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          ⚽ Football
        </Link>
        <Link 
          href={`${pathname}?sport=basketball`}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${currentSport === 'basketball' ? 'bg-[#ff7b00] text-black shadow-[0_0_15px_rgba(255,123,0,0.5)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          🏀 Basketball
        </Link>
        <Link 
          href={`${pathname}?sport=tennis`}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${currentSport === 'tennis' ? 'bg-[#c6ff00] text-black shadow-[0_0_15px_rgba(198,255,0,0.5)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          🎾 Tennis
        </Link>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          // Apply sport-specific accent colors for the active tab
          let activeClass = 'bg-[var(--accent-primary)] text-black shadow-[0_0_15px_rgba(0,255,136,0.5)]';
          if (currentSport === 'basketball') {
            activeClass = 'bg-[#ff7b00] text-black shadow-[0_0_15px_rgba(255,123,0,0.5)]';
          } else if (currentSport === 'tennis') {
            activeClass = 'bg-[#c6ff00] text-black shadow-[0_0_15px_rgba(198,255,0,0.5)]';
          }
            
          return (
            <Link
              key={tab.name}
              href={buildHref(tab.path)}
              className={`px-4 py-2 rounded font-bold transition-all ${
                isActive
                  ? activeClass
                  : 'bg-[var(--bg-card)] hover:bg-white/10 text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function VirtualTabs() {
  return (
    <Suspense fallback={<div className="h-20" />}>
      <VirtualTabsContent />
    </Suspense>
  );
}
