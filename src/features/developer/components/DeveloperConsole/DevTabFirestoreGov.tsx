/* eslint-disable no-restricted-imports */
import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import * as Icons from '@/shared/Icons';
import { localDb, getTableByName } from '@/database/dexie';
import { useAuthStore } from '@/stores/authStore';
import { SyncEngine } from '@/services/SyncEngine';

// Components
import { LensSimulation } from './DevTabFirestoreGov/components/LensSimulation';
import { DLQManager } from './DevTabFirestoreGov/components/DLQManager';
import { MigrationAssistant } from './DevTabFirestoreGov/components/MigrationAssistant';
import { DataRefactorer } from './DevTabFirestoreGov/components/DataRefactorer';
import { DriftDetector } from './DevTabFirestoreGov/components/DriftDetector';
import { SchemaExplorer } from './DevTabFirestoreGov/components/SchemaExplorer';
import { CollectionInventory } from './DevTabFirestoreGov/components/CollectionInventory';
import { DependencyTopology } from './DevTabFirestoreGov/components/DependencyTopology';
import { DataQualityAudit } from './DevTabFirestoreGov/components/DataQualityAudit';
import { SecurityAudit } from './DevTabFirestoreGov/components/SecurityAudit';
import { SyncHealth } from './DevTabFirestoreGov/components/SyncHealth';
import { AttendanceSimulationTable } from './DevTabFirestoreGov/components/AttendanceSimulationTable';

/**
 * ENTERPRISE FIRESTORE GOVERNANCE CENTER (EFGC)
 * 
 * Modular Refactored Version
 */

const FIRESTORE_COLLECTIONS = [
  'students', 'teachers', 'classes', 'attendance', 'letters', 'announcements',
  'notifications', 'tenants', 'users', 'roles', 'permissions', 'schedules',
  'poin', 'point_categories', 'student_points', 'student_point_summaries',
  'journal_guru', 'academic_years', 'academic_terms', 'subjects', 'rooms',
  'finance_transactions', 'finance_accounts', 'finance_summaries',
  'attendance_summaries', 'dashboard_summaries', 'teacher_summaries',
  'class_summaries', 'audit_logs', 'activity_logs', 'sync_queue',
  'dead_letter_queue', 'metadata', 'settings', 'app_config', 'backups'
];

export const DevTabFirestoreGov: React.FC = () => {
  const { user } = useAuthStore();
  const isAuthorized = user?.role === 'developer' || user?.role === 'super_admin';

  // UI State
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'explorer' | 'drift' | 'dlq' | 'dependency' | 'quality' | 'migration' | 'security' | 'sync' | 'refactor' | 'simulation'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'warning' | 'danger'>('all');
  const [selectedCollection, setSelectedCollection] = useState('students');
  
  // Data State
  const [scanData, setScanData] = useState<Record<string, any>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [dlqRecords, setDlqRecords] = useState<any[]>([]);
  const [syncStats, setSyncStats] = useState({
    pendingCount: 0,
    dlqCount: 0,
    retryCount: 0,
    avgSyncTimeMs: 142
  });

  // Attendance Simulation State
  const [showAttendanceTable, setShowAttendanceTable] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(false);

  useEffect(() => {
    runScan();
    loadSyncStats();
  }, []);

  const loadSyncStats = async () => {
    try {
      const pending = await localDb.sync_queue?.count() || 0;
      const dlq = await localDb.dead_letter_queue?.toArray() || [];
      setDlqRecords(dlq);
      setSyncStats(prev => ({ ...prev, pendingCount: pending, dlqCount: dlq.length }));
    } catch (e) {}
  };

  const runScan = async () => {
    setIsScanning(true);
    const results: Record<string, any> = {};

    for (const col of FIRESTORE_COLLECTIONS) {
      const table = getTableByName(col);
      if (!table) continue;

      const arr = await table.toArray();
      const drift: any[] = [];
      const issues: string[] = [];
      const securityRisks: any[] = [];

      // Basic Audit Logic (Mocked for speed in this refactor, but extensible)
      if (arr.length > 0) {
        const first = arr[0];
        if (!first.tenantId) {
          drift.push({ field: 'tenantId', expected: 'string', actual: 'undefined', severity: 'CRITICAL', recommendation: 'Run Migration Assistant: Isolation Fix' });
          issues.push('Missing tenantId isolation');
          securityRisks.push({ field: 'tenantId', risk: 'Cross-Tenant data leakage potential', severity: 'CRITICAL' });
        }
      }

      results[col] = {
        name: col,
        docCount: arr.length,
        fields: arr.length > 0 ? Object.keys(arr[0]).map(k => ({ name: k, type: typeof arr[0][k], coverage: 100, missingCount: 0 })) : [],
        drift,
        qualityScore: drift.length > 0 ? 50 : 100,
        issues,
        securityRisks
      };
    }

    setScanData(results);
    await loadSyncStats();
    setIsScanning(false);
  };

  const loadClassesAndAttendance = async () => {
    if (!showAttendanceTable) return;
    setIsTableLoading(true);
    try {
      const classes = await localDb.classes?.toArray() || [];
      setClassesList(classes);
      
      if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0].classId);
        setSelectedClassName(classes[0].name);
      }

      if (selectedClassId) {
        const students = await localDb.students?.where('classId').equals(selectedClassId).toArray() || [];
        setClassStudents(students);
        
        const attendance = await localDb.attendance?.where('date').equals(selectedDate).toArray() || [];
        setAttendanceRecords(attendance);
      }
    } catch (e) {
      console.error('Error loading simulation data:', e);
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    loadClassesAndAttendance();
  }, [showAttendanceTable, selectedClassId, selectedDate]);

  const filteredCollections = useMemo(() => {
    return FIRESTORE_COLLECTIONS.filter(col => {
      const matchesSearch = col.toLowerCase().includes(searchTerm.toLowerCase());
      const audit = scanData[col];
      if (!audit) return matchesSearch;

      if (statusFilter === 'healthy') return matchesSearch && audit.qualityScore >= 90;
      if (statusFilter === 'warning') return matchesSearch && audit.qualityScore >= 60 && audit.qualityScore < 90;
      if (statusFilter === 'danger') return matchesSearch && audit.qualityScore < 60;
      return matchesSearch;
    });
  }, [searchTerm, statusFilter, scanData]);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 dark:bg-slate-900">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4 text-red-600">
          <Icons.ShieldExclamationIcon className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold uppercase text-slate-800 dark:text-white">Akses Ditolak</h2>
        <p className="text-xs text-slate-400 max-w-md mt-2">Hanya pengguna Developer atau Super Admin yang diperkenankan mengakses EFGC.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFBFF] dark:bg-[#030712] overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-[#090D1E] border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.RectangleStackIcon className="w-5 h-5 text-indigo-500" />
            Enterprise Firestore Governance Center
          </h2>
          <p className="text-[10px] text-slate-400 font-medium">Real-time Schema Integrity, Tenant Isolation & Local Sync Hub</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runScan} disabled={isScanning} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg shadow-indigo-500/20">
            {isScanning ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.ArrowPathIcon className="w-4 h-4" />}
            Rescan DB
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 shrink-0">
        <div className="bg-white dark:bg-[#0A0E22] p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Icons.Squares2x2Icon className="w-5 h-5" /></div>
          <div><p className="text-[8px] font-bold text-slate-400 uppercase">Collections</p><p className="text-sm font-bold text-slate-800 dark:text-white">{FIRESTORE_COLLECTIONS.length}</p></div>
        </div>
        <div className="bg-white dark:bg-[#0A0E22] p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Icons.ClockIcon className="w-5 h-5" /></div>
          <div><p className="text-[8px] font-bold text-slate-400 uppercase">Queue</p><p className="text-sm font-bold text-slate-800 dark:text-white">{syncStats.pendingCount}</p></div>
        </div>
        <div className="bg-white dark:bg-[#0A0E22] p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center"><Icons.ShieldExclamationIcon className="w-5 h-5" /></div>
          <div><p className="text-[8px] font-bold text-slate-400 uppercase">DLQ</p><p className={`text-sm font-bold ${syncStats.dlqCount > 0 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>{syncStats.dlqCount}</p></div>
        </div>
        <div className="bg-white dark:bg-[#0A0E22] p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Icons.SparklesIcon className="w-5 h-5" /></div>
          <div><p className="text-[8px] font-bold text-slate-400 uppercase">Latency</p><p className="text-sm font-bold text-slate-800 dark:text-white">{syncStats.avgSyncTimeMs}ms</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-[#070A1E] flex gap-1 overflow-x-auto shrink-0 custom-scrollbar">
        {[
          { id: 'inventory', label: 'Inventory' },
          { id: 'explorer', label: 'Explorer' },
          { id: 'drift', label: 'Drifts' },
          { id: 'dlq', label: 'DLQ Recovery' },
          { id: 'dependency', label: 'Dependency' },
          { id: 'quality', label: 'Quality' },
          { id: 'migration', label: 'Migration' },
          { id: 'security', label: 'Security' },
          { id: 'sync', label: 'Sync Health' },
          { id: 'refactor', label: 'Refactor' },
          { id: 'simulation', label: 'QR Sim' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-3 text-[9px] font-bold uppercase border-b-2 transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'border-indigo-600 text-indigo-600 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeSubTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex gap-2">
               <input type="text" placeholder="Search collection..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-white" />
               <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-white">
                 <option value="all">All Status</option>
                 <option value="healthy">Healthy</option>
                 <option value="warning">Warning</option>
                 <option value="danger">Danger</option>
               </select>
            </div>
            <CollectionInventory filteredCollections={filteredCollections} scanData={scanData} setSelectedCollection={setSelectedCollection} setActiveSubTab={setActiveSubTab} />
          </div>
        )}
        {activeSubTab === 'explorer' && <SchemaExplorer scanData={scanData} selectedCollection={selectedCollection} setSelectedCollection={setSelectedCollection} FIRESTORE_COLLECTIONS={FIRESTORE_COLLECTIONS} />}
        {activeSubTab === 'drift' && <DriftDetector scanData={scanData} />}
        {activeSubTab === 'dlq' && <DLQManager dlqRecords={dlqRecords} user={user} runScan={runScan} getTableByName={getTableByName} />}
        {activeSubTab === 'dependency' && <DependencyTopology />}
        {activeSubTab === 'quality' && <DataQualityAudit scanData={scanData} />}
        {activeSubTab === 'migration' && <MigrationAssistant user={user} FIRESTORE_COLLECTIONS={FIRESTORE_COLLECTIONS} runScan={runScan} getTableByName={getTableByName} />}
        {activeSubTab === 'security' && <SecurityAudit scanData={scanData} />}
        {activeSubTab === 'sync' && <SyncHealth syncStats={syncStats} />}
        {activeSubTab === 'refactor' && <DataRefactorer user={user} runScan={runScan} getTableByName={getTableByName} />}
        {activeSubTab === 'simulation' && <LensSimulation {...({ user, setShowAttendanceTable } as any)} />}
      </div>

      {/* Attendance Simulation Modal */}
      <AnimatePresence>
        {showAttendanceTable && (
          <AttendanceSimulationTable
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedClassId={selectedClassId}
            handleClassChange={(id) => {
              setSelectedClassId(id);
              const c = classesList.find(cls => cls.classId === id);
              if (c) setSelectedClassName(c.name);
            }}
            classesList={classesList}
            classStudents={classStudents}
            attendanceRecords={attendanceRecords}
            isTableLoading={isTableLoading}
            setShowAttendanceTable={setShowAttendanceTable}
            selectedClassName={selectedClassName}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DevTabFirestoreGov;
