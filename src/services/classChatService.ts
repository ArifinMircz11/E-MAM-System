import { db } from '@/database/db';
import { liveQuery } from 'dexie';

export interface ClassMessage {
  id: string;
  classId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  text: string;
  content?: string;
  createdAt: number;
  timestamp?: any;
}

const MOCK_MESSAGES: ClassMessage[] = [
  {
    id: 'msg-1',
    classId: 'cls-7a',
    senderId: 'tch-1',
    senderName: 'Drs. H. Muhammad Arifin, M.Pd.',
    senderRole: 'guru',
    text: "Assalamu'alaikum anak-anak, silakan pelajari materi bab 3 ya.",
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'msg-2',
    classId: 'cls-7a',
    senderId: 'std-2',
    senderName: 'Siti Nurhaliza',
    senderRole: 'siswa',
    text: 'Baik Pak, terima kasih informasinya.',
    createdAt: Date.now() - 3600000,
  }
];

export const observeClassMessages = (
  context: any,
  classId: string,
  callback: (messages: ClassMessage[]) => void,
  errorCallback?: (error: any) => void
) => {
  const seedAndQuery = async () => {
    try {
      if (db.table('messages')) {
        const count = await db.table('messages').where('classId').equals(classId).count();
        if (count === 0) {
          const classMocks = MOCK_MESSAGES.filter(m => m.classId === classId);
          for (const m of classMocks) {
            await db.table('messages').put(m);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to seed chat messages', e);
    }
  };
  
  seedAndQuery();

  try {
    const observable = liveQuery(async () => {
      if (!db.table('messages')) {
        return MOCK_MESSAGES.filter(m => m.classId === classId);
      }
      const list = await db.table('messages')
        .where('classId')
        .equals(classId)
        .sortBy('createdAt');
      return list.length > 0 ? list : MOCK_MESSAGES.filter(m => m.classId === classId);
    });

    const subscription = observable.subscribe({
      next: (messages) => {
        callback(messages);
      },
      error: (err) => {
        if (errorCallback) errorCallback(err);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  } catch (err) {
    if (errorCallback) errorCallback(err);
    return () => {};
  }
};

export const sendMessage = async (classId: string, payload: any) => {
  try {
    const newMessage: ClassMessage = {
      id: `msg_${Date.now()}`,
      classId,
      senderId: payload.senderId || 'user-demo',
      senderName: payload.senderName || 'Anonymous',
      senderRole: payload.senderRole || 'siswa',
      text: payload.text || payload.message || '',
      createdAt: Date.now(),
    };

    if (db.table('messages')) {
      await db.table('messages').put(newMessage);
    }
    return { success: true, message: newMessage };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const sendMessageToClass = async (context: any, classId: string, payload: any, dateStr?: string) => {
  return sendMessage(classId, {
    senderId: payload.senderId,
    senderName: payload.senderName,
    senderRole: payload.senderRole,
    text: payload.messageText,
  });
};

export const classChatService = {
  getMessages: async (classId: string) => {
    try {
      if (db.table('messages')) {
        return await db.table('messages').where('classId').equals(classId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  },
  sendMessage,
  observeClassMessages,
  sendMessageToClass,
};
