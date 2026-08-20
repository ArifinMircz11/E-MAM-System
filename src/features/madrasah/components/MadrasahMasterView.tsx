import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/Button';
import { useMadrasahMaster } from '../hooks/useMadrasahMaster';
import { MadrasahForm } from './MadrasahForm';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingLibraryIcon, 
  PlusIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  SearchIcon,
  UsersIcon,
  CogIcon,
  DownloadIcon,
  UploadIcon,
  RefreshCwIcon
} from '@/shared/Icons';
import { toast } from 'sonner';
import { UserRole, AccountType } from '@/types';
import type { UserData } from '@/types';
import { userService } from '@/features/users/services/user.service';
import { useUserStore } from '@/stores/userStore';

export const MadrasahMasterView: React.FC = () => {
  const { 
    madrasahs, 
    isLoading, 
    isFormOpen, 
    openForm, 
    closeForm, 
    handleCreate, 
    refresh 
  } = useMadrasahMaster();
  
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tenant users states
  const [tenantUsers, setTenantUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [targetTenantId, setTargetTenantId] = useState('');
  const [newUserForm, setNewUserForm] = useState({
    displayName: '',
    username: '',
    email: '',
    role: UserRole.GURU,
    idUnik: '',
  });

  const operatorUid = useUserStore((state) => state.uid) || 'admin';

  const toggleRow = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  const filteredMadrasahs = (madrasahs || []).filter(m => {
    if (!m) return false;
    const nama = m.namaMadrasah || (m as any).nama || (m as any).name || '';
    const npsn = m.npsn || (m as any).code || '';
    const query = (searchQuery || '').toLowerCase();
    return nama.toLowerCase().includes(query) || npsn.toLowerCase().includes(query);
  });

  const loadUsersForTenant = async (tenantId: string) => {
    setLoadingUsers(true);
    try {
      const data = await userService.getUsers(tenantId);
      setTenantUsers(data);
    } catch (error) {
      console.error('Failed to load users for tenant:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (expandedRow) {
      const expandedMadrasah = madrasahs.find(m => m.id === expandedRow);
      if (expandedMadrasah && expandedMadrasah.tenantId) {
        loadUsersForTenant(expandedMadrasah.tenantId);
      } else {
        setTenantUsers([]);
      }
    } else {
      setTenantUsers([]);
    }
  }, [expandedRow, madrasahs]);

  const handleOpenAddUserModal = (tenantId: string) => {
    setTargetTenantId(tenantId);
    setIsAddUserModalOpen(true);
  };

  const handleSubmitAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.displayName.trim() || !newUserForm.username.trim() || !newUserForm.email.trim()) {
      toast.error('Mohon isi semua field wajib!');
      return;
    }

    try {
      const userPayload = {
        uid: `usr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        tenantId: targetTenantId,
        accountType: AccountType.MADRASAH,
        role: newUserForm.role,
        roles: [newUserForm.role],
        status: 'active',
        approvalStatus: 'approved',
        version: 1,
        schemaVersion: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deleted: false,
        displayName: newUserForm.displayName.trim(),
        email: newUserForm.email.trim().toLowerCase(),
        idUnik: newUserForm.idUnik.trim() || undefined,
        username: newUserForm.username.trim().toLowerCase()
      };

      await userService.createUser(operatorUid, userPayload as any);
      toast.success('Pengguna berhasil ditambahkan secara lokal');
      setIsAddUserModalOpen(false);
      setNewUserForm({
        displayName: '',
        username: '',
        email: '',
        role: UserRole.GURU,
        idUnik: '',
      });
      loadUsersForTenant(targetTenantId);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan pengguna');
    }
  };

  const handleDeleteUser = async (uidToDelete: string, tenantId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      try {
        await userService.deleteUser(operatorUid, uidToDelete, tenantId);
        toast.success('Pengguna berhasil dihapus secara lokal');
        loadUsersForTenant(tenantId);
      } catch (error: any) {
        toast.error(error.message || 'Gagal menghapus pengguna');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BuildingLibraryIcon className="w-6 h-6 text-emerald-600" />
            Master Madrasah (Tenant Center)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola data master madrasah dan pengguna dalam konteks tenant.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <UploadIcon className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <DownloadIcon className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => openForm()}
          >
            <PlusIcon className="w-4 h-4 mr-2" /> Tambah Madrasah
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        
        {/* Toolbar (Search) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari NPSN atau Nama Madrasah..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Kode (NPSN)</TableHead>
                <TableHead>Nama Madrasah</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center w-24">Aksi</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">Memuat data...</TableCell>
                </TableRow>
              ) : filteredMadrasahs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">Tidak ada data madrasah.</TableCell>
                </TableRow>
              ) : filteredMadrasahs.map((madrasah, index) => (
                <React.Fragment key={madrasah.id}>
                  {/* Master Row */}
                  <TableRow 
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${expandedRow === madrasah.id ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                    onClick={() => toggleRow(madrasah.id)}
                  >
                    <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-400">{madrasah.npsn || (madrasah as any).code || '-'}</TableCell>
                    <TableCell className="font-medium text-slate-800 dark:text-slate-200">{madrasah.namaMadrasah || (madrasah as any).nama || '-'}</TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                        {madrasah.jenjang || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${madrasah.statusTenant === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">{madrasah.statusTenant || 'active'}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600">
                        <CogIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
                        {expandedRow === madrasah.id ? (
                          <ChevronDownIcon className="w-5 h-5" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Detail Row (Tenant Workspace) */}
                  <AnimatePresence>
                    {expandedRow === madrasah.id && (
                      <TableRow className="bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-50/80 dark:hover:bg-slate-900/80">
                        <TableCell colSpan={7} className="p-0 border-b-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 border-t border-emerald-100 dark:border-emerald-900/30">
                              
                              {/* Tenant Workspace Header */}
                              <div className="flex flex-col md:flex-row gap-8">
                                
                                {/* Info Panel */}
                                <div className="w-full md:w-1/3 space-y-4">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                      <BuildingLibraryIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{madrasah.namaMadrasah || (madrasah as any).nama || 'Madrasah'}</h3>
                                      <p className="text-xs text-slate-500 font-mono">Tenant ID: {madrasah.tenantId || '-'}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                      <p className="text-xs text-slate-500 mb-1">Status</p>
                                      <p className="text-sm font-medium text-emerald-600 capitalize">{madrasah.statusTenant}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                      <p className="text-xs text-slate-500 mb-1">Kabupaten</p>
                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1" title={madrasah.kabupaten}>{madrasah.kabupaten}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                      <p className="text-xs text-slate-500 mb-1">Jenjang</p>
                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{madrasah.jenjang}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                      <p className="text-xs text-slate-500 mb-1">NPSN</p>
                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{madrasah.npsn}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                      {madrasah.alamat || 'Alamat belum diatur'}
                                    </p>
                                  </div>
                                </div>

                                {/* Users Panel */}
                                <div className="w-full md:w-2/3">
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                      <UsersIcon className="w-4 h-4 text-slate-400" />
                                      Users di {madrasah.namaMadrasah || (madrasah as any).nama || 'Madrasah'}
                                    </h4>
                                    <Button size="sm" className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white text-xs h-8" onClick={() => handleOpenAddUserModal(madrasah.tenantId)}>
                                      <PlusIcon className="w-3.5 h-3.5 mr-1.5" /> Tambah User
                                    </Button>
                                  </div>
                                  
                                  {loadingUsers ? (
                                    <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-sm">
                                      Memuat data pengguna...
                                    </div>
                                  ) : tenantUsers.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-8 text-center">
                                      <p className="text-sm text-slate-400">Belum ada pengguna terdaftar untuk tenant ini.</p>
                                    </div>
                                  ) : (
                                    <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                          <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                              <th className="py-2.5 px-4 text-left">Nama & Username</th>
                                              <th className="py-2.5 px-4 text-left">Email</th>
                                              <th className="py-2.5 px-4 text-left">Role Utama</th>
                                              <th className="py-2.5 px-4 text-center w-20">Aksi</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                            {tenantUsers.map((user) => (
                                              <tr key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                                <td className="py-2.5 px-4">
                                                  <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                                    {user.displayName || '-'}
                                                  </div>
                                                  <div className="text-[11px] font-mono text-slate-400">
                                                    @{(user as any).username || '-'}
                                                  </div>
                                                </td>
                                                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                                                  {user.email || '-'}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                  <span className="px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                                                    {user.role}
                                                  </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                  <button
                                                    className="px-2 py-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold rounded text-xs transition"
                                                    onClick={() => handleDeleteUser(user.uid, madrasah.tenantId)}
                                                  >
                                                    Hapus
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>

                              </div>
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <MadrasahForm 
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleCreate}
      />

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Tambah User Baru
              </h2>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rahmat Hidayat, S.Ag"
                  value={newUserForm.displayName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: rahmathidayat"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Email Resmi *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: rahmat@e-mam.id"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Peran Utama *
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                  >
                    <option value={UserRole.GURU}>Guru Mapel / Pendidik</option>
                    <option value={UserRole.KEPALA_MADRASAH}>Kepala Madrasah</option>
                    <option value={UserRole.KEPALA_TU}>Kepala Tata Usaha</option>
                    <option value={UserRole.STAF}>Staf / Tenaga Kependidikan</option>
                    <option value={UserRole.SISWA}>Siswa / Peserta Didik</option>
                    <option value={UserRole.ORANG_TUA}>Orang Tua / Wali Murid</option>
                    <option value={UserRole.ADMIN}>Admin Madrasah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    ID Unik / NIP / NISN (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 198203112009121003"
                    value={newUserForm.idUnik}
                    onChange={(e) => setNewUserForm({ ...newUserForm, idUnik: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

