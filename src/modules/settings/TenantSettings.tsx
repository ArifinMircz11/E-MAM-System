import React, { useState, useEffect } from 'react';
import { useTenantStore } from '@/hooks/useTenant';
import { updateTenant } from '@/services/tenantService';
import { toast } from 'sonner';
import {
  Building,
  Paintbrush,
  Cpu,
  Clock,
  MapPin,
  AlertTriangle,
  Award,
  FileText,
  Save,
  ArrowLeft,
  Loader2,
  Check,
  ChevronRight,
  Globe,
} from 'lucide-react';

interface TenantSettingsProps {
  onBack: () => void;
}

const defaultTenantData = {
  identitas: {
    kodePos: '71312',
    telepon: '(0517) 41308',
    namaMadrasah: 'Madrasah Aliyah Negeri 1 Hulu Sungai Tengah',
    email: 'school@example.com',
    nsm: '131163070001',
    motto: 'Mandiri Berprestasi',
    npsn: '30315537',
    kantor: 'KANTOR KEMENTERIAN AGAMA KABUPATEN HULU SUNGAI TENGAH',
    akreditasi: 'A',
    website: 'http://example.com',
    alamatLengkap: 'Jalan. H. Damanhuri Komplek Mesjid Agung Barabai',
    kementerian: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    alamat: 'Jalan. H. Damanhuri Komplek Mesjid Agung Barabai',
  },
  konfigurasiSesi: {
    jadwal: {
      duha: '08:30',
      zuhur: '12:30',
      masuk: '07:15',
      ashar: '15:30',
      pulang: '16:00',
    },
    hariLibur: ['Sabtu', 'Minggu'],
    toleransiKeterlambatan: 5,
  },
  NPSN: '30315537',
  konfigurasiGeofence: {
    gerbangUtama: {
      lng: 115.421456,
      radius: 150,
      lat: -5.021123,
    },
    isGpsValidationActive: true,
  },
  tenantId: '30315537',
  branding: {
    warnaTema: '#4F46E5',
    warnaUtama: '#4F46E5',
    warnaSekunder: '#10B981',
    logoKopSuratUrl: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
    logoAppUrl: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
  },
  konfigurasiSistem: {
    semesterAktif: 'Ganjil',
    waGatewayToken: 'ISI_TOKEN_FONNTE_DI_SINI',
    timezone: 'Asia/Makassar',
    isMaintenance: false,
    tahunAjaranAktif: '2025/2026',
    versiAplikasi: '6.5.0',
  },
  kepemimpinan: {
    stempelUrl: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
    namaKepala: 'H. Sanadi, S.Ag, M.Pd',
    ttdDigitalUrl: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
    nipKepala: '197501012005011001',
  },
  aturanSanksiPoin: {
    terlambat: -5,
    alpaSesi: -2,
    alpaTotal: -10,
    pulangCepat: -5,
    ambangBatasTeguran: 50,
  },
  metadata: {
    diperbaruiPada: '2026-06-07T00:00:00Z',
    dibuatPada: '2024-01-01T08:00:00Z',
    berlakuHingga: '2027-12-31T23:59:59Z',
    statusLangganan: 'Premium',
  },
  ptsp: {
    formatNomor: 'B. {nomor}/{kode}/{bulan}/{tahun}',
    ttdDigitalActive: true,
    lastNomorSurat: 142,
    kodeSurat: 'MA.17.06.1/PP.00.6',
  },
};

const TenantSettings: React.FC<TenantSettingsProps> = ({ onBack }) => {
  const { tenantData, isLoading } = useTenantStore();
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('identitas');

  useEffect(() => {
    if (tenantData) {
      const merged = {
        ...defaultTenantData,
        ...tenantData,
        identitas: { ...defaultTenantData.identitas, ...tenantData.identitas },
        konfigurasiSesi: {
          ...defaultTenantData.konfigurasiSesi,
          ...tenantData.konfigurasiSesi,
          jadwal: {
            ...defaultTenantData.konfigurasiSesi.jadwal,
            ...tenantData.konfigurasiSesi?.jadwal,
          },
        },
        konfigurasiGeofence: {
          ...defaultTenantData.konfigurasiGeofence,
          ...tenantData.konfigurasiGeofence,
          gerbangUtama: {
            ...defaultTenantData.konfigurasiGeofence.gerbangUtama,
            ...tenantData.konfigurasiGeofence?.gerbangUtama,
          },
        },
        branding: { ...defaultTenantData.branding, ...tenantData.branding },
        konfigurasiSistem: {
          ...defaultTenantData.konfigurasiSistem,
          ...tenantData.konfigurasiSistem,
        },
        kepemimpinan: { ...defaultTenantData.kepemimpinan, ...tenantData.kepemimpinan },
        aturanSanksiPoin: { ...defaultTenantData.aturanSanksiPoin, ...tenantData.aturanSanksiPoin },
        ptsp: { ...defaultTenantData.ptsp, ...tenantData.ptsp },
        metadata: { ...defaultTenantData.metadata, ...tenantData.metadata },
      };
      setFormData(merged);
    } else {
      setFormData(JSON.parse(JSON.stringify(defaultTenantData)));
    }
  }, [tenantData]);

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    const toastId = toast.loading('Menyimpan konfigurasi madrasah...');

    try {
      const tenantId = String(formData.tenantId || '').trim();
      if (!tenantId) throw new Error('Tenant ID wajib tersedia sebelum menyimpan konfigurasi.');

      const updatedData = {
        ...formData,
        metadata: {
          ...formData.metadata,
          diperbaruiPada: new Date().toISOString(),
        },
      };

      await updateTenant(tenantId, updatedData);
      toast.success('Konfigurasi Tenant berhasil disimpan secara offline dan akan disinkronkan otomatis.', {
        id: toastId,
      });
    } catch (error: any) {
      console.error('Error saving tenant settings:', error);
      toast.error('Gagal menyimpan: ' + (error?.message || 'Unknown error'), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleHoliday = (day: string) => {
    const list = formData.konfigurasiSesi.hariLibur || [];
    if (list.includes(day)) {
      setFormData({
        ...formData,
        konfigurasiSesi: {
          ...formData.konfigurasiSesi,
          hariLibur: list.filter((d: string) => d !== day),
        },
      });
    } else {
      setFormData({
        ...formData,
        konfigurasiSesi: {
          ...formData.konfigurasiSesi,
          hariLibur: [...list, day],
        },
      });
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] h-full">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
          Memetakan Konfigurasi Tenant...
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'identitas', label: 'Identitas', icon: Building, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { id: 'branding', label: 'Desain & Logo', icon: Paintbrush, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
    { id: 'sistem', label: 'Sistem & API', icon: Cpu, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { id: 'sesi', label: 'Sesi & Hari Libur', icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { id: 'geofence', label: 'Geofence GPS', icon: MapPin, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
    { id: 'sanksi', label: 'Sanksi & Poin', icon: AlertTriangle, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20' },
    { id: 'kepemimpinan', label: 'Kepemimpinan', icon: Award, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' },
    { id: 'ptsp', label: 'PTSP & Surat', icon: FileText, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' },
  ];

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden">
      <header className="px-6 py-4 bg-white dark:bg-[#0B1121] border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-none">Identitas & Konfigurasi Madrasah</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wide">Multi-Tenant Tenant ID: <span className="font-mono text-indigo-500">{formData.tenantId}</span></p>
          </div>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50">
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan Konfigurasi
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-64 bg-white dark:bg-[#0B1121] border-r border-slate-200 dark:border-slate-800/80 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto p-3 gap-1 shrink-0 scrollbar-none">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex gap-3 items-center px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0 md:w-full select-none ${isTabActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                <div className={`p-1.5 rounded-lg ${isTabActive ? 'bg-white/25 text-white' : tab.color}`}><IconComponent className="w-4 h-4" /></div>
                <span>{tab.label}</span>
                <ChevronRight className={`ml-auto w-3.5 h-3.5 hidden md:block opacity-40 transition-transform ${isTabActive ? 'translate-x-1' : ''}`} />
              </button>
            );
          })}
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
          {activeTab === 'identitas' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white dark:bg-[#0B1121] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-500"><Building className="w-5 h-5" /></div>
                  <div><h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Informasi Utama Madrasah</h3><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Nama resmi, status akreditasi, dan perolehan perijinan resmi</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5 md:col-span-2"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Nama Lengkap Madrasah</label><input type="text" value={formData.identitas.namaMadrasah} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, namaMadrasah: e.target.value, alamat: formData.identitas.alamat } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">NPSN</label><input type="text" value={formData.identitas.npsn} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, npsn: e.target.value }, NPSN: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">NSM (Nomor Statistik Madrasah)</label><input type="text" value={formData.identitas.nsm} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, nsm: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Akreditasi</label><select value={formData.identitas.akreditasi} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, akreditasi: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"><option value="A">A (Unggul)</option><option value="B">B (Baik)</option><option value="C">C (Cukup)</option><option value="Belum Akreditasi">Belum Terakreditasi</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Motto Madrasah</label><input type="text" value={formData.identitas.motto} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, motto: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none italic" /></div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kementerian Penaung</label><input type="text" value={formData.identitas.kementerian} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, kementerian: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" /></div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kantor Daerah / Satker Kerja</label><input type="text" value={formData.identitas.kantor} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, kantor: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" /></div>
                </div>
              </div>
              <div className="bg-white dark:bg-[#0B1121] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-500" />Kontak & Lokasi Kantor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Telepon Madrasah</label><input type="text" value={formData.identitas.telepon} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, telepon: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Email Resmi</label><input type="email" value={formData.identitas.email} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, email: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Website Resmi</label><input type="text" value={formData.identitas.website} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, website: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kode Pos</label><input type="text" value={formData.identitas.kodePos} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, kodePos: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /></div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Alamat Lengkap</label><textarea value={formData.identitas.alamatLengkap || formData.identitas.alamat} onChange={(e) => setFormData({ ...formData, identitas: { ...formData.identitas, alamatLengkap: e.target.value, alamat: e.target.value } })} rows={3} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" /></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white dark:bg-[#0B1121] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-3"><div className="p-2 bg-pink-50 dark:bg-pink-950/40 rounded-xl text-pink-500"><Paintbrush className="w-5 h-5" /></div><div><h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Identitas Visual & Branding</h3><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Logo aplikasi, logo persuratan, dan penyesuaian aksen warna tema</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center gap-3 p-5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"><div className="w-18 h-18 bg-white dark:bg-slate-850 rounded-xl shadow-md overflow-hidden flex items-center justify-center p-1 border border-slate-100"><img src={formData.branding.logoAppUrl} className="max-w-full max-h-full object-contain" alt="App Logo" referrerPolicy="no-referrer" /></div><div className="text-center"><p className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Logo Kuadran Aplikasi</p><p className="text-[7px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Ditampilkan di Sidebar & Favicon</p></div><input type="text" value={formData.branding.logoAppUrl} onChange={(e) => setFormData({ ...formData, branding: { ...formData.branding, logoAppUrl: e.target.value } })} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-[9px] font-mono outline-none" placeholder="URL Logo (https://...)" /></div>
                  <div className="flex flex-col items-center gap-3 p-5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"><div className="w-18 h-18 bg-white dark:bg-slate-850 rounded-xl shadow-md overflow-hidden flex items-center justify-center p-1 border border-slate-100"><img src={formData.branding.logoKopSuratUrl || formData.branding.logoKemenagUrl} className="max-w-full max-h-full object-contain" alt="Kop Logo" referrerPolicy="no-referrer" /></div><div className="text-center"><p className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Logo Kop Surat / Kemenag</p><p className="text-[7px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Digunakan pada generate file cetak PTSP</p></div><input type="text" value={formData.branding.logoKopSuratUrl || formData.branding.logoKemenagUrl || ''} onChange={(e) => setFormData({ ...formData, branding: { ...formData.branding, logoKopSuratUrl: e.target.value, logoKemenagUrl: e.target.value } })} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-[9px] font-mono outline-none" placeholder="URL Logo Kop (https://...)" /></div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4"><h4 className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Aksen Warna Palet Tema</h4><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Warna Tema Utama</label><div className="flex gap-2 items-center mt-1"><input type="color" value={formData.branding.warnaTema || formData.branding.warnaUtama} onChange={(e) => setFormData({ ...formData, branding: { ...formData.branding, warnaTema: e.target.value, warnaUtama: e.target.value } })} className="w-8 h-8 rounded-md p-0 cursor-pointer border-none" /><input type="text" value={formData.branding.warnaTema || formData.branding.warnaUtama} className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold outline-none text-center" readOnly /></div></div><div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Warna Sekunder</label><div className="flex gap-2 items-center mt-1"><input type="color" value={formData.branding.warnaSekunder} onChange={(e) => setFormData({ ...formData, branding: { ...formData.branding, warnaSekunder: e.target.value } })} className="w-8 h-8 rounded-md p-0 cursor-pointer border-none" /><input type="text" value={formData.branding.warnaSekunder} className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold outline-none text-center" readOnly /></div></div><div className="p-3 bg-indigo-50/40 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 flex flex-col justify-center"><span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider">Metode Sinkronisasi</span><p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 leading-normal mt-0.5 uppercase">Aplikasi menggunakan branding di atas sebagai default identitas global tanpa muat ulang berkas local asset.</p></div></div></div>
              </div>
            </div>
          )}

          {activeTab === 'sistem' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white dark:bg-[#0B1121] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"><div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-3"><div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-500"><Cpu className="w-5 h-5" /></div><div><h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Sistem & API Integration</h3><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Sesi akademik, timezone server, gateway integrasi WhatsApp, dan mode pemeliharaan</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Tahun Ajaran Aktif</label><input type="text" value={formData.konfigurasiSistem.tahunAjaranAktif} onChange={(e) => setFormData({ ...formData, konfigurasiSistem: { ...formData.konfigurasiSistem, tahunAjaranAktif: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Semester Aktif</label><select value={formData.konfigurasiSistem.semesterAktif} onChange={(e) => setFormData({ ...formData, konfigurasiSistem: { ...formData.konfigurasiSistem, semesterAktif: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"><option value="Ganjil">Ganjil (1)</option><option value="Genap">Genap (2)</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Sistem Timezone</label><select value={formData.konfigurasiSistem.timezone} onChange={(e) => setFormData({ ...formData, konfigurasiSistem: { ...formData.konfigurasiSistem, timezone: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono"><option value="Asia/Makassar">Asia/Makassar (WITA)</option><option value="Asia/Jakarta">Asia/Jakarta (WIB)</option><option value="Asia/Jayapura">Asia/Jayapura (WIT)</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Versi Aplikasi Sistem</label><input type="text" value={formData.konfigurasiSistem.versiAplikasi} onChange={(e) => setFormData({ ...formData, konfigurasiSistem: { ...formData.konfigurasiSistem, versiAplikasi: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" placeholder="e.g. 6.5.0" /></div>
                  <div className="space-y-1.5 md:col-span-2"><div className="flex justify-between items-center mb-1"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Fonnte WhatsApp Gateway Token API</label><span className="text-[8px] font-bold text-indigo-500 dark:text-indigo-400 uppercase mt-0.5 tracking-wide font-mono">Fonnte Cloud API</span></div><input type="password" value={formData.konfigurasiSistem.waGatewayToken} onChange={(e) => setFormData({ ...formData, konfigurasiSistem: { ...formData.konfigurasiSistem, waGatewayToken: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" placeholder="Masukkan Fonnte integration token" /><p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide">Token ini digunakan secara server-side aman untuk notifikasi presensi otomatis wali murid.</p></div>
                  <div className="md:col-span-2 mt-2 p-5 bg-yellow-50 dark:bg-amber-950/20 rounded-2xl border border-yellow-200/60 dark:border-amber-900/25 flex items-center justify-between"><div><h4 className="text-[10px] font-bold text-yellow-800 dark:text-amber-400 uppercase tracking-wide">Developer System Maintenance Lock</h4><p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase mt-0.5">Kunci akses login hanya untuk pengembang & staf khusus IT</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={formData.konfigurasiSistem.isMaintenance} onChange={(e) => setFormData({ ...formData, konfigurasiSistem: { ...formData.konfigurasiSistem, isMaintenance: e.target.checked } })} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></label></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sesi' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"><div className="bg-white dark:bg-[#0B1121] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"><div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-3"><div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-500"><Clock className="w-5 h-5" /></div><div><h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Sesi Jam Kegiatan Siswa</h3><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Sesi jam presensi harian, batas keterlambatan, dan toleransi</p></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {([
                  ['masuk', 'Sesi Masuk Utama', '07:15'],
                  ['duha', 'Sesi Salat Duha', '08:30'],
                  ['zuhur', 'Sesi Salat Zuhur', '12:30'],
                  ['ashar', 'Sesi Salat Ashar', '15:30'],
                  ['pulang', 'Jam Pulang Resmi', '16:00'],
                ] as const).map(([key, label, fallback]) => <div key={key} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/60"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-2">{label}</label><input type="time" value={formData.konfigurasiSesi.jadwal[key] || fallback} onChange={(e) => setFormData({ ...formData, konfigurasiSesi: { ...formData.konfigurasiSesi, jadwal: { ...formData.konfigurasiSesi.jadwal, [key]: e.target.value } } })} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold text-indigo-600 dark:text-indigo-400 text-center outline-none" /></div>)}
                <div className="p-4 bg-[#f1f5f9] dark:bg-slate-900/80 rounded-2xl border border-[#cbd5e1]/40 dark:border-slate-800 text-center"><label className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block mb-2">Toleransi Keterlambatan</label><div className="flex gap-2 items-center justify-center"><input type="number" value={formData.konfigurasiSesi.toleransiKeterlambatan} onChange={(e) => setFormData({ ...formData, konfigurasiSesi: { ...formData.konfigurasiSesi, toleransiKeterlambatan: parseInt(e.target.value) || 0 } })} className="w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-1.5 py-1 text-center font-bold outline-none text-xs" /><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Menit</span></div></div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4"><h4 className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Penetapan Hari Libur Rutin Mingguan</h4><div className="flex flex-wrap gap-2 pt-1">{daysOfWeek.map((day) => { const isHoliday = (formData.konfigurasiSesi.hariLibur || []).includes(day); return <button key={day} type="button" onClick={() => toggleHoliday(day)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${isHoliday ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>{isHoliday && <Check className="w-3.5 h-3.5 stroke-[3]" />}{day}</button>; })}</div><p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-1">Pada hari libur berlabel merah di atas, server tidak akan memotong akumulasi scan poin, dan presensi dinonaktifkan.</p></div>
            </div></div>
          )}

          {activeTab === 'geofence' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"><div className="bg-white dark:bg-[#0B1121] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"><div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-3"><div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-500"><MapPin className="w-5 h-5" /></div><div><h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Keamanan Geofence GPS Lokasi</h3><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Radius batas absensi GPS siswa, lintang bumi, dan validasi satelit</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"><div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Latitude (Koordinat Lintang)</label><input type="number" step="any" value={formData.konfigurasiGeofence.gerbangUtama.lat} onChange={(e) => setFormData({ ...formData, konfigurasiGeofence: { ...formData.konfigurasiGeofence, gerbangUtama: { ...formData.konfigurasiGeofence.gerbangUtama, lat: parseFloat(e.target.value) || 0 } } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /></div><div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Longitude (Koordinat Bujur)</label><input type="number" step="any" value={formData.konfigurasiGeofence.gerbangUtama.lng} onChange={(e) => setFormData({ ...formData, konfigurasiGeofence: { ...formData.konfigurasiGeofence, gerbangUtama: { ...formData.konfigurasiGeofence.gerbangUtama, lng: parseFloat(e.target.value) || 0 } } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /></div><div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Batas Radius Sinyal (Meter)</label><div className="flex gap-2"><input type="number" value={formData.konfigurasiGeofence.gerbangUtama.radius} onChange={(e) => setFormData({ ...formData, konfigurasiGeofence: { ...formData.konfigurasiGeofence, gerbangUtama: { ...formData.konfigurasiGeofence.gerbangUtama, radius: parseInt(e.target.value) || 0 } } })} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-center" /><div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-3 flex items-center justify-center font-bold text-[10px] text-slate-400 uppercase tracking-wide border border-slate-200/40 dark:border-slate-700/40">M</div></div></div></div><div className="p-4 bg-slate-100/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 mt-4 flex items-center justify-between"><div><h4 className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wide">Kunci Validasi Multi-GPS Satelit</h4><p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">Siswa wajib scan di area koordinat geofence yang sah</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={formData.konfigurasiGeofence.isGpsValidationActive} onChange={(e) => setFormData({ ...formData, konfigurasiGeofence: { ...formData.konfigurasiGeofence, isGpsValidationActive: e.target.checked } })} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div></label></div></div></div>
          )}

          {activeTab === 'sanksi' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"><div className="bg-white dark:bg-[#0B1121] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"><div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-3"><div className="p-2 bg-violet-50 dark:bg-violet-950/40 rounded-xl text-violet-500"><AlertTriangle className="w-5 h-5" /></div><div><h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Regulasi Sanksi & Pengurangan Poin</h3><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Bobot pengurangan poin kedisiplinan otomatis saat pelanggaran absensi</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">{(['terlambat','alpaSesi','alpaTotal','pulangCepat'] as const).map((key) => <div key={key} className="space-y-1.5 p-4 bg-rose-50/20 dark:bg-rose-950/10 rounded-2xl border border-rose-100/50 dark:border-rose-900/30"><label className="text-[9px] font-bold text-rose-500 uppercase tracking-wide block">{key === 'alpaSesi' ? 'Potongan Poin Alpa Sesi' : key === 'alpaTotal' ? 'Potongan Poin Tanpa Keterangan (Alpa Total)' : key === 'pulangCepat' ? 'Potongan Poin Pulang Cepat' : 'Potongan Poin Terlambat'}</label><input type="number" value={formData.aturanSanksiPoin[key]} onChange={(e) => setFormData({ ...formData, aturanSanksiPoin: { ...formData.aturanSanksiPoin, [key]: parseInt(e.target.value) || 0 } })} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-rose-600 dark:text-rose-400 font-mono text-center outline-none" /></div>)}<div className="space-y-1.5 p-4 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 sm:col-span-2"><label className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block">Ambang Batas Surat Teguran (Sisa Poin Minim)</label><div className="flex gap-2 max-w-xs mt-1"><input type="number" value={formData.aturanSanksiPoin.ambangBatasTeguran} onChange={(e) => setFormData({ ...formData, aturanSanksiPoin: { ...formData.aturanSanksiPoin, ambangBatasTeguran: parseInt(e.target.value) || 0 } })} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono text-center outline-none" /></div></div></div></div></div>
          )}

          {activeTab === 'kepemimpinan' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"><div className="bg-white dark:bg-[#0B1121] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"><div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-3"><div className="p-2 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl text-cyan-500"><Award className="w-5 h-5" /></div><div><h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Kepemimpinan & Otoritas</h3><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Informasi Kepala Madrasah, tanda tangan digital, dan berkas stempel resmi</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"><div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Nama Lengkap Kepala Madrasah</label><input type="text" value={formData.kepemimpinan.namaKepala} onChange={(e) => setFormData({ ...formData, kepemimpinan: { ...formData.kepemimpinan, namaKepala: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" /></div><div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">NIP Kepala Madrasah</label><input type="text" value={formData.kepemimpinan.nipKepala} onChange={(e) => setFormData({ ...formData, kepemimpinan: { ...formData.kepemimpinan, nipKepala: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /></div><div className="flex flex-col items-center gap-3 p-5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"><div className="w-20 h-16 bg-white dark:bg-slate-850 rounded-xl shadow-md overflow-hidden flex items-center justify-center p-1 border border-slate-100"><img src={formData.kepemimpinan.ttdDigitalUrl} className="max-w-full max-h-full object-contain" alt="Signature Preview" referrerPolicy="no-referrer" /></div><p className="text-[9px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Tanda Tangan Digital (PNG)</p><input type="text" value={formData.kepemimpinan.ttdDigitalUrl} onChange={(e) => setFormData({ ...formData, kepemimpinan: { ...formData.kepemimpinan, ttdDigitalUrl: e.target.value } })} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[8px] font-mono outline-none" /></div><div className="flex flex-col items-center gap-3 p-5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"><div className="w-20 h-16 bg-white dark:bg-slate-850 rounded-xl shadow-md overflow-hidden flex items-center justify-center p-1 border border-slate-100"><img src={formData.kepemimpinan.stempelUrl} className="max-w-full max-h-full object-contain" alt="Stempel Preview" referrerPolicy="no-referrer" /></div><p className="text-[9px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Stempel Basah Madrasah (PNG)</p><input type="text" value={formData.kepemimpinan.stempelUrl} onChange={(e) => setFormData({ ...formData, kepemimpinan: { ...formData.kepemimpinan, stempelUrl: e.target.value } })} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[8px] font-mono outline-none" /></div></div></div></div>
          )}

          {activeTab === 'ptsp' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"><div className="bg-white dark:bg-[#0B1121] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"><div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-3"><div className="p-2 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-500"><FileText className="w-5 h-5" /></div><div><h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Layanan PTSP & Persuratan</h3><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Penomoran berkas cetak dinamis, kode persuratan, dan status verifikasi digital</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"><div className="space-y-1.5 md:col-span-2"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Format Penomoran Surat</label><input type="text" value={formData.ptsp.formatNomor} onChange={(e) => setFormData({ ...formData, ptsp: { ...formData.ptsp, formatNomor: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /><p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Variabel didukung: <span className="text-indigo-500">{`{nomor}`}</span>, <span className="text-indigo-500">{`{kode}`}</span>, <span className="text-indigo-500">{`{bulan}`}</span>, <span className="text-indigo-500">{`{tahun}`}</span></p></div><div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kode Surat / Unit Lembaga</label><input type="text" value={formData.ptsp.kodeSurat} onChange={(e) => setFormData({ ...formData, ptsp: { ...formData.ptsp, kodeSurat: e.target.value } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" /></div><div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Nomor Surat Terakhir dikeluarkan</label><input type="number" value={formData.ptsp.lastNomorSurat} onChange={(e) => setFormData({ ...formData, ptsp: { ...formData, lastNomorSurat: parseInt(e.target.value) || 1 } })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-center" /></div><div className="md:col-span-2 mt-2 p-5 bg-teal-50 dark:bg-teal-950/20 rounded-2xl border border-teal-200/60 dark:border-teal-900/25 flex items-center justify-between"><div><h4 className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wide">Sertakan validasi ttd digital secara default</h4><p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase mt-0.5">Otomatis bubuhkan TTD & Stempel Kepala saat surat disetujui</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={formData.ptsp.ttdDigitalActive} onChange={(e) => setFormData({ ...formData, ptsp: { ...formData.ptsp, ttdDigitalActive: e.target.checked } })} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div></label></div></div></div></div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TenantSettings;
