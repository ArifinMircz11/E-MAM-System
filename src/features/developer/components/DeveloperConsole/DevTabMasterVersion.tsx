import React from 'react';
import { ArrowPathIcon } from '@/shared/Icons';
import { DevTabMigration } from './DevTabMigration';
import { DevActionButton } from './DevActionButton';
import { DevConsoleActions } from '@/services/devConsoleActions';
import { useDevConsoleContext } from '../../context/DeveloperContext';

export const DevTabMasterVersion: React.FC = () => {
  const dev = useDevConsoleContext() as any;
  const {
    incrementMasterVersion,
    setConfirmModal,
    TABEL_SISTEM,
    executeDatabaseSchemaMigration,
    migrateProfileUpdateRequestsData,
    migrateUserDataToStudents,
    migrateToNewRBAC,
  } = dev;

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full pb-40 custom-scrollbar space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5 text-teal-500" /> Master Sync & Baseline Control
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-1">
              Mengelola nomor versi database master sistem untuk memicu pembaruan cache langsung
              pada klien.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/10 text-center space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Trigger Force Cache-Sync
            </p>
            <DevActionButton
              label="Force Master Sync (Minta Semua Klien Sinkronisasi Ulang)"
              icon={<ArrowPathIcon className="w-4 h-4 animate-spin-slow" />}
              variant="primary"
              confirmMessage="Akan mereset cache semua user. Lanjutkan?"
              onAction={() => DevConsoleActions.bumpMasterVersion(new Date().toISOString())}
              onSuccess={incrementMasterVersion}
            />
            <p className="text-[9px] font-medium text-slate-500">
              Meningkatkan master_version di database global, memaksa klien terhubung menjadwalkan
              ulang pengunduhan data.
            </p>
          </div>
        </div>

        {/* Migration Engine Subcomponent */}
        <DevTabMigration
          setConfirmModal={setConfirmModal}
          TABEL_SISTEM={TABEL_SISTEM}
          executeDatabaseSchemaMigration={executeDatabaseSchemaMigration}
          migrateProfileUpdateRequestsData={migrateProfileUpdateRequestsData}
          migrateUserDataToStudents={migrateUserDataToStudents}
          migrateToNewRBAC={migrateToNewRBAC}
        />
      </div>
    </div>
  );
};
