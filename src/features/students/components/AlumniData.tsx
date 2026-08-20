/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { UserRole } from '@/types';
import { isMockMode } from '@/services/authService';
import Layout from '@/layouts/Layout';
import {
  AcademicCapIcon,
  Search,
  Loader2,
} from '@/shared/Icons';
import { useAlumni } from '@/hooks/useAlumni';

const AlumniData: React.FC<{ onBack: () => void; userRole: UserRole }> = ({ onBack, userRole }) => {
  const { alumni, loading, fetchAlumni } = useAlumni();
  const [filterNama, setFilterNama] = useState('');

  useEffect(() => {
    if (!isMockMode) {
      fetchAlumni();
    }
  }, [fetchAlumni]);

  const filteredAlumni = useMemo(() => {
    return alumni.filter((s) =>
      (s.namaLengkap || '').toLowerCase().includes(filterNama.toLowerCase()),
    );
  }, [alumni, filterNama]);

  return (
    <Layout
      title="Database Alumni"
      subtitle="Arsip Lulusan Madrasah"
      icon={AcademicCapIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-6 pb-40 space-y-6">
        <div className="bg-white dark:bg-[#151E32] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama alumni..."
            value={filterNama}
            onChange={(e) => setFilterNama(e.target.value)}
            className="flex-1 bg-transparent text-[11px] font-bold outline-none"
          />
        </div>

        <div className="bg-white dark:bg-[#151E32] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr className="text-[10px] font-bold text-slate-500 ">
                  <th className="w-12 px-4 py-4 text-center">No</th>
                  <th className="w-[160px] px-3 py-4 sticky left-0 bg-slate-50 dark:bg-slate-900 z-30 border-r text-neon-emerald uppercase">
                    Nama Lengkap
                  </th>
                  <th className="w-28 px-4 py-4 text-center border-r text-neon-cyan uppercase">
                    ID Unik
                  </th>
                  <th className="w-32 px-4 py-4 text-center border-r">Tahun Lulus</th>
                  <th className="w-32 px-4 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                    </td>
                  </tr>
                ) : (
                  filteredAlumni.map((s, idx) => (
                    <tr
                      key={`${s.id || 'alumni'}-${idx}`}
                      className="text-[10px] hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-3 py-4 font-bold text-slate-700 dark:text-slate-200 uppercase truncate sticky left-0 bg-white dark:bg-[#151E32] z-10 border-r hover:text-neon-emerald transition-colors">
                        {s.namaLengkap}
                      </td>
                      <td className="px-4 py-4 text-center border-r font-mono font-bold text-neon-cyan">
                        {s.idUnik}
                      </td>
                      <td className="px-4 py-4 text-center border-r font-bold text-slate-500">
                        {s.movedAt?.substring(0, 4) || '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button className="px-3 py-1.5 bg-slate-100 rounded-lg text-[8px] font-bold uppercase">
                          Detail Arsip
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredAlumni.length === 0 && (
            <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
              <AcademicCapIcon className="w-12 h-12" />
              <p className="text-[10px] font-bold uppercase tracking-wide">
                Belum ada data alumni
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AlumniData;
