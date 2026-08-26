import { create } from 'zustand';

export interface AttendanceState {
  todayRecords: any[];
  selectedDate: string;
  isLoading: boolean;
  setTodayRecords: (records: any[]) => void;
  setSelectedDate: (date: string) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  todayRecords: [],
  selectedDate: new Date().toISOString().split('T')[0],
  isLoading: false,
  setTodayRecords: (todayRecords) => set({ todayRecords }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export const useAttendanceDashboardStore = useAttendanceStore;

