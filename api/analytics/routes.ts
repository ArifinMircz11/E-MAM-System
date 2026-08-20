import { Router } from 'express';
import { adminDb } from '../../src/lib/firebase-admin';
import { format } from 'date-fns';

const router = Router();

let cachedPerformance: { data: any; timestamp: number } | null = null;
const PERFORMANCE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * GET /api/analytics/class-performance
 * Mengambil persentase kehadiran rata-rata tiap kelas
 */
let cachedClassTotals: Record<string, number> | null = null;
let lastTotalsFetch = 0;
const TOTALS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

router.get('/class-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = Date.now();

    // 1. Refresh Class Totals Cache if needed
    if (!cachedClassTotals || now - lastTotalsFetch > TOTALS_CACHE_TTL) {
      const studentsSnap = await adminDb.collection('students').get();
      const totals: Record<string, number> = {};
      studentsSnap.forEach((doc: any) => {
        const rombel = doc.data().tingkatRombel;
        if (rombel) totals[rombel] = (totals[rombel] || 0) + 1;
      });
      cachedClassTotals = totals;
      lastTotalsFetch = now;
    }

    // 2. Simple cache for default daily analytics
    if (
      !startDate &&
      !endDate &&
      cachedPerformance &&
      now - cachedPerformance.timestamp < PERFORMANCE_CACHE_TTL
    ) {
      return res.json({ success: true, data: cachedPerformance.data, fromCache: true });
    }

    // 3. Try to use pre-aggregated stats first
    if (!startDate && !endDate) {
      const statsDoc = await adminDb.collection('daily_stats').doc(today).get();
      if (statsDoc.exists) {
        const statsData = statsDoc.data();
        if (statsData?.perKelas) {
          const result = Object.entries(statsData.perKelas)
            .map(([name, presentCount]: [string, any]) => {
              const total = cachedClassTotals?.[name] || 1; // Fallback to 1 to avoid div by zero
              return {
                className: name,
                percentage: Math.min(((presentCount || 0) / total) * 100, 100),
                totalRecords: total,
              };
            })
            .sort((a, b) => b.percentage - a.percentage);

          cachedPerformance = { data: result, timestamp: now };
          return res.json({ success: true, data: result, source: 'aggregate' });
        }
      }
    }

    // Fetch in batches
    const allResults: any[] = [];
    let lastDoc: any = null;
    const batchSize = 1000;
    const maxRecords = 2000; // Defensive limit for Spark Plan

    while (allResults.length < maxRecords) {
      let q = adminDb.collection('attendance') as any;

      if (startDate) {
        q = q.where('date', '>=', startDate);
      }
      if (endDate) {
        q = q.where('date', '<=', endDate);
      }

      // Using ordering so that pagination behaves correctly
      q = q.orderBy('date').limit(Math.min(batchSize, maxRecords - allResults.length));

      if (lastDoc) {
        q = q.startAfter(lastDoc);
      }

      const snapshot = await q.get();

      if (snapshot.empty) {
        break;
      }

      snapshot.forEach((doc: any) => {
        allResults.push(doc);
      });

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    if (allResults.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Agregasi sederhana
    const performanceMap: Record<string, { present: number; total: number }> = {};
    allResults.forEach((doc: any) => {
      const data = doc.data();
      const className = data.class || 'Unknown';
      const status = data.status;
      if (!performanceMap[className]) performanceMap[className] = { present: 0, total: 0 };
      performanceMap[className].total += 1;
      if (status === 'Hadir' || status === 'Terlambat') performanceMap[className].present += 1;
    });

    const result = Object.entries(performanceMap)
      .map(([name, stats]) => ({
        className: name,
        percentage: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
        totalRecords: stats.total,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Update cache
    if (!startDate && !endDate) {
      cachedPerformance = { data: result, timestamp: Date.now() };
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Analytics Error:', error);

    // Deteksi spesifik untuk Quota Exceeded
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.code === 8) {
      return res.status(429).json({
        success: false,
        error: 'Kuota database harian telah tercapai (Spark Plan). Silakan coba lagi besok.',
        isQuotaExceeded: true,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
