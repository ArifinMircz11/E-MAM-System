import { useState, useEffect } from 'react';

export interface StudentProfileData {
  idUnik: string;
  namaLengkap: string;
  nik: string;
  alamat: string;
  tempatLahir: string;
  tanggalLahir: string;
  namaAyahKandung: string;
  namaIbuKandung: string;
  tingkatRombel: string;
  isSso: boolean;
  role?: string;
}

export const useProfileValidation = (profile: StudentProfileData | null) => {
  const [emptyFields, setEmptyFields] = useState<string[]>([]);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true);

  // Field wajib minimum untuk operasional Dapodik/Sistem Madrasah e-Mam v8.0
  const requiredFields = [
    'nik',
    'alamat',
    'tempatLahir',
    'tanggalLahir',
    'namaAyahKandung',
    'namaIbuKandung',
  ];

  useEffect(() => {
    if (!profile) return;

    // SSO Bypass Logic: Akun SSO diberikan dispensasi pendaftaran awal,
    // namun akun mandiri dicek secara ketat.
    if (profile.isSso) {
      setEmptyFields([]);
      setIsProfileComplete(true);
      return;
    }

    // Bypass for non-students (teachers, admins, developers)
    if (profile.role && profile.role !== 'SISWA' && profile.role !== 'siswa') {
      setEmptyFields([]);
      setIsProfileComplete(true);
      return;
    }

    const missing: string[] = [];
    requiredFields.forEach((field) => {
      const value = profile[field as keyof StudentProfileData];
      if (typeof value === 'string' && value.trim() === '') {
        missing.push(field);
      }
    });

    setEmptyFields(missing);
    setIsProfileComplete(missing.length === 0);
  }, [profile]);

  return { emptyFields, isProfileComplete };
};
