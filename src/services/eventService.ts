import type { SchoolEvent } from '@/repositories/eventRepository';
import { eventRepository } from '@/repositories/eventRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

export type { SchoolEvent };

export const getEvents = async (): Promise<SchoolEvent[]> => {
  try {
    const secCtx = getSecurityContext();
    return await eventRepository.getByTenant(secCtx);
  } catch (error) {
    console.warn('Failed to fetch events', error);
    return [];
  }
};

export const registerForEvent = async (
  eventId: string,
  participant: { name: string; class: string; userId?: string },
) => {
  const secCtx = getSecurityContext();
  await eventRepository.registerParticipant(secCtx, eventId, participant);
};

export const createEvent = async (event: Omit<SchoolEvent, 'id'>) => {
  const secCtx = getSecurityContext();
  const id = `${secCtx.tenantId}_event_${event.category || 'misc'}_${Date.now()}`;
  await eventRepository.create({
    ...event,
    id,
    tenantId: secCtx.tenantId,
  } as any);
  return id;
};
