/**
 * @license
 * e-Mam System - Chat Sync Service
 * LAYER: SERVICE/REALTIME (Allowed to import Firestore as per Rule 5)
 */

import { firestoreGateway as dbGateway } from '../gateways/FirestoreGateway';
import { db as firestore } from '@/services/firebase';
import { getDocsSafe } from '@/services/sync/firestoreHelpers';

const CHAT_COL = 'chats';

export const ChatSyncService = {
  /**
   * Fetch conversations from Firestore for a user in a specific tenant.
   */
  async fetchConversations(tenantId: string, myIdUnik: string): Promise<any[]> {
    const q = dbGateway.query(
      dbGateway.collection(firestore, CHAT_COL),
      dbGateway.where('participants', 'array-contains', myIdUnik),
      dbGateway.where('tenantId', '==', tenantId),
    );
    const results = await getDocsSafe<any>(q);
    return results || [];
  },

  /**
   * Fetch messages for a specific conversation in a tenant.
   */
  async fetchMessages(tenantId: string, conversationId: string, max = 100): Promise<any[]> {
    const q = dbGateway.query(
      dbGateway.collection(firestore, CHAT_COL, conversationId, 'messages'),
      dbGateway.where('tenantId', '==', tenantId),
      dbGateway.orderBy('createdAt', 'asc'),
      dbGateway.limit(max),
    );
    const results = await getDocsSafe<any>(q);
    return results || [];
  },
};
