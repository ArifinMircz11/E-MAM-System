/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React from 'react';
import Layout from '@/layouts/Layout';
import {
  BuildingLibraryIcon,
  IdentificationIcon,
} from '@/shared/Icons';
import { ViewState, UserRole, ROLE_GROUPS } from '@/types';
import { NavigationService } from '@/navigation/services/navigationService';

// --- DATA DEFINITION ---
interface ServiceItem {
  label: string;
  icon?: React.ElementType;
  logoUrl?: string;
  url?: string;
  view?: ViewState;
  roles?: UserRole[];
}

const TEACHER_ROLES = [
  UserRole.GURU,
  UserRole.GTK,
  UserRole.ADMIN,
  UserRole.DEVELOPER,
  UserRole.KEPALA_MADRASAH,
];

const KEMENAG_SERVICES: ServiceItem[] = [
  {
    label: 'Database GTK',
    icon: IdentificationIcon,
    view: ViewState.TEACHERS,
    roles: [...ROLE_GROUPS.ACADEMIC_STAFF],
  },
  {
    label: 'Pusaka Kemenag',
    logoUrl: 'https://drive.google.com/uc?export=view&id=1bRX-yogRsfbDeAzpdDxP9Hj9OaEv88Nd',
    url: 'https://pusaka-v3.kemenag.go.id/',
    roles: TEACHER_ROLES,
  },
  {
    label: 'RDM',
    logoUrl: 'https://drive.google.com/uc?export=view&id=1LaNh2QMfdsfdIARzRqO9z28kmHdwXVYK',
    url: 'https://hdmadrasah.id/login/auth',
    roles: TEACHER_ROLES,
  },
  {
    label: 'Emis 4.0',
    logoUrl: 'https://drive.google.com/uc?export=view&id=1LC86T4WSlUzIwxQEFQDV2hoR--zpe0bi',
    url: 'https://emis.kemenag.go.id/',
    roles: TEACHER_ROLES,
  },
  {
    label: 'Emis GTK',
    logoUrl: 'https://drive.google.com/uc?export=view&id=1h2S3ic5k_RFaJBOSK9EGpZm6xhHEXQtL',
    url: 'https://emisgtk.kemenag.go.id/',
    roles: TEACHER_ROLES,
  },
  {
    label: 'SIMPEG 5',
    logoUrl: 'https://drive.google.com/uc?export=view&id=10TbuMUaaspE8HBDYCI6VimGrdRNf614j',
    url: 'https://simpeg5.kemenag.go.id/auth',
    roles: TEACHER_ROLES,
  },
  {
    label: 'Absensi Kemenag',
    logoUrl: 'https://drive.google.com/uc?export=view&id=1gd2SoKrr0nDhCfSFwQr6rUdR6ZPyXUMt',
    url: 'https://sso.kemenag.go.id/auth/signin?appid=42095eeec431ac23eb12d2b772c94be0',
    roles: TEACHER_ROLES,
  },
  {
    label: 'Pintar',
    logoUrl: 'https://drive.google.com/uc?export=view&id=16huzm5CuNdDF91_wIndGgnJTGHXUM2kU',
    url: 'https://pintar.kemenag.go.id/',
    roles: TEACHER_ROLES,
  },
  {
    label: 'ASN Digital',
    logoUrl: 'https://drive.google.com/uc?export=view&id=10KEBDQ0zxpPo9tYKHBOXuLPt3wgXBvhM',
    url: 'https://asndigital.bkn.go.id/',
    roles: TEACHER_ROLES,
  },
];

// --- SUB-COMPONENTS ---

/**
 * Komponen kartu layanan individu (Truly Frameless)
 */
const ServiceCard: React.FC<{ service: ServiceItem; onNavigate?: (v: ViewState) => void }> = ({
  service,
  onNavigate,
}) => {
  const Icon = service.icon;

  const handleClick = () => {
    if (service.view && onNavigate) {
      onNavigate(service.view);
    } else if (service.url) {
      window.open(service.url, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-3 p-4 transition-all active:scale-90 group"
    >
      {/* Logo - Frameless & No Background */}
      <div className="w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {service.logoUrl ? (
          <img
            src={service.logoUrl}
            alt={service.label}
            className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md transition-all"
          />
        ) : Icon ? (
          <Icon className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md transition-all" />
        ) : null}
      </div>

      {/* Service Name */}
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400   text-center leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {service.label}
      </span>
    </button>
  );
};

/**
 * Komponen catatan kaki informasi
 */
const HubFooter: React.FC = () => (
  <div className="p-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-center opacity-60">
    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
      Tautan di atas merupakan layanan eksternal resmi Kemenag RI. <br />
      Pastikan Anda menggunakan kredensial yang valid untuk setiap layanan.
    </p>
  </div>
);

// --- MAIN PAGE COMPONENT ---

const KemenagHub: React.FC<{
  onBack: () => void;
  onNavigate: (v: ViewState) => void;
  userRole: UserRole;
}> = ({ onBack, onNavigate, userRole }) => {
  const filteredServices = KEMENAG_SERVICES.filter((s) => NavigationService.canUserAccess(s, userRole));

  return (
    <Layout
      title="Layanan Kemenag"
      subtitle="Hub Layanan Terpadu"
      icon={BuildingLibraryIcon}
      onBack={onBack}
    >
      <div className="p-6 lg:p-10 space-y-12 pb-40 max-w-5xl mx-auto">
        {/* Main Grid Container - Reduced gaps for a tighter look */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {filteredServices.map((item, idx) => (
            <ServiceCard key={idx} service={item} onNavigate={onNavigate} />
          ))}
        </div>

        {/* Modular Footer */}
        <HubFooter />
      </div>
    </Layout>
  );
};

export default KemenagHub;
