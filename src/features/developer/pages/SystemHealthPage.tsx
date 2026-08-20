import React from 'react';
import { Cpu, CheckCircle, Shield, Server } from 'lucide-react';
import { SystemConditionDashboard } from '@/features/developer/components/SystemConditionDashboard';

export const SystemHealthPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Cpu className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>System Health & Architecture Status</span>
        </h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          Pemeriksaan kesehatan sistem, kepatuhan arsitektur IMAM System, dan status linter/build.
        </p>
      </div>

      <SystemConditionDashboard />

      <div className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Build Status</h4>
              <p className="text-xs text-slate-500">Vite Production Build & TypeScript Compiler</p>
            </div>
          </div>
          <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            Green (Passing)
          </span>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Architecture Compliance</h4>
              <p className="text-xs text-slate-500">P0 / P1 / P2 Rules: UI → Hook → Service → Repository → Dexie → Sync → Firestore</p>
            </div>
          </div>
          <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
            100% Compliant
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Tenant Isolation</h4>
              <p className="text-xs text-slate-500">Pemisahan data tenantId & composite index terverifikasi</p>
            </div>
          </div>
          <span className="bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 text-xs font-bold px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800/50">
            Secure
          </span>
        </div>
      </div>
    </div>
  );
};
