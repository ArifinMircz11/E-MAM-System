import React, { useState } from 'react';
import Layout from '@/layouts/Layout';
import { ShieldCheckIcon } from '@/shared/Icons';
import { AuditQRScanner } from './AuditQRScanner';
import { AuditStudentAttendance } from './AuditStudentAttendance';
import { AuditReports } from './AuditReports';
import { AuditPoints } from './AuditPoints';
import { AuditLetters } from './AuditLetters';
import { AuditClassReport } from './AuditClassReport';
import { AuditSimulationConsole } from './AuditSimulationConsole';
import { AuditRBACDashboard } from './AuditRBACDashboard';

interface SystemAuditMainProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
}

const SystemAuditMain: React.FC<SystemAuditMainProps> = ({ onBack, onOpenSidebar }) => {
  const [activeTab, setActiveTab] = useState<'data' | 'rbac'>('data');

  return (
    <Layout
      title="Audit & Validasi Sistem"
      subtitle="Integritas Arsitektur & Data"
      icon={ShieldCheckIcon}
      onBack={onBack}
      onOpenSidebar={onOpenSidebar}
      withBottomNav={true}
    >
      <div className="p-4 md:p-6 space-y-8 max-w-6xl mx-auto pb-32">
        {/* Header Card */}
        <div className="bg-[#020617] rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-full backdrop-blur-md border border-indigo-500/20">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-300">
                  Enterprise Guard
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                  Pusat Validasi Mandiri
                </h2>
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed max-w-lg">
                  Jalankan audit komprehensif untuk memastikan seluruh alur bisnis — mulai dari
                  Presensi, Poin, hingga Persuratan — berjalan sesuai dengan blueprint arsitektur
                  Offline-First yang andal.
                </p>
              </div>
            </div>
            <div className="flex flex-row md:flex-col lg:flex-row items-center gap-4">
              <div className="p-4 bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-1.5 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Status Lokal
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                  <span className="text-sm font-bold text-white tracking-wide">SINKRON</span>
                </div>
              </div>
              <div className="p-4 bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-1.5 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Security
                </span>
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white tracking-wide">AKTIF</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px gap-2">
          <button
            onClick={() => setActiveTab('data')}
            className={`px-6 py-4 border-b-2 text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer transition-all ${
              activeTab === 'data'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-xl'
            }`}
          >
            Integritas Data & Layanan
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-6 py-4 border-b-2 text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer transition-all ${
              activeTab === 'rbac'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-xl'
            }`}
          >
            Audit RBAC & Keamanan
          </button>
        </div>

        {activeTab === 'data' ? (
          <div className="space-y-8 animate-fadeIn">
            {/* Audit Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-2">
                  Modul Presensi & Laporan
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <AuditQRScanner />
                  <AuditStudentAttendance />
                  <AuditReports />
                  <AuditSimulationConsole />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-2">
                  Modul Poin & Persuratan
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <AuditPoints />
                  <AuditLetters />
                </div>
              </div>
            </div>

            {/* Detailed Table Report */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-2">
                Data Integrity Report (By Class)
              </h3>
              <AuditClassReport />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            <AuditRBACDashboard />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SystemAuditMain;
