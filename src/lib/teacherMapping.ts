import type { Teacher} from '@/types';
import { UserRole, EmploymentStatus, AsnStatus } from '@/types';

export const mapRawDataToTeacher = (item: any): Partial<Teacher> => {
  // Normalize keys: trim whitespace and convert to uppercase for robust matching
  const normalizedItem: Record<string, any> = {};
  for (const key in item) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      normalizedItem[key.trim().toUpperCase()] = item[key];
    }
  }

  const val = (keys: string[]) => {
    for (const k of keys) {
      if (
        normalizedItem[k] !== undefined &&
        normalizedItem[k] !== null &&
        normalizedItem[k] !== ''
      ) {
        return normalizedItem[k];
      }
    }
    return '';
  };

  const name = String(val(['NAMA', 'NAMA LENGKAP', 'NAME'])).trim();
  const id = String(val(['ID UNIK', 'ID_UNIK', 'IDUNIK'])).trim();
  const nip = String(val(['NIP'])).trim();
  const nik = String(val(['NIK'])).trim();
  const idFinal = id || nip || nik || `TCH-${Date.now()}`;
  
  const role = (String(val(['ROLE']))
    .trim()
    .toUpperCase() || UserRole.GURU) as UserRole;
    
  const phone = String(val(['NOMOR HANDPHONE', 'NO HANDPHONE', 'NO HP', 'HP', 'PHONE', 'TELEPON']));
  const mapel = String(val(['MATA PELAJARAN', 'MAPEL', 'SUBJECT']));
  
  const rawStatus = String(val(['STATUS KEPEGAWAIAN', 'STATUS', 'STATUS PEGAWAI'])).toUpperCase();
  let employmentStatus: EmploymentStatus = EmploymentStatus.HONORER;
  let asnStatus: AsnStatus = AsnStatus.NON_ASN;

  if (rawStatus.includes('PNS')) {
    employmentStatus = EmploymentStatus.PNS;
    asnStatus = AsnStatus.ASN;
  } else if (rawStatus.includes('PPPK')) {
    employmentStatus = EmploymentStatus.PPPK;
    asnStatus = AsnStatus.ASN;
  } else if (rawStatus.includes('GTY')) {
    employmentStatus = EmploymentStatus.GTY;
  } else if (rawStatus.includes('GTT')) {
    employmentStatus = EmploymentStatus.GTT;
  } else if (rawStatus.includes('HONORER')) {
    employmentStatus = EmploymentStatus.HONORER;
  } else if (rawStatus.includes('KONTRAK')) {
    employmentStatus = EmploymentStatus.KONTRAK;
  }

  const tugas = String(val(['TUGAS', 'TUGAS TAMBAHAN', 'TUGAS POKOK', 'JABATAN'])) || 'Guru Mapel';

  return {
    idUnik: idFinal,
    id: idFinal,
    namaLengkap: name,
    nik: nik,
    nip: nip,
    nuptk: String(val(['NUPTK'])),
    employmentStatus,
    asnStatus,
    jabatan: tugas,
    jenisKelamin: String(val(['JENIS KELAMIN', 'L/P', 'GENDER', 'JK', 'SEX']))
      .toUpperCase()
      .startsWith('P')
      ? 'P'
      : 'L',
    tempatLahir: String(val(['TEMPAT LAHIR', 'TEMPAT'])),
    tanggalLahir: String(val(['TANGGAL LAHIR', 'TGL LAHIR', 'BIRTHDATE'])),
    email: String(val(['EMAIL'])).toLowerCase(),
    telepon: phone,
    alamat: String(val(['ALAMAT', 'ADDRESS'])),
    statusAktif: true,
    
    // Legacy mapping for compatibility
    status: employmentStatus,
    tugas: tugas,
    mapel: mapel,
    subject: mapel,
    phone: phone,
    address: String(val(['ALAMAT', 'ADDRESS'])),
    
    jabatanDanStatus: {
      jabatanUtama: tugas,
      statusPegawai: employmentStatus,
      pangkatGolongan: '-',
      pendidikanTerakhir: 'S1',
    },
    penugasanAkademik: {
      isWaliKelas: !!val(['WALI KELAS']),
      waliKelasDi: String(val(['WALI KELAS'])),
      mapelUtama: mapel,
      totalJTM: String(val(['TOTAL JTM', 'JTM', 'JAM TATAP MUKA'])),
      isPembinaEkskul: false,
    },
    kontak: {
      nomorHpWhatsApp: phone,
      alamatLengkap: String(val(['ALAMAT', 'ADDRESS'])),
    },
    sistemJangkar: {
      tenantId: '',
      userId: idFinal,
      roleSistem: role.toLowerCase(),
      isClaimed: false,
      ttdDigitalUrl: '',
      diperbaruiPada: new Date().toISOString(),
      diperbaruiOleh: 'System Import',
    },
  };
};
