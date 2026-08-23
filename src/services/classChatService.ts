import { classChatRepository } from '@/repositories/ClassChatRepository';
import type { SecurityContext } from '@/core/security/types';
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
  createdAt?: number;
  updatedAt?: number;
  syncStatus?: string;
}

const toClassMessage = (row: {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
  syncStatus?: string;
  classId: string;
  tenantId: string;
}): ClassMessage => ({
  id: row.id,
  senderId: row.senderId,
  senderName: row.senderName || '',
  senderRole: '',
  messageText: row.text,
  timestamp: new Date(row.createdAt).toISOString(),
  classID: row.classId,
  tenantId: row.tenantId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  syncStatus: row.syncStatus,
});

export const sendMessageToClass = async (
  context: SecurityContext,
  classId: string,
  message: Omit<ClassMessage, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'syncStatus'>,
  _dateStr?: string,
): Promise<void> => {
  if (!context?.tenantId) throw new Error('tenantId required');
  if (context.tenantId === 'default' || context.tenantId === 'unknown') {
    throw new Error('valid tenantId required');
  }

  const timestamp = message.timestamp || new Date().toISOString();
  const id = generateManualId(`${context.tenantId}_${classId}_${timestamp}`);
  const createdAt = Date.now();

  await classChatRepository.save(context, {
    id,
    tenantId: context.tenantId,
    classId,
    senderId: message.senderId,
    senderName: message.senderName,
    text: message.messageText,
    createdAt,
    updatedAt: createdAt,
    syncStatus: 'pending',
  });
};

export const getClassMessages = async (
  context: SecurityContext,
  classId: string,
): Promise<ClassMessage[]> => {
  const rows = await classChatRepository.listByClass(context, classId);
  return rows.map(toClassMessage);
};

export const observeClassMessages = (
  context: SecurityContext,
  classId: string,
  onChange: (messages: ClassMessage[]) => void,
  onError?: (error: unknown) => void,
): (() => void) =>
  classChatRepository.observeByClass(
    context,
    classId,
    (rows) => onChange(rows.map(toClassMessage)),
    onError,
  );
