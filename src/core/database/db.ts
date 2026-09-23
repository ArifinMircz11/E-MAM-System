import type { Table } from 'dexie';
import Dexie from 'dexie';
import type { DeadLetterQueueItem, SyncQueueItem } from '@/types/syncQueue';

export class EMamDatabase extends Dexie {
  madrasah!: Table<any, string>;
  users!: Table<any, string>;
  teachers!: Table<any, string>;
  students!: Table<any, string>;
  orang_tua!: Table<any, string>;
  alumni!: Table<any, string>;
  academic_years!: Table<any, string>;
  semesters!: Table<any, string>;
  days!: Table<any, string>;
  classes!: Table<any, string>;
  subjects!: Table<any, string>;
  rooms!: Table<any, string>;
  jurusan!: Table<any, string>;
  kalender_akademik!: Table<any, string>;
  teacher_assignments!: Table<any, string>;
  riwayat_siswa!: Table<any, string>;
  schedules!: Table<any, string>;
  time_slots!: Table<any, string>;
  schedule_exceptions!: Table<any, string>;
  schedule_logs!: Table<any, string>;
  jadwal_mengajar!: Table<any, string>;
  attendance!: Table<any, string>;
  teacher_attendance!: Table<any, string>;
  journals!: Table<any, string>;
  penilaian!: Table<any, string>;
  rapor!: Table<any, string>;
  kenaikan_kelas!: Table<any, string>;
  kelulusan!: Table<any, string>;
  assignments!: Table<any, string>;
  submissions!: Table<any, string>;
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
  point_categories!: Table<any, string>;
  jenis_pelanggaran!: Table<any, string>;
  jenis_prestasi!: Table<any, string>;
  points!: Table<any, string>;
  student_point_summaries!: Table<any, string>;
  konseling!: Table<any, string>;
  pemanggilan_orang_tua!: Table<any, string>;
  tindak_lanjut!: Table<any, string>;
  notifications!: Table<any, string>;
  settings!: Table<any, string>;
  session!: Table<any, string>;
  feature_flags!: Table<any, string>;
  sync_queue!: Table<SyncQueueItem, string>;
  dead_letter_queue!: Table<DeadLetterQueueItem, string>;
  sync_log!: Table<any, string>;
  audit_logs!: Table<any, string>;
  cache!: Table<any, string>;
  navigation_cache!: Table<any, string>;
  dashboard_summaries!: Table<any, string>;
  tenants!: Table<any, string>;
  chats!: Table<any, string>;
  messages!: Table<any, string>;
  faq_categories!: Table<any, string>;
  faqs!: Table<any, string>;
  support_agents!: Table<any, string>;
  support_conversations!: Table<any, string>;
  support_messages!: Table<any, string>;
  support_tickets!: Table<any, string>;
  faq_feedback!: Table<any, string>;
  quick_replies!: Table<any, string>;
  service_surveys!: Table<any, string>;
  survey_questions!: Table<any, string>;
  survey_answers!: Table<any, string>;
  survey_templates!: Table<any, string>;
  survey_statistics!: Table<any, string>;
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

    const schema = {
      madrasah: 'id, npsn, tenantId, version, syncStatus',
      pengguna: 'id, tenantId, version, syncStatus, [tenantId+role], uid, email, role',
      users: 'id, tenantId, version, syncStatus, [tenantId+role], tenantsId, uid, email, role',
      gtk: 'id, tenantId, version, syncStatus, [tenantId+status], nip, nupdk, isClaimed',
      teachers: 'id, tenantId, version, syncStatus, [tenantId+status], tenantsId, teachersId, nip, isClaimed',
      siswa: 'id, tenantId, version, syncStatus, [tenantId+classId], [tenantId+status], nisn, nik',
      students: 'id, tenantId, version, syncStatus, [tenantId+classId], [tenantId+academicYearId], [tenantId+status], tenantsId, studentsId, classId, academicYearId, tingkatRombel, status',
      orang_tua: 'id, tenantId, version, syncStatus, [tenantId+studentId], nik',
      alumni: 'id, tenantId, version, syncStatus, [tenantId+graduationYear], nisn',
      tahun_pelajaran: 'id, tenantId, version, syncStatus, [tenantId+isActive], year',
      academic_years: 'id, tenantId, npsn, version, syncStatus, [tenantId+isActive], tenantsId, isActive',
      academicYears: 'id, tenantId, npsn, version, syncStatus, [tenantId+isActive], tenantsId, isActive',
      semester: 'id, tenantId, npsn, version, syncStatus, [tenantId+isActive], semesterCode',
      semesters: 'id, tenantId, npsn, version, syncStatus, [tenantId+academicYearId], [tenantId+isActive], academicYearId, code, startDate, endDate',
      days: 'id, order, name',
      daftar_kelas: 'id, tenantId, version, syncStatus, [tenantId+academicYearId], name',
      kelas: 'id, tenantId, npsn, version, syncStatus, [tenantId+academicYearId], tenantsId, classId, name',
      classes: 'id, tenantId, npsn, version, syncStatus, [tenantId+academicYearId], tenantsId, classId, academicYearId, waliKelasId, name',
      mata_pelajaran: 'id, tenantId, version, syncStatus, [tenantId+code], name',
      subjects: 'id, tenantId, npsn, version, syncStatus, [tenantId+code], name',
      ruang: 'id, tenantId, version, syncStatus, [tenantId+code], name',
      rooms: 'id, tenantId, npsn, version, syncStatus, [tenantId+code], name',
      jurusan: 'id, tenantId, version, syncStatus, [tenantId+code], name',
      kalender_akademik: 'id, tenantId, version, syncStatus, [tenantId+date], title',
      teacher_assignments: 'id, tenantId, npsn, version, syncStatus, [tenantId+teacherId], [tenantId+classId], [tenantId+subjectId]',
      riwayat_siswa: 'id, tenantId, version, syncStatus, [tenantId+studentId], academicYearId',
      jadwal: 'id, tenantId, version, syncStatus, [tenantId+classId], [tenantId+teacherId], [tenantId+classId+dayIndex], tenantsId, classId, day',
      schedules: 'id, tenantId, npsn, version, syncStatus, [tenantId+academicYearId], [tenantId+semesterId], [tenantId+classId], [tenantId+classId+dayId], [tenantId+classId+semesterId], academicYearId, semesterId, classId, dayId, timeSlotId, subjectId, teacherAssignmentId, roomId',
      time_slots: 'id, tenantId, npsn, version, syncStatus, [tenantId+academicYearId], academicYearId, period, startTime',
      schedule_exceptions: 'id, tenantId, npsn, version, syncStatus, [tenantId+scheduleId], date',
      schedule_logs: 'id, tenantId, npsn, version, syncStatus, [tenantId+scheduleId], createdAt',
      jadwal_mengajar: 'id, tenantId, version, syncStatus, [tenantId+teacherId], day',
      absensi_siswa: 'id, tenantId, version, syncStatus, [tenantId+scheduleId+date], [tenantId+studentId+date], [tenantId+classId+tanggal], [tenantId+studentsId+tanggal], [tenantId+tanggal], tenantsId, studentsId, studentId, date, tanggal, classId',
      attendance: 'id, tenantId, version, syncStatus, [tenantId+academicYearId], [tenantId+semesterId], [tenantId+scheduleId+date], [tenantId+studentId+date], [tenantId+classId+date], academicYearId, semesterId, scheduleId, studentId, classId, date, tanggal, studentsId, tenantsId',
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
      kategori_poin: 'id, tenantId, version, syncStatus, [tenantId+type], name',
      point_categories: 'id, tenantId, version, syncStatus, [tenantId+isActive], tenantsId, type, isActive',
      pointCategories: 'id, tenantId, version, syncStatus, [tenantId+isActive], tenantsId, type, isActive',
      jenis_pelanggaran: 'id, tenantId, version, syncStatus, [tenantId+categoryCode], name',
      jenis_prestasi: 'id, tenantId, version, syncStatus, [tenantId+categoryCode], name',
      poin: 'id, tenantId, version, syncStatus, [tenantId+studentId+date], [tenantId+studentsId+date], [tenantId+studentId], studentsId, studentId, categoryId, date',
      points: 'id, tenantId, version, syncStatus, [tenantId+studentId+date], [tenantId+studentsId+date], [tenantId+studentId], studentsId, studentId, categoryId, date',
      student_point_summaries: 'id, tenantId, version, syncStatus, [tenantId+studentId], [tenantId+studentsId], studentsId, studentId',
      konseling: 'id, tenantId, version, syncStatus, [tenantId+studentId], date',
      pemanggilan_orang_tua: 'id, tenantId, version, syncStatus, [tenantId+studentId], date',
      tindak_lanjut: 'id, tenantId, version, syncStatus, [tenantId+studentId], date',
      notification: 'id, tenantId, version, syncStatus, [tenantId+userId], [tenantId+isRead], createdAt',
      notifications: 'id, tenantId, version, syncStatus, [tenantId+userId], [tenantId+isRead], tenantsId, userId, isRead, createdAt',
      settings: 'id, tenantId, key',
      session: 'id, tenantId, uid, expiresAt',
      feature_flags: 'id, tenantId, key, enabled',
      sync_queue: 'id, tenantId, operation, collection, recordId, status, attempts, createdAt, updatedAt',
      dead_letter_queue: 'id, tenantId, createdAt, collection, entityId, operation, errorCode, status, failedAt',
      sync_log: 'id, tenantId, createdAt, collection, operation',
      audit_log: 'id, tenantId, createdAt, action',
      audit_logs: 'id, tenantId, createdAt, action',
      cache: 'id, tenantId, key, expiresAt',
      navigation_cache: 'id, tenantId, key, expiresAt',
      dashboard_summaries: 'id, tenantId, type, date',
      tenants: 'id, tenantId, version, syncStatus',
      chats: 'id, tenantId, createdAt',
      messages: 'id, tenantId, conversationId, createdAt',
      faq_categories: 'id, tenantId, name',
      faqs: 'id, tenantId, categoryId, updatedAt',
      support_agents: 'id, tenantId, userId',
      support_conversations: 'id, tenantId, userId, updatedAt',
      support_messages: 'id, tenantId, conversationId, createdAt',
      support_tickets: 'id, tenantId, status, createdAt',
      faq_feedback: 'id, tenantId, faqId, createdAt',
      quick_replies: 'id, tenantId, createdAt',
      service_surveys: 'id, tenantId, status, createdAt',
      survey_questions: 'id, tenantId, surveyId, order',
      survey_answers: 'id, tenantId, questionId, respondentId',
      survey_templates: 'id, tenantId, createdAt',
      survey_statistics: 'id, tenantId, surveyId, updatedAt',
      news: 'id, tenantId, createdAt',
      events: 'id, tenantId, startAt',
      ticker: 'id, tenantId, createdAt',
      conversations: 'id, tenantId, updatedAt',
      messageParticipants: 'id, tenantId, conversationId, userId',
      messageQueue: 'id, tenantId, status, createdAt',
      complaints: 'id, tenantId, status, createdAt',
      approval_requests: 'id, tenantId, status, createdAt',
      profile_update_requests: 'id, tenantId, status, createdAt',
      loginHistory: 'id, tenantId, uid, createdAt',
      loginLog: 'id, tenantId, uid, createdAt',
      activityLog: 'id, tenantId, createdAt',
      notificationLogs: 'id, tenantId, createdAt',
      syncMetadata: 'id, tenantId, updatedAt',
      pointRankings: 'id, tenantId, updatedAt',
      documentation: 'id, tenantId, updatedAt',
      systemSettings: 'id, tenantId, key',
      tenantConfigurations: 'id, tenantId, key',
      tenantBrandings: 'id, tenantId, key',
      tenantSettings: 'id, tenantId, key',
      tenantFeatures: 'id, tenantId, key',
      tenantStatistics: 'id, tenantId, key',
      tenantAudits: 'id, tenantId, createdAt',
      student_parents: 'id, tenantId, studentId, parentId',
      satuan_kerja: 'id, tenantId, code'
    };

    this.version(12).stores(schema);

    // V13: consolidate legacy duplicate stores into the canonical operational stores.
    // Data is copied before any legacy store is removed in V14.
    this.version(13).stores(schema).upgrade(async (tx) => {
      const migrations: Array<[string, string]> = [
        ['pengguna', 'users'], ['gtk', 'teachers'], ['siswa', 'students'],
        ['tahun_pelajaran', 'academic_years'], ['academicYears', 'academic_years'],
        ['semester', 'semesters'], ['daftar_kelas', 'classes'], ['kelas', 'classes'],
        ['mata_pelajaran', 'subjects'], ['ruang', 'rooms'], ['jadwal', 'schedules'],
        ['absensi_siswa', 'attendance'], ['absensi_guru', 'teacher_attendance'],
        ['jurnal', 'journals'], ['kategori_poin', 'point_categories'],
        ['pointCategories', 'point_categories'], ['poin', 'points'],
        ['notification', 'notifications'], ['audit_log', 'audit_logs'],
      ];
      for (const [legacyName, canonicalName] of migrations) {
        try {
          const rows = await tx.table(legacyName).toArray();
          const target = tx.table(canonicalName);
          for (const row of rows) {
            const id = row.id ?? row.idUnik ?? row.studentsId ?? row.teachersId ?? row.classId;
            if (id == null) continue;
            const existing = await target.get(id);
            if (!existing) await target.put({ ...row, id });
          }
        } catch (error) {
          console.warn('[Dexie V13] Legacy store migration skipped:', legacyName, error);
        }
      }
    });

    // V14: remove duplicate legacy stores after V13 has copied their data.
    const canonicalSchema = { ...schema };
    for (const legacyName of ["pengguna","gtk","siswa","academicYears","tahun_pelajaran","semester","daftar_kelas","kelas","mata_pelajaran","ruang","jadwal","absensi_siswa","absensi_guru","jurnal","kategori_poin","pointCategories","poin","notification","audit_log"]) delete canonicalSchema[legacyName as keyof typeof canonicalSchema];
    this.version(14).stores(canonicalSchema);

    // V15: enforce the canonical academic relation indexes used by offline repositories.
    this.version(15).stores(canonicalSchema).upgrade(async (tx) => {
      const students = tx.table('students');
      const classes = tx.table('classes');
      const schedules = tx.table('schedules');
      const attendance = tx.table('attendance');

      // Backfill FK fields only when the referenced canonical parent is already local.
      const classRows = await classes.toArray();
      const classById = new Map(classRows.map((row: any) => [String(row.id), row]));
      await students.toCollection().modify((row: any) => {
        if (!row.academicYearId && row.classId) {
          row.academicYearId = classById.get(String(row.classId))?.academicYearId;
        }
      });
      await schedules.toCollection().modify((row: any) => {
        if (!row.academicYearId && row.classId) {
          row.academicYearId = classById.get(String(row.classId))?.academicYearId;
        }
      });
      await attendance.toCollection().modify((row: any) => {
        if (!row.studentId && row.studentsId) row.studentId = row.studentsId;
        if (!row.classId && row.class) row.classId = row.class;
      });
    });
  }
}

export const db = new EMamDatabase();
