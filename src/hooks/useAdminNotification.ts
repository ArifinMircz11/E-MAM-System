import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
  firestoreGateway,
} from '@/services/gateways/FirestoreGateway';
import { handleFirestoreError, OperationType } from '@/services/authService';
import { realtimeHub } from '@/services/realtime/realtimeHub';

export function useAdminNotification() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(firestoreGateway.db, 'profile_update_requests'),
      where('status', '==', 'pending'),
    );

    const subscribe = () => {
      realtimeHub.unsubscribe('admin-notification-requests');
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
          setRequests(data);
          setLoading(false);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'profile_update_requests');
        },
      );
      realtimeHub.subscribe('admin-notification-requests', unsub);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') subscribe();
      else realtimeHub.unsubscribe('admin-notification-requests');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    subscribe();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      realtimeHub.unsubscribe('admin-notification-requests');
    };
  }, []);

  const approveRequest = async (requestId: string, studentId: string, updates: any) => {
    try {
      const batch = writeBatch(firestoreGateway.db);
      batch.set(
        doc(firestoreGateway.db, 'students', studentId),
        { ...updates, updatedAt: serverTimestamp() },
        { merge: true },
      );
      batch.delete(doc(firestoreGateway.db, 'profile_update_requests', requestId));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'profile_update_requests');
    }
  };

  return { requests, loading, approveRequest };
}
