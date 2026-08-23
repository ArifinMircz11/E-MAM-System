import { firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { sanitizeForJSON } from '@/utils/firestoreHelpers';
import { QuotaState } from '@/utils/quotaState';

export interface DeltaCursor {
  updatedAt: string;
  id: string;
}

export interface SyncDataSource {
  pullDelta(collection: string, tenantId: string, cursor?: string): Promise<any[]>;
  push(collection: string, id: string, payload: any): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
}

const parseCursor = (cursor?: string): DeltaCursor | undefined => {
  if (!cursor) return undefined;
  try {
    const parsed = JSON.parse(cursor) as Partial<DeltaCursor>;
    if (typeof parsed.updatedAt !== 'string' || typeof parsed.id !== 'string' || !parsed.id) return undefined;
    const date = new Date(parsed.updatedAt);
    if (Number.isNaN(date.getTime())) return undefined;
    return { updatedAt: date.toISOString(), id: parsed.id };
  } catch {
    // Backward-compatible migration from the old timestamp-only checkpoint.
    const date = new Date(cursor);
    return Number.isNaN(date.getTime()) ? undefined : { updatedAt: date.toISOString(), id: '' };
  }
};

export const encodeDeltaCursor = (cursor: DeltaCursor): string => JSON.stringify({
  updatedAt: new Date(cursor.updatedAt).toISOString(),
  id: cursor.id,
});

export class FirestoreSyncDataSource implements SyncDataSource {
  async pullDelta(collectionName: string, tenantId: string, cursor?: string): Promise<any[]> {
    if (QuotaState.isQuotaExhausted()) return [];

    const colRef = firestoreGateway.collection(firestoreGateway.db, collectionName);
    const parsedCursor = parseCursor(cursor);
    let q: any;

    if (parsedCursor) {
      const cursorDate = new Date(parsedCursor.updatedAt);
      const constraints: any[] = [
        firestoreGateway.where('tenantId', '==', tenantId),
        firestoreGateway.orderBy('updatedAt', 'asc'),
        firestoreGateway.orderBy(firestoreGateway.documentId(), 'asc'),
        firestoreGateway.startAfter(cursorDate, parsedCursor.id),
        firestoreGateway.limit(100),
      ];
      q = firestoreGateway.query(colRef, ...constraints);
    } else {
      q = firestoreGateway.query(
        colRef,
        firestoreGateway.where('tenantId', '==', tenantId),
        firestoreGateway.orderBy('updatedAt', 'asc'),
        firestoreGateway.orderBy(firestoreGateway.documentId(), 'asc'),
        firestoreGateway.limit(200),
      );
    }

    try {
      const snap = await firestoreGateway.getDocs(q);
      if (!snap || snap.empty) return [];
      return snap.docs.map((docSnap: any) => sanitizeForJSON({ id: docSnap.id, ...docSnap.data() }));
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (err?.code === 'resource-exhausted' || errMsg.includes('resource-exhausted') || errMsg.includes('Quota exceeded')) QuotaState.markExhausted();
      console.warn('[SyncDataSource] pullDelta failed, falling back to cache/empty:', errMsg);
      return [];
    }
  }

  async push(collectionName: string, id: string, payload: any): Promise<void> {
    if (QuotaState.isQuotaExhausted()) throw new Error('Quota exceeded (offline mode)');
    try {
      const ref = firestoreGateway.doc(firestoreGateway.db, collectionName, id);
      await firestoreGateway.setDoc(ref, payload, { merge: true });
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (err?.code === 'resource-exhausted' || errMsg.includes('resource-exhausted') || errMsg.includes('Quota exceeded')) QuotaState.markExhausted();
      throw err;
    }
  }

  async delete(collectionName: string, id: string): Promise<void> {
    if (QuotaState.isQuotaExhausted()) throw new Error('Quota exceeded (offline mode)');
    try {
      const ref = firestoreGateway.doc(firestoreGateway.db, collectionName, id);
      await firestoreGateway.deleteDoc(ref);
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (err?.code === 'resource-exhausted' || errMsg.includes('resource-exhausted') || errMsg.includes('Quota exceeded')) QuotaState.markExhausted();
      throw err;
    }
  }
}
