import { firestoreAdapter as db } from '../adapters/firestore.adapter';
import { deepClean } from '@/utils/firestoreHelpers';

export const handleStudentSync = async (type: string, payload: any) => {
  const id = payload.idUnik || payload.id || payload.studentsId;
  if (!id) {
    console.warn('[handleStudentSync] Missing student ID in payload', payload);
    return;
  }
  const ref = db.doc('students', id);
  
  if (type === 'ADD_STUDENT' || type === 'CREATE') {
    await db.setDoc(ref, deepClean(payload));
  } else if (type === 'UPDATE_STUDENT' || type === 'UPDATE') {
    const updateData = payload.data || payload;
    await db.setDoc(ref, deepClean(updateData), { merge: true });
  } else if (type === 'DELETE_STUDENT' || type === 'DELETE') {
    await db.deleteDoc(ref);
  }
};
