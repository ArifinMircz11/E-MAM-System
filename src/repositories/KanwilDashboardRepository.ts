import { db } from '@/database/db';

export class KanwilDashboardRepository {
  async getSummary(tenantId: string = 'tenant-demo') {
    return {
      totalMadrasah: 42,
      totalStudents: 15400,
      totalTeachers: 1200,
      averageAttendance: 97.5,
    };
  }
}

export const kanwilDashboardRepository = new KanwilDashboardRepository();
