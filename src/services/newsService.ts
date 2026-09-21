import { db } from '@/database/db';

export const getNews = async (): Promise<any[]> => {
  try {
    return await db.table('news').filter((item: any) => item.deleted !== true).toArray();
  } catch {
    return [];
  }
};

export const saveNews = async (newsItem: any) => {
  await db.table('news').put(newsItem);
  return newsItem;
};

export const deleteNews = async (id: string) => {
  await db.table('news').delete(id);
  return true;
};

export const generateNewsContent = async (topic: string) => {
  return `Informasi terbaru mengenai ${topic} di lingkungan madrasah.`;
};

export const newsService = {
  getNews,
  saveNews,
  deleteNews,
  generateNewsContent,
};
