import React from 'react';
import type { LetterRequest, LetterStatus } from '@/types';
import { UserRole } from '@/types';
import WorkflowTimeline from './WorkflowTimeline';
import { QRCodeSVG } from 'qrcode.react';
import {
  SparklesIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  EyeIcon,
  PrinterIcon,
} from '@/shared/Icons';

interface LetterDetailViewProps {
  selectedLetter: LetterRequest;
  userRole: UserRole;
  isTU: boolean;
  isValidator: boolean;
  isSigner: boolean;
  letterNumber: string;
  setLetterNumber: (val: string) => void;
  handleUpdateStatus: (newStatus: LetterStatus) => void;
  onOpenPreview: () => void;
}

export const LetterDetailView: React.FC<LetterDetailViewProps> = ({
  selectedLetter,
  userRole,
  isTU,
  isValidator,
  isSigner,
  letterNumber,
  setLetterNumber,
  handleUpdateStatus,
  onOpenPreview,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white text-base">
            {selectedLetter.type}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {selectedLetter.description}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400 block text-[9px] font-bold uppercase">
                Nama Pemohon
              </span>
              <span className="font-semibold">{selectedLetter.userName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-bold uppercase">
                Waktu Pengiriman
              </span>
              <span className="font-semibold">
                {(() => {
                  try {
                    return (
                      new Date(selectedLetter.date || '').toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }) + ' WIB'
                    );
                  } catch (e) {
                    return selectedLetter.date || '-';
                  }
                })()}
              </span>
            </div>
            {selectedLetter.className && (
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">
                  Kelas / Rombel
                </span>
                <span className="font-semibold">{selectedLetter.className}</span>
              </div>
            )}
            {selectedLetter.waliKelas && (
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">
                  Wali Kelas
                </span>
                <span className="font-semibold">{selectedLetter.waliKelas}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
              ID: {selectedLetter.id}
            </span>
            {selectedLetter.letterNumber && (
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-1 rounded font-mono font-bold border border-indigo-100 dark:border-indigo-800">
                {selectedLetter.letterNumber}
              </span>
            )}
          </div>
        </div>
        {selectedLetter.status === 'Signed' && (
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <QRCodeSVG
              value={`e-Mam System-VALID-${selectedLetter.digitalSignatureHash}`}
              size={64}
            />
          </div>
        )}
      </div>

      <WorkflowTimeline
        letter={selectedLetter}
        isTU={isTU}
        isValidator={isValidator}
        isSigner={isSigner}
      />

      {/* Wali Kelas Approval */}
      {userRole === UserRole.WALI_KELAS &&
        ['Pending', 'Proses'].includes(selectedLetter.status) &&
        (selectedLetter.type.toLowerCase().includes('sakit') ||
          selectedLetter.type.toLowerCase().includes('izin') ||
          selectedLetter.type.toLowerCase().includes('ijin')) && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-3 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4" /> Tindakan Wali Kelas
            </h5>
            <p className="text-xs text-emerald-600/80 mb-3">
              Setujui untuk memasukkan ke presensi kehadiran.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus('Signed')}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none"
              >
                Setujui (Approve)
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Ditolak')}
                className="px-4 bg-red-100 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-200"
              >
                Tolak
              </button>
            </div>
          </div>
        )}

      {/* Tata Usaha Processing */}
      {isTU && ['Pending', 'Proses'].includes(selectedLetter.status) && (
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
          <h5 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase mb-3 flex items-center gap-2">
            <BriefcaseIcon className="w-4 h-4" /> Tindakan Tata Usaha
          </h5>
          <div className="space-y-3">
            {selectedLetter.status === 'Pending' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('Proses')}
                className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" /> Tandai Sedang Diproses
              </button>
            )}
            <input
              type="text"
              value={letterNumber}
              onChange={(e) => setLetterNumber(e.target.value)}
              placeholder="Input Nomor Surat Resmi (Wajib)"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus('Verified')}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-orange-700"
              >
                Verifikasi & Teruskan
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Ditolak')}
                className="px-4 bg-red-100 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-200"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technical Validator */}
      {isValidator && selectedLetter.status === 'Verified' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
          <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-3 flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4" /> Validasi Teknis
          </h5>
          <p className="text-xs text-blue-600/80 mb-3">
            Pastikan isi surat sesuai dengan ketentuan madrasah.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleUpdateStatus('Validated')}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700"
            >
              Validasi Surat
            </button>
            <button
              type="button"
              onClick={() => handleUpdateStatus('Ditolak')}
              className="px-4 bg-red-100 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-200"
            >
              Kembalikan
            </button>
          </div>
        </div>
      )}

      {/* Signer Final Approval */}
      {isSigner && selectedLetter.status === 'Validated' && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-3 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" /> Pengesahan Akhir
          </h5>
          <p className="text-xs text-emerald-600/80 mb-3">
            Bubuhkan tanda tangan digital (QR Code) untuk mengesahkan.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleUpdateStatus('Signed')}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              Tanda Tangani Digital
            </button>
            <button
              type="button"
              onClick={() => handleUpdateStatus('Ditolak')}
              className="px-4 bg-red-100 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-200"
            >
              Tolak
            </button>
          </div>
        </div>
      )}

      {/* Signed Actions */}
      {selectedLetter.status === 'Signed' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenPreview}
            className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 border border-indigo-100"
          >
            <EyeIcon className="w-4 h-4" /> Preview Full Frame
          </button>
          <button
            type="button"
            onClick={onOpenPreview}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <PrinterIcon className="w-4 h-4" /> Print / Export PDF
          </button>
        </div>
      )}

      {selectedLetter.status === 'Ditolak' && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm font-bold border border-red-100">
          Permohonan Ditolak
        </div>
      )}
    </div>
  );
};

export default LetterDetailView;
