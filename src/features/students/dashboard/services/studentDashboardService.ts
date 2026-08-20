import { localDb } from '@/database/dexie';
import { getMasterVersion } from '@/services/systemService';
import type { StudentDashboardData } from '../types';
import { getMakassarDateString } from '@/utils/timezone';
import { getSecurityContext } from '@/core/security/contextHelper';

export const getStudentDashboardData = async (
  studentsId: string,
  classId: string,
): Promise<StudentDashboardData> => {
  const today = getMakassarDateString();

  const secCtx = getSecurityContext(false);
  if (secCtx && secCtx.role === 'siswa' && secCtx.referenceId !== studentsId) {
    console.warn(`[Security] Siswa ${secCtx.referenceId} attempted to view dashboard for ${studentsId}`);
    throw new Error('Akses Ditolak: Anda hanya dapat melihat dashboard Anda sendiri.');
  }

  // 1. Try to get local version first (Offline-First)
  const localVersionSnap = await localDb.systemSettings.get('master_version');
  const localVersion = localVersionSnap?.value || 0;

  // 2. Try to get latest version in background if online, don't block.
  if (navigator.onLine) {
    getMasterVersion()
      .then((v) => {
        if (v !== localVersion) {
          localDb.systemSettings.put({ key: 'master_version', value: v, lastUpdated: Date.now() });
        }
      })
      .catch(console.warn);
  }

  // 3. Cache First & Offline-First: Fetch from Dexie
  const student = await localDb.students.get(studentsId);
  const attendance = await localDb.attendance.get(`${studentsId}_${today}`);
  const pointSummary = await localDb.student_point_summaries.get(studentsId);

  return {
    profile: student || null,
    attendanceToday: attendance
      ? {
          masuk: typeof attendance.masuk === 'object' ? attendance.masuk?.jam : attendance.masuk,
          duha: typeof attendance.duha === 'object' ? attendance.duha?.jam : attendance.duha,
          zuhur: typeof attendance.zuhur === 'object' ? attendance.zuhur?.jam : attendance.zuhur,
          ashar: typeof attendance.ashar === 'object' ? attendance.ashar?.jam : attendance.ashar,
          pulang: typeof attendance.pulang === 'object' ? attendance.pulang?.jam : attendance.pulang,
          status: (attendance.statusGlobal || attendance.status || 'Belum Ada') as any,
        }
      : null,
    pointSummary: pointSummary || null,
    schedulesToday: [],
    activePermission: null,
    notif: [],
    letters: [],
    news: [],
  } as StudentDashboardData;
};
