import React from 'react';
import { sessionProvider } from '@/core/auth/session-provider';

/**
 * IDENTITY INSPECTOR
 * 
 * Debug tool untuk melihat identitas (CanonicalUser) yang sedang aktif.
 */

export const IdentityInspector: React.FC = () => {
  const context = sessionProvider.getContext();
  const user = context.user;

  if (!user) return <div className="text-xs text-red-500">No active identity found.</div>;

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-auto max-h-[400px]">
      <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-1">
        <span className="text-emerald-500 font-bold uppercase">Identity Inspector</span>
        <span className="text-slate-500">{user.status}</span>
      </div>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
};
