/**
 * @license
 * e-Mam System - Student Points Reporting Types
 * LAYER: TYPES
 */

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'class';

export type TransactionTypeFilter =
  | 'all'
  | 'violation'
  | 'achievement'
  | 'adjustment';

export interface PointDashboardFilters {
  period: ReportPeriod;
  selectedDate: string; // YYYY-MM-DD
  selectedClassId: string; // 'All' or specific class
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  transactionType: TransactionTypeFilter;
  categoryId: string;
  searchQuery: string;
}

export interface ClassPointBreakdown {
  classId: string;
  className: string;
  studentCount: number;
  violations: number;
  achievements: number;
  netPoints: number;
}

export interface DailyReportData {
  date: string;
  totalTransactions: number;
  violationsCount: number;
  achievementsCount: number;
  studentsInvolvedCount: number;
  classBreakdown: ClassPointBreakdown[];
}

export interface DailyTrendItem {
  dayName: string;
  date: string;
  pointsIn: number; // violations
  pointsOut: number; // achievements
  netPoints: number;
}

export interface WeeklyReportData {
  startDate: string;
  endDate: string;
  weekRangeLabel: string;
  totalPointsIn: number;
  totalPointsOut: number;
  netBalance: number;
  studentsInvolvedCount: number;
  dailyTrends: DailyTrendItem[];
}

export interface MonthlyReportData {
  monthYearStr: string;
  monthLabel: string;
  violationsCount: number;
  achievementsCount: number;
  netBalance: number;
  studentsInvolvedCount: number;
  callLettersCount: number;
  classBreakdown: Array<{
    classId: string;
    className: string;
    pointsIn: number;
    pointsOut: number;
    netPoints: number;
  }>;
}

export interface StudentPointRankItem {
  rank: number;
  studentId: string;
  studentName: string;
  className: string;
  nisn?: string;
  points: number;
  sanctionLevel: string;
  statusBadge: 'SP-3' | 'SP-2' | 'SP-1' | 'Waspada' | 'Normal';
}

export interface ClassReportData {
  classId: string;
  className: string;
  totalStudents: number;
  atRiskStudentsCount: number;
  totalPoints: number;
  averagePoints: number;
  callLettersCount: number;
  studentRankings: StudentPointRankItem[];
}

export interface StudentTimelineItem {
  id: string;
  date: string;
  time?: string;
  type: 'pelanggaran' | 'prestasi' | 'koreksi';
  category: string;
  description: string;
  pointsChange: number;
  previousBalance: number;
  newBalance: number;
  recordedBy: string;
}

export interface StudentLetterItem {
  id: string;
  letterNumber?: string;
  date: string;
  spLevel: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SENT';
  thresholdPoints: number;
  pointsAtCreation: number;
  recipientName?: string;
}

export interface StudentIndividualReport {
  studentId: string;
  studentName: string;
  className: string;
  nisn: string;
  totalActivePoints: number;
  violationsPoints: number;
  achievementsPoints: number;
  currentStatus: string;
  sanctionLevel: string;
  nextThreshold: number;
  thresholdProgressPercentage: number;
  timeline: StudentTimelineItem[];
  charts: {
    balanceHistory: Array<{ date: string; balance: number }>;
    distribution: {
      violations: number;
      achievements: number;
      adjustments: number;
    };
  };
  callLetters: StudentLetterItem[];
}
