import type { ISyncOperation } from './types';
import { handleAttendanceSync } from './handlers/attendance.handler';
import { handleQrBatchSync } from './handlers/qr.handler';
import { handleStudentSync } from './handlers/student.handler';
import { handleTeacherSync } from './handlers/teacher.handler';
import { handleLetterSync } from './handlers/letter.handler';
import { firestoreAdapter as db } from './adapters/firestore.adapter';
import { deepClean } from '@/utils/firestoreHelpers';

/**
 * Routes sync queue items to their specific domain handlers.
 */
export class SyncDispatcher {
  static async dispatch(op: ISyncOperation, context: any): Promise<void> {
    const type = op.type || op.action;
    const payload = op.payload || op.data;

    if (!payload) {
      console.warn(`[SyncDispatcher] Skipping operation ${op.id} due to missing payload.`);
      return;
    }

    // Inject tenantId if missing from payload to satisfy Firestore rules
    const finalPayload = { ...payload };
    if (!finalPayload.tenantId && op.tenantId) {
      finalPayload.tenantId = op.tenantId;
    }

    // Domain: Attendance
    if (op.collection === 'attendance' && (type === 'SCAN_PRESENSI' || type === 'ATTENDANCE_PROCESS')) {
      const result = await handleAttendanceSync(finalPayload, {} as any);
      if (result?.success === false) {
        throw new Error(result.message);
      }
      return;
    }

    // Domain: QR Batch
    if (type === 'BATCH_SYNC' && Array.isArray(finalPayload)) {
      await handleQrBatchSync(finalPayload);
      return;
    }

    // Domain: Students
    if (op.collection === 'students' || type?.includes('STUDENT')) {
      await handleStudentSync(type || '', finalPayload);
      return;
    }

    // Domain: Teachers
    if (op.collection === 'teachers' || type?.includes('TEACHER')) {
      await handleTeacherSync(type || '', finalPayload);
      return;
    }

    // Domain: Letters
    if (op.collection === 'letters' || type?.includes('LETTER')) {
      await handleLetterSync(type || '', finalPayload);
      return;
    }

    // FALLBACK: Generic operations
    const docId = finalPayload.id || finalPayload.uid || op.docId || finalPayload.studentsId || finalPayload.teachersId || finalPayload.classId || String(op.id);
    
    if (op.collection && docId) {
      const ref = db.doc(op.collection, docId);
      const cleanData = deepClean(finalPayload.data || finalPayload);
      
      console.log(`[SyncDispatcher] Generic op ${type} for collection ${op.collection} with docId ${docId}`, {
        tenantId: finalPayload.tenantId,
        dataKeys: Object.keys(cleanData)
      });
      
      try {
        if (type === 'DELETE' || type === 'DELETE_STUDENT' || type === 'DELETE_TEACHER') {
          await db.deleteDoc(ref);
        } else if (type === 'UPDATE' || type === 'UPDATE_STUDENT' || type === 'UPDATE_TEACHER') {
          // Use setDoc with merge: true for updates to be resilient if document doesn't exist yet in Firestore
          await db.setDoc(ref, cleanData, { merge: true });
        } else {
          await db.setDoc(ref, cleanData, { merge: true });
        }
      } catch (err: any) {
        console.error(`[SyncDispatcher] Firestore error for op ${op.id} (${type} ${op.collection}):`, err.message || err);
        throw err;
      }
    } else {
      console.warn(`[SyncDispatcher] Unhandled operation or missing docId for op ID: ${op.id}`, op);
      throw new Error(`Unhandled sync operation type: ${type} for collection ${op.collection} or missing docId`);
    }
  }
}
