import { useState } from 'react';
import { readExcelToJSON, writeJSONToExcel } from '@/utils/excelHelper';
import { bulkImportTeachers } from '@/services/teacherService';
import { mapRawDataToTeacher } from '@/lib/teacherMapping';
import { EmploymentStatus, AsnStatus } from '@/types';
import { toast } from 'sonner';

export interface ParsedTeacherRow {
  rowNumber: number;
  namaLengkap: string;
  nip: string;
  nuptk: string;
  nik: string;
  jenisKelamin: string;
  status: string;
  jabatan: string;
  mapel: string;
  phone: string;
  email: string;
  isValid: boolean;
  errors: string[];
  raw: any;
  [key: string]: any;
}

export function useTeacherBulkUpload() {
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewRows, setPreviewRows] = useState<ParsedTeacherRow[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const parseFile = async (file: File) => {
    setIsParsing(true);
    setFileName(file.name);
    try {
      const data = await file.arrayBuffer();
      const rawJson = await readExcelToJSON<Record<string, any>>(data);

      if (rawJson.length === 0) {
        toast.error('File kosong atau format tidak valid.');
        setIsParsing(false);
        return;
      }

      if (rawJson.length > 500) {
        toast.error('Batasan terlampaui! Maksimal 500 baris per unggahan.');
        setIsParsing(false);
        return;
      }

      const parsed: ParsedTeacherRow[] = rawJson.map((row, index) => {
        const mapped = mapRawDataToTeacher(row) as any;
        const namaLengkap = String(mapped.namaLengkap || mapped.name || '').trim();
        const nip = String(mapped.nip || mapped.teachersId || '').trim();
        const nuptk = String(mapped.nuptk || '').trim();
        const nik = String(mapped.nik || '').trim();
        const jenisKelamin = String(mapped.jenisKelamin || 'L').trim().toUpperCase();
        const status = String(mapped.status || 'Honorer').trim();
        const jabatan = String(mapped.jabatanDanStatus?.jabatanUtama || mapped.tugas || 'Guru Mapel').trim();
        const mapel = String(mapped.penugasanAkademik?.mapelUtama || mapped.mapel || '').trim();
        const phone = String(mapped.phone || '').trim();
        const email = String(mapped.email || '').trim();

        const errors: string[] = [];
        if (!namaLengkap) {
          errors.push('Nama Lengkap wajib diisi');
        }

        return {
          rowNumber: index + 1,
          ...mapped,
          namaLengkap,
          nip: nip || `TEA-${index + 1}`,
          nuptk,
          nik,
          jenisKelamin,
          status,
          jabatan,
          mapel,
          phone,
          email,
          isValid: errors.length === 0,
          errors,
          raw: row,
        };
      });

      setPreviewRows(parsed);
      toast.success(`Berhasil mem-parse ${parsed.length} baris data GTK.`);
    } catch (err: any) {
      console.error('Parse file error:', err);
      toast.error('Gagal membaca file: ' + (err?.message || String(err)));
    } finally {
      setIsParsing(false);
    }
  };

  const executeBulkUpload = async (): Promise<boolean> => {
    const validRows = previewRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('Tidak ada baris data valid untuk diunggah.');
      return false;
    }

    setIsUploading(true);
    try {
      const teachersToUpload: any[] = validRows.map((r, i) => {
        const idVal = r.nip || r.teachersId || `TEA-${Date.now()}-${i}`;
        return {
          id: idVal,
          teachersId: idVal,
          idUnik: idVal,
          tenantId: '30315537', // Default or from store
          npsn: '30315537',
          namaLengkap: r.namaLengkap,
          nip: r.nip,
          nuptk: r.nuptk,
          nik: r.nik,
          jenisKelamin: r.jenisKelamin,
          employmentStatus: EmploymentStatus.HONORER,
          asnStatus: AsnStatus.NON_ASN,
          statusAktif: true,
          phone: r.phone,
          email: r.email,
          jabatan: r.jabatan || 'Guru Mapel',
          tempatLahir: r.tempatLahir || '',
          tanggalLahir: r.tanggalLahir || '',
          birthDate: r.tanggalLahir || '',
          address: r.address || '',
          jabatanDanStatus: r.jabatanDanStatus || {
            jabatanUtama: r.jabatan || 'Guru Mapel',
            statusPegawai: r.status || 'Honorer',
            pangkatGolongan: '-',
            pendidikanTerakhir: 'S1',
          },
          penugasanAkademik: r.penugasanAkademik || {
            isWaliKelas: false,
            waliKelasDi: null,
            mapelUtama: r.mapel || '',
            totalJTM: '24',
            isPembinaEkskul: false,
          },
          kontak: r.kontak || {
            nomorHpWhatsApp: r.phone,
            alamatLengkap: r.address || '',
          },
        };
      });

      const result = await bulkImportTeachers(teachersToUpload);
      if (result.success) {
        toast.success(`Berhasil mengunggah ${result.count} data GTK ke database lokal & sinkronisasi.`);
        return true;
      } else {
        toast.error('Gagal mengunggah data GTK.');
        return false;
      }
    } catch (err: any) {
      console.error('Execute bulk upload error:', err);
      toast.error('Gagal menyimpan data: ' + (err?.message || String(err)));
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setPreviewRows([]);
    setFileName('');
  };

  const downloadTemplate = async () => {
    const templateData = [
      {
        'NAMA LENGKAP': 'Drs. H. M. Fauzan, M.Pd.',
        'NIP': '197501012000031001',
        'NUPTK': '1234567890123456',
        'NIK': '3201234567890001',
        'JENIS KELAMIN': 'L',
        'TEMPAT LAHIR': 'Surakarta',
        'TANGGAL LAHIR': '1975-01-01',
        'STATUS KEPEGAWAIAN': 'PNS',
        'TUGAS / JABATAN': 'Guru Mapel',
        'MATA PELAJARAN': 'Matematika',
        'NO HP / WA': '081234567890',
        'EMAIL': 'ahmad.fauzi@madrasah.id',
        'ALAMAT': 'Jl. Slamet Riyadi No. 45, Surakarta',
        'WALI KELAS': '10 A',
        'TOTAL JTM': '24',
      },
    ];

    await writeJSONToExcel(templateData, 'TEMPLATE_IMPORT_GTK.xlsx', 'Template GTK');
    toast.success('Template Excel GTK berhasil diunduh!');
  };

  return {
    isParsing,
    isUploading,
    previewRows,
    fileName,
    parseFile,
    executeBulkUpload,
    resetUpload,
    downloadTemplate,
  };
}
