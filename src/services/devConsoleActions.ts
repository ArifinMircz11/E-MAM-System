import { useAuthStore } from '@/stores/authStore';
import { CacheService } from './CacheService';
import { realtimeHub } from './realtime/realtimeHub';
import { db as localDb } from '@/database/dexie';
import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { auth, db as firestore } from '@/services/firebase';

export class DevConsoleActions {
  // 1. SYSTEM BROADCAST
  static async sendBroadcast(message: string, isEmergency: boolean = false) {
    const payload = {
      message,
      isEmergency,
      timestamp: dbGateway.serverTimestamp(),
      sender: useAuthStore.getState().user?.id || 'system',
    };
    await dbGateway.setDoc(dbGateway.doc(firestore, 'system_config', 'broadcast'), payload, { merge: true });
    console.log('[Kernel Event]: broadcast_sent', payload);
    return payload;
  }

  // 2. FEATURE TOGGLES
  static async toggleFeature(featureKey: string, enabled: boolean) {
    const ref = dbGateway.doc(firestore, 'system_config', 'featureToggles');
    await dbGateway.setDoc(ref, { [featureKey]: enabled }, { merge: true });
    console.log('[Kernel Event]: feature_toggle', { featureKey, enabled });
    return { featureKey, enabled };
  }

  // 3. MASTER VERSION
  static async bumpMasterVersion(newVersion: string) {
    const ref = dbGateway.doc(firestore, 'system_config', 'config');
    await dbGateway.setDoc(ref, { masterVersion: newVersion, updatedAt: dbGateway.serverTimestamp() }, { merge: true });
    // Reset dexie
    await localDb.delete();
    await localDb.open();
    console.log('[Kernel Event]: master_version_bumped', { newVersion });
    return { newVersion };
  }

  // 4. SCHEMA EXPLORER (Baca data dengan cache)
  static async exploreCollection(collectionName: string, limitCount: number = 50) {
    // Return empty list if collectionName not handled properly by generic cache but usually handled in UI
    return [];
  }

  // 5. TENANT MANAGEMENT (CRUD)
  static async createTenant(tenantData: any) {
    const ref = dbGateway.doc(dbGateway.collection(firestore, 'tenants'));
    await dbGateway.setDoc(ref, { ...tenantData, createdAt: dbGateway.serverTimestamp() });
    console.log('[Kernel Event]: tenant_created', { id: ref.id });
    return { id: ref.id };
  }

  static async toggleTenantStatus(tenantId: string, active: boolean) {
    const ref = dbGateway.doc(firestore, 'tenants', tenantId);
    await dbGateway.updateDoc(ref, { active });
    console.log('[Kernel Event]: tenant_status_toggled', { tenantId, active });
    return { tenantId, active };
  }

  // 6. INTEGRATION TEST (WA)
  static async testWhatsApp(phoneNumber: string, message: string) {
    // Stub
    await new Promise((r) => setTimeout(r, 1000));
    console.log('[Kernel Event]: wa_test_complete', { phoneNumber });
    return { success: true };
  }

  // 7. USER CONTROL & IMPERSONATE
  static async forceLogout(userId: string) {
    const ref = dbGateway.doc(firestore, 'users', userId);
    await dbGateway.updateDoc(ref, { fcmToken: null, sessionId: null });
    console.log('[Kernel Event]: force_logout', { userId });
    return { userId };
  }

  static async impersonateUser(userId: string) {
    const snap = await dbGateway.getDocs(
      dbGateway.query(dbGateway.collection(firestore, 'users'), dbGateway.where('id', '==', userId), dbGateway.limit(1)),
    );
    const userData = snap.docs[0]?.data();
    if (!userData) throw new Error('User not found');
    console.log('[Kernel Event]: impersonate_start', { userId });
    return userData;
  }

  // 8. ATTENDANCE VALIDATION
  static async recalculateAttendance(date: string) {
    const q = dbGateway.query(dbGateway.collection(firestore, 'attendance'), dbGateway.where('date', '==', date));
    const snap = await dbGateway.getDocs(q);
    const batch = dbGateway.writeBatch(firestore);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { validated: true, validatedAt: dbGateway.serverTimestamp() });
    });
    await batch.commit();
    console.log('[Kernel Event]: attendance_recalculated', { date, count: snap.size });
    return { date, count: snap.size };
  }

  // 9. ENTERPRISE DUMMY ENGINE
  static async seedDummyData(count: number) {
    // Stub
    await new Promise((r) => setTimeout(r, 1500));
    console.log('[Kernel Event]: dummy_seeded', { count });
    return { success: true, count };
  }

  // 11. OMNI POINT ENGINE
  static async recalcAllPoints() {
    // Stub
    await new Promise((r) => setTimeout(r, 1000));
    console.log('[Kernel Event]: points_recalculated');
    return { success: true };
  }

  // 12. SELF-HEALING ENGINE
  static async selfHealingDatabaseReset(onLog?: (msg: string) => void) {
    onLog?.('Mulai proses Self-Healing: Pembersihan Database Lokal...');

    onLog?.('Menghancurkan seluruh tabel Dexie...');
    await localDb.delete();

    onLog?.('Membuka kembali koneksi database baru...');
    await localDb.open();

    onLog?.('Membersihkan Cache Service...');
    (CacheService as any).clearAll?.();

    onLog?.('Mematikan seluruh listener realtime...');
    realtimeHub.unsubscribeAll();

    onLog?.('Self-Healing Selesai. Sistem akan memuat ulang...');

    await new Promise((r) => setTimeout(r, 1500));

    if (typeof window !== 'undefined') {
      window.location.reload();
    }

    return 'Database Lokal berhasil dibersihkan dan dipulihkan.';
  }
}
