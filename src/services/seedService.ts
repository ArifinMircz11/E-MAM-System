import { db } from '@/database/db';
import { MOCK_STUDENTS, MOCK_TEACHERS, MOCK_CLASSES } from './mockData';

export const seedInitialData = async (): Promise<void> => {
  try {
    if (db.table('students')) {
      const count = await db.table('students').count();
      if (count === 0) {
        for (const s of MOCK_STUDENTS) {
          await db.table('students').put(s);
        }
      }
    }
    if (db.table('teachers')) {
      const count = await db.table('teachers').count();
      if (count === 0) {
        for (const t of MOCK_TEACHERS) {
          await db.table('teachers').put(t);
        }
      }
    }
    if (db.table('classes')) {
      const count = await db.table('classes').count();
      if (count === 0) {
        for (const c of MOCK_CLASSES) {
          await db.table('classes').put(c);
        }
      }
    }
  } catch {}
};

export const seedDummyStudents = async (className: string): Promise<void> => {
  try {
    if (db.table('students')) {
      const names = [
        'Ahmad Fauzi', 'Siti Rahma', 'Budi Santoso', 'Laila Sari',
        'Rian Hidayat', 'Mega Utami', 'Fikri Hakim', 'Aisyah Putri'
      ];
      for (let i = 0; i < names.length; i++) {
        await db.table('students').put({
          id: `dummy_std_${className}_${i}_${Date.now()}`,
          tenantId: '30315537',
          name: names[i],
          nisn: `008765${i}12`,
          nis: `123${i}4`,
          className: className,
          classId: className.toLowerCase().replace(/\s+/g, '_'),
          gender: i % 2 === 0 ? 'L' : 'P',
          status: 'Aktif',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  } catch {}
};

export const generateBulkDummyAttendance = async (payload: {
  className: string;
  startDate: string;
  endDate: string;
  session: 'masuk' | 'pulang';
  progressCallback?: (msg: string) => void;
}): Promise<{ success: boolean; message?: string }> => {
  const { className, startDate, endDate, session, progressCallback } = payload;
  if (progressCallback) progressCallback(`Memulai simulasi presensi untuk rombel ${className}...`);
  
  try {
    if (db.table('students') && db.table('attendance')) {
      const students = await db.table('students').toArray();
      const classStudents = students.filter(s => s.className === className || s.classId === className);
      
      if (classStudents.length === 0) {
        if (progressCallback) progressCallback('Peringatan: Tidak ada siswa terdaftar di rombel ini.');
        return { success: true, message: 'No students found.' };
      }
      
      if (progressCallback) progressCallback(`Ditemukan ${classStudents.length} siswa. Menghasilkan riwayat tanggal ${startDate} s/d ${endDate}...`);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      let current = new Date(start);
      let generatedCount = 0;
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();
        
        if (dayOfWeek !== 0) { 
          for (const s of classStudents) {
            const rand = Math.random();
            let status = 'Hadir';
            let time = session === 'masuk' ? '07:05' : '15:30';
            
            if (rand > 0.95) {
              status = 'Sakit';
              time = '--:--';
            } else if (rand > 0.90) {
              status = 'Izin';
              time = '--:--';
            } else if (rand > 0.85 && session === 'masuk') {
              status = 'Terlambat';
              time = '07:45 (Terlambat)';
            }
            
            const attId = `att_${s.id}_${dateStr}_${session}`;
            
            await db.table('attendance').put({
              id: attId,
              tenantId: s.tenantId || '30315537',
              studentId: s.id,
              studentsId: s.id,
              studentName: s.name,
              classId: s.classId || className,
              className: s.className || className,
              tanggal: dateStr,
              session: session,
              status: status,
              [session]: time,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            generatedCount++;
          }
        }
        current.setDate(current.getDate() + 1);
      }
      
      if (progressCallback) progressCallback(`SUKSES: ${generatedCount} entri presensi berhasil disimpan.`);
      return { success: true };
    }
  } catch (e: any) {
    if (progressCallback) progressCallback(`ERROR: ${e.message}`);
  }
  return { success: false, message: 'Failed to access database.' };
};
