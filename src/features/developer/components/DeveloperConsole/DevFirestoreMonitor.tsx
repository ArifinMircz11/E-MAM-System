// src/components/DeveloperConsole/DevFirestoreMonitor.tsx
// ✅ VISUAL MONITOR — Pantau jumlah listener real-time

import { useEffect, useState } from 'react';
import { realtimeHub } from '@/services/realtime/realtimeHub';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { Activity, Bug, ChevronDown } from 'lucide-react';

export const DevFirestoreMonitor = () => {
  const user = useAuthStore((state) => state.user);
  const [count, setCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);

  // Checks both current dynamic role & base e-Mam Developer authorization email
  const isDeveloperUser =
    user?.email === 'admin@example.com' || user?.role === UserRole.DEVELOPER;

  useEffect(() => {
    if (!isDeveloperUser) return;
    const interval = setInterval(() => {
      setCount(realtimeHub.activeCount);
      setKeys(realtimeHub.activeKeys);
    }, 1000);
    return () => clearInterval(interval);
  }, [isDeveloperUser]);

  if (!isDeveloperUser || count === 0) return null;

  // Tentukan warna berdasarkan jumlah listener
  const getStatus = () => {
    if (count <= 3) return 'green';
    if (count <= 6) return 'yellow';
    return 'red';
  };

  const status = getStatus();

  const statusStyles = {
    green: 'bg-green-900/90 text-green-200 border-green-500/50',
    yellow: 'bg-yellow-900/90 text-yellow-200 border-yellow-500/50',
    red: 'bg-red-900/90 text-red-200 border-red-500/50 pulse-border',
  };

  return (
    <div
      id="dev-firestore-monitor-root"
      className={`fixed bottom-36 right-6 z-[9998] shadow-2xl border backdrop-blur-md text-[9px] font-mono transition-all duration-300 ${
        expanded ? 'w-64 rounded-xl' : 'w-auto rounded-full'
      } ${statusStyles[status]}`}
    >
      {/* Header — selalu terlihat */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 hover:bg-black/10 transition text-left ${
          expanded ? 'px-3 py-2 w-full rounded-t-xl' : 'px-2.5 py-1.5 rounded-full'
        }`}
        title="Firestore Listener Monitor"
      >
        <Activity className={`w-3.5 h-3.5 ${status === 'red' ? 'animate-pulse' : ''}`} />
        {expanded ? (
          <>
            <span className="font-bold uppercase tracking-wider">Listener: {count}</span>
            {status === 'red' && <Bug className="w-3 h-3 animate-bounce text-red-300 ml-1" />}
            <ChevronDown className="w-3.5 h-3.5 ml-auto" />
          </>
        ) : (
          <>
            <span className="font-bold font-mono text-[10px] pr-0.5">{count}</span>
            {status === 'red' && <Bug className="w-3 h-3 animate-pulse text-red-300" />}
          </>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && keys.length > 0 && (
        <div className="px-3 pb-2 border-t border-white/10 max-h-48 overflow-y-auto divide-y divide-white/5 rounded-b-xl">
          <div className="text-[8px] text-white/50 mt-1.5 mb-1.5 font-bold uppercase tracking-wide">
            ACTIVE KEYS:
          </div>
          {keys.map((key) => (
            <div key={key} className="text-[9px] text-white/80 py-1 truncate font-mono" title={key}>
              • {key}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
