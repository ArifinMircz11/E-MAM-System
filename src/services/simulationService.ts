/**
 * @license
 * e-Mam System - Simulation Service
 * LAYER: SERVICE (Business Logic)
 */

import { attendanceRepository } from '@/repositories/attendanceRepository';
import { pointRepository } from '@/repositories/PointRepository';
import { letterRepository } from '@/repositories/letterRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { generateManualId } from '@/utils/firestoreHelpers';
import type { PointTransactionSchema, LetterRequest } from '@/types';
import type { z } from 'zod';

type PointTransaction = z.infer<typeof PointTransactionSchema>;

export const simulationService = {
  async generateBulk(tenantId: string, classIds: string[], count: number) {
    if (!classIds || !Array.isArray(classIds)) {
      console.warn('[simulationService] classIds is undefined or not an array');
      return;
    }

    // Assume super admin context for simulation
    const context: any = {
      uid: 'dev_user',
      role: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN'],
      tenantId,
      permissions: [],
      scopes: [],
      featureFlags: {},
      sessionId: 'sim',
    };

    const students = await studentRepository.findAll(tenantId);
    const filteredStudents = students.filter((s) => {
      const id = s.classId || s.className || s.tingkatRombel || 'Tanpa Kelas';
      return classIds.includes(id);
    });

    if (filteredStudents.length === 0) return;

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      const student = filteredStudents[Math.floor(Math.random() * filteredStudents.length)];

      if (rand < 0.9) {
        // Generate Attendance
        const todayStr = new Date().toISOString().split('T')[0];
        const record: any = {
          id: `${student.idUnik}_${todayStr}`,
          tenantId: tenantId,
          academicYearId: (student as any).academicYearId || `${tenantId}_2025_2026`,
          studentsId: student.idUnik,
          namaLengkap: student.namaLengkap,
          classId: student.classId || 'Unassigned',
          className: student.className || 'Unassigned',
          tanggal: todayStr,
          hari: 'Rabu',
          status: 'Hadir',
          statusKehadiran: 'Hadir',
          masuk: { jam: '07:00', status: 'H' },
          duha: { jam: '', status: 'TS' },
          zuhur: { jam: '', status: 'TS' },
          ashar: { jam: '', status: 'TS' },
          pulang: { jam: '14:00', status: 'H' },
          isHaid: false,
          suratId: null,
          pelanggaran: {
            terlambat: false,
            tidakScan: false,
            pulangCepat: false,
            alpha: false,
          },
          prestasi: {
            hafalan: false,
            sertifikatPrestasi: false,
            penguranganPoin: 0,
          },
          point: {
            pelanggaran: 0,
            prestasi: 0,
            totalPoinHariIni: 0,
          },
          version: 1,
          schemaVersion: 1,
          syncStatus: 'synced' as any,
          deleted: false,
          verified: false,
          dibuatPada: Date.now(),
          diperbaruiPada: Date.now(),
        };
        await attendanceRepository.create(record);
      } else if (rand < 0.95) {
        // Generate Points
        const point: any = {
          id: generateManualId(),
          tenantId: tenantId,
          studentsId: student.idUnik,
          studentName: student.namaLengkap,
          className: student.className || student.tingkatRombel || '',
          classId: student.classId,
          points: Math.floor(Math.random() * 10) + 1,
          type: 'prestasi',
          category: 'Kedisiplinan',
          categoryId: 'cat_01',
          description: 'Mock point generation',
          date: new Date().toISOString().split('T')[0],
          recordedBy: 'Developer',
          idPetugas: 'dev_user',
        };
        await pointRepository.create(point);
      } else {
        // Generate Letters
        const letter: LetterRequest = {
          id: generateManualId(),
          tenantId: tenantId,
          userId: student.linkedUserId || student.idUnik,
          userName: student.namaLengkap,
          type: Math.random() > 0.5 ? 'izin' : 'sakit',
          description: 'Mock letter',
          status: 'Pending',
          version: 1,
          schemaVersion: 1,
          syncStatus: 'synced' as any,
          deleted: false,
        } as any;
        await letterRepository.create(letter as LetterRequest);
      }
    }
  },
};
