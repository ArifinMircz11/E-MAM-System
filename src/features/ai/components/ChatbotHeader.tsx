import React from 'react';
import { Bot, RefreshCcw, Minimize2, Maximize2, X } from 'lucide-react';

interface ChatbotHeaderProps {
  onReset: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
  onClose: () => void;
}

export const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({
  onReset,
  onMaximize,
  isMaximized,
  onClose,
}) => (
  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-600 text-white">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
        <Bot className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-tight">e-Mam System AI Assistant</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-white/70 uppercase">Online & Smart</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1">
      <button
        onClick={onReset}
        className="p-2 hover:bg-white/10 rounded-full transition-colors"
        title="Reset Chat"
      >
        <RefreshCcw className="w-4 h-4" />
      </button>
      <button onClick={onMaximize} className="p-2 hover:bg-white/10 rounded-full transition-colors">
        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
      <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);
