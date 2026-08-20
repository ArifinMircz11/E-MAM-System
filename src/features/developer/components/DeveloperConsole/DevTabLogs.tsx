import { useUserStore } from '@/stores/userStore';
import React, { useEffect, useState } from 'react';
import { logAudit, getAuditLogsPaginated } from '@/services/auditLogService';

interface DevTabLogsProps {
  whatsappLogs: any[];
}

export const DevTabLogs: React.FC<DevTabLogsProps> = ({ whatsappLogs }) => {
  const [offlineLogs, setOfflineLogs] = useState<any[]>([]);
  const [onlineLogs, setOnlineLogs] = useState<any[]>([]);
  const [lastOnlineDoc, setLastOnlineDoc] = useState<any>(null);
  const [loadingOnline, setLoadingOnline] = useState(false);
  const [hasMoreOnline, setHasMoreOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const fetchOnlineLogs = async (isLoadMore = false) => {
    if (loadingOnline) return;
    setLoadingOnline(true);
    try {
      const tenantId = useUserStore.getState().tenantId || '30315537';

      const result = await getAuditLogsPaginated(tenantId, isLoadMore ? lastOnlineDoc : null, 15);

      if (isLoadMore) {
        setOnlineLogs((prev) => [...prev, ...result.data]);
      } else {
        setOnlineLogs(result.data);
      }
      setLastOnlineDoc(result.lastDoc);
      setHasMoreOnline(result.lastDoc !== null);
    } catch (e) {
      console.error('Gagal mengambil log online:', e);
    } finally {
      setLoadingOnline(false);
    }
  };

  const loadLocalLogs = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('offline_audit_logs');
      if (raw) {
        try {
          setOfflineLogs(JSON.parse(raw));
        } catch (e) {
          console.error('Failed to parse offline audit logs:', e);
        }
      } else {
        setOfflineLogs([]);
      }
    }
  };

  useEffect(() => {
    loadLocalLogs();
    fetchOnlineLogs();

    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
      loadLocalLogs();
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Periodically refresh log queue every 5 seconds to capture offline simulation changes
    const interval = setInterval(loadLocalLogs, 5000);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      clearInterval(interval);
    };
  }, []);

  const handleSimulateOfflineLog = async () => {
    const fakeActions = [
      'USER_LOGOUT_SUCCESS',
      'POINTS_CALCULATION_TRIGGERED',
      'EXAM_RESULT_SUBMITTED',
      'CLASS_SCHEDULE_EXPORTED',
      'ATTENDANCE_SESSION_CREATED',
    ];
    const randomAction = fakeActions[Math.floor(Math.random() * fakeActions.length)];

    await logAudit({
      action: `SIMULATED_${randomAction}`,
      category: 'SYSTEM',
      details: `Simulasi pencatatan aksi saat perangkat luring pada jam ${new Date().toLocaleTimeString()}`,
      metadata: { simulatedOffline: true },
    });

    loadLocalLogs();
  };

  const handleClearOfflineQueue = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('offline_audit_logs');
      loadLocalLogs();
    }
  };

  const handleForceSync = async () => {
    if (!navigator.onLine) {
      alert('Perangkat Anda masih luring (offline). Tidak dapat memperbarui database Firestore.');
      return;
    }
    setIsSyncing(true);
    try {
      // await flushOfflineLogs();
      loadLocalLogs();
    } catch (err) {
      console.error('Failed forcing manual offline logs flush:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-full p-4 overflow-y-auto space-y-6">
      {/* OFFLINE AUDIT LOG QUEUE DIAGNOSTIC CARD */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Antrean Log Audit Luar Jaringan (Offline Queue)
              </h4>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 animate-pulse'
                }`}
              >
                {isOnline ? '● Online - Autosync Aktif' : '● Offline Mode Active'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Aksi pengguna disimpan sementara di penyimpanan lokal peramban saat luring dan
              ditransmisi ke Firestore secara atomik ketika kembali daring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSimulateOfflineLog}
              className="bg-slate-800 hover:bg-slate-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 text-[9px] font-bold uppercase px-3 py-2 rounded-xl transition-all shadow-sm"
            >
              ➕ Simulasi Log Offline
            </button>
            {offlineLogs.length > 0 && (
              <>
                <button
                  onClick={handleForceSync}
                  disabled={isSyncing || !isOnline}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white text-[9px] font-bold uppercase px-3 py-2 rounded-xl transition-all shadow-sm"
                >
                  {isSyncing ? 'Synchronizing...' : '🔄 Sinkronisasi Sekarang'}
                </button>
                <button
                  onClick={handleClearOfflineQueue}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold uppercase px-3 py-2 rounded-xl transition-all shadow-sm"
                >
                  🗑️ Hapus Antrean
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#111827]">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase text-left text-slate-500">
                  Aksi
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase text-left text-slate-500">
                  Kategori
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase text-left text-slate-500">
                  Detail
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase text-left text-slate-500">
                  Waktu Luring
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {offlineLogs.map((log: any, index: number) => (
                <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-4 py-2 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    {log.action}
                  </td>
                  <td className="px-4 py-2 text-[9px] font-bold uppercase">
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                      {log.category}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[10px] text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                  </td>
                  <td className="px-4 py-2 text-[9px] font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {offlineLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-400 italic text-[10px]"
                  >
                    Antrean lokal kosong. Semua log audit telah sinkron dengan server Firestore.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIRESTORE ONLINE AUDIT LOGS VIEWER */}
      <div className="bg-white dark:bg-[#151E32] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Pencatatan Aktivitas Firestore (Online Audit Logs)
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              Arsip log audit langsung dari cloud database Firestore (Multi-tenant terisolasi, hemat
              kuota dengan paginasi).
            </p>
          </div>
          <button
            onClick={() => fetchOnlineLogs(false)}
            disabled={loadingOnline}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[9px] font-bold uppercase px-3 py-2 rounded-xl transition-all shadow-sm shrink-0"
          >
            {loadingOnline ? 'Memuat...' : '🔄 Muat Ulang'}
          </button>
        </div>

        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#111827]">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase text-left text-slate-500">
                  Pengguna
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase text-left text-slate-500">
                  Aksi
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase text-left text-slate-500">
                  Kategori
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase text-left text-slate-500">
                  Detail
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase text-left text-slate-500">
                  Waktu Server
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {onlineLogs.map((log: any, idx: number) => {
                const formattedTime = log.timestamp?.toDate
                  ? log.timestamp.toDate().toLocaleString()
                  : log.timestamp
                    ? new Date(log.timestamp).toLocaleString()
                    : '-';
                return (
                  <tr
                    key={`${log.id || idx}`}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                  >
                    <td className="px-4 py-2 text-[10px]">
                      <div className="font-bold text-slate-700 dark:text-slate-300">
                        {log.userName || 'SYSTEM'}
                      </div>
                      <div className="text-[8px] text-slate-400">{log.userRole || 'SYSTEM'}</div>
                    </td>
                    <td className="px-4 py-2 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {log.action}
                    </td>
                    <td className="px-4 py-2 text-[9px] font-bold uppercase">
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                        {log.category}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2 text-[10px] text-slate-600 dark:text-slate-300 max-w-xs truncate"
                      title={
                        typeof log.details === 'object' ? JSON.stringify(log.details) : log.details
                      }
                    >
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </td>
                    <td className="px-4 py-2 text-[9px] font-mono text-slate-400">
                      {formattedTime}
                    </td>
                  </tr>
                );
              })}
              {onlineLogs.length === 0 && !loadingOnline && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-400 italic text-[10px]"
                  >
                    Tidak ada log audit online terdeteksi di Firestore tenant Anda.
                  </td>
                </tr>
              )}
              {loadingOnline && onlineLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-400 italic text-[10px]"
                  >
                    Menghubungi server Firestore...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {hasMoreOnline && onlineLogs.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => fetchOnlineLogs(true)}
              disabled={loadingOnline}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold uppercase px-4 py-2.5 rounded-2xl transition-all shadow-sm"
            >
              {loadingOnline ? 'Memuat...' : '⬇️ Tampilkan Lebih Banyak (Paginated)'}
            </button>
          </div>
        )}
      </div>

      {/* INTEGRATED WHATSAPP NOTIFICATION SERVICE LOGS */}
      <div className="bg-white dark:bg-[#151E32] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
          Laporan Transmisi Notifikasi WhatsApp (Sistem)
        </h4>
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-[#111827]">
              <tr>
                <th className="px-4 py-2 text-[9px] font-bold uppercase text-left text-slate-500">
                  Target
                </th>
                <th className="px-4 py-2 text-[9px] font-bold uppercase text-left text-slate-500">
                  Pesan
                </th>
                <th className="px-4 py-2 text-[9px] font-bold uppercase text-left text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2 text-[9px] font-bold uppercase text-left text-slate-500">
                  Waktu
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {whatsappLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-4 py-2 text-[10px] font-medium">{log.target}</td>
                  <td className="px-4 py-2 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    {log.message}
                  </td>
                  <td className="px-4 py-2 text-[10px] font-bold uppercase text-emerald-500">
                    {log.status}
                  </td>
                  <td className="px-4 py-2 text-[10px] font-mono text-slate-400">
                    {log.timestamp?.toDate
                      ? log.timestamp.toDate().toLocaleString()
                      : new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              {whatsappLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500 italic text-[10px]"
                  >
                    Belum ada log WhatsApp terdeteksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
