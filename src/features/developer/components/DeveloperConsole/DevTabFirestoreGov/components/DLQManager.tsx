/* eslint-disable no-restricted-imports */
import React, { useState } from 'react';
import * as Icons from '@/shared/Icons';
import { localDb } from '@/database/dexie';
import { SyncEngine } from '@/services/SyncEngine';

/**
 * DLQ MANAGER COMPONENT
 * 
 * Modul untuk mengelola Dead Letter Queue (DLQ).
 * Memungkinkan pengembang untuk melihat, memperbaiki, dan mencoba kembali sinkronisasi data yang gagal.
 */

interface DlgRecord {
  id: string;
  collection: string;
  payload: any;
  error: string;
  timestamp: number;
  parsedError?: {
    type: string;
    fields: string[];
    detail: string;
  };
}

interface DLQManagerProps {
  dlqRecords: DlgRecord[];
  user: any;
  runScan: () => Promise<void>;
  getTableByName: (colName: string) => any;
}

export const DLQManager: React.FC<DLQManagerProps> = ({ dlqRecords, user, runScan, getTableByName }) => {
  const [selectedDlqId, setSelectedDlqId] = useState<string | null>(null);
  const [editingPayload, setEditingPayload] = useState<any>(null);
  const [isSavingDlq, setIsSavingDlq] = useState(false);
  const [dlqSuccessMessage, setDlqSuccessMessage] = useState<string | null>(null);
  const [dlqErrorMessage, setDlqErrorMessage] = useState<string | null>(null);
  const [isRawJsonMode, setIsRawJsonMode] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleRetrySync = async () => {
    try {
      await SyncEngine.processQueue();
      await runScan();
    } catch (err) {
      console.error('Failed to retry sync:', err);
    }
  };

  const handleStartEditDlq = (rec: DlgRecord) => {
    setSelectedDlqId(rec.id);
    setEditingPayload(JSON.parse(JSON.stringify(rec.payload)));
    setRawJsonText(JSON.stringify(rec.payload, null, 2));
    setIsRawJsonMode(false);
    setDlqSuccessMessage(null);
    setDlqErrorMessage(null);
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditingPayload((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (value === 'true') updated[key] = true;
      else if (value === 'false') updated[key] = false;
      else if (!isNaN(Number(value)) && value.trim() !== '') updated[key] = Number(value);
      else {
        try {
          if (
            (value.startsWith('{') && value.endsWith('}')) ||
            (value.startsWith('[') && value.endsWith(']'))
          ) {
            updated[key] = JSON.parse(value);
          } else {
            updated[key] = value;
          }
        } catch (e) {
          updated[key] = value;
        }
      }
      return updated;
    });
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    setEditingPayload((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        [newFieldName.trim()]: newFieldValue,
      };
    });
    setNewFieldName('');
    setNewFieldValue('');
  };

  const handleRemoveField = (key: string) => {
    setEditingPayload((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleSaveRawJson = () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      setEditingPayload(parsed);
      setIsRawJsonMode(false);
      setDlqErrorMessage(null);
    } catch (e: any) {
      setDlqErrorMessage(`JSON tidak valid: ${e.message}`);
    }
  };

  const handleDeleteDlqRecord = async (recId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus rekor kegagalan DLQ ini secara permanen?'))
      return;
    try {
      if (localDb.dead_letter_queue) {
        await localDb.dead_letter_queue.delete(recId);
      }
      setSelectedDlqId(null);
      setDlqSuccessMessage('Rekor DLQ berhasil dihapus.');
      await runScan();
    } catch (err: any) {
      setDlqErrorMessage(`Gagal menghapus rekor DLQ: ${err.message}`);
    }
  };

  const handleSaveAndRetryDlq = async (recId: string, updatedPayload: any) => {
    setIsSavingDlq(true);
    setDlqSuccessMessage(null);
    setDlqErrorMessage(null);
    try {
      const rec = dlqRecords.find((r) => r.id === recId);
      if (!rec) {
        throw new Error('Data DLQ tidak ditemukan.');
      }

      const entityTable = getTableByName(rec.collection);
      if (entityTable) {
        await entityTable.put(updatedPayload);
      }

      if (localDb.dead_letter_queue) {
        await localDb.dead_letter_queue.delete(recId);
      }

      const newSyncItem = {
        id: recId,
        tenantId: updatedPayload.tenantId || user?.tenantId || 'default',
        collection: rec.collection,
        type: updatedPayload.type || 'create',
        action: updatedPayload.type || 'create',
        payload: updatedPayload,
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
      };

      if (localDb.sync_queue) {
        await localDb.sync_queue.put(newSyncItem);
      }

      await SyncEngine.processQueue();

      setDlqSuccessMessage(
        `Sukses! Data untuk koleksi "${rec.collection}" berhasil diperbarui, dikembalikan ke Sync Queue, dan proses sinkronisasi dipicu.`,
      );
      setSelectedDlqId(null);
      await runScan();
    } catch (err: any) {
      setDlqErrorMessage(`Gagal memproses ulang: ${err.message || err}`);
    } finally {
      setIsSavingDlq(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-700 dark:text-rose-400">
        <h4 className="text-xs font-bold uppercase flex items-center gap-1.5 font-sans">
          <Icons.ShieldExclamationIcon className="w-4 h-4" />
          Panduan Antrean Gagal (Dead Letter Queue - DLQ)
        </h4>
        <p className="text-[10px] leading-relaxed mt-1 font-sans font-medium">
          Data yang gagal dikirim ke Cloud Firestore setelah beberapa kali percobaan akan disimpan di sini agar tidak hilang. Anda dapat memantau penyebab galat, melakukan koreksi langsung pada kolom data yang salah, dan mengirimkannya kembali ke sistem awan.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#0B1124] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-white font-sans">
            Diagnostik Antrean Gagal (DLQ)
          </h3>
          <p className="text-[9px] text-slate-400 mt-0.5">
            Memantau transaksi lokal yang tersumbat dan tidak dapat disinkronkan ke Firestore
          </p>
        </div>
        {dlqRecords.length > 0 && (
          <button
            onClick={handleRetrySync}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold uppercase transition"
          >
            Coba Sinkron Ulang Semua
          </button>
        )}
      </div>

      {dlqSuccessMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-xl">
          {dlqSuccessMessage}
        </div>
      )}
      {dlqErrorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-xl font-mono">
          {dlqErrorMessage}
        </div>
      )}

      {dlqRecords.length === 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-6 rounded-2xl text-center">
          <h4 className="text-sm font-bold uppercase font-sans">Semua Antrean Bersih (DLQ Kosong)</h4>
          <p className="text-[10px] mt-1">Tidak ada data yang tersumbat. Sinkronisasi lokal ke Firestore berjalan sempurna!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dlqRecords.map((rec) => {
            const isEditing = selectedDlqId === rec.id;
            const hasMissingTenantId = !rec.payload?.tenantId;

            return (
              <div key={rec.id} className="bg-white dark:bg-[#0B1124] p-4 rounded-2xl border border-rose-500/20 shadow-sm transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[8px] font-bold uppercase tracking-wider font-mono">DLQ ERROR</span>
                    <span className="font-mono text-[10px] font-bold text-slate-800 dark:text-white">Koleksi: {rec.collection}</span>
                    <span className="text-[9px] text-slate-400 font-mono">ID: {rec.id}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">{new Date(rec.timestamp).toLocaleString('id-ID')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[8px] font-bold uppercase text-rose-500 tracking-wider block font-sans">🚨 Detail Penyebab Galat</span>
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono bg-rose-500/5 dark:bg-rose-950/20 p-2.5 rounded-xl mt-1 border border-rose-500/10 whitespace-pre-wrap leading-relaxed">{rec.error}</p>
                    </div>

                    {hasMissingTenantId && (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-[9px] font-semibold leading-relaxed font-sans">
                        ⚠️ <strong>Peringatan Keamanan Multi-Tenant:</strong> Atribut <code>tenantId</code> tidak terdeteksi!
                      </div>
                    )}

                    <div>
                      <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider block font-sans">Struktur Data Sebelum Perbaikan</span>
                      <pre className="text-[9px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl mt-1 overflow-x-auto max-h-48 border border-slate-100 dark:border-slate-800">
                        {JSON.stringify(rec.payload, null, 2)}
                      </pre>
                    </div>

                    {!isEditing && (
                      <div className="pt-2">
                        <button onClick={() => handleStartEditDlq(rec)} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-wider transition inline-flex items-center gap-1.5">🛠️ Perbaiki & Sinkron Ulang</button>
                        <button onClick={() => handleDeleteDlqRecord(rec.id)} className="ml-2 px-3 py-1.5 bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-bold uppercase tracking-wider transition">Hapus Permanen</button>
                      </div>
                    )}
                  </div>

                  <div>
                    {isEditing ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                          <h4 className="text-[10px] font-bold uppercase text-slate-800 dark:text-white font-sans">Koreksi Data / Field Editor</h4>
                          <button onClick={() => setIsRawJsonMode(!isRawJsonMode)} className="text-[9px] text-indigo-500 font-bold hover:underline">
                            {isRawJsonMode ? 'Mode Formulir' : 'Edit JSON Mentah'}
                          </button>
                        </div>

                        {isRawJsonMode ? (
                          <div className="space-y-2">
                            <textarea rows={8} className="w-full p-2 bg-slate-950 text-emerald-400 font-mono text-[9px] rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500" value={rawJsonText} onChange={(e) => setRawJsonText(e.target.value)} />
                            <div className="flex gap-2">
                              <button onClick={handleSaveRawJson} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold">Terapkan JSON</button>
                              <button onClick={() => setIsRawJsonMode(false)} className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[9px] font-bold">Batal</button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                            {Object.entries(editingPayload || {}).map(([key, val]) => (
                              <div key={key} className="flex items-center justify-between gap-2 bg-white dark:bg-[#070B16] p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                <div className="flex-1">
                                  <label className="text-[8px] font-bold uppercase text-slate-400 block font-mono tracking-wider">{key}</label>
                                  <input type="text" className="w-full bg-transparent text-[10px] text-slate-800 dark:text-white font-mono font-bold mt-0.5 focus:outline-none" value={typeof val === 'object' ? JSON.stringify(val) : String(val)} onChange={(e) => handleFieldChange(key, e.target.value)} />
                                </div>
                                <button onClick={() => handleRemoveField(key)} className="text-rose-500 hover:text-rose-700 text-[9px] font-bold px-1.5 py-1">×</button>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="Nama Field" className="px-2 py-1 bg-white dark:bg-[#070B16] text-[9px] font-mono border border-slate-200 dark:border-slate-800 rounded-lg" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} />
                                <input type="text" placeholder="Nilai Field" className="px-2 py-1 bg-white dark:bg-[#070B16] text-[9px] font-mono border border-slate-200 dark:border-slate-800 rounded-lg" value={newFieldValue} onChange={(e) => setNewFieldValue(e.target.value)} />
                              </div>
                              <button onClick={handleAddField} className="mt-1.5 px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-[8px] font-bold uppercase transition">+ Tambahkan Field</button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <button onClick={() => handleSaveAndRetryDlq(rec.id, editingPayload)} disabled={isSavingDlq} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-[9px] uppercase transition">
                            {isSavingDlq ? 'Memproses...' : '💾 Simpan & Sinkron'}
                          </button>
                          <button onClick={() => { setSelectedDlqId(null); setEditingPayload(null); }} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-[9px] uppercase transition">Batal</button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/10">
                        <span className="text-xl">🛠️</span>
                        <p className="text-[10px] text-slate-400 font-bold mt-2">Gunakan panel di kiri untuk memperbaiki data.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
