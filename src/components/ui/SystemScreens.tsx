import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, ArrowPathIcon } from '@/shared/Icons';

export const LoadingScreen: React.FC<{ log?: string[] }> = ({ log }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden">
    <div className="relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />

      <div className="relative text-center z-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full mx-auto mb-8"
        />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          Memuat e-Mam System
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Mempersiapkan database dan layanan sistem...
        </p>

        {log && log.length > 0 && (
          <div className="max-w-xs mx-auto bg-slate-100 dark:bg-slate-900/50 rounded-xl p-3 text-left border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
              Initialization Log
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar">
              {log.slice(-5).map((msg, idx) => (
                <div
                  key={idx}
                  className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate"
                >
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export const MaintenanceScreen: React.FC<{ error?: string | null; onRetry: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
      <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-12">
        <svg
          className="w-10 h-10 text-amber-600 dark:text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Sistem Dalam Perbaikan
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        Maaf, sistem tidak dapat diinisialisasi saat ini. Ini mungkin disebabkan oleh pembaruan
        struktur data atau kendala pada perangkat penyimpanan lokal Anda.
      </p>

      {error && (
        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-1">
            Error Detail
          </div>
          <div className="text-xs font-mono text-red-500 dark:text-red-400 break-words">
            {error}
          </div>
        </div>
      )}

      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
      >
        <ArrowPathIcon className="w-5 h-5" />
        Coba Lagi
      </button>

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        Jika masalah berlanjut, silakan hubungi tim IT Madrasah Anda.
      </p>
    </div>
  </div>
);

export const SelfHealingScreen: React.FC<{ log: string[] }> = ({ log }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6 overflow-hidden">
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px] animate-pulse" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] animate-pulse"
        style={{ animationDelay: '1s' }}
      />
    </div>

    <div className="max-w-md w-full relative z-10 text-center">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(79,70,229,0.4)]"
      >
        <SparklesIcon className="w-12 h-12 text-white" />
      </motion.div>

      <h2 className="text-3xl font-bold mb-4  uppercase italic">Self Healing</h2>
      <p className="text-indigo-200/70 mb-10 text-lg font-medium leading-tight">
        Mendeteksi inkonsistensi struktur data.
        <br />
        Menjalankan protokol perbaikan otomatis...
      </p>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 text-left">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">
            Healing Protocol Logs
          </span>
        </div>

        <div className="space-y-3 font-mono text-[11px] h-48 overflow-y-auto custom-scrollbar pr-2">
          {log.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={idx}
              className={`flex gap-3 ${idx === log.length - 1 ? 'text-indigo-300' : 'text-white/40'}`}
            >
              <span className="shrink-0 opacity-30">{idx + 1}</span>
              <span>{msg}</span>
            </motion.div>
          ))}
          <div id="log-bottom" />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-4 text-white/30 text-[10px] font-medium uppercase tracking-wide">
        <span>AI Assisted Repair</span>
        <div className="w-1 h-1 bg-white/20 rounded-full" />
        <span>Offline-First Guard</span>
      </div>
    </div>
  </div>
);
