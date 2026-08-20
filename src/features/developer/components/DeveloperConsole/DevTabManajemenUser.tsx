import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Eye,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { useImpersonation } from '@/core/impersonation';
import { userRepository } from '@/repositories/userRepository';
import { UserRole } from '@/types/roles';
import { normalizeRoleStr } from '@/utils/roleNormalizer';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';

interface CanonicalUserItem {
  uid: string;
  name: string;
  username: string;
  email: string;
  accountType: 'developer' | 'kanwil' | 'kemenag' | 'madrasah';
  organizationId: string;
  organizationName: string;
  role: string;
  status: 'active' | 'inactive';
  scope: {
    organizationId: string;
  };
  createdAt: string;
}

export const DevTabManajemenUser: React.FC = () => {
  const { startImpersonation } = useImpersonation();
  const [filterAccountType, setFilterAccountType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CanonicalUserItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [users, setUsers] = useState<CanonicalUserItem[]>([
    {
      uid: 'usr_001',
      name: 'Dr. H. Ahmad Fauzi, M.Pd',
      username: 'ahmadfauzi',
      email: 'user1@example.com',
      accountType: 'kanwil',
      organizationId: 'org_kanwil_01',
      organizationName: 'Kanwil Kemenag Prov. Kalsel',
      role: 'Admin Kanwil',
      status: 'active',
      scope: { organizationId: 'org_kanwil_01' },
      createdAt: '2025-01-15',
    },
    {
      uid: 'usr_002',
      name: 'Drs. H. Muhammad Ridha',
      username: 'mridha',
      email: 'user2@example.com',
      accountType: 'kemenag',
      organizationId: 'org_kemenag_01',
      organizationName: 'Kemenag Kab. Hulu Sungai Tengah',
      role: 'Admin Kemenag',
      status: 'active',
      scope: { organizationId: 'org_kemenag_01' },
      createdAt: '2025-01-18',
    },
    {
      uid: 'usr_003',
      name: 'Rahmat Hidayat, S.Ag',
      username: 'rahmathid',
      email: 'sekolah@example.com',
      accountType: 'madrasah',
      organizationId: 'org_madrasah_01',
      organizationName: 'MAN 1 Hulu Sungai Tengah',
      role: 'Admin Madrasah',
      status: 'active',
      scope: { organizationId: 'org_madrasah_01' },
      createdAt: '2025-01-20',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    organizationId: 'org_kanwil_01',
    organizationName: 'Kanwil Kemenag Prov. Kalsel',
    accountType: 'kanwil' as 'developer' | 'kanwil' | 'kemenag' | 'madrasah',
    role: 'Admin Kanwil',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredUsers = users.filter((u) => {
    const matchType = filterAccountType === 'all' || u.accountType === filterAccountType;
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.organizationName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleOrgChange = (orgId: string) => {
    let type: 'kanwil' | 'kemenag' | 'madrasah' = 'kanwil';
    let orgName = '';
    let role = 'Admin Kanwil';

    if (orgId === 'org_kanwil_01') {
      type = 'kanwil';
      orgName = 'Kanwil Kemenag Prov. Kalsel';
      role = 'Admin Kanwil';
    } else if (orgId.includes('kemenag')) {
      type = 'kemenag';
      orgName = 'Kemenag Kab. Hulu Sungai Tengah';
      role = 'Admin Kemenag';
    } else {
      type = 'madrasah';
      orgName = 'MAN 1 Hulu Sungai Tengah';
      role = 'Admin Madrasah';
    }

    setFormData({
      ...formData,
      organizationId: orgId,
      organizationName: orgName,
      accountType: type,
      role: role,
    });
  };

  useEffect(() => {
    const loadRealUsers = async () => {
      try {
        const storedUsers = await userRepository.getAllUsers();
        if (storedUsers && storedUsers.length > 0) {
          const mapped: CanonicalUserItem[] = storedUsers.map((u) => ({
            uid: u.uid || u.id,
            name: u.displayName || u.profile?.displayName || 'Pengguna',
            username: u.idUnik || u.email.split('@')[0],
            email: u.email,
            accountType: (u.accountType as any) || 'madrasah',
            organizationId: u.tenantId,
            organizationName: u.tenantId.includes('30315537')
              ? 'MAN 1 Hulu Sungai Tengah'
              : `Tenant ${u.tenantId}`,
            role: typeof u.role === 'string' ? u.role : 'Admin Madrasah',
            status: u.status === 'inactive' || u.status === 'suspended' ? 'inactive' : 'active',
            scope: { organizationId: u.tenantId },
            createdAt: new Date(u.createdAt || Date.now()).toISOString().split('T')[0],
          }));

          setUsers((prev) => {
            const existingUids = new Set(prev.map((p) => p.uid));
            const newMapped = mapped.filter((m) => !existingUids.has(m.uid));
            return [...newMapped, ...prev];
          });
        }
      } catch (err) {
        console.error('Failed to load real users from userRepository:', err);
      }
    };
    loadRealUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      toast.error('Nama lengkap dan Username wajib diisi!');
      return;
    }

    const newUid = `usr_${Date.now()}`;
    const cleanEmail = formData.email || `${formData.username}@e-mam.id`;

    const newUserItem: CanonicalUserItem = {
      uid: newUid,
      name: formData.name,
      username: formData.username,
      email: cleanEmail,
      accountType: formData.accountType,
      organizationId: formData.organizationId,
      organizationName: formData.organizationName,
      role: formData.role,
      status: formData.status,
      scope: { organizationId: formData.organizationId },
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Save to Dexie userRepository
    try {
      const primaryRole = normalizeRoleStr(formData.role) || UserRole.ADMIN;
      const canonicalUser: CanonicalUser = {
        id: newUid,
        uid: newUid,
        email: cleanEmail,
        displayName: formData.name,
        accountType: formData.accountType,
        role: primaryRole,
        roles: [primaryRole],
        permissions: ['*'],
        tenantId: formData.organizationId,
        referenceId: newUid,
        isClaimed: false,
        isSso: false,
        approvalStatus: 'approved',
        status: formData.status === 'active' ? 'active' : 'inactive',
        syncStatus: 'pending',
        version: 1,
        schemaVersion: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deleted: false,
        idUnik: formData.username,
        profile: {
          email: cleanEmail,
          displayName: formData.name,
        },
      };

      await userRepository.create(canonicalUser);
    } catch (err) {
      console.error('Error persisting canonical user:', err);
    }

    setUsers([newUserItem, ...users]);
    setIsCreateModalOpen(false);
    toast.success(`Berhasil membuat Canonical User: ${formData.name}`);
  };

  const toggleUserStatus = (uid: string) => {
    setUsers(
      users.map((u) =>
        u.uid === uid ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );
    toast.success('Status akses user berhasil diperbarui');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Identity & Access Control (IAM)</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Manajemen User (Canonical Identity)</h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            Kelola identitas pengguna, penugasan organisasi (Scope), dan hak akses peran (RBAC) secara terpusat dan aman.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-bold text-sm shadow transition flex items-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Buat User Baru</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'all', label: 'Semua User' },
          { id: 'developer', label: 'Developer' },
          { id: 'kanwil', label: 'Kanwil' },
          { id: 'kemenag', label: 'Kemenag' },
          { id: 'madrasah', label: 'Madrasah' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterAccountType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              filterAccountType === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari user berdasarkan nama, username, atau organisasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Total Identitas: {filteredUsers.length} user terdaftar
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Nama & Username</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4">Organisasi (Scope)</th>
                <th className="py-3 px-4">Role Utama</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Tidak ada identitas user yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{u.name}</div>
                      <div className="text-xs font-mono text-slate-400">@{u.username} â€¢ {u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 uppercase">
                        {u.accountType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{u.organizationName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleUserStatus(u.uid)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                        }`}
                      >
                        {u.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startImpersonation(u, 'Developer Console Impersonation')}
                        title="Masuk Sebagai (Impersonate)"
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Masuk Sebagai</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setDetailModalOpen(true);
                        }}
                        title="Detail User"
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Buat Canonical User Baru
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                âœ•
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Pilih Organisasi (Scope Binding)
                </label>
                <select
                  value={formData.organizationId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleOrgChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  <option value="org_kanwil_01">Kanwil Kemenag Prov. Kalsel (Kanwil)</option>
                  <option value="org_kemenag_01">Kemenag Kab. Hulu Sungai Tengah (Kemenag)</option>
                  <option value="org_madrasah_01">MAN 1 Hulu Sungai Tengah (Madrasah)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Role Otomatis Berdasarkan Scope
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.role}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dr. H. Ahmad Fauzi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: ahmadfauzi"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email Resmi
                </label>
                <input
                  type="email"
                  placeholder="Contoh: user3@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md"
                >
                  Simpan Canonical User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                  {selectedUser.accountType}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">{selectedUser.name}</h3>
                <p className="text-xs font-mono text-slate-400">@{selectedUser.username} â€¢ {selectedUser.email}</p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                âœ•
              </button>
            </div>

            <div className="space-y-3 text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Organisasi:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.organizationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role Utama:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scope ID:</span>
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{selectedUser.scope.organizationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Akses:</span>
                <span className={`font-bold ${selectedUser.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedUser.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

