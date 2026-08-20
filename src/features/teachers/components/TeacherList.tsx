/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React from 'react';
import { 
  UserIcon, 
  RefreshCwIcon, 
  PencilIcon, 
  TrashIcon, 
  Loader2,
  CheckCircleIcon
} from '@/shared/Icons';
import type { Teacher } from '@/types';
import { UserRole } from '@/types';
import { getPlaceholderAvatar } from '@/utils/avatarHelper';

interface TeacherListProps {
  teachers: Teacher[];
  loading: boolean;
  canManage: boolean;
  onDetail: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string, name: string) => void;
  onResetAuth: (teacher: Teacher) => void;
  resettingId: string | null;
}

const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

const Avatar = ({ name, photoURL }: { name: string; photoURL?: string }) => {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-200 dark:border-indigo-800 shadow-sm shrink-0">
      <img
        src={photoURL || getPlaceholderAvatar(name)}
        alt={name}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

const getRoleLabel = (role: string) => {
  if (!role) return '-';
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const TeacherList: React.FC<TeacherListProps> = ({
  teachers,
  loading,
  canManage,
  onDetail,
  onEdit,
  onDelete,
  onResetAuth,
  resettingId
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-20">
          <tr className="text-[10px] font-bold text-slate-500 capitalize border-b border-slate-200 dark:border-slate-800">
            <th className="w-10 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800 text-slate-400">
              No
            </th>
            <th className="w-[220px] px-4 py-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky left-0 z-30 text-indigo-600 dark:text-indigo-400">
              Profil GTK
            </th>
            <th className="w-32 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50/20 text-indigo-600">
              NIP / NIK
            </th>
            <th className="w-40 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800">
              Mata Pelajaran
            </th>
            <th className="w-28 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800">
              Status
            </th>
            <th className="w-28 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800">
              Role Sistem
            </th>
            <th className="w-24 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800">
              Klaim Akun
            </th>
            <th className="w-28 px-2 py-4 text-center border-r border-slate-200 dark:border-slate-800">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {loading ? (
            <tr>
              <td colSpan={8} className="py-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 opacity-20" />
              </td>
            </tr>
          ) : (
            teachers.map((t, idx) => (
              <tr
                key={`${t.id || 'teacher'}-${idx}`}
                className="text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                  {idx + 1}
                </td>
                <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-[#151E32] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200">
                    <Avatar name={t.namaLengkap || t.name || ''} photoURL={t.photoURL} />
                    <div>
                      <span>{capitalizeWords(t.namaLengkap || t.name || '')}</span>
                      {t.penugasanAkademik?.isWaliKelas && (
                        <div className="text-[8px] mt-0.5 font-bold text-emerald-500 uppercase flex items-center gap-1">
                          <CheckCircleIcon className="w-2.5 h-2.5 shrink-0" />
                          Walas {t.penugasanAkademik?.waliKelasDi || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3.5 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-bold text-indigo-600 bg-slate-50/20">
                  <div>{t.nip || t.nik || t.idUnik || '-'}</div>
                  {t.nuptk && (
                    <div className="text-[8px] text-slate-400 font-normal mt-0.5">
                      NUPTK: {t.nuptk}
                    </div>
                  )}
                </td>
                <td className="px-2 py-3.5 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-500">
                  <div>{t.penugasanAkademik?.mapelUtama || t.mapel || t.subject || '-'}</div>
                  {t.jabatanDanStatus?.jabatanUtama && (
                    <div className="text-[8px] text-slate-400 font-normal mt-0.5">
                      {t.jabatanDanStatus.jabatanUtama}
                    </div>
                  )}
                </td>
                <td className="px-2 py-3.5 border-r border-slate-200 dark:border-slate-800 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      (t.jabatanDanStatus?.statusPegawai || t.status) === 'PNS'
                        ? 'bg-emerald-100 text-emerald-700'
                        : (t.jabatanDanStatus?.statusPegawai || t.status) === 'PPPK'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {t.jabatanDanStatus?.statusPegawai || t.status || '-'}
                  </span>
                  {t.jabatanDanStatus?.pangkatGolongan &&
                    t.jabatanDanStatus?.pangkatGolongan !== '-' &&
                    t.jabatanDanStatus?.pangkatGolongan !== '' && (
                      <div className="text-[9px] text-indigo-500 font-bold mt-1 uppercase">
                        {t.jabatanDanStatus.pangkatGolongan}
                      </div>
                    )}
                </td>
                <td className="px-2 py-3.5 border-r border-slate-200 dark:border-slate-800 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-indigo-50 text-indigo-600`}
                  >
                    {getRoleLabel(t.role || '')}
                  </span>
                </td>
                <td className="px-2 py-3.5 border-r border-slate-200 dark:border-slate-800 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${(t.sistemJangkar?.isClaimed ?? t.isClaimed) ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}
                  >
                    {(t.sistemJangkar?.isClaimed ?? t.isClaimed) ? 'Terklaim' : 'Belum Klaim'}
                  </span>
                </td>
                <td className="px-2 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onDetail(t)}
                      className="p-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90"
                      title="Detail"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => onResetAuth(t)}
                          disabled={resettingId === (t.teachersId || t.id || t.idUnik)}
                          className="p-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90 disabled:opacity-50"
                          title={(t.sistemJangkar?.isClaimed ?? t.isClaimed) ? 'Reset Password' : 'Klaim/Buat Password'}
                        >
                          {resettingId === (t.teachersId || t.id || t.idUnik) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCwIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onEdit(t)}
                          className="p-1.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90"
                          title="Koreksi Data"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            onDelete(t.id || t.idUnik || '', t.namaLengkap || t.name || 'Guru')
                          }
                          className="p-1.5 bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90"
                          title="Hapus Permanen"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
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
  );
};
