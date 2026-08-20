import { create } from 'zustand';

interface AnalyticsState {
  dailyNews: any[];
  breakdownData: any[];
  chartData: any[]; // generic enough for charts
  setDailyNews: (news: any[]) => void;
  setBreakdownData: (data: any[]) => void;
  setChartData: (data: any[]) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  dailyNews: [],
  breakdownData: [],
  chartData: [],
  setDailyNews: (news) =>
    set((state) => ({
      dailyNews: typeof news === 'function' ? (news as any)(state.dailyNews) : news,
    })),
  setBreakdownData: (data) =>
    set((state) => ({
      breakdownData: typeof data === 'function' ? (data as any)(state.breakdownData) : data,
    })),
  setChartData: (data) =>
    set((state) => ({
      chartData: typeof data === 'function' ? (data as any)(state.chartData) : data,
    })),
}));
