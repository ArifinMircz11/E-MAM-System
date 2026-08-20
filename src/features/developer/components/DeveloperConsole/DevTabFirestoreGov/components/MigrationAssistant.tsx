import React, { useState } from 'react';
import * as Icons from '@/shared/Icons';

/**
 * MIGRATION ASSISTANT COMPONENT
 * 
 * Modul untuk menjalankan skrip migrasi data lokal di IndexedDB (Dexie).
 * Membantu memperbaiki skema data yang tidak konsisten atau melakukan backfill field.
 */

interface MigrationAssistantProps {
  user: any;
  FIRESTORE_COLLECTIONS: string[];
  runScan: () => Promise<void>;
  getTableByName: (colName: string) => any;
}

export const MigrationAssistant: React.FC<MigrationAssistantProps> = ({ 
  user, 
  FIRESTORE_COLLECTIONS, 
  runScan, 
  getTableByName 
}) => {
  const [selectedMigration, setSelectedMigration] = useState<string>('students_classname');
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [isExecutingMigration, setIsExecutingMigration] = useState(false);

  const executeMigration = async () => {
    setIsExecutingMigration(true);
    setMigrationLogs([]);
    const logger = (msg: string) => {
      setMigrationLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      if (selectedMigration === 'students_classname') {
        logger('Starting migration: Populate className for Students...');
        const studentsTable = getTableByName('students');
        const classesTable = getTableByName('classes');

        if (!studentsTable || !classesTable) {
          throw new Error("Local tables 'students' or 'classes' not available.");
        }

        const students = await studentsTable.toArray();
        const classes = await classesTable.toArray();
        logger(`Fetched ${students.length} students and ${classes.length} classes from Dexie.`);

        const classMap = new Map(classes.map((c: any) => [c.id, c.name]));
        let updatedCount = 0;

        for (const student of students) {
          if (!student.className && student.classId) {
            const className = classMap.get(student.classId);
            if (className) {
              await studentsTable.update(student.id, { className });
              updatedCount++;
            }
          } else if (!student.className) {
            await studentsTable.update(student.id, { className: 'Unassigned' });
            updatedCount++;
          }
        }
        logger(`Successfully backfilled className for ${updatedCount} students.`);
      } else if (selectedMigration === 'tenant_backfill') {
        logger('Starting migration: Repairing Missing tenantId across all records...');
        const activeTenantId = user?.tenantId || 'global';
        logger(`Current Active Tenant Target: ${activeTenantId}`);

        let totalUpdated = 0;
        for (const col of FIRESTORE_COLLECTIONS) {
          const table = getTableByName(col);
          if (table) {
            const records = await table.toArray();
            let updatedInTable = 0;
            for (const rec of records) {
              if (!rec.tenantId) {
                await table.update(rec.id, { tenantId: activeTenantId });
                updatedInTable++;
              }
            }
            if (updatedInTable > 0) {
              logger(`Updated ${updatedInTable} records in collection '${col}'.`);
              totalUpdated += updatedInTable;
            }
          }
        }
        logger(`Global Isolation Complete. Backfilled ${totalUpdated} records.`);
      }

      logger('Success: Dexie IndexedDB update complete. Flushing sync caches.');
      await runScan();
    } catch (e: any) {
      logger(`Error executing migration: ${e.message}`);
    } finally {
      setIsExecutingMigration(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Migration Configurator */}
      <div className="bg-white dark:bg-[#0B1124] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-white">Active Migration Assistant</h3>
          <p className="text-[9px] text-slate-400">Backfill schema variables, fix isolation models and purge drifts</p>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-bold uppercase text-slate-400 block">Select Script Target</label>
          <select
            value={selectedMigration}
            onChange={(e) => setSelectedMigration(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 dark:text-white"
          >
            <option value="students_classname">Students: Populate className from classId</option>
            <option value="tenant_backfill">Global: Backfill Missing tenantId (Isolation Fix)</option>
            <option value="attendance_date_fix">Attendance: Normalize Date String Format</option>
          </select>
        </div>

        <button
          onClick={executeMigration}
          disabled={isExecutingMigration}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          {isExecutingMigration ? (
            <Icons.Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Icons.SparklesIcon className="w-4 h-4" />
              Jalankan Skrip Migrasi
            </>
          )}
        </button>

        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 text-[9px] font-medium leading-relaxed">
          ⚠️ <strong>PERINGATAN:</strong> Migrasi data bersifat destruktif pada tingkat record lokal. 
          Pastikan Anda telah melakukan backup data sebelum menjalankan skrip skala besar.
        </div>
      </div>

      {/* Migration Logs */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col h-[400px]">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h4 className="text-[10px] font-bold uppercase text-slate-500">Live Migration Logs</h4>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {migrationLogs.length} entries
          </span>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[9px] text-emerald-400 space-y-1 custom-scrollbar">
          {migrationLogs.map((log, idx) => (
            <div key={idx} className="border-l border-slate-800 pl-2 ml-1">
              {log}
            </div>
          ))}
          {migrationLogs.length === 0 && (
            <div className="text-slate-700 italic">Antrean log kosong. Menunggu eksekusi...</div>
          )}
        </div>
      </div>
    </div>
  );
};
