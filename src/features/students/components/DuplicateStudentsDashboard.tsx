import React, { useState, useEffect, useRef } from 'react';
import type { Student } from '@/types';
import { deleteStudent, updateStudent } from '@/services/studentService';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { getSecurityContext } from '@/core/security/contextHelper';
import { toast } from 'sonner';
import {
  AcademicCapIcon,
  TrashIcon,
  XCircleIcon,
  Loader2,
  ExclamationTriangleIcon,
  PencilIcon,
} from '@/shared/Icons';
import { StudentFormModal } from '@/features/students/components/StudentFormModal';
import { useAuthStore } from '@/stores/authStore';
import { useStudentStore } from '@/stores/studentStore';
import { AuditLogger } from '@/services/AuditLogger';
import { motion, AnimatePresence } from 'framer-motion';

// Helper
const capitalizeWords = (str: string) =>
  str
    ? str
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : '';

const isFirebaseUid = (id: string) => {
  return typeof id === 'string' && id.length === 28 && /^[a-zA-Z0-9_-]+$/.test(id);
};

interface DuplicateGroup {
  key: string;
  students: Student[];
}

export const DuplicateStudentsDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [criteria, setCriteria] = useState<'namaLengkap' | 'nisn' | 'nik'>('namaLengkap');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { user } = useAuthStore();
  const { classes, fetchStudents } = useStudentStore();
  const canManage = true;

  // Execution pipeline state
  const [pipeline, setPipeline] = useState<{
    active: boolean;
    paused: boolean;
    total: number;
    current: number;
    completed: number;
    failed: number;
    currentItemName: string;
    logs: string[];
    isOfflinePaused: boolean;
    itemsToClean: { id: string; name: string }[];
    done: boolean;
  }>({
    active: false,
    paused: false,
    total: 0,
    current: 0,
    completed: 0,
    failed: 0,
    currentItemName: '',
    logs: [],
    isOfflinePaused: false,
    itemsToClean: [],
    done: false,
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pipeline.logs]);

  // Network resilience monitoring
  useEffect(() => {
    const handleOnline = () => {
      setPipeline((prev) => {
        if (prev.active && prev.isOfflinePaused) {
          return {
            ...prev,
            isOfflinePaused: false,
            logs: [
              ...prev.logs,
              `[KONEKSI] Internet terdeteksi online kembali. Memulihkan antrean otomatis...`,
            ],
          };
        }
        return prev;
      });
    };

    const handleOffline = () => {
      setPipeline((prev) => {
        if (prev.active && !prev.isOfflinePaused) {
          return {
            ...prev,
            isOfflinePaused: true,
            logs: [
              ...prev.logs,
              `[PIPELINE - SIAGA] Jaringan offline terdeteksi! Menangguhkan pemrosesan secara aman saat ini...`,
            ],
          };
        }
        return prev;
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Main execution loop effect
  useEffect(() => {
    if (!pipeline.active || pipeline.paused || pipeline.isOfflinePaused || pipeline.done) {
      return;
    }

    if (pipeline.current >= pipeline.total) {
      const finalizePipeline = async () => {
        setPipeline((prev) => ({
          ...prev,
          currentItemName: 'Sinkronisasi Integritas & Cache...',
          logs: [
            ...prev.logs,
            `[SISTEM] Seluruh batch didegradasi sukses. Menyelesaikan transaksi...`,
            `[SISTEM] Sinkronisasi cache lokal dengan server akademis...`,
          ],
        }));

        try {
          // Sync main state store
          await fetchStudents(true);

          // Write logs to AuditLog
          await AuditLogger.log(
            user?.uid || 'developer',
            `BATCH_DEDUPLICATION_SUCCESS`,
            'Data Siswa',
            'success',
            {
              cleanedCount: pipeline.completed,
              failedCount: pipeline.failed,
              criteria: criteria,
              timestamp: new Date().toISOString(),
            },
          );

          setPipeline((prev) => ({
            ...prev,
            done: true,
            currentItemName: 'Selesai!',
            logs: [
              ...prev.logs,
              `[SUKSES] Semua record berhasil disinkronkan ke dalam cache memori lokal.`,
              `[INFO] Total sukses: ${prev.completed}, gagal: ${prev.failed}.`,
              `[PIPELINE RESILIENSI] Transaksi aman. Anda dapat menutup layar aman.`,
            ],
          }));

          toast.success(`Deduplikasi Selesai! ${pipeline.completed} data berhasil dibersihkan.`);
          findDuplicates();
        } catch (err: any) {
          setPipeline((prev) => ({
            ...prev,
            logs: [...prev.logs, `[ERROR] Gagal sinkronisasi cache: ${err.message}`],
          }));
        }
      };

      finalizePipeline();
      return;
    }

    let isActive = true;
    const target = pipeline.itemsToClean[pipeline.current];
    if (!target) return;

    const processCurrentRecord = async () => {
      // Elegant progress delay
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (!isActive) return;

      // Strict checklist connectivity check
      if (!navigator.onLine) {
        setPipeline((prev) => ({
          ...prev,
          isOfflinePaused: true,
          logs: [
            ...prev.logs,
            `[PERINGATAN] Sambungan jaringan rontok mendadak. Menangguhkan ID: ${target.id}`,
          ],
        }));
        return;
      }

      setPipeline((prev) => ({
        ...prev,
        currentItemName: target.name,
        logs: [
          ...prev.logs,
          `⚙️ Memproses [No. ${prev.current + 1}/${prev.total}]: Menghapus dokumen ${target.name} (${target.id})`,
        ],
      }));

      try {
        await deleteStudent(target.id);
        if (!isActive) return;

        setPipeline((prev) => ({
          ...prev,
          completed: prev.completed + 1,
          current: prev.current + 1,
          logs: [...prev.logs, `✓ Sukses menyingkirkan ID: ${target.id}`],
        }));
      } catch (err: any) {
        if (!isActive) return;

        setPipeline((prev) => ({
          ...prev,
          failed: prev.failed + 1,
          current: prev.current + 1,
          logs: [
            ...prev.logs,
            `☠ Gagal menghapus ${target.id}: ${err.message || 'Error tidak dikenal'}`,
          ],
        }));
      }
    };

    processCurrentRecord();

    return () => {
      isActive = false;
    };
  }, [
    pipeline.active,
    pipeline.paused,
    pipeline.isOfflinePaused,
    pipeline.current,
    pipeline.total,
    pipeline.done,
  ]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectGroup = (group: DuplicateGroup) => {
    const groupIds = group.students.map((s) => s.id || s.idUnik).filter((id) => !!id) as string[];
    const allInGroupSelected = groupIds.every((id) => selectedIds.includes(id));

    if (allInGroupSelected) {
      setSelectedIds((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const filtered = prev.filter((id) => !groupIds.includes(id));
        return [...filtered, ...groupIds];
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Tidak ada siswa terpilih yang dipilih!');
      return;
    }

    const namesToDelete: { id: string; name: string }[] = [];
    duplicates.forEach((group) => {
      group.students.forEach((student) => {
        const sId = student.id || student.idUnik;
        if (sId && selectedIds.includes(sId)) {
          namesToDelete.push({
            id: sId,
            name: `${student.namaLengkap} (ID: ${student.idUnik || sId})`,
          });
        }
      });
    });

    if (
      window.confirm(
        `Yakin ingin memproses pembersihan terstruktur untuk ${selectedIds.length} data siswa terpilih?`,
      )
    ) {
      setSelectedIds([]);
      setPipeline({
        active: true,
        paused: false,
        total: namesToDelete.length,
        current: 0,
        completed: 0,
        failed: 0,
        currentItemName: 'Menginisialisasi pipeline...',
        logs: [
          `[PIPELINE] Memulai pembersihan selektif untuk ${namesToDelete.length} data siswa...`,
        ],
        isOfflinePaused: !navigator.onLine,
        itemsToClean: namesToDelete,
        done: false,
      });
    }
  };

  const handleDeleteAllUidDuplicates = async () => {
    const uidStudentsToClean: { id: string; name: string }[] = [];
    duplicates.forEach((group) => {
      group.students.forEach((student) => {
        const idToCheck = student.id || student.idUnik;
        if (idToCheck && isFirebaseUid(idToCheck)) {
          if (!uidStudentsToClean.some((s) => s.id === idToCheck)) {
            uidStudentsToClean.push({
              id: idToCheck,
              name: `${student.namaLengkap} (Firebase UID ID)`,
            });
          }
        }
      });
    });

    if (uidStudentsToClean.length === 0) {
      toast.error('Tidak ditemukan dokumen ganda dengan ID dokumen berformat UID saat ini.');
      return;
    }

    if (
      window.confirm(
        `Menemukan ${uidStudentsToClean.length} dokumen siswa dengan format ID UID. Mulai proses pembersihan terstruktur otomatis?`,
      )
    ) {
      setPipeline({
        active: true,
        paused: false,
        total: uidStudentsToClean.length,
        current: 0,
        completed: 0,
        failed: 0,
        currentItemName: 'Menginisialisasi pipeline...',
        logs: [
          `[PIPELINE] Memulai pembersihan otomatis ganda untuk ${uidStudentsToClean.length} siswa...`,
        ],
        isOfflinePaused: !navigator.onLine,
        itemsToClean: uidStudentsToClean,
        done: false,
      });
    }
  };

  const findDuplicates = async () => {
    setLoading(true);
    try {
      const context = getSecurityContext();
      const allStudents = await studentRepository.getByTenant(context.tenantId);

      const groups = new Map<string, Student[]>();

      allStudents.forEach((student) => {
        let key = '';
        if (criteria === 'namaLengkap') {
          key = student.namaLengkap?.trim().toUpperCase() || '';
        } else if (criteria === ('idUnik' as any)) {
          key = student.idUnik?.trim() || '';
        } else if (criteria === 'nik') {
          key = student.nik?.trim() || '';
        }

        if (!key) return; // ignore empty

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(student);
      });

      const duplicateGroups: DuplicateGroup[] = [];
      groups.forEach((students, key) => {
        if (students.length > 1) {
          duplicateGroups.push({ key, students });
        }
      });

      setDuplicates(duplicateGroups);
      localStorage.setItem(`duplicate_students_cache_${criteria}`, JSON.stringify(duplicateGroups));
    } catch (e: any) {
      toast.error('Gagal mendeteksi data ganda: ' + (e.message || 'Error tidak dikenal'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIds([]);
    const cached = localStorage.getItem(`duplicate_students_cache_${criteria}`);
    if (cached) {
      setDuplicates(JSON.parse(cached));
    }
    findDuplicates();
  }, [criteria]);

  const handleDelete = async (student: Student) => {
    const idToDelete = student.id || student.idUnik;
    if (!idToDelete) return;

    if (
      window.confirm(
        `Hapus permanen data duplikat ${student.namaLengkap} (ID Unik: ${student.idUnik})?\nTindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      const toastId = toast.loading('Menghapus data...');
      try {
        await deleteStudent(idToDelete);
        toast.success('Data duplikat berhasil dihapus.', { id: toastId });
        setDuplicates((prev) => {
          const newDup = prev
            .map((group) => {
              return {
                ...group,
                students: group.students.filter((s) => (s.id || s.idUnik) !== idToDelete),
              };
            })
            .filter((group) => group.students.length > 1);

          localStorage.setItem(`duplicate_students_cache_${criteria}`, JSON.stringify(newDup));
          return newDup;
        });
      } catch (e: any) {
        toast.error('Gagal menghapus data: ' + (e.message || 'Error tidak dikenal'), { id: toastId });
      }
    }
  };

  const handleCleanGroup = async (group: DuplicateGroup) => {
    const studentsToDelete = group.students.slice(1);
    if (studentsToDelete.length === 0) {
      toast('Tidak ada data duplikat untuk dibersihkan di grup ini.');
      return;
    }

    const itemsToClean = studentsToDelete
      .map((student) => ({
        id: student.id || student.idUnik || '',
        name: `${student.namaLengkap} (ID: ${student.idUnik})`,
      }))
      .filter((item) => !!item.id);

    if (
      window.confirm(
        `Yakin untuk memproses degradasi terstruktur untuk ${itemsToClean.length} duplikat dari grup ${group.key}?`,
      )
    ) {
      setPipeline({
        active: true,
        paused: false,
        total: itemsToClean.length,
        current: 0,
        completed: 0,
        failed: 0,
        currentItemName: 'Menginisialisasi pipeline kelompok...',
        logs: [
          `[PIPELINE] Degradasi kelompok dimulai untuk grup ${group.key}. Menyaring ${itemsToClean.length} record...`,
        ],
        isOfflinePaused: !navigator.onLine,
        itemsToClean,
        done: false,
      });
    }
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData(student);
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idUnik) {
      toast.error('ID Unik hilang!');
      return;
    }
    setSaving(true);
    try {
      await updateStudent(formData.idUnik, formData);
      toast.success('Data berhasil diperbarui');
      setIsEditModalOpen(false);
      findDuplicates();
    } catch (err: any) {
      toast.error('Gagal memperbarui data: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveTo = async (target: 'alumni' | 'mutasi') => {
    toast.info(`Fungsi pindah ke ${target} belum diimplementasikan di sini.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 lg:left-[280px] z-[40] flex flex-col bg-slate-50 dark:bg-[#0B1121] transition-all"
    >
      {/* Elegant Frosted Header */}
      <div className="flex-none p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#151E32]/80 backdrop-blur-md flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/15 shadow-inner">
            <ExclamationTriangleIcon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white capitalize tracking-tight leading-none">
              Deduplikasi Data Siswa
            </h2>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-1.5">
              Kontrol Integritas & Pembersihan Data Ganda
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 bg-slate-100 hover:bg-rose-100 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl transition-all shadow-sm border border-slate-200/40 dark:border-slate-700/40"
        >
          <XCircleIcon className="w-5.5 h-5.5" />
        </button>
      </div>

      {/* Smart Criteria Grid-Tabs & Batch Action Controls */}
      <div className="flex-none p-5 md:p-6 bg-white dark:bg-[#151E32] border-b border-slate-200 dark:border-slate-800/80 flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center">
        <div className="flex flex-col gap-2 w-full lg:w-auto">
          <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            Kriteria Pemindaian
          </span>
          <div className="inline-flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/30 dark:border-slate-700/30 w-full lg:w-auto">
            <button
              onClick={() => setCriteria('namaLengkap')}
              className={`flex-1 lg:flex-initial px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${criteria === 'namaLengkap' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Nama Lengkap
            </button>
            <button
              onClick={() => setCriteria('idUnik' as any)}
              className={`flex-1 lg:flex-initial px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${criteria === ('idUnik' as any) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              ID Unik
            </button>
            <button
              onClick={() => setCriteria('nik')}
              className={`flex-1 lg:flex-initial px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${criteria === 'nik' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              NIK
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto lg:flex-1 justify-end">
          {/* Action 1: UID Auto Cleanup */}
          <div className="w-full md:max-w-xs bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                Auto Clean UID
              </span>
              <span className="text-[9px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                Resiko
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#151E32] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Total UID:
                </span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {duplicates.reduce((acc, group) => {
                    return (
                      acc +
                      group.students.filter((s) => {
                        const idToCheck = s.id || s.idUnik;
                        return idToCheck && isFirebaseUid(idToCheck);
                      }).length
                    );
                  }, 0)}{' '}
                  Dokumen
                </span>
              </div>
              <button
                onClick={handleDeleteAllUidDuplicates}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[9px] uppercase tracking-wider hover:shadow-lg hover:shadow-rose-500/10 transition-all flex items-center gap-1 shrink-0 active:scale-95"
              >
                <TrashIcon className="w-3 h-3" /> Hapus Semua
              </button>
            </div>
          </div>

          {/* Action 2: Selected Batch Cleaner */}
          <div className="w-full md:max-w-xs bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                Hapus Terpilih
              </span>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                Selektif
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#151E32] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Terpilih:
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedIds.length} Dokumen
                </span>
              </div>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 dark:disabled:bg-slate-800/80 disabled:text-slate-400 text-white rounded-xl font-bold text-[9px] uppercase tracking-wider hover:shadow-lg hover:shadow-indigo-500/10 transition-all flex items-center gap-1 shrink-0 active:scale-95"
              >
                <TrashIcon className="w-3 h-3" /> Hapus Pilihan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Dashboard Content Stage */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center opacity-90 h-full">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 animate-pulse">
              Memindai Duplikasi Database...
            </span>
          </div>
        ) : duplicates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 flex flex-col items-center justify-center bg-white dark:bg-[#151E32] rounded-3xl border border-dashed border-slate-300/60 dark:border-slate-800 shadow-sm p-8 text-center"
          >
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/10">
              <AcademicCapIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Database Berstatus Bersih!
            </h3>
            <p className="text-xs font-bold mt-2 text-slate-400 max-w-sm">
              Selamat, tidak ada data siswa ganda atau terduplikasi yang ditemukan berdasarkan
              pencarian kriteria {criteria.toUpperCase()}.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-24">
            <AnimatePresence mode="popLayout">
              {duplicates.map((group, groupIdx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  key={`group-${group.key}-${groupIdx}`}
                  className="bg-white dark:bg-[#151E32] border border-amber-300/40 dark:border-amber-900/30 rounded-3xl overflow-hidden shadow-lg shadow-amber-500/2 hover:shadow-xl dark:shadow-none transition-shadow"
                >
                  {/* Glass header for duplicate groups */}
                  <div className="bg-gradient-to-r from-amber-500/10 to-transparent dark:from-amber-950/20 px-5 py-4 border-b border-amber-100 dark:border-amber-900/30 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {groupIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-amber-800 dark:text-amber-500 tracking-wide uppercase">
                          {capitalizeWords(group.students[0]?.namaLengkap || group.key)}
                        </h3>
                        <p className="text-[9px] font-bold text-amber-600 dark:text-amber-600 tracking-wider mt-0.5">
                          Kriteria ({criteria.toUpperCase()}): {group.key}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSelectGroup(group)}
                        className="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-250 px-2.5 py-1.5 rounded-xl font-bold border border-slate-200/50 dark:border-slate-750 transition-all uppercase"
                      >
                        {group.students
                          .map((s) => s.id || s.idUnik)
                          .filter((id) => !!id)
                          .every((id) => selectedIds.includes(id as string))
                          ? 'Batal Pilih'
                          : 'Pilih Semua'}
                      </button>
                      <button
                        onClick={() => handleCleanGroup(group)}
                        className="text-[9px] bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl font-bold tracking-wide shadow-md shadow-amber-500/20 hover:shadow-lg transition-all uppercase"
                      >
                        Mulai Bersih
                      </button>
                    </div>
                  </div>

                  {/* Nested student cards */}
                  <div className="p-4 space-y-3">
                    {group.students.map((student, studentIdx) => (
                      <div
                        key={student.id || student.idUnik || studentIdx}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/70"
                      >
                        <div className="flex gap-3 items-center w-full min-w-0">
                          {/* Row Checkbox selector */}
                          <div className="flex items-center shrink-0 mr-1">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(student.id || student.idUnik || '')}
                              onChange={() => toggleSelect(student.id || student.idUnik || '')}
                              className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer transition-colors"
                            />
                          </div>
                          <div className="w-8 h-8 bg-white dark:bg-[#151E32] border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            #{studentIdx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                                {capitalizeWords(student.namaLengkap)}
                              </p>
                              <span className="shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                                Siswa {studentIdx === 0 ? 'Induk' : 'Duplikat'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 font-bold uppercase tracking-wider text-[9px]">
                              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10">
                                ID: {student.idUnik}
                              </span>
                              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                Rombel: {student.className || student.tingkatRombel || '-'}
                              </span>
                              <span className="text-slate-400">
                                Status: {student.status || 'Aktif'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                          <button
                            onClick={() => handleEdit(student)}
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-50/80 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white text-[10px] font-bold uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap border border-indigo-500/10"
                          >
                            <PencilIcon className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-50/80 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white text-[10px] font-bold uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap border border-rose-500/10"
                          >
                            <TrashIcon className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {isEditModalOpen && selectedStudent && (
        <StudentFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingId={selectedStudent.id || null}
          formData={formData}
          setFormData={setFormData}
          classList={classes.map((c) => c.name)}
          canManage={canManage}
          handleSave={handleSave}
          saving={saving}
          handleMoveTo={handleMoveTo}
        />
      )}

      {pipeline.active && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-[#151E32] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-w-xl w-full space-y-6"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Eksekusi Pipeline Deduplikasi
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                  Execution Pipeline • State Tracking • Final Commit
                </p>
              </div>
              <div>
                {pipeline.isOfflinePaused ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse uppercase tracking-wider border border-amber-500/20">
                    Jeda (Offline)
                  </span>
                ) : pipeline.paused ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wider border border-amber-500/20">
                    Ditangguhkan
                  </span>
                ) : pipeline.done ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-500/20">
                    Selesai
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 animate-pulse uppercase tracking-wider border border-indigo-500/20">
                    Berjalan Aktif
                  </span>
                )}
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>
                  Progres Batch: {pipeline.current} / {pipeline.total} Dokumen
                </span>
                <span>{Math.round((pipeline.current / (pipeline.total || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-100 dark:border-slate-800 p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(pipeline.current / (pipeline.total || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl text-center">
                <span className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wide block">
                  Sukses
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">
                  {pipeline.completed}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl text-center">
                <span className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wide block">
                  Gagal
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">
                  {pipeline.failed}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl text-center">
                <span className="text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wide block">
                  Sisa Antrean
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">
                  {pipeline.total - pipeline.current}
                </span>
              </div>
            </div>

            {/* Active target element */}
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-2xl">
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block">
                Dokumen Berjalan
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mt-1">
                {pipeline.currentItemName || 'Menunggu tindakan antrean...'}
              </p>
            </div>

            {/* Transaction Terminal log Console */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">
                Log Transaksi Sistem
              </span>
              <div className="bg-slate-950 text-slate-305 font-mono text-[9px] leading-relaxed p-4 rounded-2xl h-44 overflow-y-auto space-y-1 shadow-inner scrollbar-none">
                {pipeline.logs.map((logLine, idx) => (
                  <div key={idx} className="whitespace-pre-wrap border-l-2 pl-2 border-slate-850">
                    {logLine}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* Buttons controls */}
            <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-850 pt-4">
              {pipeline.done ? (
                <button
                  onClick={() => {
                    setPipeline((prev) => ({ ...prev, active: false }));
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-md transition-all duration-200"
                >
                  Kembalikan Sistem & Tutup
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          'Yakin ingin membatalkan dan menghentikan seluruh sisa antrean pipeline? Sisa data duplikat tidak akan diproses.',
                        )
                      ) {
                        setPipeline((prev) => ({ ...prev, active: false }));
                        toast.info('Pipeline dibatalkan secara paksa oleh administrator.');
                        findDuplicates();
                      }
                    }}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs uppercase tracking-wider"
                  >
                    Batalkan Antrean
                  </button>

                  <button
                    onClick={() => {
                      setPipeline((prev) => ({ ...prev, paused: !prev.paused }));
                    }}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all duration-200 border ${
                      pipeline.paused
                        ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pipeline.paused ? 'Lanjutkan (Resume)' : 'Jeda Sementara (Pause)'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
