import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon, PencilIcon } from '@/shared/Icons';
import { toast } from 'sonner';
import { reactivateUser } from '@/services/userService';
import { sanitizeError } from '@/utils/firestoreHelpers';
import { AccountEditModal } from './AccountEditModal';

export const PendingActivationList = ({
  users,
  onUpdate,
}: {
  users: any[];
  onUpdate: () => void;
}) => {
  const [editTarget, setEditTarget] = useState<any>(null);

  const handleSetActive = async (user: any) => {
    const userId = user.id || user.uid;
    if (!userId) {
      toast.error('Gagal mendapatkan ID user.');
      return;
    }
    try {
      await reactivateUser(userId, user.displayName);
      toast.success(`Akun ${user.displayName} diaktifkan.`);
      onUpdate();
    } catch (e) {
      toast.error(`Gagal mengaktifkan akun: ${sanitizeError(e)}`);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {users.map((u: any, index: number) => (
          <motion.div
            key={u.id || u.uid || `pending-${index}`}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-tight">
                  {u.displayName}
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">{u.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditTarget(u)}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                title="Edit Data"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSetActive(u)}
                className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-wide shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                Set Active
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {editTarget && (
          <AccountEditModal
            user={editTarget}
            onClose={() => setEditTarget(null)}
            onUpdate={() => {
              setEditTarget(null);
              onUpdate();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};
