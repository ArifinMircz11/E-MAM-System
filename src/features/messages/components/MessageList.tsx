import React from 'react';
import { motion } from 'framer-motion';
import { TrashIcon } from '@/shared/Icons';
import type { Message } from './types';

interface MessageListProps {
  messages: Message[];
  myIdUnik: string | null;
  formatTime: (ts: any) => string;
  handleDeleteMessage: (id: string, isLast: boolean) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  myIdUnik,
  formatTime,
  handleDeleteMessage,
  messagesEndRef,
}) => {
  return (
    <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
      {messages.map((msg, idx) => {
        const isMe = msg.senderId === myIdUnik;
        return (
          <motion.div
            initial={{ opacity: 0, x: isMe ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={msg.id}
            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}
            >
              <div
                className={`px-4 py-2 rounded-2xl text-[13px] md:text-[14px] font-medium shadow-sm break-words ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] font-bold tracking-wide text-slate-400 uppercase opacity-60">
                  {formatTime(msg.createdAt)} {isMe && msg.status === 'read' && '• Dilihat'}
                </span>
                {isMe && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id, idx === messages.length - 1)}
                    className="p-1 hover:text-rose-500 text-slate-300 transition-colors"
                    title="Hapus pesan"
                  >
                    <TrashIcon className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
      <div ref={messagesEndRef as any} />
    </div>
  );
};

export default MessageList;
