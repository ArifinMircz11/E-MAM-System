import { firestoreAdapter as db } from '../adapters/firestore.adapter';
import { deepClean } from '@/utils/firestoreHelpers';

export const handleStudentSync = async (type: string, payload: any) => {
  const id = payload.idUnik || payload.id || payload.studentsId;
  if (!id) {
    throw new Error('STUDENT_SYNC_ENTITY_ID_MISSING');
  }

  const ref = db.doc('students', String(id));
  const normalizedType = String(type).toUpperCase();

  if (normalizedType === 'ADD_STUDENT' || normalizedType === 'CREATE') {
    await db.setDoc(ref, deepClean(payload), { merge: true });
    return;
  }

  if (normalizedType === 'UPDATE_STUDENT' || normalizedType === 'UPDATE') {
    const updateData = payload.data || payload;
    await db.setDoc(ref, deepClean(updateData), { merge: true });
    return;
  }

  if (normalizedType === 'DELETE_STUDENT' || normalizedType === 'DELETE') {
    await db.deleteDoc(ref);
    return;
  }

  throw new Error(`STUDENT_SYNC_UNSUPPORTED_OPERATION:${type}`);
};
