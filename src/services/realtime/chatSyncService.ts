/**
 * @license
 * e-Mam System - Chat Sync Service
 * LAYER: SERVICE/REALTIME (FirestoreGateway corridor)
 */

import { firestoreGateway as dbGateway } from '../gateways/FirestoreGateway';
import { getDocsSafe } from '@/services/sync/firestoreHelpers';

const CHAT_COL = 'chats';

export const ChatSyncService = {
  async fetchConversations(tenantId: string, myIdUnik: string): Promise<any[]> {
    const q = dbGateway.query(
      dbGateway.collection(dbGateway.db, CHAT_COL),
      dbGateway.where('participants', 'array-contains', myIdUnik),
      dbGateway.where('tenantId', '==', tenantId),
    );
    return (await getDocsSafe<any>(q)) || [];
  },

  async fetchMessages(tenantId: string, conversationId: string, max = 100): Promise<any[]> {
    const q = dbGateway.query(
      dbGateway.collection(dbGateway.db, CHAT_COL, conversationId, 'messages'),
      dbGateway.where('tenantId', '==', tenantId),
      dbGateway.orderBy('createdAt', 'asc'),
      dbGateway.limit(max),
    );
    return (await getDocsSafe<any>(q)) || [];
  },
};
