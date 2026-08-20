import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  XMarkIcon,
  XCircleIcon,
  CalendarIcon,
  MegaphoneIcon,
  ChartBarIcon,
  ChevronLeft,
  Loader2,
} from '@/shared/Icons';
import { format, subDays } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';
import type { NewsItem, Student, ClassData} from '@/types';
import { ViewState } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface StudentDeepDiveProps {
  student: Student;
  logs: any[];
  heatmap: any[];
}

interface ClassContextMenuProps {
  classData: ClassData;
  onAction: (view: ViewState) => void;
  onBack: () => void;
}

interface ClassAttendanceGridProps {
  classesData: any;
  onSelectClass: (cls: any) => void;
  onNavigate: (view: ViewState) => void;
}

interface StudentAttendanceListProps {
  className: string;
  onSelectStudent: (student: any) => void;
}

interface AttendancePanelProps {
  isOpen: boolean;
  onClose: () => void;
  stats: any;
  liveAttendance: any;
}

const StudentDeepDive = React.lazy(() =>
  import('./StudentDeepDive').then((m) => ({
    default: m.StudentDeepDive as unknown as React.ComponentType<StudentDeepDiveProps>,
  })),
);
const AttendancePanel = React.lazy(() =>
  import('@/features/attendance/AttendancePanel').then((m) => ({
    default: m.default as unknown as React.ComponentType<AttendancePanelProps>,
  })),
);
const ClassContextMenu = React.lazy(() =>
  import('./ClassContextMenu').then((m) => ({
    default: m.ClassContextMenu as unknown as React.ComponentType<ClassContextMenuProps>,
  })),
);
const ClassAttendanceGrid = React.lazy(() =>
  import('./ClassAttendanceGrid').then((m) => ({
    default: m.ClassAttendanceGrid as unknown as React.ComponentType<ClassAttendanceGridProps>,
  })),
);
const StudentAttendanceList = React.lazy(() =>
  import('./StudentAttendanceList').then((m) => ({
    default: m.StudentAttendanceList as unknown as React.ComponentType<StudentAttendanceListProps>,
  })),
);

interface ModalsSectionProps {
  monitoringModalOpen: boolean;
  setMonitoringModalOpen: (open: boolean) => void;
  selectedMonitoringTab: string;
  monitoringSearchQuery: string;
  setMonitoringSearchQuery: (query: string) => void;
  todayAttendanceRecords: any[];
  selectedStudentDetail: any;
  setSelectedStudentDetail: (detail: any) => void;

  showScheduleReminder: boolean;
  setShowScheduleReminder: (show: boolean) => void;
  onNavigate: (view: ViewState) => void;

  selectedNews: NewsItem | null;
  setSelectedNews: (news: NewsItem | null) => void;

  isBreakdownOpen: boolean;
  setIsBreakdownOpen: (open: boolean) => void;
  selectedBreakdownClass: ClassData | null;
  handleCloseClassView: () => void;
  loadingBreakdown: boolean;
  activeTab: 'context' | 'students';
  setActiveTab: (tab: 'context' | 'students') => void;
  breakdownData: any;
  handleSelectClassWrapper: (cls: any) => void;

  selectedStudentDeepDive: Student | null;
  setSelectedStudentDeepDive: (student: Student | null) => void;

  stats: any;
  liveAttendance: any;
}

const ModalsSection: React.FC<ModalsSectionProps> = ({
  monitoringModalOpen,
  setMonitoringModalOpen,
  selectedMonitoringTab,
  monitoringSearchQuery,
  setMonitoringSearchQuery,
  todayAttendanceRecords,
  selectedStudentDetail,
  setSelectedStudentDetail,
  showScheduleReminder,
  setShowScheduleReminder,
  onNavigate,
  selectedNews,
  setSelectedNews,
  isBreakdownOpen,
  setIsBreakdownOpen,
  selectedBreakdownClass,
  handleCloseClassView,
  loadingBreakdown,
  activeTab,
  setActiveTab,
  breakdownData,
  handleSelectClassWrapper,
  selectedStudentDeepDive,
  setSelectedStudentDeepDive,
  stats,
  liveAttendance,
}) => {
  return (
    <>
      {/* MONITORING MODAL */}
      {monitoringModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg max-h-[80vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white uppercase tracking-tight">
                  Monitoring: {selectedMonitoringTab}
                </h3>
              </div>
              <button
                onClick={() => {
                  setMonitoringModalOpen(false);
                  setSelectedStudentDetail(null);
                }}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {!selectedStudentDetail ? (
                <div className="space-y-2">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Cari nama siswa..."
                      value={monitoringSearchQuery}
                      onChange={(e) => setMonitoringSearchQuery(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    />
                  </div>
                  {todayAttendanceRecords
                    .filter((rec) => {
                      const query = monitoringSearchQuery.toLowerCase();
                      return (rec.namaLengkap || '').toLowerCase().includes(query);
                    })
                    .map((rec: any) => (
                      <div
                        key={rec.id}
                        className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-all font-sans"
                        onClick={() => setSelectedStudentDetail(rec)}
                      >
                        <span className="font-bold text-xs">{rec.namaLengkap || 'Siswa'}</span>
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {rec.status}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <h4 className="font-bold text-sm mb-2">{selectedStudentDetail.namaLengkap}</h4>
                  <p className="text-xs text-slate-500 font-bold">
                    Status: {selectedStudentDetail.status}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    {selectedStudentDetail.masuk && (
                      <p className="text-[10px] font-mono text-slate-500">
                        Masuk: {selectedStudentDetail.masuk}
                      </p>
                    )}
                    {selectedStudentDetail.duha && (
                      <p className="text-[10px] font-mono text-slate-500">
                        Duha: {selectedStudentDetail.duha}
                      </p>
                    )}
                    {selectedStudentDetail.zuhur && (
                      <p className="text-[10px] font-mono text-slate-500">
                        Zuhur: {selectedStudentDetail.zuhur}
                      </p>
                    )}
                    {selectedStudentDetail.ashar && (
                      <p className="text-[10px] font-mono text-slate-500">
                        Ashar: {selectedStudentDetail.ashar}
                      </p>
                    )}
                    {selectedStudentDetail.pulang && (
                      <p className="text-[10px] font-mono text-slate-500">
                        Pulang: {selectedStudentDetail.pulang}
                      </p>
                    )}
                  </div>
                  <button
                    className="mt-6 text-[10px] font-bold text-indigo-500 uppercase hover:underline"
                    onClick={() => setSelectedStudentDetail(null)}
                  >
                    ← Kembali ke Daftar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SCHEDULE REMINDER MODAL --- */}
      <AnimatePresence>
        {showScheduleReminder && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative"
            >
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/40 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                <CalendarIcon className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 lowercase">
                jadwal belum terisi
              </h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-8 px-2 lowercase">
                silakan lengkapi jadwal mingguan anda untuk validasi presensi otomatis.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowScheduleReminder(false);
                    onNavigate(ViewState.SCHEDULE);
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] tracking-wide hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  isi jadwal sekarang
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('dismissed_schedule_reminder', 'true');
                    setShowScheduleReminder(false);
                  }}
                  className="w-full py-4 text-slate-400 font-bold text-[9px] tracking-wide hover:text-slate-600"
                >
                  nanti saja
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- NEWS DETAIL MODAL --- */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNews(null)}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-full bg-white dark:bg-[#0B1121] overflow-hidden flex flex-col"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all active:scale-90"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <div className="overflow-y-auto flex-1 custom-scrollbar pb-20">
                {selectedNews.image ? (
                  <div className="h-[45vh] sm:h-[60vh] w-full relative">
                    <img
                      src={selectedNews.image}
                      alt={selectedNews.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0B1121] via-transparent to-transparent"></div>
                  </div>
                ) : (
                  <div className="h-40 bg-indigo-600 flex items-center justify-center">
                    <MegaphoneIcon className="w-16 h-16 text-white/20" />
                  </div>
                )}

                <div className="max-w-3xl mx-auto px-6 md:px-10 -mt-16 sm:-mt-24 relative z-10">
                  <div className="flex flex-wrap gap-2 mb-8">
                    <span className="px-5 py-1.5 bg-indigo-600 text-[10px] font-bold text-white rounded-full tracking-[0.2em] shadow-lg shadow-indigo-500/20 uppercase">
                      {selectedNews.category || 'Berita'}
                    </span>
                    <span className="px-5 py-1.5 bg-white/10 dark:bg-white/5 backdrop-blur-md text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-full tracking-[0.2em] border border-slate-200 dark:border-white/10">
                      {format(new Date(selectedNews.date), 'dd MMMM yyyy', { locale: localeID })}
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tight uppercase">
                    {selectedNews.title}
                  </h2>

                  <div className="max-w-none font-sans">
                    <div className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed space-y-5 markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline font-bold"
                            />
                          ),
                          p: ({ node, ...props }) => <p {...props} className="text-justify" />,
                        }}
                      >
                        {selectedNews.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: BREAKDOWN PER KELAS */}
      <AnimatePresence>
        {isBreakdownOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#f8fafc] dark:bg-[#020617] p-0 md:p-4 flex flex-col items-center overflow-hidden"
          >
            <div className="w-full max-w-7xl h-full flex flex-col">
              <div className="flex justify-between items-center px-6 py-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 shrink-0">
                  {selectedBreakdownClass ? (
                    <ChevronLeft className="w-5 h-5" />
                  ) : (
                    <ChartBarIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedBreakdownClass && (
                    <button
                      onClick={handleCloseClassView}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsBreakdownOpen(false);
                    }}
                    className="p-3 rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white hover:bg-rose-600 transition-all hover:rotate-90"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar">
                {loadingBreakdown ? (
                  <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <p className="text-sm font-bold text-slate-400 animate-pulse tracking-[0.3em]">
                      Otorisasi satelit...
                    </p>
                  </div>
                ) : selectedBreakdownClass ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 mx-2">
                      <button
                        onClick={() => setActiveTab('context')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide rounded-xl transition-all ${
                          activeTab === 'context'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                            : 'text-slate-400'
                        }`}
                      >
                        Inti Fitur
                      </button>
                      <button
                        onClick={() => setActiveTab('students')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide rounded-xl transition-all ${
                          activeTab === 'students'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                            : 'text-slate-400'
                        }`}
                      >
                        Daftar Siswa
                      </button>
                    </div>

                    {activeTab === 'context' ? (
                      <React.Suspense
                        fallback={
                          <div className="flex justify-center h-40 items-center">
                            <Loader2 className="animate-spin text-indigo-500" />
                          </div>
                        }
                      >
                        <ClassContextMenu
                          classData={selectedBreakdownClass}
                          onAction={(view: ViewState) => onNavigate(view)}
                          onBack={handleCloseClassView}
                        />
                      </React.Suspense>
                    ) : (
                      <React.Suspense
                        fallback={
                          <div className="flex justify-center h-40 items-center">
                            <Loader2 className="animate-spin text-indigo-500" />
                          </div>
                        }
                      >
                        <StudentAttendanceList
                          className={selectedBreakdownClass.name}
                          onSelectStudent={(s: any) => setSelectedStudentDeepDive(s)}
                        />
                      </React.Suspense>
                    )}
                  </div>
                ) : (
                  <React.Suspense
                    fallback={
                      <div className="flex justify-center h-40 items-center">
                        <Loader2 className="animate-spin text-indigo-500" />
                      </div>
                    }
                  >
                    <ClassAttendanceGrid
                      classesData={breakdownData}
                      onSelectClass={handleSelectClassWrapper}
                      onNavigate={onNavigate}
                    />
                  </React.Suspense>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: DEEP DIVE SISWA */}
      <AnimatePresence>
        {selectedStudentDeepDive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white dark:bg-[#0B1121] w-full max-w-lg rounded-[3.5rem] border border-white/20 dark:border-slate-800 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              <div className="p-10">
                <button
                  onClick={() => setSelectedStudentDeepDive(null)}
                  className="absolute top-8 right-8 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white transition-all"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                <React.Suspense
                  fallback={
                    <div className="flex justify-center h-40 items-center">
                      <Loader2 className="animate-spin text-indigo-500" />
                    </div>
                  }
                >
                  <StudentDeepDive
                    student={selectedStudentDeepDive}
                    logs={[
                      {
                        date: format(new Date(), 'dd MMMM', { locale: localeID }),
                        time: '07:15',
                        status: 'Hadir',
                        note: 'Tepat Waktu',
                      },
                      {
                        date: format(subDays(new Date(), 1), 'dd MMMM', { locale: localeID }),
                        time: '07:45',
                        status: 'Terlambat',
                        note: '15 Menit',
                      },
                      {
                        date: format(subDays(new Date(), 2), 'dd MMMM', { locale: localeID }),
                        time: '-',
                        status: 'Alpha',
                        note: 'Tanpa Keterangan',
                      },
                    ]}
                    heatmap={Array.from({ length: 30 }).map((_, i) => ({
                      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
                      status: ['Hadir', 'Hadir', 'Hadir', 'Terlambat', 'Izin', 'Alpha', 'Hadir'][
                        Math.floor(Math.random() * 7)
                      ],
                    }))}
                  />
                </React.Suspense>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <React.Suspense
        fallback={
          <div className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm flex justify-center items-center">
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        }
      >
        <AttendancePanel
          isOpen={isBreakdownOpen}
          onClose={() => setIsBreakdownOpen(false)}
          stats={stats}
          liveAttendance={liveAttendance}
        />
      </React.Suspense>
    </>
  );
};

export default ModalsSection;
