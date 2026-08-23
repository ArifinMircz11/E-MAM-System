import { loginLogRepository } from '@/repositories/LoginLogRepository';
import type { LoginHistoryEntry } from '@/types';
import { SecurityContextService } from '@/core/security/SecurityContextService';

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
  const context = SecurityContextService.getContext();
  if (!SecurityContextService.isReady()) throw new Error('LOGIN_HISTORY_SECURITY_CONTEXT_NOT_READY');
  if (context.uid !== userId) throw new Error('LOGIN_HISTORY_USER_MISMATCH');

  const entry: LoginHistoryEntry = {
    id: `log_${Date.now()}_${userId}`,
    userId,
    timestamp: new Date().toISOString(),
    device: getDeviceName(),
    ip: '127.0.0.1',
    status,
    tenantId: context.tenantId,
  };

  try {
    await loginLogRepository.create(entry);
  } catch (error: any) {
    console.warn('[historyService] Log login gagal disimpan:', error.message);
  }
};

export const getLoginHistory = async (userId: string): Promise<LoginHistoryEntry[]> => {
  if (!userId) return [];
  const context = SecurityContextService.getContext();
  if (!SecurityContextService.isReady()) throw new Error('LOGIN_HISTORY_SECURITY_CONTEXT_NOT_READY');
  if (context.uid !== userId) throw new Error('LOGIN_HISTORY_USER_MISMATCH');

  try {
    return await loginLogRepository.getByUserId(userId);
  } catch (error: any) {
    console.error('[historyService] Error fetching login history:', error.message);
    return [];
  }
};
