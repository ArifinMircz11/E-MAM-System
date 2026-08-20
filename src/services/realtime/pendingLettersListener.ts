import { firestoreGateway as dbGateway } from '../gateways/FirestoreGateway';
import { UserRole } from '@/types';
import { useUserStore } from '@/stores/userStore';

export const fetchPendingLettersCount = async (
  userId: string,
  userRole: UserRole,
): Promise<number> => {
  if (!userId || !dbGateway.db) return 0;

  const isStaff = [
    UserRole.ADMIN,
    UserRole.STAF,
    UserRole.DEVELOPER,
    UserRole.KEPALA_TU,
    UserRole.WAKAMAD,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_OPERASIONAL,
  ].includes(userRole);

  try {
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');
    
    let q;
    if (isStaff) {
      q = dbGateway.query(
        dbGateway.collection(dbGateway.db, 'letters'),
        dbGateway.where('tenantId', '==', tenantId),
        dbGateway.where('status', 'in', ['Pending', 'Verified', 'Validated']),
      );
    } else {
      q = dbGateway.query(
        dbGateway.collection(dbGateway.db, 'letters'),
        dbGateway.where('tenantId', '==', tenantId),
        dbGateway.where('userId', '==', userId),
        dbGateway.where('status', 'in', ['Pending', 'Verified', 'Validated']),
      );
    }

    const snap = await dbGateway.getDocs(q);
    return snap.size;
  } catch (err: any) {
    console.warn('Letter count fetch failed:', err.message);
    return 0;
  }
};
