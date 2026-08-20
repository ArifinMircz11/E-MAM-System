/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect } from 'react';
import Layout from '@/layouts/Layout';
import { useAuthStore } from '@/stores/authStore';
import type { SchoolEvent} from '@/services/eventService';
import { registerForEvent, getEvents } from '@/services/eventService';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  Loader2,
  SparklesIcon,
  XCircleIcon,
  TrophyIcon,
  ArrowRightIcon,
} from '@/shared/Icons';

interface EventsProps {
  onBack: () => void;
  userRole: UserRole;
  studentsId?: string;
}

const Events: React.FC<EventsProps> = ({ onBack, userRole, studentsId }) => {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;

  useEffect(() => {
    const fetchEventsData = async () => {
      setLoading(true);
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (error) {
        console.warn('Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEventsData();
  }, []);

  const handleRegister = async (event: SchoolEvent) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      toast.error('Silakan login untuk daftar lomba.');
      return;
    }

    const isAlreadyRegistered = event.participants?.some((p) => p.userId === useAuthStore.getState().user?.id);
    if (isAlreadyRegistered) {
      toast.info('Anda sudah terdaftar di event ini.');
      return;
    }

    // Fetch user data for registration
    const userName = useAuthStore.getState().user?.displayName || 'Siswa';
    // In real app, we would get proper class from profile
    const userClass = 'XI IPA';

    setIsRegistering(true);
    const toastId = toast.loading('Mendaftarkan peserta...');
    try {
      await registerForEvent(event.id!, {
        name: userName,
        class: userClass,
        userId: useAuthStore.getState().user?.id || 'unknown',
      });
      toast.success('Berhasil mendaftar lomba!', { id: toastId });
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Gagal mendaftar.', { id: toastId });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Layout
      title="Event & Lomba"
      subtitle="Portal Kompetisi Siswa"
      icon={TrophyIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-6 pb-32 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 opacity-20" />
            <p className="text-[10px] font-bold  tracking-wide">Memuat Kompetisi...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => {
                  setSelectedEvent(event);
                  setIsModalOpen(true);
                }}
                className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                      <TrophyIcon className="w-6 h-6" />
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                        event.status === 'Buka'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-xl text-slate-500 font-bold">
                    {event.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                  {event.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <CalendarIcon className="w-4 h-4 text-indigo-500" />
                    <span>
                      {new Date(event.date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <MapPinIcon className="w-4 h-4 text-emerald-500" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-slate-300" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {event.participants?.length || 0} Terdaftar
                    </span>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-700">
            <CalendarIcon className="w-16 h-16 text-slate-100 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400">Belum ada agenda lomba saat ini.</p>
          </div>
        )}
      </div>

      {/* Modal Detail & Registration */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-tight text-sm">
                Detail Kompetisi
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <XCircleIcon className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
                  {selectedEvent.title}
                </h4>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-bold uppercase tracking-wide">
                  <TrophyIcon className="w-4 h-4" /> Lomba Sekolah
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {selectedEvent.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Tanggal & Waktu
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {new Date(selectedEvent.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Lokasi Pelaksanaan
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {selectedEvent.location}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <UsersIcon className="w-4 h-4" /> Daftar Peserta (
                  {selectedEvent.participants?.length || 0})
                </h5>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl space-y-3 max-h-48 overflow-y-auto">
                  {selectedEvent.participants?.map((p, i) => (
                    <div
                      key={p.userId || i}
                      className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] font-bold">
                          {i + 1}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          {p.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        {p.class}
                      </span>
                    </div>
                  ))}
                  {(!selectedEvent.participants || selectedEvent.participants.length === 0) && (
                    <p className="text-center py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      Belum ada peserta
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              {selectedEvent.status === 'Buka' ? (
                <button
                  onClick={() => handleRegister(selectedEvent)}
                  disabled={isRegistering}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="w-4 h-4" />
                  )}{' '}
                  DAFTAR SEKARANG
                </button>
              ) : (
                <div className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-2xl text-[10px] uppercase tracking-[0.2em] text-center border border-slate-200 dark:border-slate-700">
                  PENDAFTARAN DITUTUP
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Events;
