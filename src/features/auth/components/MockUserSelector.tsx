import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, BookOpen, GraduationCap, Code, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { localDb } from '@/database/dexie';
import { isMockMode } from '@/services/firebase';
import { UserRole } from '@/types';

interface MockUserSelectorProps {
  onLogin: (role: UserRole) => void;
  loginFn: (identifier: string, password: string) => Promise<any>;
}

export const MockUserSelector: React.FC<MockUserSelectorProps> = ({ onLogin, loginFn }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Load seeded mock users from Dexie
  useEffect(() => {
    if (!isMockMode) return;
    const loadMockUsers = async () => {
      try {
        const localUsers = await localDb.users.toArray();
        if (localUsers && localUsers.length > 0) {
          setUsers(localUsers);
        } else {
          // Fallback if seeder hasn't populated yet
          setUsers([
            { uid: 'usr_dev', displayName: 'Developer', email: 'dev@emam.id', role: 'developer' },
            { uid: 'usr_admin', displayName: 'Administrator', email: 'admin@example.com', role: 'admin' },
            { uid: 'usr_kepala', displayName: 'Kepala Madrasah', email: 'kepala@example.com', role: 'kepala_madrasah' },
            { uid: 'usr_guru', displayName: 'Guru', email: 'guru@example.com', role: 'guru' },
            { uid: 'usr_siswa', displayName: 'Siswa', email: 'siswa@example.com', role: 'siswa' },
          ]);
        }
      } catch (err) {
        console.warn('Failed to load mock users from Dexie, using fallback:', err);
      }
    };
    loadMockUsers();
  }, []);

  // Handle Close on Click Outside & Escape Key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Focus management (when panel opens/closes)
  useEffect(() => {
    if (isOpen) {
      // Find all focusable elements inside the panel
      const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Trap focus inside panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && isOpen && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isMockMode) return null;

  const getRoleBadgeStyles = (roleStr: string) => {
    const normalized = (roleStr || '').toLowerCase();
    if (normalized.includes('dev')) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        text: 'text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
        icon: Code,
        label: 'Developer',
      };
    }
    if (normalized.includes('admin')) {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/20',
        text: 'text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
        icon: Shield,
        label: 'Admin',
      };
    }
    if (normalized.includes('kepala')) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
        icon: Shield,
        label: 'Kepala Madrasah',
      };
    }
    if (normalized.includes('guru') || normalized.includes('wali_kelas') || normalized.includes('bk')) {
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/20',
        text: 'text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
        icon: BookOpen,
        label: 'Guru / Staff',
      };
    }
    return {
      bg: 'bg-sky-50 dark:bg-sky-950/20',
      text: 'text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30',
      icon: GraduationCap,
      label: 'Siswa',
    };
  };

  const handleSelectUser = async (user: any) => {
    const identifier = user.email || user.idUnik || user.uid || user.id;
    setLoadingUser(user.uid || user.id);
    setErrorStr(null);

    try {
      // Seeded credentials use '123456' as default password
      const res = await loginFn(identifier, '123456');
      if (res.success && res.role) {
        onLogin(res.role);
      } else {
        setErrorStr(res.error || 'Gagal login simulasi.');
      }
    } catch (err: any) {
      setErrorStr(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoadingUser(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Button */}
      <motion.button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold px-4 py-3.5 rounded-full shadow-2xl shadow-indigo-600/30 border border-indigo-500/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
        title="Demo Pengguna"
        aria-label="Toggle Demo Users Panel"
      >
        <Users className="w-5 h-5" />
        <span className="text-xs font-bold tracking-wider uppercase pr-1 hidden sm:inline">
          Mock Users
        </span>
      </motion.button>

      {/* Interactive Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-16 right-0 w-[350px] max-w-[calc(100vw-32px)] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden max-h-[calc(100vh-140px)] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-indigo-500" />
                  Pilih Pengguna Simulasi
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wide uppercase mt-0.5">
                  Development / Mock Mode
                </p>
              </div>
              <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-900/30 tracking-wider">
                MOCK
              </span>
            </div>

            {/* Error Message */}
            {errorStr && (
              <div className="mx-5 mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-2.5 text-rose-800 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold leading-tight">{errorStr}</p>
              </div>
            )}

            {/* User List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 min-h-0 max-h-[380px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {users.map((user) => {
                const roleInfo = getRoleBadgeStyles(user.role);
                const RoleIcon = roleInfo.icon;
                const isThisLoading = loadingUser === (user.uid || user.id);

                return (
                  <button
                    key={user.uid || user.id}
                    disabled={loadingUser !== null}
                    onClick={() => handleSelectUser(user)}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/25 hover:bg-slate-50 dark:hover:bg-slate-950 border border-slate-100/50 dark:border-slate-800/30 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 flex items-center justify-between transition-all group duration-200 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                       {/* Left Avatar / Icon Placeholder */}
                      <div className="w-10 h-10 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 flex items-center justify-center border border-indigo-100/10 shrink-0">
                        <Users className="w-5 h-5 text-indigo-500/80" />
                      </div>

                      {/* Display Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {user.displayName || user.nama || 'Pengguna'}
                          </p>
                          <span className="bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest leading-none shrink-0 border border-amber-200/20">
                            MOCK
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                          {user.email || 'tanpa_email@emam.id'}
                        </p>
                      </div>
                    </div>

                    {/* Right Role Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isThisLoading ? (
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                      ) : (
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border ${roleInfo.bg} ${roleInfo.text} text-[10px] font-extrabold tracking-wide`}>
                          <RoleIcon className="w-3 h-3" />
                          {roleInfo.label}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 border-t border-slate-100 dark:border-slate-800/50 text-center">
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide">
                Password default untuk simulasi adalah <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-700 dark:text-slate-300">123456</code>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
