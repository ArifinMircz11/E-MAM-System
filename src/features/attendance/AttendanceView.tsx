/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Consolidated Attendance View (Staff & Personal)
 */

import React, { useState, useEffect, useMemo, lazy } from 'react';
import { AttendanceSummaryService } from '@/features/attendance/services/AttendanceSummaryService';
import { useVirtualTable } from '@/hooks/useVirtualTable';
import { writeJSONToExcel } from '@/utils/excelHelper';
import Layout from '@/layouts/Layout';
import { ReportStudentSummaryCard } from '@/features/students/components/ReportStudentSummaryCard';
import {
  CalendarIcon,
  Loader2,
  ArrowDownTrayIcon,
  WhatsAppIcon,
  Squares2x2Icon,
  ShieldCheckIcon,
} from '@/shared/Icons';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '@/services/authService';
import { getClasses } from '@/services/classService';
import { getStudentData, getStudentsByClass } from '@/services/studentService';
import {
  getAttendanceByClassAndMonth,
  getAttendanceByClassAndDate,
} from '@/features/attendance/services/attendanceService';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';
import type { ViewState, AttendanceRecord, Student } from '@/types';
import { UserRole } from '@/types';
import { useStudentStore } from '@/stores/studentStore';
import { useSystemStore } from '@/stores/systemStore';
import { useAuthStore } from '@/stores/authStore';
import { mapRawAttendanceToRecord, buildMonthlyGridDays } from '@/utils/attendanceCalculations';
import { useStudentAttendance } from '@/hooks/useStudentAttendance';

// Refactored Components & Hooks
import { Button } from '@/components/ui/Button';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { AttendanceStatsCards } from './components/Attendance/AttendanceStatsCards';
import { AttendanceExceptionTracker } from './components/Attendance/AttendanceExceptionTracker';
import { AttendanceDetailedFeed } from './components/Attendance/AttendanceDetailedFeed';
import { AttendanceStaffFilters } from './components/Attendance/AttendanceStaffFilters';

// Lazy load Recharts
const LazyAttendanceChart = lazy(() =>
  import('recharts').then((module) => {
    const CustomPieChart = ({ data }: { data: any[] }) => (
      <module.ResponsiveContainer width="100%" height="100%">
        <module.PieChart>
          <module.Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={28}
            outerRadius={36}
            paddingAngle={1}
            dataKey="value"
          >
            {data.map((entry: any, index: number) => (
              <module.Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </module.Pie>
          <module.Tooltip
            contentStyle={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            }}
          />
        </module.PieChart>
      </module.ResponsiveContainer>
    );
    return { default: CustomPieChart };
  }),
);

interface AttendanceViewProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
  onNavigate: (view: ViewState) => void;
  userRole: UserRole;
  studentsId?: string; // Force individual view if passed
}

const SessionStatus = ({ label, timeRaw }: { label: string; timeRaw: string | null }) => {
  const isFilled =
    !!timeRaw && timeRaw !== '--:--' && timeRaw !== 'TS' && timeRaw !== 'TS (Tidak Scan)';
  const isHaid =
    timeRaw?.toLowerCase().includes('(haid)') || timeRaw?.toLowerCase().includes('haid');
  const isTs = timeRaw?.toLowerCase() === 'ts' || timeRaw === 'TS (Tidak Scan)';
  const isLate = timeRaw?.includes('[T]');
  const isPC = timeRaw?.includes('[PC]');

  // Simple helper inside
  const parseTimeParts = (val: string | null) => {
    if (!val || val === '--:--' || val === 'TS' || val === 'TS (Tidak Scan)')
      return { time: '--:--', meta: null };
    const parts = String(val).split(' | ');
    const timePart = parts[0].substring(0, 5);
    const metaPart = parts[1] || null;
    return { time: timePart, meta: metaPart };
  };

  const { time, meta } = parseTimeParts(timeRaw);

  let textColor = 'text-slate-300 dark:text-slate-600';
  let bgColor = 'bg-transparent';

  if (isFilled) {
    if (isLate) {
      textColor = 'text-amber-500';
      bgColor = 'bg-amber-50 dark:bg-amber-950/20';
    } else if (isPC) {
      textColor = 'text-orange-500';
      bgColor = 'bg-orange-50 dark:bg-orange-950/20';
    } else if (isHaid || meta === 'H') {
      textColor = 'text-pink-500';
      bgColor = 'bg-pink-50 dark:bg-pink-950/20';
    } else {
      textColor = 'text-emerald-500';
      bgColor = 'bg-emerald-50 dark:bg-emerald-950/20';
    }
  } else if (isTs) {
    textColor = 'text-rose-500';
    bgColor = 'bg-rose-50 dark:bg-rose-950/20';
  }

  return (
    <div
      className={`flex flex-col items-center flex-1 py-1 rounded-lg transition-colors ${bgColor}`}
    >
      <span className="text-[7px] font-bold text-slate-400 mb-1 tracking-wide uppercase">
        {label}
      </span>
      <div
        className={`text-[10px] font-mono font-bold flex items-center justify-center gap-0.5 ${textColor}`}
      >
        {isTs ? (
          <span className="text-[9px]">Ts</span>
        ) : (
          <>
            <span>{time}</span>
            {meta && <span className="text-[8px] font-bold opacity-50">| {meta}</span>}
          </>
        )}
      </div>
    </div>
  );
};

const AttendanceView: React.FC<AttendanceViewProps> = ({
  onBack,
  onOpenSidebar,
  onNavigate,
  userRole,
  studentsId,
}) => {
  const madrasahInfo = useSystemStore((state) => state.madrasahInfo);
  const globalClass = useStudentStore((state) => state.selectedClass);
  const students = useStudentStore((state) => state.students);
  const fetchStudentsStore = useStudentStore((state) => state.fetchStudents);
  const studentsIdFromStore = useAuthStore((state) => state.user?.studentsId);
  const idUnikFromStore = useAuthStore((state) => state.user?.idUnik);

  // Submission Logic
  const { isSubmitting: isExporting, execute: executeExport } = useAsyncAction();

  // Determines if we are in "Management" mode or "Personal" mode
  const isStaff = [
    UserRole.ADMIN,
    UserRole.DEVELOPER,
    UserRole.GURU,
    UserRole.WALI_KELAS,
    UserRole.STAF,
    UserRole.GTK,
    UserRole.GURU_BK,
    UserRole.KESISWAAN,
  ].includes(userRole);
  const isStudentOnly = [UserRole.SISWA, UserRole.KETUA_KELAS, UserRole.ORANG_TUA].includes(
    userRole,
  );

  // Primary State
  const effectiveStudentId = studentsId || studentsIdFromStore || idUnikFromStore;
  const [viewMode, setViewMode] = useState<'History' | 'Personal'>(
    effectiveStudentId ? 'Personal' : isStaff ? 'History' : 'Personal',
  );
  const [drillDownStudentId, setDrillDownStudentId] = useState<string | null>(
    studentsId || (isStudentOnly && effectiveStudentId ? effectiveStudentId : null),
  );
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Filters for History View
  const [viewType, setViewType] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (globalClass?.name) return globalClass.name;
    return localStorage.getItem('emam_filter_att_class') || '10 A';
  });
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [attendanceRecordsHistory, setAttendanceRecordsHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Personal Hook Usage
  // We only use the hook when drillDownStudentId is set
  const {
    attendanceRecords: personalAtt,
    stats: personalStats,
    loading: loadingPersonal,
    summary: personalSummary,
    pointRecords: personalPoints,
  } = useStudentAttendance(drillDownStudentId || '');

  useEffect(() => {
    if (isStudentOnly && effectiveStudentId && drillDownStudentId !== effectiveStudentId) {
      setDrillDownStudentId(effectiveStudentId);
      setViewMode('Personal');
    }
  }, [isStudentOnly, effectiveStudentId, drillDownStudentId]);

  useEffect(() => {
    getClasses()
      .then((s) => {
        const uniqueNames = Array.from(new Set(s.map((d) => d.name).filter(Boolean))).sort();
        setClasses(uniqueNames);
      })
      .catch((e) => handleFirestoreError(e, OperationType.LIST, 'classes'));
  }, []);

  useEffect(() => {
    if (drillDownStudentId) {
      getStudentData(drillDownStudentId).then(setSelectedStudent);
    } else {
      setSelectedStudent(null);
    }
  }, [drillDownStudentId]);

  const fetchDataHistory = async () => {
    if (!isStaff || viewMode !== 'History' || drillDownStudentId !== null) return;
    setLoadingHistory(true);
    try {
      const targetClass = selectedClass === 'All' ? '10 A' : selectedClass;

      // Student list for attendance grid
      const studentSnap = await getStudentsByClass(targetClass);
      setAllStudents(studentSnap.map((s) => ({ ...s, id: s.id }) as Student));

      let mapped: AttendanceRecord[] = [];
      if (viewType === 'monthly') {
        mapped = await getAttendanceByClassAndMonth(targetClass, selectedMonth);
      } else {
        mapped = await getAttendanceByClassAndDate(targetClass, selectedDate);
      }

      setAttendanceRecordsHistory(mapped);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data histori.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDataHistory();
  }, [selectedDate, selectedMonth, selectedClass, viewType, viewMode, drillDownStudentId]);

  const displayDataHistory = useMemo(() => {
    const attMap = new Map<string, AttendanceRecord>(
      attendanceRecordsHistory.map((r) => [r.studentsId || '', r] as any),
    );
    return allStudents
      .map((student) => {
        const record = attMap.get(student.studentsId!);
        const mapped = record ? mapRawAttendanceToRecord(record) : null;
        return {
          ...((mapped || {
            id: `${student.studentsId}_${selectedDate}`,
            studentsId: student.studentsId!,
            name: student.namaLengkap,
            class: student.tingkatRombel,
            date: selectedDate,
            sessions: {
              masuk: undefined,
              duha: undefined,
              zuhur: undefined,
              ashar: undefined,
              pulang: undefined,
            },
            statusGlobal: 'Alpha',
            totalPointsAdded: 10,
            totalPoinHariIni: 10,
          }) as object),
          status: mapped?.statusGlobal || 'Alpha',
          studentPhone: student.noHp || student.noTelepon,
        } as any;
      })
      .filter((r) => {
        const matchesStatus = filterStatus === 'All' || r.statusGlobal === filterStatus;
        const matchesSearch =
          searchQuery === '' || r.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      });
  }, [allStudents, attendanceRecordsHistory, selectedDate, filterStatus, searchQuery]);

  const {
    containerRef: historyContainerRef,
    startIndex: historyStartIndex,
    endIndex: historyEndIndex,
    startOffset: historyStartOffset,
    endOffset: historyEndOffset,
  } = useVirtualTable({
    itemsCount: displayDataHistory.length,
    estimateRowHeight: 48,
    overscan: 15,
  });

  const handleExportPDF = async () => {
    if (!selectedStudent) return;
    await executeExport(
      async () => {
        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const docPdf = new jsPDF();
        const pageWidth = docPdf.internal.pageSize.getWidth();
        const monthStr = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: localeID });

        docPdf.setFontSize(14);
        docPdf.setFont('helvetica', 'bold');
        docPdf.text('LAPORAN BULANAN PRESENSI ELEKTRONIK SISWA', pageWidth / 2, 15, {
          align: 'center',
        });

        docPdf.setFontSize(9);
        docPdf.text(`NAMA SISWA  : ${selectedStudent.namaLengkap.toUpperCase()}`, 14, 34);
        docPdf.text(
          `NISN / ID   : ${selectedStudent.nisn || '-'} / ${selectedStudent.idUnik}`,
          14,
          40,
        );
        docPdf.text(`KELAS       : ${selectedStudent.tingkatRombel || '-'}`, 14, 46);

        const { daysList } = buildMonthlyGridDays(selectedMonth, personalAtt);

        const tableRows = daysList.map((d, i) => [
          i + 1,
          `${d.dayName}, ${d.formattedDate}`,
          d.statusGlobal,
          d.sessions.masuk,
          d.sessions.duha,
          d.sessions.zuhur,
          d.sessions.ashar,
          d.sessions.pulang,
        ]);

        autoTable(docPdf, {
          head: [['NO', 'HARI & TANGGAL', 'STATUS', 'MASUK', 'DUHA', 'ZUHUR', 'ASHAR', 'PULANG']],
          body: tableRows,
          startY: 53,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 8 },
        });

        docPdf.save(`Laporan_Presensi_${selectedStudent.idUnik}_${selectedMonth}.pdf`);
      },
      { successMessage: 'PDF berhasil diunduh.' },
    );
  };

  const handleExportExcel = async () => {
    if (displayDataHistory.length === 0) {
      toast.error('Tidak ada data kehadiran untuk diexport.');
      return;
    }
    await executeExport(
      async () => {
        const dataToExport = displayDataHistory.map((r, i) => ({
          No: i + 1,
          'ID Siswa': r.studentsId || '',
          'Nama Lengkap': r.name || '',
          Kelas: r.class || selectedClass || '',
          Tanggal: selectedDate,
          Masuk: r.sessions?.masuk?.time || '-',
          Duha: r.sessions?.duha?.time || '-',
          Zuhur: r.sessions?.zuhur?.time || '-',
          Ashar: r.sessions?.ashar?.time || '-',
          Pulang: r.sessions?.pulang?.time || '-',
          Status: r.statusGlobal || 'Alpha',
        }));
        await writeJSONToExcel(
          dataToExport,
          `Rekap_Presensi_Kelas_${selectedClass}_${selectedDate}.xlsx`,
          'Rekap Presensi'
        );
      },
      { successMessage: 'Data kehadiran berhasil diexport ke Excel.' },
    );
  };

  return (
    <Layout
      title=""
      subtitle={drillDownStudentId ? selectedStudent?.namaLengkap : ''}
      onBack={drillDownStudentId && !isStudentOnly ? () => setDrillDownStudentId(null) : onBack}
      onOpenSidebar={onOpenSidebar}
      withBottomNav={true}
      actions={
        <div className="flex items-center gap-2">
          {drillDownStudentId && (
            <Button
              onClick={handleExportPDF}
              isLoading={isExporting}
              variant="primary"
              size="sm"
              leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
            >
              Export PDF
            </Button>
          )}
          {isStaff && !drillDownStudentId && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportExcel}
                isLoading={isExporting}
                variant="primary"
                size="sm"
                leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
              >
                Export Excel
              </Button>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewType('daily')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-wide transition-all ${viewType === 'daily' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-400'}`}
                >
                  HARI
                </button>
                <button
                  onClick={() => setViewType('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-wide transition-all ${viewType === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-400'}`}
                >
                  BULAN
                </button>
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="p-4 max-w-4xl mx-auto space-y-6 pb-24">
        {/* RBAC ROLE ACCESS BADGE & INFORMATION BANNER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isStudentOnly ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50'}`}>
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isStudentOnly ? 'Mode Akses: Presensi Personal Siswa' : 'Mode Akses: Supervisi Presensi Rombel / Madrasah'}
                </span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isStudentOnly ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'}`}>
                  {userRole.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isStudentOnly
                  ? 'Izin RBAC Aktif: Anda hanya diperkenankan melihat rekapitulasi data kehadiran pribadi Anda secara mandiri.'
                  : 'Izin RBAC Aktif: Anda memiliki wewenang memantau, memverifikasi, dan mengunduh rekapitulasi kehadiran kelas.'}
              </p>
            </div>
          </div>
        </div>

        {/* NOTICE IF STUDENT ACCOUNT WITHOUT STUDENT ID */}
        {isStudentOnly && !drillDownStudentId && (
          <div className="p-8 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-center space-y-2">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Profil ID Siswa Belum Ditemukan
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 max-w-md mx-auto">
              Akun Anda terdaftar sebagai Siswa/Orang Tua, namun NISN/ID Unik belum terhubung pada sesi profil Anda. Silakan hubungi Wali Kelas atau Admin Madrasah untuk verifikasi data.
            </p>
          </div>
        )}

        {/* TOOLBAR FOR STAFF */}
        {isStaff && !drillDownStudentId && (
          <AttendanceStaffFilters
            viewType={viewType}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            classes={classes}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {/* STAFF DRIER-DOWN / STUDENT PERSONAL VIEW */}
        {drillDownStudentId && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Header Profil Siswa (Style Reports.tsx) */}
            <ReportStudentSummaryCard student={selectedStudent || {}} />

            {/* 2. Statistik Ringkasan (Style DrillDownStatsCards) */}
            <AttendanceStatsCards stats={personalStats} />

            {/* 3. Exception Tracker / Anomalies Section */}
            <AttendanceExceptionTracker records={personalAtt} />

            {/* Month Selector for Personal View */}
            <div className="max-w-xs">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Pilih Periode Report
              </h4>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-xs font-bold uppercase tracking-wide shadow-sm focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* 5. Chronological Detailed Daily Feed (Matched with Reports.tsx) */}
            <AttendanceDetailedFeed records={personalAtt} selectedMonth={selectedMonth} />
          </div>
        )}

        {/* STAFF HISTORY VIEW - GRID OF STUDENTS */}
        {isStaff && !drillDownStudentId && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pl-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                  Monitoring Harian{' '}
                  {selectedClass !== 'All' ? `Kelas ${selectedClass}` : 'Seluruh Siswa'}
                </h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Total: {displayDataHistory.length} Siswa
                </span>
              </div>
              <div className="flex gap-2">
                <select
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">Semua Status</option>
                  <option value="Hadir">Hadir (H)</option>
                  <option value="Terlambat">Terlambat (T)</option>
                  <option value="Izin">Izin (I)</option>
                  <option value="Sakit">Sakit (S)</option>
                  <option value="Haid">Haid</option>
                  <option value="Alpha">Alpha (A)</option>
                </select>
              </div>
            </div>

            {loadingHistory ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 opacity-20" />
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div
                    ref={historyContainerRef}
                    className="overflow-auto max-h-[600px] custom-scrollbar"
                  >
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide w-12 text-center">
                            NO
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            ID SISWA
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            NAMA LENGKAP
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            KELAS
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            MASUK
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            DUHA
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            ZUHUR
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            ASHAR
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            PULANG
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold text-indigo-500 uppercase tracking-wide text-center">
                            KET
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold text-rose-500 uppercase tracking-wide text-center">
                            POIN
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {historyStartOffset > 0 && (
                          <tr style={{ height: `${historyStartOffset}px` }}>
                            <td
                              colSpan={11}
                              style={{ height: `${historyStartOffset}px`, padding: 0 }}
                            />
                          </tr>
                        )}
                        {displayDataHistory
                          .slice(historyStartIndex, historyEndIndex)
                          .map((r, sliceIdx) => {
                            const globalIdx = historyStartIndex + sliceIdx;
                            const renderCell = (
                              sessionKey: 'masuk' | 'duha' | 'zuhur' | 'ashar' | 'pulang',
                            ) => {
                              const s = r.sessions?.[sessionKey];
                              const { text, color } =
                                AttendanceSummaryService.getFormattedSession(s);
                              return <span className={color}>{text}</span>;
                            };

                            let ketStr = r.statusGlobal?.toUpperCase().charAt(0) || 'A';
                            if (r.statusGlobal === 'Terlambat') ketStr = 'T';
                            if (r.statusGlobal === 'Alpha') ketStr = 'A';
                            if (r.statusGlobal === 'Hadir') ketStr = 'H';
                            if (r.statusGlobal === 'Izin') ketStr = 'I';
                            if (r.statusGlobal === 'Sakit') ketStr = 'S';

                            const pointsVal = (r as any).totalPoinHariIni ?? (r as any).totalPointsAdded ?? (r as any).poin ?? 0;

                            return (
                              <tr
                                key={r.id || globalIdx}
                                onClick={() => setDrillDownStudentId(r.studentsId)}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                              >
                                <td className="py-3 px-4 text-xs font-bold text-slate-400 text-center">
                                  {globalIdx + 1}
                                </td>
                                <td className="py-3 px-4 text-xs font-bold text-slate-500 font-mono">
                                  {r.studentsId}
                                </td>
                                <td className="py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors uppercase whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="truncate">{r.name}</span>
                                    {r.studentPhone && (
                                      <a
                                        href={`https://wa.me/${r.studentPhone.replace(/\D/g, '').replace(/^0/, '62')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 text-emerald-500 hover:text-emerald-400 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <WhatsAppIcon className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-xs font-bold text-slate-400 whitespace-nowrap">
                                  {(r as any).class || '-'}
                                </td>
                                <td className="py-3 px-4 text-xs">{renderCell('masuk')}</td>
                                <td className="py-3 px-4 text-xs">{renderCell('duha')}</td>
                                <td className="py-3 px-4 text-xs">{renderCell('zuhur')}</td>
                                <td className="py-3 px-4 text-xs">{renderCell('ashar')}</td>
                                <td className="py-3 px-4 text-xs">{renderCell('pulang')}</td>
                                <td className="py-3 px-4 text-xs text-center">
                                  <span
                                    className={`inline-flex w-7 h-7 items-center justify-center rounded-lg font-bold text-[10px] shadow-2xs ${
                                      ketStr === 'H'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50'
                                        : ketStr === 'T'
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50'
                                          : ketStr === 'S' || ketStr === 'I'
                                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200/50 dark:border-sky-900/50'
                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50'
                                    }`}
                                  >
                                    {ketStr}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-xs font-bold text-center">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                      pointsVal > 0
                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    {pointsVal}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        {historyEndOffset > 0 && (
                          <tr style={{ height: `${historyEndOffset}px` }}>
                            <td
                              colSpan={11}
                              style={{ height: `${historyEndOffset}px`, padding: 0 }}
                            />
                          </tr>
                        )}
                        {displayDataHistory.length === 0 && (
                          <tr>
                            <td
                              colSpan={11}
                              className="py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-wide"
                            >
                              Data tidak ditemukan
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* SUMMARY REKAPITULASI (Only on Daily View) */}
                  {viewType === 'daily' && displayDataHistory.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-6">
                      <h4 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Rekapitulasi Indikator Per Sesi Rombel Aktif (Summary Counters)
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {['masuk', 'duha', 'zuhur', 'ashar', 'pulang'].map((sesi) => {
                          let tCount = 0;
                          let tsCount = 0;
                          let siCount = 0;
                          let haidCount = 0;
                          let pcCount = 0;

                          displayDataHistory.forEach((r) => {
                            const s = r.sessions?.[sesi as keyof typeof r.sessions];
                            const time = s?.time || 'Ts';
                            const status = s?.status;

                            if (time === 'Ts' && status !== 'haid') tsCount++;
                            if (time === 'Ts' && status === 'haid') haidCount++;
                            if (time !== 'Ts' && status === 'haid') haidCount++;

                            if (sesi === 'masuk') {
                              if (r.statusGlobal === 'Terlambat') tCount++;
                              if (r.statusGlobal === 'Sakit' || r.statusGlobal === 'Izin')
                                siCount++;
                            }

                            if (sesi === 'pulang' && time.includes('Pc')) pcCount++;
                          });

                          return (
                            <div
                              key={sesi}
                              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-3 shadow-sm"
                            >
                              <div className="text-[9px] font-bold uppercase tracking-wide text-indigo-500 mb-2 border-b border-slate-100 dark:border-slate-700/50 pb-2">
                                Sesi {sesi}
                              </div>
                              <div className="space-y-1">
                                {sesi === 'masuk' && tCount > 0 && (
                                  <div className="text-[10px] font-bold text-amber-600 flex justify-between">
                                    <span>Terlambat (T)</span>
                                    <span>{tCount} Siswa</span>
                                  </div>
                                )}
                                {tsCount > 0 && (
                                  <div className="text-[10px] font-bold text-rose-600 flex justify-between">
                                    <span>Belum Scan (Ts)</span>
                                    <span>{tsCount} Siswa</span>
                                  </div>
                                )}
                                {sesi === 'masuk' && siCount > 0 && (
                                  <div className="text-[10px] font-bold text-blue-600 flex justify-between">
                                    <span>Sakit/Izin (S/I)</span>
                                    <span>{siCount} Siswa</span>
                                  </div>
                                )}
                                {haidCount > 0 &&
                                  (sesi === 'duha' || sesi === 'zuhur' || sesi === 'ashar') && (
                                    <div className="text-[10px] font-bold text-pink-500 flex justify-between">
                                      <span>Validasi Khusus (Haid)</span>
                                      <span>{haidCount} Siswi</span>
                                    </div>
                                  )}
                                {sesi === 'pulang' && pcCount > 0 && (
                                  <div className="text-[10px] font-bold text-orange-500 flex justify-between">
                                    <span>Pulang Cepat (Pc)</span>
                                    <span>{pcCount} Siswa</span>
                                  </div>
                                )}
                                {tCount === 0 &&
                                  tsCount === 0 &&
                                  siCount === 0 &&
                                  (haidCount === 0 || sesi === 'masuk' || sesi === 'pulang') &&
                                  pcCount === 0 && (
                                    <div className="text-[10px] font-bold text-emerald-500">
                                      All Clear
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceView;
