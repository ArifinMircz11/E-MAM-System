import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SubmitConfirmModalProps {
  type: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  type,
  onClose,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B1121] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-2">
          Konfirmasi Pengajuan
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          Apakah Anda yakin ingin mengajukan <strong>{type}</strong>? Pastikan alasan dan identitas
          data yang diisi telah sesuai.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/15 transition-all active:scale-95"
          >
            Ya, Kirim
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitConfirmModal;
