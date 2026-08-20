/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React from 'react';
import { Student, UserRole } from '@/types';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import { 
  Loader2, 
  Search, 
  UserIcon,
  IdentificationIcon,
  AcademicCapIcon,
  WhatsAppIcon,
  PencilIcon,
  TrashIcon
} from '@/shared/Icons';
import { StatusChip, Avatar } from './StudentDetailModal';

interface StudentListProps {
  students: Student[];
  isLoading: boolean;
  viewMode: 'card' | 'table';
  canManage: boolean;
  startIndex: number;
  endIndex: number;
  onDetail: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  selectedIds: string[];
  onPrintCard: (student: Student) => void;
}

const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const isStudentInvalid = (s: Student) => {
  if (!s.idUnik || !s.namaLengkap) return true;
  if (!s.sistemJangkar?.tenantId) return true;
  if (!s.tingkatRombel || s.tingkatRombel === '-' || s.tingkatRombel === 'Tanpa Rombel')
    return true;
  return false;
};

export const StudentList: React.FC<StudentListProps> = ({
  students,
  isLoading,
  viewMode,
  canManage,
  startIndex,
  endIndex,
  onDetail,
  onEdit,
  onDelete,
  onSelect,
  onSelectAll,
  selectedIds,
  onPrintCard,
}) => {
  if (isLoading && students.length === 0) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 opacity-20" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 dark:bg-[#151E32] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 mt-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-300 dark:text-indigo-700">
          <Search className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-white tracking-tight">
            Tidak ada data
          </h4>
          <p className="text-[10px] font-bold text-slate-400 mt-1 text-center">
            Sesuaikan filter atau tambah data siswa baru.
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {students.slice(startIndex, endIndex).map((s, idx) => {
          const globalIdx = startIndex + idx;
          const isInvalid = isStudentInvalid(s);
          const studentId = s.id || s.idUnik || '';
          const isSelected = selectedIds.includes(studentId);

          return (
            <div
              key={`${studentId}-${globalIdx}`}
              className={`bg-white dark:bg-[#1a233a] border ${
                isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 
                isInvalid ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20' : 
                'border-slate-200 dark:border-slate-800'
              } rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative`}
            >
              {canManage && (
                <div className="absolute top-2 right-2 z-10">
                   <input 
                     type="checkbox" 
                     checked={isSelected}
                     onChange={() => onSelect(studentId)}
                     className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                   />
                </div>
              )}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.namaLengkap} photoURL={s.photoURL} />
                    <div>
                      <h4
                        className={`text-xs font-bold text-slate-800 dark:text-slate-100 ${
                          isInvalid ? 'text-rose-500' : ''
                        }`}
                      >
                        {capitalizeWords(s.namaLengkap)}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          {s.idUnik || 'MISSING ID'}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400">
                          #{globalIdx + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusChip status={s.status || 'Aktif'} />
                </div>

                <div className="space-y-1.5 text-[10px] text-slate-600 dark:text-slate-300 py-2 border-y border-slate-100 dark:border-slate-800/80 my-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Rombel / Kelas:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                      {s.tingkatRombel || 'TANPA KELAS'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">NISN / NIK:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {s.nisn || s.nik || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Jenis Kelamin:</span>
                    <span className="font-bold">
                      {s.jenisKelamin === 'Perempuan' ? 'Perempuan (P)' : 'Laki-laki (L)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Ponsel / WA:</span>
                    {s.noTelepon ? (
                      <a
                        href={`https://wa.me/${String(s.noTelepon).replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" /> {s.noTelepon}
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span
                  className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    s.role === 'Ketua Kelas'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {s.role || 'Siswa'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDetail(s)}
                    className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                    title="Detail Profil"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                  </button>
                  {canManage && (
                    <>
                      <button
                        onClick={() => onPrintCard(s)}
                        className="p-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-all"
                        title="Cetak ID Card"
                      >
                        <IdentificationIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(s)}
                        className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                        title="Edit Data"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(s)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-900/40 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                        title="Hapus"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-20 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
          <tr className="text-[10px] font-bold text-slate-500 capitalize  border-b border-slate-200 dark:border-slate-800">
            <th className="w-10 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={students.length > 0 && selectedIds.length === students.length}
                onChange={onSelectAll}
                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                title="Pilih Semua"
              />
            </th>
            <th className="w-10 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800">
              No
            </th>
            <th className="w-[200px] px-4 py-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky left-0 z-30 text-emerald-600 uppercase">
              <div className="flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5" />
                <span>Profil Siswa</span>
              </div>
            </th>
            <th className="w-24 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800 text-cyan-600 uppercase">
              <div className="flex justify-center items-center gap-1.5">
                <IdentificationIcon className="w-3 h-3" />
                <span>ID UNIK</span>
              </div>
            </th>
            <th className="w-28 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50/20 text-indigo-600 uppercase">
              <div className="flex justify-center items-center gap-1.5">
                <AcademicCapIcon className="w-3 h-3" />
                <span>Kelas</span>
              </div>
            </th>
            <th className="w-28 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800 text-emerald-600 uppercase">
              <div className="flex justify-center items-center gap-1.5">
                <WhatsAppIcon className="w-3 h-3" />
                <span>Ponsel</span>
              </div>
            </th>
            <th className="w-28 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800 uppercase">
              Peran
            </th>
            <th className="w-24 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800 uppercase">
              GDR
            </th>
            <th className="w-24 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800 uppercase">
              Status
            </th>
            <th className="w-28 px-2 py-4 text-center uppercase tracking-wide">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {students.slice(startIndex, endIndex).map((s, idx) => {
            const globalIdx = startIndex + idx;
            const isInvalid = isStudentInvalid(s);
            const studentId = s.id || s.idUnik || '';
            const isSelected = selectedIds.includes(studentId);

            return (
              <tr
                key={`${studentId}-${globalIdx}`}
                className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors text-[10px] font-bold ${
                  isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 
                  isInvalid ? 'bg-rose-50/30' : ''
                }`}
              >
                <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(studentId)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </td>
                <td className="px-2 py-3 text-center text-slate-400 border-r border-slate-100 dark:border-slate-800/50 font-mono">
                  {globalIdx + 1}
                </td>
                <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 sticky left-0 z-10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.namaLengkap} photoURL={s.photoURL} className="w-8 h-8" />
                    <div>
                      <p className={`text-[11px] font-bold tracking-tight ${isInvalid ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>
                        {capitalizeWords(s.namaLengkap)}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {s.nisn || 'NISN Tidak Ada'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                    {s.idUnik || 'MISSING'}
                  </span>
                </td>
                <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                   <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                    {s.tingkatRombel || 'Unassigned'}
                  </span>
                </td>
                <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                  {s.noTelepon ? (
                    <span className="text-emerald-600">{s.noTelepon}</span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-800/50 uppercase text-[9px]">
                  {s.role || 'Siswa'}
                </td>
                <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                  {s.jenisKelamin === 'Perempuan' ? 'P' : 'L'}
                </td>
                <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                  <StatusChip status={s.status || 'Aktif'} />
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center justify-center gap-1">
                     <button
                      onClick={() => onDetail(s)}
                      className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                      title="Detail Profil"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => onPrintCard(s)}
                          className="p-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-all"
                          title="Cetak ID Card"
                        >
                          <IdentificationIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(s)}
                          className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                          title="Edit Data"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(s)}
                          className="p-1.5 bg-rose-50 dark:bg-rose-900/40 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                          title="Hapus"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
