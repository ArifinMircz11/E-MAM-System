/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: UTILITY / SCHEMA TRANSFORMS (UnitTestable)
 */

export const transformDocData = (data: any, docId: string, masterRefs: any) => {
  // Target 1: roles[]
  let roles: string[] = [];
  if (Array.isArray(data.roles)) {
    roles = data.roles.map((r: any) => String(r).toLowerCase());
  } else if (typeof data.role === 'string') {
    roles = [data.role.toLowerCase()];
  } else if (Array.isArray(data.role)) {
    roles = data.role.map((r: any) => String(r).toLowerCase());
  }
  // Normalize role values to be lowercased clean words
  roles = roles.map((r) => (r === 'student' ? 'siswa' : r === 'teacher' ? 'guru' : r));
  roles = Array.from(new Set(roles.filter(Boolean)));

  // Target 2: accountType
  let accountType = data.accountType || '';
  if (!accountType) {
    if (roles.includes('siswa')) {
      accountType = 'student';
    } else if (roles.includes('guru') || roles.includes('wali_kelas') || roles.includes('admin')) {
      accountType = 'teacher';
    } else {
      accountType = 'unknown';
    }
  }

  // Target 3: referenceId
  let referenceId = data.referenceId || '';
  if (!referenceId) {
    const uid = data.uid || docId;
    if (accountType === 'student' && masterRefs?.students?.[uid]) {
      referenceId = masterRefs.students[uid];
    } else if (accountType === 'teacher' && masterRefs?.teachers?.[uid]) {
      referenceId = masterRefs.teachers[uid];
    } else {
      referenceId =
        data.studentId || data.studentsId || data.teachersId || data.teacherId || data.idUnik || '';
    }
  }

  // Target 4: studentsId or teachersId based on accountType
  const studentsId = accountType === 'student' ? data.studentsId || referenceId || '' : undefined;
  const teachersId = accountType === 'teacher' ? data.teachersId || referenceId || '' : undefined;

  // Target 5: default dates/status
  const uid = data.uid || docId;
  const tenantId = data.tenantId || '30315537';
  const displayName = data.displayName || data.namaLengkap || data.namaSiswa || data.namaGuru || '';
  const email = data.email || data.emailGoogleSSO || '';
  const phoneNumber = data.phoneNumber || data.phone || data.noHp || '';
  const status =
    data.status === 'offline' || data.status === 'online' || !data.status ? 'Active' : data.status;
  const isClaimed = data.isClaimed !== undefined ? data.isClaimed : false;
  const isSso = data.isSso !== undefined ? data.isSso : false;
  const rbacVersion = 2;
  const createdAt = data.createdAt || new Date().toISOString();
  const updatedAt = new Date().toISOString();

  let lastLoginAt = data.lastLoginAt || null;
  if (!lastLoginAt && data.lastLogin) {
    lastLoginAt = data.lastLogin;
  }

  // Build the clean schema with absolutely no deprecated keys
  const payload: any = {
    uid,
    tenantId,
    referenceId,
    accountType,
    roles,
    displayName,
    email,
    phoneNumber,
    status,
    isClaimed,
    isSso,
    rbacVersion,
    createdAt,
    updatedAt,
    lastLoginAt,
  };

  if (studentsId !== undefined) payload.studentsId = studentsId;
  if (teachersId !== undefined) payload.teachersId = teachersId;

  // Preserve essential dynamic fields
  if (data.photoURL) payload.photoURL = data.photoURL;
  if (data.coverURL) payload.coverURL = data.coverURL;
  if (data.classId) payload.classId = data.classId;
  if (data.tingkatRombel) payload.tingkatRombel = data.tingkatRombel;
  if (data.walasOfClass) payload.walasOfClass = data.walasOfClass;

  return payload;
};

export const transformStudentToV2 = (data: any, docId: string) => {
  return {
    studentsId: data.studentsId || data.idUnik || docId,
    idUnik: data.idUnik || data.studentsId || docId,
    nisn: data.nisn || '',
    nik: data.nik || '',
    namaLengkap: data.namaLengkap || data.namaSiswa || '',
    jenisKelamin: data.jenisKelamin || '',
    emailGoogleSSO: data.email || data.emailGoogleSSO || '',
    tingkatRombel: data.tingkatRombel || '',
    classId: data.classId || '',
    statusAktif: data.status === 'Aktif' || data.statusAktif === true,

    metadataAkademik: {
      tahunAngkatan:
        data.metadataAkademik?.tahunAngkatan || data.tahunMasuk || data.tahunAngkatan || '2025',
      tanggalDiterima: data.metadataAkademik?.tanggalDiterima || data.tanggalDiterima || '',
      targetRombel: data.metadataAkademik?.targetRombel || data.targetRombel || 'All',
    },

    kontakDanWali: {
      namaWali: data.kontakDanWali?.namaWali || data.namaWali || data.ayahNama || '',
      nomorHpWaliWhatsApp:
        data.kontakDanWali?.nomorHpWaliWhatsApp ||
        data.nomorHpWali ||
        data.nomorHpWaliWhatsApp ||
        '',
      hubunganWali: data.kontakDanWali?.hubunganWali || data.hubunganWali || 'Ayah',
      alamatRumah: data.kontakDanWali?.alamatRumah || data.alamat || data.alamatRumah || '',
      nomorHpSiswa: data.kontakDanWali?.nomorHpSiswa || data.noTelepon || data.nomorHpSiswa || '',
    },

    logPoinKedisiplinan: {
      poinSanksiKumulatif:
        data.logPoinKedisiplinan?.poinSanksiKumulatif || data.poin || data.poinSanksiKumulatif || 0,
      totalTerlambat: data.logPoinKedisiplinan?.totalTerlambat || data.totalTerlambat || 0,
      totalPulangCepat: data.logPoinKedisiplinan?.totalPulangCepat || data.totalPulangCepat || 0,
      totalAlpa: data.logPoinKedisiplinan?.totalAlpa || data.totalAlpa || 0,
      totalPelanggaranSesiTs:
        data.logPoinKedisiplinan?.totalPelanggaranSesiTs || data.totalPelanggaranSesiTs || 0,
      levelTeguranSaatIni:
        data.logPoinKedisiplinan?.levelTeguranSaatIni || data.levelTeguranSaatIni || 'Aman',
    },

    sistemJangkar: {
      tenantId: data.sistemJangkar?.tenantId || data.tenantId || '30315537',
      userId: data.sistemJangkar?.userId || data.linkedUserId || data.userId || '',
      isClaimed:
        data.sistemJangkar?.isClaimed !== undefined
          ? data.sistemJangkar?.isClaimed
          : data.isClaimed || false,
      diperbaruiPada: new Date().toISOString(),
      diperbaruiOleh: 'System Migration',
    },
  };
};

export const transformTeacherToV2 = (data: any, docId: string) => {
  return {
    teachersId: data.teachersId || data.idUnik || data.nip || docId,
    idUnik: data.idUnik || data.teachersId || data.nip || docId,
    nip: data.nip || '',
    nik: data.nik || '',
    nuptk: data.nuptk || '',
    namaLengkap: data.namaLengkap || data.namaGuru || '',
    jenisKelamin: data.jenisKelamin || '',
    tempatLahir: data.tempatLahir || '',
    tanggalLahir: data.tanggalLahir || '',
    email: data.email || data.emailGoogleSSO || '',

    jabatanDanStatus: {
      jabatanUtama:
        data.jabatanDanStatus?.jabatanUtama || data.jabatan || data.jabatanUtama || 'Guru',
      statusPegawai: data.jabatanDanStatus?.statusPegawai || data.statusPegawai || '',
      pangkatGolongan: data.jabatanDanStatus?.pangkatGolongan || data.pangkatGolongan || '',
      pendidikanTerakhir:
        data.jabatanDanStatus?.pendidikanTerakhir || data.pendidikanTerakhir || '',
    },

    penugasanAkademik: {
      isWaliKelas:
        data.penugasanAkademik?.isWaliKelas !== undefined
          ? data.penugasanAkademik.isWaliKelas
          : data.isWaliKelas || false,
      waliKelasDi: data.penugasanAkademik?.waliKelasDi || data.waliKelasDi || null,
      mapelUtama: data.penugasanAkademik?.mapelUtama || data.mapelUtama || data.bidangStudi || '',
      totalJTM: String(data.penugasanAkademik?.totalJTM || data.totalJTM || '24'),
      isPembinaEkskul:
        data.penugasanAkademik?.isPembinaEkskul !== undefined
          ? data.penugasanAkademik.isPembinaEkskul
          : data.isPembinaEkskul || false,
    },

    kontak: {
      nomorHpWhatsApp: data.kontak?.nomorHpWhatsApp || data.noHp || data.nomorHpWhatsApp || '',
      alamatLengkap: data.kontak?.alamatLengkap || data.alamat || data.alamatLengkap || '',
    },

    sistemJangkar: {
      tenantId: data.sistemJangkar?.tenantId || data.tenantId || '30315537',
      userId: data.sistemJangkar?.userId || data.linkedUserId || data.userId || '',
      roleSistem: data.sistemJangkar?.roleSistem || 'GURU',
      isClaimed:
        data.sistemJangkar?.isClaimed !== undefined
          ? data.sistemJangkar?.isClaimed
          : data.isClaimed || false,
      ttdDigitalUrl: data.sistemJangkar?.ttdDigitalUrl || data.ttdDigitalUrl || '',
      diperbaruiPada: new Date().toISOString(),
      diperbaruiOleh: 'System Migration',
    },
  };
};

export const transformTenantToV2 = (data: any, docId: string) => {
  return {
    identitas: {
      namaMadrasah:
        data.identitas?.namaMadrasah || data.namaMadrasah || data.name || 'Madrasah Aliyah Negeri',
      npsn: data.identitas?.npsn || data.npsn || docId || '30315537',
      alamat: data.identitas?.alamat || data.alamat || 'Alamat belum diisi',
    },
    branding: {
      logoAppUrl: data.branding?.logoAppUrl || data.logoAppUrl || '',
      logoKemenagUrl: data.branding?.logoKemenagUrl || data.logoKemenagUrl || '',
      warnaUtama: data.branding?.warnaUtama || data.warnaUtama || '#4f46e5',
      warnaSekunder: data.branding?.warnaSekunder || data.warnaSekunder || '#06b6d4',
    },
    konfigurasiSistem: {
      tahunAjaranAktif:
        data.konfigurasiSistem?.tahunAjaranAktif || data.tahunAjaranAktif || '2025/2026',
      semesterAktif: data.konfigurasiSistem?.semesterAktif || data.semesterAktif || 'Ganjil',
      isMaintenance:
        data.konfigurasiSistem?.isMaintenance !== undefined
          ? data.konfigurasiSistem.isMaintenance
          : data.isMaintenance || false,
    },
    konfigurasiSesi: {
      toleransiKeterlambatan: Number(
        data.konfigurasiSesi?.toleransiKeterlambatan !== undefined
          ? data.konfigurasiSesi.toleransiKeterlambatan
          : data.toleransiKeterlambatan || 15,
      ),
      jadwal: {
        masuk: data.konfigurasiSesi?.jadwal?.masuk || data.jadwalMasuk || '07:00',
        pulang: data.konfigurasiSesi?.jadwal?.pulang || data.jadwalPulang || '14:00',
        jumat: data.konfigurasiSesi?.jadwal?.jumat || data.jadwalJumat || '11:00',
      },
    },
    status: data.status || (data.isActive === false ? 'Inactive' : 'Active'),
    updatedAt: new Date().toISOString(),
  };
};
