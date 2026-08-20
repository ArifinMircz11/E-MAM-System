import React from 'react';
import { Lock, Key, Check } from 'lucide-react';
import { EnterpriseDataTable, Column } from '../components/EnterpriseDataTable';

interface PermissionRecord {
  id: string;
  code: string;
  module: string;
  description: string;
  roles: string[];
}

const INITIAL_PERMISSIONS: PermissionRecord[] = [
  { id: 'p-1', code: 'student.read', module: 'Student Domain', description: 'Melihat data siswa', roles: ['developer', 'admin', 'guru', 'bk'] },
  { id: 'p-2', code: 'student.write', module: 'Student Domain', description: 'Menambah/mengedit data siswa', roles: ['developer', 'admin'] },
  { id: 'p-3', code: 'attendance.manage', module: 'Attendance Domain', description: 'Kelola absensi harian', roles: ['developer', 'admin', 'guru'] },
  { id: 'p-4', code: 'developer.console', module: 'System Core', description: 'Akses penuh developer dashboard', roles: ['developer'] },
];

export const PermissionsPage: React.FC = () => {
  const columns: Column<PermissionRecord>[] = [
    {
      header: 'Permission Code',
      accessor: (row) => (
        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Modul',
      accessor: (row) => (
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold">
          {row.module}
        </span>
      ),
    },
    {
      header: 'Deskripsi',
      accessor: 'description',
    },
    {
      header: 'Role Diizinkan',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((r, i) => (
            <span key={i} className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
              {r}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Lock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Permissions Matrix</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Daftar izin akses granular per modul dan otorisasi role sistem.
          </p>
        </div>
      </div>

      <EnterpriseDataTable
        columns={columns}
        data={INITIAL_PERMISSIONS}
        keyExtractor={(p) => p.id}
        emptyTitle="Tidak ada permission"
        emptyDescription="Belum ada permission terdaftar."
      />
    </div>
  );
};
