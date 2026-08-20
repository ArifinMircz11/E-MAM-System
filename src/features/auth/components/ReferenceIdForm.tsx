import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { userLinkingService } from '@/services/userLinkingService';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { toast } from 'sonner';
import {
  AppLogo,
  Loader2,
  XMarkIcon,
  CheckIcon,
  ShieldCheckIcon,
  ZapIcon,
} from '@/shared/Icons';
import { UserRole } from '@/types';

interface ReferenceIdFormProps {
  onLogout: () => Promise<void>;
}

export const ReferenceIdForm: React.FC<ReferenceIdFormProps> = ({ onLogout }) => {
  const user = useAuthStore((state) => state.user);
  const roles = useUserStore((state) => state.roles);
  const setUserLocal = useAuthStore((state) => state.setUser);
  const setAccountStatus = useAuthStore((state) => state.setAccountStatus);

  const [referenceId, setReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isTeacher = roles.some((r) =>
    ([UserRole.GURU, UserRole.GTK, UserRole.WALI_KELAS] as string[]).includes(r),
  );
  const idLabel = isTeacher ? 'NIP / ID Guru / NIK' : 'ID Unik / NISN / NIK';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceId.trim()) {
      toast.error('Wajib mengisi ID Unik/NIP/NIK untuk melanjutkan.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (!user?.uid) throw new Error('Sesi pengguna tidak valid.');

      const cleanId = referenceId.trim();
      const collectionType = isTeacher ? 'teacher' : 'student';
      const idField = isTeacher ? 'teachersId' : 'studentsId';

      // Use the service to handle linking logic
      const masterData = await userLinkingService.linkUserToReferenceId(user.uid, cleanId, collectionType);

      // 3. Update Local State (Zustand)
      setUserLocal({
        ...user,
        role: isTeacher ? UserRole.GURU : UserRole.SISWA,
        [idField]: cleanId,
        idUnik: cleanId,
        tenantId: masterData.tenantId || 'default',
      });
      setAccountStatus('Active');

      toast.success('Berhasil menghubungkan profil madrasah!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan data.');
      toast.error('Gagal menghubungkan profil. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950 p-4 sm:p-6">
      {/* Background ambient lighting */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl space-y-8 overflow-hidden relative">
          {/* Inner Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-slate-800/50 rounded-3xl p-4 border border-white/5 shadow-xl relative group">
              <AppLogo className="w-full h-full" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-slate-900">
                <ZapIcon className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-wide uppercase">
                Lengkapi Profil
              </h1>
              <p className="text-[10px] font-bold text-slate-400 lowercase leading-relaxed">
                sistem mendeteksi profil anda belum terhubung dengan data madrasah. silakan masukkan
                kode identitas anda.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                Keterangan: {idLabel}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                  <ShieldCheckIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="Masukkan Identitas Anda..."
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-bold placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
                />
              </div>
              <p className="text-[8px] font-medium text-slate-500 lowercase ml-1">
                * pastikan nomor identitas sesuai dengan data yang terdaftar di tata usaha.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[9px] font-bold text-rose-400 text-center uppercase tracking-wider">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-3.5 h-3.5" />
                    Simpan & Lanjutkan
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-4 bg-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300 font-bold text-[9px] uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                Keluar
              </button>

              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setAccountStatus('onboarding_rejected')} // Use this to bypass and show full form
                  className="text-[8px] font-bold text-slate-600 hover:text-indigo-400 uppercase tracking-wide transition-colors underline underline-offset-4"
                >
                  Belum punya ID? Daftar Mandiri di sini
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-[8px] font-bold text-slate-600 uppercase tracking-[0.3em]">
          Powered by e-Mam System Engine v1.0 • Stable Core
        </p>
      </motion.div>
    </div>
  );
};
