import { db } from '@/database/db';
import { PointRecord, PointCategory } from '@/types';

export const getStudentPointsHistory = async (studentId: string): Promise<PointRecord[]> => {
  try {
    if (!db.table('points')) return [];
    return await db.table('points').where('studentId').equals(studentId).toArray();
  } catch {
    return [];
  }
};

export const getStudentPointSummary = async (studentId: string) => {
  try {
    const points = await getStudentPointsHistory(studentId);
    let totalPositive = 0;
    let totalNegative = 0;
    for (const p of points) {
      if (p.type === 'Penghargaan' || p.type === 'Prestasi') {
        totalPositive += p.points || 0;
      } else {
        totalNegative += p.points || 0;
      }
    }
    return {
      totalPoints: totalPositive - totalNegative,
      positivePoints: totalPositive,
      negativePoints: totalNegative,
      recordCount: points.length,
    };
  } catch {
    return { totalPoints: 100, positivePoints: 0, negativePoints: 0, recordCount: 0 };
  }
};

export const getAllPointRecords = async (tenantId: string = 'tenant-demo') => {
  try {
    if (!db.table('points')) return [];
    return await db.table('points').where('tenantId').equals(tenantId).toArray();
  } catch {
    return [];
  }
};

export const getAllPointSummaries = async (category: string = 'Semua', limit: number = 50) => {
  try {
    if (!db.table('points')) return [];
    const list = await db.table('points').toArray();
    const studentPointsMap = new Map<string, { studentId: string; studentName: string; className: string; totalPoints: number }>();
    
    for (const p of list) {
      const studentId = p.studentId || 'unknown';
      const points = p.type === 'Penghargaan' || p.type === 'Prestasi' ? (p.points || 0) : -(p.points || 0);
      
      if (studentPointsMap.has(studentId)) {
        const entry = studentPointsMap.get(studentId)!;
        entry.totalPoints += points;
      } else {
        studentPointsMap.set(studentId, {
          studentId,
          studentName: p.studentName || p.namaSiswa || 'Siswa',
          className: p.class || p.className || 'Umum',
          totalPoints: points,
        });
      }
    }
    
    return Array.from(studentPointsMap.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  } catch {
    return [];
  }
};

export const getPointStats = async (type: string, className: string = 'Semua Rombel'): Promise<number> => {
  try {
    if (!db.table('points')) return 0;
    let list = await db.table('points').toArray();
    
    if (className !== 'Semua Rombel') {
      list = list.filter((p: any) => p.class === className || p.className === className);
    }
    
    const filtered = list.filter((p: any) => {
      if (type === 'Pelanggaran') {
        return p.type === 'Pelanggaran' || p.category === 'Pelanggaran';
      }
      return p.type === 'Prestasi' || p.type === 'Penghargaan' || p.category === 'Prestasi' || p.category === 'Penghargaan';
    });
    
    return filtered.reduce((sum: number, p: any) => sum + Math.abs(p.points || 0), 0);
  } catch {
    return 0;
  }
};

export const getPointCategories = async (tenantId: string = 'tenant-demo'): Promise<PointCategory[]> => {
  try {
    if (db.table('point_categories')) {
      const all = await db.table('point_categories').toArray();
      if (all.length > 0) return all as PointCategory[];
    }
  } catch {}
  return [
    {
      id: 'cat-1',
      tenantId,
      name: 'Menjuarai Lomba Nasional',
      points: 50,
      type: 'Penghargaan',
      description: 'Menjadi juara 1, 2, atau 3 lomba tingkat nasional.',
    },
    {
      id: 'cat-2',
      tenantId,
      name: 'Terlambat Masuk Kelas',
      points: 5,
      type: 'Pelanggaran',
      description: 'Datang ke kelas lebih dari 15 menit setelah bel berbunyi.',
    },
    {
      id: 'cat-3',
      tenantId,
      name: 'Merusak Fasilitas Sekolah',
      points: 20,
      type: 'Pelanggaran',
      description: 'Merusak fasilitas sekolah dengan sengaja.',
    }
  ] as PointCategory[];
};

export const addPointCategory = async (category: Partial<PointCategory>): Promise<boolean> => {
  try {
    if (db.table('point_categories')) {
      const id = category.id || `cat_${Date.now()}`;
      await db.table('point_categories').put({
        ...category,
        id,
        tenantId: category.tenantId || 'tenant-demo',
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const updatePointCategory = async (id: string, category: Partial<PointCategory>): Promise<boolean> => {
  try {
    if (db.table('point_categories')) {
      const existing = await db.table('point_categories').get(id);
      await db.table('point_categories').put({
        ...existing,
        ...category,
        id,
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const deletePointCategory = async (id: string): Promise<boolean> => {
  try {
    if (db.table('point_categories')) {
      await db.table('point_categories').delete(id);
      return true;
    }
  } catch {}
  return true;
};

export const seedDefaultPointCategories = async (tenantId: string = 'tenant-demo'): Promise<boolean> => {
  try {
    if (db.table('point_categories')) {
      const defaults = [
        { id: 'def-1', tenantId, name: 'Sikap Santun', points: 10, type: 'Penghargaan', description: 'Menunjukkan sikap santun luar biasa' },
        { id: 'def-2', tenantId, name: 'Membuang Sampah Sembarangan', points: 5, type: 'Pelanggaran', description: 'Membuang sampah tidak pada tempatnya' },
      ];
      for (const cat of defaults) {
        await db.table('point_categories').put(cat);
      }
      return true;
    }
  } catch {}
  return true;
};

export const addStudentPoint = async (record: Partial<PointRecord>): Promise<boolean> => {
  try {
    if (db.table('points')) {
      const id = record.id || `pt_${Date.now()}`;
      await db.table('points').put({
        ...record,
        id,
        tenantId: record.tenantId || 'tenant-demo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const deletePointRecord = async (id: string): Promise<boolean> => {
  try {
    if (db.table('points')) {
      await db.table('points').delete(id);
      return true;
    }
  } catch {}
  return true;
};

export const clearAllPointsHistory = async (tenantId: string = 'tenant-demo'): Promise<boolean> => {
  try {
    if (db.table('points')) {
      await db.table('points').where('tenantId').equals(tenantId).delete();
      return true;
    }
  } catch {}
  return true;
};

export const pointService = {
  getStudentPointsHistory,
  getStudentPointSummary,
  getAllPointRecords,
  getAllPointSummaries,
  getPointStats,
  getPointCategories,
  addPointCategory,
  updatePointCategory,
  deletePointCategory,
  seedDefaultPointCategories,
  addStudentPoint,
  deletePointRecord,
  clearAllPointsHistory,
};
