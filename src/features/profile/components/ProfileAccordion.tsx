import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  UserIcon,
  GraduationCapIcon,
  IdentificationIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  MapPinIcon,
  WhatsAppIcon,
  BuildingLibraryIcon,
  BriefcaseIcon,
} from '@/shared/Icons';
import { InfoItem } from './InfoItem';

interface ProfileAccordionProps {
  profile: any;
  theme: any;
  missingFields: string[];
  onEdit: (title: string, defaultValues: any) => void;
}

const Section = ({ title, icon: Icon, children, isOpen, onToggle, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 ${colorClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
          {title}
        </span>
      </div>
      <ChevronDownIcon
        className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="px-2">{children}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const ProfileAccordion: React.FC<ProfileAccordionProps> = ({
  profile,
  theme,
  missingFields,
  onEdit,
}) => {
  const [openSection, setOpenSection] = useState<string | null>('akun');

  const isStudent = ['siswa', 'ketua_kelas'].includes(profile.role?.toLowerCase() || '');

  const capitalizeWords = (str: string) =>
    str ? str.replace(/\b\w/g, (l) => l.toUpperCase()) : '-';

  return (
    <div className="space-y-4 w-full">
      {/* --- PENGATURAN AKUN --- */}
      <Section
        title="Pengaturan Akun"
        icon={UserIcon}
        colorClass="text-indigo-500"
        isOpen={openSection === 'akun'}
        onToggle={() => setOpenSection(openSection === 'akun' ? null : 'akun')}
      >
        <div className="space-y-1">
          <InfoItem
            icon={IdentificationIcon}
            label="Nama Lengkap"
            value={capitalizeWords(profile.displayName)}
            theme={theme}
          />
          <InfoItem icon={EnvelopeIcon} label="Email" value={profile.email} theme={theme} />
          <InfoItem
            icon={ShieldCheckIcon}
            label="Status Akun"
            value={
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${profile.isSso ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}
                >
                  {profile.isSso
                    ? 'Verified (SSO)'
                    : profile.accountStatus === 'Active'
                      ? 'Aktif'
                      : 'Dalam Tinjauan'}
                </span>
              </div>
            }
            theme={theme}
          />
          <button
            onClick={() =>
              onEdit(isStudent ? 'Update Data Pokok (Induk)' : 'Edit Profil Pengguna', {
                displayName: profile.displayName || '',
              })
            }
            className="mt-4 w-full text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-3 rounded-xl active:scale-95 transition-transform"
          >
            Edit Akun
          </button>
        </div>
      </Section>

      {/* --- DATA POKOK --- */}
      <Section
        title={isStudent ? 'Data Pokok Siswa' : 'Data Pokok GTK / Staf'}
        icon={GraduationCapIcon}
        colorClass="text-amber-500"
        isOpen={openSection === 'dataPokok'}
        onToggle={() => setOpenSection(openSection === 'dataPokok' ? null : 'dataPokok')}
      >
        <div className="space-y-1">
          {isStudent ? (
            <>
              <InfoItem
                icon={IdentificationIcon}
                label="ID Unik"
                value={profile.idUnik}
                theme={theme}
              />
              <InfoItem
                icon={IdentificationIcon}
                label="NISN"
                value={profile.nisn || '-'}
                theme={theme}
              />
              <InfoItem
                icon={IdentificationIcon}
                label="NIK"
                value={
                  <span className={missingFields.includes('nik') ? 'text-red-500 font-bold' : ''}>
                    {profile.nik || (missingFields.includes('nik') ? 'Wajib Diisi' : '-')}
                  </span>
                }
                theme={theme}
              />
              <InfoItem
                icon={MapPinIcon}
                label="Tempat, Tanggal Lahir"
                value={
                  <span
                    className={
                      missingFields.includes('tempatLahir') ||
                      missingFields.includes('tanggalLahir')
                        ? 'text-red-500 font-bold'
                        : ''
                    }
                  >
                    {`${profile.tempatLahir || (missingFields.includes('tempatLahir') ? 'Wajib' : '-')}, ${profile.tanggalLahir || (missingFields.includes('tanggalLahir') ? 'Wajib' : '-')}`}
                  </span>
                }
                theme={theme}
              />
            </>
          ) : (
            <>
              <InfoItem
                icon={IdentificationIcon}
                label="NIP"
                value={profile.nip || '-'}
                theme={theme}
              />
              <InfoItem
                icon={IdentificationIcon}
                label="NIK"
                value={profile.nik || '-'}
                theme={theme}
              />
              <InfoItem
                icon={BuildingLibraryIcon}
                label="Mata Pelajaran"
                value={profile.mapel || profile.subject || '-'}
                theme={theme}
              />
              <InfoItem
                icon={BriefcaseIcon}
                label="Jabatan/Peran"
                value={profile.jabatan || profile.role?.toUpperCase() || '-'}
                theme={theme}
              />
            </>
          )}
          <button
            onClick={() => onEdit('Update Data Pokok (Induk)', profile)}
            className="mt-4 w-full text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-3 rounded-xl active:scale-95 transition-transform"
          >
            Koreksi Data Pokok
          </button>
        </div>
      </Section>

      {/* --- KONTAK & ALAMAT --- */}
      <Section
        title="Kontak & Alamat"
        icon={WhatsAppIcon}
        colorClass="text-emerald-500"
        isOpen={openSection === 'kontak'}
        onToggle={() => setOpenSection(openSection === 'kontak' ? null : 'kontak')}
      >
        <div className="space-y-1">
          <InfoItem icon={WhatsAppIcon} label="WhatsApp" value={profile.phone} theme={theme} />
          <InfoItem icon={MapPinIcon} label="Alamat" value={profile.address} theme={theme} />
          <button
            onClick={() =>
              onEdit('Edit Profil Pengguna', {
                phone: profile.phone || '',
                address: profile.address || '',
              })
            }
            className="mt-4 w-full text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-3 rounded-xl active:scale-95 transition-transform"
          >
            Edit Kontak
          </button>
        </div>
      </Section>
    </div>
  );
};
