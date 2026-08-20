import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json';
import { format } from 'date-fns';

const app = initializeApp(appletConfig);
const db = getFirestore(app, appletConfig.firestoreDatabaseId);

const getMakassarDateString = () => format(new Date(), 'yyyy-MM-dd');
const getMakassarTimeString = () => format(new Date(), 'HH:mm');

// Logic: Omni-Guard Point Engine
// Alpha +10, Late(Terlambat)/PC/TS +5, Haid 0, Hadir 0, Izin 0, Sakit 0
const STATUS_OPTIONS = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat', 'PC', 'TS', 'Haid'];

function getRandomStatus(gender: string): string {
  // Hanya perempuan yang bisa Haid
  const options =
    gender === 'Perempuan' ? [...STATUS_OPTIONS] : STATUS_OPTIONS.filter((s) => s !== 'Haid');
  const rand = Math.floor(Math.random() * options.length);
  return options[rand];
}

async function generateRandomAttendance() {
  console.log('Memulai Generate Data Acak Omni-Guard Point Engine...');

  try {
    const today = getMakassarDateString();

    // 1. Ambil semua siswa
    const studentsSnap = await getDocs(query(collection(db, 'students')));
    const students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);

    console.log(`Ditemukan ${students.length} siswa, memproses data presensi...`);

    let totalHadir = 0;
    const perType: any = {};
    const perGender: any = {};

    // 2. Loop & Apply Omni Guard logic
    for (const student of students) {
      const status = getRandomStatus(student.jenisKelamin || 'Laki-laki');
      const timeStr = getMakassarTimeString();
      let poinPelanggaran = 0;
      let finalVal = timeStr;

      // Assign Value and Points
      if (status === 'Alpha') poinPelanggaran = 10;
      if (status === 'Terlambat') {
        poinPelanggaran = 5;
        finalVal = `${timeStr} [T]`;
      }
      if (status === 'PC') {
        // Pulang Cepat
        poinPelanggaran = 5;
        finalVal = `${timeStr} [PC]`;
      }
      if (status === 'TS') {
        // Tidak Scan/Tidak Sholat
        poinPelanggaran = 5;
      }
      if (status === 'Haid') {
        poinPelanggaran = 0;
        finalVal = `${timeStr} + Haid`;
      }
      if (status === 'Hadir') {
        totalHadir++;
        const jk = student.jenisKelamin || 'Unknown';
        perGender[jk] = (perGender[jk] || 0) + 1;
      }

      perType[status] = (perType[status] || 0) + 1;

      // Update Attendance Doc
      const docId = `${student.idUnik || student.id}_${today}`;
      const attRef = doc(db, 'attendance', docId);

      const attendanceData: any = {
        studentsId: student.idUnik || student.id || '',
        studentName: student.namaLengkap,
        idUnik: student.idUnik,
        nisn: student.nisn || '',
        class: student.tingkatRombel,
        date: today,
        masuk: finalVal,
        status: status,
        pointApplied: poinPelanggaran,
        lastUpdated: serverTimestamp(),
      };

      if (status === 'Haid') {
        attendanceData.duha = `${timeStr} + Haid`;
        attendanceData.zuhur = `${timeStr} + Haid`;
        attendanceData.ashar = `${timeStr} + Haid`;
      }

      await setDoc(attRef, attendanceData, { merge: true });

      // Save dummy point history (if points applied)
      if (poinPelanggaran > 0) {
        const pointId = `${student.idUnik || student.id}_${today}_Acak`;
        await setDoc(doc(db, 'poin', pointId), {
          studentsId: student.idUnik || student.id,
          namaSiswa: student.namaLengkap,
          skor: poinPelanggaran,
          class: student.tingkatRombel,
          kategori: 'Pelanggaran',
          keterangan: `Sistem Acak: Terindikasi ${status}`,
          tanggal: today,
          jenis: 'Otomatis Sesi',
          idPetugas: 'SYSTEM_BOT_RANDOM',
          serverTime: serverTimestamp(),
        });
      }

      console.log(
        `[+] ${student.namaLengkap} - ${student.tingkatRombel} -> ${status} (Skor: ${poinPelanggaran})`,
      );
    }

    // 3. Update summary
    const dailyStatsRef = doc(db, 'daily_stats', today);
    await setDoc(
      dailyStatsRef,
      {
        totalHadir,
        perType,
        perGender,
        totalPoinPelanggaran: Object.entries(perType).reduce((acc, [k, v]) => {
          if (k === 'Alpha') return (acc as number) + (v as number) * 10;
          if (['Terlambat', 'PC', 'TS'].includes(k)) return (acc as number) + (v as number) * 5;
          return acc;
        }, 0),
        lastUpdate: serverTimestamp(),
      },
      { merge: true },
    );

    console.log('SELESAI! Data berhasil digenerate secara acak.');
  } catch (err: any) {
    console.error('Gagal menggenerate data:', err.message);
  }
}

generateRandomAttendance();
