/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStudents } from '../hooks/useStudents';
import { mapRawDataToStudent } from '@/lib/studentMapping';
import { useAutoFix } from '@/hooks/useAutoFix';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useVirtualTable } from '@/hooks/useVirtualTable';
import { PullToRefreshWrapper } from '@/components/ui/PullToRefreshWrapper';
import type { Student } from '@/types';
import { UserRole } from '@/types';
import { SyncStatus } from '@/types';
import { safeConfirm } from '@/utils/safeConfirm';
import { isMockMode } from '@/services/authService';
import { toast } from 'sonner';
import { writeJSONToExcel, readExcelToJSON } from '@/utils/excelHelper';
import Layout from '@/layouts/Layout';
import { DuplicateStudentsDashboard } from '@/features/students/components/DuplicateStudentsDashboard';
import { StudentBulkUploadModal } from '@/features/students/components/StudentBulkUploadModal';
import { PermissionChecker } from '@/services/PermissionChecker';
import { useUserStore } from '@/stores/userStore';
import { InvalidStudentsList } from './InvalidStudentsList';
import { BulkDeleteConfirmModal } from './BulkDeleteConfirmModal';
import { LayoutGrid, Table } from 'lucide-react';
import {
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
  Search,
  PlusIcon,
  Loader2,
  XCircleIcon,
  IdentificationIcon,
  ChevronDownIcon,
  UserIcon,
  FileSpreadsheet,
  ArrowPathIcon,
  WhatsAppIcon,
  KeyIcon,
} from '@/shared/Icons';
import { StatusChip, Avatar, StudentDetailModal } from './StudentDetailModal';
import { StudentFormModal } from './StudentFormModal';
import { StudentList } from './StudentList';
import { StudentFilters } from './StudentFilters';

// Helper to capitalize each word
function capitalizeWords(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

const initialFormState: Partial<Student> = {
  idUnik: '',
  studentsId: '',
  namaLengkap: '',
  nisn: '',
  nik: '',
  tingkatRombel: '',
  jenisKelamin: 'Laki-laki',
  noTelepon: '',
  alamat: '',
  tempatLahir: '',
  tanggalLahir: '',
  email: '',
  namaAyah: '',
  namaIbu: '',
  status: 'Aktif',
  role: 'siswa' as any,
  isClaimed: false,
};

function isStudentInvalid(s: Student) {
  if (!s.idUnik || !s.namaLengkap) return true;
  if (!s.sistemJangkar?.tenantId) return true;
  if (!s.tingkatRombel || s.tingkatRombel === '-' || s.tingkatRombel === 'Tanpa Rombel')
    return true;
  return false;
}

function StudentDataView({
  onBack,
  userRole,
}: {
  onBack: () => void;
  userRole: UserRole;
  onOpenSidebar?: () => void;
}) {
  const { safeCall } = useAutoFix();
  const {
    students: storeStudents,
    classes,
    selectedClass,
    isLoading,
    isSubmitting: savingStore,
    error,
    setSelectedClass,
    setMasterVersion,
    fetchClasses: fetchStoredClasses,
    fetchStudents: fetchAllStudents,
    fetchStudentsByClass,
    createStudent: addStudent, // Alias createStudent as addStudent to match the existing UI code
    updateStudent,
    deleteStudent,
    migrateStudentId,
    moveStudentToCollection,
    bulkImportStudents,
    bulkDeleteStudents,
    deleteAllStudents,
    triggerPasswordReset,
  } = useStudents();

  const classList = useMemo(() => classes.map((c) => c.name || '').sort(), [classes]);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDuplicateDashboard, setShowDuplicateDashboard] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLButtonElement>(null);

  // ID Card Print State
  const [selectedIdCard, setSelectedIdCard] = useState<Student | null>(null);
  const [detailModal, setDetailModal] = useState<Student | null>(null);

  // State Filter
  const [globalSearch, setGlobalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showOnlyInvalid, setShowOnlyInvalid] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [filterLevel, setFilterLevel] = useState(() => {
    const saved = localStorage.getItem('emam_filter_student_level');
    return saved && saved !== 'All' ? saved : '10';
  });
  const [filterKelas, setFilterKelas] = useState(() => {
    const saved = localStorage.getItem('emam_filter_student_kelas');
    return saved && saved !== 'All' ? saved : '10 A';
  });
  const [filterStatus, setFilterStatus] = useState('Aktif');
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    const saved = localStorage.getItem('emam_student_view_mode') as 'card' | 'table';
    if (saved) return saved;
    return typeof window !== 'undefined' && window.innerWidth >= 768 ? 'table' : 'card';
  });

  const [formData, setFormData] = useState<Partial<Student>>(initialFormState);

  useEffect(() => {
    localStorage.setItem('emam_student_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('emam_filter_student_level', filterLevel);
  }, [filterLevel]);

  useEffect(() => {
    localStorage.setItem('emam_filter_student_kelas', filterKelas);
  }, [filterKelas]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(globalSearch);
    }, 800);
    return () => clearTimeout(handler);
  }, [globalSearch]);

  // Sync with global class context if available
  useEffect(() => {
    if (selectedClass?.name) {
      setFilterKelas(selectedClass.name);
      const level = selectedClass.name.split(' ')[0];
      if (['10', '11', '12'].includes(level)) {
        setFilterLevel(level);
      }
    }
  }, [selectedClass]);

  // Run fetchClasses once
  useEffect(() => {
    fetchStoredClasses();
  }, []);

  // Constants
  const PAGE_SIZE = 36;

  const fetchStudents = async (isLoadMore = false) => {
    // If loadMore, set loading state
    if (isLoadMore) {
      setLoadingMore(true);
    }

    if (isMockMode) {
      // Mock mode can still use setStudents or just let store handle it if implemented
      // For now, let's keep it simple
      setLoadingMore(false);
      return;
    }

    await safeCall(async () => {
      const isSearching = debouncedSearch.trim() !== '';

      if (isSearching) {
        await fetchAllStudents(true);
      } else {
        const targetClass = filterKelas && filterKelas !== 'All' ? filterKelas : '10 A';
        if (targetClass === 'Tanpa Rombel') {
          await fetchAllStudents(true);
        } else {
          await fetchStudentsByClass(targetClass);
        }
      }
    }, 'fetchStudents');

    setLoadingMore(false);
  };

  useEffect(() => {
    fetchStudents();
  }, [filterStatus, filterKelas, filterLevel, debouncedSearch]);

  useEffect(() => {
    if (!hasMore || isLoading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchStudents(true);
        }
      },
      {
        rootMargin: '100px',
      },
    );

    const currentButton = loadMoreRef.current;
    if (currentButton) {
      observer.observe(currentButton);
    }

    return () => {
      if (currentButton) {
        observer.unobserve(currentButton);
      }
    };
  }, [hasMore, isLoading, loadingMore, storeStudents]);

  const filteredClassOptions = useMemo(() => {
    if (filterLevel === 'All') return classList;
    if (filterLevel === 'Tanpa Rombel') return [];
    return classList.filter((c) => String(c || '').startsWith(filterLevel));
  }, [classList, filterLevel]);

  const isStudentInvalid = (s: Student) => {
    if (!s.idUnik || !s.namaLengkap) return true;
    if (!s.sistemJangkar?.tenantId) return true;
    if (!s.tingkatRombel || s.tingkatRombel === '-' || s.tingkatRombel === 'Tanpa Rombel')
      return true;
    return false;
  };

  const processedStudents = useMemo(() => {
    let list = [...storeStudents];

    const isSearching = debouncedSearch.trim() !== '';
    if (isSearching) {
      const searchUpper = debouncedSearch.toUpperCase().trim();
      list = list.filter((s) => (s.namaLengkap || '').toUpperCase().includes(searchUpper));
    }

    return list.filter((s) => {
      if (showOnlyInvalid) {
        return isStudentInvalid(s);
      }
      if (filterStatus !== 'All' && s.status !== filterStatus) return false;
      if (filterLevel !== 'All') {
        if (filterLevel === 'Tanpa Rombel') {
          if (
            s.tingkatRombel &&
            s.tingkatRombel.trim() !== '' &&
            s.tingkatRombel !== '-' &&
            s.tingkatRombel !== 'Tanpa Rombel'
          )
            return false;
        } else if (!String(s.tingkatRombel || '').startsWith(filterLevel)) {
          return false;
        }
      }
      if (filterKelas === 'Tanpa Rombel') {
        if (
          s.tingkatRombel &&
          s.tingkatRombel.trim() !== '' &&
          s.tingkatRombel !== '-' &&
          s.tingkatRombel !== 'Tanpa Rombel'
        )
          return false;
      } else if (filterKelas && filterKelas !== 'All' && s.tingkatRombel !== filterKelas) {
        return false;
      }
      return true;
    });
  }, [storeStudents, filterStatus, filterLevel, filterKelas, showOnlyInvalid, debouncedSearch]);

  const { containerRef, startIndex, endIndex, startOffset, endOffset } = useVirtualTable({
    itemsCount: processedStudents.length,
    estimateRowHeight: 48,
    overscan: 15,
  });

  const handleDownloadTemplate = async () => {
    const templateData = [
      {
        'IDUNIK': '25001',
        'NAMA LENGKAP': 'CONTOH NAMA SISWA',
        'NISN': '0012345678',
        'NIK': '3201234567890001',
        'TEMPAT LAHIR': 'Jakarta',
        'TANGGAL LAHIR': '2008-01-01',
        'ROMBEL': '10 A',
        'EMAIL': 'siswa@contoh.com',
        'STATUS SISWA': 'Aktif',
        'JENIS KELAMIN': 'L',
        'ALAMAT': 'Jl. Contoh No. 123',
        'WA/TELEPON': '081234567890',
        'KEBUTUHAN KHUSUS': 'Tidak Ada',
        'DISABILITAS': 'Tidak Ada',
        'WALI': '',
        'AYAH': 'Nama Ayah',
        'IBU': 'Nama Ibu',
        'NAMA WALI': '',
        'KIP': '',
        'PIP': '',
        'ROMBONGAN BELAJAR': '10 A',
        'TAHUN ANGKATAN': '2025',
        'TANGGAL DITERIMA': '2025-07-15',
        'JABATAN / ROLE': 'Siswa',
      },
    ];

    await writeJSONToExcel(templateData, 'TEMPLATE_IMPORT_SISWA.xlsx', 'Template');
  };

  const handleExportExcel = async () => {
    if (storeStudents.length === 0) {
      toast.error('Tidak ada data siswa untuk diexport.');
      return;
    }

    const exportData = storeStudents.map((s, index) => ({
      'No': index + 1,
      'ID UNIK': s.idUnik || s.id || '',
      'NAMA LENGKAP': s.namaLengkap || '',
      'NISN': s.nisn || '',
      'NIK': s.nik || '',
      'ROMBONGAN BELAJAR': s.tingkatRombel || s.kelasId || '',
      'TAHUN ANGKATAN': s.metadataAkademik?.tahunAngkatan || '',
      'JENIS KELAMIN': s.jenisKelamin || '',
      'NO HP / WHATSAPP': s.noTelepon || s.kontakDanWali?.nomorHpSiswa || '',
      'EMAIL': s.email || '',
      'ALAMAT': s.alamat || s.kontakDanWali?.alamatRumah || '',
      'STATUS': s.status || 'Aktif',
    }));

    await writeJSONToExcel(
      exportData,
      `DATA_SISWA_EXPORT_${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Data Siswa'
    );
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Membaca file excel...');
    try {
      const dataBuffer = await file.arrayBuffer();
      const data = await readExcelToJSON<any>(dataBuffer);

      if (data.length === 0) throw new Error('File kosong.');

      toast.loading(`Memproses ${data.length} data siswa...`, { id: toastId });

      const formattedStudents: Student[] = data
        .map((item) => mapRawDataToStudent(item) as Student)
        .filter((s) => s.idUnik && s.namaLengkap);

      if (formattedStudents.length === 0)
        throw new Error(
          "Format kolom tidak sesuai. Pastikan ada kolom 'ID UNIK' dan 'NAMA LENGKAP'.",
        );

      await bulkImportStudents(formattedStudents);
      toast.success(`Berhasil mengimpor ${formattedStudents.length} data ke database.`, {
        id: toastId,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses file.', { id: toastId });
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ ...initialFormState });
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id || student.idUnik || null);
    setFormData({ ...initialFormState, ...student });
    setIsModalOpen(true);
  };

  const handleMoveTo = async (target: 'alumni' | 'mutasi') => {
    if (!editingId) return;
    const confirmMsg =
      target === 'alumni'
        ? `Luluskan ${formData.namaLengkap} ke database alumni?`
        : `Pindahkan ${formData.namaLengkap} ke database mutasi?`;

    if (safeConfirm(confirmMsg)) {
      setSaving(true);
      await safeCall(async () => {
        await moveStudentToCollection(editingId, target, 'Pemindahan manual oleh admin');
        toast.success('Data berhasil dipindahkan.');
        setIsModalOpen(false);
      }, 'handleMoveTo');
      setSaving(false);
    }
  };

  const handleDelete = async (student: Student) => {
    const idToDelete = student.id || student.idUnik;
    if (!idToDelete) return;
    if (
      safeConfirm(
        `Hapus permanen data ${student.namaLengkap}?\nTindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      await safeCall(async () => {
        await deleteStudent(idToDelete);
        toast.success('Data berhasil dihapus.');
      }, 'handleDelete');
    }
  };

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    const allIds = processedStudents.map(s => s.id || s.idUnik).filter((id): id is string => !!id);
    if (selectedStudentIds.length === allIds.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(allIds);
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Tidak ada siswa terpilih.');
      return;
    }
    setIsDeleteAll(false);
    setBulkDeleteModalOpen(true);
  };

  const handleDeleteAllStudents = () => {
    setIsDeleteAll(true);
    setBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (isDeleteAll) {
      await safeCall(async () => {
        await deleteAllStudents();
        toast.success('Semua data siswa berhasil dihapus.');
        setSelectedStudentIds([]);
      }, 'handleDeleteAllStudents');
    } else {
      await safeCall(async () => {
        await bulkDeleteStudents(selectedStudentIds);
        toast.success(`Berhasil menghapus ${selectedStudentIds.length} data siswa.`);
        setSelectedStudentIds([]);
      }, 'handleDeleteSelected');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const emptyFields: string[] = [];
    if (!formData.namaLengkap) emptyFields.push('Nama Lengkap');
    if (!formData.idUnik) emptyFields.push('ID UNIK');

    if (emptyFields.length > 0) {
      toast.error(`${emptyFields.join(' dan ')} wajib diisi.`);
      return;
    }

    setSaving(true);
    await safeCall(async () => {
      if (editingId) {
        if (editingId !== formData.idUnik) {
          const confirmMigration = safeConfirm(
            `Apakah Anda yakin ingin mengubah ID unik siswa ini dari "${editingId}" menjadi "${formData.idUnik}"?\nTindakan ini akan memicu migrasi data siswa.`,
          );
          if (!confirmMigration) {
            throw new Error('Migrasi dibatalkan oleh pengguna.');
          }
          await migrateStudentId(editingId, formData.idUnik!, formData);
        } else {
          await updateStudent(editingId, formData);
        }
      } else {
        await addStudent(formData as Student);
      }
      toast.success('Database berhasil diperbarui.');
      setIsModalOpen(false);
      fetchStudents(); // Refresh the list
    }, 'handleSave');
    setSaving(false);
  };

  const handleRepairData = async () => {
    const invalidOnes = storeStudents.filter(isStudentInvalid);
    if (invalidOnes.length === 0) {
      toast.success('Tidak ada data yang perlu diperbaiki.');
      return;
    }

    if (
      !safeConfirm(
        `Lengkapi ${invalidOnes.length} data siswa dengan metadata default (Tenant ID, dsb)?`,
      )
    )
      return;

    setIsRepairing(true);
    const toastId = toast.loading(`Memperbaiki ${invalidOnes.length} data...`);

    await safeCall(async () => {
      const currentTenantId = useUserStore.getState().tenantId || 'global';
      const repairedData = invalidOnes.map((s) => {
        const tr = s.tingkatRombel && s.tingkatRombel !== '-' ? s.tingkatRombel : '10 A';
        return {
          ...s,
          tingkatRombel: tr,
          sistemJangkar: {
            ...s.sistemJangkar,
            tenantId: s.sistemJangkar?.tenantId || currentTenantId,
            userId: s.idUnik,
            diperbaruiPada: new Date().toISOString(),
            diperbaruiOleh: 'SYSTEM_REPAIR',
          },
        } as Student;
      });

      await bulkImportStudents(repairedData);
      toast.success(`Berhasil memperbaiki ${repairedData.length} data siswa.`, { id: toastId });
      fetchStudents(false);
    }, 'handleRepairData');
    setIsRepairing(false);
  };

  const canManage =
    userRole === UserRole.ADMIN ||
    userRole === UserRole.SUPER_ADMIN ||
    userRole === UserRole.ADMIN_OPERASIONAL ||
    userRole === UserRole.KEPALA_TU ||
    userRole === UserRole.STAF ||
    userRole === UserRole.DEVELOPER ||
    PermissionChecker.can('student.create');
  const { handleRefresh } = usePullToRefresh(() => fetchStudents(false));

  return (
    <Layout
      title="Data Induk Siswa"
      subtitle="Database Terintegrasi"
      icon={AcademicCapIcon}
      onBack={onBack}
      actions={
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 lg:w-64 transition-all"
            />
          </div>
          {canManage && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 sm:px-4 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                title="Import Excel"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-wide hidden lg:inline">
                  UPLOAD EXCEL
                </span>
              </button>
              {PermissionChecker.can('student.create') && (
                <button
                  onClick={() => setIsBulkUploadModalOpen(true)}
                  className="p-2 sm:px-4 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                  title="Bulk Upload Siswa (Offline-First)"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-[10px] font-bold tracking-wide hidden lg:inline">
                    BULK UPLOAD
                  </span>
                </button>
              )}
              <button
                onClick={handleDownloadTemplate}
                className="p-2 sm:px-4 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                title="Download Template"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-wide hidden lg:inline">
                  TEMPLATE EXCEL
                </span>
              </button>
              <button
                onClick={handleExportExcel}
                className="p-2 sm:px-4 bg-sky-100 dark:bg-sky-900/40 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                title="Export Excel"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-wide hidden lg:inline">
                  EXPORT EXCEL
                </span>
              </button>
              <button
                onClick={handleRepairData}
                disabled={isRepairing}
                className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                title="Lengkapi Kolom Kosong"
              >
                {isRepairing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowPathIcon className="w-5 h-5" />
                )}
                <span className="text-[10px] font-bold tracking-wide hidden lg:inline">
                  Lengkapi data
                </span>
              </button>
              <button
                onClick={() => setShowDuplicateDashboard(true)}
                className="p-2 sm:px-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                title="Kelola & Hapus Data Ganda"
              >
                <AcademicCapIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-wide hidden lg:inline">
                  HAPUS GANDA
                </span>
              </button>
              {selectedStudentIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="p-2 sm:px-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all shadow-sm flex items-center gap-1.5 animate-pulse"
                  title="Hapus Terpilih"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span className="text-[10px] font-bold tracking-wide">
                    HAPUS TERPILIH ({selectedStudentIds.length})
                  </span>
                </button>
              )}
              <button
                onClick={handleDeleteAllStudents}
                className="p-2 sm:px-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-sm flex items-center gap-1.5"
                title="Hapus Semua Data Siswa"
              >
                <TrashIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-wide hidden lg:inline">
                  HAPUS SEMUA
                </span>
              </button>
              <button
                onClick={handleAddNew}
                className="p-2 sm:px-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                title="Daftar Siswa Baru"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-wide hidden sm:inline">
                  Daftar siswa baru
                </span>
              </button>
            </>
          )}
          <button
            onClick={() => fetchStudents(false)}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:text-indigo-600 transition-all"
            title="Refresh"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      }
    >
      <PullToRefreshWrapper onRefresh={handleRefresh}>
        <div className="p-3 lg:p-4 pb-40 space-y-3">
          {/* --- DATA TABLE --- */}
          <div className="bg-white dark:bg-[#151E32] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <StudentFilters 
              showOnlyInvalid={showOnlyInvalid}
              setShowOnlyInvalid={setShowOnlyInvalid}
              filterLevel={filterLevel}
              setFilterLevel={setFilterLevel}
              filterKelas={filterKelas}
              setFilterKelas={setFilterKelas}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              viewMode={viewMode}
              setViewMode={setViewMode}
              classList={classList}
              filteredClassOptions={filteredClassOptions}
            />

            <div ref={containerRef} className="overflow-auto max-h-[600px] custom-scrollbar">
              {showOnlyInvalid ? (
                <div className="p-6 max-w-4xl mx-auto">
                  <InvalidStudentsList
                    onEditStudent={(s) => {
                      setDetailModal(s);
                    }}
                  />
                </div>
              ) : (
                <StudentList 
                  students={processedStudents}
                  isLoading={isLoading}
                  viewMode={viewMode}
                  canManage={canManage}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  onDetail={setDetailModal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSelect={toggleSelectStudent}
                  onSelectAll={toggleSelectAll}
                  selectedIds={selectedStudentIds}
                  onPrintCard={setSelectedIdCard}
                />
              )}
            </div>
            {hasMore && !isLoading && processedStudents.length > 0 && (
              <div className="p-4 flex justify-center border-t border-slate-200 dark:border-slate-800">
                <button
                  ref={loadMoreRef}
                  onClick={() => fetchStudents(true)}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Muat Lebih Banyak
                </button>
              </div>
            )}
          </div>
        </div>
      </PullToRefreshWrapper>

      {/* Floating Sync Indicator */}
      {isLoading && storeStudents.length > 0 && (
        <div className="fixed bottom-10 right-10 z-50 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg animate-bounce text-[10px] font-bold uppercase pointer-events-none">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Mensinkronisasi Data...</span>
        </div>
      )}

      {/* MODALS */}
      <StudentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        classList={classList}
        canManage={canManage}
        handleSave={handleSave}
        saving={saving}
        handleMoveTo={handleMoveTo}
      />

      {selectedIdCard && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedIdCard(null)}
        >
          <div
            className="bg-white p-8 rounded-3xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-center font-bold mb-4">ID CARD PREVIEW</h3>
            <div className="aspect-[1.586/1] bg-indigo-700 rounded-xl relative overflow-hidden mb-4 p-4 text-white">
              <p className="text-[8px] font-bold opacity-50 uppercase tracking-wide">
                Digital Student ID
              </p>
              <div className="mt-4">
                <h4 className="text-sm font-bold uppercase">{selectedIdCard.namaLengkap}</h4>
                <p className="text-[10px] font-bold opacity-80">{selectedIdCard.idUnik}</p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wide active:scale-95"
            >
              Download / Print
            </button>
          </div>
        </div>
      )}

      <StudentDetailModal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        student={detailModal}
        onEdit={handleEdit}
      />

      {showDuplicateDashboard && (
        <DuplicateStudentsDashboard
          onClose={() => {
            setShowDuplicateDashboard(false);
            fetchStudents(false);
          }}
        />
      )}

      <StudentBulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={() => fetchStudents(false)}
      />

      <BulkDeleteConfirmModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        selectedCount={selectedStudentIds.length}
        isAll={isDeleteAll}
      />
    </Layout>
  );
};

export default StudentDataView;
export { StudentDataView as StudentDataMain };
