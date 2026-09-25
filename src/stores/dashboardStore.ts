import { create } from 'zustand';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalGTK: number;
  totalClasses: number;
  presentToday: number;
  totalMisconductPointsCount: number;
  totalAchievementPointsCount: number;
  lateToday: number;
  permittedToday: number;
  haidToday: number;
  isStale: boolean;
  students: number;
  teachers: number;
  classes: number;
  pendingScans: number;
  [key: string]: unknown;
}

export interface DashboardStoreState {
  stats: DashboardStats;
  setStats: (
    next:
      | Partial<DashboardStats>
      | DashboardStats
      | ((previous: DashboardStats) => DashboardStats),
  ) => void;
  resetStats: () => void;
}

const initialStats: DashboardStats = {
  totalStudents: 0,
  totalTeachers: 0,
  totalGTK: 0,
  totalClasses: 0,
  presentToday: 0,
  totalMisconductPointsCount: 0,
  totalAchievementPointsCount: 0,
  lateToday: 0,
  permittedToday: 0,
  haidToday: 0,
  isStale: false,
  students: 0,
  teachers: 0,
  classes: 0,
  pendingScans: 0,
};

export const useDashboardStore = create<DashboardStoreState>((set) => ({
  stats: initialStats,

  setStats: (next) =>
    set((state) => {
      const resolved =
        typeof next === 'function' ? next(state.stats) : next;

      return {
        stats: {
          ...state.stats,
          ...resolved,
        },
      };
    }),

  resetStats: () => set({ stats: { ...initialStats } }),
}));
