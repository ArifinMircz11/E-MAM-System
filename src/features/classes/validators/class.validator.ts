import type { ClassFormData } from '../schemas/class.schema';

export function validateClass(data: Partial<ClassFormData>): string[] {
  const errors: string[] = [];
  if (!data.namaKelas || data.namaKelas.trim() === '') {
    errors.push('Nama kelas wajib diisi');
  }
  if (!data.kodeKelas || data.kodeKelas.trim() === '') {
    errors.push('Kode kelas wajib diisi');
  }
  if (!data.tingkat || data.tingkat.trim() === '') {
    errors.push('Tingkat wajib diisi');
  }
  if (!data.tahunAjaran || data.tahunAjaran.trim() === '') {
    errors.push('Tahun ajaran wajib diisi');
  }
  if (!data.semester || data.semester.trim() === '') {
    errors.push('Semester wajib diisi');
  }
  return errors;
}
