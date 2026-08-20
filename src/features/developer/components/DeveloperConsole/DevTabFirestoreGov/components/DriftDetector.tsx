import React from 'react';
import * as Icons from '@/shared/Icons';

/**
 * DRIFT DETECTOR COMPONENT
 * 
 * Modul untuk mendeteksi perbedaan (drift) antara data lokal dengan skema yang diharapkan.
 * Membantu mengidentifikasi inkonsistensi struktur data yang dapat menyebabkan kegagalan sinkronisasi.
 */

interface DriftItem {
  field: string;
  expected: string;
  actual: string;
  affected: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
}

interface CollectionAudit {
  name: string;
  docCount: number;
  fields: any[];
  drift: DriftItem[];
  qualityScore: number;
  issues: string[];
}

interface DriftDetectorProps {
  scanData: Record<string, CollectionAudit>;
}

export const DriftDetector: React.FC<DriftDetectorProps> = ({ scanData }) => {
  const allDrifts = Object.entries(scanData).flatMap(([col, audit]) =>
    audit.drift.map((item) => ({ ...item, collection: col }))
  );

  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-500">
        <h4 className="text-xs font-bold uppercase flex items-center gap-1.5">
          <Icons.ShieldExclamationIcon className="w-4 h-4" /> Schema Drift Warning
        </h4>
        <p className="text-[10px] leading-relaxed mt-1">
          Drifts happen when live IndexedDB (Dexie) or Firestore data does not conform strictly to the TypeScript interface, Zod schemas, or DB model validators. Fix these using the automatic Migration Assistant.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0B1124] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-white">Active Schema Drifts Registered</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[8px] font-bold uppercase tracking-wide text-slate-400">
                <th className="p-3">Collection</th>
                <th className="p-3">Field</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              {allDrifts.map((item, idx) => (
                <tr key={`${item.collection}_${item.field}_${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                  <td className="p-3 font-mono font-bold text-slate-800 dark:text-white">{item.collection}</td>
                  <td className="p-3 font-mono font-bold text-amber-600">{item.field}</td>
                  <td className="p-3 font-mono text-[9px]">{item.expected}</td>
                  <td className="p-3 font-mono text-rose-500 text-[9px]">{item.actual}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${item.severity === 'HIGH' || item.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="p-3 text-[9px] leading-relaxed text-slate-500">{item.recommendation}</td>
                </tr>
              ))}
              {allDrifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 font-bold">
                    🎉 Zero Schema Drifts Detected. All models are perfectly aligned!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
