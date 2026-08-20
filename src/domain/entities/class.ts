import type { AppEntity } from './base';

/**
 * Class Entity - Domain representation of a classroom.
 */
export interface Class extends AppEntity {
  classId: string;
  name: string;
  level: string;
  teacherId?: string | null;
  teacherName?: string;
  academicYear: string;
  studentCount?: number;
  waliKelasId?: string | null;
  walikelasId?: string | null; // Legacy lowercase k
  lat?: number;
  lng?: number;
  radius?: number;
  archives?: any;
  captainName?: string;
  ketuaKelasId?: string;
}
