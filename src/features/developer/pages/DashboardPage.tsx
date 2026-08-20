import React from 'react';
import { Users, Building2, Shield, Database, RefreshCw, Activity, Cpu, CheckCircle, Server, AlertCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const stats = [
    { title: 'Total Tenants', value: '14 Active', icon: Building2, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { title: 'Registered Users', value: '1,248 Users', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { title: 'Pending Queue', value: '0 Sync Pending', icon: RefreshCw, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { title: 'Architecture Score', value: '100% P0 Clean', icon: Shield, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-[#0B1121] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide text-indigo-300 mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>IMAM System Enterprise Core v2.0</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Developer Dashboard Enterprise
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Pusat kendali arsitektur offline-first, multi-tenant synchronization, identity center, dan pemantauan sistem terpadu.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0 border border-current/10`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 truncate">
                  {stat.title}
                </p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {stat.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#0B1121] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Status Sinkronisasi & Dexie Engine</span>
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">IndexedDB (Dexie Operational Database)</h4>
                <p className="text-[11px] text-slate-500">Local-First storage active & healthy</p>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Operational</span>
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Firestore Cloud Gateway (Source of Truth)</h4>
                <p className="text-[11px] text-slate-500">Delta sync & backup channel active</p>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Enterprise Guard</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Seluruh akses database operasional melalui Dexie Repository dengan pemisahan multi-tenant yang ketat.
            </p>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>P0 / P1 Architecture Rules Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
