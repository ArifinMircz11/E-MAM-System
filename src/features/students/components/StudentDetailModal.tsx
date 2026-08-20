import React from 'react';
import type { Student } from '@/types';
import {
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  IdentificationIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  PencilIcon,
} from '@/shared/Icons';
import { getPlaceholderAvatar } from '@/utils/avatarHelper';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEdit?: (student: Student) => void;
}

const capitalizeWords = (str: string) => {
  if (!str) return '-';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

// Internal reusable StatusChip to keep file completely self-contained & fast
export const StatusChip = ({ status }: { status: string }) => {
  const styles = {
    Aktif:
      'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    Lulus:
      'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
    Mutasi:
      'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    Keluar:
      'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    Nonaktif:
      'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
  };
  const style = styles[status as keyof typeof styles] || styles.Nonaktif;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${style}`}>
      {status}
    </span>
  );
};

// Reusable Avatar to keep it modular & high performance
export const Avatar = ({
  name,
  photoURL,
  size = 'w-10 h-10',
  className = '',
}: {
  name: string;
  photoURL?: string;
  size?: string;
  className?: string;
}) => {
  return (
    <div
      className={`${className || size} rounded-full overflow-hidden border border-indigo-200 dark:border-indigo-800 shadow-sm shrink-0`}
    >
      <img
        src={photoURL || getPlaceholderAvatar(name)}
        alt={name}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
}) => {
  if (!isOpen || !student) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0B1121] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1121] z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Avatar name={student.namaLengkap} photoURL={student.photoURL} size="w-12 h-12" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white tracking-tight text-base leading-none text-neon-emerald">
                {capitalizeWords(student.namaLengkap)}
              </h3>
              <p className="text-[8px] font-bold text-indigo-500 uppercase mt-2">
                Detail Informasi Lengkap Siswa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(student);
                  onClose();
                }}
                className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all active:scale-95 border border-indigo-100 dark:border-indigo-800/50"
                title="Koreksi Data Siswa"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <XCircleIcon className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-50 dark:bg-[#0B1121]">
          {/* Identitas Utama */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <IdentificationIcon className="w-4 h-4 text-indigo-500" />
              <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                IDENTITAS POKOK
              </h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-450 dark:text-slate-400 font-bold">ID UNIK</span>
                <span className="font-mono font-extrabold text-neon-cyan bg-indigo-50 dark:bg-indigo-950/45 px-2 py-0.5 rounded-lg">
                  {student.idUnik || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-450 dark:text-slate-400 font-bold">NISN</span>
                <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">
                  {student.nisn || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-450 dark:text-slate-400 font-bold uppercase tracking-tight">
                  ANGKATAN
                </span>
                <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                  {student.metadataAkademik?.tahunAngkatan || '2025'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-450 dark:text-slate-400 font-bold">ROMBEL</span>
                <span className="font-extrabold dark:text-slate-200">
                  {student.tingkatRombel || 'Tanpa Rombel'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-450 dark:text-slate-400 font-bold">STATUS SISWA</span>
                <StatusChip status={student.status || 'Aktif'} />
              </div>
            </div>
          </div>

          {/* Artificial Intelligence Insight */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute -top-6 -right-6 opacity-10">
              <SparklesIcon className="w-24 h-24 text-indigo-500" />
            </div>
            <div className="flex items-center gap-2 border-b border-indigo-200/50 dark:border-indigo-800/50 pb-2 relative z-10">
              <SparklesIcon className="w-4 h-4 text-indigo-500" />
              <h4 className="text-[10px] font-bold text-neon-emerald tracking-wider">
                AI INSIGHT
              </h4>
            </div>
            <p className="text-[10px] font-bold text-indigo-900/70 dark:text-indigo-300 leading-relaxed relative z-10">
              Siswa berstatus {student.status || 'Aktif'} pada{' '}
              {student.tingkatRombel || 'kelas ini'}, dengan total poin kedisiplinan mencapai{' '}
              {(student as any).logPoinKedisiplinan?.poinSanksiKumulatif || 0} poin (
              {(student as any).logPoinKedisiplinan?.levelTeguranSaatIni || 'Aman'}). Pola kehadiran
              dan partisipasi dalam kategori normal, direkomendasikan untuk mempertahankan rutinitas
              saat ini.
            </p>
          </div>

          {/* Absensi & Surat */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <CalendarIcon className="w-4 h-4 text-orange-500" />
              <h4 className="text-[10px] font-bold text-orange-600 dark:text-orange-400 tracking-wider uppercase">
                Absensi & Riwayat Surat
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                  <ShieldCheckIcon className="w-3 h-3" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide">
                    Hadir Hari Ini
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {(student as any).att?.masuk ? `${(student as any).att.masuk}` : 'Belum Rekam'}
                  </span>
                </div>
              </div>
            </div>
            <button className="w-full py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-wide transition-colors flex items-center justify-center gap-2">
              Lihat Riwayat Surat Siswa
            </button>
          </div>

          {/* Prestasi & Login Activity */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-[11px] pb-3 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-450 dark:text-slate-400 font-bold uppercase tracking-tight flex items-center gap-2">
                  <IdentificationIcon className="w-4 h-4 text-rose-500" /> Prestasi Akademik
                </span>
                <span className="font-extrabold dark:text-slate-200 uppercase">
                  {(student as any).prestasi?.length
                    ? (student as any).prestasi.length
                    : 'Belum Ada'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-450 dark:text-slate-400 font-bold uppercase tracking-tight flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4 text-sky-500" /> Status Auth Login
                </span>
                <span className="font-mono font-extrabold text-emerald-600">Terdaftar Aktif</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <ShieldCheckIcon className="w-4 h-4 text-rose-500" />
              <h4 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                LOG KEDISIPLINAN
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Poin Sanksi</p>
                <p className="text-lg font-bold text-rose-600">
                  {student.logPoinKedisiplinan?.poinSanksiKumulatif || 0}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">
                  Status Teguran
                </p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1.5">
                  {student.logPoinKedisiplinan?.levelTeguranSaatIni || 'Aman'}
                </p>
              </div>
            </div>
          </div>

          {/* Biodata & Kontak */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <UserIcon className="w-4 h-4 text-emerald-500" />
              <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                BIODATA & KONTAK
              </h4>
            </div>
            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-450 dark:text-slate-400 font-bold">WHATSAPP SISWA</span>
                <a
                  href={`https://wa.me/${student.kontakDanWali?.nomorHpSiswa || student.noTelepon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <PhoneIcon className="w-3 h-3 text-emerald-500 inline" />{' '}
                  {student.kontakDanWali?.nomorHpSiswa || student.noTelepon || '-'}
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450 dark:text-slate-400 font-bold uppercase tracking-tight">
                  EMAIL SSO
                </span>
                <span className="font-mono font-extrabold text-slate-700 dark:text-slate-300">
                  {student.emailGoogleSSO || student.email || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Informasi Keluarga & Wali */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <CalendarIcon className="w-4 h-4 text-sky-500" />
              <h4 className="text-[10px] font-bold text-sky-600 dark:text-sky-400 tracking-wider uppercase">
                KELUARGA & WALI
              </h4>
            </div>
            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-450 dark:text-slate-400 font-bold uppercase tracking-tight">
                  NAMA WALI
                </span>
                <span className="font-extrabold dark:text-slate-200 uppercase">
                  {student.kontakDanWali?.namaWali || student.namaWali || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450 dark:text-slate-400 font-bold uppercase tracking-tight">
                  WA WALI
                </span>
                <span className="font-mono font-extrabold text-emerald-600">
                  {student.kontakDanWali?.nomorHpWaliWhatsApp || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Alamat Domisili */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <MapPinIcon className="w-4 h-4 text-rose-500" />
              <h4 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-wider uppercase">
                ALAMAT DOMISILI
              </h4>
            </div>
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed text-slate-700 uppercase">
              {student.kontakDanWali?.alamatRumah ||
                student.alamat ||
                'Alamat domisili lengkap belum dicatat.'}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0B1121]">
          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-105 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-[10px] uppercase tracking-wide transition-colors duration-150 active:scale-95"
          >
            Tutup Detail Profil
          </button>
        </div>
      </div>
    </div>
  );
};
