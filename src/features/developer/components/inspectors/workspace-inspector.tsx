import React from 'react';
import { WorkspaceResolver } from '@/core/workspace/workspace.resolver';
import { sessionProvider } from '@/core/auth/session-provider';

/**
 * WORKSPACE INSPECTOR
 * 
 * Debug tool untuk melihat status workspace aktif.
 */

export const WorkspaceInspector: React.FC = () => {
  const context = sessionProvider.getContext();
  const workspace = WorkspaceResolver.getActiveDefinition(context);

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-1">
        <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wide">Workspace Inspector</span>
        <span className="text-slate-500 text-[10px]">Active Shell</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-${workspace.color}-500/20 flex items-center justify-center text-${workspace.color}-500`}>
            {/* Icon placeholder since we don't have Lucide dynamic rendering here easily */}
            <span className="font-bold">{workspace.id[0]}</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">{workspace.label}</h4>
            <p className="text-[10px] text-slate-500 font-mono">{workspace.basePath}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="block text-[8px] text-slate-500 uppercase font-bold">Workspace ID</span>
            <span className="text-[10px] font-mono text-amber-400">{workspace.id}</span>
          </div>
          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="block text-[8px] text-slate-500 uppercase font-bold">Default View</span>
            <span className="text-[10px] font-mono text-amber-400">{workspace.defaultView}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
