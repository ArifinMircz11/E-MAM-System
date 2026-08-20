import React, { useState } from 'react';
import { MadrasahCreateInput } from '../types';
import { Button } from '@/components/ui/Button';
import { 
  XMarkIcon, 
  BuildingLibraryIcon, 
  UserIcon, 
  CogIcon,
  CheckIcon
} from '@/shared/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface MadrasahFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MadrasahCreateInput) => Promise<void>;
}

export const MadrasahForm: React.FC<MadrasahFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<MadrasahCreateInput>({
    namaMadrasah: '',
    nsm: '',
    npsn: '',
    jenjang: 'MTs',
    status: 'Negeri',
    provinsi: 'Kalimantan Selatan',
    kabupaten: 'Hulu Sungai Tengah',
    kecamatan: '',
    kelurahan: '',
    alamat: '',
    kodePos: '',
    statusTenant: 'active',
    subdomain: '',
    kepalaMadrasah: {
      nama: '',
      email: '',
      nip: '',
      phone: ''
    },
    config: {
      activateAcademicYear: true,
      createFolderStructure: true,
      createMasterData: true,
      createDefaultCalendar: true,
      activateSync: true,
      activatePWA: true
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as Record<string, any>)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleConfigChange = (key: keyof MadrasahCreateInput['config']) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: !prev.config[key]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BuildingLibraryIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tambah Madrasah Baru</h3>
              <p className="text-xs text-slate-500">Pendaftaran madrasah sebagai tenant baru sistem.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
            <XMarkIcon className="w-6 h-6" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Step Indicators */}
          <div className="flex items-center gap-2 mb-8">
            {[
              { id: 1, label: 'Informasi Madrasah', icon: BuildingLibraryIcon },
              { id: 2, label: 'Kepala & Tenant', icon: UserIcon },
              { id: 3, label: 'Konfigurasi', icon: CogIcon }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex-1 flex items-center gap-2 p-2 rounded-xl border transition-all ${
                  step === s.id 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
                  : 'bg-white border-slate-100 text-slate-400 dark:bg-slate-950 dark:border-slate-800'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${step === s.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <s.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="space-y-2 col-span-full">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Madrasah *</label>
                  <input 
                    required
                    name="namaMadrasah"
                    value={formData.namaMadrasah}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="Masukkan nama lengkap madrasah..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">NSM *</label>
                  <input 
                    required
                    name="nsm"
                    value={formData.nsm}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-mono"
                    placeholder="Nomor Statistik Madrasah"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">NPSN *</label>
                  <input 
                    required
                    name="npsn"
                    value={formData.npsn}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-mono"
                    placeholder="Nomor Pokok Sekolah Nasional"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jenjang *</label>
                  <select 
                    name="jenjang"
                    value={formData.jenjang}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="RA">RA (Raudhatul Athfal)</option>
                    <option value="MI">MI (Madrasah Ibtidaiyah)</option>
                    <option value="MTs">MTs (Madrasah Tsanawiyah)</option>
                    <option value="MA">MA (Madrasah Aliyah)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status *</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="Negeri">Negeri</option>
                    <option value="Swasta">Swasta</option>
                  </select>
                </div>

                <div className="space-y-2 col-span-full">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat Lengkap</label>
                  <textarea 
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="Jalan, No, RT/RW..."
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-emerald-600" />
                    Informasi Kepala Madrasah (Opsional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                      <input 
                        name="kepalaMadrasah.nama"
                        value={formData.kepalaMadrasah?.nama}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                        placeholder="Nama Kepala"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email (Untuk Login)</label>
                      <input 
                        name="kepalaMadrasah.email"
                        type="email"
                        value={formData.kepalaMadrasah?.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                        placeholder="kamad@example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NIP</label>
                      <input 
                        name="kepalaMadrasah.nip"
                        value={formData.kepalaMadrasah?.nip}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-mono"
                        placeholder="19xxxxxxxxxxxx"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <BuildingLibraryIcon className="w-4 h-4 text-emerald-600" />
                    Informasi Tenant
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subdomain</label>
                      <div className="flex items-center gap-2">
                        <input 
                          name="subdomain"
                          value={formData.subdomain}
                          onChange={handleChange}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                          placeholder="npsn"
                        />
                        <span className="text-xs text-slate-400">.emam.app</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Tenant</label>
                      <select 
                        name="statusTenant"
                        value={formData.statusTenant}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                        <option value="maintenance">Pemeliharaan</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 mb-6">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Konfigurasi awal akan otomatis dijalankan setelah madrasah berhasil disimpan.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'activateAcademicYear', label: 'Aktifkan Tahun Ajaran', desc: 'Membuat tahun ajaran aktif 2026/2027' },
                    { key: 'createFolderStructure', label: 'Struktur Folder', desc: 'Menyiapkan repositori dokumen digital' },
                    { key: 'createMasterData', label: 'Data Master Dasar', desc: 'Menyiapkan referensi tingkat & kategori' },
                    { key: 'createDefaultCalendar', label: 'Kalender Akademik', desc: 'Menyiapkan jadwal libur & agenda standar' },
                    { key: 'activateSync', label: 'Aktifkan Sinkronisasi', desc: 'Menghubungkan ke Cloud Firestore' },
                    { key: 'activatePWA', label: 'Aktifkan PWA', desc: 'Memungkinkan instalasi di perangkat mobile' }
                  ].map((cfg) => (
                    <button
                      key={cfg.key}
                      type="button"
                      onClick={() => handleConfigChange(cfg.key as any)}
                      className={`flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${
                        formData.config[cfg.key as keyof typeof formData.config]
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        formData.config[cfg.key as keyof typeof formData.config]
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}>
                        {formData.config[cfg.key as keyof typeof formData.config] && <CheckIcon className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{cfg.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{cfg.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(prev => prev - 1)} disabled={loading}>
                Kembali
              </Button>
            )}
            {step < 3 ? (
              <Button className="bg-slate-800 text-white hover:bg-slate-700" onClick={() => setStep(prev => prev + 1)}>
                Lanjut
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
              >
                {loading ? 'Menyimpan...' : 'Simpan Madrasah'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
