import { env } from '@/core/config/env';
import React, { useState, useRef } from 'react';
import type { LogLayer, LogStatus } from '@/stores/developerLogStore';
import { useDeveloperLogStore } from '@/stores/developerLogStore';
import { Terminal, X, Minimize2, Maximize2, Trash2, Pause, Play, Copy, Download, Search } from 'lucide-react';

export const DeveloperLogPanel: React.FC = () => {
  const {
    logs,
    isOpen,
    isCollapsed,
    isPaused,
    filterLayer,
    filterStatus,
    searchQuery,
    clear,
    pause,
    resume,
    copy,
    exportLogs,
    toggle,
    collapse,
    setFilterLayer,
    setFilterStatus,
    setSearchQuery,
  } = useDeveloperLogStore();

  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check development env
  const isDev = env.IS_DEV;

  if (!isDev) return null;
  if (!isOpen) {
    return (
      <button
        onClick={toggle}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-900 text-emerald-400 px-3 py-2 rounded-full shadow-lg border border-emerald-500/30 hover:bg-slate-800 transition-all font-mono text-xs"
        title="Open Developer Trace Panel"
      >
        <Terminal className="w-4 h-4 animate-pulse" />
        <span>Dev Trace ({logs.length})</span>
      </button>
    );
  }

  const filteredLogs = logs.filter((log) => {
    if (filterLayer && log.layer !== filterLayer) return false;
    if (filterStatus && log.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchMeta = log.metadata ? JSON.stringify(log.metadata).toLowerCase().includes(q) : false;
      if (!matchAction && !matchMeta) return false;
    }
    return true;
  });

  const getStatusColor = (status: LogStatus) => {
    switch (status) {
      case 'SUCCESS': return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50';
      case 'WARNING': return 'text-amber-400 bg-amber-950/40 border-amber-800/50';
      case 'ERROR': return 'text-rose-400 bg-rose-950/40 border-rose-800/50';
      case 'INFO':
      default:
        return 'text-sky-400 bg-sky-950/40 border-sky-800/50';
    }
  };

  const getLayerBadgeColor = (layer: LogLayer) => {
    switch (layer) {
      case 'UI': return 'bg-purple-900/60 text-purple-300 border-purple-700/50';
      case 'Hook': return 'bg-indigo-900/60 text-indigo-300 border-indigo-700/50';
      case 'Store': return 'bg-blue-900/60 text-blue-300 border-blue-700/50';
      case 'Service': return 'bg-teal-900/60 text-teal-300 border-teal-700/50';
      case 'Repository': return 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50';
      case 'SyncQueue': return 'bg-amber-900/60 text-amber-300 border-amber-700/50';
      case 'SyncEngine': return 'bg-orange-900/60 text-orange-300 border-orange-700/50';
      case 'Firestore': return 'bg-rose-900/60 text-rose-300 border-rose-700/50';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-xl bg-slate-950 text-slate-100 rounded-xl shadow-2xl border border-slate-800 flex flex-col font-mono text-xs overflow-hidden transition-all backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Developer Trace</span>
          <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">
            {filteredLogs.length} / {logs.length}
          </span>
          {isPaused && (
            <span className="bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px] border border-amber-800">
              PAUSED
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={isPaused ? resume : pause}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${isPaused ? 'text-amber-400' : 'text-slate-400'}`}
            title={isPaused ? "Resume Logging" : "Pause Logging"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={clear}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={copy}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition-colors"
            title="Copy Logs to Clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={exportLogs}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Export Logs JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={collapse}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={toggle}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-900/60 border-b border-slate-800/80">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search action or metadata..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 pl-7 pr-2 py-1 rounded border border-slate-700/60 focus:outline-none focus:border-emerald-500 text-[11px]"
              />
            </div>
            <select
              value={filterLayer || ''}
              onChange={(e) => setFilterLayer(e.target.value || null)}
              className="bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700/60 text-[11px] focus:outline-none"
            >
              <option value="">All Layers</option>
              <option value="UI">UI</option>
              <option value="Hook">Hook</option>
              <option value="Store">Store</option>
              <option value="Service">Service</option>
              <option value="Repository">Repository</option>
              <option value="SyncQueue">SyncQueue</option>
              <option value="SyncEngine">SyncEngine</option>
              <option value="Firestore">Firestore</option>
            </select>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700/60 text-[11px] focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="INFO">INFO</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          {/* Log Stream Body */}
          <div
            ref={scrollRef}
            className="h-72 overflow-y-auto p-3 space-y-2 bg-slate-950/90 font-mono text-[11px]"
          >
            {filteredLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 italic">
                No developer trace logs recorded yet...
              </div>
            ) : (
              filteredLogs.slice().reverse().map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded border transition-all ${getStatusColor(log.status)}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">{log.timestamp}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getLayerBadgeColor(log.layer)}`}>
                        {log.layer}
                      </span>
                      {log.duration !== undefined && (
                        <span className="text-slate-400 text-[10px]">({log.duration}ms)</span>
                      )}
                    </div>
                    <span className="font-bold text-[10px] tracking-wider">{log.status}</span>
                  </div>
                  <div className="text-slate-200 font-semibold">{log.action}</div>
                  {log.metadata && (
                    <pre className="mt-1 p-1.5 bg-black/40 rounded text-[10px] text-slate-300 overflow-x-auto border border-white/5">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Enterprise EAOM Architecture Trace</span>
            <span className="text-emerald-500">● Dev Mode Active</span>
          </div>
        </>
      )}
    </div>
  );
};
