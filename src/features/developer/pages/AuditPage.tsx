import React from 'react';
import { ShieldAlert, FileText } from 'lucide-react';
import { EnterpriseDataTable, Column } from '../components/EnterpriseDataTable';

interface AuditRecord {
  id: string;
  action: string;
  user: string;
  tenantId: string;
  timestamp: string;
  status: string;
}

const INITIAL_AUDITS: AuditRecord[] = [
  { id: 'a-1', action: 'USER_LOGIN', user: 'admin@example.com', tenantId: 'tenant-madrasah-a', timestamp: 'Hari ini, 09:30', status: 'SUCCESS' },
  { id: 'a-2', action: 'STUDENT_RECORD_CREATE', user: 'kepala@example.com', tenantId: 'tenant-madrasah-a', timestamp: 'Hari ini, 08:15', status: 'SUCCESS' },
];

export const AuditPage: React.FC = () => {
  const columns: Column<AuditRecord>[] = [
    {
      header: 'Aktivitas / Aksi',
      accessor: (row) => (
        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
          {row.action}
        </span>
      ),
    },
    {
      header: 'User',
      accessor: 'user',
    },
    {
      header: 'Tenant',
      accessor: 'tenantId',
    },
    {
      header: 'Waktu',
      accessor: 'timestamp',
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/50">
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Audit & Security Logs</span>
        </h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          Jejak audit keamanan sistem, kepatuhan, forensic, dan aktivitas transaksi data.
        </p>
      </div>

      <EnterpriseDataTable
        columns={columns}
        data={INITIAL_AUDITS}
        keyExtractor={(a) => a.id}
        emptyTitle="Tidak ada log audit"
        emptyDescription="Belum ada aktivitas audit tercatat."
      />
    </div>
  );
};
