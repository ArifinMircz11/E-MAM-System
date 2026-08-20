import { useState } from 'react';
import { OfflineAutoProcessService } from '@/services/offlineAutoProcessService';
import { toast } from 'sonner';

export function AutoProcessOfflineButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleProcess = async () => {
    if (!confirm('Proses offline dari cache lokal? Data akan di-sync ke Firestore nanti.')) return;
    setLoading(true);
    try {
      const result = await OfflineAutoProcessService.processToday();
      setResult({
        message: '✅ Proses offline berhasil!',
        detail: `Hadir diproses: ${result.attendanceProcessed}, ${result.totalOps} operasi siap sync.`,
      });
      toast.success('Proses offline berhasil');
    } catch (err: any) {
      setResult({ message: '❌ Error', detail: err.message });
      toast.error('Gagal memproses offline');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await OfflineAutoProcessService.syncToFirestore();
      if (res && 'offline' in res && res.offline) {
        setResult({
          message: '⚠️ Perangkat Offline',
          detail: 'Sinkronisasi ditunda sampai koneksi internet kembali.',
        });
        toast.error('Perangkat offline, tidak dapat sync.');
        return;
      }

      const synced = (res as any)?.synced || 0;
      setResult({
        message: `✅ ${synced} operasi tersinkronisasi ke Firestore`,
        detail: 'Proses sinkronisasi background selesai!',
      });
      toast.success('Sync ke Firestore berhasil');
    } catch (err: any) {
      setResult({ message: '❌ Gagal sync', detail: err.message });
      toast.error('Gagal sync ke Firestore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <h3 className="font-bold mb-2">Manajemen Offline</h3>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleProcess}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {loading ? '⏳ Proses...' : '📋 Proses Offline'}
        </button>
        <button
          onClick={handleSync}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
        >
          ☁️ Sync ke Firestore
        </button>
      </div>
      {result && (
        <div className="mt-3 p-2 bg-gray-100 rounded">
          <p className="font-semibold">{result.message}</p>
          <p className="text-sm">{result.detail}</p>
        </div>
      )}
    </div>
  );
}
