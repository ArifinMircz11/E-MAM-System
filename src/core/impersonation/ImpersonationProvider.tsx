import React, { useState, useEffect, useCallback } from 'react';
import { ImpersonationContext } from './ImpersonationContext';
import { ImpersonationSession } from './ImpersonationSession';
import { impersonationService } from './ImpersonationService';
import { useUIStore } from '@/stores/uiStore';
import { ViewState } from '@/types';
import { toast } from 'sonner';

interface ImpersonationProviderProps {
  children: React.ReactNode;
}

export const ImpersonationProvider: React.FC<ImpersonationProviderProps> = ({ children }) => {
  const [session, setSession] = useState<ImpersonationSession | null>(null);

  const syncActiveSession = useCallback(async () => {
    try {
      const active = await impersonationService.getActiveSession();
      setSession(active);
    } catch (e) {
      console.warn('[ImpersonationProvider] Failed to check active session:', e);
    }
  }, []);

  useEffect(() => {
    syncActiveSession();
  }, [syncActiveSession]);

  const startImpersonation = async (targetUser: any, reason?: string) => {
    try {
      const newSession = await impersonationService.startImpersonation(targetUser, reason);
      setSession(newSession);
      
      // Update workspace / view
      useUIStore.getState().setActiveWorkspace('tenant');
      useUIStore.getState().setCurrentView(ViewState.DASHBOARD);

      toast.success(`Berhasil masuk sebagai ${targetUser.name || 'Pengguna'}`);
    } catch (error: any) {
      console.error('[ImpersonationProvider] Start error:', error);
      toast.error(`Gagal melakukan impersonasi: ${error?.message || 'Error tidak diketahui'}`);
    }
  };

  const stopImpersonation = async () => {
    try {
      await impersonationService.stopImpersonation();
      setSession(null);

      // Restore workspace / view
      useUIStore.getState().setActiveWorkspace('developer');
      useUIStore.getState().setCurrentView(ViewState.DEVELOPER_CONSOLE);

      toast.info('Kembali ke akun Developer');
    } catch (error: any) {
      console.error('[ImpersonationProvider] Stop error:', error);
      toast.error('Gagal keluar dari mode impersonasi');
    }
  };

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating: !!session && session.status === 'ACTIVE',
        session,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
};
