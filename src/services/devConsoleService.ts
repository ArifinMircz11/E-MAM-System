export const fetchSystemConfig = async () => {
  return {
    alert: {
      isActive: false,
      title: '',
      message: '',
    },
    features: {},
    permissions: {},
    lockedFeatures: [],
  };
};

export const fetchCollectionData = async (collectionName: string) => {
  try {
    const { db } = await import('@/database/db');
    if (db.table(collectionName)) {
      return await db.table(collectionName).toArray();
    }
  } catch {}
  return [];
};

export const saveDocumentToCollection = async (collectionName: string, id: string | null, data: any) => {
  try {
    const { db } = await import('@/database/db');
    if (db.table(collectionName)) {
      const docId = id || data.id || `doc_${Date.now()}`;
      await db.table(collectionName).put({ ...data, id: docId });
      return true;
    }
  } catch {}
  return false;
};

export const deleteDocumentFromCollection = async (collectionName: string, docId: string) => {
  try {
    const { db } = await import('@/database/db');
    if (db.table(collectionName)) {
      await db.table(collectionName).delete(docId);
      return true;
    }
  } catch {}
  return false;
};

export const toggleFeatureLock = async (id: string, lockedFeatures: string[]) => {
  const next = [...lockedFeatures];
  const idx = next.indexOf(id);
  if (idx >= 0) {
    next.splice(idx, 1);
  } else {
    next.push(id);
  }
  return next;
};

export const savePermissions = async (permissions: any) => {
  return true;
};

export const generateTeacherAttendanceDummy = async (logCallback: (msg: string) => void) => {
  logCallback('Memulai inisiasi data kehadiran GTK...');
  try {
    const { db } = await import('@/database/db');
    if (db.table('teachers') && db.table('teacher_attendance')) {
      const teachers = await db.table('teachers').toArray();
      if (teachers.length === 0) {
        logCallback('Info: Tidak ada data GTK di database untuk dibuat kehadiran.');
        return;
      }
      logCallback(`Ditemukan ${teachers.length} GTK. Memproses pembuatan riwayat presensi...`);
      const today = new Date().toISOString().split('T')[0];
      for (const t of teachers) {
        await db.table('teacher_attendance').put({
          id: `t_att_${t.id}_${today}`,
          tenantId: t.tenantId || '30315537',
          teacherId: t.id,
          teacherName: t.name || t.namaLengkap || 'Guru',
          tanggal: today,
          status: 'Hadir',
          jamMasuk: '07:05',
          jamPulang: '15:30',
          createdAt: Date.now(),
        });
      }
      logCallback('SUKSES: Seluruh GTK berhasil melakukan presensi hari ini.');
    }
  } catch (e: any) {
    logCallback(`ERROR: ${e.message}`);
  }
};

export const generateRandomPointsForRombels = async (rombelNames: string[], logCallback: (msg: string) => void) => {
  logCallback('Menghasilkan point dan sanksi siswa...');
  try {
    const { db } = await import('@/database/db');
    if (db.table('students') && db.table('points')) {
      const students = await db.table('students').toArray();
      const filtered = students.filter(s => rombelNames.includes(s.className || s.classId || ''));
      if (filtered.length === 0) {
        logCallback('Info: Tidak ada siswa di rombel terpilih.');
        return { success: true, count: 0 };
      }
      
      let count = 0;
      const pointTypes = [
        { title: 'Terlambat Masuk Madrasah', points: 5, type: 'Pelanggaran', category: 'Kedisiplinan' },
        { title: 'Atribut Seragam Tidak Lengkap', points: 3, type: 'Pelanggaran', category: 'Kerapian' },
        { title: 'Juara 1 Lomba Pidato Bahasa Arab', points: 15, type: 'Penghargaan', category: 'Prestasi' },
      ];
      
      for (const s of filtered) {
        if (Math.random() > 0.6) {
          const template = pointTypes[Math.floor(Math.random() * pointTypes.length)];
          await db.table('points').put({
            id: `pt_${s.id}_${Date.now()}_${count}`,
            tenantId: s.tenantId || '30315537',
            studentId: s.id,
            studentName: s.name,
            className: s.className || 'Umum',
            title: template.title,
            points: template.points,
            type: template.type,
            category: template.category,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          count++;
        }
      }
      logCallback(`SUKSES: ${count} point sanksi & prestasi berhasil digenerate.`);
      return { success: true, count };
    }
  } catch (e: any) {
    logCallback(`ERROR Points: ${e.message}`);
  }
  return { success: false, count: 0 };
};

export const generateRandomLettersForRombels = async (rombelNames: string[], logCallback: (msg: string) => void) => {
  logCallback('Menghasilkan dokumen surat izin...');
  try {
    const { db } = await import('@/database/db');
    if (db.table('students') && db.table('letters')) {
      const students = await db.table('students').toArray();
      const filtered = students.filter(s => rombelNames.includes(s.className || s.classId || ''));
      if (filtered.length === 0) {
        logCallback('Info: Tidak ada siswa di rombel terpilih.');
        return { success: true, count: 0 };
      }
      
      let count = 0;
      const letterTypes = [
        { type: 'Izin', title: 'Surat Keterangan Sakit', desc: 'Permohonan izin karena sakit demam.' },
        { type: 'Izin', title: 'Surat Dispensasi Kegiatan', desc: 'Izin mengikuti lomba eksternal.' },
      ];
      
      for (const s of filtered) {
        if (Math.random() > 0.8) {
          const template = letterTypes[Math.floor(Math.random() * letterTypes.length)];
          await db.table('letters').put({
            id: `let_${s.id}_${Date.now()}_${count}`,
            tenantId: s.tenantId || '30315537',
            studentId: s.id,
            studentName: s.name,
            className: s.className || 'Umum',
            type: template.type,
            title: template.title,
            description: template.desc,
            status: 'Disetujui',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          count++;
        }
      }
      logCallback(`SUKSES: ${count} surat berhasil digenerate.`);
      return { success: true, count };
    }
  } catch (e: any) {
    logCallback(`ERROR Letters: ${e.message}`);
  }
  return { success: false, count: 0 };
};

export const analyzeSchemaQuality = async (logCallback?: (msg: string) => void): Promise<{ success: boolean; score: number; issues: string[] }> => {
  if (logCallback) logCallback('Menganalisis integritas dan kualitas skema IndexedDB...');
  try {
    const { db } = await import('@/database/db');
    const issues: string[] = [];
    let score = 100;
    
    for (const table of db.tables) {
      const count = await table.count();
      if (logCallback) logCallback(`Table "${table.name}": ${count} baris ditemukan.`);
      if (count > 0) {
        const sample = await table.limit(1).toArray();
        if (sample.length > 0) {
          const item = sample[0];
          if (!item.id && !item.uid) {
            issues.push(`Tabel "${table.name}" mendeteksi baris data tanpa Primary Key yang standar.`);
            score -= 10;
          }
          if (!item.tenantId) {
            issues.push(`Tabel "${table.name}" mendeteksi baris data tanpa multi-tenant tenantId.`);
            score -= 5;
          }
        }
      }
    }
    
    if (issues.length === 0) {
      if (logCallback) logCallback('Analisis Selesai: Skema data local 100% sehat & kompatibel.');
    } else {
      if (logCallback) logCallback(`Analisis Selesai dengan ${issues.length} catatan perbaikan.`);
    }
    
    return {
      success: true,
      score: Math.max(0, score),
      issues,
    };
  } catch (e: any) {
    if (logCallback) logCallback(`ERROR Analisis: ${e.message}`);
    return { success: false, score: 0, issues: [e.message] };
  }
};

export const devConsoleService = {
  fetchSystemConfig,
  fetchCollectionData,
  saveDocumentToCollection,
  deleteDocumentFromCollection,
  toggleFeatureLock,
  savePermissions,
  generateTeacherAttendanceDummy,
  generateRandomPointsForRombels,
  generateRandomLettersForRombels,
  analyzeSchemaQuality,
};
