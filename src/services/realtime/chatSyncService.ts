export const ChatSyncService = {
  fetchConversations: async (tenantId: string, myIdUnik: string): Promise<any[]> => {
    return [
      {
        id: 'AI_AGENT',
        tenantId,
        participants: [myIdUnik, 'AI_AGENT'],
        lastMessage: 'Halo! Ada yang bisa saya bantu terkait tugas sekolah?',
        lastMessageTimestamp: Date.now(),
        updatedAt: Date.now(),
      }
    ];
  },

  fetchMessages: async (tenantId: string, chatId: string): Promise<any[]> => {
    return [
      {
        id: `MSG_INIT_${Date.now()}`,
        conversationId: chatId,
        senderId: 'AI_AGENT',
        text: 'Halo! Saya asisten AI Anda di e-Mam System. Silakan ketik pesan apa saja untuk memulai obrolan!',
        createdAt: Date.now() - 60000,
        status: 'sent',
        tenantId,
      }
    ];
  },
};

export const chatSyncService = {
  sync: async () => {},
  ...ChatSyncService,
};
