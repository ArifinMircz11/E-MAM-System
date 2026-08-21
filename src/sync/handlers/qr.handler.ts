import { firestoreAdapter as db } from '../adapters/firestore.adapter';
import { sanitizeForJSON } from '@/utils/firestoreHelpers';
import type { SyncQueueItem } from '@/types';

function resolveRecordId(item: SyncQueueItem): string {
  const payload = item.payload as Record<string, unknown> | null;
  const candidate = item.recordId ??
    payload?.id ??
    payload?.idUnik ??
    payload?.uid ??
    payload?.studentId ??
    payload?.studentsId ??
    payload?.teacherId ??
    payload?.teachersId;

  if (!candidate) {
    throw new Error(`QR batch item ${item.id} has no deterministic recordId`);
  }

  return String(candidate);
}

/**
 * QR batch sync is intentionally idempotent: every item is written to its
 * deterministic domain document id. Retrying the same batch therefore
 * replaces/merges the same documents instead of creating duplicates.
 */
export const handleQrBatchSync = async (items: SyncQueueItem[]) => {
  if (!Array.isArray(items) || items.length === 0) return;

  const batch = db.writeBatch();

  for (const item of items) {
    if (!item.collection || !item.tenantId) {
      throw new Error(`QR batch item ${item.id} has invalid collection/tenantId`);
    }

    const recordId = resolveRecordId(item);
    const payload = sanitizeForJSON(item.payload);
    const data = {
      ...(payload as Record<string, unknown>),
      tenantId: item.tenantId,
    };

    const ref = db.doc(item.collection, recordId);
    batch.set(ref, data, { merge: true });
  }

  await batch.commit();
};
