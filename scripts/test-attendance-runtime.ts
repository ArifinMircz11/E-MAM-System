
import 'fake-indexeddb/auto';
import { localDb } from '../src/core/database/db';
import { AttendanceRepository } from '../src/repositories/attendanceRepository';
import { SyncRepository } from '../src/repositories/SyncRepository';

async function runTest() {
  console.log("Starting Attendance Runtime Proof...");
  
  const repo = new AttendanceRepository(localDb.attendance);
  const syncRepo = new SyncRepository(localDb.sync_queue);
  
  const tenantId = "tenant-a";
  const entityId = "student-123_2026-08-20";
  
  const record = {
    id: entityId,
    tenantId: tenantId,
    studentId: "student-123",
    date: "2026-08-20",
    status: 'Hadir' as any,
    version: 0,
    updatedAt: Date.now()
  };

  console.log("--- Skenario 1: OFFLINE CREATE v1 ---");
  await repo.create(record);
  const created = await localDb.attendance.get(entityId);
  const queue = await localDb.sync_queue.toArray();
  console.log("Attendance v1 created in Dexie:", created?.version === 1);
  console.log("SyncQueue PENDING:", queue.length === 1 && queue[0].metadata?.version === 1);

  console.log("--- Skenario 2: UPDATE v2 ---");
  const updatedRecord = { ...created!, status: 'Izin' as any };
  await repo.update(updatedRecord);
  const updated = await localDb.attendance.get(entityId);
  const queue2 = await localDb.sync_queue.toArray();
  console.log("Attendance v2 updated in Dexie:", updated?.version === 2);
  console.log("SyncQueue has 2 items:", queue2.length === 2);

  console.log("--- Skenario 3: TENANT ISOLATION ---");
  try {
    await repo.update({ ...updated!, tenantId: "tenant-b" });
    console.log("FAIL: Tenant isolation breached");
  } catch (e) {
    console.log("PASS: Tenant isolation enforced");
  }

  console.log("Runtime Proof Finished.");
}

runTest().catch(console.error);
