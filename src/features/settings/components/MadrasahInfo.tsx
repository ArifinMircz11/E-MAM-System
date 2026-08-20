/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/layouts/Layout';
import { isMockMode } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import type { MadrasahData} from '@/types';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import { useSystemStore } from '@/stores/systemStore';
import { uploadMadrasahLogo } from '@/services/madrasahService';
import {
  BuildingLibraryIcon,
  SaveIcon,
  Loader2,
  IdentificationIcon,
  GlobeAltIcon,
  SparklesIcon,
  PencilIcon,
  CheckCircleIcon,
  StarIcon,
  AppLogo,
  CameraIcon,
  PrinterIcon,
} from '@/shared/Icons';

// KOMPONEN DI LUAR UNTUK MENCEGAH KEHILANGAN FOKUS (LOSE FOCUS)
const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text' }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500  tracking-wide ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      {type === 'textarea' ? (
        <textarea
          rows={3}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-[11px] font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
        ></textarea>
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-[11px] font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
        />
      )}
    </div>
  </div>
);

const MadrasahInfo: React.FC<{ onBack: () => void; onOpenSidebar?: () => void }> = ({
  onBack,
  onOpenSidebar,
}) => {
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial State Data
  const defaultData: MadrasahData = {
    nama: 'MAN 1 HULU SUNGAI TENGAH',
    nsm: '131163070001',
    npsn: '30315354',
    alamat: 'Jl. H. Damanhuri Komplek Mesjid agung Barabai',
    telepon: '0517-41234',
    email: 'info@example.com',
    website: 'www.example.com',
    kepalaNama: 'H. SOMERAN, S.PD., M.M.',
    kepalaNip: '196703021996031001',
    akreditasi: 'A (Unggul)',
    visi: 'Mewujudkan Madrasah yang Islami, Mandiri, Amanah, dan Maju melalui keunggulan akademik dan akhlak mulia.',
    misi: [
      'Menanamkan nilai-nilai religius dalam setiap aspek pembelajaran.',
      'Metingkatkan kompetensi guru dan tenaga kependidikan.',
      'Menyediakan fasilitas pembelajaran berbasis teknologi modern.',
      'Membangun karakter siswa yang tangguh dan berjiwa sosial.',
    ],
    photo: '',
    logoApp: 'https://lh3.googleusercontent.com/d/1sgdjCQGhqXZGpb8Bf4dBKdmFohMjO65V',
    logoSurat: 'https://lh3.googleusercontent.com/d/1sgdjCQGhqXZGpb8Bf4dBKdmFohMjO65V',
    logoLayanan: 'https://lh3.googleusercontent.com/d/1sgdjCQGhqXZGpb8Bf4dBKdmFohMjO65V',
  };

  const madrasahInfo = useSystemStore((state) => state.madrasahInfo);
  const fetchMadrasahInfo = useSystemStore((state) => state.fetchMadrasahInfo);

  const [data, setData] = useState<MadrasahData>(madrasahInfo || defaultData);
  const [originalData, setOriginalData] = useState<MadrasahData>(madrasahInfo || defaultData);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logoApp' | 'logoSurat' | 'logoLayanan',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Mengunggah ke Storage...`);
    setUploading(true);

    try {
      const base64 = await compressImage(file);

      const user = useAuthStore.getState().user;
      if (!user) {
        toast.error('Gagal: Sesi login tidak terdeteksi. Silakan muat ulang halaman.', {
          id: toastId,
        });
        setUploading(false);
        return;
      }

      const downloadURL = await uploadMadrasahLogo(base64, type);
      setData((prev) => ({ ...prev, [type]: downloadURL }));
      toast.success('Logo berhasil disimpan di Cloud Storage.', { id: toastId });
    } catch (err: any) {
      console.error('Upload error details:', err);

      if (err.message?.includes('unauthenticated')) {
        toast.error('Sesi upload kadaluarsa. Silakan logout lalu login kembali.', { id: toastId });
      } else if (err.message?.includes('unauthorized')) {
        toast.error('Akses ditolak: Email Anda belum terdaftar sebagai Admin di Cloud Storage.', {
          id: toastId,
        });
      } else {
        toast.error('Gagal mengunggah logo: ' + (err.message || 'Kesalahan internal'), {
          id: toastId,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const user = useAuthStore.getState().user;
      if (!isMockMode && user) {
        try {
          const { getUserData } = await import('@/services/userService');
          const userDocData = await getUserData(user.uid);
          if (userDocData && userDocData.role) {
            setUserRole(userDocData.role as UserRole);
          }
        } catch (e: any) {
          console.error('Role check error:', e?.message || 'Error');
        }
      } else {
        setUserRole(UserRole.ADMIN);
      }

      if (isMockMode) {
        setLoading(false);
        return;
      }

      try {
        const cachedInfo = await fetchMadrasahInfo();
        if (cachedInfo) {
          setData(cachedInfo);
          setOriginalData(cachedInfo);
        }
      } catch (e: any) {
        console.error('Error fetching madrasah info:', e?.message || 'Error');
        toast.error('Gagal sinkronisasi data dari server.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchMadrasahInfo]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024; // Lebar lebih besar untuk banner madrasah
          const MAX_HEIGHT = 768;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading(`Mengunggah Foto Gedung...`);
    try {
      const base64 = await compressImage(file);

      const user = useAuthStore.getState().user;
      if (!user) {
        toast.error('Gagal: Sesi login tidak terdeteksi.', { id: toastId });
        setUploading(false);
        return;
      }

      const downloadURL = await uploadMadrasahLogo(base64, 'banner');
      setData((prev) => ({ ...prev, photo: downloadURL }));
      toast.success('Foto berhasil disimpan di Cloud Storage.', { id: toastId });
    } catch (err: any) {
      console.error('Upload error details:', err);
      if (err.message?.includes('unauthenticated')) {
        toast.error('Sesi upload kadaluarsa. Silakan login kembali.', { id: toastId });
      } else if (err.message?.includes('unauthorized')) {
        toast.error('Akses ditolak: Email Anda belum diizinkan menulis ke Storage.', {
          id: toastId,
        });
      } else {
        toast.error('Gagal memproses foto: ' + err.message, { id: toastId });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const emptyFields = [];
    if (!data.nama) emptyFields.push('Nama Madrasah');
    if (!data.kepalaNama) emptyFields.push('Kepala Madrasah');

    if (emptyFields.length > 0) {
      toast.error(`${emptyFields.join(' dan ')} wajib diisi.`);
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Mengunggah perubahan profil...');

    try {
      if (isMockMode) {
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        const { saveMadrasahInfoSettings } = await import('@/services/systemService');
        await saveMadrasahInfoSettings(data);
      }

      setOriginalData(data);
      toast.success('Profil Madrasah diperbarui!', { id: toastId });
      setIsEditMode(false);
    } catch (err: any) {
      console.error(err?.message || 'Error');
      toast.error(`Gagal menyimpan: ${err.message}`, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setData(originalData);
    setIsEditMode(false);
  };

  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;

  return (
    <Layout
      title="Profil Madrasah"
      subtitle="Identitas & Legalitas Digital"
      icon={BuildingLibraryIcon}
      onBack={onBack}
      actions={
        isAdmin &&
        !isEditMode && (
          <button
            onClick={() => setIsEditMode(true)}
            className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-sm active:scale-90 transition-all"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        )
      }
    >
      <div className="p-4 lg:p-8 pb-32 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 opacity-30" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Sinkronisasi Data...
            </p>
          </div>
        ) : isEditMode ? (
          /* --- MODE EDIT (FORM) --- */
          <form
            onSubmit={handleSave}
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {/* Foto Uploader */}
            <div className="bg-white dark:bg-[#151E32] p-2 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="relative h-64 md:h-80 w-full rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center group/photo">
                {data.photo ? (
                  <img
                    src={data.photo}
                    alt="Preview Madrasah"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400 flex flex-col items-center gap-4">
                    <BuildingLibraryIcon className="w-16 h-16 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-wide">
                      Belum Ada Foto Instansi
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover/photo:opacity-100 transition-all flex flex-col items-center justify-center gap-3 text-white"
                >
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border border-white/40">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <CameraIcon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    Unggah Foto Gedung / Banner
                  </span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>

            {/* Section 1: Legalitas */}
            <div className="bg-white dark:bg-[#151E32] p-6 lg:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <IdentificationIcon className="w-4 h-4" />
                </div>
                Identitas & Legalitas
              </h3>

              {/* Logo Uploaders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block text-center">
                    Logo Aplikasi
                  </label>
                  <div className="relative group mx-auto w-24 h-24 bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center shadow-sm">
                    {data.logoApp ? (
                      <img src={data.logoApp} className="w-full h-full object-contain" />
                    ) : (
                      <AppLogo className="w-12 h-12 opacity-20" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => handleLogoUpload(e, 'logoApp');
                        input.click();
                      }}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <CameraIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block text-center">
                    Logo Surat
                  </label>
                  <div className="relative group mx-auto w-24 h-24 bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center shadow-sm">
                    {data.logoSurat ? (
                      <img src={data.logoSurat} className="w-full h-full object-contain" />
                    ) : (
                      <PrinterIcon className="w-10 h-10 opacity-20" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => handleLogoUpload(e, 'logoSurat');
                        input.click();
                      }}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <CameraIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block text-center">
                    Logo Layanan
                  </label>
                  <div className="relative group mx-auto w-24 h-24 bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center shadow-sm">
                    {data.logoLayanan ? (
                      <img src={data.logoLayanan} className="w-full h-full object-contain" />
                    ) : (
                      <GlobeAltIcon className="w-10 h-10 opacity-20" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => handleLogoUpload(e, 'logoLayanan');
                        input.click();
                      }}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <CameraIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              <InputField
                label="Nama Lengkap Instansi *"
                icon={BuildingLibraryIcon}
                value={data.nama || ''}
                onChange={(v: string) => setData({ ...data, nama: (v || '').toUpperCase() })}
                placeholder="Masukkan nama resmi madrasah"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <InputField
                  label="Nomor Statistik (NSM)"
                  icon={IdentificationIcon}
                  value={data.nsm}
                  onChange={(v: string) => setData({ ...data, nsm: v })}
                  placeholder="12 digit NSM"
                />
                <InputField
                  label="NPSN"
                  icon={IdentificationIcon}
                  value={data.npsn}
                  onChange={(v: string) => setData({ ...data, npsn: v })}
                  placeholder="8 digit NPSN"
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1">
                    Akreditasi
                  </label>
                  <div className="relative group">
                    <StarIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-amber-500" />
                    <select
                      value={data.akreditasi || ''}
                      onChange={(e) => setData({ ...data, akreditasi: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-11 pr-4 text-[11px] font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                    >
                      <option value="">Pilih Akreditasi</option>
                      <option value="A (Unggul)">A (Unggul)</option>
                      <option value="B (Baik)">B (Baik)</option>
                      <option value="C (Cukup)">C (Cukup)</option>
                      <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Visi Misi */}
            <div className="bg-white dark:bg-[#151E32] p-6 lg:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4" />
                </div>
                Visi & Misi Strategis
              </h3>
              <InputField
                type="textarea"
                label="Visi Madrasah"
                icon={SparklesIcon}
                value={data.visi}
                onChange={(v: string) => setData({ ...data, visi: v })}
                placeholder="Tuliskan visi madrasah..."
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                  Misi Madrasah (Satu per baris)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-4 text-slate-400">
                    <PencilIcon className="w-4 h-4" />
                  </div>
                  <textarea
                    rows={6}
                    value={data.misi?.join('\n') || ''}
                    onChange={(e) => setData({ ...data, misi: e.target.value.split('\n') })}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 pl-12 text-[11px] font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                    placeholder="Misi 1&#10;Misi 2&#10;Misi 3..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex gap-4 sticky bottom-6 z-20">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-white dark:bg-slate-800 text-slate-500 font-bold py-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 active:scale-95 transition-all text-[10px] uppercase tracking-[0.25em] shadow-lg"
              >
                Batalkan
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-[2rem] shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <SaveIcon className="w-5 h-5" />
                )}
                <span className="uppercase tracking-[0.2em] text-[10px]">Terapkan Perubahan</span>
              </button>
            </div>
          </form>
        ) : (
          /* --- MODE TAMPILAN (VIEW) --- */
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            {/* Banner Madrasah Dinamis */}
            <div className="relative h-72 md:h-96 w-full rounded-[3.5rem] overflow-hidden bg-indigo-900 shadow-2xl group">
              {data.photo ? (
                <img
                  src={data.photo}
                  alt={data.nama}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

              <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-end justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/20">
                      {data.logoApp ? (
                        <img
                          src={data.logoApp}
                          className="w-full h-full object-contain"
                          alt="Logo"
                        />
                      ) : (
                        <AppLogo className="w-full h-full text-white" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-xl md:text-3xl font-bold text-white uppercase tracking-tight leading-none">
                        {data.nama || 'MAN 1 HULU SUNGAI TENGAH'}
                      </h1>
                      <p className="text-[10px] md:text-xs font-bold text-indigo-200 uppercase tracking-[0.3em] mt-2">
                        NSM: {data.nsm || '-'} • NPSN: {data.npsn || '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {data.logoSurat && (
                    <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-lg border border-white/20">
                      <img
                        src={data.logoSurat}
                        alt="Logo Surat"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  {data.logoLayanan && (
                    <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-lg border border-white/20">
                      <img
                        src={data.logoLayanan}
                        alt="Logo Layanan"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <span className="bg-yellow-400 text-indigo-950 px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-wide shadow-xl">
                    Akreditasi {data.akreditasi}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-2 bg-white dark:bg-[#151E32] p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12">
                  <SparklesIcon className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <StarIcon className="w-4 h-4" /> Visi Utama
                </h3>
                <p className="text-sm lg:text-base text-slate-700 dark:text-slate-300 font-bold leading-relaxed italic relative z-10">
                  "{data.visi}"
                </p>
              </div>
              <div className="md:col-span-3 bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/10">
                <h3 className="text-xs font-bold text-indigo-100 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" /> Misi Strategis
                </h3>
                <div className="space-y-4">
                  {data.misi?.map((m, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 border border-white/10 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                        {i + 1}
                      </div>
                      <p className="text-xs lg:text-sm font-medium leading-relaxed text-indigo-50">
                        {m}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MadrasahInfo;
