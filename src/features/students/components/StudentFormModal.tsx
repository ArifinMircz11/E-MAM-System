import React, { useRef } from 'react';
import type { Student } from '@/types';
import {
  XCircleIcon,
  CameraIcon,
  UserIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  Loader2,
  SaveIcon,
  WhatsAppIcon,
} from '@/shared/Icons';
import { toast } from 'sonner';
import { sendRegistrationLink } from '@/services/whatsappService';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  formData: Partial<Student>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Student>>>;
  classList: string[];
  canManage: boolean;
  handleSave: (e: React.FormEvent) => void;
  saving: boolean;
  handleMoveTo: (target: 'alumni' | 'mutasi') => void;
}

const compressImage = (
  base64Str: string,
  maxWidth = 500,
  maxHeight = 500,
  quality = 0.8,
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      resolve(base64Str); // Fallback to raw if dynamic load fails
    };
  });
};

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  editingId,
  formData = {},
  setFormData,
  classList = [],
  canManage,
  handleSave,
  saving,
  handleMoveTo,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isSendingLink, setIsSendingLink] = React.useState(false);

  if (!isOpen) return null;

  const handleSendLink = async () => {
    if (!formData.noTelepon) {
      toast.error('Nomor WhatsApp siswa belum diisi!');
      return;
    }
    if (!formData.idUnik) {
      toast.error('ID Unik siswa belum ditentukan!');
      return;
    }

    setIsSendingLink(true);
    try {
      await sendRegistrationLink(
        formData.noTelepon,
        formData.namaLengkap || 'Siswa',
        formData.idUnik,
        'student',
      );
      toast.success('Link pendaftaran berhasil dikirim via WhatsApp!');
    } catch (err) {
      toast.error('Gagal mengirim link pendaftaran.');
    } finally {
      setIsSendingLink(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0B1121] w-full max-w-3xl rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[92vh] border border-white/10 relative overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1121] z-10 shrink-0 text-left">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white capitalize tracking-tight">
              {editingId ? 'Edit Data Lengkap Siswa' : 'Registrasi Siswa Baru'}
            </h3>
            <p className="text-[9px] font-bold text-indigo-505 capitalize mt-1 tracking-wide">
              ID Unik: {formData.idUnik || 'Otomatis'} • Sinkronisasi Firestore
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="p-6 lg:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 pb-12 bg-[#F8FAFC] dark:bg-[#0B1121] text-left">
          <form id="studentForm" onSubmit={handleSave} className="space-y-10">
            {/* SECTION 1: IDENTITAS UTAMA */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 bg-indigo-500 h-4 rounded-full"></div>
                <h4 className="text-[10px] font-bold capitalize text-indigo-600 tracking-wider">
                  Data Identitas Pokok
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* PHOTO PROFIL UPLOADER */}
                <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-100 dark:border-indigo-950 shadow-md bg-white dark:bg-slate-900 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                  >
                    {formData.photoURL ? (
                      <img
                        src={formData.photoURL}
                        alt={formData.namaLengkap}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <UserIcon className="w-7 h-7" />
                        <span className="text-[7px] font-bold uppercase mt-1">Tanpa Foto</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <CameraIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onload = async (event) => {
                        const base64Image = event.target?.result as string;
                        try {
                          const compressedBase64 = await compressImage(base64Image);
                          setFormData((prev) => ({ ...prev, photoURL: compressedBase64 }));
                          toast.success('Foto profil berhasil dimuat!');
                        } catch (err) {
                          toast.error('Gagal memproses foto.');
                        }
                      };
                      reader.onerror = () => toast.error('Gagal membaca file.');
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className="text-[8px] font-bold text-indigo-500 uppercase mt-2 tracking-wide">
                    Klik lingkaran untuk unggah foto profil siswa
                  </p>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-indigo-600 tracking-wide ml-1 mb-1.5 block col-auto">
                    ID Unik (Document ID) *
                  </label>
                  <div className="relative group">
                    <IdentificationIcon className="absolute left-4 top-3.5 w-4 h-4 text-indigo-400" />
                    <input
                      required={!!editingId}
                      disabled={!canManage}
                      type="text"
                      value={formData.idUnik || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          idUnik: val,
                          studentsId: val,
                        });
                      }}
                      className="w-full bg-indigo-50/50 dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold disabled:opacity-70 text-indigo-700 dark:text-indigo-300"
                      placeholder="STD-YYYY-XXXX ATAU KOSONG UNTUK AUTO"
                    />
                  </div>
                  {!editingId && (
                    <p className="text-[8px] text-indigo-400 font-bold mt-1 uppercase tracking-wider">
                      ℹ️ Kosongkan untuk generate ID otomatis (STD-2026-...)
                    </p>
                  )}
                  {editingId && (
                    <p className="text-[8px] text-amber-600 dark:text-amber-400 font-bold mt-1 uppercase tracking-wider leading-relaxed">
                      ⚠️ Perubahan ID Unik akan memicu migrasi data secara otomatis saat disimpan.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 tracking-wide ml-1 mb-1.5 block">
                    Jabatan / role
                  </label>
                  <div className="relative">
                    <ShieldCheckIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <select
                      value={formData.role || 'Siswa'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-10 text-xs font-bold appearance-none cursor-pointer"
                    >
                      <option value="Siswa">1. Siswa</option>
                      <option value="Ketua Kelas">2. Ketua Kelas</option>
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 tracking-wide ml-1 mb-1.5 block">
                    Nama lengkap sesuai ijazah *
                  </label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      required
                      type="text"
                      value={formData.namaLengkap || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, namaLengkap: e.target.value.toUpperCase() })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
                      placeholder="Contoh: ADELIA SRI SUNDARI"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: MANAJEMEN STATUS */}
            {editingId && canManage && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 bg-amber-500 h-4 rounded-full"></div>
                  <h4 className="text-[10px] font-bold capitalize text-amber-600 tracking-wider">
                    Manajemen Status Data
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleMoveTo('alumni')}
                    className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all group active:scale-95 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-55 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600">
                        <AcademicCapIcon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-white uppercase leading-none">
                          Luluskan ke alumni
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                          Pindah ke koleksi alumni
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveTo('mutasi')}
                    className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-rose-500 transition-all group active:scale-95 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/40 rounded-xl flex items-center justify-center text-rose-600">
                        <BriefcaseIcon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-white uppercase leading-none">
                          Pindahkan ke mutasi
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                          Pindah ke koleksi mutasi
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-slate-200 group-hover:text-rose-500 transition-colors" />
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 3: DATA AKADEMIK (V2) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 bg-emerald-500 h-4 rounded-full"></div>
                <h4 className="text-[10px] font-bold capitalize text-emerald-600 tracking-wider">
                  Informasi Akademik (V2 Schema)
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 tracking-wide ml-1 mb-1.5 block">
                    NISN (10 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.nisn || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, nisn: val.substring(0, 10) });
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                    placeholder="10 Digit"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 tracking-wide ml-1 mb-1.5 block">
                    Tahun Angkatan
                  </label>
                  <input
                    type="text"
                    value={formData.metadataAkademik?.tahunAngkatan || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadataAkademik: {
                          ...formData.metadataAkademik,
                          tahunAngkatan: e.target.value,
                        } as any,
                      })
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                    placeholder="Cth: 2025"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 tracking-wide ml-1 mb-1.5 block">
                    Rombongan belajar
                  </label>
                  <div className="relative">
                    <select
                      value={formData.tingkatRombel || ''}
                      onChange={(e) => {
                        const tr = e.target.value;
                        setFormData({
                          ...formData,
                          tingkatRombel: tr,
                          metadataAkademik: {
                            ...formData.metadataAkademik,
                            kelasId: tr ? tr.replace(/\s+/g, '_') + '_2025' : '',
                          } as any,
                        });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold appearance-none cursor-pointer shadow-sm"
                    >
                      <option value="">-- TANPA ROMBEL --</option>
                      {classList.map((c, i) => (
                        <option key={`${c}-${i}`} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 tracking-wide ml-1 mb-1.5 block">
                    Tanggal Diterima
                  </label>
                  <input
                    type="date"
                    value={formData.metadataAkademik?.tanggalDiterima || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadataAkademik: {
                          ...formData.metadataAkademik,
                          tanggalDiterima: e.target.value,
                        } as any,
                      })
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 tracking-wide ml-1 mb-1.5 block">
                    Status siswa
                  </label>
                  <select
                    value={formData.status || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                    <option value="Lulus">Lulus</option>
                    <option value="Mutasi">Mutasi</option>
                    <option value="Keluar">Keluar</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Jenis Kelamin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, jenisKelamin: 'Laki-laki' })}
                      className={`py-3.5 rounded-xl border text-[9px] font-bold uppercase transition-all ${formData.jenisKelamin === 'Laki-laki' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-400'}`}
                    >
                      L
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, jenisKelamin: 'Perempuan' })}
                      className={`py-3.5 rounded-xl border text-[9px] font-bold uppercase transition-all ${formData.jenisKelamin === 'Perempuan' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-400'}`}
                    >
                      P
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: DATA PRIBADI & KONTAK */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 bg-sky-500 h-4 rounded-full"></div>
                <h4 className="text-[10px] font-bold capitalize text-sky-600 tracking-wider">
                  Data Pribadi & Kontak
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={formData.tempatLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                    placeholder="Kota/Kab"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wide ml-1 mb-1.5 block">
                    Tanggal Lahir
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={formData.tanggalLahir || ''}
                      onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    No. WhatsApp / HP (628...)
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.noTelepon || ''}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^\d+]/g, '');
                        if (val.startsWith('+62')) val = '62' + val.substring(3);
                        if (val.startsWith('08')) val = '628' + val.substring(2);
                        if (val.startsWith('8')) val = '628' + val.substring(1);
                        setFormData({ ...formData, noTelepon: val });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold shadow-sm"
                      placeholder="628123456789"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Email Siswa
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value.toLowerCase() })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold shadow-sm"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Alamat Domisili Lengkap
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                    <textarea
                      rows={3}
                      value={formData.alamat || ''}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none resize-none shadow-sm"
                      placeholder="Jalan, Desa/Kelurahan, Kecamatan..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: DATA KELUARGA */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 bg-violet-500 h-4 rounded-full"></div>
                <h4 className="text-[10px] font-bold capitalize text-violet-600 tracking-wider">
                  Data Keluarga & Wali
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Nama Ayah Kandung
                  </label>
                  <input
                    type="text"
                    value={formData.namaAyahKandung || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, namaAyahKandung: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Nama Ibu Kandung
                  </label>
                  <input
                    type="text"
                    value={formData.namaIbuKandung || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, namaIbuKandung: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Nama Wali (Jika Tidak Bersama Orang Tua)
                  </label>
                  <input
                    type="text"
                    value={formData.namaWali || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, namaWali: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 6: KEBUTUHAN KHUSUS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 bg-rose-500 h-4 rounded-full"></div>
                <h4 className="text-[10px] font-bold uppercase text-rose-600 tracking-wider">
                  Kesehatan & Kebutuhan Khusus
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Kebutuhan Khusus
                  </label>
                  <input
                    type="text"
                    value={formData.kebutuhanKhusus || ''}
                    onChange={(e) => setFormData({ ...formData, kebutuhanKhusus: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                    placeholder="Misal: Tunanetra, Lambat Belajar..."
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1.5 block">
                    Disabilitas
                  </label>
                  <input
                    type="text"
                    value={formData.disabilitas || ''}
                    onChange={(e) => setFormData({ ...formData, disabilitas: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                    placeholder="Jenis disabilitas"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: KONTAK & WALI (V2) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 bg-amber-500 h-4 rounded-full"></div>
                <h4 className="text-[10px] font-bold capitalize text-amber-600 tracking-wider">
                  Kontak & Data Wali (V2 Schema)
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 tracking-wide ml-1 mb-1.5 block">
                    NAMA WALI
                  </label>
                  <input
                    type="text"
                    value={formData.kontakDanWali?.namaWali || formData.namaWali || ''}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFormData({
                        ...formData,
                        namaWali: val,
                        kontakDanWali: {
                          ...formData.kontakDanWali,
                          namaWali: val,
                        } as any,
                      });
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                    placeholder="Nama Lengkap Wali"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-450 tracking-wide ml-1 mb-1.5 block">
                    NOMOR HP WALI (WA)
                  </label>
                  <input
                    type="text"
                    value={formData.kontakDanWali?.nomorHpWaliWhatsApp || formData.noTelepon || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({
                        ...formData,
                        noTelepon: val,
                        kontakDanWali: {
                          ...formData.kontakDanWali,
                          nomorHpWaliWhatsApp: val,
                          nomorHpSiswa: val,
                        } as any,
                      });
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                    placeholder="628..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 tracking-wide ml-1 mb-1.5 block">
                    ALAMAT RUMAH
                  </label>
                  <textarea
                    rows={2}
                    value={formData.kontakDanWali?.alamatRumah || formData.alamat || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alamat: e.target.value,
                        kontakDanWali: {
                          ...formData.kontakDanWali,
                          alamatRumah: e.target.value,
                        } as any,
                      })
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm"
                    placeholder="Alamat Lengkap"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1121] flex gap-4 shrink-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] text-left">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 transition-all text-[10px] uppercase tracking-wide active:scale-95"
          >
            Batal
          </button>
          {formData.noTelepon && formData.idUnik && (
            <button
              type="button"
              onClick={handleSendLink}
              disabled={isSendingLink}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all font-mono"
            >
              {isSendingLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <WhatsAppIcon className="w-4 h-4" />
              )}
              <span className="uppercase tracking-wide text-[9px]">Kirim Akun</span>
            </button>
          )}
          <button
            type="submit"
            form="studentForm"
            disabled={saving}
            className="flex-[2] bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 transition-all font-mono"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <SaveIcon className="w-5 h-5" />
            )}
            <span className="uppercase tracking-[0.2em] text-[10px]">Simpan ke database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default StudentFormModal;
