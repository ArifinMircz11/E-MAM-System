import type { AppEntity } from './base';
import type { UserRole } from '@/types/roles';

/**
 * AppNotification Entity - Domain representation of a system notification.
 */
export interface AppNotification extends AppEntity {
  type: 'info' | 'transaksi' | 'chat' | 'surat';
  title: string;
  message: string;
  targetRole: UserRole | 'semua' | string;
  targetClass?: string;
  userId?: string;
  chatId?: string;
  isRead: boolean;
}
