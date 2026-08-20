import React from 'react';

/**
 * DATA QUALITY AUDIT COMPONENT
 * 
 * Modul untuk memantau skor kualitas data di setiap koleksi.
 * Menampilkan ringkasan isu integritas dan pemenuhan skema secara visual.
 */

interface CollectionAudit {
  name: string;
  docCount: number;
  fields: any[];
  drift: any[];
  qualityScore: number;
  issues: string[];
}

interface DataQualityAuditProps {
  scanData: Record<string, CollectionAudit>;
}

export const DataQualityAudit: React.FC<DataQualityAuditProps> = ({ scanData }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(scanData).map(([col, audit]) => {
          if (audit.docCount === 0) return null;
          return (
            <div key={col} className="bg-white dark:bg-[#0B1124] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-bold text-slate-800 dark:text-white text-[11px]">{col}</span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${audit.qualityScore >= 90 ? 'bg-emerald-500/10 text-emerald-500' : audit.qualityScore >= 60 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                  {audit.qualityScore}% Quality
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full rounded-full ${audit.qualityScore >= 90 ? 'bg-emerald-500' : audit.qualityScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${audit.qualityScore}%` }}
                />
              </div>

              {audit.issues.length === 0 ? (
                <p className="text-[9px] text-slate-400 font-semibold">🎉 Excellent. Perfect structural integrity.</p>
              ) : (
                <ul className="space-y-1">
                  {audit.issues.map((iss, idx) => (
                    <li key={idx} className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-rose-500" />
                      {iss}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
