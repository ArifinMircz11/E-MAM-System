import React from 'react';
import { useAdminNotification } from '@/hooks/useAdminNotification';
import { sanitizeForJSON } from '@/utils/firestoreHelpers';

export const ProfileApprovalPanel: React.FC = () => {
  const { requests, loading, approveRequest } = useAdminNotification();

  if (loading)
    return <div className="p-8 text-center text-slate-500 font-bold">Memuat antrean...</div>;

  return (
    <div className="p-4" id="profile-approval-panel">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
        Persetujuan Perubahan Profil
      </h2>
      {requests.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-400 font-medium">Tidak ada permintaan tertunda.</p>
        </div>
      )}
      <ul className="space-y-4">
        {requests.map((request: any) => (
          <li
            key={request.id}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-1">
                  Nama Pengguna
                </p>
                <p className="font-bold text-slate-800 dark:text-white">{request.userName}</p>
              </div>
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase ">
                PENDING
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Permintaan Perubahan
              </p>
              <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 overflow-auto max-h-40">
                {JSON.stringify(sanitizeForJSON(request.updates), null, 2)}
              </pre>
            </div>

            <button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              onClick={() => approveRequest(request.id, request.studentsId, request.updates)}
            >
              Setujui Perubahan
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
