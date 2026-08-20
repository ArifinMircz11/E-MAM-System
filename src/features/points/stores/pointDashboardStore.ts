/**
 * @license
 * e-Mam System - Student Points Dashboard Store
 * LAYER: STORE (Zustand UI State)
 */

import { create } from 'zustand';
import type {
  ReportPeriod,
  TransactionTypeFilter,
  PointDashboardFilters,
} from '../types/pointReport';
import { getMakassarDateString } from '@/utils/timezone';

export type MainPointTab =
  | 'dashboard'
  | 'individual'
  | 'input'
  | 'transactions'
  | 'categories'
  | 'thresholds';

interface PointDashboardState {
  mainTab: MainPointTab;
  period: ReportPeriod;
  selectedDate: string; // YYYY-MM-DD
  selectedClassId: string; // 'All' or specific class name
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  transactionType: TransactionTypeFilter;
  categoryId: string;
  searchQuery: string;

  // Actions
  setMainTab: (tab: MainPointTab) => void;
  setPeriod: (period: ReportPeriod) => void;
  setDate: (date: string) => void;
  setClass: (classId: string) => void;
  setDateRange: (startDate: string, endDate: string) => void;
  setTransactionType: (type: TransactionTypeFilter) => void;
  setCategory: (catId: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  getFilters: () => PointDashboardFilters;
}

const todayStr = getMakassarDateString();

// Helper to compute start and end of current week
const getWeekRange = () => {
  const d = new Date();
  const day = d.getDay();
  const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diffToMon));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const format = (dt: Date) => dt.toISOString().split('T')[0];
  return {
    start: format(mon),
    end: format(sun),
  };
};

const weekRange = getWeekRange();

export const usePointDashboardStore = create<PointDashboardState>((set, get) => ({
  mainTab: 'dashboard',
  period: 'daily',
  selectedDate: todayStr,
  selectedClassId: 'All',
  startDate: weekRange.start,
  endDate: weekRange.end,
  transactionType: 'all',
  categoryId: 'all',
  searchQuery: '',

  setMainTab: (mainTab) => set({ mainTab }),
  setPeriod: (period) => set({ period }),
  setDate: (selectedDate) => set({ selectedDate }),
  setClass: (selectedClassId) => set({ selectedClassId }),
  setDateRange: (startDate, endDate) => set({ startDate, endDate }),
  setTransactionType: (transactionType) => set({ transactionType }),
  setCategory: (categoryId) => set({ categoryId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  resetFilters: () =>
    set({
      period: 'daily',
      selectedDate: todayStr,
      selectedClassId: 'All',
      startDate: weekRange.start,
      endDate: weekRange.end,
      transactionType: 'all',
      categoryId: 'all',
      searchQuery: '',
    }),

  getFilters: () => {
    const s = get();
    return {
      period: s.period,
      selectedDate: s.selectedDate,
      selectedClassId: s.selectedClassId,
      startDate: s.startDate,
      endDate: s.endDate,
      transactionType: s.transactionType,
      categoryId: s.categoryId,
      searchQuery: s.searchQuery,
    };
  },
}));
