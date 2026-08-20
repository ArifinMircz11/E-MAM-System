import { db } from '../firebase';
import { firestoreGateway as dbGateway } from '../gateways/FirestoreGateway';
import { getDocsSafe } from '@/services/sync/firestoreHelpers';
import { useUserStore } from '@/stores/userStore';

export const fetchPendingApprovalsCount = async (isAdmin: boolean): Promise<number> => {
  if (!isAdmin || !db) return 0;

  try {
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) {
      console.warn('pendingApprovalListener: tenantId required, but was not found.');
      return 0;
    }
    const qUsers = dbGateway.query(
      dbGateway.collection(db, 'users'),
      dbGateway.where('accountStatus', '==', 'pending_approval'),
      dbGateway.where('tenantId', '==', tenantId),
    );
    const qData = dbGateway.query(
      dbGateway.collection(db, 'profile_update_requests'),
      dbGateway.where('status', '==', 'pending'),
      dbGateway.where('tenantId', '==', tenantId),
    );

    const [snapUsers, snapData] = await Promise.all([getDocsSafe(qUsers), getDocsSafe(qData)]);

    return snapUsers.length + snapData.length;
  } catch (err: any) {
    console.warn('Pending approval count fetch failed:', err.message);
    return 0;
  }
};

export const subscribePendingApprovalsCount = (
  isAdmin: boolean,
  onUpdate: (count: number) => void,
): (() => void) => {
  if (!isAdmin || !db) {
    onUpdate(0);
    return () => {};
  }

  const tenantId = useUserStore.getState().tenantId;
  if (!tenantId) {
    console.warn('subscribePendingApprovalsCount: tenantId required, but was not found.');
    return () => {};
  }

  const qUsers = dbGateway.query(
    dbGateway.collection(db, 'users'),
    dbGateway.where('accountStatus', '==', 'pending_approval'),
    dbGateway.where('tenantId', '==', tenantId),
  );
  const qData = dbGateway.query(
    dbGateway.collection(db, 'profile_update_requests'),
    dbGateway.where('status', '==', 'pending'),
    dbGateway.where('tenantId', '==', tenantId),
  );

  let usersCount = 0;
  let dataCount = 0;

  const unsubUsers = dbGateway.onSnapshot(
    qUsers,
    (snapshot) => {
      usersCount = snapshot.size;
      onUpdate(usersCount + dataCount);
    },
    (err) => {
      console.warn('Pending users count subscription failed:', err);
    },
  );

  const unsubData = dbGateway.onSnapshot(
    qData,
    (snapshot) => {
      dataCount = snapshot.size;
      onUpdate(usersCount + dataCount);
    },
    (err) => {
      console.warn('Pending data count subscription failed:', err);
    },
  );

  return () => {
    unsubUsers();
    unsubData();
  };
};
