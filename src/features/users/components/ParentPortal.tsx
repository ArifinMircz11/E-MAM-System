import React, { useState, useEffect } from 'react';
import Layout from '@/layouts/Layout';
import type { UserData, NewsItem } from '@/types';
import {
  getStudentData,
} from '@/services/parentService';
import { getNews } from '@/services/newsService';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';
import {
  Loader2,
  UserIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  ArrowRightIcon,
} from '@/shared/Icons';

interface ParentPortalProps {
  user: UserData;
  onBack: () => void;
  onOpenSidebar?: () => void;
}

const ParentPortal: React.FC<ParentPortalProps> = ({ user, onBack, onOpenSidebar }) => {
  const [studentData, setStudentData] = useState<any>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if ((user as any).studentsId) {
        const student = await getStudentData((user as any).studentsId);
        setStudentData(student);
      }
      setLoading(false);
    };
    fetchData();
  }, [(user as any).studentsId]);

  useEffect(() => {
    const fetchNews = async () => {
      const data = await getNews(true);
      setNews(data);
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <Layout
      title="Parent Portal"
      subtitle={studentData?.namaLengkap || 'Siswa'}
      icon={UserIcon}
      onBack={onBack}
    >
      <div className="p-4 space-y-6">
        {/* --- NEWS FOR PARENTS --- */}
        {news.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {news.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="min-w-[240px] bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-5 shadow-sm"
                >
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[7px] font-bold capitalize tracking-wide border border-indigo-100 dark:border-indigo-800">
                    {item.category || 'Info'}
                  </span>
                  <h5 className="text-[11px] font-bold text-slate-800 dark:text-white mt-3 line-clamp-2 leading-tight capitalize">
                    {item.title}
                  </h5>
                  <p className="text-[9px] text-slate-500 mt-2 line-clamp-2 font-medium leading-relaxed">
                    {item.content}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[8px] font-bold text-slate-400">
                      {format(new Date(item.date), 'dd MMMM yyyy', { locale: localeID })}
                    </span>
                    <ArrowRightIcon className="w-3 h-3 text-indigo-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize tracking-tight">
            Selamat Datang di Parent Portal
          </h2>
          <p className="text-sm text-slate-500 mt-2">Memantau perkembangan akademis anak Anda.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <ClockIcon className="w-6 h-6 text-indigo-500" />
            <div>
              <h4 className="text-[10px] font-bold capitalize text-slate-400 dark:text-slate-500">
                Kehadiran
              </h4>
              <p className="text-xs font-bold mt-0.5 text-slate-800 dark:text-white">
                Lihat Riwayat
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-6 h-6 text-emerald-500" />
            <div>
              <h4 className="text-[10px] font-bold capitalize text-slate-400 dark:text-slate-500">
                Tugas
              </h4>
              <p className="text-xs font-bold mt-0.5 text-slate-800 dark:text-white">Lihat Tugas</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <CreditCardIcon className="w-6 h-6 text-amber-500" />
            <div>
              <h4 className="text-[10px] font-bold capitalize text-slate-400 dark:text-slate-500">
                Administrasi
              </h4>
              <p className="text-xs font-bold mt-0.5 text-slate-800 dark:text-white">
                Status Pembayaran
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ParentPortal;
