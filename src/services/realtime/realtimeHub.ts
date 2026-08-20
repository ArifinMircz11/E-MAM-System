// src/services/realtime/realtimeHub.ts
// Proxy re-exporting core RealtimeHub for complete backward compatibility across services & features

export { realtimeHub, RealtimeHub } from '@/core/realtime/RealtimeHub';
export { type ListenerKey } from '@/core/realtime/RealtimeRegistry';
export type { Unsubscribe } from '@/core/realtime/RealtimeSubscription';
