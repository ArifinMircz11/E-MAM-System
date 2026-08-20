import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { db } from './firebase';
import { realtimeHub } from './realtime/realtimeHub';
import { useUserStore } from '../stores/userStore';

export const subscribeToChats = (callback: (chats: any[]) => void) => {
  const tenantId = useUserStore.getState().tenantId;
  let q = dbGateway.query(dbGateway.collection(db, 'liveChat'), dbGateway.orderBy('timestamp', 'asc'));
  if (tenantId) {
    q = dbGateway.query(
      dbGateway.collection(db, 'liveChat'),
      dbGateway.where('tenantId', '==', tenantId),
      dbGateway.orderBy('timestamp', 'asc'),
    );
  }
  const unsub = dbGateway.onSnapshot(q, async (snapshot) => {
    const chats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(chats);
  });

  realtimeHub.subscribe(`live-chat-${tenantId || 'global'}`, unsub);
  return unsub;
};

export const replyToChat = async (chatId: string, replyText: string) => {
  await dbGateway.updateDoc(dbGateway.doc(db, 'liveChat', chatId), {
    adminReply: replyText,
    status: 'replied',
    respondedAt: dbGateway.serverTimestamp(),
  });
};

// AI auto-reply removed as requested by user.
