"use client";
import React from 'react';

const NEWS_ITEMS = [
  "BREAKING: AI model correctly predicts 15 consecutive matches! 🚀",
  "RUMOR: Real Madrid planning massive virtual transfer bid for Haaland. ⚽",
  "UPDATE: Server maintenance scheduled for next week to upgrade AI engine. 🔧",
  "TRENDING: Over 10,000 users have now joined the Global Chat! 🌍",
  "RESULTS: Man City 3 - 1 Arsenal (Virtual Match) 🏆",
  "FPL: Haaland's expected points skyrocket ahead of Double Gameweek! 📈"
];

export default function LiveTicker() {
  return (
    <div className="fixed bottom-0 w-full h-10 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center overflow-hidden z-50">
      <div className="bg-[var(--accent-primary)] text-[var(--bg-primary)] px-4 py-2 font-bold z-10 flex-shrink-0 h-full flex items-center">
        LIVE 🔴
      </div>
      <div className="flex-1 overflow-hidden relative h-full">
        <div className="absolute whitespace-nowrap animate-ticker h-full flex items-center text-[var(--text-primary)] font-medium">
          {NEWS_ITEMS.map((item, index) => (
            <span key={index} className="mx-8">
              {item}
            </span>
          ))}
          {/* Duplicate for seamless scrolling */}
          {NEWS_ITEMS.map((item, index) => (
            <span key={`dup-${index}`} className="mx-8">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
