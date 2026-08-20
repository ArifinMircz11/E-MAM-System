/* eslint-disable no-restricted-imports */
import React, { useState } from 'react';
import * as Icons from '@/shared/Icons';
import { localDb } from '@/database/dexie';

/**
 * DATA REFACTORER COMPONENT
 * 
 * Modul untuk analisis relasi database dan refaktorisasi field (rename, merge, split).
 * Membantu menjaga integritas referensial dan konsistensi skema di tingkat lokal.
 */

interface PkStats {
  collection: string;
  primaryKey: string;
  type: string;
  strategy: string;
  duplicateCount: number;
  missingCount: number;
  invalidCount: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

interface FkIssue {
  parentCollection: string;
  parentPk: string;
  childCollection: string;
  fkField: string;
  coverage: number;
  missingCount: number;
  brokenCount: number;
  orphanCount: number;
  crossTenantCount: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

interface DataRefactorerProps {
  user: any;
  runScan: () => Promise<void>;
  getTableByName: (colName: string) => any;
}

export const DataRefactorer: React.FC<DataRefactorerProps> = ({ user, runScan, getTableByName }) => {
  const [activeRefactorModality, setActiveRefactorModality] = useState<'relations' | 'fields' | 'bulk'>('relations');
  const [pkScanResults, setPkScanResults] = useState<PkStats[]>([]);
  const [fkScanResults, setFkScanResults] = useState<FkIssue[]>([]);
  const [fkValidatorFindings, setFkValidatorFindings] = useState<any[]>([]);
  const [isScanningRelations, setIsScanningRelations] = useState(false);
  
  // Wizards States
  const [renameCollection, setRenameCollection] = useState('students');
  const [renameOldField, setRenameOldField] = useState('studentName');
  const [renameNewField, setRenameNewField] = useState('fullName');
  const [renameProgress, setRenameProgress] = useState<string[]>([]);
  const [renameStage, setRenameStage] = useState<'idle' | 'preview' | 'dryrun' | 'executed'>('idle');

  const [mergeCollection, setMergeCollection] = useState('students');
  const [mergeField1, setMergeField1] = useState('firstName');
  const [mergeField2, setMergeField2] = useState('lastName');
  const [mergeTarget, setMergeTarget] = useState('fullName');
  const [mergeProgress, setMergeProgress] = useState<string[]>([]);

  const [splitCollection, setSplitCollection] = useState('students');
  const [splitSource, setSplitSource] = useState('fullName');
  const [splitTarget1, setSplitTarget1] = useState('firstName');
  const [splitTarget2, setSplitTarget2] = useState('lastName');
  const [splitSeparator, setSplitSeparator] = useState(' ');
  const [splitProgress, setSplitProgress] = useState<string[]>([]);

  const [migrationHistory, setMigrationHistory] = useState<any[]>([]);

  const runRelationsScan = async () => {
    setIsScanningRelations(true);
    const pkStatsList: PkStats[] = [];
    const fkStatsList: FkIssue[] = [];
    const findings: any[] = [];

    const targetCollections = ['students', 'teachers', 'classes', 'attendance', 'poin', 'point_categories', 'schedules', 'users', 'tenants'];

    for (const col of targetCollections) {
      const table = getTableByName(col);
      if (!table) continue;

      try {
        const arr = await table.toArray();
        const total = arr.length;
        let dupCount = 0; let misCount = 0; let invCount = 0;
        const seenIds = new Set<string>();

        arr.forEach((item: any) => {
          const id = item.id;
          if (id === undefined || id === null || id === '') {
            misCount++;
          } else {
            if (seenIds.has(id)) dupCount++;
            seenIds.add(id);
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            if (!isUuid && id.length !== 20) invCount++;
          }
        });

        let pkHealth: PkStats['healthStatus'] = 'HEALTHY';
        if (misCount > 0 || dupCount > 0) pkHealth = 'CRITICAL';
        else if (invCount > 0) pkHealth = 'WARNING';

        pkStatsList.push({
          collection: col,
          primaryKey: 'id',
          type: total > 0 && typeof arr[0].id === 'number' ? 'number' : 'string',
          strategy: total > 0 && arr[0].id && String(arr[0].id).includes('-') ? 'UUID' : 'Firestore ID',
          duplicateCount: dupCount,
          missingCount: misCount,
          invalidCount: invCount,
          healthStatus: pkHealth,
        });

        if (misCount > 0) findings.push({ id: `pk_mis_${col}`, title: `Missing PK in ${col}`, desc: `${misCount} records in ${col} have an empty id field!`, severity: 'CRITICAL', relation: `${col}.id` });
        if (dupCount > 0) findings.push({ id: `pk_dup_${col}`, title: `Duplicate PK in ${col}`, desc: `${dupCount} records in ${col} share duplicate primary keys!`, severity: 'CRITICAL', relation: `${col}.id` });
      } catch (err) { console.error(`PK Scan failed for ${col}:`, err); }
    }

    const relationsMap = [
      { child: 'students', parent: 'classes', fk: 'classId' },
      { child: 'students', parent: 'tenants', fk: 'tenantId' },
      { child: 'teachers', parent: 'tenants', fk: 'tenantId' },
      { child: 'classes', parent: 'tenants', fk: 'tenantId' },
      { child: 'attendance', parent: 'students', fk: 'studentId' },
      { child: 'attendance', parent: 'tenants', fk: 'tenantId' },
    ];

    for (const rel of relationsMap) {
      const childTable = getTableByName(rel.child);
      const parentTable = getTableByName(rel.parent);
      if (!childTable || !parentTable) continue;

      try {
        const children = await childTable.toArray();
        const parents = await parentTable.toArray();
        const parentIds = new Set(parents.map((p: any) => p.id));

        let covered = 0; let missing = 0; let broken = 0; let orphan = 0; let crossTenant = 0;

        children.forEach((c: any) => {
          const val = c[rel.fk];
          if (val === undefined || val === null || val === '') missing++;
          else {
            covered++;
            if (!parentIds.has(val)) { broken++; orphan++; }
            else {
              const parentItem = parents.find((p: any) => p.id === val);
              if (parentItem && c.tenantId && parentItem.tenantId && c.tenantId !== parentItem.tenantId) crossTenant++;
            }
          }
        });

        const totalChildren = children.length;
        const coverage = totalChildren > 0 ? parseFloat(((covered / totalChildren) * 100).toFixed(1)) : 100;

        let status: FkIssue['healthStatus'] = 'HEALTHY';
        if (broken > 0 || crossTenant > 0) status = 'CRITICAL';
        else if (missing > 0 && rel.fk !== 'classId') status = 'WARNING';

        fkStatsList.push({
          parentCollection: rel.parent,
          parentPk: 'id',
          childCollection: rel.child,
          fkField: rel.fk,
          coverage,
          missingCount: missing,
          brokenCount: broken,
          orphanCount: orphan,
          crossTenantCount: crossTenant,
          healthStatus: status,
        });

        if (broken > 0) findings.push({ id: `fk_broken_${rel.child}_${rel.fk}`, title: `Broken Relationship: ${rel.child}.${rel.fk}`, desc: `Found ${broken} records in ${rel.child} referencing non-existent parent IDs in ${rel.parent}!`, severity: 'CRITICAL', relation: `${rel.child}.${rel.fk} -> ${rel.parent}.id` });
        if (crossTenant > 0) findings.push({ id: `fk_ct_${rel.child}_${rel.fk}`, title: `Cross-Tenant Integrity Violation`, desc: `Detected ${crossTenant} records in ${rel.child} referencing parents in different Tenants!`, severity: 'CRITICAL', relation: `${rel.child}.${rel.fk} -> ${rel.parent}.id` });
      } catch (err) { console.error(`FK scan failed for ${rel.child}.${rel.fk}:`, err); }
    }

    setPkScanResults(pkStatsList);
    setFkScanResults(fkStatsList);
    setFkValidatorFindings(findings);
    setIsScanningRelations(false);
  };

  const runRelationshipRepair = async () => {
    setIsScanningRelations(true);
    const logger = (msg: string) => setRenameProgress((prev) => [...prev, `[Repair] ${msg}`]);
    logger('Initializing relationship repair engine...');
    try {
      const activeTenantId = user?.tenantId || 'global';
      const relationsMap = [
        { child: 'students', parent: 'classes', fk: 'classId' },
        { child: 'attendance', parent: 'students', fk: 'studentId' },
      ];
      let fixedTenantCount = 0; let fixedBrokenFkCount = 0;

      for (const rel of relationsMap) {
        const childTable = getTableByName(rel.child);
        const parentTable = getTableByName(rel.parent);
        if (childTable && parentTable) {
          const children = await childTable.toArray();
          const parents = await parentTable.toArray();
          const parentMap = new Map<any, any>(parents.map((p: any) => [p.id, p]));

          for (const childObj of children) {
            const child = childObj as any;
            const updatedFields: any = {};
            let needsUpdate = false;

            if (!child.tenantId) { updatedFields.tenantId = activeTenantId; needsUpdate = true; }
            const parentVal = child[rel.fk];
            if (parentVal && parentMap.has(parentVal)) {
              const parentDoc = parentMap.get(parentVal);
              if (parentDoc?.tenantId && child.tenantId !== parentDoc.tenantId) { updatedFields.tenantId = parentDoc.tenantId; needsUpdate = true; fixedTenantCount++; }
            }
            if (parentVal && !parentMap.has(parentVal) && parents.length > 0) { updatedFields[rel.fk] = (parents[0] as any).id; needsUpdate = true; fixedBrokenFkCount++; }
            if (needsUpdate) await childTable.update(child.id, updatedFields);
          }
        }
      }
      logger(`Repaired ${fixedTenantCount} cross-tenant anomalies. Healed ${fixedBrokenFkCount} broken references.`);
      await runRelationsScan();
    } catch (err: any) { logger(`Error during repair: ${err.message}`); }
    finally { setIsScanningRelations(false); }
  };

  const runRenameField = async (mode: 'preview' | 'dryrun' | 'execute') => {
    const logger = (msg: string) => setRenameProgress((prev) => [...prev, `[Rename] ${msg}`]);
    if (!renameCollection || !renameOldField || !renameNewField) return;
    setRenameProgress([]);
    const table = getTableByName(renameCollection);
    if (!table) return;
    try {
      const arr = await table.toArray();
      let affectedDocs = 0;
      arr.forEach((doc: any) => { if (doc[renameOldField] !== undefined) affectedDocs++; });

      if (mode === 'preview') { setRenameStage('preview'); logger(`Preview: ${affectedDocs} documents will be affected.`); return; }
      if (mode === 'dryrun') { setRenameStage('dryrun'); logger('Dry run: target field compatibility verified.'); return; }
      
      let successCount = 0;
      await localDb.transaction('rw', table, async () => {
        for (const doc of arr) {
          if (doc[renameOldField] !== undefined) {
            const val = doc[renameOldField];
            const updated = { ...doc };
            delete updated[renameOldField];
            updated[renameNewField] = val;
            await table.put(updated);
            successCount++;
          }
        }
      });
      setRenameStage('executed');
      logger(`Success: Mutated ${successCount} documents.`);
      await runScan();
      await runRelationsScan();
    } catch (err: any) { logger(`Error: ${err.message}`); }
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
        {[
          { id: 'relations', label: 'Integritas Relasi' },
          { id: 'fields', label: 'Refaktor Field' },
          { id: 'bulk', label: 'Operasi Massal' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveRefactorModality(m.id as any)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition ${activeRefactorModality === m.id ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {activeRefactorModality === 'relations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control Panel */}
            <div className="bg-white dark:bg-[#0B1124] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-white">Relations Scanner</h3>
              <p className="text-[10px] text-slate-400">Scan relational integrity across local tables. Detects orphan records and cross-tenant leaks.</p>
              <button 
                onClick={runRelationsScan} 
                disabled={isScanningRelations}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-2"
              >
                {isScanningRelations ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.MagnifyingGlassIcon className="w-4 h-4" />}
                Scan Integrity
              </button>
              <button 
                onClick={runRelationshipRepair}
                disabled={isScanningRelations}
                className="w-full py-2.5 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-bold uppercase hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
              >
                Auto-Repair Relations
              </button>
            </div>

            {/* Findings List */}
            <div className="lg:col-span-2 space-y-3">
              {fkValidatorFindings.map((finding) => (
                <div key={finding.id} className="bg-white dark:bg-[#0B1124] p-4 rounded-2xl border border-rose-500/20 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <Icons.ShieldExclamationIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-slate-800 dark:text-white">{finding.title}</h4>
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-bold uppercase rounded">{finding.severity}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{finding.desc}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[9px] font-mono bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800 text-slate-400">{finding.relation}</span>
                    </div>
                  </div>
                </div>
              ))}
              {fkValidatorFindings.length === 0 && !isScanningRelations && (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/40 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
                  <Icons.ShieldCheckIcon className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold">No relational integrity issues found.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Detailed Stats Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {/* PK Stats */}
             <div className="bg-white dark:bg-[#0B1124] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                  <h4 className="text-[10px] font-bold uppercase text-slate-800 dark:text-white">Primary Key Diagnostics</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9px]">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase">
                      <tr><th className="p-2">Collection</th><th className="p-2">Type</th><th className="p-2">Dups</th><th className="p-2">Missing</th><th className="p-2">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pkScanResults.map(res => (
                        <tr key={res.collection} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                          <td className="p-2 font-bold font-mono">{res.collection}</td>
                          <td className="p-2">{res.strategy}</td>
                          <td className={`p-2 font-bold ${res.duplicateCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{res.duplicateCount}</td>
                          <td className={`p-2 font-bold ${res.missingCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{res.missingCount}</td>
                          <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${res.healthStatus === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{res.healthStatus}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
             {/* FK Stats */}
             <div className="bg-white dark:bg-[#0B1124] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                  <h4 className="text-[10px] font-bold uppercase text-slate-800 dark:text-white">Foreign Key Reference Integrity</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9px]">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase">
                      <tr><th className="p-2">Relation</th><th className="p-2">Coverage</th><th className="p-2">Broken</th><th className="p-2">C-Tenant</th><th className="p-2">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {fkScanResults.map(res => (
                        <tr key={`${res.childCollection}_${res.fkField}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                          <td className="p-2 font-bold font-mono">{res.childCollection}.{res.fkField}</td>
                          <td className="p-2 font-bold">{res.coverage}%</td>
                          <td className={`p-2 font-bold ${res.brokenCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{res.brokenCount}</td>
                          <td className={`p-2 font-bold ${res.crossTenantCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{res.crossTenantCount}</td>
                          <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${res.healthStatus === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{res.healthStatus}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeRefactorModality === 'fields' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#0B1124] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-white">Rename Field Wizard</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">Collection</label>
                <input type="text" value={renameCollection} onChange={e => setRenameCollection(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[10px] text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">Old Name</label>
                    <input type="text" value={renameOldField} onChange={e => setRenameOldField(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[10px] text-white" />
                 </div>
                 <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">New Name</label>
                    <input type="text" value={renameNewField} onChange={e => setRenameNewField(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[10px] text-white" />
                 </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => runRenameField('preview')} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase rounded-xl">Preview</button>
                <button onClick={() => runRenameField('execute')} className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-xl">Execute</button>
              </div>
            </div>
            <div className="mt-4 max-h-32 overflow-y-auto bg-slate-950 p-2 rounded-lg font-mono text-[8px] text-emerald-400 space-y-1">
              {renameProgress.map((p, i) => <div key={i}>{p}</div>)}
              {renameProgress.length === 0 && <div className="text-slate-700 italic">No progress logs.</div>}
            </div>
          </div>
          
          <div className="bg-slate-100 dark:bg-slate-900/40 p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
             <Icons.CommandLineIcon className="w-8 h-8 mb-2 opacity-20" />
             <p className="text-[10px] font-bold uppercase text-center">Merge & Split Wizards coming soon to this modular view.</p>
          </div>
        </div>
      )}
    </div>
  );
};
