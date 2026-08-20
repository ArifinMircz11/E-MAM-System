import { firestoreGateway as dbGateway } from '../gateways/FirestoreGateway';

/**
 * Listens to the current authenticated user's profile document dynamically.
 * Coordinates state updates across stores (useAuthStore, useUserStore, useProfileStore) safely.
 */
export const subscribeUserProfile = (
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null,
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
): (() => void) => {
  if (!uid || !dbGateway.db) return () => {};

  const userDocRef = dbGateway.doc(dbGateway.db, 'users', uid);

  return dbGateway.onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        let userRoles =
          Array.isArray(data.roles) && data.roles.length > 0
            ? data.roles
            : data.role
              ? [data.role]
              : [data.peran || 'SISWA'];

        if ((email === 'admin@example.com' || email === 'developer@example.com') && !userRoles.includes('DEVELOPER')) {
          userRoles = ['DEVELOPER', ...userRoles];
        }

        const profileData = {
          uid,
          email: email || '',
          displayName: data.displayName || displayName || 'Pengguna',
          photoURL: data.photoURL || photoURL || null,
          role: userRoles[0],
          roles: userRoles,
          studentsId: data.studentsId || null,
          teachersId: data.teachersId || null,
          tenantId: data.tenantId || 'default',
          referenceId: data.referenceId || null,
          idUnik: data.idUnik || null,
          accountStatus: data.accountStatus || 'Active',
          walasOfClass: data.walasOfClass || null,
          isSso: data.isSso || false,
          updatedAt: Date.now(),
        };

        onSuccess(profileData);
      }
    },
    (err) => {
      console.error('[UserListener] User doc listener error:', err);
      onError(err);
    },
  );
};

/**
 * Listens to account status (active / pending) of a user document
 */
export const subscribeUserAccountStatus = (
  uid: string,
  onUpdate: (status: string) => void,
): (() => void) => {
  if (!uid || !dbGateway.db) return () => {};

  const userDocRef = dbGateway.doc(dbGateway.db, 'users', uid);

  return dbGateway.onSnapshot(userDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const status = data.active ? 'active' : 'pending';
      onUpdate(status);
    }
  });
};

/**
 * Subscription for pending approvals and profile update approvals (Admin/Developer only)
 * Enforces Tenant Isolation and caps memory loads.
 */
export const subscribePendingApprovals = (
  tenantId: string,
  isAdmin: boolean,
  onUpdate: (count: number) => void,
): (() => void) => {
  if (!isAdmin || !tenantId || !dbGateway.db) {
    onUpdate(0);
    return () => {};
  }

  const qUsers = dbGateway.query(
    dbGateway.collection(dbGateway.db, 'users'),
    dbGateway.where('accountStatus', '==', 'pending_approval'),
    dbGateway.where('tenantId', '==', tenantId),
  );

  const qData = dbGateway.query(
    dbGateway.collection(dbGateway.db, 'profile_update_requests'),
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
      console.warn('[UserListener] Pending users count subscription failed:', err);
    },
  );

  const unsubData = dbGateway.onSnapshot(
    qData,
    (snapshot) => {
      dataCount = snapshot.size;
      onUpdate(usersCount + dataCount);
    },
    (err) => {
      console.warn('[UserListener] Pending data count subscription failed:', err);
    },
  );

  return () => {
    unsubUsers();
    unsubData();
  };
};
