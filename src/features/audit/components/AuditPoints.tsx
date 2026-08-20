import React, { useState, useEffect } from 'react';
import { StarIcon, ArrowPathIcon, Loader2, CheckCircleIcon } from '@/shared/Icons';
import { auditService } from '@/services/auditService';
import { useAuthStore } from '@/stores/authStore';
import { classRepository } from '@/repositories/classRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

export const AuditPoints: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId || '';
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');

  useEffect(() => {
    classRepository.getByTenant(getSecurityContext(), tenantId).then(setClasses);
  }, [tenantId]);

  const runAudit = async () => {
    setStatus('running');
    setLogs([]);
    const success = await auditService.auditPoints(tenantId, (msg) => {
      setLogs((prev) => [...prev, msg]);
    });
    setStatus(success ? 'success' : 'failed');
  };

  return (
    <div className="p-6 md:p-8 bg-white dark:bg-[#0f172a]/50 backdrop-blur-md rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
            <StarIcon className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
              Audit Poin
            </h4>
            <p className="text-[10px] font-bold text-slate-400">Validasi Point Engine & Kategori</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runAudit}
            disabled={status === 'running'}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all flex items-center gap-2"
          >
            {status === 'running' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ArrowPathIcon className="w-3 h-3" />
            )}
            Jalankan Audit
          </button>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 min-h-[100px] max-h-[200px] overflow-y-auto font-mono text-[9px] space-y-1 custom-scrollbar">
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-30 italic text-slate-400">
            Belum ada log audit...
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-slate-500">{i + 1}</span>
            <span
              className={
                log.includes('ERROR')
                  ? 'text-rose-500'
                  : log.includes('SUCCESS')
                    ? 'text-emerald-500'
                    : 'text-slate-400'
              }
            >
              {log}
            </span>
          </div>
        ))}
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase">
          <CheckCircleIcon className="w-4 h-4" />
          Mesin Poin OK
        </div>
      )}
    </div>
  );
};
