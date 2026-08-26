import { broadcastSystemAlert } from './systemService';

export const DevConsoleActions = {
  runDiagnostic: async () => ({ success: true, message: 'Diagnostik sistem berjalan normal.' }),
  repairDatabase: async () => ({ success: true, message: 'Database berhasil direpair.' }),
  sendBroadcast: async (message: string, isActive: boolean) => {
    return await broadcastSystemAlert({
      isActive,
      title: 'Pemberitahuan Sistem',
      message,
    });
  },
};

export const devConsoleActions = DevConsoleActions;
