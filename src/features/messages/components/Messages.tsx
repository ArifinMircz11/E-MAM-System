import { useAuthStore } from '@/stores/authStore';
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getClasses } from '@/services/classService';
import { teacherService } from '@/services/teacherService';
import { MessageSquareIcon } from '@/shared/Icons';
import { UserRole } from '@/types';
import MessagesHeader from './MessagesHeader';
import ChatList from './ChatList';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import type { AppUser, Chat, MessagesProps } from './types';
import { useMessages } from '@/features/messages/hooks/useMessages';
import { useConversation } from '@/features/messages/hooks/useConversation';
import { MessagingService } from '@/features/messages/services/MessagingService';

const Messages: React.FC<MessagesProps> = ({ onBack, userRole, onChatSelect, onOpenSidebar }) => {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || 'default';
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<any | null>(null);
  const [syncMode, setSyncMode] = useState<'manual' | 'polling' | 'realtime'>(
    () => (localStorage.getItem('EMAM_CHAT_SYNC_MODE') as any) || 'polling',
  );
  const [msgToDelete, setMsgToDelete] = useState<{ id: string; isLast: boolean } | null>(null);

  const {
    chats,
    isLoading: isChatsLoading,
    error: chatsError,
    myIdUnik,
    refreshConversations,
  } = useMessages(tenantId);
  const {
    messages,
    sendMessage,
    deleteMessage,
    clearChat,
    isLoading: isMsgsLoading,
    refreshMessages,
  } = useConversation(selectedChat?.id || null, tenantId, myIdUnik);

  // Search users
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetClass, setTargetClass] = useState('10 A');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Guru' | 'Siswa' | 'Staf' | 'Kelas'>('All');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [recipientStatus, setRecipientStatus] = useState<{ status: string; lastSeen?: any } | null>(
    null,
  );

  useEffect(() => {
    if (user?.teachersId) {
      teacherService
        .getTeacherProfile(user.teachersId, tenantId)
        .then((tProfile) => {
          if (tProfile) setTeacherProfile(tProfile);
        })
        .catch((e) => console.warn('Teacher profile lookup failed:', e));
    }
  }, [user, tenantId]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const isStaffRole = [
          UserRole.ADMIN,
          UserRole.DEVELOPER,
          UserRole.KEPALA_MADRASAH,
          UserRole.WAKAMAD,
          UserRole.KEPALA_TU,
          UserRole.GURU,
          UserRole.GURU_BK,
          UserRole.WALI_KELAS,
          UserRole.STAF,
          UserRole.GTK,
          UserRole.HUMAS,
          UserRole.KURIKULUM,
          UserRole.PIKET,
          UserRole.KESISWAAN,
        ].includes(userRole as UserRole);

        if (isStaffRole) {
          const classData = await getClasses();
          const uniqueClasses = classData.map((d) => d.name).sort() as string[];
          setClasses(['Semua Rombel (Beban 10 A)', ...uniqueClasses]);
        }
      } catch (e) {
        console.warn('Failed fetching classes:', e);
      }
    };
    fetchClasses();
  }, [userRole]);

  useEffect(() => {
    if (teacherProfile?.rombel) {
      const rombel = teacherProfile.rombel;
      const assignedClass = rombel === 'semua rombel' ? '10 A' : rombel;
      setTargetClass(assignedClass);
    }
  }, [teacherProfile]);

  useEffect(() => {
    if (!searchQuery && !isSearching) return;
    const search = async () => {
      setIsLoadingUsers(true);
      try {
        const results = await MessagingService.searchUsers(
          searchQuery,
          tenantId,
          roleFilter,
          targetClass,
        );
        setAllUsers(results as any);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    const timer = setTimeout(search, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, tenantId, roleFilter, targetClass, isSearching]);

  useEffect(() => {
    if (onChatSelect) onChatSelect(selectedChat);
  }, [selectedChat, onChatSelect]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) +
          ' ' +
          date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusDisplay = (userStatus: any) => {
    if (!userStatus) return { text: 'Offline', color: 'bg-slate-400' };
    if (userStatus.status === 'online')
      return {
        text: 'Online Sekarang',
        color: 'bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20',
      };
    return { text: 'Offline', color: 'bg-slate-400' };
  };

  const startChatWith = async (otherUser: AppUser) => {
    try {
      const isGroup = otherUser.role === 'KELAS';
      const chatId = isGroup ? otherUser.idUnik : [myIdUnik, otherUser.idUnik].sort().join('_');
      const chatData: any = {
        id: chatId,
        participants: [myIdUnik!, otherUser.idUnik],
        isGroup,
        participantDetails: {
          [myIdUnik!]: {
            displayName: user?.displayName || 'Me',
            role: user?.role || 'user',
            authUid: useAuthStore.getState().user?.id,
          },
          [otherUser.idUnik]: {
            displayName: otherUser.displayName,
            role: otherUser.role,
            authUid: otherUser.uid || '',
            photoURL: otherUser.photoURL,
          },
        },
        lastMessage: '',
        lastMessageTimestamp: Date.now(),
        updatedAt: Date.now(),
        tenantId,
      };
      setSelectedChat(chatData);
      setIsSearching(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Start chat error:', err);
    }
  };

  const handleClearChat = () => {
    if (selectedChat && window.confirm('Clear all messages?')) {
      clearChat();
    }
  };

  const handleDeleteChat = () => {
    if (selectedChat && window.confirm('Delete this conversation?')) {
      // Logically we'd call service here
      MessagingService.deleteMessage('', selectedChat.id, tenantId); // Placeholder for delete chat logic
      setSelectedChat(null);
      refreshConversations();
    }
  };

  const confirmDeleteMessage = async () => {
    if (msgToDelete && selectedChat) {
      await deleteMessage(msgToDelete.id);
      setMsgToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] relative">
      <MessagesHeader
        selectedChat={selectedChat}
        myIdUnik={myIdUnik}
        onBack={onBack}
        setSelectedChat={setSelectedChat}
        recipientStatus={recipientStatus}
        getStatusDisplay={getStatusDisplay}
        handleClearChat={handleClearChat}
        handleDeleteChat={handleDeleteChat}
      />

      <div className="flex-grow overflow-hidden flex relative">
        <ChatList
          isSearching={isSearching}
          isLoadingUsers={isLoadingUsers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setIsSearching={setIsSearching}
          targetClass={targetClass}
          setTargetClass={setTargetClass}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          classes={classes}
          allUsers={allUsers}
          chats={chats}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          startChatWith={startChatWith}
          myIdUnik={myIdUnik}
          formatTime={formatTime}
        />

        {selectedChat && (
          <div className="flex-grow flex flex-col w-full bg-slate-50 dark:bg-[#020617] relative">
            <div className="bg-white dark:bg-[#0c1425] border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs font-bold gap-4 shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Sync: {syncMode.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => refreshMessages()}
                className="p-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase"
              >
                Refresh
              </button>
            </div>

            <MessageList
              messages={messages}
              myIdUnik={myIdUnik}
              formatTime={formatTime}
              handleDeleteMessage={(id, isLast) => setMsgToDelete({ id, isLast })}
              messagesEndRef={messagesEndRef}
            />

            <MessageComposer onSend={(text) => sendMessage(text)} isLoading={isMsgsLoading} />
          </div>
        )}

        {!selectedChat && window.innerWidth >= 768 && (
          <div className="hidden md:flex flex-grow flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
            <MessageSquareIcon className="w-12 h-12 text-indigo-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
              Pilih Percakapan
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide text-center max-w-xs">
              Silakan pilih percakapan di sebelah kiri atau cari teman baru untuk memulai obrolan.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {msgToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 w-full max-w-xs shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase">
                Hapus Pesan?
              </h3>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setMsgToDelete(null)}
                  className="py-3 px-4 rounded-xl text-[10px] font-bold uppercase text-slate-500"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteMessage}
                  className="py-3 px-4 rounded-xl text-[10px] font-bold uppercase bg-rose-600 text-white"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
