import { firestoreAdapter as db } from '../adapters/firestore.adapter';
import { deepClean } from '@/utils/firestoreHelpers';

export const handleLetterSync = async (type: string, payload: any) => {
  const id = payload.id;
  if (!id) {
    throw new Error('LETTER_SYNC_ENTITY_ID_MISSING');
  }

  const ref = db.doc('letters', String(id));
  const normalizedType = String(type).toUpperCase();

  if (normalizedType === 'CREATE' || normalizedType === 'ADD_LETTER') {
    await db.setDoc(ref, deepClean(payload), { merge: true });
    return;
  }

  if (normalizedType === 'UPDATE' || normalizedType === 'UPDATE_LETTER') {
    await db.setDoc(ref, deepClean(payload), { merge: true });
    return;
  }

  if (normalizedType === 'DELETE' || normalizedType === 'DELETE_LETTER') {
    await db.deleteDoc(ref);
    return;
  }

  throw new Error(`LETTER_SYNC_UNSUPPORTED_OPERATION:${type}`);
};
