/**
 * @license
 * e-Mam System - User Management Component
 * LAYER: UI (Vertical Slice Architecture Compliant)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers } from '../hooks/useUsers';
import {
  UsersIcon,
  RefreshCwIcon,
  Search,
  UserPlusIcon,
  ShieldCheckIcon,
  DatabaseIcon,
  ArrowLeftIcon,
  Pencil,
  X,
  User,
  Check,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { AccountType, UserRole } from '@/types';
import type { UserData, Student, Teacher} from '@/types';
import { repairUserReferenceIds } from '@/services/userService';
import { PermissionChecker } from '@/services/PermissionChecker';
import { ShieldAlertIcon, WrenchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/stores/userStore';

interface UserManagementProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onBack, onOpenSidebar }) => {
  const {
    users,
    studentsCache,
    teachersCache,
    isLoading,
    isSyncing,
    isDomainLoading,
    tenantId,
    refresh,
    loadCaches,
    migrateUser,
    createUser,
    updateUser,
    deleteUser,
  } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRepairing, setIsRepairing] = useState(false);

  const handleRepairReferences = async () => {
    setIsRepairing(true);
    try {
      const result = await repairUserReferenceIds();
      if (result.crossTenantViolations > 0) {
        toast.warning(
          `Selesai memverifikasi ${result.total} user. Disinkronkan ${result.fixed} referenceId dan mendeteksi/memutus ${result.crossTenantViolations} pelanggaran batas tenant!`
        );
      } else {
        toast.success(
          `Berhasil memeriksa ${result.total} user. ${result.fixed} referenceId disinkronkan ke ID master resmi.`
        );
      }
      refresh();
    } catch (err: any) {
      toast.error('Gagal memulihkan referenceId: ' + err.message);
    } finally {
      setIsRepairing(false);
    }
  };

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Migration Wizard State
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [migrationStep, setMigrationStep] = useState(1);
  const [migrationTargetType, setMigrationTargetType] = useState<any>('student');
  const [migrationSelectedRefId, setMigrationSelectedRefId] = useState('');
  const [migrationSelectedRoles, setMigrationSelectedRoles] = useState<UserRole[]>([]);

  // Form Fields
  const [formUid, setFormUid] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAccountType, setFormAccountType] = useState<AccountType>(AccountType.MADRASAH);
  const [formReferenceId, setFormReferenceId] = useState('');
  const [formRoles, setFormRoles] = useState<UserRole[]>([UserRole.GURU]);
  const [formStatus, setFormStatus] = useState('active');

  useEffect(() => {
    if (tenantId) {
      loadCaches();
    }
  }, [tenantId, loadCaches]);

  // Statistics calculation
  const stats = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc.total++;
        const status = user.status;
        if (status === 'active') acc.active++;
        else if (status === 'pending' || (status && status.toLowerCase().includes('pending')))
          acc.pending++;
        else acc.nonActive++;

        const type = user.accountType;
        if (type === AccountType.DEVELOPER) acc.developers++;
        else if (type === AccountType.MADRASAH) acc.madrasah++;
        else if (type === AccountType.KANWIL) acc.kanwil++;
        else if (type === AccountType.KEMENAG) acc.kemenag++;

        // Categorization based on primary role for UI display
        const primaryRole = user.role;
        if (primaryRole === UserRole.SISWA) acc.students++;
        else if (primaryRole === UserRole.GURU || primaryRole === UserRole.KEPALA_MADRASAH) acc.teachers++;
        else if (primaryRole === UserRole.STAF || primaryRole === UserRole.KEPALA_TU || primaryRole === UserRole.ADMIN) acc.staff++;
        else if (primaryRole === UserRole.ORANG_TUA) acc.parents++;
        else acc.others++;

        return acc;
      },
      { total: 0, active: 0, nonActive: 0, pending: 0, students: 0, teachers: 0, staff: 0, parents: 0, others: 0, developers: 0, madrasah: 0, kanwil: 0, kemenag: 0 },
    );
  }, [users]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset Add Form fields
  const resetForm = () => {
    setFormUid('');
    setFormDisplayName('');
    setFormEmail('');
    setFormAccountType(AccountType.MADRASAH);
    setFormReferenceId('');
    setFormRoles([UserRole.SISWA]);
    setFormStatus('active');
  };

  // Filter & Search users
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesBasic =
      (u.displayName || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.accountType || '').toLowerCase().includes(term) ||
      (u.uid || '').toLowerCase().includes(term);

    const matchesRoles = (u.roles || []).some((r: any) => r.toLowerCase().includes(term));
    return matchesBasic || matchesRoles;
  });

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  // Stat Card UI
  const StatCard = ({
    title,
    value,
    className = '',
  }: {
    title: string;
    value: number;
    className?: string;
  }) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{title}</p>
      <p className={`text-xl font-bold mt-1 ${className}`}>{value}</p>
    </div>
  );

  // Handling Modals
  const handleOpenAdd = () => {
    resetForm();
    setFormUid(`USER_${Date.now()}`); // Deterministic fallback auth UID
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setSelectedUser(user);
    setFormUid(user.uid);
    setFormDisplayName(user.displayName || '');
    setFormEmail(user.email || '');
    setFormAccountType((user.accountType as any) || AccountType.MADRASAH);
    setFormReferenceId(user.assignment?.positionId || '');
    setFormRoles((user.roles as UserRole[]) || (user.role ? [user.role as UserRole] : []));
    setFormStatus(user.status || 'active');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  // Toggle roles in the RBAC Matrix
  const toggleRoleSelection = (role: UserRole, currentRoles: UserRole[], setter: React.Dispatch<React.SetStateAction<UserRole[]>>) => {
    if (currentRoles.includes(role)) {
      setter(currentRoles.filter((r) => r !== role));
    } else {
      setter([...currentRoles, role]);
    }
  };

  // Helper to validate referenceId consistency
  const validateReferenceId = (type: string, refId: string): boolean => {
    if (type === 'other') return true; // Optional for other
    if (!refId) {
      toast.error(`ID Referensi wajib diisi untuk tipe akun ${type}`);
      return false;
    }

    if (type === 'student') {
      const exists = studentsCache.some((s) => s.idUnik === refId || s.id === refId);
      if (!exists) {
        toast.error(`Siswa dengan ID "${refId}" tidak ditemukan di database lokal.`);
        return false;
      }
    } else if (type === 'teacher') {
      const exists = teachersCache.some((t) => t.teachersId === refId || t.id === refId);
      if (!exists) {
        toast.error(`Guru dengan ID "${refId}" tidak ditemukan di database lokal.`);
        return false;
      }
    }
    return true;
  };

  // Submit User Creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDisplayName.trim() || !formEmail.trim()) {
      toast.error('Nama Lengkap dan Email harus diisi');
      return;
    }

    // Validate organizational constraints
    // For now, we only have detailed validation for Madrasah
    if (formAccountType === AccountType.MADRASAH && !validateReferenceId(formAccountType, formReferenceId)) {
      return;
    }

    const newUser: UserData = {
      tenantId,
      referenceId: formReferenceId || formUid,
      isClaimed: false,
      isSso: false,
      approvalStatus: 'approved',
      uid: formUid,
      id: formUid,
      permissions: [],
      syncStatus: "pending",
      displayName: formDisplayName,
      email: formEmail,
      accountType: formAccountType,
      assignment: {
        positionId: formReferenceId || undefined,
        scope: { level: 'tenant', ids: [tenantId] }
      },
      roles: formRoles,
      role: formRoles[0] || UserRole.GURU, // Legacy fallback
      status: formStatus as any,
      version: 1,
      schemaVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false
    };

    try {
      await createUser(newUser);
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit User Update (Basic fields + roles)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formDisplayName.trim() || !formEmail.trim()) {
      toast.error('Nama Lengkap dan Email harus diisi');
      return;
    }

    if (formAccountType === AccountType.MADRASAH && !validateReferenceId(formAccountType, formReferenceId)) {
      return;
    }

    const updatedUser: UserData = {
      ...selectedUser,
      displayName: formDisplayName,
      email: formEmail,
      accountType: formAccountType,
      assignment: selectedUser.assignment ? {
        ...selectedUser.assignment,
        positionId: formReferenceId || undefined,
      } : {
        positionId: formReferenceId || undefined,
      },
      roles: formRoles,
      role: formRoles[0] || UserRole.GURU, // Legacy fallback
      status: formStatus as any, // Cast because formStatus is string
      updatedAt: Date.now(),
    };

    try {
      await updateUser(updatedUser);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit User Deletion
  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser.uid);
      setIsDeleteConfirmOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  // --- MIGRATION WORKFLOW / WIZARD ---
  const handleOpenMigration = () => {
    if (!selectedUser) return;
    setMigrationStep(1);
    setMigrationTargetType((selectedUser.accountType as any) || 'student');
    setMigrationSelectedRefId(selectedUser.assignment?.positionId || '');
    // Preset recommended role based on target
    const currentRoles = selectedUser.roles || [];
    setMigrationSelectedRoles(currentRoles as UserRole[]);
    setIsMigrationOpen(true);
  };

  const handleNextMigrationStep = () => {
    if (migrationStep === 1) {
      // Automatic role alignments recommendation
      if (migrationTargetType === 'student') {
        setMigrationSelectedRoles([UserRole.SISWA]);
      } else if (migrationTargetType === 'teacher') {
        setMigrationSelectedRoles([UserRole.GURU]);
      } else if (migrationTargetType === 'staff') {
        setMigrationSelectedRoles([UserRole.STAF]);
      } else if (migrationTargetType === 'parent') {
        setMigrationSelectedRoles([UserRole.ORANG_TUA]);
      }
      setMigrationStep(2);
    } else if (migrationStep === 2) {
      // Validate Selected Reference ID compatibility
      if (!validateReferenceId(migrationTargetType, migrationSelectedRefId)) {
        return;
      }
      setMigrationStep(3);
    } else if (migrationStep === 3) {
      setMigrationStep(4);
    }
  };

  const handleRunMigration = async () => {
    if (!selectedUser) return;

    try {
      await migrateUser(
        selectedUser,
        migrationTargetType,
        migrationSelectedRefId,
        migrationSelectedRoles
      );

      // UI Notifications & modal reset
      toast.success('Migrasi Tipe Akun berhasil diselesaikan dan dicatat pada Audit Log!');
      setIsMigrationOpen(false);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (err: any) {
      toast.error('Gagal menjalankan migrasi akun: ' + err.message);
    }
  };

  // Render RBAC Matrix UI
  const renderRBACMatrix = (currentRoles: UserRole[], setter: React.Dispatch<React.SetStateAction<UserRole[]>>) => {
    const rolesList = [
      { role: UserRole.ADMIN, name: 'Admin', desc: 'Akses penuh administrasi madrasah' },
      { role: UserRole.KEPALA_MADRASAH, name: 'Kepala Madrasah', desc: 'Pemantauan akademik & otorisasi tingkat atas' },
      { role: UserRole.KEPALA_TU, name: 'Kepala Tata Usaha', desc: 'Pengendali operasional ketatausahaan' },
      { role: UserRole.WAKAMAD, name: 'Wakamad', desc: 'Asisten kepala urusan kurikulum/kesiswaan' },
      { role: UserRole.GURU, name: 'Guru', desc: 'Pengajar utama, pengelola jurnal & presensi kelas' },
      { role: UserRole.WALI_KELAS, name: 'Wali Kelas', desc: 'Pembimbing rombel khusus' },
      { role: UserRole.STAF, name: 'Staf', desc: 'Petugas kebersihan, administrasi harian, perpustakaan' },
      { role: UserRole.SISWA, name: 'Siswa', desc: 'Penerima modul pengajaran, pelanggaran & prestasi' },
      { role: UserRole.ORANG_TUA, name: 'Orang Tua', desc: 'Pemantau progress siswa secara real-time' },
    ];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-bold uppercase tracking-wide">
          <ShieldCheckIcon className="w-4 h-4" />
          <span>Matriks Hak Akses (RBAC Matrix)</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          * Catatan: Array `roles[]` hanya mendefinisikan izin fungsional peranti dan **tidak menentukan perutean data**. Perutean data sepenuhnya dialokasikan melalui model tingkat akun (`accountType`).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
          {rolesList.map((item) => {
            const isChecked = currentRoles.includes(item.role);
            return (
              <label
                key={item.role}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition-all select-none ${
                  isChecked
                    ? 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleRoleSelection(item.role, currentRoles, setter)}
                  className="mt-0.5 accent-indigo-500 rounded"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                    {item.name}
                  </span>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                    {item.desc}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-12">
      {/* Top sticky bar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              id="btn-back-user-db"
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeftIcon className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white lowercase  flex items-center gap-2">
                <UsersIcon className="w-6 h-6 text-indigo-500" />
                Database Pengguna
              </h1>
              <p className="text-[10px] text-slate-500 font-medium lowercase">
                Manajemen hak akses & sinkronisasi lokal (Offline-First)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRepairReferences}
              id="btn-repair-reference-ids"
              disabled={isRepairing}
              title="Periksa dan selaraskan referenceId ke ID Master serta putus pelanggaran cross-tenant"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all shadow-sm disabled:opacity-50"
            >
              <WrenchIcon className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
              {isRepairing ? 'Memeriksa...' : 'Audit Ref & Tenant'}
            </button>
            <button
              onClick={() => refresh()}
              id="btn-sync-cloud-db"
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCwIcon className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Menyingkronkan...' : 'Sinkron Cloud'}
            </button>
            {PermissionChecker.can('user.create') && (
              <button
                onClick={handleOpenAdd}
                id="btn-add-user-db"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
              >
                <UserPlusIcon className="w-3.5 h-3.5" />
                Tambah User
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Total User" value={stats.total} className="text-indigo-500" />
          <StatCard title="Madrasah" value={stats.madrasah} />
          <StatCard title="Kemenag" value={stats.kemenag} />
          <StatCard title="Kanwil" value={stats.kanwil} />
          <StatCard title="Developer" value={stats.developers} className="text-emerald-500" />
        </div>

        {/* Filter Toolbar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, tipe, referensi, atau peran..."
            id="input-search-user"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>

        {/* User Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    UID / Email
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Nama
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Level Akun (AccountType)
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Posisi / Ref (Assignment)
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Izin RBAC (roles)
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <RefreshCwIcon className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">
                        Memuat data dari database lokal (Dexie)...
                      </p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500 text-sm italic"
                    >
                      Tidak ada data pengguna ditemukan
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => {
                    const primaryRole = user.role;
                    const positionId = user.assignment?.positionId;
                    const hasReference = !!positionId;
                    const isOrphan = (primaryRole === UserRole.SISWA || primaryRole === UserRole.GURU) && !hasReference;

                    return (
                      <tr
                        key={`${user.uid || 'usr'}-${index}`}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-mono text-slate-400 font-bold">{user.uid}</p>
                            <p className="text-xs text-slate-500 font-medium">{user.email || 'no-email'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {user.displayName || 'Unnamed User'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            user.accountType === AccountType.DEVELOPER
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                              : user.accountType === AccountType.KANWIL
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : user.accountType === AccountType.KEMENAG
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                          }`}>
                            {user.accountType || 'none'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {positionId ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] font-bold text-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10 px-1.5 py-0.5 rounded">
                                {positionId}
                              </span>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                          ) : isOrphan ? (
                            <div className="flex items-center gap-1 text-rose-500">
                              <span className="text-[10px] font-bold uppercase">Orphan (Tanpa Ref)</span>
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(user.roles || []).map((role, rIdx) => (
                              <span key={`${role}-${rIdx}`} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-mono text-slate-600 dark:text-slate-300">
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-bold"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          <div className="flex justify-between items-center p-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-bold">
              Menampilkan {paginatedUsers.length} dari {filteredUsers.length} user
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 text-xs font-bold text-slate-900 dark:text-white">
                Hal {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>

        {/* Footer Audit Banner */}
        <div className="p-4 bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 text-center flex items-center justify-center gap-2">
          <DatabaseIcon className="w-4 h-4 text-amber-500" />
          <p className="text-[10px] text-amber-700 dark:text-amber-400/70 font-bold">
            Standar Keamanan EAOM: Setiap penambahan, penghapusan, dan migrasi tipe akun diaudit secara ketat di database lokal & disinkronkan ke Cloud.
          </p>
        </div>
      </main>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/* ADD USER MODAL */}
        {isAddModalOpen && (
          <div key="add-user-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="add-user-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              key="add-user-modal"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-500">
                  <UserPlusIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Tambah Pengguna Baru
                  </h2>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                    Modul Enforcing EAOM Aktif
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Auth UID (Deterministic)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formUid}
                      onChange={(e) => setFormUid(e.target.value)}
                      placeholder="UID_XXXXXXXXXX"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={formDisplayName}
                      onChange={(e) => setFormDisplayName(e.target.value)}
                      placeholder="Contoh: Muhammad Ibrahim"
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Email Utama
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="contoh@example.com"
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Identity Model Selection */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Level Akun (accountType)
                    </label>
                    <select
                      value={formAccountType}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        setFormAccountType(newType);
                        setFormReferenceId('');
                      }}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <option value={AccountType.MADRASAH}>Madrasah</option>
                      <option value={AccountType.KEMENAG}>Kemenag</option>
                      <option value={AccountType.KANWIL}>Kanwil</option>
                      <option value={AccountType.DEVELOPER}>Developer</option>
                    </select>
                  </div>

                  {/* DYNAMIC DOMAIN FIELDS (positionId) based on selected accountType */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Posisi / ID Referensi
                    </label>
                    {formAccountType === AccountType.MADRASAH ? (
                      <select
                        value={formReferenceId}
                        onChange={(e) => setFormReferenceId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      >
                        <option value="">Pilih Referensi (Optional)...</option>
                        <optgroup label="Siswa">
                          {studentsCache.map((s, idx) => (
                            <option key={`form-student-${s.idUnik || s.id || 'std'}-${idx}`} value={s.idUnik}>
                              {s.namaLengkap} ({s.idUnik})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Guru">
                          {teachersCache.map((t, idx) => (
                            <option key={`teacher-opt-${t.teachersId || t.id || 'tch'}-${idx}`} value={t.teachersId}>
                              {t.namaLengkap} ({t.teachersId})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formReferenceId}
                        onChange={(e) => setFormReferenceId(e.target.value)}
                        placeholder="Masukkan ID Posisi"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    )}
                  </div>
                </div>

                {/* RBAC MATRIX UI */}
                {renderRBACMatrix(formRoles, setFormRoles)}

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Simpan Akun
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT USER MODAL */}
        {isEditModalOpen && selectedUser && (
          <div key="edit-user-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="edit-user-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              }}
            />
            <motion.div
              key="edit-user-modal"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-amber-500">
                  <Pencil className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Edit Profil & Peran Pengguna
                  </h2>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                    Modul Enforcing EAOM Aktif
                  </p>
                </div>
              </div>

              {/* Warning Banner next to Migration action */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between mb-4">
                <div className="space-y-0.5 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Model Akun Saat Ini (Identity Model)
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Tipe: <span className="uppercase text-indigo-500">{selectedUser.accountType || 'none'}</span> | Posisi: <span className="font-mono text-emerald-500">{selectedUser.assignment?.positionId || 'none'}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenMigration}
                  className="px-3 py-1.5 bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/10"
                >
                  Migrasikan Akun
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Auth UID (Read Only)
                    </label>
                    <input
                      type="text"
                      value={formUid}
                      disabled
                      className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Status Akun
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                    >
                      <option value="active">Aktif (active)</option>
                      <option value="pending">Tertunda (pending)</option>
                      <option value="inactive">Nonaktif (inactive)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={formDisplayName}
                      onChange={(e) => setFormDisplayName(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Email Utama
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* RBAC MATRIX UI */}
                {renderRBACMatrix(formRoles, setFormRoles)}

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ACCOUNT MIGRATION WIZARD (STRICTLY REQUIRED FOR accountType CHANGE) */}
        {isMigrationOpen && selectedUser && (
          <div key="migration-modal-wrapper" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              key="migration-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsMigrationOpen(false)}
            />
            <motion.div
              key="migration-modal"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative z-10 text-left max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsMigrationOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-500">
                  <RefreshCwIcon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Wizard Migrasi Akun (Step {migrationStep}/4)
                  </h2>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                    Enterprise Data Transition Engine
                  </p>
                </div>
              </div>

              {/* STEP 1: SELECT NEW USERTYPE */}
              {migrationStep === 1 && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-2xl text-xs text-indigo-700 dark:text-indigo-400">
                    Langkah ini mengawali migrasi tipe domain. Silakan pilih tipe baru yang akan mendefinisikan perutean utama akun ini di sistem.
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Level Akun Target (accountType)
                    </label>
                    <select
                      value={migrationTargetType}
                      onChange={(e) => setMigrationTargetType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                    >
                      <option value="student">Siswa (student)</option>
                      <option value="teacher">Guru (teacher)</option>
                      <option value="staff">Staf (staff)</option>
                      <option value="parent">Wali (parent)</option>
                      <option value="other">Lainnya (other)</option>
                    </select>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleNextMigrationStep}
                      className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-600 transition-all shadow-lg"
                    >
                      Lanjutkan Ke Pemilihan Referensi
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT DOMAIN REFERENCE FOR CONSISTENCY */}
              {migrationStep === 2 && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl text-xs text-emerald-700 dark:text-emerald-400">
                    Sistem mendeteksi target tipe baru adalah <span className="uppercase font-bold">{migrationTargetType}</span>. Pilih entitas domain asli untuk memetakan kunci asing `referenceId`.
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      ID Referensi Domain Kontrak
                    </label>

                    {migrationTargetType === 'student' ? (
                      <select
                        value={migrationSelectedRefId}
                        onChange={(e) => setMigrationSelectedRefId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      >
                        <option value="">Pilih Siswa...</option>
                        {studentsCache.map((s, idx) => (
                          <option key={`mig-student-${s.idUnik || s.id || 'std'}-${idx}`} value={s.idUnik}>
                            {s.namaLengkap} ({s.idUnik})
                          </option>
                        ))}
                      </select>
                    ) : migrationTargetType === 'teacher' ? (
                      <select
                        value={migrationSelectedRefId}
                        onChange={(e) => setMigrationSelectedRefId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      >
                        <option value="">Pilih Guru...</option>
                        {teachersCache.map((t, idx) => (
                          <option key={`mig-teacher-${t.teachersId || t.id || 'tch'}-${idx}`} value={t.teachersId}>
                            {t.namaLengkap} ({t.teachersId})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={migrationSelectedRefId}
                        onChange={(e) => setMigrationSelectedRefId(e.target.value)}
                        placeholder="Masukkan ID Referensi target secara manual"
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                      />
                    )}
                  </div>

                  <div className="pt-4 flex gap-2">
                    <button
                      onClick={() => setMigrationStep(1)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleNextMigrationStep}
                      className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-bold"
                    >
                      Ulas Penyelarasan Peran
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ROLE ALIGNMENT */}
              {migrationStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl text-xs text-amber-700 dark:text-amber-400">
                    Sistem mendeteksi migrasi tipe memerlukan penyelarasan hak akses RBAC baru. Sesuaikan jika diperlukan.
                  </div>

                  {renderRBACMatrix(migrationSelectedRoles, setMigrationSelectedRoles)}

                  <div className="pt-4 flex gap-2">
                    <button
                      onClick={() => setMigrationStep(2)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleNextMigrationStep}
                      className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-bold"
                    >
                      Ulas Konfirmasi
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: FINAL CONFIRMATION & AUDIT LOG GENERATION */}
              {migrationStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                      Detail Ringkasan Migrasi
                    </h4>
                    <div className="grid grid-cols-2 gap-y-1.5 text-slate-600 dark:text-slate-400 font-medium">
                      <div>Nama Akun:</div>
                      <div className="font-bold text-slate-900 dark:text-white">{selectedUser.displayName}</div>
                      <div>Email Akun:</div>
                      <div className="font-bold text-slate-900 dark:text-white font-mono">{selectedUser.email}</div>
                      <div>Tipe Sebelum:</div>
                      <div className="font-bold text-rose-500 uppercase">{selectedUser.accountType || 'none'}</div>
                      <div>Tipe Sesudah:</div>
                      <div className="font-bold text-emerald-500 uppercase">{migrationTargetType}</div>
                      <div>Kunci Referensi:</div>
                      <div className="font-bold text-indigo-500 font-mono">{migrationSelectedRefId || 'none'}</div>
                      <div>Peran Baru:</div>
                      <div className="font-bold text-indigo-500 font-mono">{migrationSelectedRoles.join(', ')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-rose-500 p-2 bg-rose-50/50 rounded-xl border border-rose-100">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <p className="text-[10px] font-semibold leading-relaxed">
                      Aksi migrasi ini akan langsung merubah database lokal (Dexie), dicatat dalam sistem Audit Log lokal, lalu disinkronkan secara asinkron ke server Firestore.
                    </p>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <button
                      onClick={() => setMigrationStep(3)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleRunMigration}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20"
                    >
                      Jalankan Migrasi
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {isDeleteConfirmOpen && selectedUser && (
          <div key="delete-user-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setSelectedUser(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative z-10 text-center"
            >
              <div className="mx-auto w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Hapus Pengguna?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedUser.displayName}
                </span>
                ? Aksi ini akan segera menghapus data di Dexie lokal dan disinkronkan ke Cloud.
              </p>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

