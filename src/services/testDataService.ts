import { useUserStore } from '@/stores/userStore';
import { sendComplaintSecure } from './complaintService';
import { sendMessageSecure } from './chatService';
import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { db } from './firebase';

/**
 * Pola 1 & 2: Fungsi Migrasi Massal untuk Menyelaraskan Field Sesuai types.ts
 * Mengubah data kotor / "semua rombel" menjadi format standar Alfanumerik (A-Z 0-9)
 */
export const executeDatabaseSchemaMigration = async (
  defaultFallbackClass: string = 'X-A',
): Promise<{ migratedCount: number }> => {
  const tenantId = useUserStore.getState().tenantId;
  if (!tenantId) throw new Error('tenantId required for migration');

  const collectionsToMigrate = ['chats', 'letters', 'notifications', 'users', 'points_log'];
  let totalMigrated = 0;
  const batch = dbGateway.writeBatch(db);

  // Pola Regex: Hanya menerima karakter Alfanumerik dan tanda hubung dasar (A-Z, 0-9, -)
  const validRombelRegex = /^[A-Z0-9-]+$/i;

  try {
    for (const collName of collectionsToMigrate) {
      const collRef = dbGateway.collection(db, collName);
      const snapshot = await dbGateway.getDocs(dbGateway.query(collRef, dbGateway.where('tenantId', '==', tenantId)));

      snapshot.forEach((document) => {
        const data = document.data();
        const docRef = dbGateway.doc(db, collName, document.id);
        const updatePayload: any = {};
        let shouldUpdate = false;

        // 1. Migrasi Kunci Relasi Siswa: studentID / idSiswa -> studentsId
        if (data.studentID && !data.studentsId) {
          updatePayload.studentsId = String(data.studentID).trim();
          shouldUpdate = true;
        } else if (data.idSiswa && !data.studentsId) {
          updatePayload.studentsId = String(data.idSiswa).trim();
          shouldUpdate = true;
        }

        // 2. Migrasi Kunci Relasi Guru: teacherID / NIP -> teachersId
        if (data.teacherID && !data.teachersId) {
          updatePayload.teachersId = String(data.teacherID).trim();
          shouldUpdate = true;
        } else if (data.NIP && !data.teachersId) {
          updatePayload.teachersId = String(data.NIP).trim();
          shouldUpdate = true;
        }

        // 3. Normalisasi & Barikade Filter Rombel: Mengeliminasi teks "semua rombel"
        let rawRombel =
          data.targetRombel || data.kelasTarget || data.metaData?.rombelAtauKontak || '';
        rawRombel = String(rawRombel).trim();

        // Jika rombel terdeteksi mengandung teks "semua rombel" atau tidak valid alfanumerik, paksa ke fallback kelas
        if (
          rawRombel.toLowerCase().includes('semua') ||
          rawRombel === '' ||
          !validRombelRegex.test(rawRombel)
        ) {
          if (data.targetRombel !== defaultFallbackClass) {
            updatePayload.targetRombel = defaultFallbackClass;
            shouldUpdate = true;
          }
        } else if (!data.targetRombel || data.targetRombel !== rawRombel.toUpperCase()) {
          // Jika sudah berupa kode alfanumerik valid (A-Z 0-9) tapi belum di-set di targetRombel level atas
          updatePayload.targetRombel = rawRombel.toUpperCase();
          shouldUpdate = true;
        }

        // Jika dokumen membutuhkan penyesuaian skema, masukkan ke antrean batch mutasi
        if (shouldUpdate) {
          batch.update(docRef, updatePayload);
          totalMigrated++;
        }
      });
    }

    // Eksekusi mutasi massal secara atomik jika ada data yang perlu dimigrasikan
    if (totalMigrated > 0) {
      await batch.commit();
    }

    return { migratedCount: totalMigrated };
  } catch (error: any) {
    console.error('Gagal mengeksekusi operasi migrasi skema database:', error);
    throw new Error(`Migrasi gagal: ${error.message}`);
  }
};

export const generateDummyChats = async () => {
  // Generate some chats and complaints for demo
  const testCases = [
    {
      sender: 'S001',
      receiver: 'G001',
      msg: 'Halo Bapak/Ibu Guru, saya ada pertanyaan materi kemarin.',
    },
    {
      sender: 'G001',
      receiver: 'S001',
      msg: 'Tentu, silakan tanya bagian mana yang kurang jelas.',
    },
    { sender: 'P001', receiver: 'G001', msg: 'Selamat pagi Pak/Bu, anak saya izin hari ini.' },
  ];

  for (const c of testCases) {
    // sendMessageSecure handles its own room generation and metadata
    await sendMessageSecure(c.sender, c.receiver, c.msg);
  }
};

export const generateDummyComplaints = async () => {
  const testCases = [
    {
      uid: 'S001',
      nama: 'Siswa A',
      peran: 'siswa' as const,
      rom: '10 A',
      msg: 'AC di kelas 10 A kurang dingin, mohon diperbaiki.',
    },
    {
      uid: 'anon-456',
      nama: 'Warga Sekitar',
      peran: 'publik' as const,
      rom: '081234567890',
      msg: 'Parkiran sekolah sering membuat macet gang, mohon ditertibkan.',
    },
    {
      uid: 'anon-789',
      nama: 'Calon Wali Murid',
      peran: 'publik' as const,
      rom: '081987654321',
      msg: 'Apakah masih ada kuota pendaftaran pindahan untuk kelas 11?',
    },
  ];

  for (const c of testCases) {
    // sendComplaintSecure now uses rom for targetRombel
    await sendComplaintSecure(c.uid, c.nama, c.peran, c.rom, c.msg);
  }
};
