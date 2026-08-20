import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import { classRepository } from '@/repositories/classRepository';
import { getSecurityContext } from '@/core/security/contextHelper';
import type { Student, Teacher, ClassData } from '@/types';

export interface SearchResultItem {
  id: string;
  type: 'student' | 'teacher' | 'class';
  title: string;
  subtitle: string;
  meta: string;
  entity: Student | Teacher | ClassData;
}

export interface LocalSearchResult {
  query: string;
  durationMs: number;
  students: Student[];
  teachers: Teacher[];
  classes: ClassData[];
  totalCount: number;
  items: SearchResultItem[];
}

export class LocalSearchService {
  static async searchAll(
    queryStr: string,
    entityType: 'all' | 'student' | 'teacher' | 'class' = 'all'
  ): Promise<LocalSearchResult> {
    const startTime = performance.now();
    const context = getSecurityContext();
    const q = queryStr.trim().toLowerCase();
    
    let students: Student[] = [];
    let teachers: Teacher[] = [];
    let classes: ClassData[] = [];
    const tenantId = context.tenantId || 'default-tenant';

    if (!q) {
      const endTime = performance.now();
      return {
        query: queryStr,
        durationMs: Math.round(endTime - startTime),
        students: [],
        teachers: [],
        classes: [],
        totalCount: 0,
        items: [],
      };
    }

    const promises: Promise<any>[] = [];

    if (entityType === 'all' || entityType === 'student') {
      promises.push(
        studentRepository.findAll(tenantId).then((allStudents) => {
          return allStudents.filter((s: any) => {
            const name = (s.namaLengkap || '').toLowerCase();
            const nisn = (s.nisn || '').toLowerCase();
            const idUnik = (s.idUnik || '').toLowerCase();
            const className = (s.className || s.classId || '').toLowerCase();
            return (
              name.includes(q) ||
              nisn.includes(q) ||
              idUnik.includes(q) ||
              className.includes(q)
            );
          }).slice(0, 20);
        })
      );
    } else {
      promises.push(Promise.resolve([]));
    }

    if (entityType === 'all' || entityType === 'teacher') {
      promises.push(
        teacherRepository.findAll(tenantId).then((allTeachers) => {
          return allTeachers.filter((t: any) => {
            const name = (t.namaLengkap || '').toLowerCase();
            const nip = (t.nip || '').toLowerCase();
            const nik = (t.nik || '').toLowerCase();
            const email = (t.email || '').toLowerCase();
            return (
              name.includes(q) ||
              nip.includes(q) ||
              nik.includes(q) ||
              email.includes(q)
            );
          }).slice(0, 20);
        })
      );
    } else {
      promises.push(Promise.resolve([]));
    }

    if (entityType === 'all' || entityType === 'class') {
      promises.push(
        classRepository.findAll(tenantId).then((allClasses) => {
          return allClasses.filter((c: any) => {
            const name = (c.name || '').toLowerCase();
            const level = (c.level || '').toString().toLowerCase();
            const teacherName = (c.teacherName || '').toLowerCase();
            return (
              name.includes(q) ||
              level.includes(q) ||
              teacherName.includes(q)
            );
          }).slice(0, 20);
        })
      );
    } else {
      promises.push(Promise.resolve([]));
    }

    const [rawStudents, rawTeachers, rawClasses] = await Promise.all(promises);

    students = rawStudents || [];
    teachers = rawTeachers || [];
    classes = rawClasses || [];

    const items: SearchResultItem[] = [
      ...students.map((s: any) => ({
        id: (s.studentsId || s.id || '') as string,
        type: 'student' as const,
        title: s.namaLengkap || 'Siswa Tanpa Nama',
        subtitle: `NISN: ${s.nisn || '-'} | ID: ${s.idUnik || s.studentsId || s.id}`,
        meta: `Kelas: ${s.className || s.classId || '-'}`,
        entity: s,
      })),
      ...teachers.map((t: any) => ({
        id: (t.teachersId || t.id || '') as string,
        type: 'teacher' as const,
        title: t.namaLengkap || 'Guru Tanpa Nama',
        subtitle: `NIP: ${t.nip || '-'} | NIK: ${t.nik || '-'}`,
        meta: `Email: ${t.email || '-'}`,
        entity: t,
      })),
      ...classes.map((c: any) => ({
        id: (c.classId || c.id || '') as string,
        type: 'class' as const,
        title: c.name || 'Kelas Tanpa Nama',
        subtitle: `Tingkat: ${c.level || '-'}`,
        meta: `Wali Kelas: ${c.teacherName || '-'}`,
        entity: c,
      })),
    ];

    const endTime = performance.now();
    const durationMs = Math.round((endTime - startTime) * 100) / 100;

    return {
      query: queryStr,
      durationMs,
      students,
      teachers,
      classes,
      totalCount: items.length,
      items,
    };
  }
}
