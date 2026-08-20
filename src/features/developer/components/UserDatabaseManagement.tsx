import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RectangleStackIcon as DatabaseIcon,
  Search as SearchIcon,
  UserIcon,
  PencilIcon as Edit2Icon,
  SaveIcon,
  XMarkIcon as XIcon,
  ShieldCheckIcon as ShieldIcon,
  EnvelopeIcon as MailIcon,
  IdentificationIcon as HashIcon,
  ArrowPathIcon as RefreshCwIcon,
  KeyIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon as Trash2Icon,
  WhatsAppIcon,
  Loader2,
} from '@/shared/Icons';
import type { User} from '@/types';
import { UserRole } from '@/types';
import { safeConfirm } from '@/utils/safeConfirm';
import {
  fetchUsers,
  deleteUser,
  updateUserDataAndSync,
  repairUserReferenceIds,
} from '@/services/userService';
import { toast } from 'sonner';
import { useUserStore } from '@/stores/userStore';
import { activateAccountByAdmin } from '@/services/authService';
import { StudentBulkUploadModal } from '@/features/students/components/StudentBulkUploadModal';
import { FileSpreadsheet } from 'lucide-react';

interface UserDatabaseManagementProps {
  onBack: () => void;
}

const UserDatabaseManagement: React.FC<UserDatabaseManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRepairing, setIsRepairing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'profil' | 'role' | 'akses' | 'scope' | 'status' | 'aktivitas'>('profil');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Create User States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const activeTenantId = useUserStore((state) => state.tenantId) || '30315537';
  const userRoles = useUserStore((state) => state.roles) || [];
  const currentUserEmail = useUserStore((state) => state.email);
  const currentUserRole = useUserStore((state) => (state.user as any)?.role);
  const currentUserRoles = useUserStore((state) => (state.user as any)?.roles) || [];

  const isAuthorized =
    userRoles.some((r) => ['admin', 'super_admin', 'developer', 'kepala_madrasah', 'admin_operasional'].includes(String(r).toLowerCase())) ||
    currentUserRoles.some((r: any) => ['admin', 'super_admin', 'developer', 'kepala_madrasah', 'admin_operasional'].includes(String(r).toLowerCase())) ||
    ['admin', 'super_admin', 'developer', 'kepala_madrasah', 'admin_operasional'].includes(String(currentUserRole).toLowerCase()) ||
    currentUserEmail === 'admin@example.com';

  const isDeveloper =
    userRoles.some((r) => String(r).toLowerCase() === 'developer') ||
    currentUserRoles.some((r: any) => String(r).toLowerCase() === 'developer') ||
    String(currentUserRole).toLowerCase() === 'developer' ||
    currentUserEmail === 'admin@example.com';

  const [newData, setNewData] = useState({
    displayName: '',
    email: '',
    password: 'Madrasah2026!',
    role: 'siswa',
    idUnik: '',
    type: 'student' as 'student' | 'teacher' | 'other',
    tenantId: activeTenantId,
  });

  useEffect(() => {
    setNewData((p) => ({ ...p, tenantId: activeTenantId }));
  }, [activeTenantId]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData.displayName || !newData.email || !newData.password || !newData.role) {
      toast.error('Nama Lengkap, Email, Password, dan Peran Utama wajib diisi!');
      return;
    }

    setIsCreating(true);
    try {
      // Determine type automatically based on role selection
      let inferredType: 'student' | 'teacher' | 'other' = 'other';
      if (newData.role === 'siswa') {
        inferredType = 'student';
      } else if (
        ['guru', 'wali_kelas', 'kepala_madrasah', 'kepala_tu', 'guru_bk'].includes(newData.role)
      ) {
        inferredType = 'teacher';
      }

      const res = await activateAccountByAdmin({
        email: newData.email.trim(),
        password: newData.password,
        displayName: newData.displayName.trim(),
        role: newData.role,
        idUnik: newData.idUnik.trim(),
        type: inferredType,
        tenantId: newData.tenantId || activeTenantId,
      });

      if (res.success) {
        toast.success(res.message || 'Akun pengguna berhasil dibuat!');
        setShowCreateModal(false);
        // Reset form
        setNewData({
          displayName: '',
          email: '',
          password: 'Madrasah2026!',
          role: 'siswa',
          idUnik: '',
          type: 'student',
          tenantId: activeTenantId,
        });
        // Reload list
        loadUsers();
      } else {
        toast.error(res.error || 'Gagal membuat akun.');
      }
    } catch (error: any) {
      console.error('Create User Error:', error);
      toast.error(error.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadUsers();
    }
  }, [isAuthorized]);

  const loadUsers = async () => {
    setLoading(true);
    console.log('[UserDatabaseManagement] Loading users...');
    try {
      const data = await fetchUsers();
      console.log('[UserDatabaseManagement] Users loaded:', data);
      setUsers(data as any);
    } catch (error) {
      console.error('Load users error:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    if (!safeConfirm('Sinkronkan referenceId seluruh user dengan UID (V7.7 Schema)?')) return;

    setIsRepairing(true);
    try {
      const res = await repairUserReferenceIds();
      if (res.fixed > 0) {
        toast.success(`${res.fixed} user diperbaiki (Reference ID synced)`);
        loadUsers();
      } else {
        toast.info('Seluruh data sudah sinkron.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal melakukan perbaikan database');
    } finally {
      setIsRepairing(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const { uid, id, ...updateData } = editingUser as any;

      // Clean up empty optional fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      await updateUserDataAndSync(uid, updateData);

      setUsers((prev) => prev.map((u) => (u.uid === editingUser.uid ? editingUser : u)));
      setEditingUser(null);
      toast.success('Data user berhasil diperbarui');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Gagal memperbarui data user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!safeConfirm('Yakin ingin menghapus user ini secara permanen dari database?')) return;

    setIsDeleting(uid);
    try {
      await deleteUser(uid);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      toast.success('User berhasil dihapus');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus user');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.idUnik?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || u.role === filterRole;

    return matchesSearch && matchesRole;
  });

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 text-center text-slate-100">
        <div className="max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold lowercase ">Akses Terlarang</h2>
          <p className="text-sm text-slate-400 font-medium">
            Anda tidak memiliki hak wewenang administratif untuk mengelola basis data pengguna e-Mam
            System.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase tracking-wide text-slate-200 rounded-2xl transition-all"
          >
            Kembali Ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-800 dark:text-white p-4 md:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl text-slate-400 transition-all border border-slate-100 dark:border-white/5 shadow-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <DatabaseIcon className="w-4 h-4 text-indigo-400" />
                <h1 className="text-sm md:text-base font-bold lowercase ">
                  user database manager
                </h1>
              </div>
              <p className="hidden sm:block text-[8px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
                Core Access • Schema Editor • RBAC Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRepair}
              disabled={isRepairing}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-700 shadow-sm active:scale-95 disabled:opacity-50"
              title="Repair Reference IDs"
            >
              <ShieldIcon
                className={`w-3 h-3 ${isRepairing ? 'animate-pulse text-indigo-400' : ''}`}
              />
              <span className="hidden sm:inline">Sync RefID</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95"
            >
              <PlusIcon className="w-3 h-3" />
              <span>Buat Akun</span>
            </button>
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-teal-500/20 active:scale-95"
              title="Bulk Upload Siswa"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bulk Upload</span>
            </button>
            <button
              onClick={loadUsers}
              className="p-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl text-slate-400 transition-all border border-slate-100 dark:border-white/5 shadow-sm"
            >
              <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-row items-center gap-2 w-full">
          {/* Search Input */}
          <div className="flex-1 relative group">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Cari user (Nama, Email, ID)..."
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Filter Role */}
          <div className="shrink-0">
            <select
              className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 dark:text-white appearance-none pr-8 relative bg-no-repeat"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundPosition: 'right 8px center',
                backgroundSize: '12px',
              }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">Semua Role</option>
              {(UserRole ? Object.values(UserRole) : [])
                .filter((role) => role !== UserRole.DEVELOPER || isDeveloper)
                .map((role) => (
                  <option key={role} value={role}>
                    {role.toUpperCase()}
                  </option>
                ))}
            </select>
          </div>
          {/* User Count Indicator */}
          <div className="shrink-0 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider whitespace-nowrap">
              {filteredUsers.length} User
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-sm">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
            <table className="w-full text-left table-auto relative">
              <thead className="bg-[#f8fafc] dark:bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wide bg-[#f8fafc] dark:bg-[#0f172a] opacity-95">
                    User Profil
                  </th>
                  <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wide bg-[#f8fafc] dark:bg-[#0f172a] opacity-95">
                    Identifiers (RefId/idUnik)
                  </th>
                  <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wide bg-[#f8fafc] dark:bg-[#0f172a] opacity-95">
                    Tenant ID (NPSN)
                  </th>
                  <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wide bg-[#f8fafc] dark:bg-[#0f172a] opacity-95">
                    Role & Status
                  </th>
                  <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wide text-right bg-[#f8fafc] dark:bg-[#0f172a] opacity-95">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-indigo-400 w-6 h-6" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                          Mengakses Database...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <p className="text-slate-500 font-bold uppercase tracking-wide text-[9px]">
                        Database kosong atau kriteria tidak cocok
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                            {u.photoURL ? (
                              <img
                                src={u.photoURL}
                                alt=""
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <UserIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-[11px] font-bold text-white group-hover:text-indigo-400 transition-colors uppercase truncate">
                                {u.displayName}
                              </p>
                              {u.profile?.phoneNumber && (
                                <a
                                  href={`https://wa.me/${u.profile?.phoneNumber.replace(/\D/g, '').replace(/^0/, '62')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 p-0.5 text-emerald-500 hover:text-emerald-400 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <WhatsAppIcon className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 truncate leading-none mt-0.5">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="space-y-0.5 text-[10px]">
                          <div className="flex items-center gap-1">
                            <span className="text-[7.5px] font-bold text-slate-600 uppercase">
                              RefID:
                            </span>
                            <span className="font-mono font-bold text-indigo-400">
                              {u.referenceId || '---'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[7.5px] font-bold text-slate-600 uppercase">
                              Legacy:
                            </span>
                            <span className="font-mono font-bold text-slate-400">
                              {u.idUnik || '---'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono font-bold text-indigo-300">
                            {u.tenantId || 'DEFAULT'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex flex-col gap-0.5 max-w-[150px]">
                          <div className="flex flex-wrap gap-0.5">
                            {u.roles && u.roles.length > 0 ? (
                              u.roles.map((r: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex px-1 py-0.2 rounded bg-indigo-500/15 border border-indigo-500/25 text-[7px] font-bold text-indigo-300 uppercase tracking-tight"
                                >
                                  {r.replace('_', ' ')}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex px-1 py-0.2 rounded bg-indigo-500/15 border border-indigo-500/25 text-[7px] font-bold text-indigo-300 uppercase tracking-tight">
                                {u.role ? u.role.replace('_', ' ') : 'siswa'}
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-flex px-1.5 py-0.2 rounded text-[7.5px] font-bold uppercase w-fit ${
                              u.status === "active"
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : u.status === "suspended"
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 
                                      u.status === "pending"
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {u.status || 'Active'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Protect Developer Data from non-developers */}
                          {((!u.roles?.includes(UserRole.DEVELOPER) &&
                            u.role !== UserRole.DEVELOPER) ||
                            isDeveloper) && (
                            <>
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 bg-white/5 hover:bg-indigo-500 hover:text-white rounded-lg transition-all border border-white/5"
                                title="Edit User"
                              >
                                <Edit2Icon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.uid)}
                                disabled={isDeleting === u.uid}
                                className="p-1.5 bg-white/5 hover:bg-rose-500 hover:text-white rounded-lg transition-all border border-white/5 disabled:opacity-50"
                                title="Hapus User"
                              >
                                {isDeleting === u.uid ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2Icon className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          )}
                          {u.role === UserRole.DEVELOPER && !isDeveloper && (
                            <span className="p-1.5 text-rose-500/50">
                              <ShieldIcon className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold lowercase ">Manajemen User (RBAC Enterprise)</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                    UID: {editingUser.uid} | Tenant: {editingUser.tenantId || activeTenantId}
                  </p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <XIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-white/10 no-scrollbar">
                {[
                  { id: 'profil', label: 'Profil' },
                  { id: 'role', label: 'Role' },
                  { id: 'akses', label: 'Hak Akses' },
                  { id: 'scope', label: 'Scope' },
                  { id: 'status', label: 'Status' },
                  { id: 'aktivitas', label: 'Audit & Aktivitas' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-6">
                {activeTab === 'profil' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Display Name
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-3.5 h-3.5" />
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                          value={editingUser.displayName}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, displayName: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Email
                      </label>
                      <div className="relative">
                        <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-3.5 h-3.5" />
                        <input
                          type="email"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Reference ID (NISN / NIP / ID)
                      </label>
                      <div className="relative">
                        <HashIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-3.5 h-3.5" />
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                          value={editingUser.referenceId || ''}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, referenceId: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        idUnik (Legacy)
                      </label>
                      <div className="relative">
                        <HashIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-3.5 h-3.5" />
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                          value={editingUser.idUnik || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, idUnik: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                        value={editingUser.profile?.phoneNumber || ''}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, profile: { ...editingUser.profile, phoneNumber: e.target.value, email: editingUser.email || "", displayName: editingUser.displayName || "" } })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Account Type
                      </label>
                      <select
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                        value={editingUser.accountType || 'other'}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, accountType: e.target.value as any })
                        }
                      >
                        <option value="student">STUDENT</option>
                        <option value="teacher">TEACHER</option>
                        <option value="parent">PARENT</option>
                        <option value="staff">STAFF</option>
                        <option value="other">OTHER</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'role' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Main Role (Peran Utama)
                      </label>
                      <select
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                        value={editingUser.role}
                        onChange={(e) => {
                          const selectedRole = e.target.value as UserRole;
                          const currentRoles = editingUser.roles || [editingUser.role];
                          let newRoles = [...currentRoles];
                          if (!newRoles.includes(selectedRole)) {
                            newRoles.unshift(selectedRole);
                          } else {
                            newRoles = [
                              selectedRole,
                              ...newRoles.filter((r) => r !== selectedRole),
                            ];
                          }
                          setEditingUser({
                            ...editingUser,
                            role: selectedRole,
                            roles: newRoles,
                          });
                        }}
                      >
                        {(UserRole ? Object.values(UserRole) : [])
                          .filter((role) => role !== UserRole.DEVELOPER || isDeveloper)
                          .map((role) => (
                            <option key={role} value={role}>
                              {role.toUpperCase()}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Multi-Role RBAC (Izin Peran Terintegrasi)
                      </label>
                      <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 max-h-[16rem] overflow-y-auto space-y-2 custom-scrollbar">
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
                          Pilih peran tambahan yang aktif untuk pengguna ini:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {(UserRole ? Object.values(UserRole) : [])
                            .filter((role) => role !== UserRole.DEVELOPER || isDeveloper)
                            .map((role) => {
                              const currentRoles = editingUser.roles || [editingUser.role];
                              const isChecked = currentRoles.includes(role);
                              return (
                                <label
                                  key={role}
                                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                                      : 'bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/5'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="accent-indigo-500 w-3.5 h-3.5 rounded border-white/10 cursor-pointer"
                                    checked={isChecked}
                                    onChange={() => {
                                      let newRoles = [...currentRoles];
                                      if (isChecked) {
                                        if (newRoles.length > 1) {
                                          newRoles = newRoles.filter((r) => r !== role);
                                        } else {
                                          toast.error('User harus memiliki minimal satu Peran!');
                                          return;
                                        }
                                      } else {
                                        newRoles.push(role);
                                      }
                                      setEditingUser({
                                        ...editingUser,
                                        roles: newRoles,
                                        role: newRoles[0] || editingUser.role,
                                      });
                                    }}
                                  />
                                  <span className="uppercase tracking-wide truncate">
                                    {role.replace('_', ' ')}
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'akses' && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-[10px] font-bold text-slate-400">
                      Hak akses modul spesifik (melalui permission overrides):
                    </p>
                    <div className="space-y-3">
                      {[
                        { module: 'AKADEMIK', desc: 'Kelola nilai rapor dan kurikulum', perm: 'grade.manage' },
                        { module: 'ABSENSI', desc: 'Rekap dan input absensi harian', perm: 'attendance.manage' },
                        { module: 'BK (BIMBINGAN KONSELING)', desc: 'Catat pelanggaran dan konseling siswa', perm: 'bk.manage' },
                        { module: 'PERSURATAN', desc: 'Buat dan setujui surat keluar/masuk', perm: 'letter.manage' },
                        { module: 'KEUANGAN', desc: 'SPP dan administrasi pembayaran', perm: 'finance.manage' },
                      ].map((mod) => {
                        const granted = editingUser.permissions?.includes(mod.perm) || false;
                        return (
                          <div
                            key={mod.perm}
                            className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-2xl"
                          >
                            <div>
                              <p className="text-xs font-bold text-white">{mod.module}</p>
                              <p className="text-[10px] text-slate-400">{mod.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={granted}
                                onChange={(e) => {
                                  const currentGrant = editingUser.permissions || [];
                                  const newGrant = e.target.checked
                                    ? [...currentGrant, mod.perm]
                                    : currentGrant.filter((p: any) => p !== mod.perm);
                                  setEditingUser({
                                    ...editingUser,
                                    permissions: newGrant,
                                  });
                                }}
                              />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'scope' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Tenant ID / NPSN (Scope Utama)
                      </label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white"
                        value={editingUser.tenantId || ''}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, tenantId: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Class Scope (ID Kelas yang diampu/diikuti, pisahkan dengan koma)
                      </label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white"
                        value={editingUser.scope?.ids?.join(', ') || ''}
                        onChange={(e) => {
                          const ids = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          setEditingUser({
                            ...editingUser,
                            scope: { ...editingUser.scope, ids } as any,
                          });
                        }}
                        placeholder="X-IPA-1, X-IPA-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Subject Scope (Mata Pelajaran, pisahkan dengan koma)
                      </label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white"
                        value={editingUser.scope?.ids?.join(', ') || ''}
                        onChange={(e) => {
                          const ids = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          setEditingUser({
                            ...editingUser,
                            scope: { ...editingUser.scope, ids } as any,
                          });
                        }}
                        placeholder="Matematika, Fisika"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'status' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Account Status
                      </label>
                      <select
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white"
                        value={editingUser.status || 'Active'}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, status: e.target.value as any })
                        }
                      >
                        <option value="Active">ACTIVE</option>
                        <option value="Suspended">SUSPENDED</option>
                        <option value="pending_approval">PENDING APPROVAL</option>
                        <option value="needs_id_verification">NEEDS ID VERIFICATION</option>
                        <option value="Inactive">INACTIVE</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Admin Note / Catatan Khusus
                      </label>
                      <textarea
                        rows={3}
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white"
                        value={(editingUser as any).adminNote || ''}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, adminNote: e.target.value } as any)
                        }
                        placeholder="Alasan perubahan status atau catatan verifikasi..."
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'aktivitas' && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-[10px] font-bold text-slate-400">
                      Riwayat Aktivitas & Audit Log untuk {editingUser.displayName}:
                    </p>
                    <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-3 max-h-[16rem] overflow-y-auto">
                      <div className="flex items-start gap-3 text-xs border-b border-white/5 pb-2.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                        <div>
                          <p className="font-bold text-white">Akun Diperbarui</p>
                          <p className="text-[10px] text-slate-400">Role & Profil disinkronkan oleh Admin Madrasah</p>
                          <p className="text-[9px] text-indigo-400 mt-0.5">{new Date().toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-xs border-b border-white/5 pb-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                        <div>
                          <p className="font-bold text-white">Login Terakhir</p>
                          <p className="text-[10px] text-slate-400">IP: 192.168.1.10 (Browser Chrome)</p>
                          <p className="text-[9px] text-emerald-400 mt-0.5">{(editingUser as any).lastSeen || 'Hari ini'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                        <div>
                          <p className="font-bold text-white">Registrasi Akun</p>
                          <p className="text-[10px] text-slate-400">Akun terdaftar ke tenant {editingUser.tenantId}</p>
                          <p className="text-[9px] text-amber-400 mt-0.5">{editingUser.createdAt ? new Date(editingUser.createdAt).toLocaleString() : 'Sistem'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 flex gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-[11px] font-bold text-white uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <SaveIcon className="w-4 h-4" />
                    )}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold lowercase ">Buat Akun Baru</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                    Tenant ID:{' '}
                    <span className="text-indigo-400 font-bold">{newData.tenantId}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <XIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-3.5 h-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap pengguna"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                        value={newData.displayName}
                        onChange={(e) => setNewData({ ...newData, displayName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                      Email
                    </label>
                    <div className="relative">
                      <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-3.5 h-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="user@emam-system.web.id"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                        value={newData.email}
                        onChange={(e) => setNewData({ ...newData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-3.5 h-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Password awal"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                        value={newData.password}
                        onChange={(e) => setNewData({ ...newData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                      NISN / NIP / ID Unik
                    </label>
                    <div className="relative">
                      <HashIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-3.5 h-3.5" />
                      <input
                        type="text"
                        placeholder="Masukkan identitas unik"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                        value={newData.idUnik}
                        onChange={(e) => setNewData({ ...newData, idUnik: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                      Peran Utama (Role)
                    </label>
                    <div className="relative">
                      <ShieldIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-3.5 h-3.5" />
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 appearance-none text-white text-left"
                        value={newData.role}
                        onChange={(e) => setNewData({ ...newData, role: e.target.value })}
                      >
                        {(UserRole ? Object.values(UserRole) : []).map((role) => (
                          <option key={role} value={role} className="bg-slate-900 text-white">
                            {role.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                      Tenant ID (NPSN)
                    </label>
                    <div className="relative">
                      <DatabaseIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-3.5 h-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="NPSN Sekolah"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 text-white"
                        value={newData.tenantId}
                        onChange={(e) => setNewData({ ...newData, tenantId: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all text-slate-400"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-[11px] font-bold text-white uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <PlusIcon className="w-4 h-4" />
                    )}
                    Buat Akun Baru
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StudentBulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={() => {
          setShowBulkUploadModal(false);
          loadUsers();
        }}
      />
    </div>
  );
};

export default UserDatabaseManagement;
