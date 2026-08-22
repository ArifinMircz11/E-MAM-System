import type { ISyncOperation } from './types';
import { handleAttendanceSync } from './handlers/attendance.handler';
import { handleQrBatchSync } from './handlers/qr.handler';
import { handleStudentSync } from './handlers/student.handler';
import { handleTeacherSync } from './handlers/teacher.handler';
import { handleLetterSync } from './handlers/letter.handler';
import { firestoreAdapter as db } from './adapters/firestore.adapter';
import { deepClean } from '@/utils/firestoreHelpers';
import type { SecurityContext } from '@/core/security/types';

const ROUTED_CUSTOM_ACTIONS = new Set([
  'SCAN_PRESENSI',
  'ATTENDANCE_PROCESS',
  'BATCH_SYNC',
]);

function operationType(op: ISyncOperation): string {
  return String(op.type || op.action || op.operation || '').toUpperCase();
}

function payloadForOperation(op: ISyncOperation): unknown {
  return op.payload ?? op.data;
}

function withTenant(payload: unknown, tenantId?: string): unknown {
  if (!tenantId) return payload;
  if (Array.isArray(payload)) {
    return payload.map((entry) => ({
      ...(entry && typeof entry === 'object' ? entry : { value: entry }),
      tenantId,
    }));
  }
  if (payload && typeof payload === 'object') {
    return { ...(payload as Record<string, unknown>), tenantId };
  }
  return payload;
}

function assertTenant(op: ISyncOperation, context: SecurityContext) {
  if (!op.tenantId || op.tenantId !== context.tenantId) {
    if (!(context.isDeveloper && context.tenantId === 'global')) {
      throw new Error('SYNC_DISPATCH_TENANT_MISMATCH');
    }
  }
}

/**
 * Routes sync queue items to domain handlers or deterministic generic CRUD.
 * The dispatcher is a cloud-write boundary and therefore never bypasses the
 * Firestore adapter/gateway.
 */
export class SyncDispatcher {
  static async dispatch(op: ISyncOperation, context: SecurityContext): Promise<void> {
    assertTenant(op, context);

    const type = operationType(op);
    const payload = payloadForOperation(op);

    if (payload == null) throw new Error(`SYNC_PAYLOAD_MISSING:${op.id}`);

    const finalPayload = withTenant(payload, op.tenantId);

    if (op.collection === 'attendance' && (type === 'SCAN_PRESENSI' || type === 'ATTENDANCE_PROCESS')) {
      const result = await handleAttendanceSync(finalPayload, {} as any);
      if (result?.success === false) {
        throw new Error(result.message || 'ATTENDANCE_SYNC_FAILED');
      }
      return;
    }

    if (type === 'BATCH_SYNC') {
      if (!Array.isArray(finalPayload)) throw new Error(`QR_BATCH_PAYLOAD_INVALID:${op.id}`);
      await handleQrBatchSync(finalPayload as any);
      return;
    }

    if (op.collection === 'students' || type.includes('STUDENT')) {
      await handleStudentSync(type, finalPayload);
      return;
    }

    if (op.collection === 'teachers' || type.includes('TEACHER')) {
      await handleTeacherSync(type, finalPayload);
      return;
    }

    if (op.collection === 'letters' || type.includes('LETTER')) {
      await handleLetterSync(type, finalPayload);
      return;
    }

    if (!op.collection || (!op.docId && !(finalPayload && typeof finalPayload === 'object'))) {
      throw new Error(`SYNC_OPERATION_INVALID:${op.id}`);
    }

    const payloadObject = finalPayload as Record<string, unknown>;
    const docId =
      payloadObject.id ||
      payloadObject.uid ||
      op.docId ||
      payloadObject.studentsId ||
      payloadObject.teachersId ||
      payloadObject.classId ||
      op.id;

    const ref = db.doc(op.collection, String(docId));
    const cleanData = deepClean(
      (payloadObject.data && typeof payloadObject.data === 'object'
        ? payloadObject.data
        : payloadObject) as Record<string, unknown>,
    );

    try {
      if (type === 'DELETE' || type === 'DELETE_STUDENT' || type === 'DELETE_TEACHER') {
        await db.deleteDoc(ref);
        return;
      }

      if (
        type === 'UPDATE' ||
        type === 'UPDATE_STUDENT' ||
        type === 'UPDATE_TEACHER' ||
        type === 'PATCH' ||
        type === 'CREATE' ||
        type === 'ADD_POINT' ||
        type === 'ADD_STUDENT' ||
        type === 'ADD_TEACHER' ||
        type === 'ADD_LETTER'
      ) {
        // ADD_POINT uses the same deterministic document contract as normal
        // CRUD. It must not be treated as a side-effect-only action because a
        // retry after a crash must converge to the same point record.
        await db.setDoc(ref, cleanData, { merge: true });
        return;
      }

      if (ROUTED_CUSTOM_ACTIONS.has(type)) {
        throw new Error(`SYNC_CUSTOM_ACTION_UNROUTED:${type}`);
      }

      throw new Error(`SYNC_OPERATION_UNSUPPORTED:${type}`);
    } catch (err: any) {
      console.error(
        `[SyncDispatcher] Firestore error for op ${op.id} (${type} ${op.collection}):`,
        err?.message || err,
      );
      throw err;
    }
  }
}
