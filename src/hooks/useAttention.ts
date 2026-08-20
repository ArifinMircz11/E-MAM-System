import { useState, useCallback, useEffect } from 'react';
import type { UserRole } from '@/types';
import { useAutoFix } from '@/hooks/useAutoFix';
import type { AttentionItem } from '@/services/attentionService';
import { getAttentionItems } from '@/services/attentionService';
import { useUserStore } from '@/stores/userStore';

export function useAttention(userRole: UserRole, userId: string | null) {
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { safeCall } = useAutoFix();

  const fetchAttention = useCallback(async () => {
    if (!userId) {
      setAttentionItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const tenantId = useUserStore.getState().tenantId;
      if (!tenantId) throw new Error('tenantId required');
      const items = await safeCall(
        () => getAttentionItems(userRole, userId, tenantId),
        'NotificationCenter.AttentionItems',
      );
      setAttentionItems(items || []);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat pusat perhatian');
    } finally {
      setIsLoading(false);
    }
  }, [userRole, userId, safeCall]);

  useEffect(() => {
    fetchAttention();
  }, [fetchAttention]);

  return {
    attentionItems,
    isLoading,
    error,
    refresh: fetchAttention,
  };
}
