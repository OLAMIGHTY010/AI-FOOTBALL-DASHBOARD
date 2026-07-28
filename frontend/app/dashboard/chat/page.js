"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function GlobalChatPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [session, setSession] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Fetch initial messages
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
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
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (data) setMessages(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !session) return;

    const { error } = await supabase
      .from('messages')
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
      alert("Failed to send message. Make sure the table exists!");
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto h-[80vh] flex flex-col">
      <div className="mb-4 border-b border-[var(--border-color)] pb-4">
        <h1 className="text-3xl font-bold mb-2">💬 Global Chat Lobby</h1>
        <p className="text-[var(--text-secondary)]">Discuss tactics, matches, and transfer market steals in real-time.</p>
      </div>

      <div className="flex-1 glass-card overflow-y-auto mb-4 p-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] py-10 italic">
            No messages yet. Be the first to say hello!
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-3 rounded-lg max-w-[80%] ${msg.user_id === session?.user?.id ? 'bg-[var(--accent-primary)] text-black self-end' : 'bg-gray-800 text-white self-start'}`}
            >
              <div className="text-xs font-bold mb-1 opacity-70">
                {msg.email.split('@')[0]}
              </div>
              <div className="break-words">
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={session ? "Type a message..." : "Log in to chat..."}
          disabled={!session}
          className="input-field flex-1"
        />
        <button 
          type="submit" 
          disabled={!session || !newMessage.trim()}
          className="btn-primary px-8"
        >
          Send
        </button>
      </form>
    </div>
  );
}
