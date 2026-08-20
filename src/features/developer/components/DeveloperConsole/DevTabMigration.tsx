import React from 'react';
import {
  ArrowPathIcon,
  UserIcon,
  UsersGroupIcon,
  ShieldCheckIcon,
  Search,
} from '@/shared/Icons';
import { DevActionButton } from './DevActionButton';
import { analyzeSchemaQuality } from '@/services/devConsoleService';
import { UserMigrationCenter } from './UserMigrationCenter';
import { toast } from 'sonner';
import { importAll } from '@/migration/firestore/importer/importAll';

interface DevTabMigrationProps {
  setConfirmModal: (modal: any) => void;
  TABEL_SISTEM: any[];
  executeDatabaseSchemaMigration: (cls?: string) => Promise<any>;
  migrateProfileUpdateRequestsData: (log: (msg: string) => void) => Promise<number>;
  migrateUserDataToStudents: (log: (msg: string) => void) => Promise<any>;
  migrateToNewRBAC: (log: (msg: string) => void) => Promise<number>;
}

export const DevTabMigration: React.FC<DevTabMigrationProps> = ({
  TABEL_SISTEM,
  executeDatabaseSchemaMigration,
  migrateProfileUpdateRequestsData,
  migrateUserDataToStudents,
  migrateToNewRBAC,
}) => {
  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-40 custom-scrollbar">
      <UserMigrationCenter />

      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-white">
            Maintenance & Migration Tools
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 leading-relaxed max-w-xl">
            Gunakan alat ini untuk sinkronisasi data antar koleksi, perbaikan skema database v6.5,
            dan optimalisasi relasi kunci (Student/Teacher ID).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <DevActionButton
              label="Analyze Schema Quality"
              icon={<Search className="w-5 h-5" />}
              variant="primary"
              confirmMessage="Apakah Anda yakin ingin memindai seluruh koleksi database? Tindakan ini aman karena Read-Only."
              onAction={async () => await analyzeSchemaQuality(TABEL_SISTEM, console.log)}
            />
          </div>
          <div className="flex-1">
            <DevActionButton
              label="Offline-First Legacy Migration V7.8"
              icon={<ArrowPathIcon className="w-5 h-5" />}
              variant="success"
              confirmMessage="Apakah Anda yakin ingin mengimpor seluruh data Firestore legacy ke IndexedDB (Dexie) sesuai dengan kontrak Enterprise Data Dictionary V7.8?"
              onAction={async () => {
                const toastId = toast.loading('Mengimpor data legacy ke Dexie...');
                try {
                  const summary = await importAll();
                  toast.success(
                    `Migrasi Sukses! Diimpor: ${summary.totalSuccess} data (User: ${summary.users.successCount}, Siswa: ${summary.students.successCount}, Guru: ${summary.teachers.successCount}, Kelas: ${summary.classes.successCount}, Presensi: ${summary.attendance.successCount}, Poin: ${summary.points.successCount}) dalam ${summary.durationMs}ms`,
                    { id: toastId, duration: 10000 }
                  );
                } catch (err: any) {
                  toast.error(`Migrasi Gagal: ${err.message}`, { id: toastId });
                }
              }}
            />
          </div>
        </div>

        <DevActionButton
          label="4. Migrasi Skema Database"
          icon={<ArrowPathIcon className="w-5 h-5" />}
          variant="success"
          confirmMessage="Migrasikan skema bidang database? Operasi ini akan menyelaraskan ID dan rombel."
          onAction={executeDatabaseSchemaMigration}
        />

        <DevActionButton
          label="5. Migrasi Profile Requests"
          icon={<UserIcon className="w-5 h-5" />}
          variant="danger"
          confirmMessage="Yakin ingin memindahkan data dari profile_update_requests ke database siswa dan menghapus requestnya?"
          onAction={async () => await migrateProfileUpdateRequestsData(console.log)}
        />

        <DevActionButton
          label="5. Pemindahan Field Siswa ke students"
          icon={<UsersGroupIcon className="w-5 h-5" />}
          variant="primary"
          confirmMessage="Yakin ingin memindahkan bidang spesifik siswa dari koleksi users ke students?"
          onAction={async () => await migrateUserDataToStudents(console.log)}
        />

        <DevActionButton
          label="6. Migrasi RBAC (Multi-Role)"
          icon={<ShieldCheckIcon className="w-5 h-5" />}
          variant="danger"
          confirmMessage="Yakin ingin memigrasikan semua pengguna ke struktur RBAC baru?"
          onAction={async () => await migrateToNewRBAC(console.log)}
        />
      </div>
    </div>
  );
};
