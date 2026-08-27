/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React from 'react';
import Layout from '@/layouts/Layout';
import { BuildingLibraryIcon, IdentificationIcon } from '@/shared/Icons';
import { ViewState, UserRole, ROLE_GROUPS } from '@/types';
import { NavigationService } from '@/navigation/services/navigationService';

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
  { label: 'Database GTK', icon: IdentificationIcon, view: ViewState.TEACHERS, roles: [...ROLE_GROUPS.ACADEMIC_STAFF] },
  { label: 'Pusaka Kemenag', logoUrl: 'https://drive.google.com/uc?export=view&id=1bRX-yogRsfbDeAzpdDxP9Hj9OaEv88Nd', url: 'https://pusaka-v3.kemenag.go.id/', roles: TEACHER_ROLES },
  { label: 'RDM', logoUrl: 'https://drive.google.com/uc?export=view&id=1LaNh2QMfdsfdIARzRqO9z28kmHdwXVYK', url: 'https://hdmadrasah.id/login/auth', roles: TEACHER_ROLES },
  { label: 'Emis 4.0', logoUrl: 'https://drive.google.com/uc?export=view&id=1LC86T4WSlUzIwxQEFQDV2hoR--zpe0bi', url: 'https://emis.kemenag.go.id/', roles: TEACHER_ROLES },
  { label: 'Emis GTK', logoUrl: 'https://drive.google.com/uc?export=view&id=1h2S3ic5k_RFaJBOSK9EGpZm6xhHEXQtL', url: 'https://emisgtk.kemenag.go.id/', roles: TEACHER_ROLES },
  { label: 'SIMPEG 5', logoUrl: 'https://drive.google.com/uc?export=view&id=10TbuMUaaspE8HBDYCI6VimGrdRNf614j', url: 'https://simpeg5.kemenag.go.id/auth', roles: TEACHER_ROLES },
  { label: 'Absensi Kemenag', logoUrl: 'https://drive.google.com/uc?export=view&id=1gd2SoKrr0nDhCfSFwQr6rUdR6ZPyXUMt', url: 'https://sso.kemenag.go.id/auth/signin?appid=42095eeec431ac23eb12d2b772c94be0', roles: TEACHER_ROLES },
  { label: 'Pintar', logoUrl: 'https://drive.google.com/uc?export=view&id=16huzm5CuNdDF91_wIndGgnJTGHXUM2kU', url: 'https://pintar.kemenag.go.id/', roles: TEACHER_ROLES },
  { label: 'ASN Digital', logoUrl: 'https://drive.google.com/uc?export=view&id=10KEBDQ0zxpPo9tYKHBOXuLPt3wgXBvhM', url: 'https://asndigital.bkn.go.id/', roles: TEACHER_ROLES },
];

interface MetricCardProps {
  label: string;
  description: string;
  icon: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, description, icon }) => (
  <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{description}</p>
      </div>
      <span className="text-xl" aria-hidden="true">{icon}</span>
    </div>
  </div>
);

const ServiceCard: React.FC<{ service: ServiceItem; onNavigate?: (v: ViewState) => void }> = ({ service, onNavigate }) => {
  const Icon = service.icon;
  const handleClick = () => {
    if (service.view && onNavigate) onNavigate(service.view);
    else if (service.url) window.open(service.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button onClick={handleClick} className="flex flex-col items-center gap-3 p-4 transition-all active:scale-90 group" type="button">
      <div className="w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {service.logoUrl ? (
          <img src={service.logoUrl} alt={service.label} className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md transition-all" />
        ) : Icon ? (
          <Icon className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md transition-all" />
        ) : null}
      </div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {service.label}
      </span>
    </button>
  );
};

const KemenagHub: React.FC<{
  onBack: () => void;
  onNavigate: (v: ViewState) => void;
  userRole: UserRole;
}> = ({ onBack, onNavigate, userRole }) => {
  const filteredServices = KEMENAG_SERVICES.filter((s) => NavigationService.canUserAccess(s, userRole));

  return (
    <Layout title="Kemenag Kabupaten/Kota" subtitle="Dashboard Organisasi & Hub Layanan" icon={BuildingLibraryIcon} onBack={onBack}>
      <div className="p-6 lg:p-10 space-y-8 pb-40 max-w-7xl mx-auto">
        {/* Organization scope */}
        <section className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 shadow-sm dark:border-indigo-950 dark:from-indigo-950/40 dark:via-slate-950 dark:to-slate-900">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Organization Workspace</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Kantor Kementerian Agama Kabupaten/Kota</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Pusat pemantauan satuan kerja/madrasah dalam wilayah. Data operasional ditampilkan melalui summary/read model dan tidak melakukan CRUD cloud dari UI.
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-white/80 px-5 py-4 text-right dark:border-indigo-900 dark:bg-slate-900/80">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scope</p>
              <p className="mt-1 text-sm font-black text-indigo-600 dark:text-indigo-400">TENANT / WILAYAH</p>
            </div>
          </div>
        </section>

        {/* Organization overview — intentionally no fabricated live numbers. */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Ringkasan Organisasi</h2>
              <p className="text-xs text-slate-400">Angka diisi dari dashboard_summaries melalui service/repository.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">Summary Source</span>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="Madrasah" description="Menunggu summary wilayah" icon="🏫" />
            <MetricCard label="Siswa" description="Menunggu summary wilayah" icon="🎓" />
            <MetricCard label="Guru / GTK" description="Menunggu summary wilayah" icon="👩‍🏫" />
            <MetricCard label="Sinkronisasi" description="Status per satuan kerja" icon="🔄" />
          </div>
        </section>

        {/* Operational monitoring */}
        <section className="grid gap-4 lg:grid-cols-3">
          {[
            ['📊', 'Monitoring Akademik', 'Kehadiran, jurnal, poin, dan aktivitas akademik per madrasah.'],
            ['⚠️', 'Perlu Tindak Lanjut', 'Anomali, sinkronisasi gagal, dan data yang membutuhkan perhatian operator.'],
            ['🔐', 'Governance & Akses', 'RBAC, tenant isolation, audit log, dan status akses organisasi.'],
          ].map(([icon, title, description]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-2xl" aria-hidden="true">{icon}</div>
              <h3 className="mt-3 text-sm font-black text-slate-800 dark:text-white">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          ))}
        </section>

        {/* Existing Kemenag service hub */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Layanan Kemenag</h2>
            <p className="text-xs text-slate-400">Akses layanan eksternal sesuai role pengguna.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-8">
            {filteredServices.map((item) => <ServiceCard key={item.label} service={item} onNavigate={onNavigate} />)}
          </div>
        </section>

        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 p-7 text-center dark:border-slate-800 dark:bg-slate-900/30">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-relaxed text-slate-400 dark:text-slate-500">
            Dashboard organisasi menggunakan summary/read model. Implementasi data live wajib melalui Service → Repository → Dexie/SyncEngine; UI tidak mengakses Firestore secara langsung.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default KemenagHub;
