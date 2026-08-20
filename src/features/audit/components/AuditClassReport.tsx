import React, { useState, useEffect } from 'react';
import {
  TableCellsIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@/shared/Icons';
import { auditService } from '@/services/auditService';
import { useAuthStore } from '@/stores/authStore';
import { classRepository } from '@/repositories/classRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

export const AuditClassReport: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId || '';

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      const data = await classRepository.getByTenant(getSecurityContext(), tenantId);
      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].name);
      }
    };
    fetchClasses();
  }, [tenantId]);

  useEffect(() => {
    if (selectedClass) {
      loadReport();
    }
  }, [selectedClass]);

  const loadReport = async () => {
    setIsLoading(true);
    const data = await auditService.getAuditReportByClass(tenantId, selectedClass);
    setReportData(data);
    setIsLoading(false);
  };

  const filteredData = reportData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nisn.includes(searchQuery),
  );

  return (
    <div className="bg-white dark:bg-[#0f172a]/50 backdrop-blur-md rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden">
      <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <TableCellsIcon className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
              Laporan Audit Per-Kelas
            </h4>
            <p className="text-[10px] font-bold text-slate-400">
              Pengecekan integritas record siswa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-800 pl-4 pr-10 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide border-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.classId || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={loadReport}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <ArrowPathIcon
              className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="CARI NAMA ATAU NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 pl-8 pr-4 py-2 rounded-xl text-[10px] font-bold border-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[9px] font-bold text-slate-400 uppercase ">
            Total:
          </span>
          <span className="text-[10px] font-bold text-slate-900 dark:text-white">
            {filteredData.length}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30 dark:bg-slate-900/50">
              <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-50 dark:border-slate-800">
                Siswa
              </th>
              <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-50 dark:border-slate-800">
                NISN
              </th>
              <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-50 dark:border-slate-800">
                Poin
              </th>
              <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-50 dark:border-slate-800">
                Record Presensi
              </th>
              <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-50 dark:border-slate-800">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
                  </td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <ExclamationCircleIcon className="w-8 h-8 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Tidak ada data ditemukan
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase truncate max-w-[150px]">
                        {item.name}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">{item.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {item.nisn}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold ${item.pointBalance > 0 ? 'text-emerald-500' : 'text-slate-400'}`}
                    >
                      {item.pointBalance}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-indigo-500">
                      {item.attendanceCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {item.dataIntegrity === 'Valid' ? (
                        <>
                          <CheckBadgeIcon className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[9px] font-bold text-emerald-500 uppercase ">
                            Terverifikasi
                          </span>
                        </>
                      ) : (
                        <>
                          <ExclamationCircleIcon className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[9px] font-bold text-amber-500 uppercase ">
                            Perlu Repair
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-slate-50/30 dark:bg-slate-900/50 flex items-center justify-between">
        <p className="text-[9px] font-bold text-slate-400 leading-relaxed max-w-sm">
          Laporan ini menunjukkan status sinkronisasi lokal pada perangkat Anda. Data yang bertanda
          "Perlu Repair" biasanya disebabkan oleh inkonsistensi naming kelas pada migrasi
          sebelumnya.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
              Integritas OK
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
              Inkonsistensi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
