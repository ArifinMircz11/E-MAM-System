import React from 'react';
import Layout from '@/layouts/Layout';
import { useReports } from '@/features/reports/hooks/useReports';
import { ReportHeader } from './ReportHeader';
import { SummaryCards } from './SummaryCards';
import { DailyTable } from './DailyTable';
import { MonthlyTable } from './MonthlyTable';
import { PointsTable } from './PointsTable';
import { TeacherTable } from './TeacherTable';
import { ReportStudentSummaryCard } from './ReportStudentSummaryCard';
import { UserRole } from '@/types';
import { Loader2, ArrowLeft } from 'lucide-react';

interface ReportsProps {
  onBack?: () => void;
  onOpenSidebar?: () => void;
  onNavigate: (view: string, params?: any) => void;
  userRole: UserRole;
  studentsId?: string;
}

const Reports: React.FC<ReportsProps> = ({
  onBack,
  onOpenSidebar,
  onNavigate,
  userRole,
  studentsId,
}) => {
  const {
    reportType,
    setReportType,
    selectedMonth,
    setSelectedMonth,
    selectedDate,
    setSelectedDate,
    selectedClassFilter,
    setSelectedClassFilter,
    filterNama,
    setFilterNama,
    currentPage,
    setCurrentPage,
    loading,
    studentsInClass,
    classes,
    attendanceRecords,
    pointsRecords,
    walasClassLocked,
    selectedStudent,
    setSelectedStudent,
    studentMonthlyAtt,
    loadingStudentAtt,
    paginatedData,
    totalPages,
  } = useReports(studentsId);

  const isStaff = [
    UserRole.ADMIN,
    UserRole.DEVELOPER,
    UserRole.KEPALA_MADRASAH,
    UserRole.WAKAMAD,
    UserRole.GURU,
    UserRole.WALI_KELAS,
  ].includes(userRole);

  // If a student is selected for detail view
  if (selectedStudent) {
    return (
      <Layout
        onBack={() => setSelectedStudent(null)}
        title="Detail Kehadiran"
        onNavigate={onNavigate}
      >
        <div className="flex flex-col h-full space-y-6 pb-24 px-4 overflow-auto">
          <button
            onClick={() => setSelectedStudent(null)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar
          </button>

          <ReportStudentSummaryCard student={selectedStudent} />

          <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                Histori Presensi
              </h3>
            </div>

            {loadingStudentAtt ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 opacity-20" />
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                  Memuat...
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {studentMonthlyAtt.map((r, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                        {r.date}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                        {r.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[8px] font-bold px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        {r.masuk || '--:--'}
                      </span>
                      <span className="text-[8px] font-bold px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        {r.pulang || '--:--'}
                      </span>
                    </div>
                  </div>
                ))}
                {studentMonthlyAtt.length === 0 && (
                  <div className="py-20 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Tidak ada data.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      onBack={onBack}
      onOpenSidebar={onOpenSidebar}
      title="Laporan & Analitik"
      onNavigate={onNavigate}
    >
      <div className="flex flex-col h-full space-y-6 pb-24">
        <ReportHeader
          reportType={reportType}
          setReportType={setReportType}
          selectedClassFilter={selectedClassFilter}
          setSelectedClassFilter={setSelectedClassFilter}
          classes={classes}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          filterNama={filterNama}
          setFilterNama={setFilterNama}
          isStaff={isStaff}
          walasClassLocked={walasClassLocked}
        />

        <SummaryCards
          attendanceRecords={attendanceRecords}
          totalStudents={studentsInClass.length}
        />

        <div className="flex-1 bg-white dark:bg-[#0B1121] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col mx-4">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-50">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Memuat Data...
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {reportType === 'daily' && (
                <DailyTable
                  paginatedData={paginatedData}
                  attendanceRecords={attendanceRecords}
                  onDetailClick={(s) => setSelectedStudent(s)}
                />
              )}
              {reportType === 'monthly' && (
                <MonthlyTable
                  paginatedData={paginatedData}
                  onDetailClick={(s) => setSelectedStudent(s)}
                />
              )}
              {reportType === 'points' && (
                <PointsTable
                  paginatedData={paginatedData}
                  onDetailClick={(s) => setSelectedStudent(s)}
                />
              )}
              {reportType === 'teacher' && <TeacherTable paginatedData={paginatedData} />}
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-6 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wide disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-[10px] font-bold text-slate-400">
                HALAMAN {currentPage} DARI {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-6 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wide disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Simulator & Debugging Tools - Moved from Dashboard */}
        {/* Simulator is now in ReportHeader */}
      </div>
    </Layout>
  );
};

export default Reports;
