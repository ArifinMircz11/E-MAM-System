import { BaseEntity } from "../entities/BaseEntity";
import { DatabaseResolver, type EMamDatabase } from "@/database/dexie";
import type { Table } from "dexie";
import type { SecurityContext } from "@/core/security/types";
import { getSecurityContext } from "@/core/security/contextHelper";
import { SyncStatus } from "@/domain/entities/base";
import { ArchitectureBoundaryEnforcer } from "@/core/boundary/ArchitectureBoundaryEnforcer";
import { ArchitectureBoundaryError } from "@/core/boundary/ArchitectureBoundaryError";

export abstract class BaseRepository<T extends BaseEntity> {
  protected tableName?: string;
  private _table?: Table<T, any>;

  constructor(tableName?: string) {
    let tName = tableName;
    if (!tName) {
      const baseName = this.constructor.name.replace('Repository', '').replace('Impl', '');
      const map: Record<string, string> = {
        Class: 'classes', AcademicYear: 'academic_years', Semester: 'semesters', Day: 'days', Subject: 'subjects', Room: 'rooms', Teacher: 'teachers', Student: 'students', Attendance: 'attendance', TeacherAttendance: 'teacher_attendance', Journal: 'journals', Grade: 'penilaian', Letter: 'letters', PointCategory: 'point_categories', Point: 'points', PointSummary: 'student_point_summaries', Notification: 'notifications', NotificationLog: 'notificationLogs', Audit: 'audit_logs', User: 'users', UserRole: 'users', UserApproval: 'users', UserSession: 'user_sessions', UserDevice: 'user_devices', LoginLog: 'loginLog', ProfileRequest: 'profile_update_requests', Approval: 'approval_requests', Complaint: 'complaints', Chat: 'chats', Message: 'messages', Event: 'events', Ticker: 'ticker', Documentation: 'documentation', Assignment: 'assignments', Submission: 'submissions', FaqCategory: 'faq_categories', Faq: 'faqs', FaqFeedback: 'faq_feedback', QuickReply: 'quick_replies', SupportAgent: 'support_agents', SupportConversation: 'support_conversations', SupportMessage: 'support_messages', SupportTicket: 'support_tickets', ServiceSurvey: 'service_surveys', SurveyQuestion: 'survey_questions', SurveyAnswer: 'survey_answers', SurveyTemplate: 'survey_templates', SurveyStatistics: 'survey_statistics', DashboardSummary: 'dashboard_summaries', Tenant: 'madrasah', StudentParent: 'student_parents', Schedule: 'schedules', ScheduleException: 'schedule_exceptions', ScheduleLog: 'schedule_logs', TimeSlot: 'time_slots', TeacherAssignment: 'teacher_assignments',
      };
      tName = map[baseName] || baseName.toLowerCase() + 's';
    }
    this.tableName = tName;
  }

  public get db(): EMamDatabase { return (this._table as any)?.db || DatabaseResolver.getDatabase(); }
  public get table(): Table<T, any> { return this.db.table<T>(this.tableName || 'unknown'); }
  public set table(t: Table<T, any>) { this._table = t; if (t?.name) this.tableName = t.name; }
  protected getTable(): Table<T, any> { return this.table; }

  protected validateContext(context: SecurityContext, operation: string): void {
    if (!context || !context.tenantId || typeof context.tenantId !== 'string' || context.tenantId.trim() === '' || context.tenantId === 'default' || context.tenantId === 'unknown') throw new ArchitectureBoundaryError('repository', 'REPOSITORY_TENANT_MISSING', `Operasi repository '${operation}' ditolak: tenantId tidak valid.`);
    ArchitectureBoundaryEnforcer.enforceRepositoryTenant(context.tenantId, operation, Boolean(context.isDeveloper && context.scope?.level === 'global'));
  }

  private assertEntityTenant(context: SecurityContext, entity: Partial<T> | T | undefined, operation: string): void {
    this.validateContext(context, operation);
    const entityTenantId = (entity as any)?.tenantId;
    if (!context.isDeveloper && entityTenantId && entityTenantId !== context.tenantId) throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', `Tenant mismatch pada '${operation}': '${entityTenantId}' !== '${context.tenantId}'.`, { entityTenantId, contextTenantId: context.tenantId });
  }

  async saveBatch(context: SecurityContext, entities: T[] | Partial<T>[]): Promise<T[]> {
    this.validateContext(context, 'saveBatch');
    const table = this.getTable(); const dbInstance = this.db; const tName = this.tableName || table.name; const prepared: T[] = []; const queueItems: Record<string, unknown>[] = []; const now = Date.now();
    for (const raw of entities) {
      this.assertEntityTenant(context, raw, 'saveBatch');
      const entity = { ...(raw as Partial<T>) } as T; const existing = entity.id ? await table.get(entity.id) : undefined;
      if (existing && !context.isDeveloper && (existing as any).tenantId !== context.tenantId) throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', `Record '${entity.id}' bukan milik tenant aktif.`);
      const id = entity.id || this.generateId(); const isCreate = !existing; const currentVersion = Number((existing as any)?.version ?? 0); const requestedVersion = Number((entity as any).version ?? 0); const nextVersion = isCreate ? Math.max(1, requestedVersion) : Math.max(currentVersion + 1, requestedVersion);
      const dataToSave = { ...existing, ...entity, id, tenantId: context.tenantId, syncStatus: SyncStatus.PENDING, version: nextVersion, updatedAt: now, ...(isCreate ? { createdAt: Number((entity as any).createdAt ?? now) } : {}) } as T & Record<string, any>;
      prepared.push(dataToSave as T); queueItems.push({ id: this.generateQueueId(id, nextVersion), tenantId: context.tenantId, collection: tName, operation: isCreate ? 'create' : 'update', recordId: id, payload: dataToSave, status: 'pending', attempts: 0, createdAt: now, updatedAt: now, priority: 'high', metadata: { actorId: context.uid, version: nextVersion, idempotencyKey: `${context.tenantId}:${tName}:${id}:${nextVersion}`, action: isCreate ? 'CREATE' : 'UPDATE' } });
    }
    await dbInstance.transaction('rw', [dbInstance.table(tName), dbInstance.table('sync_queue')], async () => { await table.bulkPut(prepared as any); if (queueItems.length) await dbInstance.table('sync_queue').bulkPut(queueItems as any); });
    return prepared;
  }

  async findById(id: string, tenantId?: string): Promise<T | null> {
    const context = getSecurityContext(true); this.validateContext(context, 'findById'); const entity = await this.getTable().get(id); if (!entity || (entity as any).deleted === true) return null;
    if (!context.isDeveloper && (entity as any).tenantId !== context.tenantId) return null;
    if (tenantId && tenantId !== context.tenantId && !context.isDeveloper) throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', 'Tenant filter berbeda dari SecurityContext.');
    return entity;
  }

  async findAll(tenantId: string): Promise<T[]> {
    const context = getSecurityContext(true); this.validateContext(context, 'findAll');
    if (!context.isDeveloper && tenantId !== context.tenantId) throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', 'Tenant query berbeda dari SecurityContext.');
    const rows = context.isDeveloper && tenantId === 'global' && context.scope?.level === 'global' ? await this.getTable().toArray() : await this.getTable().where('tenantId').equals(context.tenantId).toArray();
    return rows.filter((row: any) => row.deleted !== true);
  }

  async getById(context: SecurityContext, id: string): Promise<T | null> { this.validateContext(context, 'getById'); const entity = await this.getTable().get(id); if (!entity || (entity as any).deleted === true) return null; if (!context.isDeveloper && (entity as any).tenantId !== context.tenantId) return null; return entity; }
  async getAll(context: SecurityContext): Promise<T[]> { this.validateContext(context, 'getAll'); const rows = context.isDeveloper && context.tenantId === 'global' && context.scope?.level === 'global' ? await this.getTable().toArray() : await this.getTable().where('tenantId').equals(context.tenantId).toArray(); return rows.filter((row: any) => row.deleted !== true); }

  async save(context: SecurityContext, entity: Partial<T>): Promise<T> {
    this.assertEntityTenant(context, entity, 'save'); const table = this.getTable(); const dbInstance = this.db; const tName = this.tableName || table.name || 'students'; const input = { ...(entity as Partial<T>) } as T & Record<string, any>; const existing = input.id ? await table.get(input.id) : undefined;
    if (existing && !context.isDeveloper && (existing as any).tenantId !== context.tenantId) throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', `Record '${input.id}' bukan milik tenant aktif.`);
    const isCreate = !existing; const id = input.id || this.generateId(); const currentVersion = Number((existing as any)?.version ?? 0); const requestedVersion = Number(input.version ?? 0); const nextVersion = isCreate ? Math.max(1, requestedVersion) : Math.max(currentVersion + 1, requestedVersion); const now = Date.now();
    const dataToSave = { ...existing, ...input, id, tenantId: context.tenantId, syncStatus: SyncStatus.PENDING, version: nextVersion, deleted: false, deletedAt: undefined, updatedAt: now, ...(isCreate ? { createdAt: Number(input.createdAt ?? now) } : {}) } as T & Record<string, any>;
    const queueItem = { id: this.generateQueueId(id, nextVersion), tenantId: context.tenantId, collection: tName, operation: isCreate ? 'create' : 'update', recordId: id, payload: dataToSave, status: 'pending', attempts: 0, createdAt: now, updatedAt: now, priority: 'high', metadata: { actorId: context.uid, version: nextVersion, idempotencyKey: `${context.tenantId}:${tName}:${id}:${nextVersion}`, action: isCreate ? 'CREATE' : 'UPDATE' } };
    await dbInstance.transaction('rw', [dbInstance.table(tName), dbInstance.table('sync_queue')], async () => { await table.put(dataToSave as T); if (tName !== 'sync_queue' && tName !== 'login_logs') await dbInstance.table('sync_queue').put(queueItem as any); });
    return dataToSave as T;
  }

  async create(...args: [SecurityContext, Partial<T>] | [T]): Promise<T | void> { const context = args.length === 2 ? args[0] : getSecurityContext(true); const entity = (args.length === 2 ? args[1] : args[0]) as Partial<T>; this.assertEntityTenant(context, entity, 'create'); if ((entity as any).id && await this.getTable().get((entity as any).id)) throw new ArchitectureBoundaryError('repository', 'REPOSITORY_CREATE_CONFLICT', `Create ditolak: entity '${(entity as any).id}' sudah ada.`); return this.save(context, entity); }

  async delete(context: SecurityContext, id: string): Promise<void> {
    this.validateContext(context, 'delete'); const table = this.getTable(); const dbInstance = this.db; const tName = this.tableName || table.name || 'students'; const existing = await table.get(id); if (!existing || (!context.isDeveloper && (existing as any).tenantId !== context.tenantId)) return;
    const now = Date.now(); const currentVersion = Number((existing as any).version ?? 0); const nextVersion = currentVersion + 1; const tombstone = { ...(existing as any), id, tenantId: context.tenantId, version: nextVersion, syncStatus: SyncStatus.PENDING, deleted: true, deletedAt: now, updatedAt: now };
    const queueItem = { id: this.generateQueueId(id, nextVersion), tenantId: context.tenantId, collection: tName, operation: 'delete', recordId: id, payload: tombstone, status: 'pending', attempts: 0, createdAt: now, updatedAt: now, priority: 'high', metadata: { actorId: context.uid, version: nextVersion, idempotencyKey: `${context.tenantId}:${tName}:${id}:${nextVersion}`, action: 'DELETE' } };
    await dbInstance.transaction('rw', [dbInstance.table(tName), dbInstance.table('sync_queue')], async () => { await table.put(tombstone as T); if (tName !== 'sync_queue' && tName !== 'login_logs') await dbInstance.table('sync_queue').put(queueItem as any); });
  }

  private generateId(): string { return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `ID_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }
  private generateQueueId(recordId: string, version: number): string { return `SYNC_${this.generateId()}_${recordId}_${version}`; }
}
