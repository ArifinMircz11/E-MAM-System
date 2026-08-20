import { useState, useCallback, useEffect } from 'react';
import { localDb } from '@/database/dexie';
import { getAllPointSummaries, getAllPointRecords, getPointStats } from '@/services/pointService';
import { getNews } from '@/services/newsService';
import { useStudentStore } from '@/stores/studentStore';

export interface BKStats {
  totalPelanggaran: number;
  totalPrestasi: number;
  topStudents: any[];
  recentAlerts: any[];
  monthlyTrend: any[];
}

export function useDashboardBK() {
  const [stats, setStats] = useState<BKStats>({
    totalPelanggaran: 0,
    totalPrestasi: 0,
    topStudents: [],
    recentAlerts: [],
    monthlyTrend: [],
  });
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState<string[]>([]);
  const CACHE_KEY = `bk_dashboard_stats_cache`;

  const fetchData = useCallback(
    async (force = false) => {
      try {
        if (!force) setLoading(true);

        // 1. Check Dexie Cache First
        const cached = await localDb.cache.get(CACHE_KEY);
        if (cached && !force) {
          setStats(cached.data);
          setLoading(false); // Make UI appear instantly
        }

        // 2. Load classes list for filter
        const cachedClasses = await useStudentStore.getState().fetchClasses();
        setClassesList(
          cachedClasses
            .map((c: any) => c.name)
            .filter(Boolean)
            .sort(),
        );

        // 3. Fetch from Cloud Backgroundly
        const [totalPelanggaran, totalPrestasi, summaries, recentRecords, newsData] =
          await Promise.all([
            getPointStats('Pelanggaran', 'Semua Rombel'),
            getPointStats('Prestasi', 'Semua Rombel'),
            getAllPointSummaries('Semua', 50),
            getAllPointRecords().then((r) => r.slice(0, 50)),
            getNews(true),
          ]);

        setNews(newsData || []);

        const topStudents = summaries.map((s) => ({
          name: s.studentName,
          points: s.totalPoints,
          type: s.totalPoints >= 0 ? 'plus' : 'minus',
          class: (s as any).className || (s as any).class || 'Umum',
        }));

        // High alerts > 15 minus
        const recentAlerts = recentRecords
          .filter((r) => (r.type === 'Pelanggaran' || r.type === 'pelanggaran') && Math.abs(r.points || 0) >= 15)
          .slice(0, 5)
          .map((r) => ({
            ...r,
            studentName: r.studentName || r.namaSiswa || 'Siswa',
          }));

        // For now, static monthly trend, ideally computed from recentRecords if enough data exists
        const monthlyTrend = [
          { name: 'Jan', violations: 12, achievements: 8 },
          { name: 'Feb', violations: 19, achievements: 12 },
          { name: 'Mar', violations: 15, achievements: 20 },
          { name: 'Apr', violations: Math.floor(Math.random() * 20) + 10, achievements: 15 },
          { name: 'Mei', violations: 18, achievements: 22 },
          { name: 'Jun', violations: 30, achievements: 18 },
        ];

        const freshStats = {
          totalPelanggaran: Number(totalPelanggaran) || 0,
          totalPrestasi: Number(totalPrestasi) || 0,
          topStudents,
          recentAlerts,
          monthlyTrend,
        };

        setStats(freshStats);

        // Update Dexie
        await localDb.cache.put({
          key: CACHE_KEY,
          data: freshStats,
          updatedAt: Date.now(),
          expiresAt: Date.now() + 5 * 60 * 1000,
        });
      } catch (e) {
        console.error('[useDashboardBK] Load Error:', e);
      } finally {
        setLoading(false);
      }
    },
    [CACHE_KEY],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    news,
    loading,
    classesList,
    fetchData,
  };
}
