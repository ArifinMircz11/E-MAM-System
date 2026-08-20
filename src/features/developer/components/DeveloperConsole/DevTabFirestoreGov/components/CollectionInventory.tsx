import React from 'react';
import * as Icons from '@/shared/Icons';

/**
 * COLLECTION INVENTORY COMPONENT
 * 
 * Modul untuk melihat daftar seluruh koleksi yang tersedia di sistem.
 * Menampilkan ringkasan status kesehatan data dan jumlah dokumen lokal.
 */

interface CollectionAudit {
  name: string;
  docCount: number;
  fields: any[];
  drift: any[];
  qualityScore: number;
}

interface CollectionInventoryProps {
  filteredCollections: string[];
  scanData: Record<string, CollectionAudit>;
  setSelectedCollection: (col: string) => void;
  setActiveSubTab: (tab: any) => void;
}

export const CollectionInventory: React.FC<CollectionInventoryProps> = ({ 
  filteredCollections, 
  scanData, 
  setSelectedCollection, 
  setActiveSubTab 
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-indigo-700 dark:text-indigo-400">
        <h4 className="text-xs font-bold uppercase flex items-center gap-1.5 font-sans">
          <Icons.InfoIcon className="w-4 h-4" />
          Panduan Inventaris Koleksi
        </h4>
        <p className="text-[10px] leading-relaxed mt-1 font-sans font-medium">
          Bagian ini menampilkan daftar seluruh koleksi Firestore beserta jumlah dokumen lokal yang tersimpan. Status <strong>Healthy</strong> menandakan skema data lokal Anda sinkron sempurna.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0B1124] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 text-[8px] font-bold uppercase tracking-wide text-slate-400">
                <th className="p-3">Collection Name</th>
                <th className="p-3 text-center">Docs Cached</th>
                <th className="p-3 text-center">Fields</th>
                <th className="p-3 text-center">Drifts</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              {filteredCollections.map((col) => {
                const audit = scanData[col];
                const docCount = audit?.docCount ?? 0;
                const fieldsCount = audit?.fields?.length ?? 0;
                const driftCount = audit?.drift?.length ?? 0;
                const score = audit?.qualityScore ?? 100;

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500/10 text-emerald-500">Healthy</span>
                );
                if (score < 60) statusBadge = <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-red-500/10 text-red-500">Danger</span>;
                else if (score < 90) statusBadge = <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-500/10 text-amber-500">Warning</span>;

                return (
                  <tr key={col} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition">
                    <td className="p-3 font-mono text-[10px] font-bold text-slate-800 dark:text-white">{col}</td>
                    <td className="p-3 text-center font-bold">{docCount}</td>
                    <td className="p-3 text-center">{fieldsCount}</td>
                    <td className="p-3 text-center text-rose-500 font-bold">{driftCount}</td>
                    <td className="p-3">{statusBadge}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedCollection(col);
                          setActiveSubTab('explorer');
                        }}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white transition rounded-lg text-[9px] font-bold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
