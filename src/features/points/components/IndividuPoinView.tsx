/**
 * @license
 * e-Mam System - Student Points Individual UI Component
 * LAYER: COMPONENT (Pure UI Presentation)
 */

import React, { useEffect, useState } from 'react';
import {
  User,
  Search,
  Award,
  AlertTriangle,
  TrendingUp,
  FileText,
  Calendar,
  Clock,
  ShieldAlert,
  ChevronRight,
  BarChart2,
  PieChart,
  RefreshCw,
  Printer,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { usePointIndividualStore } from '../stores/pointIndividualStore';
import { useStudentPoints } from '../hooks/useStudentPoints';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { TenantContext } from '@/core/context/TenantContext';
import type { Student } from '@/types';
import type { IndividualSubTab } from '../stores/pointIndividualStore';

interface Props {
  initialStudentId?: string | null;
}

export const IndividuPoinView: React.FC<Props> = ({ initialStudentId }) => {
  const {
    selectedStudentId,
    selectedStudentData,
    activeSubTab,
    setSelectedStudent,
    setActiveSubTab,
  } = usePointIndividualStore();

  const { loading, error, report, refreshReport } = useStudentPoints();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Set initial student if provided
  useEffect(() => {
    if (initialStudentId && (!selectedStudentId || selectedStudentId !== initialStudentId)) {
      const tenantId = TenantContext.getContext().tenantId;
      studentRepository.findById(initialStudentId, tenantId).then((s) => {
        if (s) setSelectedStudent(s);
      });
    }
  }, [initialStudentId, selectedStudentId, setSelectedStudent]);

  // Load student suggestions when searching
  useEffect(() => {
    let isMounted = true;
    if (searchQuery.trim().length >= 2) {
      setSearching(true);
      const tenantId = TenantContext.getContext().tenantId;
      studentRepository
        .searchByName(tenantId, searchQuery)
        .then((res) => {
          if (isMounted) {
            setStudentList(res);
            setSearching(false);
          }
        })
        .catch(() => {
          if (isMounted) setSearching(false);
        });
    } else {
      // Load top 15 students
      const tenantId = TenantContext.getContext().tenantId;
      studentRepository.fetchByTenant(tenantId, 15).then((res) => {
        if (isMounted) setStudentList(res);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  const subTabOptions: Array<{ id: IndividualSubTab; label: string; icon: any }> = [
    { id: 'summary', label: 'Ringkasan', icon: User },
    { id: 'timeline', label: 'Riwayat Transaksi', icon: Clock },
    { id: 'charts', label: 'Grafik & Perkembangan', icon: BarChart2 },
    { id: 'letters', label: 'Surat Panggilan', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Student Selector Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Cari nama siswa atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Quick Select Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
              Pilih Siswa:
            </span>
            <select
              value={selectedStudentId || ''}
              onChange={(e) => {
                const s = studentList.find(
                  (st) => (st.id || st.idUnik) === e.target.value,
                );
                if (s) setSelectedStudent(s);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-emerald-500 max-w-[220px]"
            >
              <option value="">-- Pilih Siswa --</option>
              {studentList.map((s) => (
                <option key={s.id || s.idUnik} value={s.id || s.idUnik}>
                  {s.namaLengkap} ({s.className || 'Kelas'})
                </option>
              ))}
            </select>

            {selectedStudentId && (
              <button
                onClick={() => refreshReport()}
                disabled={loading}
                className="p-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                title="Refresh Data Siswa"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {!selectedStudentId ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <User className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-xs font-semibold text-gray-600">Pilih Siswa Terlebih Dahulu</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Gunakan kolom pencarian atau menu pilihan di atas untuk melihat rekap poin individu.
          </p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Memuat data poin siswa...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Sub Tab Navigation */}
          <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
            {subTabOptions.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* SUB TAB 1: RINGKASAN */}
          {activeSubTab === 'summary' && (
            <div className="space-y-6">
              {/* Student Profile Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Profil Poin Siswa
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-2">
                      {report.studentName}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Kelas: <strong className="text-gray-700">{report.className}</strong> |
                      NISN: <strong className="text-gray-700">{report.nisn}</strong>
                    </p>
                  </div>

                  <div className="text-left sm:text-right bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                    <span className="text-[11px] text-gray-500 font-medium">
                      Total Poin Aktif
                    </span>
                    <div className="text-2xl font-black text-rose-600">
                      {report.totalActivePoints} pts
                    </div>
                    <span className="inline-block text-[10px] font-semibold text-gray-600 mt-0.5">
                      Sanksi: {report.sanctionLevel}
                    </span>
                  </div>
                </div>

                {/* Progress Bar towards Next Threshold */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-gray-700">
                      Progres Ambang Batas Panggilan Sanksi Next ({report.nextThreshold} pts)
                    </span>
                    <span className="font-bold text-emerald-700">
                      {report.thresholdProgressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        report.thresholdProgressPercentage >= 100
                          ? 'bg-rose-600'
                          : report.thresholdProgressPercentage >= 66
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${report.thresholdProgressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">
                    Total Poin Pelanggaran (+)
                  </span>
                  <div className="text-xl font-bold text-rose-600 mt-1">
                    +{report.violationsPoints}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Akumulasi semua pelanggaran
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">
                    Total Poin Prestasi (-)
                  </span>
                  <div className="text-xl font-bold text-emerald-600 mt-1">
                    -{report.achievementsPoints}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Pengurang dari apresiasi
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Surat Terbit</span>
                  <div className="text-xl font-bold text-amber-600 mt-1">
                    {report.callLetters.length} Surat
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Surat Panggilan / SP</p>
                </div>
              </div>
            </div>
          )}

          {/* SUB TAB 2: RIWAYAT TRANSAKSI (TIMELINE) */}
          {activeSubTab === 'timeline' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-800">
                  Riwayat Mutasi Saldo Poin ({report.studentName})
                </h3>
                <span className="text-[11px] text-gray-400">
                  {report.timeline.length} Transaksi Tercatat
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Kategori / Deskripsi</th>
                      <th className="py-3 px-4 text-center">Tipe</th>
                      <th className="py-3 px-4 text-right">Saldo Awal</th>
                      <th className="py-3 px-4 text-right">Perubahan Poin</th>
                      <th className="py-3 px-4 text-right">Saldo Akhir</th>
                      <th className="py-3 px-4">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {report.timeline.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          Belum ada riwayat transaksi poin untuk siswa ini.
                        </td>
                      </tr>
                    ) : (
                      report.timeline.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4 text-gray-600 font-medium">
                            {item.date}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">
                              {item.category}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {item.description}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.type === 'pelanggaran'
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.type === 'prestasi'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-500 font-mono">
                            {item.previousBalance}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold ${
                              item.pointsChange > 0
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {item.pointsChange > 0
                              ? `+${item.pointsChange}`
                              : item.pointsChange}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                            {item.newBalance}
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-[11px]">
                            {item.recordedBy}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB TAB 3: GRAFIK & PERKEMBANGAN */}
          {activeSubTab === 'charts' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart: Saldo Trajectory */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Grafik Saldo Poin Kumulatif
                </h3>
                <div className="h-64 w-full">
                  {report.charts.balanceHistory.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      Data transaksi belum cukup untuk menampilkan grafik.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={report.charts.balanceHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{
                            fontSize: '12px',
                            borderRadius: '8px',
                            borderColor: '#e2e8f0',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="balance"
                          name="Saldo Poin"
                          stroke="#e11d48"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#e11d48' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Bar Chart: Composition */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  Komposisi Poin Siswa
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Pelanggaran',
                          value: report.charts.distribution.violations,
                          fill: '#e11d48',
                        },
                        {
                          name: 'Prestasi',
                          value: report.charts.distribution.achievements,
                          fill: '#10b981',
                        },
                        {
                          name: 'Koreksi',
                          value: report.charts.distribution.adjustments,
                          fill: '#6b7280',
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          fontSize: '12px',
                          borderRadius: '8px',
                          borderColor: '#e2e8f0',
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <Cell fill="#e11d48" />
                        <Cell fill="#10b981" />
                        <Cell fill="#6b7280" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* SUB TAB 4: SURAT PANGGANGAN */}
          {activeSubTab === 'letters' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-800">
                  Daftar Surat Panggilan / SP ({report.studentName})
                </h3>
                <span className="text-[11px] text-gray-400">
                  {report.callLetters.length} Surat Terbit
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                      <th className="py-3 px-4">Nomor Surat</th>
                      <th className="py-3 px-4">Tanggal Terbit</th>
                      <th className="py-3 px-4 text-center">Tingkat SP</th>
                      <th className="py-3 px-4 text-right">Poin Saat Terbit</th>
                      <th className="py-3 px-4 text-center">Status Surat</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {report.callLetters.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          Belum ada surat panggilan atau SP yang diterbitkan untuk siswa ini.
                        </td>
                      </tr>
                    ) : (
                      report.callLetters.map((letter) => (
                        <tr key={letter.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-gray-900 font-mono">
                            {letter.letterNumber}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{letter.date}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {letter.spLevel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-rose-600">
                            {letter.pointsAtCreation} pts
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                              {letter.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() =>
                                alert(`Cetak surat: ${letter.letterNumber}`)
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <Printer className="w-3 h-3 text-gray-500" />
                              Cetak
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
