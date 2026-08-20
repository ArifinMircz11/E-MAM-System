import type { AppEntity } from './base';

export interface AcademicYear extends AppEntity {
  npsn?: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Semester extends AppEntity {
  npsn?: string;
  academicYearId: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface DayEntity extends AppEntity {
  id: string; // e.g. "MON", "TUE"
  order: number;
  name: string;
  shortName: string;
}

export interface TimeSlot extends AppEntity {
  npsn?: string;
  academicYearId?: string;
  semesterId?: string;
  code: string;
  period: number;
  startTime: string; // "07:30"
  endTime: string;   // "08:15"
  duration: number;  // 45
  breakAfter: boolean;
  isActive: boolean;
}

export interface SubjectEntity extends AppEntity {
  npsn?: string;
  code: string;
  name: string;
  departmentId?: string;
  group?: string;
  weeklyHours: number;
  color?: string;
  icon?: string;
  isActive: boolean;
}

export interface ClassEntity extends AppEntity {
  npsn?: string;
  code: string;
  name: string;
  level: string;
  departmentId?: string;
  homeroomTeacherId?: string;
  studentCount?: number;
}

export interface RoomEntity extends AppEntity {
  npsn?: string;
  code: string;
  name: string;
  building?: string;
  floor?: string;
  capacity?: number;
  type?: string;
  isActive: boolean;
}

export interface TeacherAssignment extends AppEntity {
  npsn?: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  academicYearId: string;
  semesterId: string;
  totalHours: number;
}

export interface Schedule extends AppEntity {
  npsn?: string;
  academicYearId: string;
  semesterId: string;
  classId: string;
  dayId: string;
  dayOfWeek?: number;
  period?: number;
  startTime?: string;
  endTime?: string;
  timeSlotId: string;
  subjectId: string;
  teacherAssignmentId: string;
  roomId: string;
  weekType?: 'Semua' | 'Ganjil' | 'Genap';
  effectiveFrom?: string;
  effectiveUntil?: string;
  notes?: string;
  status: 'Aktif' | 'Nonaktif';
  isActive: boolean;
  
  // Display helpers
  subject?: string;
  class?: string;
  room?: string;
  teacher?: string;
  time?: string;
  day?: string;
}

export interface ScheduleException extends AppEntity {
  scheduleId: string;
  date: string;
  type: 'Guru Sakit' | 'Libur' | 'Pindah Jam' | 'Ganti Guru';
  replacementTeacherId?: string;
  replacementRoomId?: string;
  replacementTimeSlotId?: string;
  reason: string;
  approvedBy?: string;
}

export interface ScheduleLog extends AppEntity {
  scheduleId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXCEPTION';
  oldValue?: string;
  newValue?: string;
  userId: string;
}
