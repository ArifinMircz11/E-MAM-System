import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStudentBulkUpload } from '@/hooks/useStudentBulkUpload';
import {
  X,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CloudUpload,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentBulkUploadModal: React.FC<StudentBulkUploadModalProps> = ({
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
  } = useStudentBulkUpload();

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
  const hasCriticalErrors = invalidCount > 0;
  const progressPercent = previewRows.length > 0 ? Math.round((validCount / previewRows.length) * 100) : 0;

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
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Bulk Upload Data Siswa (Offline-First)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unggah file Excel (.xlsx / .csv) untuk memasukkan data siswa massal secara lokal (Dexie & Sync Queue).
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
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                {isParsing ? (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Memproses dan memvalidasi file...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FileUp className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Seret & letakkan file Excel atau CSV di sini, atau <span className="text-emerald-600 dark:text-emerald-400 underline">pilih file</span>
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-800 dark:text-white">Catatan Kolom <code className="bg-emerald-500/10 text-emerald-600 px-1 py-0.5 rounded font-mono">ID_UNIK</code>:</span> Kolom <code className="bg-emerald-500/10 text-emerald-600 px-1 py-0.5 rounded font-mono">ID_UNIK</code> digunakan sebagai kunci utama dokumen siswa. Jika ID tersebut sudah ada di database, data lama akan <strong className="text-slate-900 dark:text-white">ditimpa (overwritten)</strong> dengan data baru dari Excel.
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl transition-all border border-emerald-500/20 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Unduh Template Excel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/60 p-4 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    File: {fileName}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Total Baris: <strong className="text-slate-900 dark:text-white">{previewRows.length}</strong>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Valid: {validCount} ({progressPercent}%)
                    </span>
                    {invalidCount > 0 && (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-4 h-4" /> Error Kritis: {invalidCount}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={resetUpload}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
                >
                  Ganti File
                </button>
              </div>

              {/* Progress Bar & Status */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Progres Validasi Data</span>
                  <span>{progressPercent}% Valid</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${hasCriticalErrors ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {hasCriticalErrors && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    <strong>Peringatan Validasi:</strong> Ditemukan {invalidCount} baris dengan error kritis (Nama atau NISN kosong). Tombol unggah diblokir sampai baris yang error diperbaiki atau file diganti.
                  </p>
                </div>
              )}

              {/* Preview Table with Row Mapping */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-3">No. Baris</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">NISN</th>
                      <th className="p-3">JK</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Status Validasi & Error Mapping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {previewRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/30' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                      >
                        <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">#{row.rowNumber}</td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">
                          {row.namaLengkap || <span className="text-rose-500 italic">Kosong (Wajib)</span>}
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          {row.nisn || <span className="text-rose-500 italic">Kosong (Wajib)</span>}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{row.jenisKelamin}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{row.kelas}</td>
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400" title={row.errors.join(', ')}>
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Baris #{row.rowNumber}: {row.errors.join(', ')}
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
          <div className="text-xs text-slate-500">
            {previewRows.length > 0 && (
              <span>
                {hasCriticalErrors ? (
                  <strong className="text-rose-600">Unggah diblokir karena ada error kritis.</strong>
                ) : (
                  <span>Akan mengunggah <strong className="text-emerald-600">{validCount}</strong> baris valid ke Dexie.</span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetUpload();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            {previewRows.length > 0 && (
              <button
                disabled={isUploading || hasCriticalErrors || validCount === 0}
                onClick={handleUploadSubmit}
                title={hasCriticalErrors ? 'Perbaiki error pada baris sebelum mengunggah' : ''}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-55 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan ke Dexie...
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" /> Unggah {validCount} Siswa
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
