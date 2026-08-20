import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut, MessageSquare, ShieldCheck } from 'lucide-react';

interface WaitingGateProps {
  onLogout: () => Promise<void>;
  accountStatus:
    | 'pending'
    | 'pending_account_approval'
    | 'pending_approval'
    | 'needs_data_linkage'
    | 'pending_data_approval'
    | 'onboarding_rejected'
    | 'needs_id_verification'
    | 'pending_profile_approval';
  user: any;
}

export const WaitingGate: React.FC<WaitingGateProps> = ({ onLogout, accountStatus, user }) => {
  const handleContactAdmin = () => {
    const defaultPhone = '6285194030064'; // Custom default admin wa
    const text = `Assalamu'alaikum Admin, saya *${user.displayName || 'Pengguna'}* (${user.email}) telah mendaftarkan akun di *e-Mam System MAN 1 HST* dan saat ini sedang menunggu Persetujuan Profil. Mohon bantuannya untuk meninjau formulir pendaftaran saya. Terima kasih.`;
    const url = `https://wa.me/${defaultPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at center, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)',
      }}
    >
      {/* Visual Ambient Effects */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-xl"
      >
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-[#F8FAFC]">
              e-Mam System
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">
              MAN 1 HULU SUNGAI TENGAH
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key="wait"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] text-center space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-full" />
                    <Clock className="w-10 h-10 text-amber-500 relative z-10 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wide leading-relaxed">
                  Menunggu Persetujuan Admin
                </h3>
                <p className="text-xs text-amber-500/80 font-medium leading-relaxed px-4">
                  Halo <strong className="text-amber-500">{user.displayName || 'Pengguna'}</strong>,
                  formulir profil Anda sedang ditinjau oleh Administrator Madrasah.
                  <br className="mb-2" />
                  {accountStatus === 'pending_profile_approval'
                    ? 'Proses verifikasi profil biasanya memakan waktu maksimal 1x24 jam pada hari kerja.'
                    : 'Proses verifikasi akun biasanya memakan waktu maksimal 1x24 jam pada hari kerja.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleContactAdmin}
                  className="flex-1 py-4 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 text-[10px] uppercase font-bold tracking-wide rounded-2xl transition-all border border-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Hubungi Admin
                </button>
                <button
                  onClick={onLogout}
                  className="flex-1 py-4 bg-slate-850 hover:bg-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wide rounded-2xl transition-all border border-slate-800 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default WaitingGate;

