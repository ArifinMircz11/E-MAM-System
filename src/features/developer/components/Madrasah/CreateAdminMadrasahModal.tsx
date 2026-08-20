import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { userRepository } from '@/repositories/userRepository';
import { UserRole } from '@/types/roles';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import {
  XMarkIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  BuildingLibraryIcon,
  EnvelopeIcon,
  KeyIcon,
  UserIcon,
  IdentificationIcon,
} from '@/shared/Icons';

interface CreateAdminMadrasahModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetMadrasah?: {
    tenantId: string;
    namaMadrasah: string;
    npsn?: string;
  } | null;
  allMadrasahs?: Array<{
    tenantId: string;
    namaMadrasah: string;
    npsn?: string;
  }>;
}

export const CreateAdminMadrasahModal: React.FC<CreateAdminMadrasahModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetMadrasah,
  allMadrasahs = [],
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [selectedNamaMadrasah, setSelectedNamaMadrasah] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('Madrasah2026!');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (targetMadrasah) {
      setSelectedTenantId(targetMadrasah.tenantId || targetMadrasah.npsn || '');
      setSelectedNamaMadrasah(targetMadrasah.namaMadrasah || '');
    } else if (allMadrasahs.length > 0) {
      setSelectedTenantId(allMadrasahs[0].tenantId || allMadrasahs[0].npsn || '');
      setSelectedNamaMadrasah(allMadrasahs[0].namaMadrasah || '');
    }
  }, [targetMadrasah, allMadrasahs]);

  const handleMadrasahChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const found = allMadrasahs.find((m) => (m.tenantId || m.npsn) === tenantId);
    if (found) {
      setSelectedNamaMadrasah(found.namaMadrasah);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !username.trim()) {
      toast.error('Mohon lengkapi semua bidang form yang wajib diisi!');
      return;
    }

    if (!selectedTenantId) {
      toast.error('Pilih madrasah target terlebih dahulu!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check existing email in userRepository
      const existing = await userRepository.findByEmail(email.trim().toLowerCase());
      if (existing) {
        toast.error(`Email ${email} sudah terdaftar di sistem!`);
        setIsSubmitting(false);
        return;
      }

      const newUid = `usr_admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = displayName.trim();
      const cleanUsername = username.trim();

      const userPayload: CanonicalUser = {
        id: newUid,
        uid: newUid,
        email: cleanEmail,
        displayName: cleanName,
        accountType: 'madrasah',
        role: UserRole.ADMIN,
        roles: [UserRole.ADMIN, UserRole.ADMIN_MADRASAH],
        permissions: ['*'],
        tenantId: selectedTenantId,
        status: 'active',
        syncStatus: 'pending',
        version: 1,
        schemaVersion: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deleted: false,
        idUnik: cleanUsername,
        profile: {
          email: cleanEmail,
          displayName: cleanName,
        },
        metadata: {
          approvedBy: 'Developer Console',
          approvedAt: Date.now(),
        },
      };

      await userRepository.create(userPayload);

      toast.success(`Berhasil membuat Akun Admin Madrasah untuk ${selectedNamaMadrasah}!`);
      
      // Reset fields
      setDisplayName('');
      setEmail('');
      setUsername('');
      setPassword('Madrasah2026!');

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating Admin Madrasah user:', error);
      toast.error(error.message || 'Gagal membuat akun Admin Madrasah');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#090F1E] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <UserPlusIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Buat Akun Admin Madrasah
                </h2>
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                  Otoritas Pengelola Tenant
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Target Madrasah Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Madrasah (Tenant) *
              </label>
              {allMadrasahs.length > 0 && !targetMadrasah ? (
                <div className="relative">
                  <BuildingLibraryIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedTenantId}
                    onChange={(e) => handleMadrasahChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {allMadrasahs.map((m) => (
                      <option key={m.tenantId || m.npsn} value={m.tenantId || m.npsn}>
                        {m.namaMadrasah} (NPSN: {m.npsn || m.tenantId})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BuildingLibraryIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {selectedNamaMadrasah || 'MAN 1 Hulu Sungai Tengah'}
                      </div>
                      <div className="text-[10px] text-indigo-500 font-mono">
                        Tenant ID / NPSN: {selectedTenantId || '30315537'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-600 text-white">
                    Selected
                  </span>
                </div>
              )}
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nama Lengkap Admin *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rahmat Hidayat, S.Ag"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Username & Email Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Username *
                </label>
                <div className="relative">
                  <IdentificationIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="admin_demo"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Email Resmi *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Password Awal *
              </label>
              <div className="relative">
                <KeyIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-1">
                Password default dapat diubah pengguna saat login pertama.
              </p>
            </div>

            {/* Role & Scope Info Box */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-start gap-3">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-relaxed font-medium">
                Akun ini akan diberi perizinan penuh sebagai <strong>Admin Madrasah</strong> di tenant{' '}
                <strong>{selectedNamaMadrasah}</strong>. Data akan disimpan secara offline-first di Dexie
                dan disinkronkan ke Firestore via Sync Engine.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserPlusIcon className="w-4 h-4" />
                )}
                Buat Akun Admin
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
