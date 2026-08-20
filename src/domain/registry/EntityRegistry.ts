import type { AppEntity } from '../entities/base';
import { PERMISSIONS } from '@/types/permissions';
import { GENERATED_ENTITIES } from './entities.generated';

/**
 * Metadata configuration for a specific entity type
 */
export interface EntityColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'badge';
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
}

export interface EntityFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'switch' | 'qr';
  required?: boolean;
  options?: { label: string; value: any }[]; // For select
  placeholder?: string;
  defaultValue?: any;
}

export interface EntityMetadata<T extends AppEntity = AppEntity> {
  name: string; // Logical name (e.g., 'student')
  label: string; // Display label (e.g., 'Siswa')
  dexieTable: string; // Dexie table name
  firestoreCollection: string; // Firestore collection path
  primaryKey: string; // PK field name (usually 'id' or 'idUnik')
  businessKey?: string; // Unique business ID (e.g., 'idUnik' or 'nim')
  indexes: string[]; // Dexie index definitions
  tenantScoped: boolean; // Whether it requires tenantId isolation
  syncEnabled: boolean; // Whether it syncs with Firestore
  
  // UI Metadata
  columns?: EntityColumn[];
  formSchema?: EntityFormField[];
  permissions?: {
    create: string;
    read: string;
    update: string;
    delete: string;
    import?: string;
    export?: string;
  };
}

/**
 * Registry of all operational entities in the e-MAM system.
 * Centralizing this allows generic tools (BaseRepo, SyncEngine)
 * to operate without hardcoded knowledge of specific entities.
 */
class EntityRegistry {
  private entities: Map<string, EntityMetadata> = new Map();

  register(metadata: EntityMetadata) {
    if (!GENERATED_ENTITIES.includes(metadata.name as any)) {
      console.warn(`EntityRegistry Warning: Entity '${metadata.name}' is not in GENERATED_ENTITIES.`);
    }
    this.entities.set(metadata.name, metadata);
    // Register common aliases (plural/singular)
    const aliases = [
      'message', 'messages', 'chat', 'chats', 'letter', 'letters',
      'student', 'students', 'teacher', 'teachers', 'user', 'users',
      'class', 'classes', 'journal', 'journals', 'point', 'points',
      'complaint', 'complaints', 'assignment', 'assignments', 'submission', 'submissions'
    ];
    if (aliases.includes(metadata.name)) {
      this.entities.set(metadata.name.endsWith('s') ? metadata.name.slice(0, -1) : metadata.name + 's', metadata);
    }
  }

  get(name: string): EntityMetadata {
    const meta = this.entities.get(name);
    if (!meta) {
      throw new Error(`EntityRegistry Error: Entity '${name}' is not registered.`);
    }
    return meta;
  }

  getAll(): EntityMetadata[] {
    return Array.from(new Set(this.entities.values()));
  }
}

const entityRegistry = new EntityRegistry();

// Initialize registry with core entities
entityRegistry.register({
  name: 'madrasah',
  label: 'Madrasah',
  dexieTable: 'madrasah',
  firestoreCollection: 'madrasah',
  primaryKey: 'id',
  indexes: ['id', 'npsn', 'tenantId'],
  tenantScoped: true,
  syncEnabled: true,
  columns: [
    { key: 'namaMadrasah', label: 'Nama Madrasah', type: 'text', sortable: true, filterable: true },
    { key: 'npsn', label: 'NPSN', type: 'text', sortable: true },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  formSchema: [
    { name: 'namaMadrasah', label: 'Nama Madrasah', type: 'text', required: true },
    { name: 'npsn', label: 'NPSN', type: 'text', required: true },
    { name: 'alamat', label: 'Alamat', type: 'textarea' },
    { name: 'kepalaMadrasah', label: 'Kepala Madrasah', type: 'text' },
  ],
  permissions: {
    read: PERMISSIONS.SYSTEM_CONFIG,
    create: PERMISSIONS.SYSTEM_CONFIG,
    update: PERMISSIONS.SYSTEM_CONFIG,
    delete: PERMISSIONS.SYSTEM_CONFIG,
  },
});

entityRegistry.register({
  name: 'student',
  label: 'Siswa',
  dexieTable: 'students',
  firestoreCollection: 'students',
  primaryKey: 'idUnik',
  businessKey: 'idUnik',
  indexes: ['idUnik', 'tenantId', 'id', 'studentsId'],
  tenantScoped: true,
  syncEnabled: true,
  columns: [
    { key: 'idUnik', label: 'ID', type: 'text', sortable: true },
    { key: 'namaLengkap', label: 'Nama Lengkap', type: 'text', sortable: true, filterable: true },
    { key: 'nisn', label: 'NISN', type: 'text', sortable: true, filterable: true },
    { key: 'tingkatRombel', label: 'Kelas', type: 'badge', filterable: true },
    { key: 'status', label: 'Status', type: 'badge', filterable: true },
  ],
  formSchema: [
    { name: 'idUnik', label: 'ID Unik', type: 'text', required: true, placeholder: 'STD-2026-XXXX' },
    { name: 'namaLengkap', label: 'Nama Lengkap', type: 'text', required: true },
    { name: 'nisn', label: 'NISN', type: 'text' },
    { name: 'nik', label: 'NIK', type: 'text' },
    { name: 'jenisKelamin', label: 'Jenis Kelamin', type: 'select', options: [{label: 'Laki-laki', value: 'L'}, {label: 'Perempuan', value: 'P'}] },
    { name: 'tingkatRombel', label: 'Kelas', type: 'text' },
  ],
  permissions: {
    read: PERMISSIONS.STUDENT_READ,
    create: PERMISSIONS.STUDENT_CREATE,
    update: PERMISSIONS.STUDENT_UPDATE,
    delete: PERMISSIONS.STUDENT_DELETE,
    import: PERMISSIONS.STUDENT_CREATE,
    export: PERMISSIONS.STUDENT_READ,
  },
});

entityRegistry.register({
  name: 'attendance',
  label: 'Presensi',
  dexieTable: 'attendance',
  firestoreCollection: 'attendance',
  primaryKey: 'id',
  indexes: [
    'id',
    'tenantId',
    'date',
    '[tenantId+date]',
    'studentsId',
    '[tenantId+studentsId+date]',
  ],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'teacher',
  label: 'Guru & Staf',
  dexieTable: 'teachers',
  firestoreCollection: 'teachers',
  primaryKey: 'idUnik',
  businessKey: 'idUnik',
  indexes: ['idUnik', 'tenantId', 'id', 'teachersId', 'nip', 'nik'],
  tenantScoped: true,
  syncEnabled: true,
  columns: [
    { key: 'idUnik', label: 'ID', type: 'text', sortable: true },
    { key: 'namaLengkap', label: 'Nama Lengkap', type: 'text', sortable: true, filterable: true },
    { key: 'nip', label: 'NIP', type: 'text', sortable: true },
    { key: 'jabatan', label: 'Jabatan', type: 'badge' },
    { key: 'employmentStatus', label: 'Status Kepegawaian', type: 'badge' },
  ],
  formSchema: [
    { name: 'idUnik', label: 'ID Unik', type: 'text', required: true, placeholder: 'GRU-30301234-000001' },
    { name: 'namaLengkap', label: 'Nama Lengkap', type: 'text', required: true },
    { name: 'nik', label: 'NIK', type: 'text', required: true },
    { name: 'nip', label: 'NIP', type: 'text' },
    { name: 'nuptk', label: 'NUPTK', type: 'text' },
    { name: 'jabatan', label: 'Jabatan', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'text' },
  ],
  permissions: {
    read: PERMISSIONS.TEACHER_READ,
    create: PERMISSIONS.TEACHER_CREATE,
    update: PERMISSIONS.TEACHER_UPDATE,
    delete: PERMISSIONS.TEACHER_DELETE,
    import: PERMISSIONS.TEACHER_CREATE,
    export: PERMISSIONS.TEACHER_READ,
  },
});

entityRegistry.register({
  name: 'user',
  label: 'Pengguna',
  dexieTable: 'users',
  firestoreCollection: 'users',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'uid', 'email'],
  tenantScoped: true,
  syncEnabled: true,
  columns: [
    { key: 'email', label: 'Email', type: 'text', sortable: true, filterable: true },
    { key: 'namaLengkap', label: 'Nama', type: 'text', sortable: true, filterable: true },
    { key: 'role', label: 'Role', type: 'badge', filterable: true },
    { key: 'status', label: 'Status', type: 'badge', filterable: true },
  ],
  formSchema: [
    { name: 'email', label: 'Email', type: 'text', required: true },
    { name: 'namaLengkap', label: 'Nama Lengkap', type: 'text', required: true },
    { name: 'role', label: 'Role', type: 'select', options: [
      {label: 'Admin', value: 'admin'},
      {label: 'Guru', value: 'guru'},
      {label: 'Siswa', value: 'siswa'},
      {label: 'Orang Tua', value: 'orang_tua'},
    ]},
    { name: 'status', label: 'Status', type: 'switch', defaultValue: 'Aktif' },
  ],
  permissions: {
    read: PERMISSIONS.USER_READ,
    create: PERMISSIONS.USER_CREATE,
    update: PERMISSIONS.USER_UPDATE,
    delete: PERMISSIONS.USER_DELETE,
  },
});

entityRegistry.register({
  name: 'class',
  label: 'Kelas / Rombel',
  dexieTable: 'classes',
  firestoreCollection: 'classes',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'classId', 'name'],
  tenantScoped: true,
  syncEnabled: true,
  columns: [
    { key: 'name', label: 'Nama Kelas', type: 'text', sortable: true, filterable: true },
    { key: 'tingkat', label: 'Tingkat', type: 'badge' },
    { key: 'waliKelas', label: 'Wali Kelas', type: 'text' },
  ],
  formSchema: [
    { name: 'name', label: 'Nama Kelas', type: 'text', required: true },
    { name: 'tingkat', label: 'Tingkat', type: 'select', options: [
      {label: '7', value: '7'}, {label: '8', value: '8'}, {label: '9', value: '9'},
      {label: '10', value: '10'}, {label: '11', value: '11'}, {label: '12', value: '12'}
    ]},
    { name: 'waliKelasId', label: 'Wali Kelas', type: 'text' },
  ],
  permissions: {
    read: PERMISSIONS.CLASS_READ,
    create: PERMISSIONS.CLASS_CREATE,
    update: PERMISSIONS.CLASS_UPDATE,
    delete: PERMISSIONS.CLASS_DELETE,
  },
});

entityRegistry.register({
  name: 'academic_year',
  label: 'Tahun Pelajaran',
  dexieTable: 'academic_years',
  firestoreCollection: 'academic_years',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'name', 'isActive'],
  tenantScoped: true,
  syncEnabled: true,
  columns: [
    { key: 'name', label: 'Tahun Pelajaran', type: 'text', sortable: true },
    { key: 'isActive', label: 'Status', type: 'badge' },
  ],
  formSchema: [
    { name: 'name', label: 'Nama Tahun', type: 'text', required: true, placeholder: '2025/2026' },
    { name: 'isActive', label: 'Aktif', type: 'switch', defaultValue: 'Aktif' },
  ],
  permissions: {
    read: PERMISSIONS.SYSTEM_CONFIG,
    create: PERMISSIONS.SYSTEM_CONFIG,
    update: PERMISSIONS.SYSTEM_CONFIG,
    delete: PERMISSIONS.SYSTEM_CONFIG,
  },
});

entityRegistry.register({
  name: 'journal',
  label: 'Jurnal',
  dexieTable: 'journals',
  firestoreCollection: 'journals',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'teacherId', 'date', 'className'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'letter',
  label: 'Surat',
  dexieTable: 'letters',
  firestoreCollection: 'letters',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'userId', 'studentsId', 'status'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'notification',
  label: 'Notifikasi',
  dexieTable: 'notifications',
  firestoreCollection: 'notifications',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'userId', 'type', 'isRead'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'point',
  label: 'Poin',
  dexieTable: 'points',
  firestoreCollection: 'points',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'studentsId', 'type', 'date'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'point_category',
  label: 'Kategori Poin',
  dexieTable: 'point_categories',
  firestoreCollection: 'point_categories',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'name', 'type', 'isActive'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'student_point_summary',
  label: 'Rekap Poin Siswa',
  dexieTable: 'student_point_summaries',
  firestoreCollection: 'student_point_summaries',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'studentsId'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'profile_update_request',
  label: 'Permintaan Update Profil',
  dexieTable: 'profile_update_requests',
  firestoreCollection: 'profile_update_requests',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'userId', 'status'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'audit_logs',
  label: 'Log Audit',
  dexieTable: 'audit_logs',
  firestoreCollection: 'audit_logs',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'action', 'userId', 'timestamp'],
  tenantScoped: true,
  syncEnabled: false,
});

entityRegistry.register({
  name: 'approval_request',
  label: 'Permintaan Persetujuan',
  dexieTable: 'approval_requests',
  firestoreCollection: 'approval_requests',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'status', 'type', 'createdAt'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'complaint',
  label: 'Aduan',
  dexieTable: 'complaints',
  firestoreCollection: 'complaints',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'status', 'category', 'createdAt'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'chat',
  label: 'Percakapan',
  dexieTable: 'conversations',
  firestoreCollection: 'conversations',
  primaryKey: 'id',
  indexes: ['id', 'tenantId'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'message',
  label: 'Pesan',
  dexieTable: 'messageQueue',
  firestoreCollection: 'messages',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'chatId'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'teacher_attendance',
  label: 'Presensi Guru',
  dexieTable: 'teacher_attendance',
  firestoreCollection: 'teacher_attendance',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'teachersId', 'date'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'sync_queue',
  label: 'Antrean Sinkronisasi',
  dexieTable: 'sync_queue',
  firestoreCollection: 'sync_queue', // Note: Usually internal, but defined here for consistency
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'status', 'createdAt'],
  tenantScoped: true,
  syncEnabled: false, // Metadata for local queue management
});

entityRegistry.register({
  name: 'tenant',
  label: 'Tenant',
  dexieTable: 'tenants',
  firestoreCollection: 'tenants',
  primaryKey: 'id',
  indexes: ['id', 'tenantCode', 'slug', 'npsn'],
  tenantScoped: false,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'template',
  label: 'Template',
  dexieTable: 'templates',
  firestoreCollection: 'templates',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'name', 'createdAt'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'semester',
  label: 'Semester',
  dexieTable: 'semesters',
  firestoreCollection: 'semesters',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'academicYearId', 'isActive', '[tenantId+isActive]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'day',
  label: 'Hari',
  dexieTable: 'days',
  firestoreCollection: 'days',
  primaryKey: 'id',
  indexes: ['id', 'order'],
  tenantScoped: false,
  syncEnabled: false,
});

entityRegistry.register({
  name: 'subject',
  label: 'Mata Pelajaran',
  dexieTable: 'subjects',
  firestoreCollection: 'subjects',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'code', '[tenantId+code]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'room',
  label: 'Ruangan',
  dexieTable: 'rooms',
  firestoreCollection: 'rooms',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'code', '[tenantId+code]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'teacher_assignment',
  label: 'Penugasan Guru',
  dexieTable: 'teacher_assignments',
  firestoreCollection: 'teacher_assignments',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'teacherId', 'classId', 'subjectId', '[tenantId+teacherId]', '[tenantId+classId]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'schedule',
  label: 'Jadwal',
  dexieTable: 'schedules',
  firestoreCollection: 'schedules',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'classId', 'dayId', 'timeSlotId', 'academicYearId', '[tenantId+classId]', '[tenantId+dayId]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'time_slot',
  label: 'Slot Waktu',
  dexieTable: 'time_slots',
  firestoreCollection: 'time_slots',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'academicYearId', 'period', '[tenantId+academicYearId]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'schedule_exception',
  label: 'Pengecualian Jadwal',
  dexieTable: 'schedule_exceptions',
  firestoreCollection: 'schedule_exceptions',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'scheduleId', 'date', '[tenantId+scheduleId]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'schedule_logs',
  label: 'Log Jadwal',
  dexieTable: 'schedule_logs',
  firestoreCollection: 'schedule_logs',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'scheduleId', 'createdAt', '[tenantId+scheduleId]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'faq_category',
  label: 'Kategori FAQ',
  dexieTable: 'faq_categories',
  firestoreCollection: 'faq_categories',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'npsn', '[tenantId+isActive]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'faq',
  label: 'FAQ',
  dexieTable: 'faqs',
  firestoreCollection: 'faqs',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'npsn', 'categoryId', 'isPublished', '[tenantId+categoryId]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'support_agent',
  label: 'Agen Support',
  dexieTable: 'support_agents',
  firestoreCollection: 'support_agents',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'userId', 'status', '[tenantId+status]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'support_conversation',
  label: 'Percakapan Support',
  dexieTable: 'support_conversations',
  firestoreCollection: 'support_conversations',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'userId', 'agentId', 'status', '[tenantId+userId]', '[tenantId+status]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'support_message',
  label: 'Pesan Support',
  dexieTable: 'support_messages',
  firestoreCollection: 'support_messages',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'conversationId', 'senderId', '[conversationId+sentAt]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'support_ticket',
  label: 'Tiket Support',
  dexieTable: 'support_tickets',
  firestoreCollection: 'support_tickets',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'ticketNumber', 'userId', 'assignedAgentId', 'status', 'priority'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'faq_feedback',
  label: 'Feedback FAQ',
  dexieTable: 'faq_feedback',
  firestoreCollection: 'faq_feedback',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'faqId', 'userId'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'quick_reply',
  label: 'Balasan Cepat',
  dexieTable: 'quick_replies',
  firestoreCollection: 'quick_replies',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'agentId', 'categoryId'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'service_survey',
  label: 'Survei Layanan',
  dexieTable: 'service_surveys',
  firestoreCollection: 'service_surveys',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'npsn', 'serviceType', 'serviceId', 'respondentId', '[tenantId+serviceType]', '[tenantId+respondentId]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'survey_question',
  label: 'Pertanyaan Survei',
  dexieTable: 'survey_questions',
  firestoreCollection: 'survey_questions',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'npsn', 'serviceType', 'isActive', '[tenantId+serviceType]', '[tenantId+isActive]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'survey_answer',
  label: 'Jawaban Survei',
  dexieTable: 'survey_answers',
  firestoreCollection: 'survey_answers',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'surveyId', 'questionId', '[surveyId]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'survey_template',
  label: 'Template Survei',
  dexieTable: 'survey_templates',
  firestoreCollection: 'survey_templates',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'serviceType', '[tenantId+serviceType]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'survey_statistics',
  label: 'Statistik Survei',
  dexieTable: 'survey_statistics',
  firestoreCollection: 'survey_statistics',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'npsn', 'serviceType', '[tenantId+serviceType]'],
  tenantScoped: true,
  syncEnabled: true,
});



entityRegistry.register({
  name: 'ticker',
  label: 'Ticker',
  dexieTable: 'ticker',
  firestoreCollection: 'ticker',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'isActive', 'date'],
  tenantScoped: true,
  syncEnabled: true,
});
entityRegistry.register({
  name: 'events',
  label: 'Events',
  dexieTable: 'events',
  firestoreCollection: 'events',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'date'],
  tenantScoped: true,
  syncEnabled: true,
});
entityRegistry.register({
  name: 'penilaian',
  label: 'Penilaian',
  dexieTable: 'penilaian',
  firestoreCollection: 'penilaian',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'semesterId', '[tenantId+studentId+subjectId]'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'assignment',
  label: 'Tugas',
  dexieTable: 'assignments',
  firestoreCollection: 'assignments',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'teacherId', 'className', 'subject', 'dueDate'],
  tenantScoped: true,
  syncEnabled: true,
});

entityRegistry.register({
  name: 'submission',
  label: 'Pengumpulan Tugas',
  dexieTable: 'submissions',
  firestoreCollection: 'submissions',
  primaryKey: 'id',
  indexes: ['id', 'tenantId', 'assignmentId', 'studentId', '[studentId+assignmentId]', 'status'],
  tenantScoped: true,
  syncEnabled: true,
});

export { entityRegistry };
