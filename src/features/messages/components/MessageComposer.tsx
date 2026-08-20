import React, { useState } from 'react';
import { SendIcon, PlusIcon } from '@/shared/Icons';

interface MessageComposerProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
}

const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <div className="p-3 bg-white dark:bg-[#0B1121] border-t border-slate-200 dark:border-slate-800 shrink-0">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto flex items-end gap-2">
        <div className="flex-grow relative group">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Tulis pesan..."
            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/30 dark:focus:border-indigo-500/20 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all resize-none min-h-[48px] max-h-32 scrollbar-hide"
            rows={1}
          />
          <button
            type="button"
            className="absolute right-3 bottom-3 p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 shrink-0"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageComposer;
