import { useUserStore } from '@/stores/userStore';
/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin (Lead Developer & System Architect)
 * NIP: 19901004 202521 1012
 */

import React, { useState } from 'react';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import {
  ChevronDown,
  DatabaseIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  ClipboardListIcon,
  PlayIcon,
  SearchIcon,
  EditIcon,
  UserIcon,
} from 'lucide-react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { useSchemaMigration } from '@/hooks/useSchemaMigration';
import { migrationService } from '@/services/migrationService';
import {
  scanCollectionsSchema,
  updateFieldInCollections,
  deleteFieldInCollections,
  renameFieldInCollections,
} from '@/services/schemaRepairService';
import { sanitizeForJSON } from '@/utils/firestoreHelpers';
import {
  transformDocData as transformDocDataPure,
  transformStudentToV2 as transformStudentToV2Pure,
  transformTeacherToV2,
} from '@/utils/schemaTransforms';

interface SchemaMigrationSectionProps {
  userRole: UserRole;
  currentUserId: string;
}

export const SchemaMigrationSection: React.FC<SchemaMigrationSectionProps> = ({
  userRole,
  currentUserId,
}) => {
  const { safeCall } = useAutoFix();
  const [openAccordion, setOpenAccordion] = useState<string | null>('analyze');
  const [stats, setStats] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [teacherStats, setTeacherStats] = useState<any>(null);
  const [tenantStats, setTenantStats] = useState<any>(null);
  const [previewSelectedDoc, setPreviewSelectedDoc] = useState<any>(null);
  const [previewDocOutput, setPreviewDocOutput] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [collectionsToPreview, setCollectionsToPreview] = useState<string[]>([
    'students',
    'teachers',
    'tenants',
  ]);
  const [allPreviews, setAllPreviews] = useState<Record<string, { before: any; after: any }>>({});
  const [schemaScanResult, setSchemaScanResult] = useState<any>(null);
  const [updateFieldInput, setUpdateFieldInput] = useState({
    collections: '',
    field: '',
    old: '',
    new: '',
  });
  const [deleteFieldInput, setDeleteFieldInput] = useState({ collections: '', field: '' });
  const [renameFieldInput, setRenameFieldInput] = useState({ fieldOld: '', fieldNew: '' });

  const handlePreviewAll = async () => {
    setIsRunning(true);
    const toastId = toast.loading('Membuat simulasi preview untuk semua koleksi...');

    try {
      const results = await migrationService.previewAll(collectionsToPreview, migrationService.fetchMasterReferences);
      setAllPreviews(results);
      toast.success('Preview semua koleksi selesai.', { id: toastId });
    } catch (e) {
      console.error('Gagal preview all', e);
      toast.error('Gagal membuat preview.');
    } finally {
      setIsRunning(false);
    }
  };
  const [progressStats, setProgressStats] = useState({
    success: 0,
    failed: 0,
    current: 0,
    total: 0,
  });
  const [progressMessage, setProgressMessage] = useState('');
  const [showTeacherConfirm, setShowTeacherConfirm] = useState(false);
  const [rollbackId, setRollbackId] = useState('');
  const [confirmRun, setConfirmRun] = useState(false);
  const [confirmRollback, setConfirmRollback] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [availableMigrations, setAvailableMigrations] = useState<
    { id: string; createdAt: any; processed?: number; type?: string }[]
  >([]);
  const [editUid, setEditUid] = useState('');
  const [editUserData, setEditUserData] = useState('');
  const [migrationApproval, setMigrationApproval] = useState<{
    type: 'users' | 'students' | 'teachers' | 'tenants';
    title: string;
    description: string;
    dataSummary: any;
    execute: () => void;
  } | null>(null);

  const isAuthorized = userRole === UserRole.DEVELOPER || userRole === UserRole.ADMIN;

  const fetchMigrations = React.useCallback(async () => {
    if (!isAuthorized) return;
    try {
      const logs = await migrationService.fetchMigrations();
      // Sort by newest
      logs.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setAvailableMigrations(logs);
    } catch (e) {
      console.error('Failed to fetch migration logs', e);
    }
  }, [isAuthorized]);

  React.useEffect(() => {
    fetchMigrations();
  }, [fetchMigrations]);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const accountTypeMap: Record<string, string> = {
    siswa: 'student',
    orang_tua: 'parent',
    guru: 'teacher',
    staf: 'staff',
    staff: 'staff',
    admin: 'admin',
    kepala_tu: 'staff',
    kepala_madrasah: 'management',
    developer: 'developer',
  };

  const transformDocData = (data: any, docId: string, masterRefs: any) => {
    return transformDocDataPure(data, docId, masterRefs);
  };

  const transformStudentToV2 = (data: any, docId: string) => {
    return transformStudentToV2Pure(data, docId);
  };
  const transformStudentToV2_unused = (data: any, docId: string) => {
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
          data.logPoinKedisiplinan?.poinSanksiKumulatif ||
          data.poin ||
          data.poinSanksiKumulatif ||
          0,
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

  const handleAnalyzeStudents = async () => {
    setIsRunning(true);
    const toastId = toast.loading('Menganalisa koleksi students...');

    await safeCall(async () => {
      const data = await migrationService.analyzeStudents();
      setStudentStats(data);
      toast.success('Analisa students selesai.', { id: toastId });
    }, 'Menu.SchemaMigration.AnalyzeStudents');
    setIsRunning(false);
  };

  const { runStudentMigration, runTeacherMigration, runUserMigration } = useSchemaMigration(true);
  const [userStats, setUserStats] = useState<any>(null);
  const [showUserConfirm, setShowUserConfirm] = useState(false);

  const handleAnalyzeUsers = async () => {
    setIsRunning(true);
    const toastId = toast.loading('Menganalisa koleksi users...');
    await safeCall(async () => {
      const data = await migrationService.analyzeUsers();
      setUserStats(data);
      toast.success('Analisa users selesai.', { id: toastId });
    }, 'Menu.SchemaMigration.AnalyzeUsers');
    setIsRunning(false);
  };

  const handleRunUserMigration = async () => {
    const migrationId = `usr_v2_mig_${Date.now()}`;
    await runUserMigration(migrationId, currentUserId, (stats) => {
      setProgressStats(stats);
      setProgressMessage('Memproses migrasi users ke Canonical v2...');
    });
    setShowUserConfirm(false);
    setTimeout(() => handleAnalyzeUsers(), 500);
  };

  const triggerLocalCacheRefresh = async () => {
    try {
      const { CacheService } = await import('@/services/CacheService');

      const tenantId = useUserStore.getState().tenantId;
      if (tenantId) {
        const syncToastId = toast.loading(
          'Memulai sinkronisasi cache lokal dengan data hasil migrasi...',
        );
        await Promise.all([
          CacheService.refreshCollection('students', 'studentsId', {
            tenantId,
            forceRefresh: true,
          }),
          CacheService.refreshCollection('teachers', 'teachersId', {
            tenantId,
            forceRefresh: true,
          }),
          CacheService.refreshCollection('classes', 'id', { tenantId, forceRefresh: true }),
        ]);
        toast.success('Cache lokal berhasil disinkronkan.', { id: syncToastId });
      }
    } catch (e: any) {
      console.warn('Gagal sinkronisasi cache setelah migrasi:', e);
    }
  };

  const handleRunStudentMigration = async () => {
    const migrationId = `stu_mig_${Date.now()}`;
    await runStudentMigration(migrationId, currentUserId, (stats) => {
      setProgressStats(stats);
    });
    await triggerLocalCacheRefresh();
    setTimeout(() => handleAnalyzeStudents(), 500);
  };

  const handleRunTeacherMigration = async () => {
    const migrationId = `tea_mig_${Date.now()}`;
    await runTeacherMigration(migrationId, currentUserId, (stats) => {
      setProgressStats(stats);
      setProgressMessage('Memproses data guru...');
    });
    await triggerLocalCacheRefresh();
    setTimeout(() => handleAnalyzeTeachers(), 500);
  };

  // Pure teacher transformation imported from @/utils/schemaTransforms

  const handleAnalyzeTeachers = async () => {
    setIsRunning(true);
    const toastId = toast.loading('Menganalisa koleksi teachers...');

    await safeCall(async () => {
      const data = await migrationService.analyzeTeachers();
      setTeacherStats(data);
      toast.success('Analisa teachers selesai.', { id: toastId });
    }, 'Menu.SchemaMigration.AnalyzeTeachers');
    setIsRunning(false);
  };

  const handleAnalyzeTenants = async () => {
    setIsRunning(true);
    const toastId = toast.loading('Menganalisa koleksi tenants...');

    await safeCall(async () => {
      const data = await migrationService.analyzeTenants();
      setTenantStats(data);
      toast.success('Analisa tenants selesai.', { id: toastId });
    }, 'Menu.SchemaMigration.AnalyzeTenants');
    setIsRunning(false);
  };

  // Pure tenant transformation imported from @/utils/schemaTransforms

  const handleRunTenantMigration = async () => {
    setIsRunning(true);
    const toastId = toast.loading('Memulai migrasi tenants ke V2...');
    const migrationId = `ten_mig_${Date.now()}`;

    await safeCall(async () => {
      await migrationService.runTenantMigration(migrationId, currentUserId, (stats) => {
        setProgressStats(stats);
        setProgressMessage('Memproses data tenant...');
      });

      toast.success(`Migrasi Tenants Selesai.`, { id: toastId });
      triggerLocalCacheRefresh().then(() => handleAnalyzeTenants());
    }, 'Menu.SchemaMigration.RunTenantMigration');
    setIsRunning(false);
  };

  const handleAutoFixRefs = async (singleUid: string | null = null) => {
    setIsRunning(true);
    const toastId = toast.loading('Memulai Auto-Fix data pengguna...');

    await safeCall(async () => {
      const { success, fixedUsersLog } = await migrationService.runAutoFixRefs(singleUid, currentUserId);

      if (fixedUsersLog.length > 0) {
        setStats((prev: any) => ({
          ...prev,
          fixedUsersLog: [...(prev?.fixedUsersLog || []), ...fixedUsersLog],
        }));
      }

      toast.success(`Auto-fix Selesai, ${success} data diperbaiki. Silakan Scan ulang.`, {
        id: toastId,
      });
    }, 'Menu.SchemaMigration.AutoFixRef');
    setIsRunning(false);
  };

  const handleAnalyze = async () => {
    setIsRunning(true);
    const toastId = toast.loading('Menganalisa koleksi users...');

    await safeCall(async () => {
      const data = await migrationService.analyzeUsers();
      // Adjusting to what the component expects
      const statsData = {
        ...data,
        missingRoles: data.legacyCount, // approximation
        missingAccType: data.legacyCount,
        missingRefId: data.legacyCount,
        invalidRoles: data.legacyCount,
        duplicateUids: 0,
        invalidUsersList: [],
        missingRefsList: [],
      };
      setStats(statsData);
      toast.success('Analisa selesai.', { id: toastId });
    }, 'Menu.SchemaMigration.Analyze');
    setIsRunning(false);
  };

  const handleScanSchema = async () => {
    if (!updateFieldInput.collections) return;
    setIsRunning(true);
    const toastId = toast.loading('Scanning schema...');
    await safeCall(async () => {
      const res = await scanCollectionsSchema([updateFieldInput.collections]);
      setSchemaScanResult(res);
      toast.success('Scan selesai.', { id: toastId });
    }, 'Menu.SchemaMigration.Scan');
    setIsRunning(false);
  };

  const handleUpdateField = async () => {
    if (!updateFieldInput.collections) return;
    const collectionName = updateFieldInput.collections.trim();
    setIsRunning(true);
    const toastId = toast.loading('Updating fields...');
    await safeCall(async () => {
      await updateFieldInCollections(
        [collectionName],
        updateFieldInput.field,
        updateFieldInput.old,
        updateFieldInput.new,
        (msg) => toast.loading(msg),
      );
      toast.success('Update berhasil.', { id: toastId });
    }, 'Menu.SchemaMigration.UpdateField');
    setIsRunning(false);
  };

  const handleRenameField = async () => {
    if (!updateFieldInput.collections) return;
    const collectionName = updateFieldInput.collections.trim();
    setIsRunning(true);
    const toastId = toast.loading('Renaming fields...');
    await safeCall(async () => {
      await renameFieldInCollections(
        [collectionName],
        renameFieldInput.fieldOld,
        renameFieldInput.fieldNew,
        (msg) => toast.loading(msg),
      );
      toast.success('Rename berhasil.', { id: toastId });
    }, 'Menu.SchemaMigration.RenameField');
    setIsRunning(false);
  };

  const handleDeleteField = async () => {
    if (!updateFieldInput.collections) return;
    const collectionName = updateFieldInput.collections.trim();
    setIsRunning(true);
    const toastId = toast.loading('Deleting fields...');
    await safeCall(async () => {
      await deleteFieldInCollections([collectionName], deleteFieldInput.field, (msg) =>
        toast.loading(msg),
      );
      toast.success('Delete berhasil.', { id: toastId });
    }, 'Menu.SchemaMigration.DeleteField');
    setIsRunning(false);
  };

  const handleOpenEditModal = (uid: string, rawData: any) => {
    setEditUid(uid);
    setEditUserData(JSON.stringify(rawData));
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editUid) return;

    try {
      const parsedData = JSON.parse(editUserData);
      setIsRunning(true);
      const toastId = toast.loading('Menyimpan data pengguna...');

      await safeCall(async () => {
        await migrationService.runUserEdit(editUid, parsedData, currentUserId);
        toast.success('Berhasil memperbarui data pengguna.', { id: toastId });
        setEditModalOpen(false);
        setStats(null); // Force user to rescan to update lists correctly
      }, 'Menu.SchemaMigration.ManualEdit');
    } catch (e: any) {
      toast.error('Format JSON tidak valid: ' + e.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handlePreview = async () => {
    setIsRunning(true);
    const toastId = toast.loading('Membuat simulasi preview...');

    await safeCall(async () => {
      const results = await migrationService.previewAll(['users'], migrationService.fetchMasterReferences);
      if (results.users) {
        setPreviewSelectedDoc(results.users.before);
        setPreviewDocOutput(results.users.after);
        toast.success('Preview berhasil dibuat.', { id: toastId });
      } else {
        toast.info('Tidak ada data users.', { id: toastId });
      }
    }, 'Menu.SchemaMigration.Preview');
    setIsRunning(false);
  };

  const handleRunMigration = async () => {
    setConfirmRun(false);
    setIsRunning(true);
    const toastId = toast.loading('Memulai proses migrasi skema...');
    const migrationId = `mig_${Date.now()}`;

    await safeCall(async () => {
      await migrationService.runUserMigration(migrationId, currentUserId, (stats) => {
        setProgressStats(stats);
      });

      toast.success(`Migrasi selesai.`, { id: toastId });
      triggerLocalCacheRefresh();
    }, 'Menu.SchemaMigration.Run');
    setIsRunning(false);
  };

  const handleRollback = async () => {
    if (!rollbackId) {
      toast.error('Masukkan Migration ID');
      return;
    }
    setConfirmRollback(false);
    setIsRunning(true);
    const toastId = toast.loading(`Memulai rollback id ${rollbackId}...`);

    await safeCall(async () => {
      const restored = await migrationService.runRollback(rollbackId, currentUserId, (current, total) => {
        toast.loading(`Rollback berjalan: ${current}/${total}...`, { id: toastId });
      });
      toast.success(`Rollback Selesai, ${restored} dokumen dikembalikan.`, { id: toastId });
    }, 'Menu.SchemaMigration.Rollback');
    setIsRunning(false);
  };

  if (!isAuthorized) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center opacity-70">
        <AlertTriangleIcon className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-xl font-bold text-rose-600 tracking-tight uppercase">Akses Ditolak</h3>
        <p className="text-sm font-bold text-slate-500 mt-2">
          Anda tidak memiliki izin Developer atau Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-20">
      {/* New Diagnostic Tools Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
          Diagnostic & Repair Tools
        </h4>
        <div className="space-y-4">
          <select
            className="w-full p-2 rounded-xl border border-slate-300 text-sm"
            value={updateFieldInput.collections}
            onChange={(e) =>
              setUpdateFieldInput({ ...updateFieldInput, collections: e.target.value })
            }
          >
            <option value="">Pilih Koleksi</option>
            {[
              'users',
              'students',
              'teachers',
              'attendance',
              'classes',
              'poin',
              'tenants',
              'migration_logs',
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={handleScanSchema}
            className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase"
          >
            Scan {updateFieldInput.collections || '...'}
          </button>
          {schemaScanResult && (
            <div className="bg-slate-900 p-4 rounded-xl">
              <h6 className="text-[10px] text-slate-400 uppercase font-bold mb-2">
                Schema: {updateFieldInput.collections}
              </h6>
              <pre className="text-[10px] text-white overflow-auto h-32">
                {JSON.stringify(
                  sanitizeForJSON(schemaScanResult[updateFieldInput.collections]),
                  null,
                  2,
                )}
              </pre>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-500">Ubah Nilai Field</h5>
              <input
                className="w-full p-2 rounded-xl border border-slate-300 text-sm"
                placeholder="Nama Field"
                value={updateFieldInput.field}
                onChange={(e) =>
                  setUpdateFieldInput({ ...updateFieldInput, field: e.target.value })
                }
              />
              <input
                className="w-full p-2 rounded-xl border border-slate-300 text-sm"
                placeholder="Nilai Lama (JSON)"
                value={updateFieldInput.old}
                onChange={(e) => setUpdateFieldInput({ ...updateFieldInput, old: e.target.value })}
              />
              <input
                className="w-full p-2 rounded-xl border border-slate-300 text-sm"
                placeholder="Nilai Baru (JSON)"
                value={updateFieldInput.new}
                onChange={(e) => setUpdateFieldInput({ ...updateFieldInput, new: e.target.value })}
              />
              <button
                onClick={handleUpdateField}
                disabled={isRunning || !updateFieldInput.collections}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase"
              >
                Update Nilai
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <h5 className="text-xs font-bold text-slate-500 mb-2">Hapus Field</h5>
              <input
                className="w-full mb-2 p-2 rounded-xl border border-slate-300 text-sm"
                placeholder="Nama Field"
                value={deleteFieldInput.field}
                onChange={(e) =>
                  setDeleteFieldInput({ ...deleteFieldInput, field: e.target.value })
                }
              />
              <button
                onClick={handleDeleteField}
                disabled={isRunning || !updateFieldInput.collections}
                className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase"
              >
                Hapus Field
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <h5 className="text-xs font-bold text-slate-500 mb-2">Ganti Nama Field</h5>
              <input
                className="w-full mb-2 p-2 rounded-xl border border-slate-300 text-sm"
                placeholder="Nama Field Lama"
                value={renameFieldInput.fieldOld}
                onChange={(e) =>
                  setRenameFieldInput({ ...renameFieldInput, fieldOld: e.target.value })
                }
              />
              <input
                className="w-full mb-2 p-2 rounded-xl border border-slate-300 text-sm"
                placeholder="Nama Field Baru"
                value={renameFieldInput.fieldNew}
                onChange={(e) =>
                  setRenameFieldInput({ ...renameFieldInput, fieldNew: e.target.value })
                }
              />
              <button
                onClick={handleRenameField}
                disabled={isRunning || !updateFieldInput.collections}
                className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase"
              >
                Ganti Nama Field
              </button>
            </div>
          </div>
        </div>
      </div>
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Edit Document JSON
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-bold">
              Pastikan format JSON valid. Perubahan akan langsung disimpan ke database.
            </p>
            <textarea
              value={editUserData}
              onChange={(e) => setEditUserData(e.target.value)}
              className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[300px] mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isRunning}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase bg-indigo-600 text-white shadow-md transition ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
              >
                {isRunning ? 'Menyimpan...' : 'Simpan JSON'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 flex flex-col items-center justify-center text-center rounded-3xl shadow-xl mb-6">
        <DatabaseIcon className="w-10 h-10 text-indigo-400 mb-3" />
        <h2 className="text-lg font-bold text-white uppercase tracking-wide">
          Schema Migration
        </h2>
        <p className="text-xs font-bold text-indigo-200 mt-2 max-w-lg">
          Alat migrasi skema database aman untuk koleksi "users", "students", dan "teachers".
          Termasuk injeksi RBAC, tipe akun, dan field references.
        </p>
      </div>

      {/* WO-007 User Migration Execution (Canonical User Schema v2) */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all mb-4">
        <button
          onClick={() => toggleAccordion('users')}
          className="w-full flex items-center justify-between mb-0"
        >
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-indigo-500" /> WO-007: Canonical User Migration (v2)
          </h3>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${openAccordion === 'users' ? 'rotate-180' : ''}`}
          />
        </button>

        {openAccordion === 'users' && (
          <div className="pt-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 mb-6 flex items-start gap-3">
              <AlertTriangleIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  Migrasi Koleksi Users ke Canonical User Schema v2
                </p>
                <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 mt-1">
                  Menormalisasi role, accountType, tenantId, scope, dan preservation legacy tanpa kehilangan data lama. Membuat snapshot backup otomatis di migration_backups.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAnalyzeUsers}
                disabled={isRunning}
                className={`bg-slate-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
              >
                {isRunning ? 'Analyzing...' : 'Scan Users'}
              </button>

              {userStats && userStats.legacyCount > 0 && !showUserConfirm && (
                <button
                  onClick={() => setShowUserConfirm(true)}
                  disabled={isRunning}
                  className={`bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20 ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                >
                  <PlayIcon className="w-4 h-4" />
                  Mulai Migrasi Users (v2)
                </button>
              )}
            </div>

            {showUserConfirm && (
              <div className="mt-6 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg">
                    <AlertTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-tight">
                      Konfirmasi WO-007 User Migration v2
                    </h4>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400/80 mt-1">
                      Anda akan memigrasikan{' '}
                      <span className="font-bold underline">
                        {userStats.legacyCount} dokumen users
                      </span>{' '}
                      ke Canonical User Schema v2 dengan backup otomatis.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleRunUserMigration}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shadow-md active:scale-95"
                      >
                        Ya, Jalankan Migrasi Users
                      </button>
                      <button
                        onClick={() => setShowUserConfirm(false)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {userStats && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Total Users
                  </p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                    {userStats.total}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-amber-500 tracking-wider">
                    Legacy Format
                  </p>
                  <p className="text-lg font-bold text-amber-600 mt-1">
                    {userStats.legacyCount}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-emerald-500 tracking-wider">
                    Schema v2
                  </p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">
                    {userStats.v2Count}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teacher Schema Evolution (v2) */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all mb-4">
        <button
          onClick={() => toggleAccordion('teachers')}
          className="w-full flex items-center justify-between mb-0"
        >
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4 text-emerald-500" /> Teacher Data Evolution (v2)
          </h3>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${openAccordion === 'teachers' ? 'rotate-180' : ''}`}
          />
        </button>

        {openAccordion === 'teachers' && (
          <div className="pt-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 mb-6 flex items-start gap-3">
              <AlertTriangleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Migrasi Guru ke Schema Terstruktur
                </p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                  Update seluruh dokumen guru ke format baru (jabatanDanStatus, penugasanAkademik,
                  kontak, sistemJangkar).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAnalyzeTeachers}
                disabled={isRunning}
                className={`bg-slate-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
              >
                {isRunning ? 'Analyzing...' : 'Scan Teachers'}
              </button>

              {teacherStats && teacherStats.legacyCount > 0 && !showTeacherConfirm && (
                <button
                  onClick={() => setShowTeacherConfirm(true)}
                  disabled={isRunning}
                  className={`bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20 ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}
                >
                  <PlayIcon className="w-4 h-4" />
                  Mulai Migrasi Teachers (v2)
                </button>
              )}
            </div>

            {showTeacherConfirm && (
              <div className="mt-6 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg">
                    <AlertTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-tight">
                      Konfirmasi Migrasi Schema V2
                    </h4>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400/80 mt-1">
                      Anda akan memperbarui{' '}
                      <span className="font-bold underline">
                        {teacherStats.legacyCount} dokumen guru
                      </span>{' '}
                      ke format data terstruktur. Proses ini akan membuat backup data lama secara
                      otomatis.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleRunTeacherMigration}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shadow-md active:scale-95"
                      >
                        Ya, Jalankan Sekarang
                      </button>
                      <button
                        onClick={() => setShowTeacherConfirm(false)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {teacherStats && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Total Guru
                  </p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-1">
                    {teacherStats.total}
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[9px] font-bold uppercase text-amber-400 tracking-wider">
                    Legacy Schema (v1)
                  </p>
                  <p className="text-xl font-bold text-amber-600 mt-1">
                    {teacherStats.legacyCount}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider">
                    V2 Ready
                  </p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{teacherStats.v2Count}</p>
                </div>
              </div>
            )}

            {progressStats.total > 0 &&
              progressStats.current < progressStats.total &&
              isRunning &&
              openAccordion === 'teachers' && (
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                    <span className="flex items-center gap-2">
                      <RefreshCwIcon className="w-3 h-3 animate-spin text-emerald-500" />
                      {progressMessage}
                    </span>
                    <span>
                      {progressStats.current} / {progressStats.total}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(progressStats.current / progressStats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

            {progressStats.total > 0 &&
              progressStats.current === progressStats.total &&
              openAccordion === 'teachers' && (
                <div className="mt-5 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Migration Complete
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold mt-1">
                        {progressStats.success} Berhasil, {progressStats.failed} Gagal dari{' '}
                        {progressStats.total} Dokumen.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {teacherStats && teacherStats.sampleDoc && (
              <div className="mt-6">
                <p className="text-[10px] font-bold tracking-wide uppercase text-slate-400 mb-3 px-2">
                  Preview Transform (Sample)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-auto max-h-60 custom-scrollbar">
                    <p className="text-[8px] font-bold text-slate-500 uppercase mb-2">Original</p>
                    <pre className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap">
                      {JSON.stringify(teacherStats.sampleDoc)}
                    </pre>
                  </div>
                  <div className="bg-emerald-950 p-4 rounded-2xl border border-emerald-900/50 overflow-auto max-h-60 custom-scrollbar">
                    <p className="text-[8px] font-bold text-emerald-400 uppercase mb-2">
                      V2 Result
                    </p>
                    <pre className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap">
                      {JSON.stringify(transformTeacherToV2(teacherStats.sampleDoc, 'sample_id'))}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student Schema Evolution (v2) */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all mb-4">
        <button
          onClick={() => toggleAccordion('students')}
          className="w-full flex items-center justify-between mb-0"
        >
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4 text-indigo-500" /> Student Data Evolution (v2)
          </h3>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${openAccordion === 'students' ? 'rotate-180' : ''}`}
          />
        </button>

        {openAccordion === 'students' && (
          <div className="pt-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 mb-6 flex items-start gap-3">
              <AlertTriangleIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  Migrasi Siswa ke Schema Terstruktur
                </p>
                <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 mt-1">
                  Update seluruh dokumen siswa ke format baru (metadataAkademik, kontakDanWali,
                  logPoinKedisiplinan, sistemJangkar).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAnalyzeStudents}
                disabled={isRunning}
                className={`bg-slate-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
              >
                {isRunning ? 'Analyzing...' : 'Scan Students'}
              </button>

              {studentStats && studentStats.legacyCount > 0 && (
                <button
                  onClick={handleRunStudentMigration}
                  disabled={isRunning}
                  className={`bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20 ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                >
                  <PlayIcon className="w-4 h-4" />
                  Mulai Migrasi Students (v2)
                </button>
              )}
            </div>

            {studentStats && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Total Siswa
                  </p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-1">
                    {studentStats.total}
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[9px] font-bold uppercase text-amber-400 tracking-wider">
                    Legacy Schema (v1)
                  </p>
                  <p className="text-xl font-bold text-amber-600 mt-1">
                    {studentStats.legacyCount}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider">
                    V2 Ready
                  </p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{studentStats.v2Count}</p>
                </div>
              </div>
            )}

            {progressStats.total > 0 &&
              progressStats.current < progressStats.total &&
              isRunning &&
              openAccordion === 'students' && (
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                    <span>Migrating Students...</span>
                    <span>
                      {progressStats.current} / {progressStats.total}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${(progressStats.current / progressStats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

            {progressStats.total > 0 &&
              progressStats.current === progressStats.total &&
              openAccordion === 'students' && (
                <div className="mt-5 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Migration Complete
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold mt-1">
                        {progressStats.success} Berhasil, {progressStats.failed} Gagal dari{' '}
                        {progressStats.total} Dokumen.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {studentStats && studentStats.sampleDoc && (
              <div className="mt-6">
                <p className="text-[10px] font-bold tracking-wide uppercase text-slate-400 mb-3 px-2">
                  Preview Transform (Sample)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-auto max-h-60 custom-scrollbar">
                    <p className="text-[8px] font-bold text-slate-500 uppercase mb-2">Original</p>
                    <pre className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap">
                      {JSON.stringify(studentStats.sampleDoc)}
                    </pre>
                  </div>
                  <div className="bg-indigo-950 p-4 rounded-2xl border border-indigo-900/50 overflow-auto max-h-60 custom-scrollbar">
                    <p className="text-[8px] font-bold text-indigo-400 uppercase mb-2">V2 Result</p>
                    <pre className="text-[10px] font-mono text-indigo-300 whitespace-pre-wrap">
                      {JSON.stringify(transformStudentToV2(studentStats.sampleDoc, 'sample_id'))}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analyze Schema */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all">
        <button
          onClick={() => toggleAccordion('analyze')}
          className="w-full flex items-center justify-between mb-0"
        >
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
            <SearchIcon className="w-4 h-4 text-emerald-500" /> Analyze Schema & Run Migration
          </h3>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${openAccordion === 'analyze' ? 'rotate-180' : ''}`}
          />
        </button>

        {openAccordion === 'analyze' && (
          <div className="pt-6 animate-in fade-in zoom-in-95 duration-200 space-y-6">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pusat kendali analisa skema dan eksekusi migrasi mandiri ke format Terstruktur (V2)
              untuk seluruh koleksi database utama.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Users */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold tracking-wide uppercase text-emerald-500 flex items-center gap-2 mb-2">
                    <DatabaseIcon className="w-4 h-4 text-emerald-500" /> Users Collection
                  </h4>
                  <p className="text-[10px] text-slate-500 mb-4">
                    Memvalidasi mapping RBAC, mendeteksi role/UID ganda, dan menyelaraskan referensi
                    tautan guru/siswa.
                  </p>

                  {stats ? (
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-5">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        Total:{' '}
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                          {stats.total}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-sky-500">
                        Missing refId: <span className="font-extrabold">{stats.missingRefId}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-rose-500">
                        Missing Role: <span className="font-extrabold">{stats.missingRoles}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-amber-500">
                        Invalid Role: <span className="font-extrabold">{stats.invalidRoles}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-bold mb-5">
                      Belum di-scan. Klik tombol Scan di bawah.
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={handleAnalyze}
                    disabled={isRunning}
                    className={`flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors text-center cursor-pointer ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isRunning ? 'Scanning...' : 'Scan User'}
                  </button>
                  <button
                    onClick={() => {
                      if (!stats) {
                        toast.error('Silakan lakukan Scan User terlebih dahulu');
                        return;
                      }
                      setMigrationApproval({
                        type: 'users',
                        title: 'Konfirmasi Migrasi User Collection',
                        description:
                          'Proses ini akan memperbarui skema seluruh dokumen pengguna (RBAC, accounType, referenceId).',
                        execute: handleRunMigration,
                        dataSummary: (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                              Total User:{' '}
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {stats.total}
                              </span>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400">
                              Missing/Invalid:{' '}
                              <span className="font-bold">
                                {stats.missingRefId + stats.missingRoles + stats.invalidRoles}
                              </span>
                            </div>
                          </div>
                        ),
                      });
                    }}
                    disabled={isRunning}
                    className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors text-center flex items-center justify-center gap-1 cursor-pointer ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <PlayIcon className="w-3 h-3" /> Run Migration
                  </button>
                </div>
              </div>

              {/* Card 2: Students */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold tracking-wide uppercase text-indigo-500 flex items-center gap-2 mb-2">
                    <DatabaseIcon className="w-4 h-4 text-indigo-500" /> Students Collection
                  </h4>
                  <p className="text-[10px] text-slate-500 mb-4">
                    Migrasi terstruktur data siswa ke format terintegrasi (metadataAkademik,
                    kontakDanWali, logPoinKedisiplinan).
                  </p>

                  {studentStats ? (
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-5">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        Total:{' '}
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                          {studentStats.total}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-amber-500 font-extrabold">
                        Legacy V1: <span>{studentStats.legacyCount}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-emerald-500 font-extrabold">
                        V2 Ready: <span>{studentStats.v2Count}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-bold mb-5">
                      Belum di-scan. Klik tombol Scan di bawah.
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={handleAnalyzeStudents}
                    disabled={isRunning}
                    className={`flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors text-center cursor-pointer ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isRunning ? 'Scanning...' : 'Scan Students'}
                  </button>
                  <button
                    onClick={() => {
                      if (!studentStats) {
                        toast.error('Silakan lakukan Scan Students terlebih dahulu');
                        return;
                      }
                      setMigrationApproval({
                        type: 'students',
                        title: 'Konfirmasi Migrasi Students Collection (V2)',
                        description:
                          'Struktur data siswa akan digabungkan menjadi metadata terpusat (metadataAkademik, kontakDanWali, logPoinKedisiplinan).',
                        execute: handleRunStudentMigration,
                        dataSummary: (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                              Total Siswa:{' '}
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {studentStats.total}
                              </span>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400">
                              Legacy (V1):{' '}
                              <span className="font-bold">{studentStats.legacyCount}</span>
                            </div>
                          </div>
                        ),
                      });
                    }}
                    disabled={isRunning}
                    className={`flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors text-center flex items-center justify-center gap-1 cursor-pointer ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <PlayIcon className="w-3 h-3" /> Run Migration
                  </button>
                </div>
              </div>

              {/* Card 3: Teachers */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold tracking-wide uppercase text-emerald-600 flex items-center gap-2 mb-2">
                    <DatabaseIcon className="w-4 h-4 text-emerald-600" /> Teachers Collection
                  </h4>
                  <p className="text-[10px] text-slate-500 mb-4">
                    Restrukturisasi data guru ke format terstruktur (metadataBiodata,
                    penugasanJabatan, logKehadiranBulanan).
                  </p>

                  {teacherStats ? (
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-5">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        Total:{' '}
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                          {teacherStats.total}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-amber-500 font-extrabold">
                        Legacy V1: <span>{teacherStats.legacyCount}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-emerald-500 font-extrabold">
                        V2 Ready: <span>{teacherStats.v2Count}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-bold mb-5">
                      Belum di-scan. Klik tombol Scan di bawah.
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={handleAnalyzeTeachers}
                    disabled={isRunning}
                    className={`flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors text-center cursor-pointer ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isRunning ? 'Scanning...' : 'Scan Teachers'}
                  </button>
                  <button
                    onClick={() => {
                      if (!teacherStats) {
                        toast.error('Silakan lakukan Scan Teachers terlebih dahulu');
                        return;
                      }
                      setMigrationApproval({
                        type: 'teachers',
                        title: 'Konfirmasi Migrasi Teachers Collection (V2)',
                        description:
                          'Struktur data guru akan digabungkan menjadi metadata terpusat (metadataBiodata, penugasanJabatan, logKehadiranBulanan).',
                        execute: handleRunTeacherMigration,
                        dataSummary: (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                              Total Guru:{' '}
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {teacherStats.total}
                              </span>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400">
                              Legacy (V1):{' '}
                              <span className="font-bold">{teacherStats.legacyCount}</span>
                            </div>
                          </div>
                        ),
                      });
                    }}
                    disabled={isRunning}
                    className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors text-center flex items-center justify-center gap-1 cursor-pointer ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <PlayIcon className="w-3 h-3" /> Run Migration
                  </button>
                </div>
              </div>

              {/* Card 4: Tenants */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold tracking-wide uppercase text-amber-500 flex items-center gap-2 mb-2">
                    <DatabaseIcon className="w-4 h-4 text-amber-500" /> Tenant Collection
                  </h4>
                  <p className="text-[10px] text-slate-500 mb-4">
                    Standarisasi identitas branding, NPSN, konfigurasi tahun ajaran aktif, toleransi
                    keterlambatan sesi kelas.
                  </p>

                  {tenantStats ? (
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-5">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        Total:{' '}
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                          {tenantStats.total}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-emerald-500 font-extrabold">
                        Active: <span>{tenantStats.activeTenants}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-rose-500 font-extrabold">
                        Inactive: <span>{tenantStats.inactiveTenants}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-bold mb-5">
                      Belum di-scan. Klik tombol Scan di bawah.
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={handleAnalyzeTenants}
                    disabled={isRunning}
                    className={`flex-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors text-center cursor-pointer ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isRunning ? 'Scanning...' : 'Scan Tenant'}
                  </button>
                  <button
                    onClick={() => {
                      if (!tenantStats) {
                        toast.error('Silakan lakukan Scan Tenant terlebih dahulu');
                        return;
                      }
                      setMigrationApproval({
                        type: 'tenants',
                        title: 'Konfirmasi Migrasi Tenant Collection (V2)',
                        description:
                          'Standarisasi struktur identitas madrasah, branding, dan konfigurasi tahun ajaran/sesi.',
                        execute: handleRunTenantMigration,
                        dataSummary: (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                              Total Tenant:{' '}
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {tenantStats.total}
                              </span>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400">
                              Total Inactive:{' '}
                              <span className="font-bold">{tenantStats.inactiveTenants}</span>
                            </div>
                          </div>
                        ),
                      });
                    }}
                    disabled={isRunning}
                    className={`flex-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors text-center flex items-center justify-center gap-1 cursor-pointer ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <PlayIcon className="w-3 h-3" /> Run Migration
                  </button>
                </div>
              </div>

              {/* Card 5: Multi-Collection Preview */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold tracking-wide uppercase text-emerald-500 flex items-center gap-2 mb-2">
                    <DatabaseIcon className="w-4 h-4 text-emerald-500" /> Multi-Collection Preview
                    (JSON)
                  </h4>
                  <p className="text-[10px] text-slate-500 mb-4">
                    Analisa sampel data dari berbagai koleksi, transformasikan ke V2, dan edit hasil
                    akhirnya.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={handlePreviewAll}
                    disabled={isRunning}
                    className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors text-center cursor-pointer ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isRunning ? 'Processing...' : 'Generate Preview SEMUA KOLEKSI'}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Display */}
            {Object.keys(allPreviews).length > 0 && (
              <div className="mt-8 p-6 bg-slate-950 rounded-3xl border border-slate-800">
                <h3 className="text-white font-bold text-sm mb-4">
                  Hasil Preview Transformasi Schema (V2)
                </h3>
                <div className="space-y-6">
                  {Object.entries(allPreviews).map(([coll, data]) => (
                    <div
                      key={coll}
                      className="p-4 bg-slate-900 rounded-2xl border border-slate-700"
                    >
                      <h4 className="text-emerald-400 font-bold mb-3 uppercase tracking-wide">
                        {coll}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-400">
                        <div>
                          <h5 className="font-bold text-slate-500 mb-1">Sebelum</h5>
                          <pre className="p-3 bg-black rounded h-40 overflow-auto">
                            {JSON.stringify(sanitizeForJSON(data.before), null, 2)}
                          </pre>
                        </div>
                        <div className="relative">
                          <h5 className="font-bold text-emerald-500 mb-1">Sesudah (V2)</h5>
                          <pre className="p-3 bg-black rounded h-40 overflow-auto text-emerald-400">
                            {JSON.stringify(sanitizeForJSON(data.after), null, 2)}
                          </pre>
                          <button
                            className="absolute top-8 right-2 p-2 bg-slate-700 rounded text-white"
                            onClick={() => handleOpenEditModal(coll, data.after)}
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats && (stats.missingRefId > 0 || stats.invalidRoles > 0) && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    if (
                      confirm(
                        'Yakin ingin menjalankan Auto-Fix bagi data yang tidak valid berdasarkan mapping default?',
                      )
                    ) {
                      handleAutoFixRefs();
                    }
                  }}
                  disabled={isRunning}
                  className={`bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors flex items-center gap-2 cursor-pointer ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RefreshCwIcon className="w-4 h-4 animate-pulse" />
                  {isRunning ? 'Processing...' : 'Run Auto-Fix on User Collection'}
                </button>
              </div>
            )}

            {progressStats.total > 0 && (
              <div
                className={`mt-6 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border ${progressStats.current === progressStats.total && !isRunning ? 'border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10' : 'border-slate-200 dark:border-slate-800'} animate-in fade-in slide-in-from-top-2`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    {isRunning ? (
                      <RefreshCwIcon className="w-4 h-4 text-indigo-500 animate-spin" />
                    ) : (
                      <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">
                      {isRunning ? 'Migrasi Berjalan...' : 'Migrasi Selesai'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {Math.round((progressStats.current / progressStats.total) * 100)}%
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-300 ${progressStats.current === progressStats.total && !isRunning ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${(progressStats.current / progressStats.total) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">
                    {progressStats.current} / {progressStats.total} Dokumen
                  </span>
                  <div className="flex gap-3">
                    <span className="text-emerald-500">{progressStats.success} Sukses</span>
                    <span className="text-rose-500">{progressStats.failed} Gagal</span>
                  </div>
                </div>
                {!isRunning && progressStats.current === progressStats.total && (
                  <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Database telah diperbarui ke Schema V2.
                    </p>
                    <button
                      onClick={() =>
                        setProgressStats({ success: 0, failed: 0, current: 0, total: 0 })
                      }
                      className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wide"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}

            {stats && (
              <div className="mt-5 grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Total User
                  </p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                  <p className="text-[9px] font-bold uppercase text-rose-400 tracking-wider">
                    Missing Roles
                  </p>
                  <p className="text-xl font-bold text-rose-600 mt-1">{stats.missingRoles}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[9px] font-bold uppercase text-amber-400 tracking-wider">
                    Missing accType
                  </p>
                  <p className="text-xl font-bold text-amber-600 mt-1">{stats.missingAccType}</p>
                </div>
                <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                  <p className="text-[9px] font-bold uppercase text-sky-400 tracking-wider">
                    Missing refId
                  </p>
                  <p className="text-xl font-bold text-sky-600 mt-1">{stats.missingRefId}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                  <p className="text-[9px] font-bold uppercase text-orange-400 tracking-wider">
                    Invalid Role
                  </p>
                  <p className="text-xl font-bold text-orange-600 mt-1">{stats.invalidRoles}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <p className="text-[9px] font-bold uppercase text-red-400 tracking-wider">
                    Dup. UID
                  </p>
                  <p className="text-xl font-bold text-red-600 mt-1">{stats.duplicateUids}</p>
                </div>
              </div>
            )}

            {studentStats && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="md:col-span-3">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wide mb-1 px-1">
                    Hasil Audit Student Schema
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Total Students
                  </p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-1">
                    {studentStats.total}
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[9px] font-bold uppercase text-amber-400 tracking-wider">
                    Legacy Schema (v1)
                  </p>
                  <p className="text-xl font-bold text-amber-600 mt-1">
                    {studentStats.legacyCount}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider">
                    V2 Ready
                  </p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{studentStats.v2Count}</p>
                </div>
              </div>
            )}

            {tenantStats && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="md:col-span-3">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wide mb-1 px-1">
                    Hasil Audit Tenant Schema
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Total Tenant
                  </p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-1">
                    {tenantStats.total}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider">
                    Active Tenant
                  </p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">
                    {tenantStats.activeTenants}
                  </p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                  <p className="text-[9px] font-bold uppercase text-rose-400 tracking-wider">
                    Inactive Tenant
                  </p>
                  <p className="text-xl font-bold text-rose-600 mt-1">
                    {tenantStats.inactiveTenants}
                  </p>
                </div>
              </div>
            )}

            {teacherStats && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="md:col-span-3">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wide mb-1 px-1">
                    Hasil Audit Teacher Schema
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Total Teachers
                  </p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-1">
                    {teacherStats.total}
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[9px] font-bold uppercase text-amber-400 tracking-wider">
                    Legacy Schema (v1)
                  </p>
                  <p className="text-xl font-bold text-amber-600 mt-1">
                    {teacherStats.legacyCount}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider">
                    V2 Ready
                  </p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{teacherStats.v2Count}</p>
                </div>
              </div>
            )}

            {stats?.invalidUsersList && stats.invalidUsersList.length > 0 && (
              <div className="mt-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl p-4">
                <h4 className="text-[11px] font-bold uppercase text-orange-600 mb-2 flex items-center gap-2">
                  <AlertTriangleIcon className="w-4 h-4" /> Daftar Pengguna dengan Invalid Role
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {stats.invalidUsersList.map((user: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-orange-100 dark:border-orange-900/30 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {user.name}
                        </span>
                        <span className="text-slate-400 block text-[10px] font-mono mt-0.5">
                          {user.uid}
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-400 px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase">
                          {user.role}
                        </div>
                        <button
                          onClick={() => handleOpenEditModal(user.uid, user.rawData)}
                          disabled={isRunning}
                          className="bg-slate-500 hover:bg-slate-600 active:scale-95 text-white p-1 rounded-md transition-all shadow-sm"
                          title="Edit Data Pengguna"
                        >
                          <EditIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleAutoFixRefs(user.uid)}
                          disabled={isRunning}
                          className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white p-1 rounded-md transition-all shadow-sm"
                          title="Auto-Fix Role & Reference ID"
                        >
                          <RefreshCwIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats?.missingRefsList && stats.missingRefsList.length > 0 && (
              <div className="mt-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 rounded-xl p-4">
                <h4 className="text-[11px] font-bold uppercase text-sky-600 mb-2 flex items-center gap-2">
                  <AlertTriangleIcon className="w-4 h-4" /> Daftar Pengguna dengan Missing Reference
                  ID
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {stats.missingRefsList.map((user: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-sky-100 dark:border-sky-900/30 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {user.name}
                        </span>
                        <span className="text-slate-400 block text-[10px] font-mono mt-0.5">
                          {user.uid}
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-400 px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase">
                          {user.role}
                        </div>
                        <button
                          onClick={() => handleOpenEditModal(user.uid, user.rawData)}
                          disabled={isRunning}
                          className="bg-slate-500 hover:bg-slate-600 active:scale-95 text-white p-1 rounded-md transition-all shadow-sm"
                          title="Edit Data Pengguna"
                        >
                          <EditIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleAutoFixRefs(user.uid)}
                          disabled={isRunning}
                          className="bg-sky-500 hover:bg-sky-600 active:scale-95 text-white p-1 rounded-md transition-all shadow-sm"
                          title="Auto-Fix Reference ID"
                        >
                          <RefreshCwIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats?.fixedUsersLog && stats.fixedUsersLog.length > 0 && (
              <div className="mt-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4">
                <h4 className="text-[11px] font-bold uppercase text-emerald-600 mb-2 flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" /> Log Perubahan Auto-Fix (Berhasil)
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {stats.fixedUsersLog.map((user: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {user.name}
                        </span>
                        <strong className="text-emerald-500 block text-[10px] font-mono mt-0.5">
                          ID: {user.refId}
                        </strong>
                      </div>
                      <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase">
                        {user.oldRole} ➔ {user.newRole}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Migration */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all">
        <button
          onClick={() => toggleAccordion('preview')}
          className="w-full flex items-center justify-between mb-0"
        >
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
            <ClipboardListIcon className="w-4 h-4 text-sky-500" /> Preview Migration
          </h3>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${openAccordion === 'preview' ? 'rotate-180' : ''}`}
          />
        </button>

        {openAccordion === 'preview' && (
          <div className="pt-6 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-xs font-bold text-slate-500 mb-4">
              Melihat simulasi transformasi schema terhadap 1 sampel dokumen.
            </p>
            <button
              onClick={handlePreview}
              disabled={isRunning}
              className={`bg-sky-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sky-600'}`}
            >
              {isRunning ? 'Generating...' : 'Generate Preview'}
            </button>

            {previewSelectedDoc && (
              <div className="mt-5 space-y-4">
                {(previewDocOutput?.referenceId === null ||
                  previewDocOutput?.accountType === 'unknown') && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold p-4 rounded-xl border border-rose-200 flex items-center gap-2">
                    <AlertTriangleIcon className="w-4 h-4 shrink-0" />
                    <span>
                      Warning preview:{' '}
                      {previewDocOutput?.referenceId === null
                        ? 'referenceId tidak ter-mapping (null)'
                        : ''}{' '}
                      {previewDocOutput?.accountType === 'unknown'
                        ? 'accountType tidak dikenali'
                        : ''}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-auto">
                    <p className="text-[10px] font-bold tracking-wide uppercase text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                      BEFORE (Old Schema)
                    </p>
                    <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(previewSelectedDoc)}
                    </pre>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 overflow-auto">
                    <p className="text-[10px] font-bold tracking-wide uppercase text-indigo-500 mb-3 border-b border-indigo-200 dark:border-indigo-800 pb-2">
                      AFTER (New Schema)
                    </p>
                    <pre className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap">
                      {JSON.stringify(previewDocOutput)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rollback */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all">
        <button
          onClick={() => toggleAccordion('rollback')}
          className="w-full flex items-center justify-between mb-0"
        >
          <h3 className="text-[10px] font-bold text-rose-400 dark:text-rose-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <RefreshCwIcon className="w-4 h-4 text-rose-500" /> Rollback Migration
          </h3>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${openAccordion === 'rollback' ? 'rotate-180' : ''}`}
          />
        </button>

        {openAccordion === 'rollback' && (
          <div className="pt-6 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-xs font-bold text-slate-500 mb-4">
              Kembalikan data ke kondisi sebelum migrasi berdasarkan Migration ID (ditemukan di log
              audit).
            </p>

            <div className="flex flex-col gap-3">
              {!confirmRollback ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <select
                      value={rollbackId}
                      onChange={(e) => setRollbackId(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none cursor-pointer"
                    >
                      <option value="">-- Pilih ID Migrasi --</option>
                      {availableMigrations.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.type ? `[${m.type.toUpperCase()}] ` : ''}
                          {m.id} - {m.processed || 0} docs (
                          {m.createdAt?.toDate
                            ? m.createdAt.toDate().toLocaleString('id-ID')
                            : 'N/A'}
                          )
                        </option>
                      ))}
                      {rollbackId && !availableMigrations.find((m) => m.id === rollbackId) && (
                        <option value={rollbackId}>{rollbackId} (Manual ID)</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => {
                      if (!rollbackId) {
                        toast.error('Pilih Migration ID', { id: 'rollback-msg' });
                        return;
                      }
                      setConfirmRollback(true);
                    }}
                    disabled={isRunning || !rollbackId}
                    className={`bg-rose-500 text-white px-6 py-3 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-all shadow-md ${isRunning || !rollbackId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-600 active:scale-95'}`}
                  >
                    {isRunning ? 'Processing...' : 'Run Rollback'}
                  </button>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-3">
                  <p className="text-sm font-bold text-rose-700">
                    <AlertTriangleIcon className="w-4 h-4 inline mr-1" /> Konfirmasi Rollback
                  </p>
                  <p className="text-xs font-semibold text-rose-600">
                    Apakah Anda yakin ingin melakukan rollback untuk ID: {rollbackId}?
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleRollback}
                      className="bg-rose-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-sm hover:bg-rose-700 transition"
                    >
                      Ya, Lanjutkan
                    </button>
                    <button
                      onClick={() => setConfirmRollback(false)}
                      className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-[10px] font-bold tracking-wide uppercase hover:bg-slate-300 transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Migration Approval Modal */}
      {migrationApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <DatabaseIcon className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {migrationApproval.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {migrationApproval.description}
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
              <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-3">
                Statistik Data
              </h4>
              {migrationApproval.dataSummary}

              <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 flex gap-3 text-xs font-medium">
                <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  Proses ini akan mengubah data pada database secara langsung melalui operasi Write
                  Batch. Tindakan ini tidak dapat dibatalkan, namun sistem akan membuat backup
                  otomatis.
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 flex gap-3 justify-end bg-white dark:bg-slate-800">
              <button
                onClick={() => setMigrationApproval(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  migrationApproval.execute();
                  setMigrationApproval(null);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
              >
                Konfirmasi & Eksekusi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
