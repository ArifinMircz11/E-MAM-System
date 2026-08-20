import { tickerRepository } from '@/repositories/TickerRepository';
import type { TickerItem } from '@/types';
import { useUserStore } from '@/stores/userStore';

export const getTickerItems = async (forceRefresh = false): Promise<TickerItem[]> => {
  const tenantId = useUserStore.getState().tenantId;
  return await tickerRepository.getActive(tenantId || 'global');
};

export const saveTickerItem = async (item: TickerItem): Promise<void> => {
  await tickerRepository.update(item);
};

export const deleteTickerItem = async (id: string): Promise<void> => {
  const tenantId = useUserStore.getState().tenantId;
  await tickerRepository.delete(id, tenantId || 'global');
};

