import { firestoreGateway as dbGateway } from '../gateways/FirestoreGateway';
import type { TenantData } from '@/hooks/useTenant';
import { useTenantStore } from '@/hooks/useTenant';
import { realtimeHub } from './realtimeHub';

/**
 * Enterprise Subscriptions for Tenant configurations
 * Ensuring tenant isolation on the snapshot layer
 * Integrated with central RealtimeHub registry
 */
export const subscribeTenantData = (
  tenantId: string,
  onUpdate?: (data: TenantData | null) => void,
): (() => void) => {
  if (!tenantId || !dbGateway.db) return () => {};

  const { setTenantData, setIsLoading } = useTenantStore.getState();
  setIsLoading(true);

  const unsubscribe = dbGateway.onSnapshot(
    dbGateway.doc(dbGateway.db, 'tenants', tenantId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as TenantData;
        setTenantData(data);
        if (onUpdate) onUpdate(data);
      } else {
        setTenantData(null);
        if (onUpdate) onUpdate(null);
      }
    },
    (error) => {
      if (error.code === 'permission-denied') {
        console.warn(
          '[TenantListener] Isolation active: Tenant access restricted by permissions or unauthenticated state.',
        );
      } else {
        console.error('[TenantListener] Error subscribing to tenant:', error);
      }
      setIsLoading(false);
    },
  );

  // Register on our unified hub to prevent leak and manage lifecycle centrally
  realtimeHub.register(`tenant_${tenantId}`, unsubscribe, { tenantId });

  return () => {
    realtimeHub.unregister(`tenant_${tenantId}`);
  };
};
