import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
} from '@/services/dbGateway';
import { handleFirestoreError } from '@/services/authService';
import { db } from '@/services/dbGateway';
import { OperationType } from '@/types';
import { realtimeHub } from '@/services/realtime/realtimeHub';

export function useAdminNotification() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'profile_update_requests'), where('status', '==', 'pending'));

    const subscribe = () => {
      realtimeHub.unsubscribe('admin-notification-requests');
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      if (document.visibilityState === 'visible') {
        subscribe();
      } else {
        realtimeHub.unsubscribe('admin-notification-requests');
      }
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
      const batch = writeBatch(db);

      batch.set(
        doc(db, 'students', studentId),
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      batch.delete(doc(db, 'profile_update_requests', requestId));

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'profile_update_requests');
    }
  };

  return { requests, loading, approveRequest };
}
