import React from 'react';
import { KeyIcon, ClockIcon } from '@/shared/Icons';
import { ViewState, UserRole } from '@/types';
import { DevActionButton } from './DevActionButton';
import { DevConsoleActions } from '@/services/devConsoleActions';
import { useDevConsoleContext } from '../../context/DeveloperContext';

// Lazy load nested sub-component if needed, or import directly if it's small.
// Since it's already lazy loaded in parent, we might just pass it or import it.
import { DevTabPermissions } from './DevTabPermissions';

export const DevTabFeatureToggles: React.FC = () => {
  const dev = useDevConsoleContext();
  const {
    FEATURE_LOCK_LIST,
    lockedFeatures,
    handleToggleFeatureLock,
    setShowScheduleReminder,
    rolePermissions,
    setRolePermissions,
    handleSavePermissions,
    savingPermissions,
    ALL_FEATURES,
  } = dev;

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full pb-40 custom-scrollbar space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Feature Lock Controls */}
        <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <KeyIcon className="w-5 h-5 text-amber-500" /> Feature Toggles & Locks
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-1">
              Gunakan kunci fitur global untuk pemeliharaan sistem (Maintenance Mode per modul).
            </p>
          </div>

          <div className="space-y-3">
            {FEATURE_LOCK_LIST.map((feat) => {
              const isLocked = lockedFeatures.includes(feat.id);
              return (
                <div
                  key={feat.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/10"
                >
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      {feat.label}
                    </p>
                    <p className="text-[8px] font-mono font-bold text-slate-400">{feat.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <DevActionButton
                      label={isLocked ? 'Buka Kunci' : 'Kunci Fitur'}
                      variant={isLocked ? 'success' : 'danger'}
                      confirmMessage={`${isLocked ? 'Buka Kunci' : 'Kunci'} fitur ${feat.label}?`}
                      onAction={() => DevConsoleActions.toggleFeature(feat.id, !isLocked)}
                      onSuccess={() => handleToggleFeatureLock(feat.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setShowScheduleReminder(true)}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-all text-center flex items-center justify-center gap-2"
          >
            <ClockIcon className="w-4 h-4 text-indigo-500" />
            <span>Preview Modal Reminder Jadwal Guru</span>
          </button>
        </div>

        {/* RBAC matrix loader */}
        <div className="space-y-6">
          <DevTabPermissions
            rolePermissions={rolePermissions}
            setRolePermissions={setRolePermissions}
            handleSavePermissions={handleSavePermissions}
            savingPermissions={savingPermissions}
            ALL_FEATURES={ALL_FEATURES}
            UserRole={UserRole}
            ViewState={ViewState}
          />
        </div>
      </div>
    </div>
  );
};
