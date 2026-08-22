import { SyncStatus } from "@/domain/entities/base";
import type { PointTransaction } from "@/domain/entities/point";
import { getSecurityContext } from "@/core/security/contextHelper";
import { syncRepository } from "./SyncRepository";
import { BaseRepository } from "./base/BaseRepository";

/**
 * PointRepository
 *
 * Dexie is the operational source of truth. Every mutation is committed
 * locally together with its canonical SyncQueue entry before cloud sync.
 */
export class PointRepository extends BaseRepository<PointTransaction> {
  constructor() {
    super("points");
  }

  async findById(id: string, tenantId: string): Promise<PointTransaction | null> {
    return (
      (await this.table.where("id").equals(id).filter((p) => p.tenantId === tenantId).first()) || null
    );
  }

  async findAll(tenantId: string): Promise<PointTransaction[]> {
    return await this.table.where("tenantId").equals(tenantId).toArray();
  }

  async create(entity: PointTransaction): Promise<void> {
    const dbInstance = this.db;
    await dbInstance.transaction("rw", [dbInstance.points, dbInstance.sync_queue], async () => {
      const now = Date.now();
      const dataToSave = { ...entity, version: 1, syncStatus: SyncStatus.PENDING as SyncStatus, updatedAt: now };
      await dbInstance.points.add(dataToSave);
      await syncRepository.enqueue({
        collection: "points", operation: "create", recordId: entity.id, payload: dataToSave,
        tenantId: entity.tenantId,
        metadata: { idempotencyKey: `point/${entity.id}:create:v1`, version: 1 },
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import("@/services/SyncEngine")).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: PointTransaction): Promise<void> {
    const dbInstance = this.db;
    await dbInstance.transaction("rw", [dbInstance.points, dbInstance.sync_queue], async () => {
      const existing = await dbInstance.points.get(entity.id);
      if (!existing) throw new Error("Point record not found");
      if (existing.tenantId !== entity.tenantId) throw new Error("Tenant mismatch");
      const newVersion = (existing.version || 0) + 1;
      const now = Date.now();
      const dataToSave = { ...entity, version: newVersion, syncStatus: SyncStatus.PENDING as SyncStatus, updatedAt: now };
      await dbInstance.points.put(dataToSave);
      await syncRepository.enqueue({
        collection: "points", operation: "update", recordId: entity.id, payload: dataToSave,
        tenantId: entity.tenantId,
        metadata: { idempotencyKey: `point/${entity.id}:update:v${newVersion}`, version: newVersion },
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import("@/services/SyncEngine")).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dbInstance = this.db;
    await dbInstance.transaction("rw", [dbInstance.points, dbInstance.sync_queue], async () => {
      const existing = await dbInstance.points.get(id);
      if (!existing) return;
      if (existing.tenantId !== tenantId) throw new Error("Tenant mismatch");
      const deleteVersion = (existing.version || 0) + 1;
      await dbInstance.points.delete(id);
      await syncRepository.enqueue({
        collection: "points", operation: "delete", recordId: id,
        payload: { id, tenantId, version: deleteVersion }, tenantId,
        metadata: { idempotencyKey: `point/${id}:delete:v${deleteVersion}`, version: deleteVersion },
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import("@/services/SyncEngine")).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(_tenantId: string): Promise<void> {
    // Pull/snapshot reconciliation is owned by the SyncEngine.
  }

  async getByStudent(studentId: string, tenantId?: string): Promise<PointTransaction[]> {
    const context = getSecurityContext(true);
    const activeTenantId = tenantId || context.tenantId;
    if (!context.isDeveloper && activeTenantId !== context.tenantId) {
      throw new Error("TENANT_ACCESS_DENIED");
    }
    return await this.table.where("tenantId").equals(activeTenantId).filter(
      (p: PointTransaction) => p.studentsId === studentId || p.studentId === studentId,
    ).toArray();
  }

  async getByClassAndMonth(tenantId: string, className: string, month: string): Promise<PointTransaction[]> {
    const context = getSecurityContext(true);
    if (!context.isDeveloper && tenantId !== context.tenantId) {
      throw new Error("TENANT_ACCESS_DENIED");
    }
    return await this.table.where("tenantId").equals(tenantId).filter(
      (p) => !!p.date?.startsWith(month) &&
        (className === "All" || className === "Semua" || p.className === className),
    ).toArray();
  }
}

export const pointRepository = new PointRepository();
