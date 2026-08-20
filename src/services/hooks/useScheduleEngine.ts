import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export interface TimeSlot {
  id: string;
  jam_ke: number;
  mulai: string;
  selesai: string;
  tipe: 'pelajaran' | 'istirahat';
}

export const useScheduleEngine = (
  allSchedules: any[],
  timeSlots: TimeSlot[],
  selectedDate: Date,
) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update setiap menit
    return () => clearInterval(timer);
  }, []);

  const nowStr = format(currentTime, 'HH:mm');
  const dayName = format(selectedDate, 'EEEE', { locale: id });

  // 1. Cari slot aktif
  const activeSlot = timeSlots.find((slot) => nowStr >= slot.mulai && nowStr < slot.selesai);

  // 2. Cari jadwal berdasarkan hari dan slot aktif (jika tanggal hari ini)
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const currentSubject =
    isToday && activeSlot
      ? allSchedules.find((s) => s.day === dayName && s.jam_id === activeSlot.id)
      : null;

  // 3. Cari jadwal berikutnya
  const nextSlot = activeSlot ? timeSlots.find((s) => s.jam_ke === activeSlot.jam_ke + 1) : null;
  const nextSubject =
    isToday && nextSlot
      ? allSchedules.find((s) => s.day === dayName && s.jam_id === nextSlot.id)
      : null;

  return {
    activeSlot,
    currentSubject,
    nextSubject,
    isBreak: activeSlot?.tipe === 'istirahat',
  };
};
