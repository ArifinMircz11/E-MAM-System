import { firestoreGateway as dbGateway } from '../gateways/FirestoreGateway';
import { toast } from 'sonner';
import { realtimeHub } from './realtimeHub';

export const subscribeToAnnouncements = (
  tenantId: string,
  onNavigate: (view: any) => void,
  ViewState: any,
) => {
  if (!tenantId) return () => {};

  // e-Mam System v7.2 - Real-time announcements with quota management
  const q = dbGateway.query(
    dbGateway.collection(dbGateway.db, 'announcements'),
    dbGateway.where('tenantId', '==', tenantId),
    dbGateway.where('date', '>', dbGateway.Timestamp.fromDate(new Date(Date.now() - 60 * 60000))), // Last 1 hour
    dbGateway.orderBy('date', 'desc'),
    dbGateway.limit(1), // Only most recent for real-time popups
  );

  const unsub = dbGateway.onSnapshot(
    q,
    (snapshot) => {
      if (document.visibilityState === 'hidden') return;

      const seenAnnouncements = JSON.parse(localStorage.getItem('seen_announcements') || '[]');

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!seenAnnouncements.includes(doc.id)) {
          toast.success(data.title || 'Pemberitahuan Baru', {
            description: data.message,
            action: {
              label: 'LIHAT',
              onClick: () => onNavigate(ViewState.NOTIFICATIONS),
            },
            duration: 10000,
          });
          seenAnnouncements.push(doc.id);
        }
      });

      localStorage.setItem('seen_announcements', JSON.stringify(seenAnnouncements.slice(-20)));
    },
    (err) => {
      console.warn('[AnnouncementListener] Real-time error:', err);
    },
  );

  realtimeHub.subscribe('system-announcements', unsub);
  return unsub;
};
