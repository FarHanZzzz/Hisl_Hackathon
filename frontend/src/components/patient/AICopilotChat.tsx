import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

export function AICopilotChat({ reportId, initialOpen = false }: { reportId: string, initialOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use a ref for session ID to persist across renders but avoid hydration mismatch if using uuid
  const sessionIdRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a simple session ID on mount
    if (!sessionIdRef.current) {
        sessionIdRef.current = Math.random().toString(36).substring(2, 9);
    }

    const handleOpenCopilot = () => setIsOpen(true);
    window.addEventListener('open-ai-copilot', handleOpenCopilot);
    return () => window.removeEventListener('open-ai-copilot', handleOpenCopilot);
  }, []);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'msg-0',
          sender: 'ai',
          text: "Hi, I'm the Pedi-Growth AI. I noticed some patterns in your child's walking analysis. Do you have any questions while we connect you with a specialist?",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userMessage
    }]);
    
    setIsLoading(true);

    try {
      const response = await axios.post('/api/v1/copilot/chat', {
        report_id: reportId,
        message: userMessage,
        session_id: sessionIdRef.current,
        lang: document.documentElement.lang || 'en' // Pass current lang
      });

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: response.data.response
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-err`,
        sender: 'ai',
        text: "I'm having trouble connecting right now. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center text-slate-950 hover:scale-105 active:scale-95 transition-transform z-50"
        aria-label="Open AI Copilot Chat"
      >
        <span className="material-icons text-2xl">smart_toy</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[350px] h-[500px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500/20 text-cyan-400 font-bold rounded-full flex items-center justify-center shrink-0">
            <span className="material-icons text-sm">smart_toy</span>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Pedi-Growth AI</h3>
            <p className="text-xs text-slate-400">Waiting Room Assistant</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white p-1"
        >
          <span className="material-icons">close</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl py-2 px-4 text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-cyan-500 text-slate-950 rounded-tr-sm' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 rounded-tl-sm flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-slate-900 text-white rounded-full px-4 outline-none border border-slate-700 focus:border-cyan-500/50 transition-colors placeholder-slate-500 text-sm"
        />
        <button 
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="w-10 h-10 shrink-0 bg-cyan-500 rounded-full flex items-center justify-center text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
        >
          <span className="material-icons text-sm">send</span>
        </button>
      </form>
    </div>
  );
}
