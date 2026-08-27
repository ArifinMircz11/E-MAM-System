import React, { useEffect, useState } from 'react';
import Layout from '@/layouts/Layout';
import { BuildingLibraryIcon, IdentificationIcon } from '@/shared/Icons';
import { ViewState, UserRole, ROLE_GROUPS } from '@/types';
import { NavigationService } from '@/navigation/services/navigationService';
import { getKemenagOrganizationSummary, type KemenagOrganizationSummary } from '@/services/dashboardSummaryService';

interface ServiceItem { label: string; icon?: React.ElementType; logoUrl?: string; url?: string; view?: ViewState; roles?: UserRole[]; }

const TEACHER_ROLES = [UserRole.GURU, UserRole.GTK, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.KEPALA_MADRASAH];
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

const MetricCard: React.FC<{ label: string; value: string; description: string; icon: string }> = ({ label, value, description, icon }) => (
  <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p></div>
      <span className="text-xl" aria-hidden="true">{icon}</span>
    </div>
  </div>
);

const ServiceCard: React.FC<{ service: ServiceItem; onNavigate?: (v: ViewState) => void }> = ({ service, onNavigate }) => {
  const Icon = service.icon;
  const handleClick = () => { if (service.view && onNavigate) onNavigate(service.view); else if (service.url) window.open(service.url, '_blank', 'noopener,noreferrer'); };
  return <button onClick={handleClick} className="group flex flex-col items-center gap-3 p-4 transition-all active:scale-90" type="button">
    <div className="flex h-20 w-20 items-center justify-center transition-transform duration-300 group-hover:scale-110">{service.logoUrl ? <img src={service.logoUrl} alt={service.label} className="h-full w-full object-contain drop-shadow-sm" /> : Icon ? <Icon className="h-full w-full object-contain drop-shadow-sm" /> : null}</div>
    <span className="text-center text-[10px] font-bold leading-tight text-slate-600 transition-colors group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400">{service.label}</span>
  </button>;
};

const KemenagHub: React.FC<{ onBack: () => void; onNavigate: (v: ViewState) => void; userRole: UserRole }> = ({ onBack, onNavigate, userRole }) => {
  const [summary, setSummary] = useState<KemenagOrganizationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filteredServices = KEMENAG_SERVICES.filter((s) => NavigationService.canUserAccess(s, userRole));

  useEffect(() => {
    let active = true;
    getKemenagOrganizationSummary().then((data) => { if (active) setSummary(data); }).catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Gagal membaca summary organisasi'); });
    return () => { active = false; };
  }, []);

  const value = (n: number) => n.toLocaleString('id-ID');
  const syncText = summary ? `${value(summary.syncedMadrasah)}/${value(summary.madrasah)} tersinkron` : 'Memuat summary lokal';

  return <Layout title="Kemenag Kabupaten/Kota" subtitle="Dashboard Organisasi & Hub Layanan" icon={BuildingLibraryIcon} onBack={onBack}>
    <div className="mx-auto max-w-7xl space-y-8 p-6 pb-40 lg:p-10">
      <section className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 shadow-sm dark:border-indigo-950 dark:from-indigo-950/40 dark:via-slate-950 dark:to-slate-900">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Organization Workspace</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Kantor Kementerian Agama Kabupaten/Kota</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Pemantauan satuan kerja/madrasah berbasis dashboard_summaries. Pembacaan dimulai dari Dexie melalui Repository dan tidak melakukan CRUD cloud dari UI.</p>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-black text-slate-900 dark:text-white">Ringkasan Organisasi</h2><p className="text-xs text-slate-400">Sumber: dashboard_summaries → Repository → Service.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">Live Local Read</span></div>
        {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">Summary gagal dimuat: {error}</div>}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Madrasah" value={summary ? value(summary.madrasah) : '—'} description="Satuan kerja dalam scope" icon="🏫" />
          <MetricCard label="Siswa" value={summary ? value(summary.students) : '—'} description="Total siswa terakumulasi" icon="🎓" />
          <MetricCard label="Guru / GTK" value={summary ? value(summary.teachers) : '—'} description="Total guru/GTK" icon="👩‍🏫" />
          <MetricCard label="Sinkronisasi" value={summary ? `${summary.madrasah ? Math.round((summary.syncedMadrasah / summary.madrasah) * 100) : 0}%` : '—'} description={syncText} icon="🔄" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Kehadiran" value={summary ? `${summary.attendanceRateToday}%` : '—'} description="Rata-rata summary hari ini" icon="📊" />
        <MetricCard label="Pelanggaran" value={summary ? value(summary.violations) : '—'} description="Total pada summary" icon="⚠️" />
        <MetricCard label="Prestasi" value={summary ? value(summary.achievements) : '—'} description="Total pada summary" icon="🏆" />
      </section>

      <section><div className="mb-4"><h2 className="text-lg font-black text-slate-900 dark:text-white">Layanan Kemenag</h2><p className="text-xs text-slate-400">Akses layanan eksternal sesuai role pengguna.</p></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-8">{filteredServices.map((item) => <ServiceCard key={item.label} service={item} onNavigate={onNavigate} />)}</div></section>

      <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 p-7 text-center dark:border-slate-800 dark:bg-slate-900/30"><p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-relaxed text-slate-400 dark:text-slate-500">Dashboard organisasi menggunakan read model. Refresh cloud tetap menjadi tanggung jawab SyncEngine; UI hanya membaca data lokal melalui Service → Repository.</p></div>
    </div>
  </Layout>;
};

export default KemenagHub;
