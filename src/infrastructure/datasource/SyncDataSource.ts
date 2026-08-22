import { firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { sanitizeForJSON } from '@/utils/firestoreHelpers';
import { QuotaState } from '@/utils/quotaState';

export interface SyncDataSource {
  pullDelta(collection: string, tenantId: string, cursor?: string): Promise<any[]>;
  push(collection: string, id: string, payload: any): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
}

export class FirestoreSyncDataSource implements SyncDataSource {
  async pullDelta(collectionName: string, tenantId: string, cursor?: string): Promise<any[]> {
    if (QuotaState.isQuotaExhausted()) {
      return [];
    }

    const colRef = firestoreGateway.collection(firestoreGateway.db, collectionName);
    let q: any;

    if (cursor) {
      const cursorDate = new Date(cursor);
      q = firestoreGateway.query(
        colRef,
        firestoreGateway.where('tenantId', '==', tenantId),
        firestoreGateway.where('updatedAt', '>', cursorDate),
        firestoreGateway.orderBy('updatedAt', 'asc'),
        firestoreGateway.limit(100),
      );
    } else {
      q = firestoreGateway.query(
        colRef,
        firestoreGateway.where('tenantId', '==', tenantId),
        firestoreGateway.limit(200),
      );
    }

    try {
      const snap = await firestoreGateway.getDocs(q);
      if (!snap || snap.empty) return [];

      return snap.docs.map((docSnap: any) =>
        sanitizeForJSON({
          id: docSnap.id,
          ...docSnap.data(),
        }),
      );
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        err?.code === 'resource-exhausted' ||
        errMsg.includes('resource-exhausted') ||
        errMsg.includes('Quota exceeded')
      ) {
        QuotaState.markExhausted();
      }
      console.warn('[SyncDataSource] pullDelta failed, falling back to cache/empty:', errMsg);
      return [];
    }
  }

  async push(collectionName: string, id: string, payload: any): Promise<void> {
    if (QuotaState.isQuotaExhausted()) {
      throw new Error('Quota exceeded (offline mode)');
    }

    try {
      const ref = firestoreGateway.doc(firestoreGateway.db, collectionName, id);
      await firestoreGateway.setDoc(ref, payload, { merge: true });
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        err?.code === 'resource-exhausted' ||
        errMsg.includes('resource-exhausted') ||
        errMsg.includes('Quota exceeded')
      ) {
        QuotaState.markExhausted();
      }
      throw err;
    }
  }

  async delete(collectionName: string, id: string): Promise<void> {
    if (QuotaState.isQuotaExhausted()) {
      throw new Error('Quota exceeded (offline mode)');
    }

    try {
      const ref = firestoreGateway.doc(firestoreGateway.db, collectionName, id);
      await firestoreGateway.deleteDoc(ref);
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        err?.code === 'resource-exhausted' ||
        errMsg.includes('resource-exhausted') ||
        errMsg.includes('Quota exceeded')
      ) {
        QuotaState.markExhausted();
      }
      throw err;
    }
  }
}
