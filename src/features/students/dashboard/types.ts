import type {
  Student,
  ScheduleItem,
  NewsItem,
  AppNotification,
  LetterRequest} from '@/types';



export interface StudentPointSummary {
  totalPoints: number;
  totalViolation: number;
  totalAchievement: number;
  studentId: string;
}

export interface AttendanceToday {
  masuk?: string;
  duha?: string;
  zuhur?: string;
  ashar?: string;
  pulang?: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | 'Haid';
}

export interface PermissionActive {
  id: string;
  date: string;
  type: string;
  status: string;
  approvedBy: string;
}

export interface StudentDashboardData {
  profile: Student | null;
  attendanceToday: AttendanceToday | null;
  pointSummary: StudentPointSummary | null;
  schedulesToday: ScheduleItem[];
  activePermission: PermissionActive | null;
  notif: AppNotification[];
  letters: LetterRequest[];
  news: NewsItem[];
}
