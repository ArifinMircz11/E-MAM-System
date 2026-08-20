/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useRef } from 'react';
import { 
  XCircleIcon, 
  UserIcon, 
  IdentificationIcon, 
  GlobeAltIcon, 
  CalendarIcon, 
  CameraIcon,
  ChevronDownIcon,
  SaveIcon
} from '@/shared/Icons';
import { Loader2 } from 'lucide-react';
import type { Teacher } from '@/types';
import { UserRole } from '@/types';
import { EmploymentStatus, AsnStatus } from '@/types/roles';
import { toast } from 'sonner';

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  formData: Partial<Teacher>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Teacher>>>;
  onSave: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  claimActive: boolean;
  setClaimActive: (active: boolean) => void;
  initialPassword: string;
  setInitialPassword: (pass: string) => void;
}

// Input Wrapper Component
const InputField = ({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
}: any) => {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
        />
      </div>
    </div>
  );
};

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  isOpen,
  onClose,
  editingId,
  formData,
  setFormData,
  onSave,
  saving,
  claimActive,
  setClaimActive,
  initialPassword,
  setInitialPassword,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);

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
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0B1121] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-white/10">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1121] z-10">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-tight text-base leading-none text-left">
              {editingId ? 'Edit Data Guru' : 'Tambah Guru Baru'}
            </h3>
            <p className="text-[8px] font-bold text-indigo-500 uppercase mt-2 text-left">
              Sinkronisasi Database Pegawai
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <XCircleIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative z-10">
          <form id="teacherForm" onSubmit={onSave} className="space-y-6 text-left">
            {/* PHOTO PROFIL UPLOADER */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
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
              <p className="text-[8px] font-bold text-indigo-500 uppercase mt-2 tracking-wide text-center">
                Klik lingkaran untuk unggah foto profil guru
              </p>
            </div>

            <InputField
              label="Nama Lengkap & Gelar *"
              icon={UserIcon}
              value={formData.namaLengkap || formData.name || ''}
              onChange={(v: string) => setFormData({ ...formData, namaLengkap: v, name: v })}
              placeholder="Contoh: Akhmad Arifin, S.Pd"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 w-full">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                  Status ASN *
                </label>
                <div className="relative">
                  <select
                    value={formData.asnStatus || AsnStatus.NON_ASN}
                    onChange={(e) => {
                      const val = e.target.value as AsnStatus;
                      setFormData({ ...formData, asnStatus: val });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-[11px] font-bold outline-none cursor-pointer appearance-none shadow-inner text-left"
                  >
                    <option value={AsnStatus.ASN}>ASN (PNS/PPPK)</option>
                    <option value={AsnStatus.NON_ASN}>NON-ASN (GTY/GTT/Lainnya)</option>
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <InputField
                label="NIK (16 Digit) *"
                icon={IdentificationIcon}
                value={formData.nik || ''}
                onChange={(v: string) => {
                  const val = v.replace(/\D/g, '').substring(0, 16);
                  setFormData({ ...formData, nik: val });
                }}
                placeholder="Wajib untuk Seluruh Guru"
                maxLength={16}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField
                label="NIP (Identitas Guru ASN)"
                icon={IdentificationIcon}
                value={formData.nip || ''}
                onChange={(v: string) => {
                  const val = v.replace(/\D/g, '');
                  setFormData({ ...formData, nip: val });
                }}
                placeholder="Wajib untuk PNS/PPPK"
              />
              <InputField
                label="NUPTK"
                icon={IdentificationIcon}
                value={formData.nuptk || ''}
                onChange={(v: string) => setFormData({ ...formData, nuptk: v })}
                placeholder="Opsional (16 Digit)"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 w-full">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                  Jenis Kelamin
                </label>
                <div className="relative">
                  <select
                    value={formData.jenisKelamin || formData.gender || 'L'}
                    onChange={(e) =>
                      setFormData({ ...formData, jenisKelamin: e.target.value as any, gender: e.target.value as any })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-[11px] font-bold outline-none cursor-pointer appearance-none shadow-inner text-left"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <InputField
                label="Tempat Lahir"
                icon={GlobeAltIcon}
                value={formData.tempatLahir || ''}
                onChange={(v: string) => setFormData({ ...formData, tempatLahir: v })}
                placeholder="Kota Kemahiran"
              />
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 bg-indigo-500 h-3 rounded-full"></div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                  Jabatan & Penugasan
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField
                  label="Tanggal Lahir *"
                  icon={CalendarIcon}
                  value={formData.tanggalLahir || formData.birthDate || ''}
                  onChange={(v: string) => setFormData({ ...formData, tanggalLahir: v, birthDate: v })}
                  type="date"
                />
                <div className="space-y-1.5 w-full">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    Status Kepegawaian
                  </label>
                  <div className="relative">
                    <select
                      value={formData.employmentStatus || EmploymentStatus.HONORER}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employmentStatus: e.target.value as EmploymentStatus,
                          status: e.target.value as any
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-[11px] font-bold outline-none cursor-pointer appearance-none shadow-inner text-left"
                    >
                      <option value={EmploymentStatus.PNS}>PNS</option>
                      <option value={EmploymentStatus.PPPK}>PPPK</option>
                      <option value={EmploymentStatus.GTY}>GTY (Guru Tetap Yayasan)</option>
                      <option value={EmploymentStatus.HONORER}>Honorer / GTT</option>
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField
                label="Mata Pelajaran Utama *"
                icon={GlobeAltIcon}
                value={formData.penugasanAkademik?.mapelUtama || formData.mapel || formData.subject || ''}
                onChange={(v: string) => setFormData({
                  ...formData,
                  mapel: v,
                  subject: v,
                  penugasanAkademik: {
                    ...formData.penugasanAkademik,
                    mapelUtama: v
                  } as any
                })}
                placeholder="Contoh: Matematika"
              />
              <InputField
                label="Total JTM (Jam Tatap Muka)"
                icon={CalendarIcon}
                value={formData.penugasanAkademik?.totalJTM || formData.totalJTM || '0'}
                onChange={(v: string) => setFormData({
                  ...formData,
                  totalJTM: v,
                  penugasanAkademik: {
                    ...formData.penugasanAkademik,
                    totalJTM: v
                  } as any
                })}
                type="number"
                placeholder="0"
              />
            </div>

            <InputField
              label="Email Guru (Aktivasi Akun)"
              icon={GlobeAltIcon}
              value={formData.email || ''}
              onChange={(v: string) => setFormData({ ...formData, email: v })}
              placeholder="nama@emam-system.web.id"
              type="email"
            />

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 bg-indigo-500 h-3 rounded-full"></div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                    Akses & Keamanan Akun
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Klaim Akun</span>
                  <button
                    type="button"
                    onClick={() => setClaimActive(!claimActive)}
                    className={`w-10 h-5 rounded-full transition-all relative ${claimActive ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${claimActive ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {claimActive && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <InputField
                    label={editingId ? "Ganti Password (Kosongkan jika tidak ubah)" : "Password Awal Akun *"}
                    icon={GlobeAltIcon}
                    value={initialPassword}
                    onChange={(v: string) => setInitialPassword(v)}
                    placeholder="Minimal 6 karakter"
                    type="password"
                  />
                  <p className="text-[8px] font-bold text-amber-500 mt-2 ml-1 uppercase">
                    Penting: Berikan password ini kepada guru terkait untuk login pertama kali.
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 z-10">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-bold uppercase text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
          >
            Batal
          </button>
          <button
            type="submit"
            form="teacherForm"
            disabled={saving}
            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" />
                <span>{editingId ? 'Simpan Perubahan' : 'Daftarkan Guru'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
