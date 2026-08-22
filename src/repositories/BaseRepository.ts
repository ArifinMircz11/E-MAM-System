import { BaseEntity } from "../entities/BaseEntity";
import { DatabaseResolver, type EMamDatabase } from "@/database/dexie";
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
      const baseName = this.constructor.name.replace("Repository", "").replace("Impl", "");
      const map: Record<string, string> = {
        Class: "classes", AcademicYear: "academic_years", Semester: "semesters", Day: "days", Subject: "subjects", Room: "rooms",
        Teacher: "teachers", Student: "students", Attendance: "attendance", TeacherAttendance: "teacher_attendance", Journal: "journals",
        Grade: "penilaian", Letter: "letters", PointCategory: "point_categories", Point: "points", PointSummary: "student_point_summaries",
        Notification: "notifications", NotificationLog: "notificationLogs", Audit: "audit_logs", User: "users", UserRole: "users",
        UserApproval: "users", UserSession: "user_sessions", UserDevice: "user_devices", LoginLog: "loginLog",
        ProfileRequest: "profile_update_requests", Approval: "approval_requests", Complaint: "complaints", Chat: "chats", Message: "messages",
        Event: "events", Ticker: "ticker", Documentation: "documentation", Assignment: "assignments", Submission: "submissions",
        FaqCategory: "faq_categories", Faq: "faqs", FaqFeedback: "faq_feedback", QuickReply: "quick_replies", SupportAgent: "support_agents",
        SupportConversation: "support_conversations", SupportMessage: "support_messages", SupportTicket: "support_tickets", ServiceSurvey: "service_surveys",
        SurveyQuestion: "survey_questions", SurveyAnswer: "survey_answers", SurveyTemplate: "survey_templates", SurveyStatistics: "survey_statistics",
        DashboardSummary: "dashboard_summaries", Tenant: "madrasah", StudentParent: "student_parents", Schedule: "schedules",
        ScheduleException: "schedule_exceptions", ScheduleLog: "schedule_logs", TimeSlot: "time_slots", TeacherAssignment: "teacher_assignments",
      };
      tName = map[baseName] || baseName.toLowerCase() + "s";
    }
    this.tableName = tName;
  }

  public get db(): EMamDatabase {
    return (this._table as any)?.db || DatabaseResolver.getDatabase();
  }

  public get table(): Table<T, any> {
    return this.db.table<T>(this.tableName || "unknown");
  }

  public set table(t: Table<T, any>) {
    this._table = t;
    if (t?.name) this.tableName = t.name;
  }

  protected getTable(): Table<T, any> {
    return this.table;
  }

  protected validateContext(context: SecurityContext, operation: string): void {
    if (!context || !context.tenantId || typeof context.tenantId !== "string" || context.tenantId.trim() === "" || context.tenantId === "default" || context.tenantId === "unknown") {
      throw new ArchitectureBoundaryError(
        "repository",
        "REPOSITORY_TENANT_MISSING",
        `Operasi repository '${operation}' ditolak: tenantId tidak valid.`
      );
    }
    ArchitectureBoundaryEnforcer.enforceRepositoryTenant(context.tenantId, operation, context.isDeveloper);
  }

  private assertEntityTenant(context: SecurityContext, entity: Partial<T>): void {
    if (!context.isDeveloper && entity.tenantId && entity.tenantId !== "global" && entity.tenantId !== context.tenantId) {
      throw new ArchitectureBoundaryError(
        "tenant",
        "TENANT_ACCESS_DENIED",
        `Tenant mismatch pada repository: '${entity.tenantId}' !== '${context.tenantId}'.`,
        { entityTenant: entity.tenantId, contextTenant: context.tenantId }
      );
    }
  }

  private prepareEntity(context: SecurityContext, entity: Partial<T>): T {
    this.assertEntityTenant(context, entity);
    const now = Date.now();
    const id = entity.id || crypto.randomUUID();
    return {
      ...entity,
      id,
      tenantId: context.tenantId,
      syncStatus: (entity as any).syncStatus || SyncStatus.PENDING,
      createdAt: (entity as any).createdAt || now,
      updatedAt: now,
    } as T;
  }

  private async enqueueMutation(
    dbInstance: EMamDatabase,
    context: SecurityContext,
    operation: "create" | "update" | "delete",
    payload: unknown,
    recordId: string,
  ): Promise<void> {
    const collection = this.tableName || this.getTable().name;
    await syncRepository.enqueue(
      {
        tenantId: context.tenantId,
        collection,
        operation,
        recordId,
        payload,
      },
      context,
      { triggerSync: false, db: dbInstance },
    );
  }

  async saveBatch(context: SecurityContext, entities: Partial<T>[]): Promise<T[]>;
  async saveBatch(entities: T[]): Promise<void>;
  async saveBatch(arg1: SecurityContext | T[], arg2?: Partial<T>[]): Promise<T[] | void> {
    if (Array.isArray(arg1)) {
      throw new ArchitectureBoundaryError(
        "repository",
        "CONTEXT_REQUIRED",
        "saveBatch(entities) tanpa SecurityContext tidak diizinkan pada operational repository."
      );
    }

    const context = arg1;
    this.validateContext(context, "saveBatch");
    const entities = arg2 ?? [];
    const table = this.getTable();
    const dbInstance = this.db;
    const prepared = entities.map((entity) => this.prepareEntity(context, entity));

    await dbInstance.transaction("rw", [table, dbInstance.sync_queue], async () => {
      for (const entity of prepared) {
        const existing = await table.get(entity.id!);
        await table.put(entity);
        await this.enqueueMutation(
          dbInstance,
          context,
          existing ? "update" : "create",
          entity,
          entity.id!,
        );
      }
    });

    return prepared;
  }

  async findById(id: string, tenantId?: string): Promise<T | null> {
    const entity = await this.getTable().get(id);
    if (!entity) return null;
    if (tenantId && tenantId !== "global" && (entity as any).tenantId !== tenantId) return null;
    return entity;
  }

  async findAll(tenantId: string): Promise<T[]> {
    ArchitectureBoundaryEnforcer.enforceRepositoryTenant(tenantId, "findAll", tenantId === "global");
    if (tenantId === "global") return this.getTable().toArray();
    return this.getTable().where("tenantId").equals(tenantId).toArray();
  }

  async getById(context: SecurityContext, id: string): Promise<T | null> {
    this.validateContext(context, "getById");
    const entity = await this.getTable().get(id);
    if (entity && !context.isDeveloper && (entity as any).tenantId !== context.tenantId) return null;
    return entity || null;
  }

  async getAll(context: SecurityContext): Promise<T[]> {
    this.validateContext(context, "getAll");
    if (context.isDeveloper || context.tenantId === "global") return this.getTable().toArray();
    return this.getTable().where("tenantId").equals(context.tenantId).toArray();
  }

  async save(context: SecurityContext, entity: Partial<T>): Promise<T>;
  async save(entity: T): Promise<void>;
  async save(arg1: SecurityContext | T, arg2?: Partial<T>): Promise<T | void> {
    if (arg2 === undefined) {
      throw new ArchitectureBoundaryError(
        "repository",
        "CONTEXT_REQUIRED",
        "save(entity) tanpa SecurityContext tidak diizinkan pada operational repository."
      );
    }

    const context = arg1 as SecurityContext;
    this.validateContext(context, "save");
    const table = this.getTable();
    const dbInstance = this.db;
    const entity = arg2;
    const existing = entity.id ? await table.get(entity.id) : undefined;
    const dataToSave = this.prepareEntity(context, entity);

    await dbInstance.transaction("rw", [table, dbInstance.sync_queue], async () => {
      await table.put(dataToSave);
      await this.enqueueMutation(
        dbInstance,
        context,
        existing ? "update" : "create",
        dataToSave,
        dataToSave.id!,
      );
    });

    return dataToSave;
  }

  async delete(context: SecurityContext, id: string): Promise<void> {
    this.validateContext(context, "delete");
    const table = this.getTable();
    const dbInstance = this.db;
    const existing = await table.get(id);
    if (!existing || (!context.isDeveloper && (existing as any).tenantId !== context.tenantId)) return;

    const payload = {
      id,
      tenantId: context.tenantId,
      deleted: true,
      deletedAt: Date.now(),
    };

    await dbInstance.transaction("rw", [table, dbInstance.sync_queue], async () => {
      await table.delete(id);
      await this.enqueueMutation(dbInstance, context, "delete", payload, id);
    });
  }
}
