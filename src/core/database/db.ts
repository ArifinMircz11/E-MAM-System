import type { Table } from 'dexie';
import Dexie from 'dexie';

export class EMamDatabase extends Dexie {
  // MASTER Collections
  madrasah!: Table<any, string>;
  pengguna!: Table<any, string>;
  users!: Table<any, string>;
  gtk!: Table<any, string>;
  teachers!: Table<any, string>;
  siswa!: Table<any, string>;
  students!: Table<any, string>;
  orang_tua!: Table<any, string>;
  alumni!: Table<any, string>;
  tahun_pelajaran!: Table<any, string>;
  academic_years!: Table<any, string>;
  academicYears!: Table<any, string>;
  semester!: Table<any, string>;
  semesters!: Table<any, string>;
  days!: Table<any, string>;
  daftar_kelas!: Table<any, string>;
  kelas!: Table<any, string>;
  classes!: Table<any, string>;
  mata_pelajaran!: Table<any, string>;
  subjects!: Table<any, string>;
  ruang!: Table<any, string>;
  rooms!: Table<any, string>;
  jurusan!: Table<any, string>;
  kalender_akademik!: Table<any, string>;
  teacher_assignments!: Table<any, string>;

  // AKADEMIK Collections
  riwayat_siswa!: Table<any, string>;
  jadwal!: Table<any, string>;
  schedules!: Table<any, string>;
  time_slots!: Table<any, string>;
  schedule_exceptions!: Table<any, string>;
  schedule_logs!: Table<any, string>;
  jadwal_mengajar!: Table<any, string>;
  absensi_siswa!: Table<any, string>;
  attendance!: Table<any, string>;
  absensi_guru!: Table<any, string>;
  teacher_attendance!: Table<any, string>;
  jurnal!: Table<any, string>;
  journals!: Table<any, string>;
  penilaian!: Table<any, string>;
  rapor!: Table<any, string>;
  kenaikan_kelas!: Table<any, string>;
  kelulusan!: Table<any, string>;
  assignments!: Table<any, string>;
  submissions!: Table<any, string>;

  // PTSP Collections (Pelayanan Terpadu Satu Pintu)
  kategori_surat!: Table<any, string>;
  template_surat!: Table<any, string>;
  templates!: Table<any, string>;
  nomor_surat!: Table<any, string>;
  surat_masuk!: Table<any, string>;
  surat_keluar!: Table<any, string>;
  letters!: Table<any, string>;
  disposisi!: Table<any, string>;
  lampiran_surat!: Table<any, string>;
  penerima_surat!: Table<any, string>;
  arsip!: Table<any, string>;
  izin!: Table<any, string>;
  cuti!: Table<any, string>;
  inventaris!: Table<any, string>;
  pelayanan!: Table<any, string>;

  // BK Collections
  kategori_poin!: Table<any, string>;
  point_categories!: Table<any, string>;
  pointCategories!: Table<any, string>;
  jenis_pelanggaran!: Table<any, string>;
  jenis_prestasi!: Table<any, string>;
  poin!: Table<any, string>;
  points!: Table<any, string>;
  student_point_summaries!: Table<any, string>;
  konseling!: Table<any, string>;
  pemanggilan_orang_tua!: Table<any, string>;
  tindak_lanjut!: Table<any, string>;

  // SISTEM Collections
  notification!: Table<any, string>;
  notifications!: Table<any, string>;
  settings!: Table<any, string>;
  session!: Table<any, string>;
  feature_flags!: Table<any, string>;
  sync_queue!: Table<any, string>;
  dead_letter_queue!: Table<any, string>;
  sync_log!: Table<any, string>;
  audit_log!: Table<any, string>;
  audit_logs!: Table<any, string>;
  cache!: Table<any, string>;
  navigation_cache!: Table<any, string>;
  dashboard_summaries!: Table<any, string>;
  tenants!: Table<any, string>;
  chats!: Table<any, string>;
  messages!: Table<any, string>;

  // SUPPORT & FAQ Collections
  faq_categories!: Table<any, string>;
  faqs!: Table<any, string>;
  support_agents!: Table<any, string>;
  support_conversations!: Table<any, string>;
  support_messages!: Table<any, string>;
  support_tickets!: Table<any, string>;
  faq_feedback!: Table<any, string>;
  quick_replies!: Table<any, string>;

  // SERVICE SURVEY Collections
  service_surveys!: Table<any, string>;
  survey_questions!: Table<any, string>;
  survey_answers!: Table<any, string>;
  survey_templates!: Table<any, string>;
  survey_statistics!: Table<any, string>;

  // Auxiliary & Legacy Compatibility Tables
  news!: Table<any, string>;
  events!: Table<any, string>;
  ticker!: Table<any, string>;
  conversations!: Table<any, string>;
  messageParticipants!: Table<any, string>;
  messageQueue!: Table<any, string>;
  complaints!: Table<any, string>;
  approval_requests!: Table<any, string>;
  profile_update_requests!: Table<any, string>;
  loginHistory!: Table<any, string>;
  loginLog!: Table<any, string>;
  activityLog!: Table<any, string>;
  notificationLogs!: Table<any, string>;
  syncMetadata!: Table<any, string>;
  pointRankings!: Table<any, string>;
  documentation!: Table<any, string>;
  systemSettings!: Table<any, string>;
  tenantConfigurations!: Table<any, string>;
  tenantBrandings!: Table<any, string>;
  tenantSettings!: Table<any, string>;
  tenantFeatures!: Table<any, string>;
  tenantStatistics!: Table<any, string>;
  tenantAudits!: Table<any, string>;

  student_parents!: Table<any, string>;
  satuan_kerja!: Table<any, string>;
  
  constructor(databaseName: string = 'e-Mam_Enterprise_LocalDB') {
    super(databaseName);

    // Version 12: Add attendance compound indexes for tanggal
    this.version(12).stores({
      // MASTER
      madrasah: 'id, npsn, tenantId, version, syncStatus',
      pengguna: 'id, tenantId, version, syncStatus, [tenantId+role], uid, email, role',
      users: 'id, tenantId, version, syncStatus, [tenantId+role], tenantsId, uid, email, role',
      gtk: 'id, tenantId, version, syncStatus, [tenantId+status], nip, nupdk, isClaimed',
      teachers: 'id, tenantId, version, syncStatus, [tenantId+status], tenantsId, teachersId, nip, isClaimed',
      siswa: 'id, tenantId, version, syncStatus, [tenantId+classId], [tenantId+status], nisn, nik',
      students: 'id, tenantId, version, syncStatus, [tenantId+classId], [tenantId+status], tenantsId, studentsId, classId, tingkatRombel, status',
      orang_tua: 'id, tenantId, version, syncStatus, [tenantId+studentId], nik',
      alumni: 'id, tenantId, version, syncStatus, [tenantId+graduationYear], nisn',
      tahun_pelajaran: 'id, tenantId, version, syncStatus, [tenantId+isActive], year',
      academic_years: 'id, tenantId, npsn, version, syncStatus, [tenantId+isActive], tenantsId, isActive',
      academicYears: 'id, tenantId, npsn, version, syncStatus, [tenantId+isActive], tenantsId, isActive',
      semester: 'id, tenantId, npsn, version, syncStatus, [tenantId+isActive], semesterCode',
      semesters: 'id, tenantId, npsn, version, syncStatus, [tenantId+isActive], academicYearId',
      days: 'id, order, name',
      daftar_kelas: 'id, tenantId, version, syncStatus, [tenantId+academicYearId], name',
      kelas: 'id, tenantId, npsn, version, syncStatus, [tenantId+academicYearId], tenantsId, classId, name',
      classes: 'id, tenantId, npsn, version, syncStatus, [tenantId+academicYearId], tenantsId, classId, name',
      mata_pelajaran: 'id, tenantId, version, syncStatus, [tenantId+code], name',
      subjects: 'id, tenantId, npsn, version, syncStatus, [tenantId+code], name',
      ruang: 'id, tenantId, version, syncStatus, [tenantId+code], name',
      rooms: 'id, tenantId, npsn, version, syncStatus, [tenantId+code], name',
      jurusan: 'id, tenantId, version, syncStatus, [tenantId+code], name',
      kalender_akademik: 'id, tenantId, version, syncStatus, [tenantId+date], title',
      teacher_assignments: 'id, tenantId, npsn, version, syncStatus, [tenantId+teacherId], [tenantId+classId], [tenantId+subjectId]',

      // AKADEMIK
      riwayat_siswa: 'id, tenantId, version, syncStatus, [tenantId+studentId], academicYearId',
      jadwal: 'id, tenantId, version, syncStatus, [tenantId+classId], [tenantId+teacherId], [tenantId+classId+dayIndex], tenantsId, classId, day',
      schedules: 'id, tenantId, npsn, version, syncStatus, [tenantId+classId], [tenantId+teacherId], [tenantId+classId+dayId], tenantsId, classId, dayId, timeSlotId',
      time_slots: 'id, tenantId, npsn, version, syncStatus, [tenantId+academicYearId], academicYearId, period, startTime',
      schedule_exceptions: 'id, tenantId, npsn, version, syncStatus, [tenantId+scheduleId], date',
      schedule_logs: 'id, tenantId, npsn, version, syncStatus, [tenantId+scheduleId], createdAt',
      jadwal_mengajar: 'id, tenantId, version, syncStatus, [tenantId+teacherId], day',
      absensi_siswa: 'id, tenantId, version, syncStatus, [tenantId+scheduleId+date], [tenantId+studentId+date], [tenantId+classId+tanggal], [tenantId+studentsId+tanggal], [tenantId+tanggal], tenantsId, studentsId, studentId, date, tanggal, classId',
      attendance: 'id, tenantId, version, syncStatus, [tenantId+scheduleId+date], [tenantId+studentId+date], [tenantId+studentsId+date], [tenantId+classId+tanggal], [tenantId+studentsId+tanggal], [tenantId+classId+date], [tenantId+tanggal], [tenantId+date], tenantsId, studentsId, studentId, date, tanggal, classId',
      absensi_guru: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+date], tenantsId, teachersId, date',
      teacher_attendance: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+date], tenantsId, teachersId, date',
      jurnal: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+classId+date], tenantsId, teacherId, date',
      journals: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+classId+date], tenantsId, teacherId, date',
      penilaian: 'id, tenantId, version, syncStatus, [tenantId+studentId+subjectId], semesterId',
      rapor: 'id, tenantId, version, syncStatus, [tenantId+studentId+semesterId], status',
      kenaikan_kelas: 'id, tenantId, version, syncStatus, [tenantId+studentId+academicYearId], status',
      kelulusan: 'id, tenantId, version, syncStatus, [tenantId+studentId], graduationDate',
      assignments: 'id, tenantId, version, syncStatus, [tenantId+classId], tenantsId, teacherId, classId',
      submissions: 'id, tenantId, version, syncStatus, [tenantId+assignmentId], [tenantId+studentId+assignmentId], tenantsId, assignmentId, studentId',

      // PTSP (Pelayanan Terpadu Satu Pintu)
      kategori_surat: 'id, tenantId, version, syncStatus, [tenantId+code], name',
      template_surat: 'id, tenantId, version, syncStatus, [tenantId+categoryCode], title',
      templates: 'id, tenantId, name, createdAt',
      nomor_surat: 'id, tenantId, version, syncStatus, [tenantId+year], number',
      surat_masuk: 'id, tenantId, version, syncStatus, [tenantId+status], [tenantId+date], referenceNumber',
      surat_keluar: 'id, tenantId, version, syncStatus, [tenantId+status], [tenantId+date], letterNumber',
      letters: 'id, tenantId, version, syncStatus, [tenantId+status], [tenantId+userId], [tenantId+updatedAt], tenantsId, userId, status, type',
      disposisi: 'id, tenantId, version, syncStatus, [tenantId+letterId], [tenantId+recipientId], status',
      lampiran_surat: 'id, tenantId, version, syncStatus, [tenantId+letterId], fileName',
      penerima_surat: 'id, tenantId, version, syncStatus, [tenantId+letterId], recipientName',
      arsip: 'id, tenantId, version, syncStatus, [tenantId+category], [tenantId+referenceNo], title',
      izin: 'id, tenantId, version, syncStatus, [tenantId+userId], [tenantId+status], startDate',
      cuti: 'id, tenantId, version, syncStatus, [tenantId+userId], [tenantId+status], startDate',
      inventaris: 'id, tenantId, version, syncStatus, [tenantId+category], [tenantId+condition], code',
      pelayanan: 'id, tenantId, version, syncStatus, [tenantId+status], [tenantId+applicantId], [tenantId+serviceType], trackingNumber, createdAt',

      // BK
      kategori_poin: 'id, tenantId, version, syncStatus, [tenantId+type], name',
      point_categories: 'id, tenantId, version, syncStatus, [tenantId+isActive], tenantsId, type, isActive',
      pointCategories: 'id, tenantId, version, syncStatus, [tenantId+isActive], tenantsId, type, isActive',
      jenis_pelanggaran: 'id, tenantId, version, syncStatus, [tenantId+categoryCode], name',
      jenis_prestasi: 'id, tenantId, version, syncStatus, [tenantId+categoryCode], name',
      poin: 'id, tenantId, version, syncStatus, [tenantId+studentId], [tenantId+date], tenantsId, studentsId, date, type',
      points: 'id, tenantId, version, syncStatus, [tenantId+studentId], [tenantId+date], tenantsId, studentsId, date, type',
      student_point_summaries: 'id, tenantId, version, syncStatus, [tenantId+studentId], tenantsId, studentId, totalPoints',
      konseling: 'id, tenantId, version, syncStatus, [tenantId+studentId], [tenantId+counselorId], date',
      pemanggilan_orang_tua: 'id, tenantId, version, syncStatus, [tenantId+studentId], [tenantId+status], scheduleDate',
      tindak_lanjut: 'id, tenantId, version, syncStatus, [tenantId+counselingId], actionType',

      // SISTEM
      notification: 'id, tenantId, userId, isRead, createdAt, [tenantId+userId], [tenantId+isRead], tenantsId',
      notifications: 'id, tenantId, userId, isRead, createdAt, [tenantId+userId], [tenantId+isRead], tenantsId',
      settings: 'key, tenantId, updatedAt',
      session: 'id, userId, tenantId, expiresAt',
      feature_flags: 'key, tenantId, isEnabled',
      sync_queue: 'id, tenantId, collection, operation, status, priority, createdAt, [tenantId+status], [tenantId+priority], [tenantId+createdAt], tenantsId',
      dead_letter_queue: 'id, tenantId, collection, status, createdAt, [tenantId+status], [tenantId+createdAt], tenantsId',
      sync_log: 'id, tenantId, status, timestamp, [tenantId+timestamp]',
      audit_log: 'id, tenantId, userId, action, timestamp, [tenantId+timestamp], [tenantId+userId], tenantsId',
      audit_logs: 'id, tenantId, userId, action, timestamp, [tenantId+timestamp], [tenantId+userId], tenantsId',
      cache: 'key, tenantId, updatedAt, expiresAt, [tenantId+updatedAt], [tenantId+expiresAt], tenantsId',
      dashboard_summaries: 'id, tenantId, updatedAt, [tenantId+updatedAt], tenantsId',
      tenants: 'id, tenantCode, slug, npsn, tenantsId',
      chats: 'id, tenantId, version, syncStatus, [tenantId+roomType], tenantsId, roomType',
      messages: 'id, tenantId, version, syncStatus, [tenantId+chatId], [tenantId+chatId+timestamp], [chatId+createdAt], [chatId+timestamp], tenantsId, chatId, senderId, timestamp, createdAt',

      // Legacy / Auxiliary
      news: 'id, tenantsId, isPublished, date',
      events: 'id, tenantsId, date, status',
      ticker: 'id, tenantsId, isActive, date',
      conversations: 'id, tenantsId, lastMessageTimestamp',
      messageParticipants: 'id, conversationId, userId',
      messageQueue: 'id, userId, status, createdAt',
      complaints: 'id, tenantId, tenantsId, userId, status, createdAt, [tenantId+status]',
      approval_requests: 'id, tenantId, tenantsId, userId, status, createdAt, [tenantId+status]',
      profile_update_requests: 'id, tenantId, tenantsId, userId, status, createdAt, [tenantId+status]',
      loginHistory: 'id, userId, timestamp, ipAddress',
      loginLog: 'id, userId, timestamp',
      activityLog: 'id, userId, action, timestamp',
      notificationLogs: 'id, userId, timestamp',
      syncMetadata: 'id, collection, tenantsId, version, status',
      pointRankings: 'id, tenantsId, classId, rank',
      documentation: 'id, tenantsId, title, createdAt',
      systemSettings: 'key, value, lastUpdated',
      tenantConfigurations: 'id, tenantsId',
      tenantBrandings: 'id, tenantsId',
      tenantSettings: 'id, tenantsId',
      tenantFeatures: 'id, tenantsId',
      tenantStatistics: 'id, tenantsId',
      tenantAudits: 'id, tenantsId, action, timestamp',
    });

    // Version 13: Support & FAQ Module Tables
    this.version(13).stores({
      faq_categories: 'id, npsn, tenantId, version, syncStatus, [tenantId+isActive], sortOrder',
      faqs: 'id, npsn, categoryId, isPublished, question, syncStatus, tenantId, [tenantId+categoryId], [tenantId+isPublished]',
      support_agents: 'id, tenantId, userId, status, department, [tenantId+status]',
      support_conversations: 'id, tenantId, userId, agentId, status, startedAt, [tenantId+userId], [tenantId+status]',
      support_messages: 'id, tenantId, conversationId, senderId, sentAt, [conversationId+sentAt]',
      support_tickets: 'id, tenantId, ticketNumber, userId, assignedAgentId, status, priority, [tenantId+status], [tenantId+userId]',
      faq_feedback: 'id, tenantId, faqId, userId, createdAt',
      quick_replies: 'id, tenantId, agentId, categoryId, isActive',
    });

    // Version 14: Service Survey Module Tables
    this.version(14).stores({
      service_surveys: 'id, npsn, tenantId, serviceType, serviceId, ticketId, conversationId, respondentId, respondentType, agentId, submittedAt, version, syncStatus, [tenantId+serviceType], [tenantId+respondentId]',
      survey_questions: 'id, npsn, tenantId, serviceType, question, answerType, isRequired, order, isActive, [tenantId+serviceType], [tenantId+isActive]',
      survey_answers: 'id, tenantId, surveyId, questionId, rating, answer, createdAt, [surveyId]',
      survey_templates: 'id, tenantId, name, serviceType, description, isDefault, isActive, [tenantId+serviceType]',
      survey_statistics: 'id, npsn, tenantId, serviceType, totalResponses, averageRating, satisfiedCount, unsatisfiedCount, updatedAt, [tenantId+serviceType]',
    });

    // Version 15: Complete WhatsApp + Helpdesk + FAQ + Ticketing Architecture Tables
    this.version(15).stores({
      faq_categories: 'id, npsn, tenantId, code, name, isActive, sortOrder, [tenantId+isActive]',
      faq_articles: 'id, npsn, tenantId, categoryId, slug, title, published, [tenantId+categoryId], [tenantId+published]',
      faq_feedback: 'id, tenantId, faqId, userId, helpful, rating, createdAt',
      agents: 'id, tenantId, userId, department, status, isActive, [tenantId+status]',
      agent_sessions: 'id, tenantId, agentId, loginAt, logoutAt',
      agent_presence: 'id, tenantId, agentId, currentStatus, updatedAt',
      conversations: 'id, npsn, tenantId, ticketId, channel, initiatedBy, assignedAgentId, status, lastMessageAt, [tenantId+status], [tenantId+assignedAgentId]',
      participants: 'id, tenantId, conversationId, userId, role',
      messages: 'id, tenantId, conversationId, senderId, senderRole, sentAt, [conversationId+sentAt]',
      message_attachments: 'id, tenantId, messageId, fileName, mimeType',
      tickets: 'id, npsn, tenantId, ticketNumber, requesterId, categoryId, assignedAgentId, status, priority, [tenantId+status], [tenantId+ticketNumber]',
      ticket_categories: 'id, tenantId, code, name, isActive',
      ticket_status_history: 'id, tenantId, ticketId, oldStatus, newStatus, changedAt',
      quick_replies: 'id, tenantId, agentId, categoryId, shortcut, isActive',
      surveys: 'id, npsn, tenantId, conversationId, ticketId, respondentId, agentId, submittedAt, [tenantId+conversationId]',
      survey_answers: 'id, tenantId, surveyId, questionId, rating',
      notifications: 'id, tenantId, userId, read, createdAt, [tenantId+userId]',
    });

    // Version 16: Set idUnik as Primary Key for students
    this.version(16).stores({
      students: 'idUnik, tenantId, version, syncStatus, [tenantId+classId], [tenantId+status], studentsId, classId, tingkatRombel, status, nisn, nik',
    });

    // Version 18: Add tables for Identity Center (user_sessions, user_devices, user_activity_logs)
    this.version(18).stores({
      user_sessions: 'id, tenantId, userId, provider, deviceId, platform, loginAt, logoutAt, status, syncStatus',
      user_devices: 'id, tenantId, userId, deviceName, platform, browser, trusted, lastSeenAt',
      user_activity_logs: 'id, tenantId, userId, module, action, provider, description, createdAt, syncStatus',
    });

    // Version 19: Add generic summaries table
    this.version(19).stores({
      summaries: 'id, tenantId, type, [tenantId+type], updatedAt',
    });

    // Version 20: Add [teachersId+date] composite index to teacher_attendance and absensi_guru for query speedup
    this.version(20).stores({
      absensi_guru: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+date], [teachersId+date], tenantsId, teachersId, date',
      teacher_attendance: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+date], [teachersId+date], tenantsId, teachersId, date',
    });

    // Version 23: Force upgrade to ensure [teachersId+date] index is built in existing client databases
    this.version(23).stores({
      absensi_guru: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+date], [teachersId+date], tenantsId, teachersId, date',
      teacher_attendance: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+date], [teachersId+date], tenantsId, teachersId, date',
    });

    // Version 25: Ensure index [teachersId+date] is correctly built for existing databases
    this.version(25).stores({
      absensi_guru: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+date], [teachersId+date], tenantsId, teachersId, date',
      teacher_attendance: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+date], [teachersId+date], tenantsId, teachersId, date',
    });

    // Version 26: Add student_parents table
    this.version(26).stores({
      student_parents: 'id, tenantId, studentId, parentId, [tenantId+studentId], [tenantId+parentId]',
    });

    // Version 27: Add tickers table
    this.version(27).stores({
      tickers: 'id, tenantId, isActive',
    });

    // Version 28: Enterprise schema alignment for users and compound indices
    this.version(28).stores({
      users: 'id, uid, tenantId, email, role, accountType, status, approvalStatus, version, [tenantId+role], [tenantId+status], [tenantId+email]',
      approval_requests: 'id, tenantId, userId, status, createdAt',
      profile_update_requests: 'id, tenantId, userId, status, createdAt',
      login_logs: 'id, tenantId, uid, createdAt',
      activity_logs: 'id, tenantId, userId, createdAt',
    });
    // Version 29: Fix missing indices for students and student_point_summaries
    this.version(29).stores({
      students: 'idUnik, id, tenantId, version, syncStatus, [tenantId+classId], [tenantId+status], studentsId, classId, tingkatRombel, status, nisn, nik',
      student_point_summaries: 'id, tenantId, version, syncStatus, [tenantId+studentId], tenantsId, studentId, studentsId, totalPoints',
    });

    // Version 30: Ensure madrasah and master tables have correct indexing
    this.version(30).stores({
      madrasah: 'id, npsn, tenantId, version, syncStatus, [tenantId+npsn]',
      students: 'idUnik, id, tenantId, version, syncStatus, [tenantId+classId], [tenantId+status], studentsId, classId, tingkatRombel, status, nisn, nik',
      student_point_summaries: 'id, tenantId, version, syncStatus, [tenantId+studentId], tenantsId, studentId, studentsId, totalPoints',
    });

    // Version 32: Force re-indexing of notifications to fix isRead query error
    this.version(32).stores({
      notifications: 'id, tenantId, userId, isRead, read, createdAt, [tenantId+userId], [tenantId+isRead]',
    });

    // Version 33: Add satuan_kerja table for Kanwil Management
    this.version(33).stores({
      satuan_kerja: 'id, name, code, type, parentId, [tenantId+type]',
    });

    // Version 34: Navigation Cache for Module Federation
    this.version(34).stores({
      navigation_cache: 'id, tenantId, version, syncedAt',
    });

    // Version 35: Ensure tenantId index on ticker, tickers, and auxiliary tables
    this.version(35).stores({
      ticker: 'id, tenantId, tenantsId, isActive, date, [tenantId+isActive]',
      tickers: 'id, tenantId, isActive, [tenantId+isActive]',
      news: 'id, tenantId, tenantsId, isPublished, date, [tenantId+isPublished]',
      events: 'id, tenantId, tenantsId, date, status, [tenantId+status]',
    });
  }
}

export const localDb = new EMamDatabase();
export const db = localDb;

/**
 * Enterprise Dynamic Database Resolver
 * Enables runtime database context switching, isolated test databases, and dynamic multitenant isolation.
 */
export class DatabaseResolver {
  private static instance: EMamDatabase = localDb;

  static setDatabase(customDb: EMamDatabase): void {
    DatabaseResolver.instance = customDb;
  }

  static getDatabase(): EMamDatabase {
    return DatabaseResolver.instance || localDb;
  }

  static resetDatabase(): void {
    DatabaseResolver.instance = localDb;
  }
}

/**
 * Helper to get a table by name dynamically
 */
export const getTableByName = (tableName: string): Table<any, any> | undefined => {
  const activeDb = DatabaseResolver.getDatabase();
  return (activeDb as any)[tableName];
};

