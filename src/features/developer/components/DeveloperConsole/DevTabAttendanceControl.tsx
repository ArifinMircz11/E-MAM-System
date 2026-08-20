import React from 'react';
import { ClipboardDocumentListIcon, TrashIcon, ArrowDownTrayIcon } from '@/shared/Icons';
import { DevActionButton } from './DevActionButton';

import { useDevConsoleContext } from '../../context/DeveloperContext';

interface DevTabAttendanceControlProps {
  clearMonth?: string;
  setClearMonth?: (val: string) => void;
  handleClearAttendanceByMonth?: () => Promise<void>;
  isRepairing?: boolean;
  handleExportAttendancePDF?: () => Promise<void>;
}

export const DevTabAttendanceControl: React.FC<DevTabAttendanceControlProps> = (props) => {
  const dev = useDevConsoleContext();

  const clearMonth = props.clearMonth ?? dev?.clearMonth ?? '';
  const setClearMonth = props.setClearMonth ?? dev?.setClearMonth ?? (() => {});
  const handleClearAttendanceByMonth = props.handleClearAttendanceByMonth ?? dev?.handleClearAttendanceByMonth ?? (async () => {});
  const isRepairing = props.isRepairing ?? dev?.isRepairing ?? false;
  const handleExportAttendancePDF = props.handleExportAttendancePDF ?? dev?.handleExportAttendancePDF ?? (async () => {});
  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full pb-32 custom-scrollbar space-y-6">
      <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl max-w-3xl space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5 text-pink-500" /> Absensi Validation
            Controller
          </h3>
          <p className="text-[10px] font-bold text-slate-500 mt-1">
            Mengontrol record kehadiran guru, siswa, mengosongkan log bulanan dan mengekspor
            cadangan PDF secara darurat.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/10 space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Pilih Bulan Tindakan
              </label>
              <input
                type="month"
                value={clearMonth}
                onChange={(e) => setClearMonth(e.target.value)}
                className="max-w-xs w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <DevActionButton
                label={`Hapus Semua Kehadiran Bulan ${clearMonth || '-'}`}
                icon={<TrashIcon className="w-3.5 h-3.5" />}
                variant="danger"
                confirmMessage={`Yakin hapus data bulan ${clearMonth}?`}
                onAction={handleClearAttendanceByMonth}
                disabled={!clearMonth || isRepairing}
              />

              <DevActionButton
                label="Download PDF Kehadiran"
                icon={<ArrowDownTrayIcon className="w-3.5 h-3.5 animate-bounce" />}
                variant="primary"
                onAction={handleExportAttendancePDF}
                disabled={!clearMonth || isRepairing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
