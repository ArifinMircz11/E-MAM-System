import { Student } from '@/types';

export const validateStudent = (student: Partial<Student>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!student.namaLengkap || student.namaLengkap.trim() === '') {
    errors.push('Nama lengkap wajib diisi');
  }
  if (!student.idUnik && !student.nisn) {
    errors.push('idUnik atau NISN wajib diisi');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
};
