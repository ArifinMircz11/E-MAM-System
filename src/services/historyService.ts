import { useUserStore } from '@/stores/userStore';
import { loginLogRepository } from '@/repositories/LoginLogRepository';
import type { LoginHistoryEntry } from '@/types';
import { isMockMode } from './firebase';

const getDeviceName = (): string => {
  if (typeof navigator === 'undefined') return 'Server Side';
  const userAgent = navigator.userAgent;
  if (/android/i.test(userAgent)) return 'Android Device';
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS Device';
  if (/windows phone/i.test(userAgent)) return 'Windows Phone';
  if (/Win/i.test(userAgent)) return 'Windows Desktop';
  if (/Mac/i.test(userAgent)) return 'Macintosh';
  if (/Linux/i.test(userAgent)) return 'Linux Desktop';
  return 'Unknown Device';
};

export const logLoginEvent = async (
  userId: string,
  status: 'Success' | 'Failed' = 'Success',
): Promise<void> => {
  let tenantId = 'global';
  try {
    tenantId = useUserStore.getState().tenantId || 'global';
  } catch (e) {
    // Fallback or ignore if store not ready
  }

  const entry: LoginHistoryEntry = {
    id: `log_${Date.now()}_${userId}`,
    userId,
    timestamp: new Date().toISOString(),
    device: getDeviceName(),
    ip: '127.0.0.1', // Placeholder
    status,
    tenantId: tenantId,
  };

  try {
    await loginLogRepository.create(entry);
  } catch (error: any) {
    console.warn('[historyService] Log login gagal disimpan:', error.message);
  }
};

export const getLoginHistory = async (userId: string): Promise<LoginHistoryEntry[]> => {
  if (!userId) return [];

  try {
    return await loginLogRepository.getByUserId(userId);
  } catch (error: any) {
    console.error('[historyService] Error fetching login history:', error.message);
    return [];
  }
};
