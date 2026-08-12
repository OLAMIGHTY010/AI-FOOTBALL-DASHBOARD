"use client";
import React, { useState, useRef, useEffect } from 'react';

const AI_RESPONSES = {
  captain: "🤖 Based on my xG models, Erling Haaland is the standout captaincy option this week with a predicted 1.2 goals against newly promoted opposition. Salah is a strong differential.",
  odds: "🤖 The Virtual Sportsbook currently has Manchester City as heavy favorites at 1.45 to win their next virtual simulation.",
  injury: "🤖 Alexander-Arnold is marked with a 75% chance of playing. I recommend keeping him in your starting XI but ensuring your first sub plays 90 minutes.",
  bet: "🤖 For a solid Parlay, I'd suggest combining Real Madrid to win with Over 2.5 goals in the Bayern match. Potential total odds: 3.20.",
  hello: "🤖 Hello Manager! How can I assist you today? Ask me about captaincy advice, betting odds, or injury news!",
  default: "🤖 I'm currently analyzing thousands of data points. Could you rephrase your question regarding FPL, Betting, or Match Simulations?"
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: AI_RESPONSES.hello, sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');

    // Simulate AI thinking
    setTimeout(() => {
      let response = AI_RESPONSES.default;
      const lowerInput = userMsg.toLowerCase();
      
      if (lowerInput.includes('captain') || lowerInput.includes('c ')) response = AI_RESPONSES.captain;
      else if (lowerInput.includes('odds') || lowerInput.includes('win')) response = AI_RESPONSES.odds;
      else if (lowerInput.includes('injury') || lowerInput.includes('hurt')) response = AI_RESPONSES.injury;
      else if (lowerInput.includes('bet') || lowerInput.includes('parlay')) response = AI_RESPONSES.bet;
      else if (lowerInput.includes('hello') || lowerInput.includes('hi')) response = AI_RESPONSES.hello;

      setMessages(prev => [...prev, { text: response, sender: 'ai' }]);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[450px] bg-[#162032] border border-[var(--accent-primary)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-[var(--accent-primary)] p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-black text-black leading-tight">AI Assistant</h3>
                <p className="text-black/70 text-xs font-bold">Always Active</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-black hover:bg-black/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white ml-auto rounded-br-sm' : 'bg-gray-700 text-white mr-auto rounded-bl-sm'}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#162032] border-t border-gray-700 flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about FPL or Betting..."
              className="flex-1 bg-black/40 border border-gray-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)] text-white"
            />
            <button 
              onClick={handleSend}
              className="bg-[var(--accent-primary)] text-black rounded-full w-10 h-10 flex items-center justify-center font-black hover:scale-105 transition-transform"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:scale-110 hover:shadow-[0_0_30px_rgba(0,255,135,0.6)] transition-all"
      >
        {isOpen ? '💬' : '🤖'}
      </button>
    </div>
  );
}
