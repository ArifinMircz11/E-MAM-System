import React, { useState } from 'react';
import { EnterpriseCrudToolbar } from '../components/EnterpriseCrudToolbar';
import { EnterpriseFilterPanel } from '../components/EnterpriseFilterPanel';
import { EnterpriseDataTable, Column } from '../components/EnterpriseDataTable';
import { EnterpriseFormDialog } from '../components/EnterpriseFormDialog';
import { EnterpriseConfirmDialog } from '../components/EnterpriseConfirmDialog';
import { UserRole, AccountType } from '@/types';
import { Users, Shield, CheckCircle, XCircle, Edit, Trash2, Key } from 'lucide-react';
import { toast } from 'sonner';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  accountType: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  lastLogin: string;
}

const INITIAL_USERS: UserRecord[] = [
  { id: 'u-1', name: 'Akhmad Arifin', email: 'admin@example.com', tenantId: 'tenant-madrasah-a', accountType: 'developer', role: 'developer', status: 'active', lastLogin: 'Baru saja' },
  { id: 'u-2', name: 'Dr. H. Ahmad Fauzi, M.Pd', email: 'kepala@example.com', tenantId: 'tenant-madrasah-a', accountType: 'madrasah', role: 'admin', status: 'active', lastLogin: '2 jam lalu' },
  { id: 'u-3', name: 'Siti Aminah, S.Pd', email: 'guru.mapel@example.com', tenantId: 'tenant-madrasah-a', accountType: 'madrasah', role: 'guru', status: 'active', lastLogin: '1 hari lalu' },
];

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tenantId: 'tenant-madrasah-a',
    accountType: 'madrasah',
    role: 'guru',
  });

  const filterGroups = [
    {
      key: 'tenantId',
      label: 'Tenant',
      options: [
        { label: 'Madrasah A', value: 'tenant-madrasah-a' },
        { label: 'Madrasah B', value: 'tenant-madrasah-b' },
        { label: 'Global / Kanwil', value: 'global' },
      ],
    },
    {
      key: 'accountType',
      label: 'Account Type',
      options: [
        { label: 'Developer', value: 'developer' },
        { label: 'Madrasah', value: 'madrasah' },
        { label: 'Kanwil', value: 'kanwil' },
        { label: 'Guest', value: 'guest' },
      ],
    },
    {
      key: 'role',
      label: 'Role',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Guru', value: 'guru' },
        { label: 'BK', value: 'bk' },
        { label: 'Siswa', value: 'siswa' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Pending', value: 'pending' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = !filters.tenantId || u.tenantId === filters.tenantId;
    const matchesAccountType = !filters.accountType || u.accountType === filters.accountType;
    const matchesRole = !filters.role || u.role === filters.role;
    const matchesStatus = !filters.status || u.status === filters.status;
    return matchesSearch && matchesTenant && matchesAccountType && matchesRole && matchesStatus;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Nama dan Email wajib diisi.');
      return;
    }

    if (selectedUser) {
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, ...formData } : u)));
      toast.success('Data user berhasil diperbarui.');
    } else {
      const newUser: UserRecord = {
        id: `u-${Date.now()}`,
        ...formData,
        status: 'active',
        lastLogin: 'Belum pernah',
      };
      setUsers([newUser, ...users]);
      toast.success('User baru berhasil ditambahkan.');
    }

    setIsFormOpen(false);
    setSelectedUser(null);
    setFormData({ name: '', email: '', tenantId: 'tenant-madrasah-a', accountType: 'madrasah', role: 'guru' });
  };

  const columns: Column<UserRecord>[] = [
    {
      header: 'Nama & Email',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{row.name}</p>
          <p className="text-[11px] text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Tenant',
      accessor: (row) => (
        <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
          {row.tenantId}
        </span>
      ),
    },
    {
      header: 'Tipe & Role',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-bold uppercase">
            {row.accountType}
          </span>
          <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-[11px] font-bold uppercase">
            {row.role}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
            row.status === 'active'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
          }`}
        >
          {row.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          <span className="capitalize">{row.status}</span>
        </span>
      ),
    },
    {
      header: 'Last Login',
      accessor: 'lastLogin',
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedUser(row);
              setFormData({
                name: row.name,
                email: row.email,
                tenantId: row.tenantId,
                accountType: row.accountType,
                role: row.role,
              });
              setIsFormOpen(true);
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer"
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(row);
              setIsDeleteOpen(true);
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
            title="Hapus User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Identity Center (Users)</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Kelola identitas pengguna lintas tenant, akun, role, dan izin akses enterprise.
          </p>
        </div>
      </div>

      <EnterpriseFilterPanel
        groups={filterGroups}
        selectedFilters={filters}
        onChange={(key, val) => setFilters({ ...filters, [key]: val })}
        onReset={() => setFilters({})}
      />

      <EnterpriseCrudToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAdd={() => {
          setSelectedUser(null);
          setFormData({ name: '', email: '', tenantId: 'tenant-madrasah-a', accountType: 'madrasah', role: 'guru' });
          setIsFormOpen(true);
        }}
        addButtonLabel="Tambah User Baru"
        onRefresh={() => toast.success('Data user diperbarui.')}
      />

      <EnterpriseDataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        emptyTitle="Tidak ada user ditemukan"
        emptyDescription="Coba ubah kata kunci pencarian atau filter yang aktif."
        onAddEmpty={() => setIsFormOpen(true)}
      />

      <EnterpriseFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedUser ? 'Edit User Enterprise' : 'Tambah User Baru'}
        subtitle="Form registrasi & pengaturan otorisasi identitas tenant."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="cth. Dr. H. Ahmad Fauzi"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Akun
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="cth. user@example.com"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tenant ID
              </label>
              <select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="tenant-madrasah-a">Madrasah A</option>
                <option value="tenant-madrasah-b">Madrasah B</option>
                <option value="global">Global / Kanwil</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tipe Akun
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="developer">Developer</option>
                <option value="madrasah">Madrasah</option>
                <option value="kanwil">Kanwil</option>
                <option value="guest">Guest</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Role Utama
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="guru">Guru Mapel</option>
              <option value="bk">Guru BK</option>
              <option value="siswa">Siswa</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Simpan User
            </button>
          </div>
        </form>
      </EnterpriseFormDialog>

      <EnterpriseConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          if (selectedUser) {
            setUsers(users.filter((u) => u.id !== selectedUser.id));
            toast.success('User berhasil dihapus.');
          }
          setIsDeleteOpen(false);
          setSelectedUser(null);
        }}
        title="Hapus User Enterprise"
        description={`Apakah Anda yakin ingin menghapus user ${selectedUser?.name}? Tindakan ini permanen.`}
        confirmText="Hapus User"
      />
    </div>
  );
};
