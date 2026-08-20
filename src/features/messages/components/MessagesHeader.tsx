import React from 'react';
import { ChevronLeft, MessageSquareIcon, TrashIcon } from '@/shared/Icons';

interface MessagesHeaderProps {
  selectedChat: any;
  myIdUnik: string | null;
  onBack: () => void;
  setSelectedChat: (chat: any) => void;
  recipientStatus: any;
  getStatusDisplay: (status: any) => { text: string; color: string };
  handleClearChat: () => void;
  handleDeleteChat: () => void;
}

const MessagesHeader: React.FC<MessagesHeaderProps> = ({
  selectedChat,
  myIdUnik,
  onBack,
  setSelectedChat,
  recipientStatus,
  getStatusDisplay,
  handleClearChat,
  handleDeleteChat,
}) => {
  return (
    <header className="flex-shrink-0 px-4 py-4 bg-slate-900/80 backdrop-blur-md text-white font-bold flex items-center z-10 sticky top-0 border-b border-white/5 shadow-2xl shadow-black/20">
      <button
        onClick={selectedChat ? () => setSelectedChat(null) : onBack}
        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-indigo-600 transition-all mr-3 shrink-0 border border-white/10 active:scale-90"
        title="Kembali"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="min-w-0 flex-grow">
        <h1 className="text-sm md:text-md font-bold truncate flex flex-col justify-center">
          <div className="flex items-center gap-2 uppercase tracking-tight">
            <MessageSquareIcon className="w-4 h-4 shrink-0 text-indigo-400" />
            <span className="truncate">
              {selectedChat
                ? Object.keys(selectedChat.participantDetails || {})
                    .map((id) =>
                      id !== myIdUnik && selectedChat.participantDetails
                        ? selectedChat.participantDetails[id]?.displayName
                        : null,
                    )
                    .filter(Boolean)
                    .join(', ')
                : 'Layanan Konsultasi digital'}
            </span>
          </div>
          {selectedChat && recipientStatus && (
            <div className="flex items-center gap-1.5 ml-6">
              <span
                className={`w-1.5 h-1.5 rounded-full ${getStatusDisplay(recipientStatus).color}`}
              ></span>
              <span className="text-[8px] font-bold uppercase tracking-[0.1em] opacity-70">
                {getStatusDisplay(recipientStatus).text}
              </span>
            </div>
          )}
        </h1>
      </div>
      {selectedChat && (
        <div className="flex gap-2">
          <button
            onClick={handleClearChat}
            className="p-2.5 bg-white/5 hover:bg-indigo-500/20 rounded-xl transition-all border border-white/5"
            title="Bersihkan Obrolan"
          >
            <TrashIcon className="w-4 h-4 opacity-50" />
          </button>
          <button
            onClick={handleDeleteChat}
            className="p-2.5 bg-rose-500/10 hover:bg-rose-500 rounded-xl transition-all border border-rose-500/20"
            title="Hapus Obrolan"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};

export default MessagesHeader;
