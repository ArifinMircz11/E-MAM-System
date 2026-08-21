import { firestoreAdapter as db } from '../adapters/firestore.adapter';
import { deepClean } from '@/utils/firestoreHelpers';

export const handleTeacherSync = async (type: string, payload: any) => {
  const id = payload.teachersId || payload.id || payload.nip;
  if (!id) {
    throw new Error('TEACHER_SYNC_ENTITY_ID_MISSING');
  }

  const ref = db.doc('teachers', String(id));
  const normalizedType = String(type).toUpperCase();

  if (normalizedType === 'ADD_TEACHER' || normalizedType === 'CREATE') {
    await db.setDoc(ref, deepClean(payload), { merge: true });
    return;
  }

  if (normalizedType === 'UPDATE_TEACHER' || normalizedType === 'UPDATE') {
    const updateData = payload.data || payload;
    await db.setDoc(ref, deepClean(updateData), { merge: true });
    return;
  }

  if (normalizedType === 'DELETE_TEACHER' || normalizedType === 'DELETE') {
    await db.deleteDoc(ref);
    return;
  }

  throw new Error(`TEACHER_SYNC_UNSUPPORTED_OPERATION:${type}`);
};
