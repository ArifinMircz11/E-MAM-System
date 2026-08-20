import { useMemo } from 'react';
import type { Student } from '@/types';

export const useDashboardAnomalies = (
  students: Student[],
  todayAttendanceRecords: any[],
  isStaff: boolean,
) => {
  return useMemo(() => {
    if (!isStaff || !students || students.length === 0) return null;

    const listTs: any[] = [];
    const listHaid: any[] = [];
    const listT: any[] = [];
    const listPC: any[] = [];
    const listTerdeteksi: any[] = [];
    const listHadir: any[] = [];
    const listAlpha: any[] = [];
    const listSakitIzin: any[] = [];

    const attMap = new Map<string, any>(
      todayAttendanceRecords.map((r) => [
        String(r.studentsId || r.studentId || r.studentUID || r.student_id || ''),
        r,
      ]),
    );
    const merged = students.map((s) => {
      const studentId = String(s.id || s.studentsId || '');
      const att = attMap.get(studentId);
      return { ...s, att: att || null };
    });

    merged.forEach((s: any) => {
      const att = s.att;
      const status = att?.status || 'Alpha';

      if (['Hadir', 'Terlambat', 'Haid'].includes(status)) {
        listHadir.push({
          ...s,
          reason:
            status === 'Terlambat'
              ? 'Hadir (Terlambat)'
              : status === 'Haid'
                ? 'Hadir (Haid)'
                : 'Hadir Tepat Waktu',
        });
      } else if (status === 'Sakit' || status === 'Izin') {
        listSakitIzin.push({ ...s, reason: `Absen (${status})` });
      } else {
        listAlpha.push({ ...s, reason: 'Alpha / Belum Scan' });
      }

      if (!att) return;

      // Terdeteksi
      const sessions = ['masuk', 'duha', 'zuhur', 'ashar', 'pulang'];
      const hasAnyScan = sessions.some(
        (sess) =>
          att[sess] &&
          att[sess] !== '--:--' &&
          att[sess] !== 'TS (Tidak Scan)' &&
          att[sess] !== 'TS',
      );
      if (hasAnyScan) {
        listTerdeteksi.push(s);
      }

      // Terlambat
      const isLate =
        att.status === 'Terlambat' ||
        att.status === 'Late' ||
        (att.masuk && String(att.masuk).includes('[T]'));
      if (isLate) listT.push({ ...s, reason: `Masuk: ${att.masuk || '-'}` });

      // Pulang Cepat
      const isPC =
        att.status === 'PC' ||
        (att.pulang && String(att.pulang).includes('[PC]') && att.pulang !== 'TS (Tidak Scan)');
      if (isPC) listPC.push({ ...s, reason: `Pulang: ${att.pulang || '-'}` });

      // Haid & TS
      let hasHaid = false;
      const tsSess: string[] = [];

      sessions.forEach((sess) => {
        const val = att[sess];
        if (val && (String(val).includes('(haid)') || String(val).toLowerCase().includes('haid')))
          hasHaid = true;
        if (val === 'TS (Tidak Scan)') tsSess.push(sess.toUpperCase());
      });

      if (att.masuk && att.masuk !== '--:--' && !['Alpha', 'Sakit', 'Izin'].includes(att.status)) {
        if (!att.zuhur || att.zuhur === '--:--') tsSess.push('ZUHUR');
        if (!att.ashar || att.ashar === '--:--') tsSess.push('ASHAR');
        if (!att.pulang || att.pulang === '--:--') tsSess.push('PULANG');
      }

      if (tsSess.length > 0) {
        listTs.push({ ...s, reason: `Belum Scan: ${tsSess.join(', ')}` });
      }
      if (hasHaid || status === 'Haid') {
        listHaid.push({ ...s, reason: 'Ibadah Khusus (Haid)' });
      }
    });

    return {
      listTerdeteksi,
      listHadir,
      listSakitIzin,
      listAlpha,
      listTs,
      listT,
      listPC,
      listHaid,
    };
  }, [students, todayAttendanceRecords, isStaff]);
};
