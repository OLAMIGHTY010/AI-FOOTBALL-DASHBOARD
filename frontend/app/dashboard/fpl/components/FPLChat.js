"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function FPLChat({ session }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('fpl-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fpl_messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('fpl_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (data) setMessages(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !session) return;

    const { error } = await supabase
      .from('fpl_messages')
      .insert([
        {
          user_id: session.user.id,
          email: session.user.email,
          content: newMessage.trim(),
        }
      ]);

    if (!error) {
      setNewMessage("");
    } else {
      console.error(error);
      alert("Failed to send message. Make sure you ran the fpl_messages SQL script!");
    }
  };

  return (
    <div className="flex flex-col h-[600px] glass-card">
      <div className="p-4 border-b border-[var(--border-color)] bg-black/40">
        <h2 className="font-bold text-lg text-purple-400">💬 FPL Managers Lounge</h2>
        <p className="text-xs text-[var(--text-secondary)]">Discuss captain picks, injuries, and differentials.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-black/20">
        {messages.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] py-10 italic">
            The lounge is empty. Start the discussion!
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-3 rounded-lg max-w-[80%] ${msg.user_id === session?.user?.id ? 'bg-purple-600 text-white self-end' : 'bg-gray-800 text-white self-start'}`}
            >
              <div className="text-[10px] font-bold mb-1 opacity-70">
                {msg.email.split('@')[0]}
              </div>
              <div className="text-sm break-words">
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-black/40 border-t border-[var(--border-color)] flex gap-2">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={session ? "Ask about Haaland..." : "Log in to chat..."}
          disabled={!session}
          className="input-field flex-1"
        />
        <button 
          type="submit" 
          disabled={!session || !newMessage.trim()}
          className="btn-primary"
        >
          Send
        </button>
      </form>
    </div>
  );
}
