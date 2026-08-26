import { MOCK_TICKER } from './mockData';
import { TickerItem } from '@/types';

export const getTickerItems = async (): Promise<TickerItem[]> => {
  return MOCK_TICKER;
};
