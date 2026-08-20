import { BaseEntity } from "../entities/BaseEntity";
import { localDb, DatabaseResolver, type EMamDatabase } from "@/database/dexie";
import type { Table } from "dexie";
import type { SecurityContext } from "@/core/security/types";
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
        Class: 'classes',
        AcademicYear: 'academic_years',
        Semester: 'semesters',
        Day: 'days',
        Subject: 'subjects',
        Room: 'rooms',
        Teacher: 'teachers',
        Student: 'students',
        Attendance: 'attendance',
        TeacherAttendance: 'teacher_attendance',
        Journal: 'journals',
        Grade: 'penilaian',
        Letter: 'letters',
        PointCategory: 'point_categories',
        Point: 'points',
        PointSummary: 'student_point_summaries',
        Notification: 'notifications',
        NotificationLog: 'notificationLogs',
        Audit: 'audit_logs',
        User: 'users',
        UserRole: 'users',
        UserApproval: 'users',
        UserSession: 'user_sessions',
        UserDevice: 'user_devices',
        LoginLog: 'loginLog',
        ProfileRequest: 'profile_update_requests',
        Approval: 'approval_requests',
        Complaint: 'complaints',
        Chat: 'chats',
        Message: 'messages',
        Event: 'events',
        Ticker: 'ticker',
        Documentation: 'documentation',
        Assignment: 'assignments',
        Submission: 'submissions',
        FaqCategory: 'faq_categories',
        Faq: 'faqs',
        FaqFeedback: 'faq_feedback',
        QuickReply: 'quick_replies',
        SupportAgent: 'support_agents',
        SupportConversation: 'support_conversations',
        SupportMessage: 'support_messages',
        SupportTicket: 'support_tickets',
        ServiceSurvey: 'service_surveys',
        SurveyQuestion: 'survey_questions',
        SurveyAnswer: 'survey_answers',
        SurveyTemplate: 'survey_templates',
        SurveyStatistics: 'survey_statistics',
        DashboardSummary: 'dashboard_summaries',
        Tenant: 'madrasah',
        StudentParent: 'student_parents',
        Schedule: 'schedules',
        ScheduleException: 'schedule_exceptions',
        ScheduleLog: 'schedule_logs',
        TimeSlot: 'time_slots',
        TeacherAssignment: 'teacher_assignments',
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
    if (t?.name) {
      this.tableName = t.name;
    }
  }

  async saveBatch(entities: T[]): Promise<void>;
  async saveBatch(context: SecurityContext, entities: T[] | Partial<T>[]): Promise<void>;
  async saveBatch(arg1: SecurityContext | T[], arg2?: T[] | Partial<T>[]): Promise<void> {
    const table = this.getTable();
    const dbInstance = this.db;
    const tName = this.tableName || table.name;
    const entities = arg2 !== undefined ? (arg2 as T[]) : (arg1 as T[]);
    await dbInstance.transaction('rw', [dbInstance.table(tName)], async () => {
      await table.bulkPut(entities as any);
    });
  }

  protected getTable(): Table<T, any> {
    return this.table;
  }

  protected validateContext(context: SecurityContext, operation: string): void {
    if (!context || !context.tenantId || typeof context.tenantId !== 'string' || context.tenantId.trim() === '' || context.tenantId === 'default' || context.tenantId === 'unknown') {
      throw new ArchitectureBoundaryError(
        'repository',
        'REPOSITORY_TENANT_MISSING',
        `Operasi repository '${operation}' ditolak: SecurityContext bernilai null, undefined, atau memiliki tenantId yang tidak valid/fallback.`
      );
    }
    ArchitectureBoundaryEnforcer.enforceRepositoryTenant(context.tenantId, operation, context.isDeveloper);
  }

  // Native Dexie operations
  async findById(id: string, tenantId?: string): Promise<T | null> {
    const entity = await this.getTable().get(id);
    if (!entity) return null;
    if (tenantId && tenantId !== 'global' && (entity as any).tenantId !== tenantId) {
      return null;
    }
    return entity;
  }

  async findAll(tenantId: string): Promise<T[]> {
    ArchitectureBoundaryEnforcer.enforceRepositoryTenant(tenantId, 'findAll', tenantId === 'global');
    if (tenantId === 'global') {
      return await this.getTable().toArray();
    }
    return await this.getTable().where('tenantId').equals(tenantId).toArray();
  }

  // Context-aware operations
  async getById(context: SecurityContext, id: string): Promise<T | null> {
    this.validateContext(context, 'getById');
    const entity = await this.getTable().get(id);
    if (entity && !context.isDeveloper && (entity as any).tenantId !== context.tenantId) {
      return null;
    }
    return entity || null;
  }

  async getAll(context: SecurityContext): Promise<T[]> {
    this.validateContext(context, 'getAll');
    if (context.isDeveloper || context.tenantId === 'global') {
      return await this.getTable().toArray();
    }
    return await this.getTable().where('tenantId').equals(context.tenantId).toArray();
  }

  // Overloaded save signatures
  async save(context: SecurityContext, entity: Partial<T>): Promise<T>;
  async save(entity: T): Promise<void>;
  async save(arg1: SecurityContext | T, arg2?: Partial<T>): Promise<T | void> {
    const table = this.getTable();
    if (arg2 !== undefined) {
      const context = arg1 as SecurityContext;
      const entity = arg2 as T;
      this.validateContext(context, 'save');
      
      if (entity.tenantId && entity.tenantId !== 'global' && entity.tenantId !== context.tenantId && !context.isDeveloper) {
        throw new ArchitectureBoundaryError(
          'tenant',
          'TENANT_ACCESS_DENIED',
          `Tenant mismatch pada penyimpanan repository: '${entity.tenantId}' !== '${context.tenantId}'.`,
          { entityTenant: entity.tenantId, contextTenant: context.tenantId }
        );
      }

      const dataToSave = {
        ...entity,
        tenantId: context.tenantId,
        syncStatus: (entity as any).syncStatus || SyncStatus.PENDING,
        updatedAt: Date.now(),
      } as any;
      if (!dataToSave.id) {
        dataToSave.id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' 
          ? crypto.randomUUID() 
          : `ID_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        dataToSave.createdAt = Date.now();
      }

      const dbInstance = this.db;
      const tName = this.tableName || table.name || 'students';
      await dbInstance.transaction('rw', [dbInstance.table(tName), dbInstance.table('sync_queue')], async () => {
        await table.put(dataToSave);
        if (tName !== 'sync_queue' && tName !== 'login_logs') {
          const queueTable = dbInstance.table('sync_queue');
          if (queueTable) {
            await queueTable.put({
              id: `SYNC_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              tenantId: context.tenantId,
              collection: tName,
              operation: 'UPDATE',
              action: 'UPDATE',
              payload: dataToSave,
              status: 'pending',
              createdAt: Date.now(),
              priority: 'high',
            });
          }
        }
      });

      return dataToSave as T;
    } else {
      const entity = arg1 as T;
      await table.put(entity);
    }
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
        if (existing && (existing as any).tenantId === tenantId) {
          await table.delete(id);
        }
      } else {
        await table.delete(id);
      }
    } else {
      const context = arg1 as SecurityContext;
      const id = arg2 as string;
      this.validateContext(context, 'delete');
      const existing = await table.get(id);
      if (existing && (context.isDeveloper || (existing as any).tenantId === context.tenantId)) {
        await dbInstance.transaction('rw', [dbInstance.table(tName), dbInstance.table('sync_queue')], async () => {
          await table.delete(id);
          if (tName !== 'sync_queue' && tName !== 'login_logs') {
            const queueTable = dbInstance.table('sync_queue');
            if (queueTable) {
              await queueTable.put({
                id: `SYNC_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                tenantId: context.tenantId,
                collection: tName,
                operation: 'DELETE',
                action: 'DELETE',
                payload: { id, tenantId: context.tenantId, deleted: true, deletedAt: Date.now() },
                status: 'pending',
                createdAt: Date.now(),
                priority: 'high',
              });
            }
          }
        });
      }
    }
  }
}

