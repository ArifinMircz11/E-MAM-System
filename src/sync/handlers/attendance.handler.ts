import { firestoreAdapter as db } from '../adapters/firestore.adapter';
import axios from 'axios';
import { sanitizeForJSON, deepClean } from '@/utils/firestoreHelpers';
import type { Student } from '@/types';
import { generateClassId } from '@/utils/rombelHelpers';

const ATT_COL = 'attendance';
const STU_COL = 'students';

export async function handleAttendanceSync(payload: any, student: Student = {} as Student) {
  const attId = `${payload.studentId}_${payload.date}`;
  const attRef = db.doc(ATT_COL, attId);

  const attDataSnap = await db.getDoc(attRef);
  const attData = attDataSnap.exists() ? attDataSnap.data() : null;

  if (attData && attData[payload.fieldName]) {
    return { success: true, student, message: `Sudah terekam di sesi ${payload.session} (Already synced)` };
  }

  try {
    const response = await axios.post('/api/attendance/scan', {
      code: student.idUnik || student.id || payload.studentId,
      session: payload.session,
      isHaid: payload.isHaidMode,
    });
    if (response.data.success) {
      return {
        success: true,
        student: sanitizeForJSON<Student>(student),
        message: response.data.message,
      };
    }
  } catch (apiErr: any) {
    const errText = apiErr?.response?.data?.message || apiErr?.message || '';
    if (errText.includes('Sudah terekam')) {
      return {
        success: true,
        student: sanitizeForJSON<Student>(student),
        message: errText,
      };
    }
    console.warn('API request gagal, fallback ke Firestore Transaction');
  }

  await db.runTransaction(async (transaction: any) => {
    const currentAttSnap = await transaction.get(attRef);
    const currentAtt = currentAttSnap.exists() ? currentAttSnap.data() : null;
    if (currentAtt && currentAtt[payload.fieldName]) return;

    let finalPointsPenalty = payload.pointsPenalty || 0;
    let alreadyHasViolation = false;

    if (currentAtt) {
      const sessionsList = ['masuk', 'duha', 'zuhur', 'ashar', 'pulang'];
      for (const key of sessionsList) {
        if (key === payload.fieldName) continue;
        const val = currentAtt[key];
        if (
          val &&
          (String(val).includes('[T]') ||
            String(val).includes('[PC]') ||
            String(val).includes('TS') ||
            String(val).includes('Ts'))
        ) {
          alreadyHasViolation = true;
        }
      }
      if (currentAtt.totalPoinHariIni >= 5 || currentAtt.totalPointsAdded >= 5) {
        alreadyHasViolation = true;
      }
    }

    if (alreadyHasViolation) {
      finalPointsPenalty = 0;
    }

    const isHaidMode = payload.isHaidMode || false;
    const statusVal = ['T', 'PC', 'Alpha', 'Haid', 'Hadir'].includes(payload.status)
      ? payload.status
      : currentAtt?.status || 'Hadir';

    const hasAnyViolationNow = finalPointsPenalty > 0 || alreadyHasViolation;
    const finalTotalPoinHariIni = isHaidMode
      ? 0
      : statusVal === 'Alpha'
        ? 10
        : hasAnyViolationNow
          ? 5
          : 0;

    const updateData: any = {
      studentsId: payload.studentId || null,
      studentName: payload.studentName || 'Siswa',
      idUnik: payload.studentId || null,
      nisn: payload.nisn || null,
      className: payload.className || payload.class || 'Tanpa Kelas',
      classId: generateClassId(
        payload.tenantId || 'default',
        payload.className || payload.class || 'Tanpa Kelas',
      ),
      class: payload.class || payload.className || 'Tanpa Kelas',
      date: payload.date || new Date().toISOString().split('T')[0],
      tenantId: payload.tenantId || 'default',
      tahunAngkatan: payload.academicYear || '2025',
      [payload.fieldName || 'unknown']: payload.finalVal || '-',
      status: statusVal,
      statusGlobal:
        statusVal === 'T'
          ? 'Terlambat'
          : statusVal === 'PC'
            ? 'PC'
            : statusVal === 'Alpha'
              ? 'Alpha'
              : 'Hadir',
      totalPoinHariIni: finalTotalPoinHariIni,
      totalPointsAdded: finalTotalPoinHariIni,
      lastUpdated: db.serverTimestamp(),
      isHaid: isHaidMode,
      metadata: {
        source: 'web_scanner',
        session: payload.session || 'Unknown',
        mode: isHaidMode ? 'haid' : 'normal',
      },
    };

    if (isHaidMode) {
      if (!currentAtt?.duha) updateData.duha = `${payload.timeStr} + Haid`;
      if (!currentAtt?.zuhur) updateData.zuhur = `${payload.timeStr} + Haid`;
      if (!currentAtt?.ashar) updateData.ashar = `${payload.timeStr} + Haid`;
    }

    transaction.set(attRef, deepClean(updateData), { merge: true });

    if (finalPointsPenalty > 0) {
      const pointId = `${payload.studentId}_${payload.date}_${payload.fieldName}`;
      const pointRef = db.doc('poin', pointId);
      transaction.set(
        pointRef,
        deepClean({
          studentsId: payload.studentId,
          namaSiswa: payload.studentName,
          class: payload.class,
          skor: finalPointsPenalty,
          kategori: 'Pelanggaran',
          keterangan: `Pelanggaran Kedisiplinan: ${payload.penaltyType} pada sesi ${payload.session} (${payload.timeStr})`,
          tanggal: payload.date,
          jenis: 'Otomatis Sesi',
          idPetugas: 'SYSTEM_BOT',
          serverTime: db.serverTimestamp(),
        }),
      );

      const summaryRef = db.doc('student_point_summaries', payload.studentId);
      transaction.set(
        summaryRef,
        deepClean({
          totalPoints: db.increment(finalPointsPenalty),
          lastUpdate: db.serverTimestamp(),
        }),
        { merge: true },
      );

      const studentRef = db.doc(STU_COL, payload.studentId);
      transaction.update(
        studentRef,
        deepClean({
          point: db.increment(finalPointsPenalty),
          lastModified: db.serverTimestamp(),
        }),
      );
    }

    if (payload.session === 'Masuk' && !currentAtt) {
      const statsId = `${payload.date}_${payload.tenantId}`;
      const dailyStatsRef = db.doc('daily_stats', statsId);
      transaction.set(
        dailyStatsRef,
        deepClean({
          totalHadir: db.increment(1),
          tenantId: payload.tenantId,
          date: payload.date,
          lastUpdate: db.serverTimestamp(),
        }),
        { merge: true },
      );
    }
  });

  return { success: true, student: sanitizeForJSON<Student>(student), message: payload.status };
}
