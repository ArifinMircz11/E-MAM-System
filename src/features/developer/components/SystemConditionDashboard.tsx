import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { useSystemStore } from '@/stores/systemStore';
import { env } from '@/core/config/env';
import { Activity, Shield, Database, Cloud, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const SystemConditionDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { isSyncing, pendingWritesCount } = useSyncStore();
  const { isOnline } = useSystemStore();

  const syncStatus = isSyncing ? 'syncing' : 'idle';
  const queueCount = pendingWritesCount;
  const mode = env.MODE;

  const statusItems = [
    { label: 'Auth Status', value: user ? 'Authenticated' : 'Guest', icon: Shield, color: user ? 'text-green-500' : 'text-red-500' },
    { label: 'Sync Status', value: syncStatus, icon: Cloud, color: syncStatus === 'idle' ? 'text-green-500' : 'text-yellow-500' },
    { label: 'Sync Queue', value: `${queueCount} items`, icon: Activity, color: queueCount === 0 ? 'text-green-500' : 'text-blue-500' },
    { label: 'Network', value: isOnline ? 'Online' : 'Offline', icon: Wifi, color: isOnline ? 'text-green-500' : 'text-orange-500' },
    { label: 'System Mode', value: mode, icon: Database, color: mode === 'production' ? 'text-blue-500' : 'text-purple-500' },
  ];

  return (
    <Card className="p-4 bg-zinc-900 border-zinc-800">
      <h3 className="text-sm font-medium text-white mb-4">System Health</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statusItems.map((item, index) => (
          <div key={index} className="flex flex-col p-3 bg-zinc-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <item.icon size={16} className={item.color} />
              <span className="text-xs text-zinc-400">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
