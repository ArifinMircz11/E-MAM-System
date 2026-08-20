import { Router } from 'express';
import admin, { adminDb, handleFirestoreError, OperationType } from '../../src/lib/firebase-admin';
import { NotificationService } from '../../src/lib/notification-service';
import axios from 'axios';
import { format } from 'date-fns';
import { Student } from '../../src/types';
import {
  getMakassarDate,
  getMakassarDateString,
  getMakassarTimeString,
  getMakassarTimeWithSecondsString,
} from '../../src/utils/timezone';

const router = Router();

/**
 * POST /api/attendance/scan
 * Mencatat presensi dan kirim notifikasi Otomatis (WA + Push)
 */
router.post('/scan', async (req, res) => {
  const { code, session, isHaid } = req.body;

  try {
    if (!code || !session) {
      return res.status(400).json({ success: false, message: 'Code and session are required' });
    }

    // 1. Cari Siswa berdasarkan studentId (Document ID)
    let studentData: Student | null = null;
    const studentsPath = 'students';
    try {
      // Direct document access by studentId (Document ID)
      const docRef = adminDb.collection(studentsPath).doc(code);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        studentData = { ...docSnap.data(), id: docSnap.id } as Student;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, studentsPath);
    }

    if (!studentData || !studentData.id) {
      return res
        .status(404)
        .json({
          success: false,
          message: `Siswa dengan ID "${code}" tidak ditemukan di database e-Mam System.`,
        });
    }

    // 2. Persiapan Data & Transaction (Menggunakan Zona Waktu Makassar)
    const today = getMakassarDateString();
    const nowTime = getMakassarTimeWithSecondsString();
    const timeStr = getMakassarTimeString();
    const mDate = getMakassarDate();
    const isFriday = mDate.getDay() === 5;

    // 1b. Ambil Konfigurasi Akademik Aktif (Dynamic Limits)
    let masukLimit = '07:30';
    let pulangLimit = isFriday ? '11:30' : '16:00';

    try {
      const yearSnap = await adminDb
        .collection('academic_years')
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (!yearSnap.empty) {
        const yearConfig = yearSnap.docs[0].data();
        const configSesi = yearConfig.waktu_kerja || yearConfig.config; // Flexibel support

        if (configSesi) {
          if (configSesi.masuk_limit) masukLimit = configSesi.masuk_limit;
          else if (configSesi.masuk) masukLimit = configSesi.masuk; // Fallback to basic field

          if (isFriday && configSesi.pulang_limit_jumat) {
            pulangLimit = configSesi.pulang_limit_jumat;
          } else if (configSesi.pulang_limit) {
            pulangLimit = configSesi.pulang_limit;
          } else if (configSesi.pulang) {
            pulangLimit = configSesi.pulang;
          }
        }
      }
    } catch (configErr) {
      console.warn('Failed to fetch dynamic config, using default limits:', configErr);
    }

    const attendanceId = `${studentData.id}_${today}`;
    const attendanceRef = adminDb.collection('attendance').doc(attendanceId);
    const statsRef = adminDb.collection('daily_stats').doc(today);

    const fieldMap: Record<string, string> = {
      Masuk: 'masuk',
      Duha: 'duha',
      Zuhur: 'zuhur',
      Ashar: 'ashar',
      Pulang: 'pulang',
    };
    const fieldName = fieldMap[session] || session.toLowerCase();

    let isLate = false;
    let isPC = false;
    let pointsPenalty = 0;
    let penaltyType = '';
    let status = 'Hadir';

    if (session === 'Masuk' && !isHaid) {
      if (timeStr > masukLimit) {
        isLate = true;
        pointsPenalty = 5;
        penaltyType = 'Terlambat';
        status = 'T';
      }
    } else if (session === 'Pulang' && !isHaid) {
      if (timeStr < pulangLimit) {
        isPC = true;
        pointsPenalty = 5;
        penaltyType = 'Pulang Cepat (PC)';
        status = 'PC';
      }
    } else if (isHaid) {
      status = 'Haid';
    }

    // 3. Logika Database (Atomic Transaction untuk Kehadiran dan Poin Otomatis)
    await adminDb.runTransaction(async (transaction: any) => {
      const attDoc = await transaction.get(attendanceRef);
      const currentAtt = attDoc.exists ? attDoc.data() : null;

      if (currentAtt && currentAtt[fieldName]) {
        throw new Error(
          JSON.stringify({ success: false, message: `Sudah terekam di sesi ${session}!` }),
        );
      }

      const statusVal = isHaid
        ? 'Haid'
        : ['T', 'PC'].includes(status)
          ? status
          : currentAtt?.status || 'Hadir';
      const finalVal = isHaid
        ? `${nowTime} + Haid`
        : isLate
          ? `${nowTime} [T]`
          : isPC
            ? `${nowTime} [PC]`
            : nowTime;

      // Map status abbreviations to full AttendanceStatus strings
      let statusGlobalVal: string = statusVal;
      if (statusVal === 'T') statusGlobalVal = 'Terlambat';
      else if (statusVal === 'PC') statusGlobalVal = 'PC';
      else if (statusVal === 'A') statusGlobalVal = 'Alpha';

      // Calculate daily points penalty logic (Max 5 points daily cap for presence violations)
      let finalPointsPenalty = pointsPenalty;
      let alreadyHasViolation = false;
      if (currentAtt) {
        const sessionsList = ['masuk', 'duha', 'zuhur', 'ashar', 'pulang'];
        for (const key of sessionsList) {
          if (key === fieldName) continue;
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

      const hasAnyViolationNow = finalPointsPenalty > 0 || alreadyHasViolation;
      const finalTotalPoinHariIni = isHaid
        ? 0
        : statusGlobalVal === 'Alpha'
          ? 10
          : hasAnyViolationNow
            ? 5
            : 0;

      const updatePayload: any = {
        studentId: studentData.id,
        studentsId: studentData.id,
        studentName: studentData.namaLengkap,
        name: studentData.namaLengkap,
        class: studentData.tingkatRombel,
        idUnik: studentData.idUnik || code,
        date: today,
        status: statusVal,
        statusGlobal: statusGlobalVal,
        totalPoinHariIni: finalTotalPoinHariIni,
        totalPointsAdded: finalTotalPoinHariIni,
        [fieldName]: finalVal,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Integrasi Sibling Sesi untuk Haid
      if (isHaid) {
        if (!currentAtt?.duha) updatePayload.duha = `${nowTime} + Haid`;
        if (!currentAtt?.zuhur) updatePayload.zuhur = `${nowTime} + Haid`;
        if (!currentAtt?.ashar) updatePayload.ashar = `${nowTime} + Haid`;
      }

      transaction.set(attendanceRef, updatePayload, { merge: true });

      // Sinkronisasi Daily Stats
      const statsUpdate: any = {
        totalHadir: admin.firestore.FieldValue.increment(
          session === 'Masuk' && !currentAtt ? 1 : 0,
        ),
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
        [`perType.${session}`]: admin.firestore.FieldValue.increment(1),
      };

      if (isHaid) {
        statsUpdate['perType.Haid'] = admin.firestore.FieldValue.increment(1);
      } else if (isLate) {
        statsUpdate['perType.Terlambat'] = admin.firestore.FieldValue.increment(1);
      } else if (isPC) {
        statsUpdate['perType.PulangCepat'] = admin.firestore.FieldValue.increment(1);
      }

      if (studentData.tingkatRombel) {
        statsUpdate[`perKelas.${studentData.tingkatRombel}`] =
          admin.firestore.FieldValue.increment(1);
      }

      transaction.set(statsRef, statsUpdate, { merge: true });

      // Terapkan Poin Pelanggaran Otomatis ke Koleksi Poin, Ringkasan, dan Data Siswa
      if (finalPointsPenalty > 0) {
        const pointId = `${studentData.idUnik || studentData.id}_${today}_${fieldName}`;
        const pointRef = adminDb.collection('poin').doc(pointId);

        transaction.set(pointRef, {
          studentsId: studentData.idUnik || studentData.id,
          namaSiswa: studentData.namaLengkap,
          class: studentData.tingkatRombel,
          skor: finalPointsPenalty,
          kategori: 'Pelanggaran',
          keterangan: `Pelanggaran Kedisiplinan: ${penaltyType} pada sesi ${session} (${timeStr})`,
          tanggal: today,
          jenis: 'Otomatis Sesi',
          idPetugas: 'SYSTEM_BOT',
          serverTime: admin.firestore.FieldValue.serverTimestamp(),
        });

        const summaryRef = adminDb
          .collection('student_point_summaries')
          .doc(studentData.idUnik || studentData.id);
        transaction.set(
          summaryRef,
          {
            totalPoints: admin.firestore.FieldValue.increment(finalPointsPenalty),
            lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        const studentRef = adminDb.collection('students').doc(studentData.id);
        transaction.update(studentRef, {
          point: admin.firestore.FieldValue.increment(finalPointsPenalty),
          lastModified: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Catat poin pelanggaran harian
        transaction.set(
          statsRef,
          {
            totalPoinPelanggaran: admin.firestore.FieldValue.increment(finalPointsPenalty),
          },
          { merge: true },
        );
      }
    });

    // 4. Automated Notifications (Async via Hub)

    // Channel: Parent (WhatsApp)
    NotificationService.notify({
      title: `Presensi ${session}`,
      body: `*PRESENSI E-MAM SYSTEM*\n\nAlhamdulillah, siswa: *${studentData.namaLengkap}*\nSesi: *${session}*\nJam: ${nowTime}\nStatus: ${isHaid ? 'Haid' : isLate ? 'Terlambat' : 'Hadir'}\n\nTerima kasih.`,
      whatsappTarget: studentData.noTelepon,
      targetUids: studentData.linkedUserId ? [studentData.linkedUserId] : [],
    });

    // Channel: BK / Guru (Push Alert for Tardiness)
    if (isLate) {
      NotificationService.notify({
        title: 'Alerta Siswa Terlambat',
        body: `Siswa *${studentData.namaLengkap}* baru saja melakukan scan masuk pada jam ${nowTime} (TERLAMBAT).`,
        role: 'admin', // Notify admins/BK
        data: {
          type: 'LATE_ALERT',
          studentId: studentData.id,
        },
      });
    }

    res.json({
      success: true,
      message: `Berhasil mencatat kehadiran ${session} untuk ${studentData.namaLengkap}`,
      data: {
        name: studentData.namaLengkap,
        session,
        time: nowTime,
        isLate,
      },
    });
  } catch (error: any) {
    console.error('Scan General Error:', error);
    // If it was already handled and re-thrown as JSON, we send that
    try {
      const parsed = JSON.parse(error.message);
      res.status(500).json({ success: false, ...parsed });
    } catch {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

export default router;
