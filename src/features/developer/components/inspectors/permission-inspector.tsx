import React from 'react';
import { sessionProvider } from '@/core/auth/session-provider';

/**
 * PERMISSION INSPECTOR
 * 
 * Debug tool untuk melihat daftar permission yang dimiliki user saat ini.
 */

export const PermissionInspector: React.FC = () => {
  const context = sessionProvider.getContext();
  const permissions = Array.from(context.permissions);

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-1">
        <span className="text-indigo-500 text-[10px] font-bold uppercase tracking-wide">Permission Inspector</span>
        <span className="text-slate-500 text-[10px]">{permissions.length} perms</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
        {permissions.map(perm => (
          <div key={perm} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-indigo-300 truncate">
            {perm}
          </div>
        ))}
        {permissions.length === 0 && (
          <div className="col-span-2 text-center py-4 text-slate-600 text-[10px]">No permissions assigned.</div>
        )}
      </div>
    </div>
  );
};
