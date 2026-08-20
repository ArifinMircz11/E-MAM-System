import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getClasses } from '@/services/classService';
import { submitProfileCompletionRequest } from '@/services/onboardingService';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import type { ClassData } from '@/types';
import {
  AppLogo,
  Loader2,
  XMarkIcon,
  CheckIcon,
  AlertCircleIcon,
  GraduationCapIcon,
  BookOpenIcon,
} from '@/shared/Icons';

interface OnboardingFormProps {
  onLogout: () => Promise<void>;
  adminNote?: string;
  isRejected?: boolean;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  onLogout,
  adminNote,
  isRejected = false,
}) => {
  const user = useAuthStore((state) => state.user);
  const setUserUserData = useUserStore((state) => state.setUserData);
  const setAuthAccountStatus = useAuthStore((state) => state.setAccountStatus);

  const [role, setRole] = useState<'siswa' | 'guru' | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States (Siswa)
  const [nisn, setNisn] = useState('');
  const [nik, setNik] = useState('');
  const [namaLengkap, setNamaLengkap] = useState(user?.displayName || '');
  const [jenisKelamin, setJenisKelamin] = useState('Laki-laki');
  const [tingkatRombel, setTingkatRombel] = useState('');
  const [classId, setClassId] = useState('');
  const [namaWali, setNamaWali] = useState('');
  const [nomorHpWaliWhatsApp, setNomorHpWaliWhatsApp] = useState('');
  const [alamatRumah, setAlamatRumah] = useState('');
  const [nomorHpSiswa, setNomorHpSiswa] = useState('');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [tingkat, setTingkat] = useState('');
  const [rombel, setRombel] = useState('');

  // Form States (Guru)
  const [nip, setNip] = useState('');
  const [noHpWhatsApp, setNoHpWhatsApp] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [jabatanUtama, setJabatanUtama] = useState('Guru');
  const [statusPegawai, setStatusPegawai] = useState('Honor Madya');
  const [pangkatGolongan, setPangkatGolongan] = useState('');
  const [pendidikanTerakhir, setPendidikanTerakhir] = useState('');
  const [mapelUtama, setMapelUtama] = useState('');
  const [isWaliKelas, setIsWaliKelas] = useState(false);
  const [waliKelasDi, setWaliKelasDi] = useState('');

  // Fetch classes
  useEffect(() => {
    async function loadClasses() {
      setIsLoadingClasses(true);
      try {
        const classList = await getClasses();
        setClasses(classList);
      } catch (err) {
        console.error('Gagal memuat daftar rombel/kelas:', err);
        toast.error('Gagal memuat list kelas, silakan ketik manual jika perlu.');
      } finally {
        setIsLoadingClasses(false);
      }
    }
    loadClasses();
  }, []);

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Load draft - offline functionality removed
  useEffect(() => {
    // Draft functionality removed.
  }, [user?.uid, isDraftLoaded]);

  // Autosave draft - offline functionality removed
  useEffect(() => {}, [
    user?.uid,
    isDraftLoaded,
    role,
    nisn,
    nik,
    namaLengkap,
    jenisKelamin,
    tingkatRombel,
    classId,
    namaWali,
    nomorHpWaliWhatsApp,
    alamatRumah,
    nomorHpSiswa,
    nip,
    noHpWhatsApp,
    alamatLengkap,
    jabatanUtama,
    statusPegawai,
    pangkatGolongan,
    pendidikanTerakhir,
    mapelUtama,
    isWaliKelas,
    waliKelasDi,
  ]);

  const isNumeric = (val: string) => /^[0-9]+$/.test(val);
  const isValidPhone = (val: string) => /^(08|\+62|62)[0-9]{8,12}$/.test(val);

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict Validations (Validasi Ketat)
    if (!namaLengkap || namaLengkap.trim().length < 3) {
      toast.error('Nama lengkap siswa wajib diisi, minimal 3 karakter.');
      return;
    }
    if (!nisn) {
      toast.error('NISN wajib diisi.');
      return;
    }
    if (nisn.length !== 10 || !isNumeric(nisn)) {
      toast.error('NISN harus berupa 10 digit angka.');
      return;
    }
    if (nik && (nik.length !== 16 || !isNumeric(nik))) {
      toast.error('NIK harus berupa 16 digit angka.');
      return;
    }
    if (!nomorHpSiswa) {
      toast.error('Nomor HP siswa wajib diisi.');
      return;
    }
    if (!isValidPhone(nomorHpSiswa)) {
      toast.error(
        'Format Nomor HP siswa tidak valid (Harus dimulai dengan 08, +62, atau 62, panjang 10-14 digit).',
      );
      return;
    }
    if (!namaWali || namaWali.trim().length < 3) {
      toast.error('Nama wali wajib diisi, minimal 3 karakter.');
      return;
    }
    if (!nomorHpWaliWhatsApp) {
      toast.error('Nomor WA wali wajib diisi.');
      return;
    }
    if (!isValidPhone(nomorHpWaliWhatsApp)) {
      toast.error(
        'Format Nomor WA wali tidak valid (Harus dimulai dengan 08, +62, atau 62, panjang 10-14 digit).',
      );
      return;
    }
    if (!tingkat) {
      toast.error('Pilihan tingkat kelas wajib diisi.');
      return;
    }
    if (!tingkatRombel) {
      toast.error('Pilihan rombel / nama kelas spesifik wajib diisi.');
      return;
    }
    if (!tempatLahir) {
      toast.error('Tempat lahir wajib diisi.');
      return;
    }
    if (!tanggalLahir) {
      toast.error('Tanggal lahir wajib diisi.');
      return;
    }
    if (!alamatRumah || alamatRumah.trim().length < 5) {
      toast.error('Alamat rumah lengkap wajib diisi, minimal 5 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedClass = classes.find((c) => c.name === tingkatRombel || c.id === classId);
      const actualClassId = selectedClass?.id || classId || 'undefined';

      const formData: any = {
        idUnik: nisn,
        tenantId: '30315537',
        npsn: '30315537',
        namaLengkap,
        nisn,
        nik,
        tempatLahir,
        tanggalLahir,
        jenisKelamin,
        alamat: alamatRumah,
        noHp: nomorHpSiswa,
        tingkat: tingkat || tingkatRombel.split(' ')[0] || '',
        kelas: actualClassId,
        rombel: tingkatRombel,
        namaWali,
        teleponOrangTua: nomorHpWaliWhatsApp,
        alamatOrangTua: alamatRumah,
        statusAktif: true,
      };

      await submitProfileCompletionRequest({
        id: user?.uid || '',
        userId: user?.uid || '',
        email: user?.email || '',
        displayName: namaLengkap || user?.displayName || '',
        role: 'siswa',
        tenantId: '30315537', // Default Madrasah Tenant ID
        formData,
      });

      toast.success(
        'Pengajuan profil berhasil dikirim! Silakan hubungi Admin via WhatsApp untuk mempercepat verifikasi.',
      );

      // Update local storage states and Zustand to trigger holding waiting screen
      setUserUserData({
        status: 'pending_profile_approval' as any,
      });
      setAuthAccountStatus('pending_profile_approval');
    } catch (err: any) {
      toast.error('Gagal mengirim data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuruSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict Validations (Validasi Ketat)
    if (!namaLengkap || namaLengkap.trim().length < 3) {
      toast.error('Nama lengkap guru wajib diisi, minimal 3 karakter.');
      return;
    }
    if (!nip) {
      toast.error('NIP / ID Guru wajib diisi.');
      return;
    }
    if (!isNumeric(nip) || nip.length < 6 || nip.length > 18) {
      toast.error('NIP / ID Pegawai harus berupa angka, sepanjang 6 s/d 18 digit.');
      return;
    }
    if (!nik) {
      toast.error('NIK wajib diisi.');
      return;
    }
    if (nik.length !== 16 || !isNumeric(nik)) {
      toast.error('NIK harus berupa 16 digit angka.');
      return;
    }
    if (!noHpWhatsApp) {
      toast.error('Nomor HP WhatsApp wajib diisi.');
      return;
    }
    if (!isValidPhone(noHpWhatsApp)) {
      toast.error(
        'Format Nomor HP WhatsApp tidak valid (Harus dimulai dengan 08, +62, atau 62, panjang 10-14 digit).',
      );
      return;
    }
    if (!alamatLengkap || alamatLengkap.trim().length < 5) {
      toast.error('Alamat lengkap wajib diisi, minimal 5 karakter.');
      return;
    }
    if (!mapelUtama) {
      toast.error('Mata pelajaran utama wajib diisi.');
      return;
    }
    if (isWaliKelas && !waliKelasDi) {
      toast.error('Pilihan kelas binaan (wali kelas) wajib diisi jika Anda mencentang Wali Kelas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = {
        nip,
        nik,
        namaLengkap,
        jenisKelamin,
        nomorHpWhatsApp: noHpWhatsApp,
        alamatLengkap,
        jabatanUtama,
        statusPegawai,
        pangkatGolongan,
        pendidikanTerakhir,
        mapelUtama,
        isWaliKelas,
        waliKelasDi: isWaliKelas ? waliKelasDi : null,
        idUnik: nip,
      };

      await submitProfileCompletionRequest({
        id: user?.uid || '',
        userId: user?.uid || '',
        email: user?.email || '',
        displayName: namaLengkap || user?.displayName || '',
        role: 'guru',
        tenantId: '30315537', // Default Madrasah Tenant ID
        formData,
      });

      toast.success(
        'Pengajuan profil GTK berhasil dikirim! Silakan hubungi Admin via WhatsApp untuk mempercepat verifikasi.',
      );

      setUserUserData({
        status: 'pending_profile_approval' as any,
      });
      setAuthAccountStatus('pending_profile_approval');
    } catch (err: any) {
      toast.error('Gagal mengirim data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
      {/* Background ambient lighting */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 my-auto py-8">
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 mb-4 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <AppLogo className="w-full h-full" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase">
            e-Mam System Onboarding Portal
          </h1>
          <p className="text-[10px] font-bold text-slate-500 tracking-wide lowercase mt-1">
            lengkapi data profil akademis untuk masuk ke sistem madrasah
          </p>
        </div>

        {/* Display Rejection Notice */}
        {isRejected && adminNote && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3"
          >
            <AlertCircleIcon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Pengajuan Sebelumnya Ditolak
              </h4>
              <p className="text-[10px] font-bold text-slate-300 leading-relaxed">
                Catatan Administrator: <span className="text-white italic">"{adminNote}"</span>
              </p>
              <p className="text-[9px] font-bold text-slate-400 lowercase leading-relaxed mt-1">
                silakan perbaiki formulir di bawah ini dan kirimkan kembali untuk diaudit ulang.
              </p>
            </div>
          </motion.div>
        )}

        {/* Dynamic Card Container */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <AnimatePresence mode="wait">
            {role === null ? (
              // STEP 1: SELECT YOUR ROLE
              <motion.div
                key="select-role"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-sm font-bold text-indigo-400 tracking-wider uppercase">
                    Pilih Peran Anda
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 lowercase">
                    untuk melanjutkan, tentukan apakah anda mendaftar sebagai guru/gtk atau siswa
                    madrasah
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SIswa Role Button */}
                  <button
                    onClick={() => setRole('siswa')}
                    className="group relative p-6 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-2xl text-left transition-all duration-300 space-y-4 shadow-lg focus:outline-none"
                  >
                    <div className="w-12 h-12 bg-indigo-500/10 group-hover:bg-indigo-500/20 rounded-xl flex items-center justify-center transition-colors">
                      <GraduationCapIcon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-indigo-300 transition-colors">
                        Siswa / Anggota Kelas
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 lowercase mt-1 leading-relaxed">
                        lengkapi data akademik menggunakan NISN untuk mendaftarkan kehadiran, nilai,
                        dan rekam poin madrasah.
                      </p>
                    </div>
                  </button>

                  {/* Guru Role Button */}
                  <button
                    onClick={() => setRole('guru')}
                    className="group relative p-6 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-2xl text-left transition-all duration-300 space-y-4 shadow-lg focus:outline-none"
                  >
                    <div className="w-12 h-12 bg-emerald-500/10 group-hover:bg-emerald-500/20 rounded-xl flex items-center justify-center transition-colors">
                      <BookOpenIcon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-emerald-300 transition-colors">
                        Guru / Pegawai Madrasah
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 lowercase mt-1 leading-relaxed">
                        lengkapi data profil GTK dan NIP untuk mengajar, mencatat presensi kelas,
                        jurnalmengajar, dan sanksi poin.
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : role === 'siswa' ? (
              // STEP 2A: SISWA FORM
              <motion.form
                key="form-siswa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSiswaSubmit}
                className="space-y-4 sm:space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <GraduationCapIcon className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                      Formulir Pendaftaran Siswa
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRole(null)}
                    className="text-[9px] font-bold text-slate-400 hover:text-white uppercase tracking-wider"
                  >
                    Kembali
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nama Lengkap (Sesuai Akta/KK)
                    </label>
                    <input
                      type="text"
                      required
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: Akhmad Arifin"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      NISN (10 Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      pattern="\d*"
                      required
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: 0098765432"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      NIK Siswa (Opsional/Sesuai KK)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      pattern="\d*"
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: 6301xxxxxxxxxxxx"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Jenis Kelamin
                    </label>
                    <select
                      value={jenisKelamin}
                      onChange={(e) => setJenisKelamin(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      required
                      value={tempatLahir}
                      onChange={(e) => setTempatLahir(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: Jakarta"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      required
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tingkat / Kelas
                    </label>
                    <select
                      value={tingkat}
                      required
                      onChange={(e) => setTingkat(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Tingkat --</option>
                      <option value="10">Kelas 10 (Aliyah)</option>
                      <option value="11">Kelas 11 (Aliyah)</option>
                      <option value="12">Kelas 12 (Aliyah)</option>
                      <option value="7">Kelas 7 (Tsanawiyah)</option>
                      <option value="8">Kelas 8 (Tsanawiyah)</option>
                      <option value="9">Kelas 9 (Tsanawiyah)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Rombel / Nama Kelas Spesifik
                    </label>
                    <select
                      value={tingkatRombel}
                      required
                      onChange={(e) => {
                        const val = e.target.value;
                        setTingkatRombel(val);
                        const matched = classes.find((c) => c.name === val);
                        if (matched) setClassId(matched.id || '');
                      }}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Rombel --</option>
                      {isLoadingClasses ? (
                        <option disabled>Memuat daftar kelas...</option>
                      ) : (
                        classes
                          .filter(
                            (c) =>
                              !tingkat ||
                              (c.level || '').toString() === tingkat ||
                              (c.name || '').startsWith(tingkat),
                          )
                          .map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nomor HP Siswa (Opsional)
                    </label>
                    <input
                      type="text"
                      value={nomorHpSiswa}
                      onChange={(e) => setNomorHpSiswa(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: 0852xxxxxxxx"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <hr className="border-white/5 my-2" />
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-2">
                      Informasi Kontak Orang Tua / Wali
                    </h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nama Orang Tua / Wali
                    </label>
                    <input
                      type="text"
                      required
                      value={namaWali}
                      onChange={(e) => setNamaWali(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: Suparman"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nomor HP Wali (WhatsApp Aktif)
                    </label>
                    <input
                      type="text"
                      required
                      value={nomorHpWaliWhatsApp}
                      onChange={(e) => setNomorHpWaliWhatsApp(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: 0851xxxxxxxx"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Alamat Lengkap
                    </label>
                    <textarea
                      required
                      value={alamatRumah}
                      onChange={(e) => setAlamatRumah(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
                      placeholder="Sebutkan alamat lengkap tempat tinggal siswa saat ini..."
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-bold text-[10px] tracking-wide uppercase rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Mengirimkan...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        Ajukan Pendaftaran Siswa
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              // STEP 2B: GURU FORM
              <motion.form
                key="form-guru"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleGuruSubmit}
                className="space-y-4 sm:space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <BookOpenIcon className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                      Formulir Pendaftaran GTK / Guru
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRole(null)}
                    className="text-[9px] font-bold text-slate-400 hover:text-white uppercase tracking-wider"
                  >
                    Kembali
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nama Lengkap & Gelar
                    </label>
                    <input
                      type="text"
                      required
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: H. Akhmad Arifin, S.Ag"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      NIP / NUPTK / ID Pegawai
                    </label>
                    <input
                      type="text"
                      required
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: 199010042025211012"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      NIK / No. KTP
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      pattern="\d*"
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: 63011xxxxxxxxxxxxx"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Jenis Kelamin
                    </label>
                    <select
                      value={jenisKelamin}
                      onChange={(e) => setJenisKelamin(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nomor HP WhatsApp Aktif
                    </label>
                    <input
                      type="text"
                      required
                      value={noHpWhatsApp}
                      onChange={(e) => setNoHpWhatsApp(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: 0852xxxxxxxx"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Status Kepegawaian
                    </label>
                    <select
                      value={statusPegawai}
                      onChange={(e) => setStatusPegawai(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="PNS">PNS (Aparatur Sipil Negara)</option>
                      <option value="PPPK">PPPK (Pegawai Pemerintah Perjanjian Kerja)</option>
                      <option value="Honor Madya">Honor Madya</option>
                      <option value="Honor Pratama">Honor Pratama</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Mata Pelajaran Utama
                    </label>
                    <input
                      type="text"
                      value={mapelUtama}
                      onChange={(e) => setMapelUtama(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: Biologi / Al-Qur'an Hadis"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pendidikan Terakhir
                    </label>
                    <input
                      type="text"
                      value={pendidikanTerakhir}
                      onChange={(e) => setPendidikanTerakhir(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="Contoh: S1 Pendidikan Fisika"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Alamat Tinggal Lengkap
                    </label>
                    <textarea
                      required
                      value={alamatLengkap}
                      onChange={(e) => setAlamatLengkap(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
                      placeholder="Sebutkan alamat tinggal lengkap guru saat ini..."
                    />
                  </div>

                  {/* Wali Kelas Accordion / Section */}
                  <div className="sm:col-span-2 p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Menjabat Sebagai Wali Kelas?
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 lowercase">
                          aktifkan jika anda adalah guru kepala/wali di kelas tertentu
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isWaliKelas}
                        onChange={(e) => setIsWaliKelas(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 text-emerald-600 rounded bg-slate-900 border-white/10 focus:ring-emerald-500"
                      />
                    </div>

                    <AnimatePresence>
                      {isWaliKelas && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 border-t border-white/5"
                        >
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Kelas yang Diampu
                          </label>
                          <select
                            value={waliKelasDi}
                            onChange={(e) => setWaliKelasDi(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">-- Silakan Pilih Rombel --</option>
                            {isLoadingClasses ? (
                              <option disabled>Memuat daftar kelas...</option>
                            ) : (
                              classes.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name}
                                </option>
                              ))
                            )}
                          </select>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-bold text-[10px] tracking-wide uppercase rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Mengirimkan...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        Ajukan Pendaftaran GTK
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Global Action Footer */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-rose-400 hover:text-rose-300 font-bold text-[9px] uppercase tracking-wider rounded-2xl transition-all border border-white/5"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
            Keluar & Selesaikan Nanti
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingForm;
