import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { logout } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { profileService } from '@/services/ProfileService';
import { LogOut, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const REQUIRED_FIELDS = [
  { key: 'nik', label: 'NIK' },
  { key: 'nisn', label: 'NISN' },
  { key: 'tempatLahir', label: 'Tempat Lahir' },
  { key: 'tanggalLahir', label: 'Tanggal Lahir' },
  { key: 'jenisKelamin', label: 'Jenis Kelamin' },
  { key: 'namaAyah', label: 'Nama Ayah' },
  { key: 'namaIbu', label: 'Nama Ibu' },
  { key: 'namaWali', label: 'Nama Wali' },
  { key: 'nomorHpSiswa', label: 'No. HP Siswa' },
  { key: 'nomorHpWaliWhatsApp', label: 'WhatsApp Wali' },
  { key: 'alamatRumah', label: 'Alamat Rumah' },
];

const getValue = (data: any, key: string): string => {
  if (!data) return '';
  const val = data[key];
  if (val !== undefined && val !== null) {
    const s = String(val).trim();
    if (s !== '' && s !== '-') return s;
  }

  // Handlers for synonyms/fallbacks
  if (key === 'namaAyah' && data.namaAyahKandung) return String(data.namaAyahKandung).trim();
  if (key === 'namaIbu' && data.namaIbuKandung) return String(data.namaIbuKandung).trim();
  if (key === 'alamatRumah') {
    if (data.alamat) return String(data.alamat).trim();
    if (data.address) return String(data.address).trim();
  }
  if (key === 'jenisKelamin' && data.gender) return String(data.gender).trim();
  if (key === 'nomorHpSiswa' && data.phone) return String(data.phone).trim();
  if (key === 'nomorHpWaliWhatsApp' && data.whatsapp_guardian)
    return String(data.whatsapp_guardian).trim();

  return '';
};

export const ProfileCompletionModal: React.FC = () => {
  const { uid, roles, accountType } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [sId, setSId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  const rolesList = roles || [];
  const isStaffOrAdmin =
    rolesList.some(
      (r) =>
        r &&
        [
          'developer',
          'admin',
          'super_admin',
          'guru',
          'teacher',
          'staf',
          'staff',
          'kepala_madrasah',
          'wakamad',
          'kepala_tu',
          'piket',
          'kesiswaan',
          'kurikulum',
          'humas',
          'pembina_ekskul',
          'wali_kelas',
          'guru_bk',
        ].includes(String(r).toLowerCase()),
    ) || ['teacher', 'staff', 'admin', 'developer', 'other'].includes(accountType || '');
  const isStudent =
    !isStaffOrAdmin &&
    (rolesList.some(
      (r) => r && ['siswa', 'student', 'ketua_kelas'].includes(String(r).toLowerCase()),
    ) ||
      (accountType as string) === 'student');

  const getFieldError = (key: string, val: string): string | null => {
    if (!val) return 'Informasi wajib diisi';

    const isNumeric = (v: string) => /^[0-9]+$/.test(v);
    const isValidPhone = (v: string) => /^(08|\+62|62)[0-9]{8,12}$/g.test(v);

    if (key === 'nik') {
      if (!isNumeric(val)) return 'NIK hanya boleh berisi angka';
      if (val.length !== 16)
        return `NIK harus berisi tepat 16 digit (saat ini ${val.length} digit)`;
    }
    if (key === 'nisn') {
      if (!isNumeric(val)) return 'NISN hanya boleh berisi angka';
      if (val.length !== 10)
        return `NISN harus berisi tepat 10 digit (saat ini ${val.length} digit)`;
    }
    if (['nomorHpSiswa', 'nomorHpWaliWhatsApp'].includes(key)) {
      if (!isValidPhone(val)) {
        return 'Format tidak valid (harus dimulai dengan 08, 62 atau +62 dengan 10-14 digit)';
      }
    }
    return null;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!uid) {
      setIsOpen(false);
      setUserData(null);
      setSId(null);
      setStudentData(null);
      setFormData({});
      return;
    }

    if (!isStudent) {
      setIsOpen(false);
      return;
    }

    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const uData = await profileService.getUserData(uid);
        if (!isMounted || !uData) return;
        setUserData(uData);

        const studentId = uData.studentsId || uData.referenceId || uData.studentId || uid;
        setSId(studentId);

        const sData = await profileService.getStudentData(studentId);
        if (!isMounted) return;
        setStudentData(sData);
      } catch (err) {
        console.error('ProfileCompletionModal fetch error:', err);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [uid, isStudent]);

  // Handle Visibility logic when either userData or studentData updates
  useEffect(() => {
    if (!uid || !userData || !studentData) {
      setIsOpen(false);
      return;
    }

    // Jika akun sudah aktif / disetujui, sembunyikan modal kelengkapan profil secara total
    const isActive =
      userData.accountStatus === 'active' ||
      userData.accountStatus === 'Active' ||
      userData.status === 'active' ||
      userData.status === 'Active';

    if (isActive) {
      setIsOpen(false);
      return;
    }

    const isPendingData =
      userData.approvalStatus === 'pending' ||
      userData.accountStatus === 'pending' ||
      userData.accountStatus === 'pending_approval' ||
      userData.accountStatus === 'pending_account_approval' ||
      userData.accountStatus === 'pending_data_approval' ||
      userData.status === 'pending_data_approval' ||
      studentData.approvalStatus === 'pending' ||
      studentData.status === 'pending_data_approval';

    const hasMissingFields = REQUIRED_FIELDS.some((f) => !getValue(studentData, f.key));

    if (isPendingData || hasMissingFields) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [uid, userData, studentData]);

  const calculateProgress = () => {
    if (!studentData) return 0;
    const completed = REQUIRED_FIELDS.filter((f) => getValue(studentData, f.key)).length;
    return Math.floor((completed / REQUIRED_FIELDS.length) * 100);
  };

  const handleSubmit = async () => {
    if (!uid || !userData || !studentData) return;

    // Strict Input Validation (Validasi Pengisian Kolom Secara Ketat)
    const isNumeric = (val: string) => /^[0-9]+$/.test(val);
    const isValidPhone = (val: string) => /^(08|\+62|62)[0-9]{8,12}$/g.test(val);

    // 1. Validasi NIK jika ada di formData (atau belum ada di studentData)
    const nikVal = formData.nik !== undefined ? formData.nik : getValue(studentData, 'nik');
    if (formData.nik !== undefined || !getValue(studentData, 'nik')) {
      if (!nikVal) {
        toast.error('Format data salah: Kolom NIK wajib diisi.');
        return;
      }
      if (nikVal.length !== 16 || !isNumeric(nikVal)) {
        toast.error('Format data salah: NIK harus berupa 16 digit angka.');
        return;
      }
    }

    // 2. Validasi NISN jika ada di formData (atau belum ada di studentData)
    const nisnVal = formData.nisn !== undefined ? formData.nisn : getValue(studentData, 'nisn');
    if (formData.nisn !== undefined || !getValue(studentData, 'nisn')) {
      if (!nisnVal) {
        toast.error('Format data salah: Kolom NISN wajib diisi.');
        return;
      }
      if (nisnVal.length !== 10 || !isNumeric(nisnVal)) {
        toast.error('Format data salah: NISN harus berupa 10 digit angka.');
        return;
      }
    }

    // 3. Validasi HP Siswa
    const hpSiswaVal =
      formData.nomorHpSiswa !== undefined
        ? formData.nomorHpSiswa
        : getValue(studentData, 'nomorHpSiswa');
    if (formData.nomorHpSiswa !== undefined || !getValue(studentData, 'nomorHpSiswa')) {
      if (!hpSiswaVal) {
        toast.error('Format data salah: Nomor HP Siswa wajib diisi.');
        return;
      }
      if (!isValidPhone(hpSiswaVal)) {
        toast.error(
          'Format data salah: Nomor HP Siswa tidak valid. Harus dimulai dengan 08, +62, atau 62 (10-14 digit).',
        );
        return;
      }
    }

    // 4. Validasi HP Wali/WhatsApp
    const hpWaliVal =
      formData.nomorHpWaliWhatsApp !== undefined
        ? formData.nomorHpWaliWhatsApp
        : getValue(studentData, 'nomorHpWaliWhatsApp');
    if (
      formData.nomorHpWaliWhatsApp !== undefined ||
      !getValue(studentData, 'nomorHpWaliWhatsApp')
    ) {
      if (!hpWaliVal) {
        toast.error('Format data salah: Nomor WhatsApp Wali wajib diisi.');
        return;
      }
      if (!isValidPhone(hpWaliVal)) {
        toast.error(
          'Format data salah: Nomor WhatsApp Wali tidak valid. Harus dimulai dengan 08, +62, atau 62 (10-14 digit).',
        );
        return;
      }
    }

    const targetStudentId = sId || userData.studentsId || userData.referenceId || userData.studentId;
    if (!targetStudentId) {
      toast.error('Identitas domain (referenceId/studentsId) tidak terhubung pada akun Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      await profileService.updateProfile(targetStudentId, formData);
      setSubmittedSuccessfully(true);
      toast.success('Profil berhasil disimpan dan dimasukkan ke antrean sinkronisasi.');
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan profil: ' + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isPending =
    userData?.approvalStatus === 'pending' ||
    userData?.accountStatus === 'pending' ||
    userData?.accountStatus === 'pending_approval' ||
    userData?.accountStatus === 'pending_account_approval' ||
    userData?.accountStatus === 'pending_data_approval' ||
    userData?.status === 'pending_data_approval' ||
    studentData?.approvalStatus === 'pending' ||
    studentData?.status === 'pending_data_approval';

  const progress = calculateProgress();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        {submittedSuccessfully ? (
          <div className="text-center py-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-md border border-emerald-100">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-950 mb-3 tracking-tight">
              Kirim Profil Berhasil!
            </h2>
            <p className="text-sm text-slate-600 max-w-sm mb-6 text-center leading-relaxed">
              Data kelengkapan profil Anda berhasil dikirim dan sedang dalam pemeriksaan. Silakan
              hubungi Developer / Administrator melalui WhatsApp untuk mempercepat proses
              persetujuan verifikasi data Anda.
            </p>

            <a
              href={`https://wa.me/6285194030064?text=${encodeURIComponent(
                `Assalamu'alaikum Admin, saya *${userData?.displayName || studentData?.namaLengkap || 'Siswa'}* (${userData?.email || ''}) baru saja mengirimkan kelengkapan data profil di e-Mam System. Mohon bantuannya untuk memverifikasi akun saya. Terima kasih.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 mb-4 transition-colors shadow-lg shadow-emerald-500/10"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.007 2a10 10 0 0 0-7.75 16.33L3 21l3.05-1.55A10 10 0 1 0 12.007 2zm5.82 14a1.88 1.88 0 0 1-1.3 1.2c-.36.08-.83.15-2.42-.51-2-1-3.23-3-3.33-3.15-.1-.13-.73-.97-.73-1.85a2 2 0 0 1 .6-1.5c.18-.18.39-.23.53-.23h.36c.11 0 .26-.04.41.31.15.36.52 1.25.56 1.34.04.1.07.2.04.28-.01.12-.08.2-.18.31s-.2.23-.29.35c-.1.1-.2.22-.08.43a8.1 8.1 0 0 0 1.51 1.86a6 6 0 0 0 2.18 1.34c.22.11.35.09.48-.06s.54-.62.68-.83c.14-.21.28-.18.47-.11s1.2.56 1.4.67.35.15.4.24a1.37 1.37 0 0 1-.16.92z" />
              </svg>
              Hubungi Admin via WhatsApp
            </a>

            <button
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 text-slate-500" /> Sign Out / Keluar
            </button>
          </div>
        ) : isPending ? (
          <div className="text-center py-10 flex flex-col items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-600 rounded-full mb-6"
            />
            <h2 className="text-2xl font-bold text-slate-950 mb-3 tracking-tight select-none">
              Menunggu Verifikasi
            </h2>
            <p className="text-sm text-slate-600 max-w-xs mb-6 text-center">
              Data pendaftaran / perubahan profil Anda sedang diperiksa oleh admin/developer. Mohon
              tunggu.
            </p>

            <a
              href={`https://wa.me/6285194030064?text=${encodeURIComponent(
                `Assalamu'alaikum Admin, saya *${userData?.displayName || studentData?.namaLengkap || 'Siswa'}* (${userData?.email || ''}) saat ini sedang menunggu Persetujuan Profil di e-Mam System. Mohon bantuannya untuk memverifikasi akun saya. Terima kasih.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 mb-6 transition-colors shadow-lg shadow-emerald-500/10"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.007 2a10 10 0 0 0-7.75 16.33L3 21l3.05-1.55A10 10 0 1 0 12.007 2zm5.82 14a1.88 1.88 0 0 1-1.3 1.2c-.36.08-.83.15-2.42-.51-2-1-3.23-3-3.33-3.15-.1-.13-.73-.97-.73-1.85a2 2 0 0 1 .6-1.5c.18-.18.39-.23.53-.23h.36c.11 0 .26-.04.41.31.15.36.52 1.25.56 1.34.04.1.07.2.04.28-.01.12-.08.2-.18.31s-.2.23-.29.35c-.1.1-.2.22-.08.43a8.1 8.1 0 0 0 1.51 1.86a6 6 0 0 0 2.18 1.34c.22.11.35.09.48-.06s.54-.62.68-.83c.14-.21.28-.18.47-.11s1.2.56 1.4.67.35.15.4.24a1.37 1.37 0 0 1-.16.92z" />
              </svg>
              Hubungi Developer/Admin via WhatsApp
            </a>

            <button
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 text-slate-500" /> Sign Out / Keluar
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-1 text-gray-900">KELENGKAPAN PROFIL</h2>
            <p className="text-sm font-normal text-gray-600 mb-6">
              Silakan periksa dan lengkapi data profil Anda. Data yang sudah ada tersinkronisasi
              dari sistem.
            </p>
            <p className="text-lg font-semibold text-blue-600 mb-4">
              PROFIL SISWA {progress}% LENGKAP
            </p>

            <div className="space-y-4">
              {REQUIRED_FIELDS.map((field) => {
                const existingVal = studentData ? getValue(studentData, field.key) : '';
                const currentVal =
                  formData[field.key] !== undefined ? formData[field.key] : existingVal;
                const error = getFieldError(field.key, currentVal);
                const isTouched = touchedFields[field.key];

                // Determine border and background styles based on touched & error status
                let inputClass =
                  'w-full p-2.5 border rounded-xl outline-none transition-all duration-200 text-sm ';
                if (isTouched || currentVal) {
                  if (error) {
                    inputClass +=
                      'border-rose-400 bg-rose-50/10 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500';
                  } else {
                    inputClass +=
                      'border-emerald-400 bg-emerald-50/10 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';
                  }
                } else {
                  inputClass +=
                    'border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
                }

                return (
                  <div key={field.key} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {field.label}
                      </label>
                      {(isTouched || currentVal) && (
                        <span
                          className={`text-[11px] font-medium flex items-center gap-1 ${error ? 'text-rose-500' : 'text-emerald-500'}`}
                        >
                          {error ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" /> Format Salah
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" /> Sesuai Format
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {field.key === 'jenisKelamin' ? (
                      <select
                        value={currentVal}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, [field.key]: e.target.value }));
                          setTouchedFields((prev) => ({ ...prev, [field.key]: true }));
                        }}
                        onBlur={() => setTouchedFields((prev) => ({ ...prev, [field.key]: true }))}
                        className={inputClass}
                      >
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="L">Laki-Laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    ) : field.key === 'tanggalLahir' ? (
                      <input
                        type="date"
                        value={currentVal}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, [field.key]: e.target.value }));
                          setTouchedFields((prev) => ({ ...prev, [field.key]: true }));
                        }}
                        onBlur={() => setTouchedFields((prev) => ({ ...prev, [field.key]: true }))}
                        className={inputClass}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={existingVal ? '' : `Masukkan ${field.label}`}
                        value={currentVal}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (field.key === 'nik') {
                            val = val.replace(/\D/g, '').substring(0, 16);
                          } else if (field.key === 'nisn') {
                            val = val.replace(/\D/g, '').substring(0, 10);
                          } else if (['nomorHpSiswa', 'nomorHpWaliWhatsApp'].includes(field.key)) {
                            val = val.replace(/[^\d+]/g, '').substring(0, 15);
                          }
                          setFormData((prev) => ({ ...prev, [field.key]: val }));
                          setTouchedFields((prev) => ({ ...prev, [field.key]: true }));
                        }}
                        onBlur={() => setTouchedFields((prev) => ({ ...prev, [field.key]: true }))}
                        className={inputClass}
                      />
                    )}

                    {(isTouched || currentVal) && error && (
                      <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-0.5">
                        {error}
                      </p>
                    )}
                    {(isTouched || currentVal) && !error && (
                      <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                        ✓ Format {field.label} sudah sesuai
                      </p>
                    )}
                  </div>
                );
              })}
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  REQUIRED_FIELDS.some((f) => {
                    const existingVal = studentData ? getValue(studentData, f.key) : '';
                    const currentVal =
                      formData[f.key] !== undefined ? formData[f.key] : existingVal;
                    return getFieldError(f.key, currentVal) !== null;
                  })
                }
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mt-4"
              >
                {isSubmitting ? 'Mengirim...' : 'Simpan Profil'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
