import React from 'react';
import { Send } from 'lucide-react';

interface ChatbotInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: (e: React.FormEvent) => void;
}

export const ChatbotInput: React.FC<ChatbotInputProps> = ({
  input,
  setInput,
  isLoading,
  onSend,
}) => (
  <div className="p-3 bg-white dark:bg-[#0B1121] border-t border-slate-100 dark:border-slate-800">
    <form onSubmit={onSend} className="relative">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Tanya poin, jadwal, atau bantuan..."
        className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-3 pl-4 pr-12 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-white transition-all shadow-inner"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
    <div className="flex flex-col gap-2 mt-2">
      <a
        href="https://wa.me/6285194030064"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[9px] text-center text-indigo-600 font-bold uppercase tracking-wide hover:underline"
      >
        💬 Hubungi Admin via WhatsApp
      </a>
      <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-wide">
        Powered by Gemini AI • Grounded in e-Mam System DB
      </p>
    </div>
  </div>
);
