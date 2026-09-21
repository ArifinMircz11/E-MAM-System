import { db } from '@/database/db';
import type { TickerItem } from '@/types';

export const getTickerItems = async (): Promise<TickerItem[]> => {
  try {
    return await db.table('news')
      .filter((item: any) => item.deleted !== true && item.active !== false)
      .toArray() as TickerItem[];
  } catch {
    return [];
  }
};
