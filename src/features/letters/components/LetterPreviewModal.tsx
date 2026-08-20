import React from 'react';
import type { LetterRequest, MadrasahData } from '@/types';
import LetterPreview from '../LetterPreview';
import { PrinterIcon, XCircleIcon } from '@/shared/Icons';

interface LetterPreviewModalProps {
  letter: LetterRequest;
  madrasah: MadrasahData;
  onClose: () => void;
}

export const LetterPreviewModal: React.FC<LetterPreviewModalProps> = ({
  letter,
  madrasah,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2 text-xs"
        >
          <PrinterIcon className="w-4 h-4" /> Print / Export PDF
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-all"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="w-full h-full overflow-y-auto p-4 md:p-10 flex justify-center items-start">
        <div className="transform origin-top scale-[0.8] md:scale-100 mb-20 shadow-2xl print:scale-100 print:shadow-none print-only">
          <LetterPreview letter={letter} madrasah={madrasah} />
        </div>
      </div>
    </div>
  );
};

export default LetterPreviewModal;
