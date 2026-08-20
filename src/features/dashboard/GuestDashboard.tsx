import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BuildingLibraryIcon, 
  MegaphoneIcon, 
  FileText, 
  SearchIcon, 
  UserIcon,
  LogOutIcon,
  AppLogo,
  InfoIcon,
  ClipboardDocumentListIcon
} from '@/shared/Icons';
import { useSystemStore } from '@/stores/systemStore';
import { useAuthStore } from '@/stores/authStore';
import { ViewState } from '@/types/roles';
import { AssignmentRequestModal } from '@/features/kanwil/components/AssignmentRequestModal';

interface GuestDashboardProps {
  onNavigate: (view: ViewState) => void;
  onLogout: () => Promise<void>;
}

export const GuestDashboard: React.FC<GuestDashboardProps> = ({
  onNavigate,
  onLogout
}) => {
  const { madrasahInfo } = useSystemStore();
  const { user } = useAuthStore();
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  const services = [
    {
      id: 'ptsp',
      title: 'Layanan PTSP',
      description: 'Pengajuan surat dan layanan mandiri.',
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      view: ViewState.PUBLIC_SERVICES,
      color: 'bg-blue-50'
    },
    {
      id: 'info-madrasah',
      title: 'Profil Madrasah',
      description: 'Informasi umum dan profil madrasah.',
      icon: <BuildingLibraryIcon className="w-8 h-8 text-emerald-600" />,
      view: ViewState.MADRASAH_INFO,
      color: 'bg-emerald-50'
    },
    {
      id: 'announcements',
      title: 'Pengumuman',
      description: 'Berita dan informasi terbaru.',
      icon: <MegaphoneIcon className="w-8 h-8 text-orange-600" />,
      view: ViewState.NEWS,
      color: 'bg-orange-50'
    },
    {
      id: 'service-tracking',
      title: 'Lacak Layanan',
      description: 'Pantau status pengajuan Anda.',
      icon: <SearchIcon className="w-8 h-8 text-indigo-600" />,
      view: ViewState.PUBLIC_SERVICES, // Using public services for now
      color: 'bg-indigo-50'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header / Hero Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-slate-200 px-6 py-8"
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <AppLogo className="w-full h-full object-cover" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              {(madrasahInfo as any)?.namaMadrasah || (madrasahInfo as any)?.nama || 'Madrasah Digital'}
            </h1>
            <p className="text-slate-500 mt-1 text-lg">
              {(madrasahInfo as any)?.motto || 'Pusat Layanan Informasi & Akademik Terpadu'}
            </p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                Dashboard Tamu
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                Sesi Aktif
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-grow p-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-8 shadow-lg shadow-blue-200/50"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Selamat Datang, {user?.displayName || 'Pengguna'}!</h2>
                <p className="text-blue-100 max-w-md leading-relaxed">
                  Anda saat ini masuk sebagai pengguna publik. Anda dapat menggunakan layanan PTSP mandiri dan mengakses informasi madrasah secara bebas.
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <InfoIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {services.map((service, index) => (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => onNavigate(service.view)}
                className="group flex flex-col p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-left outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className={`w-14 h-14 ${service.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{service.title}</h3>
                <p className="text-slate-500 mt-1">{service.description}</p>
              </motion.button>
            ))}
          </div>

          {/* Quick Info Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Butuh Bantuan?</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 flex-1">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                  <UserIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Hubungi Admin</p>
                  <p className="text-xs text-slate-500">Bantuan pendaftaran akun</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 flex-1">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                  <InfoIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Panduan Sistem</p>
                  <p className="text-xs text-slate-500">Cara menggunakan e-Mam</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Account Section */}
      <footer className="p-6 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <UserIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{user?.displayName || 'Tamu'}</p>
              <p className="text-xs text-slate-500">{user?.email || 'guest@emam-system.web.id'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            <LogOutIcon className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </footer>
      <AssignmentRequestModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        user={user}
      />
    </div>
  );
};

export default GuestDashboard;
