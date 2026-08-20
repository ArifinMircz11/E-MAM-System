import { firestoreAdapter as db } from '../adapters/firestore.adapter';
import { deepClean } from '@/utils/firestoreHelpers';

export const handleTeacherSync = async (type: string, payload: any) => {
  const id = payload.teachersId || payload.id || payload.nip;
  if (!id) {
    console.warn('[handleTeacherSync] Missing teacher ID in payload', payload);
    return;
  }
  const ref = db.doc('teachers', id);
  
  if (type === 'ADD_TEACHER' || type === 'CREATE') {
    await db.setDoc(ref, deepClean(payload));
  } else if (type === 'UPDATE_TEACHER' || type === 'UPDATE') {
    const updateData = payload.data || payload;
    await db.setDoc(ref, deepClean(updateData), { merge: true });
  } else if (type === 'DELETE_TEACHER' || type === 'DELETE') {
    await db.deleteDoc(ref);
  }
};
