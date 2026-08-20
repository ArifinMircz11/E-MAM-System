import React, { useState, useEffect, useCallback } from 'react';
import { CloudOff, RefreshCw, CheckCircle2, Database, Clock, ShieldCheck, X } from 'lucide-react';
import { localDb } from '@/database/dexie'; // eslint-disable-line no-restricted-imports
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { toast } from 'sonner';

interface SyncQueueDetailItem {
  id: string;
  collection: string;
  action: string;
  status: string;
  retryCount: number;
  error?: string;
  createdAt: number;
}

export const OfflineSyncIndicator: React.FC = () => {
  const { isSyncing, pendingCount, isOnline, syncState, forceSync } = useOfflineSync();
  const [isOpen, setIsOpen] = useState(false);
  const [queueItems, setQueueItems] = useState<SyncQueueDetailItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchQueueDetails = useCallback(async () => {
    try {
      setLoadingDetails(true);
      const items = await localDb.sync_queue
        .where('status')
        .anyOf(['pending', 'failed'])
        .toArray();
      setQueueItems(items);
    } catch (err) {
      console.error('Failed to load sync queue details:', err);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchQueueDetails();
    }
  }, [isOpen, fetchQueueDetails, pendingCount]);

  const failedCount = queueItems.filter((i) => i.status === 'failed' || (i.retryCount || 0) > 0).length;

  return (
    <>
      {/* Header Badge Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer border ${
          syncState === 'OFFLINE'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            : syncState === 'SYNCING'
            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 animate-pulse'
            : syncState === 'WAITING'
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
        }`}
        title="Status Sinkronisasi & Antrean Offline"
      >
        {syncState === 'OFFLINE' ? (
          <>
            <CloudOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>OFFLINE ({pendingCount})</span>
          </>
        ) : syncState === 'SYNCING' ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>SYNCING ({pendingCount})</span>
          </>
        ) : syncState === 'WAITING' ? (
          <>
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>WAITING ({pendingCount})</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>SYNCED</span>
          </>
        )}
      </button>

      {/* In-Depth Sync Status Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className="bg-[#0B1121] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative z-10"
            >
              
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${!isOnline ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'}`}>
                    {!isOnline ? <CloudOff className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                      Status Sinkronisasi Offline-First
                    </h2>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Arsitektur Lokal Dexie & Antrean Sinkronisasi Cloud
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* Status Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Jaringan</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
                      <span className="text-xs font-bold text-white uppercase tracking-wide">
                        {isOnline ? 'Online (Terhubung)' : 'Offline (Mode Lokal)'}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1">
                      {isOnline ? 'Siap mengirim delta ke Firestore' : 'Data disimpan di Dexie IndexedDB'}
                    </span>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Antrean Pending</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold text-indigo-400 font-mono">{pendingCount}</span>
                      <span className="text-[10px] text-slate-400 font-medium">perubahan</span>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1">
                      Menunggu sinkronisasi ke server
                    </span>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gagal / Konflik</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-lg font-bold font-mono ${failedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {failedCount}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">item</span>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1">
                      {failedCount > 0 ? 'Memerlukan perhatian retry' : 'Semua transaksi bersih'}
                    </span>
                  </div>
                </div>

                {/* Action Banner */}
                <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      Garansi Integritas Data IMAM System
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Seluruh aksi Anda (absensi, nilai, mutasi siswa, jurnal) diproses secara instan di database lokal Dexie. Saat kembali online, antrean sinkronisasi otomatis mengirimkan data tanpa kehilangan data.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!isOnline) {
                        toast.error('Perangkat saat ini sedang offline. Sambungkan internet untuk menyinkronkan.');
                        return;
                      }
                      await forceSync();
                      await fetchQueueDetails();
                      toast.success('Sinkronisasi paksa berhasil diproses.');
                    }}
                    disabled={isSyncing || !isOnline}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
                  </button>
                </div>

                {/* Queue Items Table / List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Rincian Item Antrean Sinkronisasi ({queueItems.length})
                    </h3>
                    <button
                      onClick={fetchQueueDetails}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                    >
                      Muat Ulang Daftar
                    </button>
                  </div>

                  {loadingDetails ? (
                    <div className="py-8 text-center text-xs text-slate-500">Memuat rincian antrean...</div>
                  ) : queueItems.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-8 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Antrean Sinkronisasi Kosong</p>
                      <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                        Semua data lokal telah tersinkronisasi sempurna dengan server cloud Firestore.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {queueItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${item.status === 'failed' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white uppercase tracking-wider text-[11px] truncate">
                                  {item.collection}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-indigo-300 border border-slate-700">
                                  {item.action}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  {new Date(item.createdAt).toLocaleTimeString()}
                                </span>
                                <span>ID: {item.id.substring(0, 12)}...</span>
                                {item.retryCount > 0 && (
                                  <span className="text-amber-400 font-bold">Retry: {item.retryCount}x</span>
                                )}
                              </div>
                              {item.error && (
                                <p className="text-[10px] text-rose-400 mt-1 truncate">Err: {item.error}</p>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                            item.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
                <span>IMAM System Offline-First Engine v2.0</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
