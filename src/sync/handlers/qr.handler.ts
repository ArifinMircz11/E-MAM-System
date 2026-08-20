import { firestoreAdapter as db } from '../adapters/firestore.adapter';
import { sanitizeForJSON } from '@/utils/firestoreHelpers';
import type { SyncQueueItem } from '@/types';

export const handleQrBatchSync = async (items: SyncQueueItem[]) => {
  const batch = db.writeBatch();
  items.forEach((item) => {
    const ref = db.doc(item.collection, item.id);
    batch.set(ref, { ...sanitizeForJSON(item.payload), tenantId: item.tenantId });
  });
  await batch.commit();
};
