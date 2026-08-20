/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useMemo } from 'react';
import { checkInTeacher } from '@/services/teacherAttendanceService';
import type { UserRole } from '@/types';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';
import { toast } from 'sonner';
import {
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Loader2,
  PlayIcon,
  UserIcon,
  BookOpenIcon,
} from '@/shared/Icons';

import { useStudentStore } from '@/stores/studentStore';
import { useTeacherClassAttendanceInit } from '@/hooks/useTeacherClassAttendanceData';
import type { ScheduleItem } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface TeacherClassAttendanceProps {
  userRole: UserRole;
  onSuccess?: () => void;
}

const TeacherClassAttendance: React.FC<TeacherClassAttendanceProps> = ({ userRole, onSuccess }) => {
  const selectedClass = useStudentStore((state) => state.selectedClass);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const { now, currentDay, currentTime } = useMemo(() => {
    const d = new Date();
    return {
      now: d,
      currentDay: format(d, 'EEEE', { locale: localeID }), // Use 'localeID' imported at the top
      currentTime: format(d, 'HH:mm'),
    };
  }, []);

  const { loading, schedules, classes, teacherProfile } = useTeacherClassAttendanceInit(
    selectedClass?.name,
    currentDay,
  );

  const activeSchedules = useMemo(() => {
    return schedules.map((s) => {
      const [start, end] = s.time.split(' - ');
      const isNow = currentTime >= start && currentTime <= end;
      const isPast = currentTime > end;
      const isFuture = currentTime < start;
      return { ...s, isNow, isPast, isFuture };
    });
  }, [schedules, currentTime]);

  const handleCheckIn = async (schedule: ScheduleItem) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const classKey = schedule.class || schedule.classes || '';
    const classInfo = classes[classKey];
    if (!classInfo || !classInfo.id) {
      toast.error(`Data kelas "${classKey}" tidak ditemukan di sistem.`);
      return;
    }

    setCheckingIn(schedule.id);
    const toastId = toast.loading(`Merekam kehadiran di kelas ${schedule.class}...`);

    const getPosition = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          reject(new Error('Browser Anda tidak mendukung fitur lokasi.'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => {
            if (err.code === err.TIMEOUT) {
              // Fallback to low accuracy if high accuracy times out
              navigator.geolocation.getCurrentPosition(
                resolve,
                (fallbackErr) => reject(new Error(fallbackErr?.message || 'Gagal mendapatkan lokasi')),
                {
                  enableHighAccuracy: false,
                  timeout: 10000,
                  maximumAge: 30000,
                },
              );
            } else {
              reject(new Error(err?.message || 'Gagal mengakses GPS'));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          },
        );
      });
    };

    try {
      const position = await getPosition();
      const { latitude, longitude } = position.coords;
      const teacherName = teacherProfile?.name || user?.displayName || 'Guru';
      const teacherId = teacherProfile?.id || user?.id || 'unknown';

      const res = await checkInTeacher(
        teacherId,
        teacherName,
        classInfo.id!,
        `manual_${schedule.id}`,
        latitude,
        longitude,
        navigator.userAgent,
      );

      if (res.status === 'VALID') {
        toast.success(`Berhasil! Kehadiran Anda di kelas ${schedule.class} telah dicatat.`, {
          id: toastId,
        });
        if (onSuccess) onSuccess();
      } else {
        toast.warning(
          `Lokasi Terdeteksi di Luar Jangkauan (${res.distance}m). Data tetap dicatat sebagai ANOMALI.`,
          {
            id: toastId,
            description: 'Pastikan Anda berada di area kelas saat menekan tombol.',
          },
        );
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      if (err.name === 'GeolocationPositionError' || err.code) {
        toast.error('Gagal mendapatkan lokasi. Pastikan izin GPS aktif dan sinyal memadai.', {
          id: toastId,
        });
      } else {
        toast.error('Gagal merekam kehadiran: ' + err.message, { id: toastId });
      }
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          Sinkronisasi Jadwal Hari Ini...
        </p>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="py-20 px-8 text-center bg-white dark:bg-[#151E32] rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6">
          <BookOpenIcon className="w-8 h-8" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
          Tidak Ada Jadwal Mengajar
        </h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-2 leading-relaxed text-center">
          Anda tidak memiliki jadwal mengajar terdaftar untuk hari {currentDay}.<br />
          Silakan hubungi admin kurikulum jika ini adalah kesalahan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
            Jadwal Mengajar Anda
          </h3>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mt-1">
            {currentDay}, {format(now, 'dd MMMM yyyy', { locale: localeID })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">
            {currentTime} WIB
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeSchedules.map((s) => (
          <div
            key={s.id}
            className={`relative overflow-hidden p-6 rounded-[2.5rem] border transition-all duration-300 ${
              s.isNow
                ? 'bg-white dark:bg-[#151E32] border-indigo-500 shadow-xl shadow-indigo-500/10'
                : s.isPast
                  ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 opacity-60'
                  : 'bg-white dark:bg-[#151E32] border-slate-100 dark:border-slate-800 shadow-sm'
            }`}
          >
            {s.isNow && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            )}

            <div className="flex justify-between items-start relative z-10">
              <div className="flex gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    s.isNow
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
                      {s.time}
                    </span>
                    {s.isNow && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-bold rounded-md uppercase tracking-wide animate-pulse">
                        Sedang Berlangsung
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight mt-1 truncate max-w-[180px] sm:max-w-none">
                    {s.subject}
                  </h4>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      <MapPinIcon className="w-3 h-3" />
                      {s.class}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      <UserIcon className="w-3 h-3" />
                      {s.room}
                    </div>
                  </div>
                </div>
              </div>

              {!s.isPast && (
                <button
                  onClick={() => handleCheckIn(s)}
                  disabled={checkingIn !== null}
                  className={`px-6 py-4 rounded-[1.5rem] font-bold text-[10px] uppercase tracking-wide transition-all active:scale-95 flex items-center gap-3 shadow-lg ${
                    s.isNow
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {checkingIn === s.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Merekam...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-4 h-4" />
                      Absen Sekarang
                    </>
                  )}
                </button>
              )}

              {s.isPast && (
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-[9px] uppercase tracking-wide">
                  <CheckCircleIcon className="w-4 h-4" />
                  Selesai
                </div>
              )}
            </div>

            {s.isNow && (
              <div className="mt-6 flex items-start gap-3 p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
                <ExclamationTriangleIcon className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold text-indigo-600/70 leading-relaxed uppercase tracking-wide">
                  Tombol absen aktif karena Anda sedang dijadwalkan mengajar saat ini. Pastikan Anda
                  sudah berada di lokasi kelas untuk akurasi data geofencing.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-center">
        <p className="text-[9px] font-bold text-slate-400 tracking-[0.2em] leading-relaxed uppercase text-center">
          Sistem ini merekam koordinat GPS dan ID perangkat saat Anda melakukan absensi.
          <br />
          Ketidaksesuaian lokasi akan dicatat sebagai anomali di level manajemen.
        </p>
      </div>
    </div>
  );
};

export default TeacherClassAttendance;
