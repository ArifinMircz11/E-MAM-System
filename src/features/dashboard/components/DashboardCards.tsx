import React from 'react';
import { motion } from 'motion/react';
import {
  UserIcon,
  CheckCircleIcon,
  Loader2,
  BriefcaseIcon,
  ChevronLeft,
  ChevronRight,
  XCircleIcon,
  ClockIcon,
  HeartIcon,
  ArrowRightIcon,
} from '@/shared/Icons';
import { UserRole, ViewState } from '@/types';

interface DashboardCardsProps {
  isTeacher: boolean;
  isStudent: boolean;
  isStaff: boolean;
  userRole: UserRole;
  hasCheckedInToday: boolean;
  checkingIn: boolean;
  onTeacherCheckIn: () => void;
  onNavigate: (view: ViewState) => void;
  studentAttendanceRate: number;
  studentPerformanceLabel: string;
  liveAttendance: {
    teacherPresent: number;
    teacherTotal: number;
  };
  stats: any;
  totalStudentsWithMisconduct: number;
  sessionMonitoringStats: any;
  news: any[];
  onSelectNews: (news: any) => void;
  onShowMonitoring: (tab: string) => void;
  newsContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollCarousel: (direction: 'left' | 'right') => void;
  anomalies?: {
    listTerdeteksi: any[];
    listHadir: any[];
    listSakitIzin: any[];
    listAlpha: any[];
    listTs: any[];
    listT: any[];
    listPC: any[];
    listHaid: any[];
  } | null;
  onSelectDrill?: (data: any) => void;
  sessionSummary?: any[];
  onSelectSessionDrill?: (
    session: string,
    type: 'belumScan' | 'hadir' | 'terlambat' | 'pulangCepat' | 'haid' | 'sakitIzin',
  ) => void;
  tenantData?: any;
  studentAttendanceRecords?: any[];
}

const SessionCardStack: React.FC<{
  sessionSummary?: any[];
  onSelectSessionDrill?: (
    session: string,
    type: 'belumScan' | 'hadir' | 'terlambat' | 'pulangCepat' | 'haid' | 'sakitIzin',
  ) => void;
}> = ({ sessionSummary, onSelectSessionDrill }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (!sessionSummary || sessionSummary.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? sessionSummary.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === sessionSummary.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-[340px] shrink-0 snap-start h-[215px] relative group select-none pr-4">
      <div className="relative w-full h-[195px]">
        {sessionSummary.map((item, idx) => {
          const session = item.session;
          const labelSesi =
            session === 'masuk'
              ? 'Sesi Masuk'
              : session === 'duha'
                ? 'Sesi Duha'
                : session === 'zuhur'
                  ? 'Sesi Zuhur'
                  : session === 'ashar'
                    ? 'Sesi Ashar'
                    : 'Sesi Pulang';

          const isSesiMasuk = session === 'masuk';
          const isSesiPulang = session === 'pulang';

          let offset = idx - activeIndex;
          if (offset < 0) {
            offset += sessionSummary.length;
          }

          if (offset > 2) return null;

          const zIndex = 30 - offset;
          const scale = 1 - offset * 0.035;
          const translateX = offset * 12;
          const translateY = offset * 12;
          const opacity = 1 - offset * 0.35;

          return (
            <motion.div
              key={session}
              style={{
                zIndex,
              }}
              animate={{
                scale,
                x: translateX,
                y: translateY,
                opacity,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`absolute inset-x-0 top-0 h-[192px] w-[312px] bg-gradient-to-br from-white to-slate-50/40 dark:from-slate-900 dark:to-slate-950 border ${offset === 0 ? 'border-semibold border-indigo-500/40 shadow-soft dark:border-indigo-500/40' : 'border-slate-200/50 dark:border-slate-800/80 shadow-md'} rounded-3xl p-4 flex flex-col justify-between overflow-hidden cursor-pointer`}
              onClick={(e: React.MouseEvent) => {
                if (offset > 0) {
                  setActiveIndex(idx);
                } else {
                  setActiveIndex((prev) => (prev + 1) % sessionSummary.length);
                }
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />

              <div>
                <div className="flex justify-between items-start mb-2 px-0.5">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[6.5px] font-bold uppercase tracking-[0.25em] text-indigo-500 block leading-none">
                        PRESENSI SISWA
                      </span>
                    </div>
                    <h5 className="text-[10px] font-bold text-slate-800 dark:text-white tracking-tight uppercase leading-none">
                      {labelSesi}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2">
                    {offset === 0 && (
                      <div className="flex items-center gap-1 mr-1">
                        <button
                          onClick={handlePrev}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-400 hover:text-indigo-600 transition-colors pointer-events-auto cursor-pointer flex items-center justify-center"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleNext}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-400 hover:text-indigo-600 transition-colors pointer-events-auto cursor-pointer flex items-center justify-center"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="w-6 h-5 bg-gradient-to-br from-amber-400/20 to-amber-600/5 border border-amber-500/25 rounded-md relative overflow-hidden flex items-center justify-center shrink-0">
                      <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-amber-500/20" />
                      <div className="absolute inset-y-0 left-1/3 w-[0.5px] bg-amber-500/20" />
                      <div className="absolute inset-y-0 right-1/3 w-[0.5px] bg-amber-500/20" />
                      <div className="w-1 h-1 rounded bg-amber-500/10 border border-amber-500/25" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 px-0.5">
                  <button
                    disabled={offset > 0 || !onSelectSessionDrill}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectSessionDrill) onSelectSessionDrill(session, 'belumScan');
                    }}
                    className="text-left flex flex-col justify-between p-1.5 rounded-2xl bg-rose-500/[0.04] dark:bg-rose-500/[0.02] hover:bg-rose-500/[0.08] border border-rose-500/10 hover:border-rose-500/25 cursor-pointer focus:outline-none transition-colors h-[42px] disabled:pointer-events-none"
                    title={`Klik detail belum scan`}
                  >
                    <span className="text-[6.5px] font-bold text-rose-500 tracking-wider uppercase leading-none">
                      ALPHA/TS
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tight leading-none mt-1">
                      {item.belumScan} Ssw
                    </span>
                  </button>

                  <button
                    disabled={offset > 0 || !onSelectSessionDrill}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectSessionDrill) onSelectSessionDrill(session, 'hadir');
                    }}
                    className="text-left flex flex-col justify-between p-1.5 rounded-2xl bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] hover:bg-emerald-500/[0.08] border border-emerald-500/10 hover:border-emerald-500/25 cursor-pointer focus:outline-none transition-colors h-[42px] disabled:pointer-events-none"
                    title={`Klik detail hadir`}
                  >
                    <span className="text-[6.5px] font-bold text-emerald-500 tracking-wider uppercase leading-none">
                      HADIR
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight leading-none mt-1">
                      {item.hadir} Ssw
                    </span>
                  </button>

                  {isSesiMasuk && (
                    <>
                      <button
                        disabled={offset > 0 || !onSelectSessionDrill}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectSessionDrill) onSelectSessionDrill(session, 'terlambat');
                        }}
                        className="text-left flex flex-col justify-between p-1.5 rounded-2xl bg-amber-500/[0.04] dark:bg-amber-500/[0.02] hover:bg-amber-500/[0.08] border border-amber-500/10 hover:border-amber-500/25 cursor-pointer focus:outline-none transition-colors h-[42px] disabled:pointer-events-none"
                        title={`Klik detail terlambat`}
                      >
                        <span className="text-[6.5px] font-bold text-amber-500 tracking-wider uppercase leading-none">
                          LATE
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-450 font-mono tracking-tight leading-none mt-1">
                          {item.terlambat} Ssw
                        </span>
                      </button>

                      <button
                        disabled={offset > 0 || !onSelectSessionDrill}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectSessionDrill) onSelectSessionDrill(session, 'sakitIzin');
                        }}
                        className="text-left flex flex-col justify-between p-1.5 rounded-2xl bg-blue-500/[0.04] dark:bg-blue-500/[0.02] hover:bg-blue-500/[0.08] border border-blue-500/10 hover:border-blue-500/25 cursor-pointer focus:outline-none transition-colors h-[42px] disabled:pointer-events-none"
                        title={`Klik detail sakit/izin`}
                      >
                        <span className="text-[6.5px] font-bold text-blue-500 tracking-wider uppercase leading-none">
                          IJIN/SAKIT
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-450 font-mono tracking-tight leading-none mt-1">
                          {item.sakitIzin} Ssw
                        </span>
                      </button>
                    </>
                  )}

                  {!isSesiMasuk && !isSesiPulang && (
                    <button
                      disabled={offset > 0 || !onSelectSessionDrill}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectSessionDrill) onSelectSessionDrill(session, 'haid');
                      }}
                      className="col-span-2 text-left flex justify-between items-center px-2 py-1.5 rounded-2xl bg-pink-500/[0.04] dark:bg-pink-500/[0.02] hover:bg-pink-500/[0.08] border border-pink-500/10 hover:border-pink-500/25 cursor-pointer focus:outline-none transition-colors h-[42px] mt-auto disabled:pointer-events-none animate-none"
                      title={`Klik detail haid`}
                    >
                      <span className="text-[6.5px] font-bold text-pink-500 tracking-wider uppercase leading-none">
                        IBADAH KHUSUS (HAID)
                      </span>
                      <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 font-mono tracking-tight leading-none">
                        {item.haid} Ssw
                      </span>
                    </button>
                  )}

                  {isSesiPulang && (
                    <button
                      disabled={offset > 0 || !onSelectSessionDrill}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectSessionDrill) onSelectSessionDrill(session, 'pulangCepat');
                      }}
                      className="col-span-2 text-left flex justify-between items-center px-2 py-1.5 rounded-2xl bg-orange-500/[0.04] dark:bg-orange-500/[0.02] hover:bg-orange-500/[0.08] border border-orange-500/10 hover:border-orange-500/25 cursor-pointer focus:outline-none transition-colors h-[42px] mt-auto disabled:pointer-events-none"
                      title={`Klik detail PC`}
                    >
                      <span className="text-[6.5px] font-bold text-orange-500 tracking-wider uppercase leading-none">
                        PULANG CEPAT (PC)
                      </span>
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 font-mono tracking-tight leading-none">
                        {item.pulangCepat} Ssw
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[6.5px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase leading-none px-0.5">
                <span>
                  Sesi Hari Ini ({idx + 1}/{sessionSummary.length})
                </span>
                {offset === 0 ? (
                  <span className="font-mono text-indigo-400 opacity-85 flex items-center gap-0.5">
                    DETAIL <span>→</span>
                  </span>
                ) : (
                  <span className="font-mono text-slate-500">TAP UNTUK BUKA</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const MonthlyMiniCalendar: React.FC<{ records: any[]; onNavigate: (view: ViewState) => void }> = ({
  records,
  onNavigate,
}) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Indonesia Locale Months
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const attMap = React.useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      const date = r.date;
      const status = r.statusGlobal?.toLowerCase() || '';
      map.set(date, status);
    });
    return map;
  }, [records]);

  return (
    <div
      onClick={() => onNavigate(ViewState.PERSONAL_ATTENDANCE)}
      className="w-[340px] shrink-0 snap-start h-[215px] bg-[#0F172A] p-5 border border-indigo-500/10 rounded-3xl relative overflow-hidden group shadow-float flex flex-col justify-between cursor-pointer hover:border-indigo-500/30 transition-all"
    >
      <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          <h3 className="text-[9px] font-bold text-indigo-400 tracking-[0.2em] uppercase leading-none">
            RIWAYAT PRESENSI
          </h3>
        </div>
        <span className="text-[10px] font-bold text-white px-2 py-0.5 bg-white/5 rounded-lg border border-white/10">
          {monthNames[currentMonth]} {currentYear}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1 px-1 mt-1">
        {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
          <div
            key={i}
            className="text-[7px] font-bold text-slate-500 text-center uppercase tracking-wide leading-none"
          >
            {d}
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = attMap.get(dateStr);
          const isToday = day === today.getDate();

          let bg = 'bg-slate-800/10 text-slate-700';
          if (status === 'hadir') bg = 'bg-emerald-500 text-white';
          else if (status === 'terlambat') bg = 'bg-amber-500 text-white';
          else if (status === 'haid') bg = 'bg-rose-500 text-white';
          else if (status === 'sakit' || status === 'izin') bg = 'bg-blue-500 text-white';
          else if (status === 'alpha')
            bg = 'bg-rose-500/20 text-rose-500 border border-rose-500/40';

          return (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center text-[8px] font-bold transition-all ${bg} ${isToday ? 'ring-1 ring-white/40 ring-offset-[0.5px] ring-offset-slate-900 scale-105' : ''}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[6.5px] font-bold text-slate-500 tracking-wide uppercase py-2 border-t border-white/5">
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-[2px]" />
            Hadir
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-[2px]" />
            Alpha
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-[2px]" />
            Late
          </div>
        </div>
        <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">
          Detail Histori {today.toLocaleString('id-ID', { month: 'short' })} →
        </span>
      </div>
    </div>
  );
};

const TodayFiveSessionsCard: React.FC<{ records: any[]; onNavigate: (view: ViewState) => void }> = ({
  records,
  onNavigate,
}) => {
  const getTodaySessionsAndFinalStatus = () => {
    const todayStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
    const todayRecord = records.find((r) => r.date === todayStr);

    const getSessionDisplay = (sessionName: string) => {
      if (!todayRecord) {
        // If no attendance record for today yet, checking if weekend
        const day = new Date().getDay();
        if (day === 0 || day === 6) {
          return { code: '--', label: 'Libur', time: '--:--', color: 'text-slate-400 dark:text-slate-500 bg-slate-500/5' };
        }
        return { code: 'TS', label: 'Belum Scan', time: '--:--', color: 'text-rose-400 bg-rose-500/10 border border-rose-500/10' };
      }
      const s = todayRecord.sessions?.[sessionName] || { status: 'TS', time: '--:--' };
      const status = String(s.status || 'TS').toLowerCase();
      const time = s.time || '--:--';

      if (status === 'hadir') return { code: 'H', label: 'Hadir', time, color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25' };
      if (status === 'haid') return { code: 'H+', label: 'Haid', time: 'Haid', color: 'text-pink-400 bg-pink-500/10 border border-pink-500/25' };
      if (status === 'terlambat' || status === 't') return { code: 'T', label: 'Terlambat', time, color: 'text-amber-400 bg-amber-500/10 border border-amber-500/25' };
      if (status === 'pc' || status === 'pulang cepat') return { code: 'PC', label: 'Pulang Cepat', time, color: 'text-orange-400 bg-orange-500/10 border border-orange-500/25' };
      if (status === 'sakit' || todayRecord.statusGlobal?.toLowerCase() === 'sakit') return { code: 'S', label: 'Sakit', time: 'Sakit', color: 'text-blue-400 bg-blue-500/10 border border-blue-500/25' };
      if (status === 'izin' || todayRecord.statusGlobal?.toLowerCase() === 'izin') return { code: 'I', label: 'Izin', time: 'Izin', color: 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/25' };
      return { code: 'TS', label: 'Belum Scan', time, color: 'text-rose-400/80 bg-rose-500/10 border border-rose-500/10' };
    };

    const sessions = {
      masuk: getSessionDisplay('masuk'),
      duha: getSessionDisplay('duha'),
      zuhur: getSessionDisplay('zuhur'),
      ashar: getSessionDisplay('ashar'),
      pulang: getSessionDisplay('pulang'),
    };

    // Determine Keterangan Final using Priority Rule
    let finalStatus = 'A (Alfa)';
    let finalColor = 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
    let dailyPoints = 10;

    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;

    if (isWeekend && !todayRecord) {
      finalStatus = 'Libur Akhir Pekan';
      finalColor = 'text-slate-400 bg-slate-500/5 border border-slate-500/10';
      dailyPoints = 0;
    } else if (todayRecord) {
      const statusGlobal = String(todayRecord.statusGlobal || 'Alpha').toLowerCase();
      dailyPoints = todayRecord.totalPoinHariIni ?? 0;

      if (statusGlobal.includes('izin')) {
        finalStatus = 'Izin Resmi (I)';
        finalColor = 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/25';
      } else if (statusGlobal.includes('sakit')) {
        finalStatus = 'Sakit (S)';
        finalColor = 'text-blue-400 bg-blue-500/10 border border-blue-500/25';
      } else if (statusGlobal.includes('haid')) {
        finalStatus = 'Ibadah Khusus (H+)';
        finalColor = 'text-pink-400 bg-pink-500/10 border border-pink-500/25';
      } else if (statusGlobal.includes('hadir') && dailyPoints === 0) {
        finalStatus = 'Hadir Sempurna (H)';
        finalColor = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25';
      } else if (statusGlobal.includes('terlambat') || statusGlobal.includes('pulang cepat') || statusGlobal.includes('pc') || dailyPoints > 0) {
        finalStatus = 'Hadir dengan Catatan';
        finalColor = 'text-amber-400 bg-amber-500/10 border border-amber-500/25';
      } else {
        finalStatus = 'Alfa (A)';
        finalColor = 'text-rose-400 bg-rose-500/10 border border-rose-500/25';
      }
    }

    return { sessions, finalStatus, finalColor, dailyPoints };
  };

  const { sessions, finalStatus, finalColor, dailyPoints } = getTodaySessionsAndFinalStatus();

  return (
    <div
      onClick={() => onNavigate(ViewState.SCANNER)}
      className="w-[340px] shrink-0 snap-start h-[215px] bg-[#0F172A] p-5 border border-indigo-500/10 rounded-3xl relative overflow-hidden group shadow-float flex flex-col justify-between cursor-pointer hover:border-indigo-500/30 transition-all"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />

      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          <h3 className="text-[9px] font-bold text-indigo-400 tracking-[0.2em] uppercase leading-none">
            5 Sesi Presensi Hari Ini
          </h3>
        </div>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          Point Engine v7.7
        </span>
      </div>

      {/* Grid of 5 Sessions */}
      <div className="grid grid-cols-5 gap-1.5 my-2">
        {(Object.keys(sessions) as Array<keyof typeof sessions>).map((key) => {
          const s = sessions[key];
          return (
            <div
              key={key}
              className={`p-1.5 rounded-xl flex flex-col items-center justify-between text-center transition-all ${s.color} h-[68px]`}
            >
              <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">
                {key}
              </span>
              <span className="text-sm font-extrabold font-mono tracking-tight my-1">
                {s.code}
              </span>
              <span className="text-[7.5px] font-semibold tracking-tighter truncate w-full text-slate-350">
                {s.time}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer / Summary Rules info */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[7px] font-bold text-slate-500 tracking-wide uppercase">
        <div className="flex flex-col gap-0.5 text-left">
          <span className="text-[6.5px] text-slate-400 font-bold uppercase">Keterangan Final</span>
          <span className={`px-1.5 py-0.5 rounded-lg text-[8px] font-bold mt-0.5 ${finalColor}`}>
            {finalStatus}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-right items-end">
          <span className="text-[6.5px] text-slate-400 font-bold uppercase font-mono">Poin Harian</span>
          <span className={`text-[11px] font-extrabold font-mono mt-0.5 ${dailyPoints > 0 ? 'text-rose-450' : 'text-emerald-400'}`}>
            {dailyPoints > 0 ? `+${dailyPoints} Poin` : '0 Poin'}
          </span>
        </div>
      </div>
    </div>
  );
};

const DashboardCards: React.FC<DashboardCardsProps> = ({
  isTeacher,
  isStudent,
  isStaff,
  userRole,
  hasCheckedInToday,
  checkingIn,
  onTeacherCheckIn,
  onNavigate,
  studentAttendanceRate,
  studentPerformanceLabel,
  liveAttendance,
  stats,
  totalStudentsWithMisconduct,
  sessionMonitoringStats,
  news,
  onSelectNews,
  onShowMonitoring,
  newsContainerRef,
  scrollCarousel,
  anomalies,
  onSelectDrill,
  sessionSummary,
  onSelectSessionDrill,
  tenantData,
  studentAttendanceRecords = [],
}) => {
  // Moved logic from Dashboard.tsx
  const pointsLogic = React.useMemo(() => {
    const totalPointsSum =
      (stats.totalAchievementPointsCount || 0) + (stats.totalMisconductPointsCount || 0);
    const achievementPercent =
      totalPointsSum > 0
        ? Math.round(((stats.totalAchievementPointsCount || 0) / totalPointsSum) * 100)
        : 100;
    const misconductPercent = totalPointsSum > 0 ? 100 - achievementPercent : 0;
    const violatingStudentsPercent =
      stats.totalStudents > 0
        ? Math.round(((totalStudentsWithMisconduct || 0) / stats.totalStudents) * 100)
        : 0;
    return { achievementPercent, misconductPercent, violatingStudentsPercent };
  }, [stats, totalStudentsWithMisconduct]);

  const activeNews = React.useMemo(() => {
    if (news && news.length > 0) return news;
    return [
      {
        id: 'default-news-1',
        title: 'Penerapan Kartu Digital QR Presensi Terpadu',
        category: 'PENGUMUMAN',
        date: new Date().toISOString(),
        summary:
          'Madrasah kini secara resmi menerapkan sistem presensi modern berbasis scan QR Code kartu digital siswa untuk meningkatkan akurasi data kehadiran harian secara real-time.',
        isPublished: true,
      },
      {
        id: 'default-news-2',
        title: 'Layanan Konsultasi Cerdas e-Mam System Virtual Assistant',
        category: 'AKADEMIK',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        summary:
          'Siswa kini dapat memanfaatkan asisten virtual pintar e-Mam System (Konsultasi AI / Live Chat) untuk menanyakan rincian poin prestasi, pelanggaran, maupun riwayat kehadiran langsung melalui aplikasi.',
        isPublished: true,
      },
      {
        id: 'default-news-3',
        title: 'Persiapan Penilaian Akhir Semester Genap',
        category: 'INFORMASI',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        summary:
          'Menjelang akhir tahun ajaran, seluruh siswa diimbau untuk menjaga kedisiplinan tingkat kehadiran serta mempersiapkan perbaikan nilai akademik sebelum pekan ujian dimulai.',
        isPublished: true,
      },
    ];
  }, [news]);

  return (
    <div className="relative group/carousel px-6 pt-2">
      <div
        ref={newsContainerRef as any}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory scroll-smooth items-stretch relative"
      >
        {/* --- MONITORING CARD FOR STAFF (NOW FIRST PLACE) --- */}
        {isStaff && (
          <motion.div
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => onShowMonitoring('overview')}
            className="w-[340px] shrink-0 snap-start h-[215px] bg-[#0F172A] border border-indigo-500/10 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-float p-5 cursor-pointer group/monitor hover:border-indigo-500/40 transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wider uppercase group-hover/monitor:text-indigo-400 transition-colors">
                  Monitoring Hari Ini
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
              </div>
            </div>

            <div className="flex gap-2 flex-1 my-2.5 overflow-hidden">
              {/* Left Col: Terdeteksi Circle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDrill?.({
                    title: 'Siswa Aktif Scan Hari Ini',
                    students: anomalies?.listTerdeteksi || [],
                    type: 'DETEKSI',
                  });
                }}
                className="w-[40%] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-3xl p-3 flex flex-col justify-between items-center text-center transition-all cursor-pointer active:scale-95"
              >
                <span className="text-[7.5px] font-bold text-indigo-400 uppercase tracking-wide leading-none">
                  Terdeteksi
                </span>
                <div className="relative flex items-center justify-center my-1.5">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/25 animate-ping opacity-75"></div>
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40">
                    <span className="text-xl font-bold text-white">
                      {anomalies?.listTerdeteksi.length || 0}
                    </span>
                  </div>
                </div>
                <span className="text-[6.5px] font-bold text-indigo-300 uppercase tracking-wider leading-none">
                  Aktif Scan →
                </span>
              </button>

              {/* Right Col: 2 Rows of interactive actions */}
              <div className="w-[58%] flex flex-col justify-between gap-1.5">
                {/* Drill Down 1 circles: H, I, A as beautiful small capsules / row */}
                <div className="flex justify-between gap-1">
                  {/* H */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDrill?.({
                        title: 'Rincian Siswa Hadir Hari Ini',
                        students: anomalies?.listHadir || [],
                        type: 'Hadir',
                      });
                    }}
                    className="flex-1 py-1 px-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl flex flex-col items-center transition-all cursor-pointer active:scale-95"
                  >
                    <span className="text-[6px] font-bold text-emerald-400 uppercase leading-none">
                      Hadir
                    </span>
                    <span className="text-xs font-bold text-emerald-300 mt-1 leading-none">
                      {anomalies?.listHadir.length || 0}
                    </span>
                  </button>

                  {/* I */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDrill?.({
                        title: 'Rincian Siswa Sakit/Izin Hari Ini',
                        students: anomalies?.listSakitIzin || [],
                        type: 'Izin',
                      });
                    }}
                    className="flex-1 py-1 px-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-2xl flex flex-col items-center transition-all cursor-pointer active:scale-95"
                  >
                    <span className="text-[6px] font-bold text-amber-400 uppercase leading-none">
                      Izin
                    </span>
                    <span className="text-xs font-bold text-amber-300 mt-1 leading-none">
                      {anomalies?.listSakitIzin.length || 0}
                    </span>
                  </button>

                  {/* A */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDrill?.({
                        title: 'Rincian Siswa Belum Absen / Alpha',
                        students: anomalies?.listAlpha || [],
                        type: 'Alpha',
                      });
                    }}
                    className="flex-1 py-1 px-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl flex flex-col items-center transition-all cursor-pointer active:scale-95"
                  >
                    <span className="text-[6px] font-bold text-rose-400 uppercase leading-none">
                      Alpha
                    </span>
                    <span className="text-xs font-bold text-rose-300 mt-1 leading-none">
                      {anomalies?.listAlpha.length || 0}
                    </span>
                  </button>
                </div>

                {/* Drill Down 2 Grid of Exceptions: Belum Scan (TS), Terlambat (T), Pulang Cepat (PC), Haid (HD) */}
                <div className="grid grid-cols-2 gap-1">
                  {/* TS */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDrill?.({
                        title: 'Rincian Belum Scan Lengkap (TS)',
                        students: anomalies?.listTs || [],
                        type: 'TS',
                      });
                    }}
                    className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 hover:border-indigo-500/30 rounded-2xl px-1.5 py-1 flex items-center justify-between text-left transition-all cursor-pointer active:scale-95"
                  >
                    <div>
                      <p className="text-[6.5px] font-bold text-slate-400 uppercase leading-none">
                        TS
                      </p>
                      <span className="text-[9px] font-bold text-white leading-none mt-1 inline-block">
                        {anomalies?.listTs.length || 0}
                      </span>
                    </div>
                    <ClockIcon className="w-3 h-3 text-slate-400/85 shrink-0" />
                  </button>

                  {/* T */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDrill?.({
                        title: 'Rincian Siswa Terlambat Hari Ini',
                        students: anomalies?.listT || [],
                        type: 'T',
                      });
                    }}
                    className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 hover:border-indigo-500/30 rounded-2xl px-1.5 py-1 flex items-center justify-between text-left transition-all cursor-pointer active:scale-95"
                  >
                    <div>
                      <p className="text-[6.5px] font-bold text-amber-400 uppercase leading-none">
                        LATE
                      </p>
                      <span className="text-[9px] font-bold text-white leading-none mt-1 inline-block">
                        {anomalies?.listT.length || 0}
                      </span>
                    </div>
                    <XCircleIcon className="w-3 h-3 text-amber-500/85 shrink-0" />
                  </button>

                  {/* PC */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDrill?.({
                        title: 'Rincian Siswa Pulang Cepat (PC)',
                        students: anomalies?.listPC || [],
                        type: 'PC',
                      });
                    }}
                    className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 hover:border-indigo-500/30 rounded-2xl px-1.5 py-1 flex items-center justify-between text-left transition-all cursor-pointer active:scale-110"
                  >
                    <div>
                      <p className="text-[6.5px] font-bold text-rose-400 uppercase leading-none">
                        PC
                      </p>
                      <span className="text-[9px] font-bold text-white leading-none mt-1 inline-block">
                        {anomalies?.listPC.length || 0}
                      </span>
                    </div>
                    <ArrowRightIcon className="w-3 h-3 text-rose-500/85 shrink-0" />
                  </button>

                  {/* HD / Haid */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDrill?.({
                        title: 'Rincian Siswa Ibadah Khusus (Haid)',
                        students: anomalies?.listHaid || [],
                        type: 'Haid',
                      });
                    }}
                    className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 hover:border-indigo-500/30 rounded-2xl px-1.5 py-1 flex items-center justify-between text-left transition-all cursor-pointer active:scale-95"
                  >
                    <div>
                      <p className="text-[6.5px] font-bold text-pink-400 uppercase leading-none">
                        HAID
                      </p>
                      <span className="text-[9px] font-bold text-white leading-none mt-1 inline-block">
                        {anomalies?.listHaid.length || 0}
                      </span>
                    </div>
                    <HeartIcon className="w-3 h-3 text-pink-500/85 shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/5 text-[7px] font-bold tracking-wide text-indigo-400 uppercase">
              <span>Status Monitoring Real-time</span>
              <span className="group-hover/monitor:translate-x-1 transition-transform">
                Laporan Lengkap →
              </span>
            </div>
          </motion.div>
        )}

        {/* --- TEACHER SPECIAL CARD: QUICK CHECK-IN --- */}
        {isTeacher && (
          <motion.div
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.995 }}
            className="w-[340px] shrink-0 snap-start h-[215px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-emerald-900/20 group cursor-pointer relative transition-all hover:shadow-float hover:border-emerald-500/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors pointer-events-none"></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[7.5px] font-bold tracking-[0.2em] text-emerald-300 opacity-70 mb-1 uppercase">
                    Pintasan
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    Presensi Kehadiran
                  </h3>
                </div>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <UserIcon className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-2">
                {hasCheckedInToday ? (
                  <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-1.5">
                      <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase">
                      Sudah Absen
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={onTeacherCheckIn}
                    disabled={checkingIn}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all shadow-soft active:scale-95 text-xs"
                  >
                    {checkingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Absen Sekarang'
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- STUDENT SPECIAL CARD: PERSONAL ATTENDANCE RATE --- */}
        {isStudent && (
          <motion.div
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => onNavigate(ViewState.PERSONAL_ATTENDANCE)}
            className="w-[340px] shrink-0 snap-start h-[215px] bg-white dark:bg-[#0B1121] p-6 border border-slate-200/50 dark:border-slate-800 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-indigo-500/50 transition-all shadow-soft"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold tracking-wide text-indigo-500 uppercase mb-1">
                    Status Kehadiran
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                    Statistik Personal
                  </h3>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30">
                  <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-100 dark:text-slate-800"
                    />
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 34}
                      initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                      animate={{
                        strokeDashoffset: 2 * Math.PI * 34 * (1 - studentAttendanceRate / 100),
                      }}
                      className="text-indigo-500"
                    />
                  </svg>
                  <span className="absolute text-lg font-bold text-slate-900 dark:text-white">
                    {studentAttendanceRate}%
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wide leading-none mb-1 uppercase">
                    Rasio Hadir
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white ">
                    {studentPerformanceLabel}
                  </p>
                  <p className="text-[8px] font-medium text-slate-500 mt-1 italic">
                    Berdasarkan 30 hari terakhir
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                    Detail Riwayat →
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- STUDENT SPECIAL CARD: TODAY'S 5 SESSIONS --- */}
        {isStudent && (
          <TodayFiveSessionsCard records={studentAttendanceRecords} onNavigate={onNavigate} />
        )}

        {/* --- STUDENT SPECIAL CARD: MONTHLY HISTORY --- */}
        {isStudent && (
          <MonthlyMiniCalendar records={studentAttendanceRecords} onNavigate={onNavigate} />
        )}

        {/* --- TEACHER MONITORING CARD (Admin/Dev/Staff) --- */}
        {(userRole === UserRole.ADMIN ||
          userRole === UserRole.DEVELOPER ||
          userRole === UserRole.KEPALA_MADRASAH ||
          userRole === UserRole.WAKAMAD) && (
          <motion.div
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => onNavigate(ViewState.TEACHER_ATTENDANCE)}
            className="w-[340px] shrink-0 snap-start h-[215px] bg-white dark:bg-[#0B1121] border border-slate-200/50 dark:border-slate-800 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-soft p-6 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase mb-0.5">
                  Absensi Guru
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-white rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                    Live Status
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <BriefcaseIcon className="w-5 h-5 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center relative z-10">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-900 dark:text-white ">
                  {(liveAttendance || {}).teacherPresent || 0}
                </span>
                <span className="text-xl font-bold text-slate-300 dark:text-slate-600">
                  / {(liveAttendance || {}).teacherTotal || 0}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase mt-3">
                GTK Berhadir Hari Ini
              </span>
            </div>
          </motion.div>
        )}

        {/* --- ZERO-WASTE POINT STATISTICS (Admin/BK) --- */}
        {(userRole === UserRole.ADMIN ||
          userRole === UserRole.DEVELOPER ||
          userRole === UserRole.KEPALA_MADRASAH ||
          userRole === UserRole.GURU_BK) && (
          <motion.div
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => onNavigate(ViewState.POINTS)}
            className="w-[340px] shrink-0 snap-start h-[215px] bg-white dark:bg-[#0B1121] border border-slate-200/50 dark:border-slate-800 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-soft p-6 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-center relative z-10 shrink-0 mb-4">
              <div>
                <h3 className="text-[11px] font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                  Kedisiplinan & Prestasi
                </h3>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Monitoring Poin</p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse block"></span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 relative z-10 text-center divide-x divide-slate-100 dark:divide-slate-800">
              <div className="px-1">
                <p className="text-[7px] font-bold text-slate-400 tracking-wide uppercase mb-2 whitespace-nowrap">
                  Total Siswa
                </p>
                <span className="text-[14px] font-bold text-slate-900 dark:text-white block">
                  {stats.totalStudents || 0}
                </span>
              </div>
              <div className="px-1">
                <p className="text-[7px] font-bold text-rose-500 tracking-wide uppercase mb-2 whitespace-nowrap">
                  Melanggar
                </p>
                <span className="text-[14px] font-bold text-rose-500 block">
                  {totalStudentsWithMisconduct || 0}
                </span>
              </div>
              <div className="px-1">
                <p className="text-[7px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase mb-2 whitespace-nowrap">
                  Poin Negatif
                </p>
                <span className="text-[14px] font-bold text-slate-900 dark:text-white block">
                  {stats.totalMisconductPointsCount || 0}
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[6px] font-bold text-emerald-400 tracking-wide uppercase mb-1 whitespace-nowrap">
                  Prestasi
                </p>
                <span className="text-[15px] font-bold text-white  block">
                  {stats.totalAchievementPointsCount || 0}
                </span>
              </div>
            </div>
            <div className="space-y-1 relative z-10 mb-1">
              <div className="flex justify-between text-[7.5px] font-bold tracking-wide leading-none">
                <span className="text-emerald-400 uppercase">
                  PRESTASI: {pointsLogic.achievementPercent}%
                </span>
                <span className="text-rose-400 uppercase">
                  PELANGGARAN: {pointsLogic.misconductPercent}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${pointsLogic.achievementPercent}%` }}
                  className="h-full bg-emerald-500 transition-all duration-500"
                />
                <div
                  style={{ width: `${pointsLogic.misconductPercent}%` }}
                  className="h-full bg-rose-500 transition-all duration-500"
                />
              </div>
            </div>
            <div className="flex justify-end items-center relative z-10 pt-3 border-t border-white/5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(ViewState.POINTS);
                }}
                className="px-4 py-1.5 bg-rose-500 text-white text-[9px] font-bold tracking-wide rounded-2xl hover:bg-rose-600 transition-colors shadow-soft shadow-rose-600/20"
              >
                Tampilkan →
              </button>
            </div>
          </motion.div>
        )}

        {/* --- ZERO-WASTE POINT STATISTICS (Admin/BK) --- */}
        {isStaff && sessionSummary && sessionSummary.length > 0 && (
          <SessionCardStack
            sessionSummary={sessionSummary}
            onSelectSessionDrill={onSelectSessionDrill}
          />
        )}

        {/* --- OPERATIONAL STATUS CARD (TENANT DATA) --- */}
        {tenantData && (
          <div className="w-[340px] shrink-0 snap-start h-[215px] bg-[#0F172A] border border-blue-500/10 rounded-3xl relative overflow-hidden group shadow-float p-6 flex flex-col justify-between">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10">
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-blue-400 opacity-60">
                Status Sesi Masuk
              </h3>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-4xl font-bold text-white">
                  {tenantData.konfigurasiSesi?.jadwal?.masuk || '--:--'}
                </span>
                <span className="text-xs font-bold mb-1.5 text-blue-300 opacity-80">WITA</span>
              </div>
            </div>

            <div className="relative z-10 space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    Toleransi
                  </span>
                  <span className="text-[10px] font-bold text-white">
                    {tenantData.konfigurasiSesi?.toleransiKeterlambatan || 0} Menit
                  </span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[60%]" />
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">
                  Sistem Aktif & Terpantau
                </span>
              </div>
            </div>
          </div>
        )}

        {/* --- NEWS CARDS --- */}
        {activeNews.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -5 }}
            onClick={() => onSelectNews(item)}
            className="w-[340px] shrink-0 snap-start h-[215px] bg-[#0F172A] border border-indigo-500/10 rounded-3xl relative overflow-hidden group cursor-pointer flex flex-col justify-between p-5 shadow-float"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex justify-between items-center relative z-10 shrink-0">
              <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8.5px] font-bold uppercase rounded-[0.5rem] tracking-wider border border-indigo-500/20">
                {item.category || 'Berita'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 font-mono">
                {item.date ? (item.date.includes('T') ? item.date.split('T')[0] : item.date) : ''}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center my-2.5 relative z-10">
              <h4 className="text-[12.5px] font-bold text-white uppercase tracking-tight line-clamp-2 leading-snug">
                {item.title}
              </h4>
              {item.summary && (
                <p className="text-[9.5px] text-slate-400 font-bold mt-1 line-clamp-1 leading-snug italic lowercase">
                  {item.summary}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center relative z-10 pt-3 border-t border-white/5 text-[7px] font-bold tracking-wide text-indigo-400 uppercase">
              <span>Berita & Pengumuman</span>
              <span>Detail Hubungan →</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Carousel Navigation Buttons Overlay */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between px-2 pointer-events-none z-20 transition-opacity">
        <button
          onClick={() => scrollCarousel('left')}
          className="pointer-events-auto p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full shadow-xl border border-slate-200/50 dark:border-slate-800/50 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform active:scale-90"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => scrollCarousel('right')}
          className="pointer-events-auto p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full shadow-xl border border-slate-200/50 dark:border-slate-800/50 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform active:scale-90"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(DashboardCards);
