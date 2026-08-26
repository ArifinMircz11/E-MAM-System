export const summaryFirestoreService = {
  fetchDashboardSummary: async (tenantId: string = 'tenant-demo') => {
    return {
      totalStudents: 0,
      totalTeachers: 0,
      attendanceRate: 98,
      violationsCount: 0,
    };
  },
};
