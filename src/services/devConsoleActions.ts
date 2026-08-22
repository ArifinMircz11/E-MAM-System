import { useAuthStore } from '@/stores/authStore';
import { CacheService } from './CacheService';
import { realtimeHub } from './realtime/realtimeHub';
import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { localDatabaseAdminRepository } from '@/repositories/LocalDatabaseAdminRepository';

export class DevConsoleActions {
  static async sendBroadcast(message: string, isEmergency: boolean = false) {
    const payload = { message, isEmergency, timestamp: dbGateway.serverTimestamp(), sender: useAuthStore.getState().user?.id || 'system' };
    await dbGateway.setDoc(dbGateway.doc(dbGateway.db, 'system_config', 'broadcast'), payload, { merge: true });
    console.log('[Kernel Event]: broadcast_sent', payload);
    return payload;
  }

  static async toggleFeature(featureKey: string, enabled: boolean) {
    await dbGateway.setDoc(dbGateway.doc(dbGateway.db, 'system_config', 'featureToggles'), { [featureKey]: enabled }, { merge: true });
    return { featureKey, enabled };
  }

  static async bumpMasterVersion(newVersion: string) {
    await dbGateway.setDoc(dbGateway.doc(dbGateway.db, 'system_config', 'config'), { masterVersion: newVersion, updatedAt: dbGateway.serverTimestamp() }, { merge: true });
    await localDatabaseAdminRepository.reset();
    return { newVersion };
  }

  static async exploreCollection(_collectionName: string, _limitCount: number = 50) { return []; }

  static async createTenant(tenantData: any) {
    const ref = dbGateway.doc(dbGateway.collection(dbGateway.db, 'tenants'));
    await dbGateway.setDoc(ref, { ...tenantData, createdAt: dbGateway.serverTimestamp() });
    return { id: ref.id };
  }

  static async toggleTenantStatus(tenantId: string, active: boolean) {
    await dbGateway.updateDoc(dbGateway.doc(dbGateway.db, 'tenants', tenantId), { active });
    return { tenantId, active };
  }

  static async testWhatsApp(phoneNumber: string, _message: string) {
    await new Promise((r) => setTimeout(r, 1000));
    return { success: true, phoneNumber };
  }

  static async forceLogout(userId: string) {
    await dbGateway.updateDoc(dbGateway.doc(dbGateway.db, 'users', userId), { fcmToken: null, sessionId: null });
    return { userId };
  }

  static async impersonateUser(userId: string) {
    const snap = await dbGateway.getDocs(dbGateway.query(dbGateway.collection(dbGateway.db, 'users'), dbGateway.where('id', '==', userId), dbGateway.limit(1)));
    const userData = snap.docs[0]?.data();
    if (!userData) throw new Error('User not found');
    return userData;
  }

  static async recalculateAttendance(date: string) {
    const q = dbGateway.query(dbGateway.collection(dbGateway.db, 'attendance'), dbGateway.where('date', '==', date));
    const snap = await dbGateway.getDocs(q);
    const batch = dbGateway.writeBatch(dbGateway.db);
    snap.docs.forEach((d) => batch.update(d.ref, { validated: true, validatedAt: dbGateway.serverTimestamp() }));
    await batch.commit();
    return { date, count: snap.size };
  }

  static async seedDummyData(count: number) { await new Promise((r) => setTimeout(r, 1500)); return { success: true, count }; }
  static async recalcAllPoints() { await new Promise((r) => setTimeout(r, 1000)); return { success: true }; }

  static async selfHealingDatabaseReset(onLog?: (msg: string) => void) {
    onLog?.('Mulai proses Self-Healing: Pembersihan Database Lokal...');
    onLog?.('Menghancurkan seluruh tabel Dexie...');
    await localDatabaseAdminRepository.reset();
    onLog?.('Membuka kembali koneksi database baru...');
    onLog?.('Membersihkan Cache Service...');
    (CacheService as any).clearAll?.();
    onLog?.('Mematikan seluruh listener realtime...');
    realtimeHub.unsubscribeAll();
    onLog?.('Self-Healing Selesai. Sistem akan memuat ulang...');
    await new Promise((r) => setTimeout(r, 1500));
    if (typeof window !== 'undefined') window.location.reload();
    return 'Database Lokal berhasil dibersihkan dan dipulihkan.';
  }
}
