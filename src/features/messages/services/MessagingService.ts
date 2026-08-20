/**
 * @license
 * e-Mam System - Messaging Service
 * LAYER: SERVICE LAYER (Architecture Compliant)
 */

import { MessageRepository } from '@/repositories/legacyMessageRepository';
import { ChatSyncService } from '@/services/realtime/chatSyncService';
import { logAudit } from '@/services/auditLogService';

export const MessagingService = {
  /**
   * Send message with offline-first support
   */
  async sendMessage(chatId: string, senderId: string, text: string, tenantId: string) {
    if (!tenantId) throw new Error('Tenant ID required');

    const { getSecurityContext } = await import('@/core/security/contextHelper');
    const secCtx = getSecurityContext();
    if (secCtx.role === 'SISWA' && secCtx.referenceId && secCtx.referenceId !== senderId) {
      console.error(`[Security] Access Denied: User ${secCtx.referenceId} attempted to send message as ${senderId}`);
      throw new Error('Akses Ditolak: Tidak dapat mengirim pesan sebagai pengguna lain.');
    }

    try {
      const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const messageData = {
        id: messageId,
        conversationId: chatId,
        senderId,
        text,
        createdAt: Date.now(),
        status: 'pending',
        tenantId,
      };

      // 1. Save to Repository (Local Dexie)
      await MessageRepository.saveMessage(messageData);

      // 2. Update conversation locally
      await MessageRepository.saveConversation({
        id: chatId,
        lastMessage: text,
        lastMessageTimestamp: Date.now(),
        updatedAt: Date.now(),
        tenantId,
      });

      // 3. Enqueue Sync
      await MessageRepository.addToQueue('SEND_MESSAGE', messageData);

      // 4. Trigger AI Response if chatting with AI_AGENT
      if (chatId.includes('AI_AGENT')) {
        // Background trigger
        this.handleAiResponse(chatId, text, tenantId);
      }

      return messageData;
    } catch (error) {
      console.error('[MessagingService] Error sending message:', error);
      throw error;
    }
  },

  /**
   * Handle AI Response
   */
  async handleAiResponse(chatId: string, userText: string, tenantId: string) {
    try {
      const { ChatAiService } = await import('./ChatAiService');

      // Get last few messages for context
      const localHistory = await MessageRepository.getMessages(chatId);
      const history = localHistory.slice(-10).map((m) => ({
        role: m.senderId === 'AI_AGENT' ? 'assistant' : 'user',
        content: m.text,
      }));

      const aiReply = await ChatAiService.getAiResponse(userText, history, { tenantId });

      const aiMessageId = `MSG_AI_${Date.now()}`;
      const aiMessageData = {
        id: aiMessageId,
        conversationId: chatId,
        senderId: 'AI_AGENT',
        text: aiReply,
        createdAt: Date.now(),
        status: 'sent',
        tenantId,
      };

      await MessageRepository.saveMessage(aiMessageData);
      await MessageRepository.saveConversation({
        id: chatId,
        lastMessage: aiReply,
        lastMessageTimestamp: Date.now(),
        updatedAt: Date.now(),
        tenantId,
      });

      await MessageRepository.addToQueue('SEND_MESSAGE', aiMessageData);
    } catch (error) {
      console.error('[MessagingService] handleAiResponse error:', error);
    }
  },

  /**
   * Get conversations with cache-first strategy
   */
  async getConversations(myIdUnik: string, tenantId: string, forceRefresh = false) {
    if (!tenantId) throw new Error('Tenant ID required');

    // Security check: Only allow fetching own conversations
    const { getSecurityContext } = await import('@/core/security/contextHelper');
    const secCtx = getSecurityContext();
    if (secCtx.role === 'SISWA' && secCtx.referenceId && secCtx.referenceId !== myIdUnik) {
      console.error(`[Security] Access Denied: User ${secCtx.referenceId} attempted to access conversations of ${myIdUnik}`);
      throw new Error('Akses Ditolak: Tidak dapat melihat percakapan pengguna lain.');
    }

    // 1. Repository (Local)
    let conversations: any[] = [];
    if (!forceRefresh) {
      const allConvs = await MessageRepository.getConversations(tenantId);
      conversations = allConvs.filter(c => c.participants && c.participants.includes(myIdUnik));
    }

    // 2. Repository (Firestore) if needed
    if (conversations.length === 0 || forceRefresh) {
      try {
        const remoteData = await ChatSyncService.fetchConversations(tenantId, myIdUnik);
        if (remoteData.length > 0) {
          await MessageRepository.saveConversation(remoteData);
          conversations = remoteData;
        }
      } catch (error) {
        console.error('[MessagingService] syncConversations error:', error);
        if (conversations.length === 0) {
          const allConvs = await MessageRepository.getConversations(tenantId);
          conversations = allConvs.filter(c => c.participants && c.participants.includes(myIdUnik));
        }
      }
    }

    // 3. Enhance with AI Details if present
    return conversations.map((chat) => {
      if (chat.participants.includes('AI_AGENT')) {
        return {
          ...chat,
          participantDetails: {
            ...chat.participantDetails,
            AI_AGENT: {
              displayName: 'Asisten AI (ChatGPT)',
              role: 'AI',
              photoURL: 'https://cdn-icons-png.flaticon.com/512/12222/12222560.png',
            },
          },
        };
      }
      return chat;
    });
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(chatId: string, tenantId: string, forceRefresh = false) {
    if (!tenantId) throw new Error('Tenant ID required');

    // Security check: Only allow fetching messages if participant
    const { getSecurityContext } = await import('@/core/security/contextHelper');
    const secCtx = getSecurityContext();
    if (secCtx.role === 'SISWA' && secCtx.referenceId) {
      const conv = await MessageRepository.getConversation(chatId);
      if (conv && conv.participants && !conv.participants.includes(secCtx.referenceId)) {
        console.error(`[Security] Access Denied: User ${secCtx.referenceId} attempted to access messages of chat ${chatId}`);
        throw new Error('Akses Ditolak: Anda bukan partisipan percakapan ini.');
      }
    }

    // 1. Local
    if (!forceRefresh) {
      const cached = await MessageRepository.getMessages(chatId);
      if (cached.length > 0) return cached;
    }

    // 2. Remote
    try {
      const data = await ChatSyncService.fetchMessages(tenantId, chatId);

      // 3. Update Local
      if (data.length > 0) {
        await MessageRepository.saveMessage(data.map((m) => ({ ...m, conversationId: chatId })));
      }

      return data;
    } catch (error) {
      console.error('[MessagingService] syncMessages error:', error);
      return await MessageRepository.getMessages(chatId);
    }
  },

  async deleteMessage(messageId: string, chatId: string, tenantId: string) {
    if (!tenantId) throw new Error('Tenant ID required');

    const { getSecurityContext } = await import('@/core/security/contextHelper');
    const secCtx = getSecurityContext();
    if (secCtx.role === 'SISWA' && secCtx.referenceId) {
      const conv = await MessageRepository.getConversation(chatId);
      if (conv && conv.participants && !conv.participants.includes(secCtx.referenceId)) {
        console.error(`[Security] Access Denied: User ${secCtx.referenceId} attempted to delete message in chat ${chatId}`);
        throw new Error('Akses Ditolak: Anda bukan partisipan percakapan ini.');
      }
    }

    try {
      await MessageRepository.deleteMessageLocal(messageId);
      await MessageRepository.addToQueue('DELETE_MESSAGE', { messageId, chatId, tenantId });
      await logAudit({
        action: 'MESSAGE_DELETE',
        category: 'USER',
        details: `Deleted message ${messageId}`,
        tenantId,
      });
    } catch (error) {
      console.error('[MessagingService] Error deleting message:', error);
      throw error;
    }
  },

  async searchUsers(
    queryText: string,
    tenantId: string,
    roleFilter?: string,
    targetClass?: string,
  ) {
    if (!tenantId) throw new Error('Tenant ID required');
    try {
      const { studentRepository } = await import('@/features/students/repositories/StudentRepository');
      const { teacherRepository } = await import('@/repositories/teacherRepository');
      const { userRepository } = await import('@/repositories/userRepository');
      const { classRepository } = await import('@/repositories/classRepository');
      const { getSecurityContext } = await import('@/core/security/contextHelper');
      const context = getSecurityContext();

      const results: any[] = [];
      const queryLower = queryText.toLowerCase();

      // 1. Search Students
      const students = await studentRepository.fetchByTenant(tenantId);
      const matchingStudents = students
        .filter(
          (s) =>
            s.namaLengkap?.toLowerCase().includes(queryLower) ||
            s.idUnik?.toLowerCase().includes(queryLower),
        )
        .map((s) => ({
          idUnik: s.idUnik,
          displayName: s.namaLengkap,
          role: 'SISWA',
          photoURL: s.photoURL,
          className: s.className,
        }));
      results.push(...matchingStudents);

      // 2. Search Teachers
      const teachers = await teacherRepository.fetchByTenant(context, tenantId);
      const matchingTeachers = teachers
        .filter(
          (t) =>
            t.namaLengkap?.toLowerCase().includes(queryLower) ||
            t.idUnik?.toLowerCase().includes(queryLower),
        )
        .map((t) => ({
          idUnik: t.idUnik || t.id,
          displayName: t.namaLengkap,
          role: 'GURU',
          photoURL: t.photoURL,
        }));
      results.push(...matchingTeachers);

      // 3. Search Users (Admin, BK, Staff, Developer)
      const users = await userRepository.fetchByTenant(tenantId);
      const matchingUsers = (users as any[])
        .filter(
          (u) =>
            u.displayName?.toLowerCase().includes(queryLower) ||
            u.email?.toLowerCase().includes(queryLower) ||
            u.profile?.displayName?.toLowerCase().includes(queryLower) ||
            u.profile?.email?.toLowerCase().includes(queryLower),
        )
        .filter((u) =>
          ['ADMIN', 'DEVELOPER', 'BK', 'STAF', 'TATA_USAHA', 'KEPALA_MADRASAH'].includes(u.role),
        )
        .map((u) => ({
          idUnik: u.uid || u.id,
          displayName: u.displayName || u.profile?.displayName || u.email || u.profile?.email,
          role: u.role,
          photoURL: u.photoURL || u.profile?.photoURL,
        }));
      results.push(...matchingUsers);

      // 4. Search Classes (Groups)
      const classes = await classRepository.fetchByTenant(context, tenantId);
      const matchingClasses = classes
        .filter((c) => c.name?.toLowerCase().includes(queryLower))
        .map((c) => ({
          idUnik: `CLASS_${c.id}`, // specific prefix for groups
          displayName: `Kelas ${c.name}`,
          role: 'KELAS',
          photoURL: 'https://cdn-icons-png.flaticon.com/512/1000/1000455.png',
        }));
      results.push(...matchingClasses);

      // Add AI Agent to results if query matches
      if (!queryText || 'asisten ai'.includes(queryLower) || 'chatgpt'.includes(queryLower)) {
        results.unshift({
          idUnik: 'AI_AGENT',
          displayName: 'Asisten AI (ChatGPT)',
          role: 'AI',
          photoURL: 'https://cdn-icons-png.flaticon.com/512/12222/12222560.png',
        });
      }

      // Apply Filters
      let filteredResults = results;

      if (roleFilter && roleFilter !== 'All') {
        const lowerRole = roleFilter.toLowerCase();
        if (lowerRole === 'guru')
          filteredResults = filteredResults.filter((r) => r.role === 'GURU');
        else if (lowerRole === 'siswa')
          filteredResults = filteredResults.filter((r) => r.role === 'SISWA');
        else if (lowerRole === 'staf')
          filteredResults = filteredResults.filter(
            (r) => !['GURU', 'SISWA', 'KELAS', 'AI'].includes(r.role),
          );
        else if (lowerRole === 'kelas')
          filteredResults = filteredResults.filter((r) => r.role === 'KELAS');
      }

      if (targetClass && targetClass !== 'Semua Rombel (Beban 10 A)') {
        filteredResults = filteredResults.filter((r) => {
          if (r.role === 'SISWA') return r.className === targetClass;
          if (r.role === 'KELAS') return r.displayName === `Kelas ${targetClass}`;
          return true;
        });
      }

      return filteredResults;
    } catch (error) {
      console.error('[MessagingService] Error searching users:', error);
      return [];
    }
  },

  async clearChat(chatId: string, tenantId: string) {
    if (!tenantId) throw new Error('Tenant ID required');

    const { getSecurityContext } = await import('@/core/security/contextHelper');
    const secCtx = getSecurityContext();
    if (secCtx.role === 'SISWA' && secCtx.referenceId) {
      const conv = await MessageRepository.getConversation(chatId);
      if (conv && conv.participants && !conv.participants.includes(secCtx.referenceId)) {
        console.error(`[Security] Access Denied: User ${secCtx.referenceId} attempted to clear chat ${chatId}`);
        throw new Error('Akses Ditolak: Anda bukan partisipan percakapan ini.');
      }
    }

    try {
      await MessageRepository.clearMessagesLocal(chatId);
      await MessageRepository.addToQueue('CLEAR_CHAT', { chatId, tenantId });
      await logAudit({
        action: 'CHAT_CLEAR',
        category: 'USER',
        details: `Cleared chat ${chatId}`,
        tenantId,
      });
    } catch (error) {
      console.error('[MessagingService] Error clearing chat:', error);
      throw error;
    }
  },
};
