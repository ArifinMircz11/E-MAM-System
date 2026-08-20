import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAiAgent } from '@/hooks/useAiAgent';
import { Bot, Send, X, RotateCcw, BrainCircuit } from 'lucide-react';

interface AiAgentPanelProps {
  onClose: () => void;
  context?: any;
}

export const AiAgentPanel: React.FC<AiAgentPanelProps> = ({ onClose, context }) => {
  const { messages, isLoading, sendMessage, resetChat } = useAiAgent(context);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[410px] h-[520px] max-h-[75vh] bg-white dark:bg-[#0B1121] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-[9999]"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <BrainCircuit size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">Smart AI Agent</h3>
            <p className="text-[11px] text-white/80">Powered by OpenAI GPT-4</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={resetChat}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Reset Chat"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/30 rounded-full transition-colors flex items-center justify-center"
            title="Tutup Obrolan"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot size={32} />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Halo! Saya Smart Agent.
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Saya asisten AI canggih yang dapat membantu menganalisis data, membuat laporan, atau
                menjawab pertanyaan teknis Anda.
              </p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanya sesuatu ke Agent..."
            className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-600 dark:text-white"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-3 uppercase tracking-wide font-medium">
          AI Agent can make mistakes. Verify important info.
        </p>
      </div>
    </motion.div>
  );
};

export default AiAgentPanel;
