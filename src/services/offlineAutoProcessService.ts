import { SyncEngine } from '@/services/SyncEngine';

export const triggerOfflineProcessing = async (): Promise<boolean> => {
  try {
    await SyncEngine.processQueue();
    return true;
  } catch {
    return false;
  }
};

export const offlineAutoProcessService = {
  triggerOfflineProcessing,
};
