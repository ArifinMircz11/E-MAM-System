/**
 * @license
 * e-Mam System - Student Points Rekap Dashboard UI Component
 * LAYER: COMPONENT (Pure UI Presentation)
 */

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Filter,
  Users,
  AlertTriangle,
  Award,
  TrendingUp,
  FileText,
  BarChart2,
  RefreshCw,
  Search,
  ChevronRight,
} from 'lucide-react';
import { usePointDashboardStore } from '../stores/pointDashboardStore';
import { usePointDashboard } from '../hooks/usePointDashboard';
import { getClasses } from '@/services/classService';
import type { ReportPeriod } from '../types/pointReport';

interface Props {
  onSelectStudent?: (studentId: string) => void;
}

export const DashboardRekapView: React.FC<Props> = ({ onSelectStudent }) => {
  const {
    period,
    selectedDate,
    selectedClassId,
    startDate,
    endDate,
    setPeriod,
    setDate,
    setClass,
    setDateRange,
  } = usePointDashboardStore();

  const {
    loading,
    error,
    dailyData,
    weeklyData,
    monthlyData,
    classData,
    refreshReport,
  } = usePointDashboard();

  const [classList, setClassList] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let isMounted = true;
    getClasses()
      .then((cls) => {
        if (isMounted) {
          setClassList(cls.map((c) => ({ id: c.name || c.id, name: c.name || c.id })));
        }
      })
      .catch((err) => console.warn('Failed to load class list', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const periodOptions: Array<{ id: ReportPeriod; label: string }> = [
    { id: 'daily', label: 'Harian' },
    { id: 'weekly', label: 'Mingguan' },
    { id: 'monthly', label: 'Bulanan' },
    { id: 'class', label: 'Per Kelas' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Mode Selector */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg self-start lg:self-auto">
            {periodOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === opt.id
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Dynamic Controls based on Period */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {period === 'daily' && (
              <div className="flex items-center gap-2">
                <label className="text-gray-500 font-medium">Tanggal:</label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {period === 'weekly' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500 font-medium">Rentang:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setDateRange(e.target.value, endDate)}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                />
                <span className="text-gray-400">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setDateRange(startDate, e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {period === 'monthly' && (
              <div className="flex items-center gap-2">
                <label className="text-gray-500 font-medium">Bulan:</label>
                <input
                  type="month"
                  value={selectedDate.substring(0, 7)}
                  onChange={(e) => setDate(`${e.target.value}-01`)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Class Picker */}
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">Kelas:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setClass(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-emerald-500 min-w-[110px]"
              >
                <option value="All">Semua Kelas</option>
                {classList.map((c) => (
                  <option key={c.id} value={c.name}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => refreshReport()}
              disabled={loading}
              className="p-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message if any */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Overlay or Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-100">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-medium">Memproses data rekap poin...</p>
        </div>
      ) : (
        <>
          {/* MODE HARIAN */}
          {period === 'daily' && dailyData && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Total Transaksi</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {dailyData.totalTransactions}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Catatan poin hari ini</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Poin Pelanggaran</span>
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-rose-600">
                    +{dailyData.violationsCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Poin pelanggaran tercatat</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Poin Prestasi</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">
                    -{dailyData.achievementsCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Pengurang poin (penghargaan)</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Siswa Terlibat</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {dailyData.studentsInvolvedCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Siswa mendapat catatan</p>
                </div>
              </div>

              {/* Class Breakdown Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-800">
                    Rekap Poin Harian Per Kelas ({dailyData.date})
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    {dailyData.classBreakdown.length} Kelas Aktif
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                        <th className="py-3 px-4">Kelas</th>
                        <th className="py-3 px-4 text-center">Siswa Terlibat</th>
                        <th className="py-3 px-4 text-right">Pelanggaran (+)</th>
                        <th className="py-3 px-4 text-right">Prestasi (-)</th>
                        <th className="py-3 px-4 text-right">Net Poin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                      {dailyData.classBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">
                            Tidak ada transaksi poin pada tanggal ini.
                          </td>
                        </tr>
                      ) : (
                        dailyData.classBreakdown.map((item) => (
                          <tr key={item.classId} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3 px-4 font-semibold text-gray-900">
                              Kelas {item.className}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-gray-100 font-medium text-gray-700">
                                {item.studentCount} siswa
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-rose-600 font-medium">
                              +{item.violations}
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                              -{item.achievements}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-gray-900">
                              {item.netPoints > 0 ? `+${item.netPoints}` : item.netPoints}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODE MINGGUAN */}
          {period === 'weekly' && weeklyData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Rentang Minggu</span>
                  <div className="text-sm font-bold text-gray-900 mt-1">
                    {weeklyData.weekRangeLabel}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Periode aktif</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Total Poin Masuk (+)</span>
                  <div className="text-2xl font-bold text-rose-600 mt-1">
                    +{weeklyData.totalPointsIn}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Pelanggaran sepekan</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Total Poin Keluar (-)</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    -{weeklyData.totalPointsOut}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Penghargaan sepekan</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Siswa Terlibat</span>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {weeklyData.studentsInvolvedCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Akumulasi siswa</p>
                </div>
              </div>

              {/* Daily Trend Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-800">
                    Tren Harian Sepekan ({weeklyData.weekRangeLabel})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                        <th className="py-3 px-4">Hari / Tanggal</th>
                        <th className="py-3 px-4 text-right">Poin Masuk (+)</th>
                        <th className="py-3 px-4 text-right">Poin Keluar (-)</th>
                        <th className="py-3 px-4 text-right">Net Poin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                      {weeklyData.dailyTrends.map((trend) => (
                        <tr key={trend.date} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            {trend.dayName},{' '}
                            <span className="text-gray-500 font-normal">{trend.date}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-rose-600 font-medium">
                            +{trend.pointsIn}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                            -{trend.pointsOut}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">
                            {trend.netPoints > 0 ? `+${trend.netPoints}` : trend.netPoints}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODE BULANAN */}
          {period === 'monthly' && monthlyData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Periode Bulan</span>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {monthlyData.monthYearStr}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Bulan berjalan</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Total Pelanggaran</span>
                  <div className="text-2xl font-bold text-rose-600 mt-1">
                    +{monthlyData.violationsCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Akumulasi sebulan</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Total Prestasi</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    -{monthlyData.achievementsCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Akumulasi sebulan</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Surat Terbit</span>
                  <div className="text-2xl font-bold text-amber-600 mt-1">
                    {monthlyData.callLettersCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Draf/Surat panggilan terbit</p>
                </div>
              </div>

              {/* Class Breakdown Monthly */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-800">
                    Rekapitulasi Bulanan Per Kelas
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                        <th className="py-3 px-4">Kelas</th>
                        <th className="py-3 px-4 text-right">Poin Masuk (+)</th>
                        <th className="py-3 px-4 text-right">Poin Keluar (-)</th>
                        <th className="py-3 px-4 text-right">Net Poin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                      {monthlyData.classBreakdown.map((c) => (
                        <tr key={c.classId} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            Kelas {c.className}
                          </td>
                          <td className="py-3 px-4 text-right text-rose-600 font-medium">
                            +{c.pointsIn}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                            -{c.pointsOut}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">
                            {c.netPoints > 0 ? `+${c.netPoints}` : c.netPoints}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODE PER KELAS */}
          {period === 'class' && classData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Total Siswa</span>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {classData.totalStudents}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Kelas {classData.className}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Siswa Berisiko</span>
                  <div className="text-2xl font-bold text-rose-600 mt-1">
                    {classData.atRiskStudentsCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Poin ≥ 15 (Threshold / Waspada)</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Total Poin Kelas</span>
                  <div className="text-2xl font-bold text-amber-600 mt-1">
                    {classData.totalPoints}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Akumulasi kelas</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Rata-rata Poin</span>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {classData.averagePoints}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Per siswa</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                  <span className="text-xs text-gray-500 font-medium">Surat Panggilan</span>
                  <div className="text-2xl font-bold text-purple-600 mt-1">
                    {classData.callLettersCount}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Telah diterbitkan</p>
                </div>
              </div>

              {/* Student Ranking Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-800">
                    Peringkat Poin Siswa Kelas {classData.className}
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Urut berdasarkan Poin Tertinggi
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Nama Siswa</th>
                        <th className="py-3 px-4">NISN</th>
                        <th className="py-3 px-4 text-right">Total Poin</th>
                        <th className="py-3 px-4 text-center">Level Sanksi</th>
                        <th className="py-3 px-4 text-center">Status Badge</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                      {classData.studentRankings.map((rankItem) => (
                        <tr
                          key={rankItem.studentId}
                          className="hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="py-3 px-4 text-center font-bold text-gray-400">
                            {rankItem.rank}
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            {rankItem.studentName}
                          </td>
                          <td className="py-3 px-4 text-gray-500">{rankItem.nisn}</td>
                          <td className="py-3 px-4 text-right font-bold text-rose-600">
                            {rankItem.points} pts
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[11px] text-gray-600 font-medium">
                              {rankItem.sanctionLevel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                rankItem.statusBadge === 'SP-3'
                                  ? 'bg-rose-100 text-rose-800'
                                  : rankItem.statusBadge === 'SP-2'
                                    ? 'bg-amber-100 text-amber-800'
                                    : rankItem.statusBadge === 'SP-1'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : rankItem.statusBadge === 'Waspada'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {rankItem.statusBadge}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onSelectStudent?.(rankItem.studentId)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800"
                            >
                              Detail
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
