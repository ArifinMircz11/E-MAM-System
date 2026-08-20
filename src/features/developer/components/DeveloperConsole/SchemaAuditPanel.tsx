import React, { useState } from 'react';
import { auditService } from '@/services/auditService';
import { useAuthStore } from '@/stores/authStore';
import { CheckBadgeIcon, ExclamationCircleIcon, ArrowPathIcon } from '@/shared/Icons';

export const SchemaAuditPanel: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId || '';

  const [indexResults, setIndexResults] = useState<any[]>([]);
  const [offlineStatus, setOfflineStatus] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const runAudit = async () => {
    setIsAuditing(true);
    const idxRes = await auditService.validateIndexes();
    const offRes = await auditService.validateOfflineFirstCompliance(tenantId);
    setIndexResults(idxRes);
    setOfflineStatus(offRes);
    setIsAuditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
            Architecture Audit Center
          </h3>
          <p className="text-[10px] font-bold text-slate-400">
            Validate local database and sync compliance
          </p>
        </div>
        <button
          onClick={runAudit}
          disabled={isAuditing}
          className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
          <h4 className="text-[9px] font-bold uppercase text-slate-500 mb-3">Index Validator</h4>
          {indexResults.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] py-1">
              <span className="font-bold">{r.store}</span>
              {r.status === 'VALID' ? (
                <CheckBadgeIcon className="w-4 h-4 text-emerald-500" />
              ) : (
                <ExclamationCircleIcon className="w-4 h-4 text-amber-500" />
              )}
            </div>
          ))}
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
          <h4 className="text-[9px] font-bold uppercase text-slate-500 mb-3">
            Offline-First Status
          </h4>
          {offlineStatus && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold">
                Sync Queue Pending: {offlineStatus.syncQueuePending}
              </span>
              <span
                className={`text-[10px] font-bold ${offlineStatus.status === 'HEALTHY' ? 'text-emerald-500' : 'text-amber-500'}`}
              >
                {offlineStatus.status}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
