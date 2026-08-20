import { create } from 'zustand';

interface DashboardState {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalGTK: number;
    totalClasses: number;
    presentToday: number;
    lateToday: number;
    onTimeToday: number;
    permittedToday: number;
    haidToday: number;
    absentToday: number;
    pendingGrades: number;
    totalAchievementPointsCount: number;
    totalMisconductPointsCount: number;
    totalSppHariIni: number;
    sppArrears: number;
    attendanceRate: number;
    lastUpdate: any;
    isStale?: boolean;
    isOfflineMode?: boolean;
  };
  selectedClassId: string | null;
  isSyncing: boolean;
  setStats: (
    stats:
      | Partial<DashboardState['stats']>
      | ((prev: DashboardState['stats']) => Partial<DashboardState['stats']>),
  ) => void;
  setSelectedClassId: (id: string | null) => void;
  setSyncing: (status: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: {
    totalStudents: 0,
    totalTeachers: 0,
    totalGTK: 0,
    totalClasses: 0,
    presentToday: 0,
    lateToday: 0,
    onTimeToday: 0,
    permittedToday: 0,
    haidToday: 0,
    absentToday: 0,
    pendingGrades: 0,
    totalAchievementPointsCount: 0,
    totalMisconductPointsCount: 0,
    totalSppHariIni: 0,
    sppArrears: 0,
    attendanceRate: 0,
    lastUpdate: null,
    isStale: false,
    isOfflineMode: false,
  },
  selectedClassId: null,
  isSyncing: false,
  setStats: (newStats) =>
    set((state) => ({
      stats: {
        ...state.stats,
        ...(typeof newStats === 'function' ? (newStats as any)(state.stats) : newStats),
      },
    })),
  setSelectedClassId: (id) => set({ selectedClassId: id }),
  setSyncing: (status) => set({ isSyncing: status }),
}));
