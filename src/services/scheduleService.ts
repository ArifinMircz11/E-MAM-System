/**
 * @license
 * e-Mam System - Schedule Service
 * LAYER: SERVICE (Architecture Compliant)
 * Offline-first schedule management using ScheduleRepository and Dexie.
 */

import { scheduleRepository } from '@/repositories/ScheduleRepository';
import { TenantContext } from '@/core/context/TenantContext';
import type { ScheduleItem } from '@/types';
import { logAudit } from './auditLogService';

const MOCK_SCHEDULES: ScheduleItem[] = [
  {
    id: '1',
    day: 'Senin',
    time: '07:30 - 08:15',
    subject: 'Matematika (Mariana)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: '2',
    day: 'Senin',
    time: '08:15 - 09:00',
    subject: 'Kimia (Rusmalina)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: '3',
    day: 'Senin',
    time: '09:00 - 09:45',
    subject: 'Kimia (Rusmalina)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: 'break1',
    day: 'Senin',
    time: '09:45 - 10:00',
    subject: 'ISTIRAHAT',
    class: '10 A',
    room: '-',
  },
  {
    id: '4',
    day: 'Senin',
    time: '10:00 - 10:45',
    subject: 'Sejarah (Alfi Syahrin)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: '5',
    day: 'Senin',
    time: '10:45 - 11:30',
    subject: 'Sejarah (Alfi Syahrin)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: '6',
    day: 'Senin',
    time: '11:30 - 12:15',
    subject: 'Tafsir (Juhda Rahlia)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: 'break2',
    day: 'Senin',
    time: '12:15 - 12:30',
    subject: 'ISTIRAHAT',
    class: '10 A',
    room: '-',
  },
  {
    id: '7',
    day: 'Senin',
    time: '12:30 - 13:15',
    subject: 'Tafsir (Juhda Rahlia)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: '8',
    day: 'Senin',
    time: '13:15 - 14:00',
    subject: 'BTA (Farah Adefia)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: '9',
    day: 'Senin',
    time: '14:00 - 14:45',
    subject: 'BTA (Farah Adefia)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: '10',
    day: 'Senin',
    time: '14:45 - 15:30',
    subject: 'Informatika (Rajib Habibi)',
    class: '10 A',
    room: 'Lab Komp',
  },
  {
    id: '11',
    day: 'Senin',
    time: '15:30 - 16:15',
    subject: 'Olahraga (Opsional)',
    class: '10 A',
    room: 'Lapangan',
  },
  {
    id: 't1',
    day: 'Selasa',
    time: '07:30 - 08:15',
    subject: 'Matematika (Mariana)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: 't2',
    day: 'Selasa',
    time: '08:15 - 09:00',
    subject: 'Kimia (Rusmalina)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: 'w1',
    day: 'Rabu',
    time: '07:30 - 08:15',
    subject: 'Matematika (Mariana)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: 'th1',
    day: 'Kamis',
    time: '07:30 - 08:15',
    subject: 'Matematika (Mariana)',
    class: '10 A',
    room: 'R. 12',
  },
  {
    id: 'f1',
    day: "Jum'at",
    time: '07:30 - 08:15',
    subject: 'Tafsir (Juhda Rahlia)',
    class: '10 A',
    room: 'R. 12',
  },
];

export const getSchedules = async (): Promise<ScheduleItem[]> => {
  try {
    const context = TenantContext.getContext();
    const localSchedules = await scheduleRepository.fetchByTenant(context, context.tenantId);

    if (!localSchedules || localSchedules.length === 0) {
      // Seed default mock schedules locally
      for (const sched of MOCK_SCHEDULES) {
        await scheduleRepository.create({
          ...sched,
          tenantId: context.tenantId,
          academicYearId: 'TP2026',
          semesterId: 'GANJIL',
          classId: sched.class || '10 A',
          dayOfWeek: sched.day === 'Senin' ? 1 : sched.day === 'Selasa' ? 2 : sched.day === 'Rabu' ? 3 : sched.day === 'Kamis' ? 4 : 5,
          period: 1,
          startTime: sched.time.split(' - ')[0] || '07:30',
          endTime: sched.time.split(' - ')[1] || '08:15',
          isActive: true,
        } as any);
      }
      return MOCK_SCHEDULES;
    }

    return localSchedules.map((s: any) => ({
      id: s.id,
      day: s.day || 'Senin',
      time: s.time || `${s.startTime || '07:30'} - ${s.endTime || '08:15'}`,
      subject: s.subject || s.subjectId || 'Mata Pelajaran',
      class: s.class || s.classId || '10 A',
      room: s.room || s.roomId || 'R. 12',
      isLocked: s.isLocked,
    }));
  } catch (error) {
    console.warn('[ScheduleService] Error fetching local schedules, falling back to mock:', error);
    return MOCK_SCHEDULES;
  }
};

export const saveScheduleItemWithBatch = async (newItem: ScheduleItem): Promise<void> => {
  try {
    const context = TenantContext.getContext();
    await scheduleRepository.update({
      ...newItem,
      tenantId: context.tenantId,
      academicYearId: 'TP2026',
      semesterId: 'GANJIL',
      classId: newItem.class || newItem.classes || '10 A',
      dayOfWeek: newItem.day === 'Senin' ? 1 : newItem.day === 'Selasa' ? 2 : newItem.day === 'Rabu' ? 3 : newItem.day === 'Kamis' ? 4 : 5,
      period: 1,
      startTime: newItem.time?.split(' - ')[0] || '07:30',
      endTime: newItem.time?.split(' - ')[1] || '08:15',
      isActive: true,
    } as any);

    await logAudit({
      action: 'SCHEDULE_SAVED',
      category: 'SYSTEM',
      details: `Jadwal ${newItem.subject} untuk ${newItem.class || newItem.classes} disimpan secara offline-first.`,
    });
  } catch (error) {
    console.error('[ScheduleService] Failed to save schedule item:', error);
    throw error;
  }
};

export const bulkImportSchedule = async (items: Omit<ScheduleItem, 'id'>[]): Promise<void> => {
  try {
    const context = TenantContext.getContext();
    const entities = items.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      tenantId: context.tenantId,
      academicYearId: 'TP2026',
      semesterId: 'GANJIL',
      classId: item.class || item.classes || '10 A',
      dayOfWeek: item.day === 'Senin' ? 1 : 2,
      period: 1,
      startTime: item.time?.split(' - ')[0] || '07:30',
      endTime: item.time?.split(' - ')[1] || '08:15',
      isActive: true,
    }));
    for (const entity of entities) {
      await scheduleRepository.create(entity as any);
    }
  } catch (error) {
    console.error('[ScheduleService] Failed bulk import schedule:', error);
    throw error;
  }
};
