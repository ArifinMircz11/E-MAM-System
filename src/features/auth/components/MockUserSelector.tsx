import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Code, GraduationCap, Loader2, Shield, Users } from 'lucide-react';
import { isMockMode } from '@/services/authService';
import { UserRole } from '@/types';
import { preAuthAccountService } from '../services/preAuthAccountService';

interface MockUserSelectorProps {
  onLogin: (role: UserRole) => void;
  loginFn: (identifier: string, password: string) => Promise<any>;
}

type DevelopmentAccount = {
  uid?: string;
  id?: string;
  email?: string;
  displayName?: string;
  nama?: string;
  role?: string;
  roles?: string[];
  idUnik?: string;
};

const ROLE_LABELS: Record<string, string> = {
  developer: 'Developer',
  admin: 'Admin',
  kepala_madrasah: 'Kepala Madrasah',
  kepala_tu: 'Kepala TU',
  staf: 'Staf',
  guru: 'Guru',
  bk: 'BK',
  guru_bk: 'Guru / BK',
  siswa: 'Siswa',
};

const getRoleBadge = (role?: string) => {
  const normalized = String(role || '').toLowerCase();
  if (normalized.includes('dev')) return { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', icon: Code };
  if (normalized.includes('admin') || normalized.includes('kepala')) return { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', icon: Shield };
  if (normalized.includes('guru') || normalized.includes('staf') || normalized.includes('bk')) return { bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-700 dark:text-indigo-400', icon: BookOpen };
  return { bg: 'bg-sky-50 dark:bg-sky-950/20', text: 'text-sky-700 dark:text-sky-400', icon: GraduationCap };
};

export const MockUserSelector: React.FC<MockUserSelectorProps> = ({ onLogin, loginFn }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<DevelopmentAccount[]>([]);
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMockMode) return;

    let cancelled = false;
    const loadAccounts = async () => {
      try {
        const accounts = await preAuthAccountService.getDevelopmentAccounts();
        if (!cancelled && accounts.length > 0) setUsers(accounts as DevelopmentAccount[]);
      } catch (error) {
        console.warn('[PreAuthAccount] Failed to load development accounts:', error);
        if (!cancelled) {
          setUsers([
            { uid: 'usr_dev', displayName: 'Developer', email: 'dev@emam.id', role: 'developer', roles: ['developer'] },
            { uid: 'usr_admin', displayName: 'Administrator', email: 'admin@example.com', role: 'admin', roles: ['admin'] },
            { uid: 'usr_kepala', displayName: 'Kepala Madrasah', email: 'kepala@example.com', role: 'kepala_madrasah', roles: ['kepala_madrasah'] },
            { uid: 'usr_guru', displayName: 'Guru', email: 'guru@example.com', role: 'guru', roles: ['guru'] },
            { uid: 'usr_siswa', displayName: 'Siswa', email: 'siswa@example.com', role: 'siswa', roles: ['siswa'] },
          ]);
        }
      }
    };

    void loadAccounts();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointer = (event: MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node) || triggerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  if (!isMockMode) return null;

  const handleSelectUser = async (user: DevelopmentAccount) => {
    const identifier = user.email || user.idUnik || user.uid || user.id;
    if (!identifier) return;

    setLoadingUser(user.uid || user.id || identifier);
    setErrorStr(null);
    try {
      // Development-only seeded credential. This never replaces production auth.
      const result = await loginFn(identifier, '123456');
      if (result.success && result.role) onLogin(result.role as UserRole);
      else setErrorStr(result.error || 'Gagal login simulasi.');
    } catch (error: any) {
      setErrorStr(error?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoadingUser(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] font-sans">
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/30 border border-indigo-500/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
        title="Akun Pengguna — Development"
        aria-label="Buka akun pengguna development"
        aria-expanded={isOpen}
      >
        <Users className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-16 right-0 w-[360px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-120px)] overflow-hidden flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Akun Pengguna
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">Development / Mock Mode</p>
              </div>
              <span className="px-2 py-1 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">MOCK</span>
            </div>

            {errorStr && (
              <div className="mx-4 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-[11px] font-bold">{errorStr}</p>
              </div>
            )}

            <div className="p-4 overflow-y-auto space-y-2">
              {users.map((user) => {
                const primaryRole = user.role || user.roles?.[0];
                const badge = getRoleBadge(primaryRole);
                const RoleIcon = badge.icon;
                const key = user.uid || user.id || user.email || primaryRole || 'user';
                const busy = loadingUser === key;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={loadingUser !== null}
                    onClick={() => void handleSelectUser(user)}
                    className="w-full p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 hover:border-indigo-400/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left flex items-center justify-between gap-3 transition-all disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">{user.displayName || user.nama || 'Pengguna'}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email || user.idUnik || user.uid || 'tanpa identitas'}</p>
                        {user.roles && user.roles.length > 1 && (
                          <p className="text-[9px] text-slate-400 mt-1 truncate">roles: {user.roles.join(', ')}</p>
                        )}
                      </div>
                    </div>
                    {busy ? (
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                    ) : (
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-extrabold flex items-center gap-1 shrink-0 ${badge.bg} ${badge.text}`}>
                        <RoleIcon className="w-3 h-3" />
                        {ROLE_LABELS[primaryRole || ''] || primaryRole || 'User'}
                      </span>
                    )}
                  </button>
                );
              })}

              {users.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">Belum ada akun development di database lokal.</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[9px] text-slate-400 font-semibold">Sumber: Dexie → UserRepository → PreAuthAccountService</p>
              <p className="text-[9px] text-slate-400 mt-1">Password simulasi: <code>123456</code></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
