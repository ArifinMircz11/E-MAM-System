import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useTenantStore } from '@/stores/tenantStore';
import { toast } from 'sonner';
import { Loader2, ShieldCheckIcon, AppLogo, ZapIcon } from '@/shared/Icons';
import { UserRole } from '@/types';
import { linkStudentId, updateUser } from '@/services/userService';

interface ReferenceIdEntryModalProps {
  isOpen: boolean;
  onLogout: () => void;
}

const ReferenceIdEntryModal: React.FC<ReferenceIdEntryModalProps> = ({ isOpen, onLogout }) => {
  const user = useAuthStore((state) => state.user);
  const roles = useUserStore((state) => state.roles);
  const { config } = useTenantStore();

  const [refId, setRefId] = useState('');
  const [npsn, setNpsn] = useState(
    user?.tenantId && user.tenantId !== 'default' ? user.tenantId : config.npsn,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPlaceholder = () => {
    if (roles.includes(UserRole.SISWA)) return 'Masukkan idUnik';
    if (roles.includes(UserRole.STAF) || roles.includes(UserRole.GURU))
      return 'Masukkan NIP / NIK / ID GTK';
    return 'Masukkan idUnik / NIP / NIK';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refId.trim()) {
      toast.error('Mohon isi ID Anda');
      return;
    }
    if (!npsn.trim()) {
      toast.error('Mohon isi NPSN Madrasah');
      return;
    }

    if (!user?.uid) return;

    setIsSubmitting(true);
    try {
      const cleanId = refId.trim();
      const tenantIdStr = npsn.trim();

      const { setUser, setAccountStatus } = useAuthStore.getState();
      const { setUserData } = useUserStore.getState();

      if (roles.includes(UserRole.SISWA)) {
        const { studentDocId } = await linkStudentId(user.uid, cleanId, tenantIdStr);

        setAccountStatus('active');
        setUser({
          ...user,
          referenceId: user.uid,
          idUnik: cleanId,
          tenantId: tenantIdStr,
          studentId: studentDocId,
          studentsId: studentDocId,
        } as any);

        setUserData({
          referenceId: cleanId,
          tenantId: tenantIdStr,
          status: 'active',
        });

        toast.success('Identitas terhubung! Selamat datang.');
      } else {
        // Teacher / Staff logic remaining pending_approval
        const updatePayload: any = {
          referenceId: cleanId,
          idUnik: cleanId,
          tenantId: npsn.trim(),
          status: 'pending_approval',
          accountStatus: 'pending_approval',
          updatedAt: new Date().toISOString(),
        };

        if (roles.includes(UserRole.GURU) || roles.includes(UserRole.STAF)) {
          updatePayload.teachersId = cleanId;
          updatePayload.nip = cleanId;
        }

        await updateUser(user.uid, updatePayload);

        setAccountStatus('pending_approval');
        setUser({
          ...user,
          referenceId: cleanId,
          idUnik: cleanId,
          tenantId: npsn.trim(),
          teachersId: cleanId,
        } as any);

        setUserData({
          referenceId: cleanId,
          tenantId: npsn.trim(),
          status: 'pending_approval' as any,
        });

        toast.success('Pendaftaran identitas berhasil! Mohon tunggu verifikasi Admin.');
      }
    } catch (err: any) {
      console.error('Error updating referenceId:', err);
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={onLogout}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 p-8 relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] -mr-16 -mt-16 rounded-full" />

            <div className="relative text-center space-y-6">
              <div className="w-16 h-16 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-indigo-500/5">
                <AppLogo className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                  Verifikasi Identitas
                </h2>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 lowercase leading-relaxed">
                  Akun Anda memerlukan data identitas tambahan untuk mengakses fitur presensi dan
                  akademik madrasah.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    NPSN Madrasah
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <ZapIcon className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={npsn}
                      onChange={(e) => setNpsn(e.target.value)}
                      placeholder="Masukkan NPSN (contoh: 30315537)"
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    idUnik / NIK / NIP
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <ShieldCheckIcon className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={refId}
                      onChange={(e) => setRefId(e.target.value)}
                      placeholder={getPlaceholder()}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-bold text-[10px] tracking-[0.2em] uppercase rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ZapIcon className="w-4 h-4 group-hover:animate-bounce" />
                        Simpan Identitas
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="text-[9px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors uppercase tracking-wide"
                >
                  Nanti Saja (Keluar)
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReferenceIdEntryModal;
