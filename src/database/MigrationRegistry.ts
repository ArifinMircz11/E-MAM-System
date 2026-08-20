import type { Dexie, Transaction } from 'dexie';

/**
 * Interface for a specific database migration step
 */
export interface MigrationStep {
  version: number;
  stores: { [key: string]: string | null };
  upgrade?: (tx: Transaction) => Promise<void> | void;
}

/**
 * MigrationRegistry manages the sequential application of database versions.
 * This ensures that the migration logic is decoupled from the main DB class.
 */
export class MigrationRegistry {
  private migrations: MigrationStep[] = [];

  /**
   * Registers a new migration version
   */
  register(step: MigrationStep) {
    this.migrations.push(step);
    // Ensure migrations are sorted by version
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Applies all registered migrations to a Dexie instance using a cumulative schema approach.
   * This is critical because in Dexie, omission of a table in a newer version's .stores()
   * call drops that table, and any mismatch in primary keys of existing tables triggers
   * "Not yet support for changing primary key" errors.
   */
  apply(db: Dexie) {
    const combinedSchema: { [key: string]: string | null } = {};
    for (const step of this.migrations) {
      for (const [table, index] of Object.entries(step.stores)) {
        if (index === null) {
          delete combinedSchema[table];
        } else {
          combinedSchema[table] = index;
        }
      }

      // Shallow copy the cumulative schema for this version's definition
      // We need to remove any nulls or deleted tables, but combinedSchema
      // already handles this by delete-ing.
      const currentSchema: { [key: string]: string } = {};
      for (const [table, index] of Object.entries(combinedSchema)) {
        if (index !== null) {
          currentSchema[table] = index;
        }
      }

      const v = db.version(step.version).stores(currentSchema);
      if (step.upgrade) {
        v.upgrade(step.upgrade);
      }
    }
  }

  /**
   * Generates the latest schema definition based on all migrations
   */
  getLatestSchema(): { [key: string]: string } {
    const combinedSchema: { [key: string]: string } = {};
    for (const step of this.migrations) {
      for (const [table, index] of Object.entries(step.stores)) {
        if (index === null) {
          delete combinedSchema[table];
        } else {
          combinedSchema[table] = index;
        }
      }
    }
    return combinedSchema;
  }
}

export const migrationRegistry = new MigrationRegistry();

// Re-register legacy versions for backward compatibility
migrationRegistry.register({
  version: 10,
  stores: {
    students: 'idUnik, nisn, tenantId, status, tingkatRombel, namaLengkap',
    teachers: 'teachersId, tenantId, sistemJangkar.jabatan',
    classes: 'name, tenantId, level, academicYear',
    pointCategories: 'id, type, tenantId',
    attendance:
      'id, studentsId, [tenantId+statusGlobal+date], [tenantId+class+date], [tenantId+studentsId+date], date',
    journals: 'id, tenantId, date, updatedAt',
    student_point_summaries: 'studentId, tenantId',
    pointRankings: 'studentId, tenantId',
    loginHistory: 'id, userId, tenantId, timestamp',
    notificationLogs: 'id, userId, tenantId, timestamp',
    letters: 'id, userId, tenantId, category, type, status',
    academicYears: 'id, name, isActive, tenantId',
    schedules: 'id, className, day, tenantId',
    documentation: 'id, category, tenantId',
    teacher_attendance: 'id, teachersId, date, [teachersId+date]',
    cache: 'key, expiresAt',
    systemSettings: 'key',
    syncQueue: 'id, type, status, createdAt',
    messages: 'id, senderId, conversationId, createdAt',
    conversations: 'id, lastMessageTimestamp, updatedAt, tenantId',
    messageParticipants: '[conversationId+idUnik], conversationId, idUnik',
    messageQueue: 'id, type, status, createdAt',
  },
});

// v15 baseline
migrationRegistry.register({
  version: 15,
  stores: {
    students: 'idUnik, nisn, tenantId, status, tingkatRombel, namaLengkap, className, classId',
    attendance:
      'id, studentsId, [tenantId+statusGlobal+date], [tenantId+class+date], [tenantId+studentsId+date], date, class, className, classId',
    syncQueue: 'id, type, collection, status, createdAt',
    deadLetterQueue: 'id, type, collection, createdAt',
    teacher_attendance: 'id, teachersId, date, tenantId, [teachersId+date]',
  },
});

// v17: Enterprise Architecture Refactor - Initial cleanup for PK changes
migrationRegistry.register({
  version: 17,
  stores: {
    // We MUST delete these tables first because their primary keys are changing in the next version.
    // Dexie/IndexedDB does not support changing primary key on existing stores.
    students: null,
    teachers: null,
    classes: null,
    student_point_summaries: null,
    pointRankings: null,
    // Other tables that don't change PK can be updated directly
    attendance:
      'id, tenantId, [tenantId+id], studentsId, [tenantId+studentsId], date, [tenantId+date], [tenantId+statusGlobal+date], [tenantId+classId+date], [tenantId+studentsId+date]',
    journals: 'id, tenantId, [tenantId+id], date, [tenantId+date], updatedAt',
    poin: 'id, tenantId, [tenantId+id], studentsId, [tenantId+studentsId], timestamp',
    sync_queue: 'id, tenantId, collection, status, createdAt',
    dead_letter_queue: 'id, tenantId, collection, createdAt',
    users: 'id, tenantId, [tenantId+id], uid, [tenantId+uid], email, [tenantId+email]',
    news: 'id, tenantId, [tenantId+id], category, isPublished',
  },
  upgrade: (tx) => {
    console.log('[Dexie] Upgraded database to v17: Cleaned up tables for Primary Key migration.');
  },
});

// v18: Recreate tables with new Primary Keys (id) and add missing tables
migrationRegistry.register({
  version: 18,
  stores: {
    // Recreating with standardized 'id' as PK
    students:
      'id, tenantId, [tenantId+id], [tenantId+idUnik], studentsId, [tenantId+studentsId], nisn, status, className, classId',
    teachers: 'id, tenantId, [tenantId+id], teachersId, [tenantId+teachersId]',
    classes: 'id, tenantId, [tenantId+id], name, [tenantId+name], level, academicYear, classId',
    student_point_summaries: 'id, tenantId, [tenantId+id], studentId, [tenantId+studentId]',
    pointRankings: 'id, tenantId, [tenantId+id], studentId, [tenantId+studentId]',

    // New tables from original v18
    audit_logs:
      'id, tenantId, [tenantId+id], action, timestamp, [tenantId+timestamp], userId, [tenantId+userId]',
    loginLog:
      'id, tenantId, [tenantId+id], timestamp, [tenantId+timestamp], userId, [tenantId+userId]',
    activityLog:
      'id, tenantId, [tenantId+id], timestamp, [tenantId+timestamp], userId, [tenantId+userId]',
    approval_requests: 'id, tenantId, [tenantId+id], status, type, createdAt, [tenantId+status]',
    complaints: 'id, tenantId, [tenantId+id], status, category, createdAt',
    profile_update_requests: 'id, tenantId, [tenantId+id], status, userId, createdAt',
  },
  upgrade: (tx) => {
    console.log(
      '[Dexie] Upgraded database to v18: Recreated tables with new PKs and added missing audit tables.',
    );
  },
});

// v19: Add missing tables explicitly so Dexie triggers an upgrade
migrationRegistry.register({
  version: 19,
  stores: {
    notifications: 'id, tenantId, [tenantId+id], userId, [tenantId+userId], type, isRead',
    points: 'id, tenantId, [tenantId+id], studentsId, [tenantId+studentsId], type, date',
    point_categories: 'id, tenantId, [tenantId+id], name, type, isActive',
    academic_years: 'id, tenantId, [tenantId+id], name, isActive',
    student_point_summaries:
      'id, tenantId, [tenantId+id], studentId, [tenantId+studentId], studentsId, [tenantId+studentsId]',
  },
  upgrade: (tx) => {
    console.log('[Dexie] Upgraded database to v19: Added missing tables.');
  },
});

// v20: Add syncMetadata table for delta sync cursor tracking
migrationRegistry.register({
  version: 20,
  stores: {
    syncMetadata: 'id, tenantId, entity, [tenantId+entity], lastSyncAt',
    academic_years: 'id, name, isActive, tenantId',
    academicYears: 'id, name, isActive, tenantId',
  },
  upgrade: (tx) => {
    console.log(
      '[Dexie] Upgraded database to v20: Added syncMetadata, academic_years and academicYears.',
    );
  },
});

// v21: Add missing tables explicitly so Dexie triggers an upgrade
migrationRegistry.register({
  version: 21,
  stores: {
    schedules: 'id, tenantId, [tenantId+id], className',
    documentation: 'id, tenantId, [tenantId+id], category',
    loginHistory: 'id, tenantId, [tenantId+id], userId, timestamp',
    notificationLogs: 'id, tenantId, [tenantId+id], userId, timestamp',
    letters: 'id, tenantId, [tenantId+id], category, type, status',
    conversations: 'id, tenantId, [tenantId+id], lastMessageTimestamp',
    messageParticipants: 'id, tenantId, [tenantId+id], conversationId, idUnik',
    messageQueue: 'id, tenantId, [tenantId+id], type, status',
  },
  upgrade: (tx) => {
    console.log(
      '[Dexie] Upgraded database to v21: Added missing tables (schedules, documentation, loginHistory, notificationLogs, letters, conversations, messageParticipants, messageQueue).',
    );
  },
});

// v22: Final Indonesian Schema and index migration for e-Mam System
migrationRegistry.register({
  version: 22,
  stores: {
    attendance:
      'id, tenantId, [tenantId+id], studentsId, [tenantId+studentsId], tanggal, [tenantId+tanggal], [tenantId+status+tanggal], [tenantId+classId+tanggal], [tenantId+studentsId+tanggal]',
  },
  upgrade: async (tx) => {
    console.log(
      '[Dexie] Upgraded database to v22: Migrating old field names (date -> tanggal, statusGlobal -> status, sessions format).',
    );
    try {
      await tx
        .table('attendance')
        .toCollection()
        .modify((record: any) => {
          if (record.date && !record.tanggal) {
            record.tanggal = record.date;
            delete record.date;
          }
          if (record.statusGlobal && !record.status) {
            record.status = record.statusGlobal;
            delete record.statusGlobal;
          }
          // Migrate old sessions object format to flat Indonesian session structure
          if (record.sessions) {
            if (!record.masuk && record.sessions.masuk) {
              record.masuk = {
                jam: record.sessions.masuk.time || record.sessions.masuk.jam || '',
                status: record.sessions.masuk.status || 'TS',
              };
            }
            if (!record.duha && record.sessions.duha) {
              record.duha = {
                jam: record.sessions.duha.time || record.sessions.duha.jam || '',
                status: record.sessions.duha.status || 'TS',
              };
            }
            if (!record.zuhur && record.sessions.zuhur) {
              record.zuhur = {
                jam: record.sessions.zuhur.time || record.sessions.zuhur.jam || '',
                status: record.sessions.zuhur.status || 'TS',
              };
            }
            if (!record.ashar && record.sessions.ashar) {
              record.ashar = {
                jam: record.sessions.ashar.time || record.sessions.ashar.jam || '',
                status: record.sessions.ashar.status || 'TS',
              };
            }
            if (!record.pulang && record.sessions.pulang) {
              record.pulang = {
                jam: record.sessions.pulang.time || record.sessions.pulang.jam || '',
                status: record.sessions.pulang.status || 'TS',
              };
            }
            delete record.sessions;
          }
        });
    } catch (err) {
      console.warn('[Dexie Upgrade v22] Migration failed (non-blocking for clean installs):', err);
    }
  },
});
