import React, { useState } from 'react';
import { Shield, Lock, CheckCircle, Plus } from 'lucide-react';
import { EnterpriseDataTable, Column } from '../components/EnterpriseDataTable';
import { toast } from 'sonner';

interface RoleRecord {
  id: string;
  name: string;
  level: string;
  permissionsCount: number;
  usersAssigned: number;
}

const INITIAL_ROLES: RoleRecord[] = [
  { id: 'role-dev', name: 'Developer', level: 'P0 System', permissionsCount: 120, usersAssigned: 2 },
  { id: 'role-admin', name: 'Admin Madrasah', level: 'Tenant Admin', permissionsCount: 85, usersAssigned: 5 },
  { id: 'role-guru', name: 'Guru Mapel', level: 'Operational', permissionsCount: 42, usersAssigned: 64 },
  { id: 'role-bk', name: 'Guru BK', level: 'Operational', permissionsCount: 48, usersAssigned: 12 },
  { id: 'role-siswa', name: 'Siswa / Wali', level: 'End User', permissionsCount: 15, usersAssigned: 1250 },
];

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleRecord[]>(INITIAL_ROLES);

  const columns: Column<RoleRecord>[] = [
    {
      header: 'Role Nama',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{row.name}</p>
            <p className="text-[11px] text-slate-500 font-mono">ID: {row.id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Level Akses',
      accessor: (row) => (
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold">
          {row.level}
        </span>
      ),
    },
    {
      header: 'Jumlah Permission',
      accessor: (row) => (
        <span className="font-bold text-indigo-600 dark:text-indigo-400">{row.permissionsCount} Rules</span>
      ),
    },
    {
      header: 'User Terkait',
      accessor: (row) => (
        <span className="font-bold text-slate-900 dark:text-white">{row.usersAssigned} Akun</span>
      ),
    },
    {
      header: 'Status RBAC',
      accessor: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
          <CheckCircle className="w-3 h-3" />
          <span>Active</span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Permission Center (Roles & RBAC)</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Pengelolaan matriks peran (RBAC) dan izin akses domain enterprise secara ketat.
          </p>
        </div>
        <button
          onClick={() => toast.info('Fitur penambahan role kustom enterprise')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Role Baru</span>
        </button>
      </div>

      <EnterpriseDataTable
        columns={columns}
        data={roles}
        keyExtractor={(r) => r.id}
        emptyTitle="Tidak ada role"
        emptyDescription="Belum ada konfigurasi role permission."
      />
    </div>
  );
};
