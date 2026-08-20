import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { logout } from '@/services/authService';

interface PendingActivationViewProps {
  user: any;
}

export const PendingActivationView: React.FC<PendingActivationViewProps> = ({ user }) => {
  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="bg-amber-500 p-6 flex flex-col items-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <Clock className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-center">Aktivasi Sedang Diproses</h1>
          <p className="text-amber-50 opacity-90 text-sm mt-1">Status: Pending Approval</p>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Apa artinya ini?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Akun Anda ({user?.email}) telah berhasil didaftarkan, namun memerlukan verifikasi manual oleh Administrator atau Operator Madrasah sebelum Anda dapat mengakses dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Apa yang harus dilakukan?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Silakan hubungi bagian IT atau Operator Madrasah Anda untuk mempercepat proses aktivasi. Pastikan Anda menyebutkan email atau NISN/NIP yang Anda gunakan.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col gap-3">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout & Coba Akun Lain
            </Button>
            
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-wide font-medium mt-2">
              e-Mam System &bull; Enterprise Identity Layer
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
