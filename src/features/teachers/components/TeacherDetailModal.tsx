/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React from 'react';
import { 
  XCircleIcon, 
  UserIcon, 
  WhatsAppIcon, 
  EnvelopeIcon,
  IdentificationIcon,
  BookOpenIcon,
  CalendarIcon,
  GlobeAltIcon,
  BriefcaseIcon
} from '@/shared/Icons';
import { CheckCircleIcon } from 'lucide-react';
import type { Teacher } from '@/types';
import { getPlaceholderAvatar } from '@/utils/avatarHelper';

interface TeacherDetailModalProps {
  teacher: Teacher | null;
  onClose: () => void;
}

const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  teacher,
  onClose,
}) => {
  if (!teacher) return null;

  const isClaimed = teacher.sistemJangkar?.isClaimed ?? teacher.isClaimed;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0B1121] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-white/10">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-tight text-base leading-none text-left">
              Detail Profil GTK
            </h3>
            <p className="text-[8px] font-bold text-indigo-500 uppercase mt-2 text-left">
              Informasi Terintegrasi Database Emis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <XCircleIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl mb-4 bg-slate-50 dark:bg-slate-900">
              <img
                src={teacher.photoURL || getPlaceholderAvatar(teacher.namaLengkap || teacher.name || '')}
                alt={teacher.namaLengkap}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">
              {capitalizeWords(teacher.namaLengkap || teacher.name || '')}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wide border border-indigo-100 dark:border-indigo-900">
                {teacher.jabatan || teacher.jabatanDanStatus?.jabatanUtama || 'Guru Mapel'}
              </span>
              {isClaimed && (
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wide border border-emerald-100 dark:border-emerald-900 flex items-center gap-1">
                  <CheckCircleIcon className="w-3 h-3" />
                  Terklaim
                </span>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 bg-indigo-500 h-3 rounded-full"></div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identitas Kepegawaian</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={IdentificationIcon} label="NIP" value={teacher.nip || '-'} />
                <InfoItem icon={IdentificationIcon} label="NIK" value={teacher.nik || '-'} />
                <InfoItem icon={IdentificationIcon} label="NUPTK" value={teacher.nuptk || '-'} />
                <InfoItem icon={BriefcaseIcon} label="Status" value={teacher.jabatanDanStatus?.statusPegawai || teacher.status || '-'} />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 bg-indigo-500 h-3 rounded-full"></div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penugasan Akademik</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <InfoItem icon={BookOpenIcon} label="Mata Pelajaran" value={teacher.penugasanAkademik?.mapelUtama || teacher.mapel || teacher.subject || '-'} />
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem icon={CalendarIcon} label="Total JTM" value={`${teacher.penugasanAkademik?.totalJTM || teacher.totalJTM || '0'} Jam`} />
                  <InfoItem icon={CheckCircleIcon} label="Wali Kelas" value={teacher.penugasanAkademik?.isWaliKelas ? `Kelas ${teacher.penugasanAkademik.waliKelasDi || '-'}` : 'Bukan Wali Kelas'} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 bg-indigo-500 h-3 rounded-full"></div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Kontak & Alamat</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <InfoItem icon={EnvelopeIcon} label="Email" value={teacher.email || '-'} isEmail />
                <InfoItem icon={WhatsAppIcon} label="WhatsApp" value={teacher.kontak?.nomorHpWhatsApp || teacher.phone || '-'} isWhatsApp />
                <InfoItem icon={GlobeAltIcon} label="Alamat" value={teacher.kontak?.alamatLengkap || teacher.address || '-'} />
              </div>
            </section>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
            ID Database: {teacher.idUnik || teacher.teachersId || teacher.id || '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, isWhatsApp, isEmail }: any) => (
  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-3 h-3 text-indigo-500" />
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
      {isWhatsApp && value !== '-' ? (
        <a
          href={`https://wa.me/${String(value).replace(/^0/, '62')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 hover:underline flex items-center gap-1"
        >
          {value}
        </a>
      ) : isEmail && value !== '-' ? (
        <a href={`mailto:${value}`} className="text-indigo-600 hover:underline">
          {value}
        </a>
      ) : (
        value
      )}
    </div>
  </div>
);
