import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuildingLibraryIcon, XMarkIcon, CheckCircleIcon } from '@/shared/Icons';
import { KanwilDashboardService } from '../services/kanwilDashboardService';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const AssignmentRequestModal: React.FC<Props> = ({ isOpen, onClose, user }) => {
  const [satuanKerja, setSatuanKerja] = useState('Kankemenag Kota Banjarmasin');
  const [jenjang, setJenjang] = useState<'MA' | 'MTs' | 'MI'>('MA');
  const [madrasahName, setMadrasahName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!madrasahName.trim()) {
      toast.error('Mohon masukkan nama madrasah tujuan penugasan');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = Date.now();
      const requestPayload = {
        id: `req_${now}_${Math.random().toString(36).substring(2, 7)}`,
        tenantId: 'kanwil_kalsel',
        userId: user?.uid || 'guest_user',
        userName: user?.displayName || user?.email || 'Pengguna',
        userEmail: user?.email || '',
        satuanKerjaId: satuanKerja,
        satuanKerjaName: satuanKerja,
        jenjang,
        madrasahId: madrasahName.toLowerCase().replace(/\s+/g, '_'),
        madrasahName,
        status: 'pending',
        requestedAt: now,
        createdAt: now,
        updatedAt: now,
        version: 1,
        syncStatus: 'pending'
      };

      await KanwilDashboardService.submitAssignmentRequest(requestPayload);

      toast.success('Ajuan penugasan berhasil dikirim. Menunggu verifikasi Kanwil/Kankemenag.');
      onClose();
    } catch (err: any) {
      console.error('Error submitting assignment request:', err);
      toast.error('Gagal mengirim ajuan penugasan: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <BuildingLibraryIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Ajukan Penugasan
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                  Kanwil Kemenag Prov. Kalimantan Selatan
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                Satuan Kerja Kabupaten / Kota
              </label>
              <select
                value={satuanKerja}
                onChange={(e) => setSatuanKerja(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Kankemenag Kota Banjarmasin">Kankemenag Kota Banjarmasin</option>
                <option value="Kankemenag Kab. Banjar">Kankemenag Kab. Banjar</option>
                <option value="Kankemenag Kab. Barito Kuala">Kankemenag Kab. Barito Kuala</option>
                <option value="Kankemenag Kab. Balangan">Kankemenag Kab. Balangan</option>
                <option value="Kankemenag Kab. Tapin">Kankemenag Kab. Tapin</option>
                <option value="Kankemenag Kab. Hulu Sungai Selatan">Kankemenag Kab. Hulu Sungai Selatan</option>
                <option value="Kankemenag Kab. Hulu Sungai Tengah">Kankemenag Kab. Hulu Sungai Tengah</option>
                <option value="Kankemenag Kab. Hulu Sungai Utara">Kankemenag Kab. Hulu Sungai Utara</option>
                <option value="Kankemenag Kab. Tabalong">Kankemenag Kab. Tabalong</option>
                <option value="Kankemenag Kab. Tanah Laut">Kankemenag Kab. Tanah Laut</option>
                <option value="Kankemenag Kab. Tanah Bumbu">Kankemenag Kab. Tanah Bumbu</option>
                <option value="Kankemenag Kab. Kotabaru">Kankemenag Kab. Kotabaru</option>
                <option value="Kankemenag Kab. Barito Timur">Kankemenag Kab. Barito Timur</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                Jenjang Madrasah
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['MI', 'MTs', 'MA'] as const).map((level) => (
                  <button key={level} type="button" onClick={() => setJenjang(level)} className={`py-3 rounded-xl text-xs font-bold border ${jenjang === level ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                Nama Madrasah Tujuan
              </label>
              <input
                type="text"
                value={madrasahName}
                onChange={(e) => setMadrasahName(e.target.value)}
                placeholder="Contoh: MAN 1 Hulu Sungai Tengah"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <CheckCircleIcon className="w-4 h-4" />
              {isSubmitting ? 'Mengirim...' : 'Kirim Ajuan Penugasan'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
