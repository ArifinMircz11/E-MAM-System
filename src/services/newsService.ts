import { MOCK_TICKER } from './mockData';
import { TickerItem } from '@/types';

export const getNews = async (force: boolean = false) => {
  try {
    const { db } = await import('@/database/db');
    if (db.table('news')) {
      const list = await db.table('news').toArray();
      if (list.length > 0) return list;
    }
  } catch {}
  
  return [
    {
      id: 'news-1',
      title: 'Pelaksanaan Asesmen Madrasah Berbasis Komputer (AMBK) 2026',
      content: 'Jadwal dan persiapan teknis AMBK untuk seluruh tingkat kelas telah dipublikasikan.',
      category: 'Akademik',
      date: new Date().toISOString().split('T')[0],
      author: 'Humas Madrasah',
    },
    {
      id: 'news-2',
      title: 'Sosialisasi Integrasi Sistem Presensi Digital Siswa & GTK',
      content: 'Mulai semester ini, seluruh data presensi diintegrasikan secara realtime dan offline-first.',
      category: 'Informasi',
      date: new Date().toISOString().split('T')[0],
      author: 'Tim IT',
    },
  ];
};

export const saveNews = async (newsItem: any) => {
  try {
    const { db } = await import('@/database/db');
    if (db.table('news')) {
      await db.table('news').put(newsItem);
      return newsItem;
    }
  } catch {}
  return newsItem;
};

export const deleteNews = async (id: string) => {
  try {
    const { db } = await import('@/database/db');
    if (db.table('news')) {
      await db.table('news').delete(id);
      return true;
    }
  } catch {}
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
