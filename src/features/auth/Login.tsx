import React, { useState } from 'react';
import { Loader2, LockIcon, ArrowRightIcon, AppLogo, EnvelopeIcon } from '@/shared/Icons';
import { UserRole } from '@/types';
import { sendPasswordResetEmail, processForcedPasswordChange } from '@/services/authService';
import { useLogin } from './hooks/useLogin';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (role: UserRole) => void;
  onNavigate: (view: any) => void;
}

type Mode = 'login' | 'forgot-password' | 'force-change-password';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { login, loading, error: hookError } = useLogin();
  const [mode, setMode] = useState<Mode>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await login(identifier.trim(), password);
    if (!result.success || !result.role) {
      setError(result.error || hookError?.message || 'Kredensial tidak valid atau akun belum diaktifkan.');
      return;
    }
    if (result.requiresPasswordChange) {
      setPendingRole(result.role);
      setMode('force-change-password');
      return;
    }
    toast.success('Login berhasil');
    onLogin(result.role);
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await sendPasswordResetEmail(resetEmail.trim());
      if (!result.success) {
        setError(result.message || 'Gagal mengirim email reset password.');
        return;
      }
      toast.success(result.message || 'Email reset password telah dikirim.');
      setMode('login');
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setBusy(false);
    }
  };

  const submitForcedPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingRole) {
      setError('Sesi autentikasi tidak valid. Silakan login kembali.');
      setMode('login');
      return;
    }
    if (newPassword.length < 6 || newPassword !== confirmPassword) {
      setError('Password minimal 6 karakter dan konfirmasi harus sama.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await processForcedPasswordChange(newPassword);
      if (!result.success) {
        setError(result.message || 'Gagal menyimpan password baru.');
        return;
      }
      toast.success('Password baru berhasil disimpan.');
      const role = pendingRole;
      setMode('login');
      setPendingRole(null);
      onLogin(role);
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setBusy(false);
    }
  };

  const isBusy = loading || busy;

  return (
    <main className="min-h-[100dvh] w-full flex items-center justify-center bg-slate-50 dark:bg-[#020617] p-6">
      <section className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-8 space-y-7">
        <header className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center">
            <AppLogo className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">e-Mam System</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Autentikasi resmi berbasis Firebase Identity.</p>
        </header>

        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>}

        {mode === 'login' && (
          <form onSubmit={submitLogin} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Email / Identitas</span>
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>
            <button disabled={isBusy} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 flex items-center justify-center gap-2">
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightIcon className="w-4 h-4" />}
              Masuk
            </button>
            <button type="button" onClick={() => setMode('forgot-password')} className="w-full text-sm text-indigo-600 hover:underline">Lupa password?</button>
          </form>
        )}

        {mode === 'forgot-password' && (
          <form onSubmit={submitReset} className="space-y-5">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><EnvelopeIcon className="w-5 h-5" /><span className="font-semibold">Reset password</span></div>
            <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} autoComplete="email" required placeholder="email@contoh.id" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
            <button disabled={isBusy} className="w-full rounded-xl bg-indigo-600 disabled:opacity-60 text-white font-semibold py-3">{isBusy ? 'Memproses…' : 'Kirim reset password'}</button>
            <button type="button" onClick={() => setMode('login')} className="w-full text-sm text-slate-500 hover:underline">Kembali ke login</button>
          </form>
        )}

        {mode === 'force-change-password' && (
          <form onSubmit={submitForcedPassword} className="space-y-5">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><LockIcon className="w-5 h-5" /><span className="font-semibold">Buat password baru</span></div>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={6} placeholder="Password baru" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required minLength={6} placeholder="Konfirmasi password" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
            <button disabled={isBusy} className="w-full rounded-xl bg-indigo-600 disabled:opacity-60 text-white font-semibold py-3">{isBusy ? 'Menyimpan…' : 'Simpan password'}</button>
          </form>
        )}
      </section>
    </main>
  );
};

export default Login;
