// src/manifest/ModuleManifest.ts

export interface ModuleMetadata {
  version: number;
  collectionName: string;
  localTableName: string;
  dependencies: string[];
  requiresAggregation: boolean;
  fields: Record<string, 'string' | 'number' | 'boolean' | 'object'>;
  allowedRoles: string[];
}

export const ModuleManifest: Record<string, ModuleMetadata> = {
  dashboard: {
    version: 1,
    collectionName: 'dashboard_summary',
    localTableName: 'dashboardSummary',
    dependencies: ['students', 'teachers', 'attendance'],
    requiresAggregation: false,
    allowedRoles: ['Developer', 'Admin Madrasah'],
    fields: {
      id: 'string',
      tenantId: 'string',
      totalStudents: 'number',
      totalTeachers: 'number',
      attendanceRate: 'string',
      lastUpdated: 'number',
    },
  },
  attendance: {
    version: 2,
    collectionName: 'attendance',
    localTableName: 'attendanceQueue',
    dependencies: ['classes', 'students'],
    requiresAggregation: true,
    allowedRoles: ['Developer', 'Admin Madrasah', 'Guru'],
    fields: {
      id: 'string',
      tenantId: 'string',
      studentId: 'string',
      classId: 'string',
      status: 'string',
      dateMarker: 'string',
      updatedAt: 'number',
    },
  },
  student_grades: {
    version: 1,
    collectionName: 'student_grades',
    localTableName: 'localGrades',
    dependencies: ['classes', 'students', 'subjects'],
    requiresAggregation: true,
    allowedRoles: ['Developer', 'Admin Madrasah', 'Guru'],
    fields: {
      id: 'string',
      tenantId: 'string',
      studentId: 'string',
      classId: 'string',
      subjectId: 'string',
      score: 'number',
      examType: 'string',
      isLocked: 'boolean',
      updatedAt: 'number',
    },
  },
};
