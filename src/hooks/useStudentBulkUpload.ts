import { useState } from 'react';
import { readExcelToJSON, writeJSONToExcel } from '@/utils/excelHelper';
import { studentService } from '@/services/studentService';
import { getSecurityContext } from '@/core/security/contextHelper';
import type { Student } from '@/types';
import { toast } from 'sonner';

export interface ParsedStudentRow {
  rowNumber: number;
  namaLengkap: string;
  nisn: string;
  nis: string;
  jenisKelamin: string;
  kelas: string;
  isValid: boolean;
  errors: string[];
  raw: any;
  [key: string]: any;
}

export function useStudentBulkUpload() {
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewRows, setPreviewRows] = useState<ParsedStudentRow[]>([]);
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
        toast.error('Batasan terlampaui! Maksimal 500 baris per unggahan untuk mencegah kinerja lambat.');
        setIsParsing(false);
        return;
      }

      const parsed: ParsedStudentRow[] = rawJson.map((row, index) => {
        const idUnik = String(
          row['IDUNIK'] ||
          row['ID UNIK'] ||
          row['ID_UNIK'] ||
          row['idUnik'] ||
          row['id'] ||
          row['ID'] ||
          row['nisn'] ||
          row['NISN'] || ''
        ).trim();

        const namaLengkap = String(
          row['NAMA LENGKAP'] ||
          row['NAMA LENGKAP SESUAI IJAZAH'] ||
          row['namaLengkap'] ||
          row['Nama Lengkap'] ||
          row['Nama'] ||
          row['nama'] ||
          row['nama_lengkap'] || ''
        ).trim();

        const nisn = String(
          row['nisn'] || row['NISN'] || row['Nisn'] || ''
        ).trim();

        const nis = String(
          row['nis'] || row['NIS'] || row['Nis'] || ''
        ).trim();

        const nik = String(
          row['NIK'] || row['nik'] || ''
        ).trim();

        const jenisKelamin = String(
          row['JENIS KELAMIN'] ||
          row['JENIS KELAMIN (L/P)'] ||
          row['jenisKelamin'] ||
          row['Jenis Kelamin'] ||
          row['JK'] ||
          row['jk'] ||
          row['jenis_kelamin'] || 'L'
        ).trim().toUpperCase();

        const kelas = String(
          row['ROMBEL'] ||
          row['ROMBONGAN BELAJAR'] ||
          row['className'] ||
          row['Kelas'] ||
          row['kelas'] ||
          row['Rombel'] ||
          row['rombel'] ||
          row['tingkatRombel'] || '10 A'
        ).trim();

        const tahunAngkatan = String(
          row['TAHUN ANGKATAN'] || row['tahunAngkatan'] || '2025'
        ).trim();

        const tanggalDiterima = String(
          row['TANGGAL DITERIMA'] || row['tanggalDiterima'] || '2025-07-15'
        ).trim();

        const noTelepon = String(
          row['WA/TELEPON'] ||
          row['NO. WHATSAPP / HP'] ||
          row['NO HP / WHATSAPP'] ||
          row['noTelepon'] ||
          row['no_hp'] || ''
        ).trim();

        const email = String(
          row['EMAIL'] ||
          row['EMAIL SISWA'] ||
          row['email'] || ''
        ).trim();

        const alamat = String(
          row['ALAMAT'] ||
          row['ALAMAT DOMISILI LENGKAP'] ||
          row['ALAMAT RUMAH'] ||
          row['alamat'] || ''
        ).trim();

        const tempatLahir = String(
          row['TEMPAT LAHIR'] || row['tempatLahir'] || ''
        ).trim();

        const tanggalLahir = String(
          row['TANGGAL LAHIR'] || row['tanggalLahir'] || ''
        ).trim();

        const namaAyah = String(
          row['AYAH'] ||
          row['NAMA AYAH KANDUNG'] ||
          row['namaAyah'] || ''
        ).trim();

        const namaIbu = String(
          row['IBU'] ||
          row['NAMA IBU KANDUNG'] ||
          row['namaIbu'] || ''
        ).trim();

        const namaWali = String(
          row['NAMA WALI'] ||
          row['WALI'] ||
          row['NAMA WALI (JIKA TIDAK BERSAMA ORANG TUA)'] ||
          row['namaWali'] || ''
        ).trim();

        const nomorHpWali = String(
          row['NOMOR HP WALI (WA)'] || row['nomorHpWali'] || ''
        ).trim();

        const kipPip = String(
          row['PIP'] ||
          row['KIP'] ||
          row['KIP_PIP'] ||
          row['kipPip'] || ''
        ).trim();

        const kebutuhanKhusus = String(
          row['KEBUTUHAN KHUSUS'] || row['kebutuhanKhusus'] || 'Tidak Ada'
        ).trim();

        const disabilitas = String(
          row['DISABILITAS'] || row['disabilitas'] || 'Tidak Ada'
        ).trim();

        const status = String(
          row['STATUS SISWA'] ||
          row['STATUS'] ||
          row['status'] || 'Aktif'
        ).trim();

        const errors: string[] = [];
        if (!namaLengkap) {
          errors.push('Nama Lengkap wajib diisi');
        }
        if (!nisn) {
          errors.push('NISN wajib diisi');
        }

        return {
          rowNumber: index + 1,
          idUnik: idUnik || nisn || `STU-${index + 1}`,
          namaLengkap,
          nisn,
          nis,
          nik,
          jenisKelamin: jenisKelamin.startsWith('P') ? 'P' : 'L',
          kelas,
          tahunAngkatan,
          tanggalDiterima,
          noTelepon,
          email,
          alamat,
          tempatLahir,
          tanggalLahir,
          namaAyah,
          namaIbu,
          namaWali,
          nomorHpWali,
          kipPip,
          kebutuhanKhusus,
          disabilitas,
          status,
          isValid: errors.length === 0,
          errors,
          raw: row,
        };
      });

      setPreviewRows(parsed);
      toast.success(`Berhasil mem-parse ${parsed.length} baris data siswa.`);
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
      const context = getSecurityContext();
      const studentsData: Partial<Student>[] = validRows.map((r, i) => {
        const idVal = r.idUnik || r.nisn || `STU-${Date.now()}-${i}`;
        return {
          id: idVal,
          idUnik: idVal,
          studentsId: idVal,
          namaLengkap: r.namaLengkap,
          nisn: r.nisn,
          nis: r.nis,
          nik: r.nik,
          jenisKelamin: r.jenisKelamin,
          className: r.kelas,
          tingkatRombel: r.kelas,
          rombel: r.kelas,
          noTelepon: r.noTelepon,
          email: r.email,
          alamat: r.alamat,
          tempatLahir: r.tempatLahir,
          tanggalLahir: r.tanggalLahir,
          status: (r.status as any) || 'Aktif',
          kipPip: r.kipPip,
          kebutuhanKhusus: r.kebutuhanKhusus,
          disabilitas: r.disabilitas,
          metadataAkademik: {
            tahunAngkatan: r.tahunAngkatan || '2025',
            tanggalDiterima: r.tanggalDiterima || '2025-07-15',
            kelasId: r.kelas ? r.kelas.replace(/\s+/g, '_') + '_2025' : '',
            targetRombel: 'All',
          },
          kontakDanWali: {
            nomorHpSiswa: r.noTelepon,
            namaWali: r.namaWali,
            hubunganWali: r.namaWali ? 'Wali' : 'Ayah/Ibu',
            nomorHpWaliWhatsApp: r.nomorHpWali,
            alamatRumah: r.alamat,
          },
          orangTua: {
            namaAyah: r.namaAyah,
            namaIbu: r.namaIbu,
            namaWali: r.namaWali,
          },
        };
      });

      const result = await studentService.bulkCreate(studentsData);
      toast.success(`Berhasil mengunggah ${result.successCount} data siswa ke database lokal (Dexie & Sync Queue).`);
      if (result.errors && result.errors.length > 0) {
        console.warn('Beberapa baris gagal disimpan:', result.errors);
      }
      return true;
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
        'IDUNIK': '25001',
        'NAMA LENGKAP': 'Muhammad Fadhil',
        'NISN': '0012345678',
        'NIK': '3201234567890001',
        'TEMPAT LAHIR': 'Jakarta',
        'TANGGAL LAHIR': '2008-01-01',
        'ROMBEL': '10 A',
        'EMAIL': 'ahmad@example.com',
        'STATUS SISWA': 'Aktif',
        'JENIS KELAMIN': 'L',
        'ALAMAT': 'Jl. Merdeka No. 10',
        'WA/TELEPON': '081234567890',
        'KEBUTUHAN KHUSUS': 'Tidak Ada',
        'DISABILITAS': 'Tidak Ada',
        'WALI': '',
        'AYAH': 'Budi Santoso',
        'IBU': 'Siti Aminah',
        'NAMA WALI': '',
        'KIP': '',
        'PIP': '',
        'ROMBONGAN BELAJAR': '10 A',
        'TAHUN ANGKATAN': '2025',
        'TANGGAL DITERIMA': '2025-07-15',
        'JABATAN / ROLE': 'Siswa',
      },
    ];

    await writeJSONToExcel(templateData, 'TEMPLATE_IMPORT_SISWA.xlsx', 'Template Siswa');
    toast.success('Template Excel berhasil diunduh!');
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
