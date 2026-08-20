import { useUserStore } from '@/stores/userStore';

import { handleFirestoreError } from './firebase';
import { OperationType } from '@/types';
import { generateManualId } from '@/utils/firestoreHelpers';
import { getClassById } from './classService';

import { getSecurityContext } from '@/core/security/contextHelper';
import { teacherAttendanceRepository } from '@/repositories/teacherAttendanceRepository';

export async function checkTeacherHasCheckedInToday(teacherId: string): Promise<boolean> {
  try {
    const context = getSecurityContext(true);
    if (!context) throw new Error('Security context is required');
    const record = await teacherAttendanceRepository.getByTeacherToday(context, teacherId);
    return !!record;
  } catch (err) {
    console.warn('Failed to check raw attendance:', err);
    return false;
  }
}
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Handles manual check-in from dashboard button (Absensi Kehadiran Guru)
 */
export async function checkInTeacherManual(
  teacherId: string,
  teacherName: string,
  userLat: number,
  userLng: number,
  deviceInfo: string = 'Unknown Device',
): Promise<{ status: 'VALID' | 'INVALID'; distance: number }> {
  try {
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    // Dummy or school center location (you can customize this)
    const schoolLat = -6.2; // Example
    const schoolLng = 106.8; // Example
    const allowedRadius = 500; // Large radius for school area

    const status: 'VALID' | 'INVALID' = 'VALID';
    let distance = 0;

    if (userLat !== 0 && userLng !== 0) {
      distance = getDistance(userLat, userLng, schoolLat, schoolLng);
      // Optionally, actually enforce radius:
      // status = distance <= allowedRadius ? 'VALID' : 'INVALID';
    }

    const date = new Date().toISOString().split('T')[0];
    const manualId = generateManualId(`${tenantId}_${teacherId}_${date}`);

    const record: any = {
      id: manualId,
      teachersId: teacherId,
      teacherName,
      date: date, // YYYY-MM-DD
      tenantId: tenantId,
      statusGlobal: 'Hadir',
      sessions: { masuk: 'Masuk' },
      location: {
        lat: userLat,
        lng: userLng,
        distance: Math.round(distance),
      },
      qrToken: 'manual',
      timestamp: new Date().toISOString(),
      deviceInfo,
    };

    // Offline-First: Save local and enqueue for sync
    const context = getSecurityContext(true);
    if (!context) throw new Error('Security context is required');
    await teacherAttendanceRepository.create(record);

    const { syncRepository } = await import('@/repositories/SyncRepository');
    await syncRepository.enqueue({
      tenantId,
      collection: 'teacher_attendance',
      action: 'CREATE',
      payload: record,
    } as any);

    return { status, distance: Math.round(distance) };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'teacher_attendance');
    throw error;
  }
}
export async function checkInTeacher(
  teacherId: string,
  teacherName: string,
  classId: string,
  qrToken: string,
  userLat: number,
  userLng: number,
  deviceInfo: string = 'Unknown Device',
): Promise<{ status: 'VALID' | 'INVALID'; distance: number }> {
  try {
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    // 1. Fetch class data for geo-fencing (using service for cache support)
    const classData = await getClassById(classId);

    if (!classData) {
      throw new Error('Kelas tidak ditemukan');
    }

    const classLat = classData.lat || 0;
    const classLng = classData.lng || 0;
    const allowedRadius = classData.radius || 50; // Default 50m if not set

    // 2. Calculate distance
    const distance = getDistance(userLat, userLng, classLat, classLng);

    // 3. Determine status
    // Note: For production, we'd also check if the qrToken matches today's generated token for the class
    const status = distance <= allowedRadius ? 'VALID' : 'INVALID';

    // 4. Record check-in
    const date = new Date().toISOString().split('T')[0];
    const manualId = generateManualId(`${tenantId}_${teacherId}_${date}`);

    const record: any = {
      id: manualId,
      teachersId: teacherId,
      teacherName,
      date: date,
      tenantId: tenantId,
      statusGlobal: status === 'VALID' ? 'Hadir' : 'Alpha',
      sessions: { masuk: 'Masuk' },
      location: {
        lat: userLat,
        lng: userLng,
        distance: Math.round(distance),
      },
      qrToken,
      timestamp: new Date().toISOString(),
      deviceInfo,
    };

    // Offline-First: Save local and enqueue for sync
    const context = getSecurityContext(true);
    if (!context) throw new Error('Security context is required');
    await teacherAttendanceRepository.create(record);

    const { syncRepository } = await import('@/repositories/SyncRepository');
    await syncRepository.enqueue({
      tenantId,
      collection: 'teacher_attendance',
      action: 'CREATE',
      payload: record,
    } as any);

    // 5. Send notifications via EventBus
    const { eventBus } = await import('@/events/eventBus');
    const details =
      status === 'INVALID'
        ? `Peringatan: ${teacherName} mencoba absen di luar lokasi kelas ${classData.name} (Jarak: ${Math.round(distance)}m)`
        : `Guru ${teacherName} telah masuk kelas ${classData.name}`;

    eventBus.publish('TEACHER_ATTENDANCE_RECORDED', {
      id: `evt_tatt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: '1.0.0',
      timestamp: Date.now(),
      data: {
        record,
        teacherName,
        className: classData.name,
        status,
        distance: Math.round(distance),
        details,
      },
    });

    return { status, distance: Math.round(distance) };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'teacher_attendance');
    throw error;
  }
}
