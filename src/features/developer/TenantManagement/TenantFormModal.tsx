import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  CalendarIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import type { TenantData } from '@/types';
import { useOrganizations } from '@/hooks/useTenants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tenant: TenantData | null;
  isSubmitting: boolean;
}

const TenantFormModal: React.FC<Props> = ({ isOpen, onClose, tenant, isSubmitting }) => {
  const { create, update } = useOrganizations();
  const [id, setId] = useState('');
  const [formData, setFormData] = useState<Partial<TenantData>>({
    identitas: {
      namaMadrasah: '',
      npsn: '',
      alamat: '',
    },
    konfigurasiSistem: {
      tahunAjaranAktif: '2024/2025',
      semesterAktif: 'Ganjil',
      isMaintenance: false,
    },
  });

  useEffect(() => {
    if (tenant) {
      setId(tenant.id || '');
      setFormData(tenant);
    } else {
      setId('');
      setFormData({
        identitas: {
          namaMadrasah: '',
          npsn: '',
          alamat: '',
        },
        konfigurasiSistem: {
          tahunAjaranAktif: '2024/2025',
          semesterAktif: 'Ganjil',
          isMaintenance: false,
        },
      });
    }
  }, [tenant, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tenant) {
        await update(id, formData);
      } else {
        if (!id) return alert('Silakan masukkan ID Tenant unik');
        await create(id, formData);
      }
      onClose();
    } catch (err) {
      // Error handled in hook
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                {tenant ? 'Edit Madrasah' : 'Tambah Madrasah Baru'}
              </h2>
              <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1 tracking-wide">
                Global Infrastructure Configuration
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">
                  ID Tenant (Numeric/NPSN)
                </label>
                <div className="relative">
                  <CommandLineIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/50" />
                  <input
                    type="text"
                    disabled={!!tenant}
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    placeholder="Contoh: 30315537"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">
                  Nama Madrasah
                </label>
                <div className="relative">
                  <BuildingOfficeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/50" />
                  <input
                    type="text"
                    value={formData.identitas?.namaMadrasah}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identitas: { ...formData.identitas!, namaMadrasah: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="Nama Madrasah..."
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">
                Alamat Lengkap
              </label>
              <div className="relative">
                <GlobeAltIcon className="absolute left-4 top-5 w-5 h-5 text-indigo-500/50" />
                <textarea
                  value={formData.identitas?.alamat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identitas: { ...formData.identitas!, alamat: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-28 transition-all"
                  placeholder="Jl. Ahmad Yani No. 1..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">
                  Tahun Ajaran Aktif
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/50" />
                  <select
                    value={formData.konfigurasiSistem?.tahunAjaranAktif}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        konfigurasiSistem: {
                          ...formData.konfigurasiSistem!,
                          tahunAjaranAktif: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none transition-all cursor-pointer"
                  >
                    <option value="2023/2024">2023/2024</option>
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">
                  Semester Aktif
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/50" />
                  <select
                    value={formData.konfigurasiSistem?.semesterAktif}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        konfigurasiSistem: {
                          ...formData.konfigurasiSistem!,
                          semesterAktif: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none transition-all cursor-pointer"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-wide shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : tenant ? (
                  'Simpan Perubahan'
                ) : (
                  'Deploy Tenant Baru'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default TenantFormModal;
