import { db } from '@/database/db';

export interface SchoolEvent {
  id?: string;
  tenantId: string;
  title: string;
  description: string;
  date: string;
  location: string;
  participants?: Array<{
    userId: string;
    name: string;
    class: string;
  }>;
  [key: string]: any;
}

export const getEvents = async (tenantId: string = 'tenant-demo'): Promise<SchoolEvent[]> => {
  try {
    if (db.table('events')) {
      const all = await db.table('events').where('tenantId').equals(tenantId).toArray();
      if (all.length > 0) return all as SchoolEvent[];
    }
  } catch {}
  return [
    {
      id: 'event-1',
      tenantId,
      title: 'Lomba Pidato Bahasa Arab Ke-5',
      description: 'Kompetisi pidato tingkat madrasah se-kabupaten.',
      date: '2026-09-12',
      location: 'Aula Utama MAN 1 HST',
      participants: [],
    },
    {
      id: 'event-2',
      tenantId,
      title: 'Olimpiade Sains Madrasah (OSM)',
      description: 'Saringan seleksi tingkat sekolah bidang Fisika, Kimia, dan Biologi.',
      date: '2026-09-20',
      location: 'Lab Bersama lt. 2',
      participants: [],
    }
  ];
};

export const saveEvent = async (event: any, tenantId: string = 'tenant-demo'): Promise<boolean> => {
  try {
    if (db.table('events')) {
      const id = event.id || `evt_${Date.now()}`;
      await db.table('events').put({
        ...event,
        id,
        tenantId,
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const deleteEvent = async (id: string): Promise<boolean> => {
  try {
    if (db.table('events')) {
      await db.table('events').delete(id);
    }
  } catch {}
  return true;
};

export const registerForEvent = async (
  eventId: string,
  participant: { name: string; class: string; userId: string }
): Promise<boolean> => {
  try {
    if (db.table('events')) {
      const existing = (await db.table('events').get(eventId)) as SchoolEvent | undefined;
      if (existing) {
        const participants = existing.participants || [];
        if (!participants.some((p) => p.userId === participant.userId)) {
          participants.push(participant);
          await db.table('events').put({
            ...existing,
            participants,
            updatedAt: Date.now(),
          });
        }
      }
      return true;
    }
  } catch {}
  return false;
};

export const eventService = {
  getEvents,
  saveEvent,
  deleteEvent,
  registerForEvent,
};
