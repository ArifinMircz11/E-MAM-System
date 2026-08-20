import React from 'react';
import { MegaphoneIcon } from '@/shared/Icons';
import { DevActionButton } from './DevActionButton';
import { DevConsoleActions } from '@/services/devConsoleActions';
import { useDevConsoleContext } from '../../context/DeveloperContext';

export const DevTabBroadcast: React.FC = () => {
  const { systemAlert, setSystemAlert } = useDevConsoleContext();

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full pb-40 custom-scrollbar space-y-6">
      <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl max-w-2xl">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <MegaphoneIcon className="w-5 h-5 text-rose-500" /> Omni-Channel System Broadcast
          </h3>
          <p className="text-[10px] font-bold text-slate-500 mt-1">
            Mengirimkan pengumuman darurat atau pemeliharaan ke seluruh aplikasi secara real-time.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/20">
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Status Notifikasi
              </label>
              <p className="text-[9px] font-medium text-slate-500">
                Aktifkan atau matikan siaran darurat ini secara langsung.
              </p>
            </div>
            <button
              onClick={() => setSystemAlert({ ...systemAlert, isActive: !systemAlert.isActive })}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 outline-none ${systemAlert.isActive ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-800'}`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${systemAlert.isActive ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Target Role Siaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['ALL', 'Guru', 'Siswa', 'Admin'].map((role) => {
                const isSelected = systemAlert.targetRoles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => {
                      const roles = [...systemAlert.targetRoles];
                      if (roles.includes(role)) {
                        setSystemAlert({
                          ...systemAlert,
                          targetRoles: roles.filter((r) => r !== role),
                        });
                      } else {
                        setSystemAlert({ ...systemAlert, targetRoles: [...roles, role] });
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider border text-center transition-all ${
                      isSelected
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 text-rose-500'
                        : 'bg-white dark:bg-slate-900/20 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Judul Siaran
            </label>
            <input
              type="text"
              value={systemAlert.title}
              onChange={(e) => setSystemAlert({ ...systemAlert, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-[10px] font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:focus:ring-rose-500/10 outline-none"
              placeholder="Tulis judul pemberitahuan..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Isi Pesan Siaran
            </label>
            <textarea
              rows={4}
              value={systemAlert.message}
              onChange={(e) => setSystemAlert({ ...systemAlert, message: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-[10px] font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500/10 outline-none custom-scrollbar"
              placeholder="Tulis detail siaran..."
            />
          </div>

          <DevActionButton
            label="Kirim Broadcast"
            icon={<MegaphoneIcon className="w-4 h-4" />}
            variant="warning"
            confirmMessage="Kirim pengumuman ke semua user?"
            onAction={() =>
              DevConsoleActions.sendBroadcast(systemAlert.message, systemAlert.isActive)
            }
          />
        </div>
      </div>
    </div>
  );
};
