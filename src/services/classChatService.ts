import { useUserStore } from '@/stores/userStore';
import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { db } from './firebase';
import { generateManualId } from '../utils/firestoreHelpers';

export interface ClassMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  messageText: string;
  timestamp: string;
  classID: string;
  tenantId: string;
}

export const sendMessageToClass = async (
  classId: string,
  message: Omit<ClassMessage, 'id' | 'tenantId'>,
  dateStr: string,
): Promise<void> => {
  try {
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    // Deterministic message ID: ${tenantId}_${classId}_${timestamp}
    const manualId = generateManualId(`${tenantId}_${classId}`);
    const path = `class_chats/${classId}/messages_${dateStr}`;

    await dbGateway.setDoc(dbGateway.doc(db, path, manualId), {
      ...message,
      id: manualId,
      tenantId: tenantId,
    });
  } catch (error: any) {
    console.error('Error sending class message:', error);
    throw error;
  }
};
