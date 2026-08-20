import React from 'react';
import {
  UsersIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
} from '@/shared/Icons';
import { ViewState } from '@/types';

export const ClassContextMenu = ({ classData, onAction, onBack }: any) => {
  const menus = [
    {
      id: 'students',
      label: 'Data siswa',
      icon: UsersIcon,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
      view: ViewState.STUDENTS,
    },
    {
      id: 'reports',
      label: 'Laporan harian bulanan',
      icon: ChartBarIcon,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      view: ViewState.REPORTS,
    },
    {
      id: 'schedule',
      label: 'Jadwal mingguan/Kelas',
      icon: CalendarIcon,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      view: ViewState.SCHEDULE,
    },
    {
      id: 'kbm',
      label: 'Absen kelas/jam belajar mengajar',
      icon: ClockIcon,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      view: ViewState.JOURNAL,
    },
    {
      id: 'attendance',
      label: 'Absen harian (Global)',
      icon: CheckCircleIcon,
      color: 'text-sky-500',
      bg: 'bg-sky-50',
      view: ViewState.ATTENDANCE_HISTORY,
    },
    {
      id: 'points',
      label: 'Poin kedisiplinan',
      icon: StarIcon,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
      view: ViewState.POINTS,
    },
    {
      id: 'academic_year',
      label: 'Tahun pelajaran',
      icon: BuildingLibraryIcon,
      color: 'text-slate-500',
      bg: 'bg-slate-50',
      view: ViewState.ACADEMIC_YEAR,
    },
    {
      id: 'calendar',
      label: 'Kalender akademik',
      icon: CalendarIcon,
      color: 'text-fuchsia-500',
      bg: 'bg-fuchsia-50',
      view: ViewState.EVENTS,
    },
    {
      id: 'journal',
      label: 'Jurnal/agenda kelas',
      icon: BookOpenIcon,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      view: ViewState.JOURNAL,
    },
  ];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl shadow-indigo-500/20 mb-2">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold tracking-tight leading-none">
              Kelas {classData?.name}
            </h3>
            <p className="text-[10px] font-bold opacity-70 tracking-wide mt-1.5">
              Akses fitur kontekstual
            </p>
          </div>
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
            <BuildingLibraryIcon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 px-1 pb-10">
        {menus.map((item) => (
          <button
            key={item.id}
            onClick={() => onAction(item.view)}
            className="flex flex-col items-center gap-2.5 p-4 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all active:scale-90 hover:shadow-lg group"
            style={{ touchAction: 'manipulation' }}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg} dark:bg-slate-800 group-hover:scale-110 transition-transform`}
            >
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
