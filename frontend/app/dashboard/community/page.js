"use client";
import { useState, useEffect } from "react";

export default function CommunityPage() {
  const [tab, setTab] = useState("News");

  const [newsFeed, setNewsFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fpl/bootstrap");
        const json = await res.json();
        
        if (json.elements && json.teams) {
            const tMap = {};
            json.teams.forEach(t => { tMap[t.id] = t.name; });

            // Get players with news
            const playersWithNews = json.elements
                .filter(p => p.news && p.news.trim() !== "")
                .sort((a, b) => new Date(b.news_added || 0) - new Date(a.news_added || 0))
                .slice(0, 20); // Get latest 20 news items

            const formattedNews = playersWithNews.map(p => ({
                id: p.id,
                title: `${p.first_name} ${p.second_name} (${tMap[p.team]})`,
                source: "FPL Official",
                time: p.news_added ? new Date(p.news_added).toLocaleDateString() : "Recent",
                snippet: p.news
            }));
            
            setNewsFeed(formattedNews);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    
    fetchNews();
  }, []);

  return (
    <div className="w-full flex flex-col font-sans">
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
        <div className="text-lg font-bold">Community</div>
        <div className="flex gap-4 text-xl">
          <button>↻</button>
        </div>
      </div>

      <div className="flex border-b border-gray-800 text-sm font-medium">
        <button 
          onClick={() => setTab("News")} 
          className={`flex-1 py-3 text-center border-b-2 ${tab === 'News' ? 'border-[#37003c] text-white' : 'border-transparent text-gray-400'}`}
        >
          News
        </button>
        <button 
          onClick={() => setTab("Chat")} 
          className={`flex-1 py-3 text-center border-b-2 ${tab === 'Chat' ? 'border-[#37003c] text-white' : 'border-transparent text-gray-400'}`}
        >
          Chat
        </button>
      </div>

      <div className="p-4 space-y-4">
        {tab === "News" ? (
          loading ? (
            <div className="text-center text-gray-500 py-10">Loading FPL updates...</div>
          ) : newsFeed.length > 0 ? (
            newsFeed.map(item => (
                <div key={item.id} className="bg-[#162032] p-4 rounded-xl border border-gray-800 hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span className="font-bold text-[#00ff87]">{item.source}</span>
                        <span>{item.time}</span>
                    </div>
                    <div className="font-bold text-sm mb-1">{item.title}</div>
                    <div className="text-xs text-gray-300">{item.snippet}</div>
                </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-10">No recent updates found.</div>
          )
        ) : (
          <div className="space-y-3">
             <div className="bg-[#162032] rounded-xl border border-gray-800 p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#37003c] rounded-full flex items-center justify-center text-lg">🇬🇧</div>
                    <div>
                        <div className="font-bold text-sm">Enter English Chat</div>
                        <div className="text-xs text-gray-400">Join the discussion with English managers</div>
                    </div>
                </div>
                <div className="text-gray-500">›</div>
             </div>
             
             <div className="bg-[#162032] rounded-xl border border-gray-800 p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#37003c] rounded-full flex items-center justify-center text-lg">🌍</div>
                    <div>
                        <div className="font-bold text-sm">Enter Global Chat</div>
                        <div className="text-xs text-gray-400">Chat with managers worldwide</div>
                    </div>
                </div>
                <div className="text-gray-500">›</div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
