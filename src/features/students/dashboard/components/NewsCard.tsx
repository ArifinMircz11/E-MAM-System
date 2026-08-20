import React from 'react';
import type { NewsItem } from '@/types';
import { motion } from 'framer-motion';
import { Newspaper, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface NewsCardProps {
  news: NewsItem[];
  onClickNews?: (item: NewsItem) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news, onClickNews }) => {
  const displayNews =
    news && news.length > 0
      ? news
      : ([
          {
            id: 'default-news-1',
            title: 'Penerapan Kartu Digital QR Presensi Terpadu',
            category: 'PENGUMUMAN',
            date: new Date().toISOString(),
            summary:
              'Madrasah kini secara resmi menerapkan sistem presensi modern berbasis scan QR Code kartu digital siswa untuk meningkatkan akurasi data kehadiran harian secara real-time.',
            isPublished: true,
          },
          {
            id: 'default-news-2',
            title: 'Layanan Konsultasi Cerdas e-Mam System Virtual Assistant',
            category: 'AKADEMIK',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            summary:
              'Siswa kini dapat memanfaatkan asisten virtual pintar e-Mam System (Konsultasi AI / Live Chat) untuk menanyakan rincian poin prestasi, pelanggaran, maupun riwayat kehadiran langsung melalui aplikasi.',
            isPublished: true,
          },
          {
            id: 'default-news-3',
            title: 'Persiapan Penilaian Akhir Semester Genap',
            category: 'INFORMASI',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            summary:
              'Menjelang akhir tahun ajaran, seluruh siswa diimbau untuk menjaga kedisiplinan tingkat kehadiran serta mempersiapkan perbaikan nilai akademik sebelum pekan ujian dimulai.',
            isPublished: true,
          },
        ] as NewsItem[]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="space-y-4"
    >
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2 px-1">
        <Newspaper className="w-3 h-3" />
        Berita & Pengumuman Madrasah
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayNews.map((item, idx) => (
          <motion.div
            key={item.id || idx}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => onClickNews?.(item)}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-white/5 cursor-pointer hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 text-[9px] font-bold uppercase rounded tracking-wide border border-indigo-100 dark:border-indigo-800">
                {item.category}
              </span>
              <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                <Calendar className="w-2.5 h-2.5" />
                {format(parseISO(item.date), 'dd MMM yyyy', { locale: id })}
              </p>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight line-clamp-2">
              {item.title}
            </h4>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
