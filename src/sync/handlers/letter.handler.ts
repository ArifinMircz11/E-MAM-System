import { firestoreAdapter as db } from '../adapters/firestore.adapter';
import { deepClean } from '@/utils/firestoreHelpers';

export const handleLetterSync = async (type: string, payload: any) => {
  const id = payload.id;
  if (!id) {
    console.warn('[handleLetterSync] Missing letter ID in payload', payload);
    return;
  }
  const ref = db.doc('letters', id);
  
  if (type === 'CREATE' || type === 'ADD_LETTER') {
    await db.setDoc(ref, deepClean(payload));
  } else if (type === 'UPDATE' || type === 'UPDATE_LETTER') {
    await db.setDoc(ref, deepClean(payload), { merge: true });
  } else if (type === 'DELETE') {
    await db.deleteDoc(ref);
  }
};
