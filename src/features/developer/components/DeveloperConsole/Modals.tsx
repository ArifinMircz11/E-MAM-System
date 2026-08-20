import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, TrashIcon, CheckCircleIcon, SparklesIcon } from '@/shared/Icons';

export const DevConfirmModal = ({ modal, onClose }: { modal: any; onClose: () => void }) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  const [isDone, setIsDone] = React.useState(false);
  const [finalMsg, setFinalMsg] = React.useState('');

  const addLog = (m: string) => setLog((prev) => [...prev, m]);

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      const res = await modal.onConfirm(addLog);
      setIsDone(true);
      setFinalMsg(res);
    } catch (e: any) {
      addLog(`ERROR: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!modal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-[#0B1121] w-full max-w-2xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          <div className="space-y-4">
            <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              {modal?.title}
            </h3>
            <p className="text-sm font-bold text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              {modal?.message}
            </p>
          </div>

          <div className="space-y-6 mt-6">
            {log.length > 0 && (
              <div className="bg-[#040815] rounded-2xl p-4 font-mono text-[9px] text-lime-400 space-y-1 h-48 overflow-y-auto custom-scrollbar border border-indigo-950">
                {log.map((line, i) => (
                  <div key={i}>&gt; {line}</div>
                ))}
                {isProcessing && <div className="animate-pulse">_</div>}
              </div>
            )}

            {isDone && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {finalMsg}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {!isDone && (
                <button
                  onClick={handleAction}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-2xl text-[10px] font-bold uppercase tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <TrashIcon className="w-5 h-5" />
                  )}
                  <span>I Understand, Proceed Task</span>
                </button>
              )}
              <button
                onClick={onClose}
                className={`py-3.5 ${isDone ? 'w-full bg-slate-900 dark:bg-slate-800 text-white' : 'w-32 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'} rounded-2xl text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95`}
              >
                {isDone ? 'Close Console' : 'Cancel'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const DevCustomCollectionModal = ({
  open,
  onClose,
  name,
  setName,
  json,
  setJson,
  onSave,
  saving,
  onBeautify,
}: any) => {
  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-[#0B1121] w-full max-w-2xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white mb-6">
            Create New Collection
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">
                Collection Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold outline-none ring-indigo-500/10 focus:ring-4"
                placeholder="e.g. news_announcements"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Initial Document Data (JSON)
                </label>
                <button
                  onClick={onBeautify}
                  className="text-[9px] font-bold uppercase text-indigo-500"
                >
                  Beautify JSON
                </button>
              </div>
              <textarea
                value={json}
                onChange={(e) => setJson(e.target.value)}
                rows={8}
                className="w-full bg-[#040815] text-lime-400 font-mono text-[10px] rounded-2xl p-4 border border-indigo-950 custom-scrollbar outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-bold uppercase"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wide shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <SparklesIcon className="w-5 h-5" />
                )}
                <span>Create Collection Now</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const DevJsonEditorModal = ({
  open,
  onClose,
  mode,
  id,
  json,
  setJson,
  onSave,
  saving,
  onBeautify,
}: any) => {
  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-[#0B1121] w-full max-w-3xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">
            {mode === 'add' ? 'Create New Entry' : `Edit Record ${id}`}
          </h3>
          <p className="text-xs font-bold text-slate-500 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            Manage firestore record data in raw JSON format with omni-guard validation bypass.
          </p>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-slate-500">
                Record Data Payload (JSON)
              </label>
              <button
                onClick={onBeautify}
                className="text-[9px] font-bold uppercase text-indigo-500"
              >
                Beautify JSON
              </button>
            </div>
            <textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              rows={12}
              className="w-full bg-[#040815] text-lime-400 font-mono text-[11px] rounded-3xl p-6 border border-indigo-950 focus:ring-4 focus:ring-indigo-500/10 outline-none custom-scrollbar"
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-bold uppercase"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wide shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5" />
                )}
                <span>{mode === 'add' ? 'Push Document' : 'Update Record'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
