import { BaseEntity } from "../entities/BaseEntity";
import { localDb, DatabaseResolver, type EMamDatabase } from "@/database/dexie";
import type { Table } from "dexie";
import type { SecurityContext } from "@/core/security/types";
import { getSecurityContext } from "@/core/security/contextHelper";
import { syncRepository } from "./SyncRepository";
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
        Class: 'classes', AcademicYear: 'academic_years', Semester: 'semesters', Day: 'days', Subject: 'subjects', Room: 'rooms',
        Teacher: 'teachers', Student: 'students', Attendance: 'attendance', TeacherAttendance: 'teacher_attendance', Journal: 'journals',
        Grade: 'penilaian', Letter: 'letters', PointCategory: 'point_categories', Point: 'points', PointSummary: 'student_point_summaries',
        Notification: 'notifications', NotificationLog: 'notificationLogs', Audit: 'audit_logs', User: 'users', UserRole: 'users',
        UserApproval: 'users', UserSession: 'user_sessions', UserDevice: 'user_devices', LoginLog: 'loginLog', ProfileRequest: 'profile_update_requests',
        Approval: 'approval_requests', Complaint: 'complaints', Chat: 'chats', Message: 'messages', Event: 'events', Ticker: 'ticker',
        Documentation: 'documentation', Assignment: 'assignments', Submission: 'submissions', FaqCategory: 'faq_categories', Faq: 'faqs',
        FaqFeedback: 'faq_feedback', QuickReply: 'quick_replies', SupportAgent: 'support_agents', SupportConversation: 'support_conversations',
        SupportMessage: 'support_messages', SupportTicket: 'support_tickets', ServiceSurvey: 'service_surveys', SurveyQuestion: 'survey_questions',
        SurveyAnswer: 'survey_answers', SurveyTemplate: 'survey_templates', SurveyStatistics: 'survey_statistics', DashboardSummary: 'dashboard_summaries',
        Tenant: 'madrasah', StudentParent: 'student_parents', Schedule: 'schedules', ScheduleException: 'schedule_exceptions', ScheduleLog: 'schedule_logs',
        TimeSlot: 'time_slots', TeacherAssignment: 'teacher_assignments',
      };
      tName = map[baseName] || baseName.toLowerCase() + 's';
    }
    this.tableName = tName;
  }

  public get db(): EMamDatabase {
    return (this._table as any)?.db || DatabaseResolver.getDatabase();
  }

  public get table(): Table<T, any> {
    const activeDb = this.db;
    return activeDb.table<T>(this.tableName || 'unknown');
  }

  public set table(t: Table<T, any>) {
    this._table = t;
    if (t?.name) this.tableName = t.name;
  }

  async saveBatch(entities: T[]): Promise<void>;
  async saveBatch(context: SecurityContext, entities: T[] | Partial<T>[]): Promise<T[]>;
  async saveBatch(arg1: SecurityContext | T[], arg2?: T[] | Partial<T>[]): Promise<T[] | void> {
    const table = this.getTable();
    const dbInstance = this.db;
    const tName = this.tableName || table.name;
    const context = arg2 !== undefined ? (arg1 as SecurityContext) : undefined;
    const input = (arg2 !== undefined ? arg2 : arg1) as T[] | Partial<T>[];

    if (!context) {
      await table.bulkPut(input as T[]);
      return;
    }

    this.validateContext(context, 'saveBatch');
    const prepared: T[] = [];
    const queueItems: Record<string, unknown>[] = [];
    const now = Date.now();

    for (const raw of input) {
      const entity = { ...(raw as Partial<T>) } as T;
      const existing = entity.id ? await table.get(entity.id) : undefined;
      const id = entity.id || this.generateId();
      const isCreate = !existing;
      const currentVersion = Number((existing as any)?.version ?? 0);
      const requestedVersion = Number((entity as any).version ?? 0);
      const nextVersion = isCreate ? Math.max(1, requestedVersion) : Math.max(currentVersion + 1, requestedVersion);
      const dataToSave = {
        ...existing,
        ...entity,
        id,
        tenantId: context.tenantId,
        syncStatus: SyncStatus.PENDING,
        version: nextVersion,
        updatedAt: now,
        ...(isCreate ? { createdAt: Number((entity as any).createdAt ?? now) } : {}),
      } as T & Record<string, any>;

      if (dataToSave.tenantId !== context.tenantId && !context.isDeveloper) {
        throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', `Tenant mismatch pada batch repository: '${dataToSave.tenantId}' !== '${context.tenantId}'.`);
      }

      prepared.push(dataToSave as T);
      queueItems.push({
        id: this.generateQueueId(id, nextVersion),
        tenantId: context.tenantId,
        collection: tName,
        operation: isCreate ? 'create' : 'update',
        recordId: id,
        payload: dataToSave,
        status: 'pending',
        attempts: 0,
        createdAt: now,
        updatedAt: now,
        priority: 'high',
        metadata: {
          actorId: context.uid,
          version: nextVersion,
          idempotencyKey: `${context.tenantId}:${tName}:${id}:${nextVersion}`,
          action: isCreate ? 'CREATE' : 'UPDATE',
        },
      });
    }

    await dbInstance.transaction('rw', [dbInstance.table(tName), dbInstance.table('sync_queue')], async () => {
      await table.bulkPut(prepared as any);
      if (queueItems.length) await dbInstance.table('sync_queue').bulkPut(queueItems as any);
    });

    return prepared;
  }

  protected getTable(): Table<T, any> { return this.table; }

  protected validateContext(context: SecurityContext, operation: string): void {
    if (!context || !context.tenantId || typeof context.tenantId !== 'string' || context.tenantId.trim() === '' || context.tenantId === 'default' || context.tenantId === 'unknown') {
      throw new ArchitectureBoundaryError('repository', 'REPOSITORY_TENANT_MISSING', `Operasi repository '${operation}' ditolak: SecurityContext bernilai null, undefined, atau memiliki tenantId yang tidak valid/fallback.`);
    }
    ArchitectureBoundaryEnforcer.enforceRepositoryTenant(context.tenantId, operation, context.isDeveloper);
  }

  async findById(id: string, tenantId?: string): Promise<T | null> {
    const entity = await this.getTable().get(id);
    if (!entity) return null;
    if (tenantId && tenantId !== 'global' && (entity as any).tenantId !== tenantId) return null;
    return entity;
  }

  async findAll(tenantId: string): Promise<T[]> {
    ArchitectureBoundaryEnforcer.enforceRepositoryTenant(tenantId, 'findAll', tenantId === 'global');
    if (tenantId === 'global') return await this.getTable().toArray();
    return await this.getTable().where('tenantId').equals(tenantId).toArray();
  }

  async getById(context: SecurityContext, id: string): Promise<T | null> {
    this.validateContext(context, 'getById');
    const entity = await this.getTable().get(id);
    if (entity && !context.isDeveloper && (entity as any).tenantId !== context.tenantId) return null;
    return entity || null;
  }

  async getAll(context: SecurityContext): Promise<T[]> {
    this.validateContext(context, 'getAll');
    if (context.isDeveloper || context.tenantId === 'global') return await this.getTable().toArray();
    return await this.getTable().where('tenantId').equals(context.tenantId).toArray();
  }

  async save(context: SecurityContext, entity: Partial<T>): Promise<T>;
  async save(entity: T): Promise<void>;
  async save(arg1: SecurityContext | T, arg2?: Partial<T>): Promise<T | void> {
    const table = this.getTable();
    const dbInstance = this.db;
    const tName = this.tableName || table.name || 'students';

    if (arg2 === undefined) {
      await table.put(arg1 as T);
      return;
    }

    const context = arg1 as SecurityContext;
    this.validateContext(context, 'save');
    const input = { ...(arg2 as Partial<T>) } as T & Record<string, any>;
    const existing = input.id ? await table.get(input.id) : undefined;
    const isCreate = !existing;
    const id = input.id || this.generateId();
    const currentVersion = Number((existing as any)?.version ?? 0);
    const requestedVersion = Number(input.version ?? 0);
    const nextVersion = isCreate ? Math.max(1, requestedVersion) : Math.max(currentVersion + 1, requestedVersion);

    if (input.tenantId && input.tenantId !== context.tenantId && !context.isDeveloper) {
      throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', `Tenant mismatch pada penyimpanan repository: '${input.tenantId}' !== '${context.tenantId}'.`, { entityTenant: input.tenantId, contextTenant: context.tenantId });
    }

    const now = Date.now();
    const dataToSave = {
      ...existing,
      ...input,
      id,
      tenantId: context.tenantId,
      syncStatus: SyncStatus.PENDING,
      version: nextVersion,
      updatedAt: now,
      ...(isCreate ? { createdAt: Number(input.createdAt ?? now) } : {}),
    } as T & Record<string, any>;

    const queueItem = {
      id: this.generateQueueId(id, nextVersion),
      tenantId: context.tenantId,
      collection: tName,
      operation: isCreate ? 'create' : 'update',
      recordId: id,
      payload: dataToSave,
      status: 'pending',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      priority: 'high',
      metadata: {
        actorId: context.uid,
        version: nextVersion,
        idempotencyKey: `${context.tenantId}:${tName}:${id}:${nextVersion}`,
        action: isCreate ? 'CREATE' : 'UPDATE',
      },
    };

    await dbInstance.transaction('rw', [dbInstance.table(tName), dbInstance.table('sync_queue')], async () => {
      await table.put(dataToSave as T);
      if (tName !== 'sync_queue' && tName !== 'login_logs') await dbInstance.table('sync_queue').put(queueItem as any);
    });

    return dataToSave as T;
  }

  /**
   * Canonical create contract plus a one-argument compatibility form.
   * The one-argument form resolves the authoritative runtime SecurityContext;
   * it does not accept tenant/actor identity from the entity as authority.
   */
  async create(...args: [SecurityContext, Partial<T>] | [T]): Promise<T | void> {
    const context = args.length === 2 ? args[0] : getSecurityContext(true);
    const entity = (args.length === 2 ? args[1] : args[0]) as Partial<T>;
    this.validateContext(context, 'create');
    if ((entity as any).id && await this.getTable().get((entity as any).id)) {
      throw new ArchitectureBoundaryError('repository', 'REPOSITORY_CREATE_CONFLICT', `Create ditolak: entity '${(entity as any).id}' sudah ada.`);
    }
    return this.save(context, entity);
  }

  async delete(arg1: SecurityContext | string, arg2?: string): Promise<void> {
    const table = this.getTable();
    const dbInstance = this.db;
    const tName = this.tableName || table.name || 'students';
    if (typeof arg1 === 'string') {
      const id = arg1;
      const tenantId = arg2;
      if (tenantId && tenantId !== 'global') {
        const existing = await table.get(id);
        if (existing && (existing as any).tenantId === tenantId) await table.delete(id);
      } else await table.delete(id);
      return;
    }

    const context = arg1 as SecurityContext;
    const id = arg2 as string;
    this.validateContext(context, 'delete');
    const existing = await table.get(id);
    if (!existing || (!context.isDeveloper && (existing as any).tenantId !== context.tenantId)) return;

    const now = Date.now();
    const currentVersion = Number((existing as any).version ?? 0);
    const nextVersion = currentVersion + 1;
    const tombstone = {
      ...(existing as any),
      id,
      tenantId: context.tenantId,
      version: nextVersion,
      syncStatus: SyncStatus.PENDING,
      deleted: true,
      deletedAt: now,
      updatedAt: now,
    };
    const queueItem = {
      id: this.generateQueueId(id, nextVersion),
      tenantId: context.tenantId,
      collection: tName,
      operation: 'delete',
      recordId: id,
      payload: tombstone,
      status: 'pending',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      priority: 'high',
      metadata: {
        actorId: context.uid,
        version: nextVersion,
        idempotencyKey: `${context.tenantId}:${tName}:${id}:${nextVersion}`,
        action: 'DELETE',
      },
    };

    await dbInstance.transaction('rw', [dbInstance.table(tName), dbInstance.table('sync_queue')], async () => {
      await table.delete(id);
      if (tName !== 'sync_queue' && tName !== 'login_logs') await dbInstance.table('sync_queue').put(queueItem as any);
    });
  }

  private generateId(): string {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `ID_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private generateQueueId(recordId: string, version: number): string {
    return `SYNC_${this.generateId()}_${recordId}_${version}`;
  }
}
