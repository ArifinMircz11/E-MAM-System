import React, { useState, Suspense, lazy } from 'react';
import { ViewState } from '@/types';
import Layout from '@/layouts/Layout';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';
import { useDashboardBK } from '@/hooks/useDashboardBK';
import {
  ShieldCheckIcon,
  ChartBarIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  Loader2,
  UserIcon,
  GraduationCapIcon,
  StarIcon,
  ShieldExclamationIcon,
  ArrowRightIcon,
} from '@/shared/Icons';

const BehaviorChart = lazy(() =>
  import('./bk-components/BehaviorChart').then((module) => ({ default: module.BehaviorChart })),
);

interface DashboardBKProps {
  onBack: () => void;
  onNavigate: (view: ViewState) => void;
  onOpenSidebar?: () => void;
}

const DashboardBK: React.FC<DashboardBKProps> = ({ onBack, onNavigate }) => {
  const { stats, news, loading, classesList } = useDashboardBK();
  const [filterClass, setFilterClass] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = stats.topStudents.filter(
    (s) =>
      (filterClass === 'All' || s.class === filterClass) &&
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading && stats.topStudents.length === 0) {
    return (
      <Layout
        title="Dashboard BK"
        subtitle="Bimbingan & Konseling"
        icon={ShieldCheckIcon}
        onBack={onBack}
      >
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-20" />
          <p className="text-[10px] font-black text-slate-400 capitalize tracking-widest">
            Menganalisis Data...
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Dashboard BK"
      subtitle="Monitoring Disiplin & Prestasi"
      icon={ShieldCheckIcon}
      onBack={onBack}
      actions={
        <button
          onClick={() => onNavigate(ViewState.POINTS)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black capitalize tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
        >
          <UsersIcon className="w-4 h-4" /> Manajemen Poin
        </button>
      }
    >
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 pb-32">
        {/* --- NEWS SECTION --- */}
        {news.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
              {news.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="min-w-[260px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[8px] font-black capitalize tracking-widest border border-indigo-100 dark:border-indigo-800">
                        {item.category || 'Warta'}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">
                        {format(new Date(item.date), 'dd MMM', { locale: localeID })}
                      </span>
                    </div>
                    <h5 className="text-[10px] font-black text-slate-800 dark:text-white capitalize leading-tight line-clamp-2 group-hover:text-indigo-600">
                      {item.title}
                    </h5>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 font-medium">
                      {item.content}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700 flex justify-end">
                    <ArrowRightIcon className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SUMMARY CARDS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <div className="bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
              <ShieldExclamationIcon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 capitalize tracking-widest mb-1">
              Pelanggaran
            </p>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-none">
              {stats.totalPelanggaran}
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold mt-2">
              <ArrowTrendingUpIcon className="w-3 h-3" /> 12% dari bln lalu
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
              <StarIcon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 capitalize tracking-widest mb-1">
              Prestasi
            </p>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-none">
              {stats.totalPrestasi}
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-2">
              <ArrowTrendingUpIcon className="w-3 h-3" /> 8% dari bln lalu
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm col-span-2">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                <ChartBarIcon className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-black text-slate-400  tracking-widest">
                Tren Perilaku Semester Ini
              </p>
            </div>
            <Suspense
              fallback={
                <div className="w-full h-[350px] min-h-[350px] bg-slate-900/5 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner mt-4 animate-pulse" />
              }
            >
              <BehaviorChart data={stats.monthlyTrend} />
            </Suspense>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* --- TOP PERFORMANCE --- */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
              <h4 className="text-xs font-black text-slate-800 dark:text-white  tracking-widest flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-indigo-500" /> Data Poin Siswa
              </h4>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-bold outline-none"
                >
                  <option value="All">Semua Kelas</option>
                  {classesList.map((clsName, index) => (
                    <option key={`${clsName}-${index}`} value={clsName}>
                      {clsName}
                    </option>
                  ))}
                  {classesList.length === 0 && (
                    <>
                      <option value="XII-IPA 1">XII-IPA 1</option>
                      <option value="XII-IPA 2">XII-IPA 2</option>
                      <option value="XI-IPS 1">XI-IPS 1</option>
                      <option value="X-1">X-1</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-2 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
              <div className="overflow-hidden">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s, idx) => (
                    <div
                      key={`${s.name}-${idx}`}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-3xl transition-all group"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                          s.type === 'plus'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{s.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold capitalize tracking-widest">
                          {s.class}
                        </p>
                      </div>
                      <div
                        className={`text-right ${s.type === 'plus' ? 'text-emerald-500' : 'text-rose-500'}`}
                      >
                        <p className="text-lg font-black leading-none">
                          {s.points > 0 ? `+${s.points}` : s.points}
                        </p>
                        <p className="text-[8px] font-black uppercase tracking-tighter opacity-60">
                          Points
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Tidak ada data siswa ditemukan
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- ALERTS / TIDAK LANJUT --- */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-xs font-black text-slate-800 dark:text-white capitalize tracking-widest flex items-center gap-2">
                <ShieldExclamationIcon className="w-4 h-4 text-rose-500 animate-pulse" /> Butuh
                Tindak Lanjut
              </h4>
            </div>

            <div className="space-y-3">
              {stats.recentAlerts.length > 0 ? (
                stats.recentAlerts.map((alert, idx) => (
                  <div
                    key={`${alert.id}-${idx}`}
                    className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 border-l-4 border-l-rose-500 shadow-sm flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {alert.studentName}
                        </h5>
                        <span className="text-[10px] font-black text-rose-500">
                          {alert.points} Pts
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onNavigate(ViewState.PROFILE)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                        >
                          Panggil Wali
                        </button>
                        <button className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-all">
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-dashed border-emerald-200 dark:border-emerald-800 text-center">
                  <ShieldCheckIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Semua Terkendali
                  </p>
                </div>
              )}
            </div>

            <div className="bg-indigo-600 rounded-3xl p-6 text-white overflow-hidden relative group">
              <div className="relative z-10">
                <h5 className="text-sm font-black uppercase tracking-widest mb-1">
                  Laporan Semester
                </h5>
                <p className="text-[10px] text-indigo-200 mb-4">
                  Export PDF semua riwayat poin dan laporan BK terbaru.
                </p>
                <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Generate Report
                </button>
              </div>
              <GraduationCapIcon className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardBK;
