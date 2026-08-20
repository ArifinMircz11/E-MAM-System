import React from 'react';
import {
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  InfoIcon,
} from '@/shared/Icons';
import { DevActionButton } from './DevActionButton';

interface DevTabAuditTestProps {
  isRepairing?: boolean;
  handleAuditReports?: () => Promise<void>;
  handleAuditQRScanner?: () => Promise<void>;
  handleAuditPoints?: () => Promise<void>;
  handleAuditLetters?: () => Promise<void>;
  handleAuditSync?: () => Promise<void>;
  auditLogs?: string[];
}

export const DevTabAuditTest: React.FC<DevTabAuditTestProps> = ({
  isRepairing = false,
  handleAuditReports = async () => {},
  handleAuditQRScanner = async () => {},
  handleAuditPoints = async () => {},
  handleAuditLetters = async () => {},
  handleAuditSync = async () => {},
  auditLogs = [],
}) => {
  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full pb-32 custom-scrollbar space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl max-w-4xl space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Audit & Validasi Arsitektur v2.0
                </h3>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  Toolbox khusus untuk memvalidasi alur bisnis, integrasi Offline-First, dan
                  konsistensi data lintas modul.
                </p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] font-bold uppercase">
              Developer Mode
            </div>
          </div>
        </div>

        {/* Audit Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attendance & Reports Audit */}
          <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-rose-500" />
              <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Presensi & Laporan
              </h4>
            </div>
            <p className="text-[9px] font-medium text-slate-500 leading-relaxed">
              Memvalidasi integritas data kehadiran antara IndexedDB dan Firestore. Mengecek alur
              perhitungan laporan bulanan.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <DevActionButton
                label="Audit Scanner"
                onAction={handleAuditQRScanner}
                disabled={isRepairing}
                icon={<ShieldCheckIcon className="w-3 h-3" />}
              />
              <DevActionButton
                label="Audit Laporan"
                onAction={handleAuditReports}
                disabled={isRepairing}
                icon={<ClipboardDocumentListIcon className="w-3 h-3" />}
              />
            </div>
          </div>

          {/* Points & Letters Audit */}
          <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <StarIcon className="w-4 h-4 text-amber-500" />
              <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Poin & Persuratan
              </h4>
            </div>
            <p className="text-[9px] font-medium text-slate-500 leading-relaxed">
              Validasi poin otomatis (kedisiplinan) dan status surat (Izin/Sakit) pada alur
              sinkronisasi.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <DevActionButton
                label="Audit Poin"
                onAction={handleAuditPoints}
                disabled={isRepairing}
                icon={<StarIcon className="w-3 h-3" />}
              />
              <DevActionButton
                label="Audit Surat"
                onAction={handleAuditLetters}
                disabled={isRepairing}
                icon={<ClipboardDocumentListIcon className="w-3 h-3" />}
              />
            </div>
          </div>

          {/* Sync Engine Audit */}
          <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="w-4 h-4 text-indigo-500" />
              <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Sync Engine & Offline State
              </h4>
            </div>
            <p className="text-[9px] font-medium text-slate-500 leading-relaxed">
              Mengecek antrian sinkronisasi (Sync Queue), status penyelarasan data induk, dan versi
              master data.
            </p>
            <DevActionButton
              label="Jalankan Diagnostik Sync Engine"
              onAction={handleAuditSync}
              disabled={isRepairing}
              variant="primary"
              icon={<ArrowPathIcon className={`w-4 h-4 ${isRepairing ? 'animate-spin' : ''}`} />}
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Console */}
      <div className="bg-[#040815] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-w-4xl h-[400px]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <CommandLineIcon className="w-4 h-4 text-emerald-500" />
            <h4 className="text-[10px] font-bold uppercase tracking-wide text-white">
              Live Audit Output
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-bold text-emerald-500 uppercase ">
              Monitoring Active
            </span>
          </div>
        </div>
        <div className="flex-1 p-6 font-mono text-[10px] overflow-y-auto custom-scrollbar-dark space-y-1.5">
          {auditLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
              <InfoIcon className="w-8 h-8 text-white" />
              <p className="uppercase tracking-wide font-bold">Waiting for Audit Trigger...</p>
            </div>
          ) : (
            auditLogs.map((log, idx) => {
              const isError = log.includes('ERROR') || log.includes('FAILED');
              const isSuccess = log.includes('SUCCESS') || log.includes('VALID');
              const isWarning = log.includes('WARNING');

              return (
                <div key={idx} className="flex gap-3 group">
                  <span className="text-slate-600 shrink-0 select-none">
                    {(auditLogs.length - idx).toString().padStart(3, '0')}
                  </span>
                  <p
                    className={`
                                        ${isError ? 'text-rose-400 font-bold' : ''}
                                        ${isSuccess ? 'text-emerald-400 font-bold' : ''}
                                        ${isWarning ? 'text-amber-400 font-bold' : ''}
                                        ${!isError && !isSuccess && !isWarning ? 'text-slate-300' : ''}
                                    `}
                  >
                    {log}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Mock Icon for CommandLine
const CommandLineIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
    />
  </svg>
);
