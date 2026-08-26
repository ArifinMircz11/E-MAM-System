import { create } from 'zustand';

export interface DashboardState {
  summary: {
    totalStudents: number;
    totalTeachers: number;
    attendanceRate: number;
    violationsCount: number;
  };
  isLoading: boolean;
  selectedPeriod: string;
  setSummary: (summary: any) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSelectedPeriod: (period: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: {
    totalStudents: 0,
    totalTeachers: 0,
    attendanceRate: 98,
    violationsCount: 0,
  },
  isLoading: false,
  selectedPeriod: 'Hari Ini',
  setSummary: (summary) => set((state) => ({ summary: { ...state.summary, ...summary } })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSelectedPeriod: (selectedPeriod) => set({ selectedPeriod }),
}));
