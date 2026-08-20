import React, { useContext, useMemo } from 'react';
import { ChatContext } from '@/lib/context/ChatContext';
import { LiveComplaintWindow } from '@/features/support/components/LiveComplaintWindow';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getOrCreateGuestSessionId } from '@/utils/chatUtils';
import { UserRole } from '@/types';
import { getSecurityContext } from '@/core/security/contextHelper';

export const ChatWindowContainer = () => {
  const { isChatOpen, setIsChatOpen } = useContext(ChatContext);
  const user = useAuthStore((state) => state.user);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const chatProps = useMemo(() => {
    if (user) {
      const secCtx = getSecurityContext(false);
      const role = secCtx?.role || UserRole.TAMU;
      
      let peranUser: 'siswa' | 'guru' | 'orang_tua' | 'publik' = 'publik';
      if (role === UserRole.SISWA || role === UserRole.KETUA_KELAS) {
        peranUser = 'siswa';
      } else if (role === UserRole.ORANG_TUA) {
        peranUser = 'orang_tua';
      } else if (role !== UserRole.TAMU) {
        peranUser = 'guru';
      }

      return {
        userSessionId: user.uid,
        userNama: user.displayName || 'Pengguna',
        peranUser,
        filterRombelCurrent: 'semua rombel',
        fallbackClass: 'Umum',
      };
    }
    return {
      userSessionId: getOrCreateGuestSessionId(),
      userNama: 'Tamu',
      peranUser: 'publik' as const,
      filterRombelCurrent: 'semua rombel',
      fallbackClass: 'Umum',
    };
  }, [user]);

  if (!isChatOpen) return null;

  return (
    <div className="fixed bottom-24 md:bottom-28 right-6 z-[9998] animate-in slide-in-from-bottom-5 duration-300">
      <LiveComplaintWindow
        {...chatProps}
        isDarkMode={isDarkMode}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default ChatWindowContainer;

