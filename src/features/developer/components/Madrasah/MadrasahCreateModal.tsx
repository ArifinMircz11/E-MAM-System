import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  BuildingLibraryIcon, 
  MapPinIcon, 
  GlobeAltIcon, 
  UserCircleIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { madrasahService } from '@/services/madrasahService';
import { getSecurityContext } from '@/core/security/contextHelper';
import { MadrasahCreateInput } from '@/features/madrasah/types';

interface MadrasahCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MadrasahCreateModal: React.FC<MadrasahCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<MadrasahCreateInput>({
    namaMadrasah: '',
    nsm: '',
    npsn: '',
    jenjang: 'MA',
    status: 'Negeri',
    provinsi: 'Kalimantan Selatan',
    kabupaten: 'Hulu Sungai Tengah',
    kecamatan: '',
    alamat: '',
    statusTenant: 'active',
    config: {
      activateAcademicYear: true,
      createFolderStructure: true,
      createMasterData: true,
      createDefaultCalendar: true,
      activateSync: true,
      activatePWA: true,
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKepalaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      kepalaMadrasah: {
        ...(prev.kepalaMadrasah || { nama: '', email: '' }),
        [name]: value
      }
    }));
  };

  const handleSubmit = async () => {
    const ctx = getSecurityContext();
    if (!ctx) return;
    setIsSubmitting(true);
    try {
      await madrasahService.createMadrasah(formData, ctx);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mendaftarkan madrasah');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-white dark:bg-[#090F1E] rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <BuildingLibraryIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Daftarkan Madrasah Baru
              </h2>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
                Modul Provisioning • Step {step} of 3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-8 py-4 bg-white dark:bg-[#090F1E] border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          {[
            { id: 1, label: 'Informasi Madrasah' },
            { id: 2, label: 'Informasi Tenant' },
            { id: 3, label: 'Kepala Madrasah' },
          ].map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s.id ? 'bg-indigo-600 text-white' : step > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {step > s.id ? <CheckIcon className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${step === s.id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {s.label}
              </span>
              {s.id < 3 && <div className="w-8 h-px bg-slate-100 dark:border-slate-800" />}
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">Nama Madrasah *</span>
                  <input
                    type="text"
                    name="namaMadrasah"
                    value={formData.namaMadrasah}
                    onChange={handleInputChange}
                    placeholder="Contoh: MAN 1 Hulu Sungai Tengah"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">NSM *</span>
                    <input
                      type="text"
                      name="nsm"
                      value={formData.nsm}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">NPSN *</span>
                    <input
                      type="text"
                      name="npsn"
                      value={formData.npsn}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">Jenjang *</span>
                    <select
                      name="jenjang"
                      value={formData.jenjang}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    >
                      <option value="RA">RA</option>
                      <option value="MI">MI</option>
                      <option value="MTs">MTs</option>
                      <option value="MA">MA</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">Status *</span>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    >
                      <option value="Negeri">Negeri</option>
                      <option value="Swasta">Swasta</option>
                    </select>
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">Alamat Lengkap *</span>
                  <textarea
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">Kabupaten/Kota</span>
                    <input
                      type="text"
                      name="kabupaten"
                      value={formData.kabupaten}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">Kecamatan</span>
                    <input
                      type="text"
                      name="kecamatan"
                      value={formData.kecamatan}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-indigo-500 tracking-wide">Identitas Digital</h4>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block text-indigo-500 tracking-wide">Subdomain Madrasah</span>
                    <div className="flex items-center">
                      <input
                        type="text"
                        name="subdomain"
                        value={formData.subdomain || formData.npsn}
                        onChange={handleInputChange}
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-l-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      />
                      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-r-2xl border border-l-0 border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-500">
                        .emam.id
                      </div>
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">Status Tenant</span>
                    <select
                      name="statusTenant"
                      value={formData.statusTenant}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </label>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-indigo-500 tracking-wide">Provisioning Automation</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { key: 'activateAcademicYear', label: 'Aktifkan Tahun Ajaran Default' },
                      { key: 'createFolderStructure', label: 'Buat Struktur Folder Storage' },
                      { key: 'createMasterData', label: 'Inisialisasi Master Data Dasar' },
                      { key: 'createDefaultCalendar', label: 'Buat Kalender Akademik Dasar' },
                      { key: 'activateSync', label: 'Aktifkan Sinkronisasi Cloud' },
                    ].map((cfg) => (
                      <label key={cfg.key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={(formData.config as any)[cfg.key]}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            config: { ...prev.config, [cfg.key]: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cfg.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <UserCircleIcon className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Admin Utama (Kepala Madrasah)</h3>
                <p className="text-xs text-slate-500">Sistem akan otomatis membuat akun Administrator dengan role Kepala Madrasah.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">Nama Lengkap</span>
                  <div className="relative">
                    <UserCircleIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="nama"
                      value={formData.kepalaMadrasah?.nama || ''}
                      onChange={handleKepalaChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">NIP (Opsional)</span>
                  <div className="relative">
                    <ShieldCheckIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="nip"
                      value={formData.kepalaMadrasah?.nip || ''}
                      onChange={handleKepalaChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">Alamat Email *</span>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.kepalaMadrasah?.email || ''}
                      onChange={handleKepalaChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5 block">Nomor HP / WhatsApp</span>
                  <div className="relative">
                    <DevicePhoneMobileIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.kepalaMadrasah?.phone || ''}
                      onChange={handleKepalaChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </label>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl">
                <div className="flex gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium uppercase tracking-wider">
                    Pastikan email benar. Password default akan dikirimkan ke email tersebut. Akun ini akan memiliki wewenang penuh (Admin) di tenant madrasah ini.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-100 transition-all"
          >
            {step === 1 ? 'Batalkan' : 'Sebelumnya'}
          </button>
          
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wide shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {step < 3 ? 'Lanjutkan' : 'Daftarkan Sekarang'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
