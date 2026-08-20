import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import {
  EnvelopeIcon,
  LockIcon,
  AlertCircleIcon,
  Loader2,
  EyeIcon,
  EyeOffIcon,
  AppLogo,
  ArrowRightIcon,
} from '@/shared/Icons';
import { registerAndClaimAccount, registerIndependentAccount } from '@/services/authService';
import { getClasses } from '@/services/classService';
import {
  lookupStudentByIdUnik,
  lookupStudentByNisn,
  checkExistingUserByAttribute,
} from '@/services/studentService';
import {
  lookupTeacherByNip,
  lookupTeacherByNik,
  lookupTeacherByIdUnik,
} from '@/services/teacherService';

interface RegisterProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (role: UserRole) => void;
}

const Register: React.FC<RegisterProps> = ({ onBackToLogin, onRegisterSuccess }) => {
  const [roleSwitch, setRoleSwitch] = useState<'student' | 'teacher'>('student');
  const [identifier, setIdentifier] = useState('');
  const [nisn, setNisn] = useState('');
  const [foundMasterData, setFoundMasterData] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    type: 'error' | 'warning';
    action?: 'independent';
  } | null>(null);
  const [isIndependentMode, setIsIndependentMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [rawClasses, setRawClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTingkatRombel, setSelectedTingkatRombel] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  // Handling URL parameters for automated registration flow
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('idUnik');
    const roleParam = params.get('role');

    if (idParam) {
      setIdentifier(idParam);
      toast.info(`ID Terdeteksi: ${idParam}. Mencoba memuat data...`);
    }

    // Proteksi keamanan: cegah bypass peran eksekutif lewat URL parameter
    if (roleParam === 'teacher' || roleParam === 'guru' || roleParam === 'staf') {
      setRoleSwitch('teacher');
    } else {
      setRoleSwitch('student'); // Default aman diturunkan ke siswa
    }
  }, []);

  // Fetch classes for student registration dropdown
  React.useEffect(() => {
    if (!isIndependentMode || roleSwitch !== 'student') return;

    const loadClasses = async () => {
      try {
        const snap = await getClasses();
        if (snap && snap.length > 0) {
          const items = snap
            .map((c) => ({ id: c.id, name: c.name }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
          setRawClasses(items);
          if (items.length > 0) {
            setSelectedClassId(items[0].id);
            setSelectedTingkatRombel(items[0].name);
          }
        } else {
          const fallback = [
            { id: 'class_10_a', name: '10 A' },
            { id: 'class_10_b', name: '10 B' },
          ];
          setRawClasses(fallback);
          setSelectedClassId(fallback[0].id);
          setSelectedTingkatRombel(fallback[0].name);
        }
      } catch (err) {
        console.error('Gagal mengambil daftar kelas:', err);
        const fallback = [
          { id: 'class_10_a', name: '10 A' },
          { id: 'class_10_b', name: '10 B' },
        ];
        setRawClasses(fallback);
        setSelectedClassId(fallback[0].id);
        setSelectedTingkatRombel(fallback[0].name);
      }
    };

    loadClasses();
  }, [isIndependentMode, roleSwitch]);

  // Auto-lookup for students & teachers
  React.useEffect(() => {
    if (isIndependentMode) return;

    const idTrim = identifier.trim();
    let timer: any;

    if (idTrim.length >= 4) {
      const lookup = async () => {
        const defaultTenantId = '30315537'; // the default app tenant
        try {
          let docData: any = null;
          if (roleSwitch === 'student') {
            docData = await lookupStudentByIdUnik(idTrim, defaultTenantId);
          } else {
            // For teachers, try NIP then NIK then idUnik
            docData = await lookupTeacherByNip(idTrim, defaultTenantId);
            if (!docData) docData = await lookupTeacherByNik(idTrim, defaultTenantId);
            if (!docData) docData = await lookupTeacherByIdUnik(idTrim, defaultTenantId);
          }

          if (docData) {
            if (docData.isClaimed) {
              setError({
                message: 'Data ini sudah diklaim oleh akun lain. Silakan login.',
                type: 'error',
              });
              return;
            }

            setDisplayName(docData.namaLengkap || docData.name || '');
            if (docData.email) setEmail(docData.email);

            setFoundMasterData(docData);
            setError(null);
            toast.success(`Biodata Ditemukan: ${docData.namaLengkap}`);
          } else {
            setFoundMasterData(null);
          }
        } catch (e) {
          console.error('Lookup failed:', e);
        }
      };
      timer = setTimeout(lookup, 500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [identifier, roleSwitch, isIndependentMode]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (roleSwitch === 'student' && !identifier) {
      setError({ message: 'ID Unik wajib diisi.', type: 'error' });
      return;
    }

    if (roleSwitch === 'teacher' && !identifier) {
      setError({ message: 'NIP atau NIK wajib diisi.', type: 'error' });
      return;
    }

    if (roleSwitch === 'student' && isIndependentMode) {
      const nisnVal = nisn.trim();
      if (!nisnVal) {
        setError({
          message: 'Format data salah: Kolom NISN wajib diisi untuk pendaftaran mandiri.',
          type: 'error',
        });
        return;
      }
      if (nisnVal.length !== 10 || !/^[0-9]+$/.test(nisnVal)) {
        setError({
          message: 'Format data salah: NISN harus berupa 10 digit angka.',
          type: 'error',
        });
        return;
      }
    }

    if (password !== confirmPassword) {
      setError({ message: 'Password dan Konfirmasi Password tidak cocok.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setError({ message: 'Password minimal 6 karakter.', type: 'error' });
      return;
    }

    setLoading(true);
    setError(null);

    const idTrimmed = identifier.trim();

    try {
      if (isIndependentMode) {
        const res = await registerIndependentAccount({
          email: email.trim(),
          password,
          displayName,
          role: roleSwitch === 'student' ? UserRole.SISWA : UserRole.GURU,
          idUnik: idTrimmed,
          // Map NIP/NIK for teachers in independent registration
          ...(roleSwitch === 'teacher'
            ? {
                nip: idTrimmed.length >= 18 ? idTrimmed : undefined,
                nik: idTrimmed.length === 16 ? idTrimmed : undefined,
              }
            : {
                nisn: nisn.trim(),
              }),
          phone,
          tingkatRombel: roleSwitch === 'student' ? selectedTingkatRombel : undefined,
          classId: roleSwitch === 'student' ? selectedClassId : undefined,
        });

        if (res.success) {
          toast.success('Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan admin.', {
            description: 'Membuka tautan konfirmasi WhatsApp...',
            duration: 6000,
          });

          // Buka link grup WA secara otomatis untuk konfirmasi
          setTimeout(() => {
            window.open('https://chat.whatsapp.com/Hsveqg3pgNV5PX7DWhG5Mo?mode=gi_t', '_blank');
          }, 1000);

          onBackToLogin();
        } else {
          throw new Error(res.message || 'Gagal mendaftarkan akun.');
        }
        return;
      }

      // Use auto-found data if available
      if (foundMasterData) {
        const res = await registerAndClaimAccount(
          email.trim(),
          password,
          foundMasterData.id,
          roleSwitch,
          foundMasterData,
        );
        if (res.success) {
          toast.success('Pendaftaran berhasil! Akun Anda telah aktif.');
          onRegisterSuccess(res.role);
        } else {
          throw new Error(res.message || 'Gagal mendaftarkan akun.');
        }
        return;
      }

      // 0. Cek apakah sudah ada akun yang PENDING untuk identifier ini
      const hasPending = await checkExistingUserByAttribute('idUnik', idTrimmed);
      if (hasPending) {
        throw new Error(
          'NISN/NIP/NIK ini sudah terdaftar secara mandiri dan sedang menunggu persetujuan admin.',
        );
      }

      // 1. Coba Cari Berdasarkan Berbagai Identifier via Services
      let masterData: any = null;
      const defaultTenantId = '30315537';
      if (roleSwitch === 'student') {
        masterData = await lookupStudentByIdUnik(idTrimmed, defaultTenantId);
        if (!masterData)
          masterData = await lookupStudentByIdUnik(idTrimmed.toUpperCase(), defaultTenantId);
        if (!masterData) {
          const studentByNisn = await lookupStudentByNisn(idTrimmed, defaultTenantId); // In case nisn is mapped to idUnik
          if (studentByNisn) masterData = studentByNisn;
        }
      } else {
        masterData = await lookupTeacherByNip(idTrimmed, defaultTenantId);
        if (!masterData) masterData = await lookupTeacherByNik(idTrimmed, defaultTenantId);
        if (!masterData) masterData = await lookupTeacherByIdUnik(idTrimmed, defaultTenantId);
      }

      if (!masterData) {
        setError({
          message: `${roleSwitch === 'student' ? 'NISN/ID Unik' : 'NIP/NIK'} tidak ditemukan di data induk. Apakah Anda ingin mendaftar secara mandiri?`,
          type: 'warning',
          action: 'independent',
        });
        setLoading(false);
        return;
      }

      if (masterData.isClaimed) {
        throw new Error(
          `Data ini sudah diklaim oleh pengguna lain. Silakan Login atau hubungi admin.`,
        );
      }

      const res = await registerAndClaimAccount(
        email.trim(),
        password,
        masterData.id || masterData.idUnik,
        roleSwitch,
        masterData,
      );

      if (res.success) {
        toast.success('Pendaftaran berhasil! Akun Anda telah aktif.');
        onRegisterSuccess(res.role);
      } else {
        throw new Error(res.message || 'Gagal mendaftarkan akun.');
      }
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/email-already-in-use')
        message = 'Email sudah digunakan oleh akun lain.';
      if (err.code === 'auth/invalid-email') message = 'Format email tidak valid.';
      if (err.code === 'auth/weak-password') message = 'Password terlalu lemah.';
      setError({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="w-full max-w-sm z-10 space-y-4 sm:space-y-6 py-4"
    >
      <div className="text-center lg:text-left space-y-2 sm:space-y-4">
        <div className="lg:hidden w-12 h-12 sm:w-16 sm:h-16 mx-auto flex items-center justify-center p-2 sm:p-3 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
          <AppLogo className="w-full h-full opacity-60" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white  leading-none lowercase">
            {isIndependentMode ? 'pendaftaran mandiri' : 'buat identitas baru'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-bold lowercase tracking-wide flex items-center justify-center lg:justify-start gap-2">
            <span className="w-1 h-1 rounded-full bg-emerald-500/50 animate-pulse"></span>
            {isIndependentMode ? 'isi data diri lengkap anda' : 'verifikasi data induk anda'}
          </p>
        </div>
      </div>

      {/* Role Switcher */}
      {!isIndependentMode && (
        <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl flex items-center shadow-inner">
          <button
            type="button"
            onClick={() => {
              setRoleSwitch('student');
              setError(null);
            }}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all ${roleSwitch === 'student' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            Siswa / Siswi
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleSwitch('teacher');
              setError(null);
            }}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all ${roleSwitch === 'teacher' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            Guru / Staf
          </button>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4 mt-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 group">
              <label className="text-[9px] font-bold text-slate-400 lowercase tracking-wide ml-1 transition-colors group-focus-within:text-indigo-500/60 font-mono">
                {roleSwitch === 'student' ? 'ID Unik' : 'NIP / NIK'}
              </label>
              <div className="relative">
                <input
                  required
                  type="text"
                  maxLength={roleSwitch === 'student' ? 5 : 20}
                  value={identifier}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setIdentifier(roleSwitch === 'student' ? val.substring(0, 5) : val);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-[11px] font-bold tracking-wide focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm font-mono"
                  placeholder={
                    roleSwitch === 'student' ? 'Contoh: 25001' : 'NIP (ASN) atau NIK (Non-ASN)'
                  }
                />
              </div>
            </div>

            {roleSwitch === 'student' && (
              <div className="space-y-1 group">
                <label className="text-[9px] font-bold text-slate-400 lowercase tracking-wide ml-1 transition-colors group-focus-within:text-indigo-500/60">
                  NISN
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    value={nisn}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setNisn(val.substring(0, 10));
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-[11px] font-bold tracking-wide focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                    placeholder="NISN (Opsional)"
                  />
                </div>
              </div>
            )}
          </div>

          {foundMasterData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2.5 rounded-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-600 shadow-sm">
                <ArrowRightIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Akun Teridentifikasi
                </p>
                <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-none uppercase">
                  {foundMasterData.namaLengkap}
                </p>
              </div>
            </motion.div>
          )}

          {isIndependentMode ? (
            <>
              <div className="space-y-1 group">
                <label className="text-[9px] font-bold text-slate-400 lowercase tracking-wide ml-1 transition-colors group-focus-within:text-indigo-500/60">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.toUpperCase())}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-[11px] font-bold tracking-wide focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                    placeholder="ADITYA PRATAMA"
                  />
                </div>
              </div>
              <div className="space-y-1 group">
                <label className="text-[9px] font-bold text-slate-400 lowercase tracking-wide ml-1 transition-colors group-focus-within:text-indigo-500/60">
                  Nomor WhatsApp
                </label>
                <div className="relative">
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d+]/g, '');
                      if (val.startsWith('+62')) val = '62' + val.substring(3);
                      if (val.startsWith('08')) val = '628' + val.substring(2);
                      if (val.startsWith('8')) val = '628' + val.substring(1);
                      setPhone(val);
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-[11px] font-bold tracking-wide focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                    placeholder="628..."
                  />
                </div>
              </div>

              {roleSwitch === 'student' && rawClasses.length > 0 && (
                <div className="space-y-1 group">
                  <label className="text-[9px] font-bold text-slate-400 lowercase tracking-wide ml-1 transition-colors group-focus-within:text-indigo-500/60">
                    Pilih Kelas / Tingkat Rombel
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={selectedClassId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedClassId(id);
                        const matchObj = rawClasses.find((c) => c.id === id);
                        if (matchObj) {
                          setSelectedTingkatRombel(matchObj.name);
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-[11px] font-bold tracking-wide focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white shadow-sm appearance-none"
                    >
                      {rawClasses.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                        >
                          Kelas {c.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg
                        className="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}

          <div className="space-y-1 group">
            <label className="text-[9px] font-bold text-slate-400 lowercase tracking-wide ml-1 transition-colors group-focus-within:text-indigo-500/60">
              Email Akses
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-all duration-300">
                <EnvelopeIcon />
              </div>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-[11px] font-bold tracking-wide focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm lowercase"
                placeholder="email@email.com"
              />
            </div>
          </div>

          <div className="space-y-1 group">
            <label className="text-[9px] font-bold text-slate-400 lowercase tracking-wide ml-1 transition-colors group-focus-within:text-indigo-500/60">
              Kunci Sandi Baru
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-all duration-300">
                <LockIcon />
              </div>
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-[11px] font-bold tracking-wide focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300/40 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1 group">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-all duration-300">
                <LockIcon />
              </div>
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-[11px] font-bold tracking-wide focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                placeholder="Konfirmasi sandi"
              />
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
          >
            <div
              className={`p-3 rounded-xl border flex items-start gap-2 shadow-sm ${
                error.type === 'error'
                  ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 shadow-rose-900/5'
                  : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 shadow-amber-900/5'
              }`}
            >
              <div className="shrink-0 p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                <AlertCircleIcon className="w-3 h-3 text-rose-500" />
              </div>
              <p className="text-[10px] font-bold leading-relaxed">{error.message}</p>
            </div>
            {error.action === 'independent' && (
              <button
                type="button"
                onClick={() => {
                  setIsIndependentMode(true);
                  setError(null);
                }}
                className="w-full py-2.5 bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wide rounded-xl shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all"
              >
                Daftar Secara Mandiri
              </button>
            )}
          </motion.div>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3 px-1 mb-4">
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="agree-terms-reg"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
              />
            </div>
            <label
              htmlFor="agree-terms-reg"
              className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight cursor-pointer font-medium lowercase"
            >
              saya menyetujui{' '}
              <a
                href="https://privasi.e-mam.my.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                syarat & ketentuan e-Mam v8.0.5
              </a>{' '}
              serta penggunaan data sdk sistem.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full group bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed lowercase tracking-wide text-[11px]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>{isIndependentMode ? 'kirim pendaftaran' : 'buat identitas & aktifkan'}</span>
                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform opacity-60" />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors lowercase tracking-wide"
          >
            {isIndependentMode ? 'batal & kembali' : 'sudah punya akun? kembali masuk'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Register;
