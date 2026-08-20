import React from 'react';

/**
 * SECURITY AUDIT COMPONENT
 * 
 * Modul untuk mengaudit kepatuhan keamanan data dan isolasi multi-tenant.
 * Membantu mengidentifikasi potensi kebocoran data antar tenant atau field sensitif yang terbuka.
 */

interface SecurityRisk {
  field: string;
  risk: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface CollectionAudit {
  name: string;
  docCount: number;
  securityRisks: SecurityRisk[];
}

interface SecurityAuditProps {
  scanData: Record<string, CollectionAudit>;
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({ scanData }) => {
  const allRisks = Object.entries(scanData).flatMap(([col, audit]) =>
    audit.securityRisks.map((risk) => ({ ...risk, collection: col }))
  );

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#0B1124] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-white">Active Database Security & Compliance Audit</h3>
          <p className="text-[9px] text-slate-400 mt-0.5">Auditing multi-tenant boundaries and audit logs integrity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[8px] font-bold uppercase tracking-wide text-slate-400">
                <th className="p-3">Collection</th>
                <th className="p-3">Compliance Field</th>
                <th className="p-3">Detected Security Vulnerability</th>
                <th className="p-3">Severity Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              {allRisks.map((risk, idx) => (
                <tr key={`${risk.collection}_${risk.field}_${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                  <td className="p-3 font-mono font-bold text-slate-800 dark:text-white">{risk.collection}</td>
                  <td className="p-3 font-mono text-rose-500 font-bold">{risk.field}</td>
                  <td className="p-3 text-[10px] font-semibold">{risk.risk}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase ${risk.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-amber-500/10 text-amber-500'}`}>
                      {risk.severity}
                    </span>
                  </td>
                </tr>
              ))}
              {allRisks.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 font-bold">
                    🔒 Compliance checks passed. Multi-Tenant isolation model is strictly protected.
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
