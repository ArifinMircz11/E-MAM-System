import React, { useState, useEffect } from 'react';
import { notificationLogRepository } from '@/repositories/notificationLogRepository';
import { TenantContext } from '@/core/context/TenantContext';
import Layout from '@/layouts/Layout';
import {
  BellIcon,
  Search,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  MegaphoneIcon,
  DevicePhoneIcon as SmartphoneIcon,
} from '@/shared/Icons';
import { format } from 'date-fns';

interface NotificationAudit {
  id: string;
  auditId: string;
  timestamp: string;
  channel: 'WA' | 'PUSH';
  status: 'SUCCESS' | 'FAILED';
  error: string | null;
  recipient: string;
  title: string;
  message: string;
  category: string;
}

interface NotificationLogsProps {
  onBack: () => void;
}

const NotificationLogs: React.FC<NotificationLogsProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<NotificationAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'WA' | 'PUSH'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const context = TenantContext.getContext();
        const data = await notificationLogRepository.getLogs(context, 100);
        setLogs(data);
      } catch (err: any) {
        console.error('Failed to fetch notification logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = filterChannel === 'ALL' || log.channel === filterChannel;
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    const matchesDate = !filterDate || log.timestamp.startsWith(filterDate);

    return matchesSearch && matchesChannel && matchesStatus && matchesDate;
  });

  return (
    <Layout
      title="Log Notifikasi"
      subtitle="Audit Trail & Monitoring System"
      icon={BellIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full pb-32">
        {/* ZI Badge */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shrink-0">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">
              Audit Trail ZI Enabled
            </h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase mt-0.5">
              Seluruh trafik notifikasi keluar tercatat secara otomatis untuk transparansi sistem.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari penerima atau pesan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-2.5 px-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 appearance-none"
            >
              <option value="ALL">Semua Channel</option>
              <option value="WA">WhatsApp</option>
              <option value="PUSH">Push Notification</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-2.5 px-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 appearance-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Waktu
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Channel
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Penerima
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Kategori
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Pesan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Memuat Log Audit...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        Tidak ada data ditemukan
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-white uppercase ">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                            {format(new Date(log.timestamp), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                            log.channel === 'WA'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                              : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}
                        >
                          {log.channel === 'WA' ? (
                            <MegaphoneIcon className="w-3 h-3" />
                          ) : (
                            <SmartphoneIcon className="w-3 h-3" />
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wide">
                            {log.channel}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate block max-w-[150px]"
                          title={log.recipient}
                        >
                          {log.recipient}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${
                              log.status === 'SUCCESS'
                                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                                : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400'
                            }`}
                          >
                            {log.status === 'SUCCESS' ? (
                              <CheckCircleIcon className="w-3 h-3" />
                            ) : (
                              <XCircleIcon className="w-3 h-3" />
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-wide">
                              {log.status}
                            </span>
                          </div>
                          {log.error && (
                            <span
                              className="text-[8px] text-rose-500 font-bold uppercase truncate max-w-[120px]"
                              title={log.error}
                            >
                              {log.error}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-white line-clamp-1">
                            {log.title}
                          </p>
                          <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                            {log.message}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
            Data ini bersifat mutlak dan tidak dapat diubah.
            <br />
            Digunakan sebagai lampiran validasi Standar Pelayanan Minimal (SPM) Madrasah.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationLogs;

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
