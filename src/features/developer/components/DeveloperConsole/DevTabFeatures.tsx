import React from 'react';
import { InfoIcon } from '@/shared/Icons';

interface DevTabFeaturesProps {
  FEATURE_LOCK_LIST: { id: string; label: string }[];
  lockedFeatures: string[];
  handleToggleFeatureLock: (id: string) => Promise<void>;
  savingFeatureLocksMap: Record<string, boolean>;
  setConfirmModal: (modal: any) => void;
  db: any;
}

export const DevTabFeatures: React.FC<DevTabFeaturesProps> = ({
  FEATURE_LOCK_LIST,
  lockedFeatures,
  handleToggleFeatureLock,
  savingFeatureLocksMap,
  setConfirmModal,
  db,
}) => {
  return (
    <div className="h-full flex flex-col p-4 lg:p-6 space-y-6 overflow-y-auto custom-scrollbar pb-40">
      <div className="bg-white dark:bg-[#151E32] p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white capitalize ">
              Feature Lockdown Management
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
              Batasi akses fitur tertentu bagi pengguna non-premium
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_LOCK_LIST.map((feature) => {
            const isLocked = lockedFeatures.includes(feature.id);
            return (
              <div
                key={feature.id}
                className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-rose-500 transition-all group"
              >
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase leading-none text-slate-800 dark:text-white">
                    {feature.label}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-wide">
                    Status:{' '}
                    <span className={isLocked ? 'text-rose-500' : 'text-emerald-500'}>
                      {isLocked ? 'TERKUNCI' : 'AKTIF'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFeatureLock(feature.id)}
                  disabled={savingFeatureLocksMap[feature.id]}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 flex items-center shrink-0 ${isLocked ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute transition-all shadow-md ${isLocked ? 'translate-x-6' : 'translate-x-1'}`}
                  ></div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl">
          <div className="flex gap-4">
            <InfoIcon className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                Catatan Penting
              </p>
              <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                Fitur yang dikunci akan menampilkan pesan upgrading kepada semua pengguna kecuali
                Admin dan Developer. Perubahan ini akan tersinkronisasi secara real-time ke semua
                perangkat pengguna.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
