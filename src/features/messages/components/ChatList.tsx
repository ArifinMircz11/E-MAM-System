import React from 'react';
import { Search, Loader2, MessageSquareIcon, UserIcon } from '@/shared/Icons';
import type { Chat, AppUser } from './types';

interface ChatListProps {
  isSearching: boolean;
  isLoadingUsers: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  setIsSearching: (val: boolean) => void;
  targetClass: string;
  setTargetClass: (val: string) => void;
  roleFilter: 'All' | 'Guru' | 'Siswa' | 'Staf' | 'Kelas';
  setRoleFilter: (val: 'All' | 'Guru' | 'Siswa' | 'Staf' | 'Kelas') => void;
  classes: string[];
  allUsers: AppUser[];
  chats: Chat[];
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat) => void;
  startChatWith: (user: AppUser) => void;
  myIdUnik: string | null;
  formatTime: (ts: any) => string;
}

const ChatList: React.FC<ChatListProps> = ({
  isSearching,
  isLoadingUsers,
  searchQuery,
  setSearchQuery,
  setIsSearching,
  targetClass,
  setTargetClass,
  roleFilter,
  setRoleFilter,
  classes,
  allUsers,
  chats,
  selectedChat,
  setSelectedChat,
  startChatWith,
  myIdUnik,
  formatTime,
}) => {
  return (
    <div
      className={`w-full ${selectedChat ? 'hidden md:flex md:w-80 lg:w-96' : 'flex'} flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1121]`}
    >
      {/* Search Bar & Filters */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pengguna..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearching(
                e.target.value.length > 0 || targetClass !== 'Semua Rombel (Beban 10 A)',
              );
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['All', 'Guru', 'Siswa', 'Staf', 'Kelas'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r as any)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                roleFilter === r
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {classes.map((c, i) => (
            <button
              key={`${c}-${i}`}
              onClick={() => {
                setTargetClass(c);
                setIsSearching(searchQuery.length > 0 || c !== 'Semua Rombel (Beban 10 A)');
              }}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                targetClass === c
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* List Body */}
      <div className="flex-grow overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
        {isSearching ? (
          <div className="space-y-1">
            <p className="px-3 md:px-4 py-2 text-[10px] font-bold text-slate-400 tracking-wide">
              HASIL PENCARIAN{' '}
              {targetClass &&
                targetClass !== 'Semua Rombel (Beban 10 A)' &&
                `• ${targetClass.toUpperCase()}`}
            </p>
            {isLoadingUsers ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Mencari...
                </span>
              </div>
            ) : allUsers.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-slate-500 font-medium">Tidak ada pengguna ditemukan.</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Coba kata kunci lain atau filter kelas berbeda.
                </p>
              </div>
            ) : (
              allUsers.map((u) => (
                <button
                  key={u.idUnik}
                  onClick={() => startChatWith(u)}
                  className="w-full flex items-center gap-3 md:gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border-2 border-white dark:border-[#0B1121] shadow-sm">
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt={u.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm md:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {u.displayName} ({u.idUnik})
                    </p>
                    <p className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate capitalize">
                      {u.role}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {chats.length === 0 ? (
              <div className="p-8 text-center mt-4">
                <MessageSquareIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400">
                  Belum ada percakapan
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Gunakan pencarian untuk memulai obrolan dengan teman atau guru.
                </p>
              </div>
            ) : (
              chats.map((chat) => {
                const otherId = chat.participants.find((id) => id !== myIdUnik) || '';
                const otherDetails = chat.participantDetails
                  ? chat.participantDetails[otherId] || { displayName: 'Unknown' }
                  : { displayName: 'Unknown' };
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full flex items-center gap-3 md:gap-4 p-3 rounded-2xl transition-colors text-left ${selectedChat?.id === chat.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border-2 border-white dark:border-[#0B1121] shadow-sm">
                      {'photoURL' in otherDetails && otherDetails.photoURL ? (
                        <img
                          src={otherDetails.photoURL as string}
                          alt={otherDetails.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-6 h-6 md:w-7 md:h-7 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-2">
                          {otherDetails.displayName}
                        </p>
                        <span className="text-[8px] font-bold  text-slate-400 shrink-0 uppercase">
                          {formatTime(chat.lastMessageTimestamp)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p
                          className={`text-xs truncate ${chat.participantDetails && chat.participantDetails[myIdUnik!]?.unreadCount ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}
                        >
                          {chat.lastMessage || 'Mulai percakapan...'}
                        </p>
                        {chat.participantDetails &&
                        chat.participantDetails[myIdUnik!]?.unreadCount ? (
                          <span className="ml-2 w-5 h-5 bg-green-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-lg shadow-green-500/30 shrink-0">
                            {chat.participantDetails[myIdUnik!].unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
