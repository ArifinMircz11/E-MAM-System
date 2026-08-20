import React from 'react';
import * as Icons from '@/shared/Icons';

/**
 * SCHEMA EXPLORER COMPONENT
 * 
 * Modul untuk menjelajahi struktur field dan tipe data dari setiap koleksi.
 * Membantu pengembang memahami model data yang sedang aktif di sistem.
 */

interface CollectionAudit {
  name: string;
  docCount: number;
  fields: any[];
  qualityScore: number;
}

interface SchemaExplorerProps {
  scanData: Record<string, CollectionAudit>;
  selectedCollection: string;
  setSelectedCollection: (col: string) => void;
  FIRESTORE_COLLECTIONS: string[];
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({ 
  scanData, 
  selectedCollection, 
  setSelectedCollection, 
  FIRESTORE_COLLECTIONS 
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-indigo-700 dark:text-indigo-400">
        <h4 className="text-xs font-bold uppercase flex items-center gap-1.5 font-sans">
          <Icons.InfoIcon className="w-4 h-4" />
          Panduan Penjelajah Skema
        </h4>
        <p className="text-[10px] leading-relaxed mt-1 font-sans font-medium">
          Gunakan menu ini untuk memilih salah satu dari koleksi database dan melihat skema detail struktur field-field di dalamnya, cakupan pengisian data, serta tipe data yang diamati.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Selector Sidebar */}
        <div className="bg-white dark:bg-[#0B1124] p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm max-h-[500px] overflow-y-auto custom-scrollbar">
          <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 px-1">Select Collection</h3>
          <div className="space-y-1">
            {FIRESTORE_COLLECTIONS.map((col) => (
              <button
                key={col}
                onClick={() => setSelectedCollection(col)}
                className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold transition flex items-center justify-between ${selectedCollection === col ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
              >
                <span className="font-mono">{col}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${selectedCollection === col ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {scanData[col]?.docCount ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Schema Viewer Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0B1124] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-white font-mono">{selectedCollection} Schema</h3>
              <p className="text-[9px] text-slate-400">Inspecting field coverage, types and nullable variables</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Quality Score</span>
              <span className="text-sm font-bold text-emerald-500">{scanData[selectedCollection]?.qualityScore ?? 100}/100</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[8px] font-bold uppercase tracking-wide text-slate-400">
                  <th className="p-2">Field</th>
                  <th className="p-2">Observed Type</th>
                  <th className="p-2 text-center">Coverage</th>
                  <th className="p-2 text-center">Missing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                {(scanData[selectedCollection]?.fields || []).map((f) => (
                  <tr key={f.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="p-2 font-mono font-bold text-slate-700 dark:text-slate-300">{f.name}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[9px]">{f.type}</span>
                    </td>
                    <td className="p-2 text-center font-bold">{f.coverage}%</td>
                    <td className="p-2 text-center text-rose-500">{f.missingCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
