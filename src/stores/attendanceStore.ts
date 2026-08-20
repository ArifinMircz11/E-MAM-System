import { create } from 'zustand';

interface AttendanceDashboardState {
  liveAttendance: {
    teacherPresent: number;
    teacherTotal: number;
    studentPresent: number;
    studentTotal: number;
  };
  attendanceStatus: string | null;
  selectedAttendanceType: 'siswa' | 'guru';
  todayAttendanceRecords: any[];

  // UI States
  isBreakdownOpen: boolean;
  selectedBreakdownClass: any | null;
  loadingBreakdown: boolean;
  monitoringModalOpen: boolean;
  selectedMonitoringTab: 'semua' | 'masuk' | 'duha' | 'zuhur' | 'ashar' | 'pulang';
  monitoringSearchQuery: string;
  monitoringClassFilter: string;

  setLiveAttendance: (
    attendance:
      | Partial<AttendanceDashboardState['liveAttendance']>
      | ((
          prev: AttendanceDashboardState['liveAttendance'],
        ) => Partial<AttendanceDashboardState['liveAttendance']>),
  ) => void;
  setAttendanceStatus: (status: string | null) => void;
  setSelectedAttendanceType: (type: 'siswa' | 'guru') => void;
  setTodayAttendanceRecords: (records: any[]) => void;

  // UI Actions
  setIsBreakdownOpen: (open: boolean) => void;
  setSelectedBreakdownClass: (cls: any | null) => void;
  setLoadingBreakdown: (loading: boolean) => void;
  setMonitoringModalOpen: (open: boolean) => void;
  setSelectedMonitoringTab: (tab: AttendanceDashboardState['selectedMonitoringTab']) => void;
  setMonitoringSearchQuery: (query: string) => void;
  setMonitoringClassFilter: (filter: string) => void;
}

export const useAttendanceDashboardStore = create<AttendanceDashboardState>((set) => ({
  liveAttendance: {
    teacherPresent: 0,
    teacherTotal: 0,
    studentPresent: 0,
    studentTotal: 0,
  },
  attendanceStatus: null,
  selectedAttendanceType: 'siswa',
  todayAttendanceRecords: [],

  isBreakdownOpen: false,
  selectedBreakdownClass: null,
  loadingBreakdown: false,
  monitoringModalOpen: false,
  selectedMonitoringTab: 'semua',
  monitoringSearchQuery: '',
  monitoringClassFilter: 'semua',

  setLiveAttendance: (attendance) =>
    set((state) => ({
      liveAttendance: {
        ...state.liveAttendance,
        ...(typeof attendance === 'function'
          ? (attendance as any)(state.liveAttendance)
          : attendance),
      },
    })),
  setAttendanceStatus: (attendanceStatus) => set({ attendanceStatus }),
  setSelectedAttendanceType: (selectedAttendanceType) => set({ selectedAttendanceType }),
  setTodayAttendanceRecords: (todayAttendanceRecords) => set({ todayAttendanceRecords }),

  setIsBreakdownOpen: (isBreakdownOpen) => set({ isBreakdownOpen }),
  setSelectedBreakdownClass: (selectedBreakdownClass) => set({ selectedBreakdownClass }),
  setLoadingBreakdown: (loadingBreakdown) => set({ loadingBreakdown }),
  setMonitoringModalOpen: (monitoringModalOpen) => set({ monitoringModalOpen }),
  setSelectedMonitoringTab: (selectedMonitoringTab) => set({ selectedMonitoringTab }),
  setMonitoringSearchQuery: (monitoringSearchQuery) => set({ monitoringSearchQuery }),
  setMonitoringClassFilter: (monitoringClassFilter) => set({ monitoringClassFilter }),
}));
