import { importUsers } from './importUsers';
import { importStudents } from './importStudents';
import { importTeachers } from './importTeachers';
import { importClasses } from './importClasses';
import { importAttendance } from './importAttendance';
import { importPoints } from './importPoints';

export interface MigrationSummary {
  users: { successCount: number; errorCount: number };
  students: { successCount: number; errorCount: number };
  teachers: { successCount: number; errorCount: number };
  classes: { successCount: number; errorCount: number };
  attendance: { successCount: number; errorCount: number };
  points: { successCount: number; errorCount: number };
  totalSuccess: number;
  totalError: number;
  durationMs: number;
}

export async function importAll(): Promise<MigrationSummary> {
  console.log('[Migration] Beginning full legacy Firestore migration sequence...');
  const startTime = performance.now();

  const summary: Partial<MigrationSummary> = {};

  try {
    // Execute all migrations sequentially
    summary.users = await importUsers();
    summary.students = await importStudents();
    summary.teachers = await importTeachers();
    summary.classes = await importClasses();
    summary.attendance = await importAttendance();
    summary.points = await importPoints();

    const durationMs = Math.round(performance.now() - startTime);
    const totalSuccess = 
      summary.users.successCount +
      summary.students.successCount +
      summary.teachers.successCount +
      summary.classes.successCount +
      summary.attendance.successCount +
      summary.points.successCount;

    const totalError = 
      summary.users.errorCount +
      summary.students.errorCount +
      summary.teachers.errorCount +
      summary.classes.errorCount +
      summary.attendance.errorCount +
      summary.points.errorCount;

    const finalSummary: MigrationSummary = {
      users: summary.users,
      students: summary.students,
      teachers: summary.teachers,
      classes: summary.classes,
      attendance: summary.attendance,
      points: summary.points,
      totalSuccess,
      totalError,
      durationMs
    };

    console.log('[Migration] Migration sequence complete!', finalSummary);
    return finalSummary;
  } catch (err) {
    console.error('[Migration] Critical failure during migration sequence:', err);
    throw err;
  }
}
