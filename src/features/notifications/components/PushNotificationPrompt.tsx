import React, { useState, useEffect } from 'react';
import { BellIcon, XCircleIcon } from '@/shared/Icons';
import { requestNotificationPermission } from '@/services/notificationService';
import { useAuthStore } from '@/stores/authStore';

export const PushNotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show prompt if permission hasn't been asked yet
    if ('Notification' in window && Notification.permission === 'default') {
      // Add a small delay so it doesn't appear immediately on load
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return;
  }, []);

  const handleAllow = async () => {
    try {
      const user = useAuthStore.getState().user;
      if (user) {
        await requestNotificationPermission(user.uid);
      } else {
        await Notification.requestPermission();
      }
    } catch (error) {
      console.error('Failed to request permission', error);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-[100] animate-in slide-in-from-bottom-8 fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl shadow-indigo-500/20 border border-slate-100 dark:border-slate-800 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <XCircleIcon className="w-5 h-5" />
        </button>

        <div className="flex gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shrink-0">
            <BellIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              Nyalakan Notifikasi
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Dapatkan pemberitahuan penting seperti pengumuman sekolah, peringatan presensi, dan
              info nilai langsung di layar Anda.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Nanti Saja
          </button>
          <button
            onClick={handleAllow}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wide text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            Izinkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
