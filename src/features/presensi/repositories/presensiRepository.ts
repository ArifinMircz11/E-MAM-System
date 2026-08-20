import { AttendanceRepository } from '@/repositories/attendanceRepository';
import type { AttendanceRecord } from '@/types';

export class PresensiRepository extends AttendanceRepository {
  constructor() {
    super();
  }
}

export const presensiRepository = new PresensiRepository();
