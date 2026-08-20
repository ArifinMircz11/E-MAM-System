import React, { useRef } from 'react';
import { FileSpreadsheet, Download, Upload, Sparkles, Database } from 'lucide-react';
import { PermissionChecker } from '@/services/PermissionChecker';

interface StudentDataExportImportProps {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  onOpenBulkUpload: () => void;
  onRepair: () => void;
  isRepairing: boolean;
  canManage: boolean;
}

export const StudentDataExportImport: React.FC<StudentDataExportImportProps> = ({
  onExport,
  onImport,
  onDownloadTemplate,
  onOpenBulkUpload,
  onRepair,
  isRepairing,
  canManage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!canManage) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onImport}
        accept=".xlsx, .xls"
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2 sm:px-3.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
        title="Import Data dari Excel"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden lg:inline">IMPORT EXCEL</span>
      </button>

      {PermissionChecker.can('student.create') && (
        <button
          onClick={onOpenBulkUpload}
          className="p-2 sm:px-3.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
          title="Bulk Upload Siswa (Offline-First Validated)"
        >
          <Database className="w-4 h-4" />
          <span className="hidden lg:inline">BULK UPLOAD</span>
        </button>
      )}

      <button
        onClick={onDownloadTemplate}
        className="p-2 sm:px-3.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
        title="Download Template Excel"
      >
        <Download className="w-4 h-4" />
        <span className="hidden lg:inline">TEMPLATE</span>
      </button>

      <button
        onClick={onExport}
        className="p-2 sm:px-3.5 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-xl hover:bg-sky-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
        title="Export Data Siswa ke Excel"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span className="hidden lg:inline">EXPORT EXCEL</span>
      </button>

      <button
        onClick={onRepair}
        disabled={isRepairing}
        className="p-2 sm:px-3.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-xs font-bold disabled:opacity-50"
        title="Perbaiki & Lengkapi Data Kosong"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden lg:inline">{isRepairing ? 'MEMPERBAIKI...' : 'REPAIR DATA'}</span>
      </button>
    </div>
  );
};
