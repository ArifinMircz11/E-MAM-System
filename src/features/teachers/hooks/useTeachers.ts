import { useEffect, useMemo, useState } from 'react';
import { useTeacherStore } from '@/stores/teacherStore';
import type { Teacher } from '@/types';

export const useTeachers = (filters?: {
  nama?: string;
  nip?: string;
  mapel?: string;
  jabatan?: string;
  status?: string;
}) => {
  const { teachers, loading, error, fetchTeachers, addTeacher, updateTeacher, deleteTeacher } = useTeacherStore();

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const filteredTeachers = useMemo(() => {
    if (!filters) return teachers;

    return teachers.filter((t) => {
      const matchesNama = !filters.nama || (t.namaLengkap || t.name || '').toLowerCase().includes(filters.nama.toLowerCase());
      const matchesNip = !filters.nip || (t.nip || '').toLowerCase().includes(filters.nip.toLowerCase());
      const matchesMapel = !filters.mapel || (t.penugasanAkademik?.mapelUtama || t.mapel || t.subject || '').toLowerCase().includes(filters.mapel.toLowerCase());
      const matchesJabatan = !filters.jabatan || (t.jabatan || t.role || '').toLowerCase().includes(filters.jabatan.toLowerCase());
      const matchesStatus = !filters.status || filters.status === 'All' || (t.jabatanDanStatus?.statusPegawai || t.status) === filters.status;

      return matchesNama && matchesNip && matchesMapel && matchesJabatan && matchesStatus;
    }).sort((a, b) => (a.namaLengkap || a.name || '').localeCompare(b.namaLengkap || b.name || ''));
  }, [teachers, filters]);

  return {
    teachers: filteredTeachers,
    allTeachers: teachers,
    loading,
    error,
    refresh: fetchTeachers,
    add: addTeacher,
    update: updateTeacher,
    remove: deleteTeacher
  };
};
