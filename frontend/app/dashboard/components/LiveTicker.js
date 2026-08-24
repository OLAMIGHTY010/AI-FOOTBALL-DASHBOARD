"use client";
import React, { useState, useEffect } from 'react';

const FALLBACK_NEWS = [
  "LIVE: Welcome to AI Football Dashboard! ⚽",
  "VIRTUAL: AI model correctly predicts matches! 🚀"
];

export default function LiveTicker() {
  const [newsItems, setNewsItems] = useState(FALLBACK_NEWS);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/news');
        if (res.ok) {
          const data = await res.json();
          if (data.news && data.news.length > 0) {
            setNewsItems(data.news);
          }
        }
      } catch (err) {
        console.error("Error fetching live news:", err);
      }
    };

    // Fetch immediately
    fetchNews();

    // Refresh every 60 seconds
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 w-full h-10 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center overflow-hidden z-50">
      <div className="bg-[var(--accent-primary)] text-[var(--bg-primary)] px-4 py-2 font-bold z-10 flex-shrink-0 h-full flex items-center">
        LIVE 🔴
      </div>
      <div className="flex-1 overflow-hidden relative h-full">
        <div className="absolute whitespace-nowrap animate-ticker h-full flex items-center text-[var(--text-primary)] font-medium">
          {newsItems.map((item, index) => (
            <span key={index} className="mx-8">
              {item}
            </span>
          ))}
          {/* Duplicate for seamless scrolling */}
          {newsItems.map((item, index) => (
            <span key={`dup-${index}`} className="mx-8">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
