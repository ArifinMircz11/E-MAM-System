import React from 'react';
import { UserIcon, ArrowPathIcon } from '@/shared/Icons';
import { DevActionButton } from './DevActionButton';
import { useDevConsoleContext } from '../../context/DeveloperContext';

export const DevTabUserControl: React.FC = () => {
  const {
    fetchUsersForImpersonation,
    impersonateList,
    onImpersonate,
  } = useDevConsoleContext();

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full pb-32 custom-scrollbar space-y-6">
      <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl max-w-3xl space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-sky-500" /> Identity Bypass & User Impersonation
          </h3>
          <p className="text-[10px] font-bold text-slate-500 mt-1">
            Lakukan impersonasi akun pengguna mandiri tanpa sandi untuk mempermudah perbaikan &
            audit masalah guru/siswa di lapangan.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DevActionButton
              label="Muat Daftar Pengguna"
              icon={<ArrowPathIcon className="w-3.5 h-3.5" />}
              onAction={() => fetchUsersForImpersonation(true)}
            />
          </div>

          {impersonateList.length > 0 ? (
            <div className="border border-slate-100 dark:border-slate-800/60 rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/10">
              <table className="w-full text-left border-collapse text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-sans uppercase font-bold tracking-wider text-slate-500">
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">ID Unik / Email</th>
                    <th className="px-4 py-3">Role Default</th>
                    <th className="px-4 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-bold text-slate-600 dark:text-slate-300">
                  {impersonateList.map((user: any, i: number) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors"
                    >
                      <td className="px-4 py-2.5 truncate max-w-[180px] text-slate-900 dark:text-white uppercase font-bold">
                        {user.name}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[8px] text-slate-400 truncate max-w-[180px]">
                        {user.studentId || user.nip || user.email || 'No credentials'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[7.5px] font-bold">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => onImpersonate(user.role, user.name, user.studentId)}
                          className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded text-[8px] font-bold uppercase tracking-wider"
                        >
                          Impersonate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[9px] font-bold text-slate-400 italic">
              Tekan "Muat Daftar Pengguna" untuk menarik 50 akun guru, siswa, & staf terbaru.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
