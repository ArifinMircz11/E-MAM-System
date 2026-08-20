/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useMemo } from 'react';
import type { UserRole} from '@/types';
import { ROLE_GROUPS } from '@/types';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';
import { toast } from 'sonner';
import { writeJSONToExcel } from '@/utils/excelHelper';
import Layout from '@/layouts/Layout';
import {
  ClipboardDocumentListIcon,
  Loader2,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  CalendarIcon,
  FileSpreadsheet,
  FileText,
  ArrowPathIcon,
  ChartBarIcon,
  TrashIcon,
  ClockIcon,
} from '@/shared/Icons';
import TeacherClassAttendance from './TeacherClassAttendance';
import { TeacherAttendanceDeepDive } from '@/features/dashboard/components/TeacherAttendanceDeepDive';
import { motion } from 'framer-motion';
import { useTeacherAttendanceRecords } from '@/hooks/useTeacherAttendanceRecords';

const parseSafeDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  const d = new Date(timestamp);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return null;
};

const TeacherAttendanceView: React.FC<{ onBack: () => void; userRole: UserRole }> = ({
  onBack,
  userRole,
}) => {
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('all'); // 'all', 'today', 'week'
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  const isManagement = useMemo(() => ROLE_GROUPS.MANAGEMENT.includes(userRole), [userRole]);

  const [activeTab, setActiveTab] = useState<'absen' | 'laporan'>(() => {
    return isManagement ? 'laporan' : 'absen';
  });

  const { data, classes, loading, fetchData, handleDeleteRecord } = useTeacherAttendanceRecords(
    selectedClass,
    isManagement,
  );

  const displayData = useMemo(() => {
    let filtered = data;
    if (filterName) {
      const lower = filterName.toLowerCase();
      filtered = filtered.filter((d) => (d.teacherName || '').toLowerCase().includes(lower));
    }

    if (filterDate === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter((d) => {
        const dateObj = parseSafeDate(d.timestamp);
        return dateObj ? dateObj.toDateString() === today : false;
      });
    } else if (filterDate === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter((d) => {
        const dateObj = parseSafeDate(d.timestamp);
        return dateObj ? dateObj >= oneWeekAgo : false;
      });
    }
    return filtered;
  }, [data, filterName, filterDate]);

  const stats = useMemo(() => {
    return {
      total: displayData.length,
      valid: displayData.filter((d) => d.status === 'VALID').length,
      invalid: displayData.filter((d) => d.status === 'INVALID').length,
      performance:
        displayData.length > 0
          ? Math.round(
              (displayData.filter((d) => d.status === 'VALID').length / displayData.length) * 100,
            )
          : 0,
    };
  }, [displayData]);

  const handleExportExcel = async () => {
    if (displayData.length === 0) return;
    const dataToExport = displayData.map((r, i) => {
      const dateObj = parseSafeDate(r.timestamp);
      const timeStr = dateObj ? format(dateObj, 'dd/MM/yyyy HH:mm') : '-';
      return {
        No: i + 1,
        'Nama Guru': r.teacherName,
        Kelas: r.className,
        Waktu: timeStr,
        'Jarak (m)': r.distance,
        Status: r.status,
        Device: r.deviceInfo || '-',
      };
    });
    await writeJSONToExcel(
      dataToExport,
      `Absensi_Guru_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      'Absensi Guru'
    );
  };

  const handleExportPDF = async () => {
    if (displayData.length === 0) return;
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Laporan Absensi Guru (Lensa Presensi)', 14, 15);
    doc.setFontSize(10);
    doc.text(`Waktu: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: localeID })}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['No', 'Guru', 'Kelas', 'Waktu', 'Jarak', 'Status']],
      body: displayData.map((r, i) => {
        const dateObj = parseSafeDate(r.timestamp);
        const timeStr = dateObj ? format(dateObj, 'dd/MM/yyyy HH:mm') : '-';
        return [i + 1, r.teacherName, r.className, timeStr, `${r.distance}m`, r.status];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [44, 62, 80] },
    });
    doc.save(`Absensi_Guru_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF diunduh');
  };

  return (
    <Layout
      title="Absensi Guru"
      subtitle="Rekam Jejak Lensa Presensi"
      icon={ClipboardDocumentListIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-6 pb-24 space-y-6">
        {/* Tab Switcher */}
        <div className="flex p-2 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] w-full max-w-sm mx-auto border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('absen')}
            className={`flex-1 py-3 px-4 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-wide transition-all relative ${
              activeTab === 'absen' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <ClockIcon className="w-3.5 h-3.5" />
              Absen Kelas
            </span>
            {activeTab === 'absen' && (
              <motion.div
                layoutId="activeTeacherAttendanceTab"
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex-1 py-3 px-4 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-wide transition-all relative ${
              activeTab === 'laporan' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <ChartBarIcon className="w-3.5 h-3.5" />
              Laporan
            </span>
            {activeTab === 'laporan' && (
              <motion.div
                layoutId="activeTeacherAttendanceTab"
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        </div>

        {selectedTeacher ? (
          <div className="bg-white dark:bg-[#151E32] p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setSelectedTeacher(null)}
              className="mb-4 text-[10px] font-bold text-slate-400 hover:text-indigo-500 uppercase tracking-wide flex items-center gap-2"
            >
              ← Kembali ke daftar
            </button>
            <TeacherAttendanceDeepDive
              teacher={selectedTeacher}
              logs={data.filter((d) => d.teacherId === selectedTeacher.teacherId)}
              heatmap={data
                .filter((d) => d.teacherId === selectedTeacher.teacherId)
                .map((d) => {
                  const dateObj = parseSafeDate(d.timestamp);
                  const dateStr = dateObj
                    ? format(dateObj, 'dd MMM yyyy, HH:mm', { locale: localeID })
                    : '-';
                  return { date: dateStr, status: d.status };
                })}
            />
          </div>
        ) : activeTab === 'absen' ? (
          <TeacherClassAttendance userRole={userRole} onSuccess={fetchData} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#151E32] rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1">
                    Total Scan
                  </p>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white leading-none">
                    {stats.total}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full border-[3px] border-slate-100 dark:border-slate-800 flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] p-6 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-emerald-600/70 tracking-wide mb-1">
                    Hadir (Valid)
                  </p>
                  <h3 className="text-3xl font-bold text-emerald-600 leading-none">
                    {stats.valid}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full border-[3px] border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] p-6 border border-rose-100 dark:border-rose-800/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-rose-600/70 tracking-wide mb-1">
                    Anomali (Invalid)
                  </p>
                  <h3 className="text-3xl font-bold text-rose-600 leading-none">
                    {stats.invalid}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full border-[3px] border-rose-200 dark:border-rose-800 flex items-center justify-center">
                  <XCircleIcon className="w-5 h-5 text-rose-500" />
                </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] p-6 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-indigo-600/70 tracking-wide mb-1">
                    Kinerja
                  </p>
                  <h3 className="text-3xl font-bold text-indigo-600 leading-none">
                    {stats.performance}%
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full border-[3px] border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-[#151E32] p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <input
                type="text"
                placeholder="CARI NAMA GURU..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-6 text-[11px] font-bold uppercase tracking-wide outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
              />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-6 text-[11px] font-bold uppercase tracking-wide outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner min-w-[150px]"
              >
                <option value="All">SEMUA KELAS</option>
                {classes.map((c, i) => (
                  <option key={`${c}-${i}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-6 text-[11px] font-bold uppercase tracking-wide outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="week">1 Minggu Terakhir</option>
              </select>
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={fetchData}
                  className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-indigo-600 rounded-2xl transition-colors shrink-0"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl text-[10px] uppercase font-bold tracking-wide shrink-0 transition-colors hover:bg-emerald-100"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-5 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl text-[10px] uppercase font-bold tracking-wide shrink-0 transition-colors hover:bg-rose-100"
                >
                  <FileText className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-[#151E32] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      <th className="px-6 py-5 whitespace-nowrap">Waktu Scan</th>
                      <th className="px-6 py-5">Guru / GTK</th>
                      <th className="px-6 py-5">Kelas</th>
                      <th className="px-6 py-5 whitespace-nowrap">Radius / Jarak</th>
                      <th className="px-6 py-5 text-center">Status</th>
                      {isManagement && (
                        <th className="px-6 py-5 text-right whitespace-nowrap">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={isManagement ? 6 : 5} className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                        </td>
                      </tr>
                    ) : displayData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isManagement ? 6 : 5}
                          className="py-20 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400"
                        >
                          Belum ada catatan presensi
                        </td>
                      </tr>
                    ) : (
                      displayData.map((d, i) => (
                        <tr
                          key={d.id || i}
                          onClick={() => setSelectedTeacher(d)}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                              {(() => {
                                const dateObj = parseSafeDate(d.timestamp);
                                return dateObj
                                  ? format(dateObj, 'dd MMM yyyy, HH:mm', { locale: localeID })
                                  : '-';
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-[11px] font-bold uppercase text-slate-800 dark:text-white">
                            {d.teacherName}
                            <div className="text-[8px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                              Device: {d.deviceInfo || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {d.className}
                          </td>
                          <td className="px-6 py-5 text-[11px] font-mono text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <MapPinIcon className="w-3 h-3 text-slate-400" />
                              {Math.round(d.distance)} meter
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wide ${d.status === 'VALID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                            >
                              {d.status === 'VALID' ? (
                                <CheckCircleIcon className="w-3 h-3" />
                              ) : (
                                <XCircleIcon className="w-3 h-3" />
                              )}
                              {d.status}
                            </span>
                          </td>
                          {isManagement && (
                            <td className="px-6 py-5 text-right">
                              <button
                                onClick={() => handleDeleteRecord(d.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default TeacherAttendanceView;
