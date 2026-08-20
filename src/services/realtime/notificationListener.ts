import { db } from '../firebase';
import { firestoreGateway as dbGateway } from '../gateways/FirestoreGateway';

import { getDocsSafe } from '@/services/sync/firestoreHelpers';

export const subscribeToNotifications = (
  userId: string,
  mappedRole: string,
  onUpdate: (infoCount: number, personalCount: number, chatCount: number) => void,
) => {
  if (!userId || !db) return () => {};

  const fetchCounts = async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const qInfo = dbGateway.query(
        dbGateway.collection(db, 'notifications'),
        dbGateway.where('type', '==', 'info'),
        dbGateway.where('targetRole', 'in', ['semua', mappedRole || 'semua']),
        dbGateway.where('isRead', '==', false),
      );
      const qPersonal = dbGateway.query(
        dbGateway.collection(db, 'notifications'),
        dbGateway.where('userId', '==', userId),
        dbGateway.where('isRead', '==', false),
        dbGateway.where('type', 'not-in', ['chat', 'system_hidden']),
      );
      const qChat = dbGateway.query(
        dbGateway.collection(db, 'notifications'),
        dbGateway.where('userId', '==', userId),
        dbGateway.where('type', '==', 'chat'),
        dbGateway.where('isRead', '==', false),
      );

      const [infoSnap, personalSnap, chatSnap] = await Promise.all([
        getDocsSafe(qInfo),
        getDocsSafe(qPersonal),
        getDocsSafe(qChat),
      ]);

      onUpdate(infoSnap.length, personalSnap.length, chatSnap.length);
    } catch (err) {
      console.warn('Failed to fetch notification counts:', err);
    }
  };

  fetchCounts();

  // Polling significantly less frequently and only when visible instead of real-time listener
  const interval = setInterval(
    () => {
      if (document.visibilityState === 'visible') {
        fetchCounts();
      }
    },
    15 * 60 * 1000,
  ); // Increased to 15 minutes

  return () => clearInterval(interval);
};
