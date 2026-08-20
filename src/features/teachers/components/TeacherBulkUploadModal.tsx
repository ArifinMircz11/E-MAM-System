import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTeacherBulkUpload } from '@/hooks/useTeacherBulkUpload';
import {
  X,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CloudUpload,
  Download,
  BriefcaseIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface TeacherBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherBulkUploadModal: React.FC<TeacherBulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    isParsing,
    isUploading,
    previewRows,
    fileName,
    parseFile,
    executeBulkUpload,
    resetUpload,
    downloadTemplate,
  } = useTeacherBulkUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        toast.error('Format file tidak didukung. Harap unggah file .xlsx, .xls, atau .csv');
        return;
      }
      parseFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    const success = await executeBulkUpload();
    if (success) {
      onSuccess();
      onClose();
      resetUpload();
    }
  };

  const validCount = previewRows.filter((r) => r.isValid).length;
  const invalidCount = previewRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Bulk Upload Data GTK (Guru & Tenaga Kependidikan)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unggah file Excel (.xlsx / .csv) untuk memasukkan data GTK massal secara lokal & offline-first.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetUpload();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {previewRows.length === 0 ? (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                {isParsing ? (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Memproses dan memvalidasi file GTK...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <FileUp className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Seret & letakkan file Excel atau CSV GTK di sini, atau <span className="text-indigo-600 dark:text-indigo-400 underline">pilih file</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Mendukung .xlsx, .xls, .csv (Maksimal 500 baris)
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Template Download Option */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                    <BriefcaseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      Butuh Template Excel GTK?
                    </h4>
                    <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                      Unduh template resmi format EMIS / Madrasah untuk memudahkan pengisian data guru.
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Unduh Template
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Baris</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{previewRows.length}</p>
                  </div>
                  <FileUp className="w-8 h-8 text-slate-400" />
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Data Valid</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{validCount}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Peringatan / Error</p>
                    <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{invalidCount}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
              </div>

              {/* File Info & Reset */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-xs">
                  File: <strong className="text-slate-900 dark:text-white">{fileName}</strong>
                </span>
                <button
                  onClick={resetUpload}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Pilih File Lain
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                    <tr>
                      <th className="p-3 font-bold">No</th>
                      <th className="p-3 font-bold">Nama Lengkap</th>
                      <th className="p-3 font-bold">NIP / ID</th>
                      <th className="p-3 font-bold">NUPTK</th>
                      <th className="p-3 font-bold">Jabatan</th>
                      <th className="p-3 font-bold">Status</th>
                      <th className="p-3 font-bold">Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {previewRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                      >
                        <td className="p-3 text-slate-500 font-mono">{row.rowNumber}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-white">{row.namaLengkap || '-'}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{row.nip || '-'}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{row.nuptk || '-'}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{row.jabatan || '-'}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{row.status || '-'}</td>
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-semibold" title={row.errors.join(', ')}>
                              <AlertTriangle className="w-3 h-3" /> {row.errors[0] || 'Invalid'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={() => {
              resetUpload();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          {previewRows.length > 0 && (
            <button
              onClick={handleUploadSubmit}
              disabled={isUploading || validCount === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all active:scale-95"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengunggah ({validCount} data)...
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  Impor {validCount} Data GTK
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
