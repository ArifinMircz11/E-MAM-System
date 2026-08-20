import { Router, Request, Response, NextFunction } from 'express';
import { getAdminDb } from '../../src/lib/firebase-admin';

const router = Router();

/**
 * @route   GET /api/sync/pull-all
 * @desc    Mengambil data massal terintegrasi untuk kebutuhan Pull-to-Refresh PWA
 * @access  Private
 */
router.get('/pull-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getAdminDb();
    console.log('Memulai ekstraksi data sinkronisasi massal otonom...');

    // Menggunakan Promise.all untuk eksekusi kueri paralel
    const [snapshotNotifikasi, snapshotVerifikasi] = await Promise.all([
      db.collection('notifications').limit(20).get(),

      db.collection('users').where('transaksi.status', '==', 'pending').limit(50).get(),
    ]);

    const dataNotifikasi = snapshotNotifikasi.docs.map((doc: any) => ({
      idUnik: doc.id,
      ...doc.data(),
    }));

    const dataVerifikasi = snapshotVerifikasi.docs.map((doc: any) => ({
      idUnik: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      payload: {
        notifikasi: dataNotifikasi,
        verifikasiPending: dataVerifikasi,
      },
    });
  } catch (error: any) {
    console.error('Gagal mengeksekusi routing sinkronisasi global:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal menyegarkan data karena gangguan internal server.',
      error: error.message,
    });
  }
});

export default router;
