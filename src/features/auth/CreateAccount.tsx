/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isMockMode } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import type { Student, Teacher } from '@/types';
import { UserRole } from '@/types';
import Layout from '@/layouts/Layout';
import { activateAccountByAdmin } from '@/services/authService';
import {
  UserPlusIcon,
  UserIcon,
  EnvelopeIcon,
  LockIcon,
  ShieldCheckIcon,
  Loader2,
  ChevronDownIcon,
  IdentificationIcon,
  InfoIcon,
} from '@/shared/Icons';
import { toast } from 'sonner';
import { useUserStore } from '@/stores/userStore';

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  studentId?: string;
  studentsId?: string;
  teacherId?: string;
  teachersId?: string;
  idUnik?: string;
  status?: 'Aktif' | 'Nonaktif' | 'Active' | 'Suspended';
  tingkatRombel?: string;
  createdAt?: string;
}

const CreateAccount: React.FC<{ onBack: () => void; userRole: UserRole }> = ({
  onBack,
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState<'create'>('create');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    role: UserRole.SISWA,
    linkId: '',
    idUnik: '',
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const fetchUsersData = async () => {
    if (isMockMode) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { getStudents } = await import('@/services/studentService');
      const { getTeachers } = await import('@/services/teacherService');

      // Parallel load master data
      const [sSnap, tSnap] = await Promise.all([getStudents('All', true, true), getTeachers(true)]);

      // Filter aktif
      setStudents(sSnap.filter((s) => s.status === 'Aktif' || s.statusAktif));
      setTeachers(tSnap);
    } catch (err: any) {
      console.warn('Gagal memuat master data.', err.message);
    } finally {
      setLoading(false);
    }
  };

  const storeRoles = useUserStore((state) => state.roles) || [];
  const currentUserEmail = useUserStore((state) => state.email);
  const currentUserRole = useUserStore((state) => (state.user as any)?.role);
  const currentUserRoles = useUserStore((state) => (state.user as any)?.roles) || [];

  const isAuthorized =
    [userRole, currentUserRole].some((r) => ['admin', 'super_admin', 'developer', 'kepala_madrasah', 'admin_operasional'].includes(String(r).toLowerCase())) ||
    storeRoles.some((r) => ['admin', 'super_admin', 'developer', 'kepala_madrasah', 'admin_operasional'].includes(String(r).toLowerCase())) ||
    currentUserRoles.some((r: any) => ['admin', 'super_admin', 'developer', 'kepala_madrasah', 'admin_operasional'].includes(String(r).toLowerCase())) ||
    currentUserEmail === 'admin@example.com';

  useEffect(() => {
    if (isAuthorized) {
      fetchUsersData();
    }
  }, [isAuthorized]);

  // Filter students/teachers yang belum punya linked account
  const availableLinks = useMemo(() => {
    if (formData.role === UserRole.SISWA) {
      return students.filter((s) => !s.isClaimed && !s.authUid);
    } else {
      return teachers.filter((t) => {
        if (t.linkedUserId) return false;
        // Match role with selected role
        const roleStr = String(formData.role).toLowerCase().replace(/_/g, ' ');
        const tRoleStr = String(t.role || '')
          .toLowerCase()
          .replace(/_/g, ' ');
        return tRoleStr === roleStr;
      });
    }
  }, [formData.role, students, teachers]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPublicRole = [
      UserRole.SISWA,
      UserRole.GURU,
      UserRole.WALI_KELAS,
      UserRole.STAF,
      UserRole.KETUA_KELAS,
    ].includes(formData.role);

    if (!formData.email || !formData.password || (isPublicRole && !formData.linkId)) {
      toast.error('Mohon pilih data induk yang akan dihubungkan.');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Memproses pendaftaran sistem...');
    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        role: formData.role,
        linkId: formData.linkId,
        idUnik: formData.idUnik,
        type:
          formData.role === UserRole.SISWA
            ? 'student'
            : formData.role === UserRole.ADMIN || formData.role === UserRole.DEVELOPER
              ? 'other'
              : 'teacher',
      };

      const res = await activateAccountByAdmin(payload);

      if (res.success) {
        toast.success(res.message || `Akses untuk ${formData.displayName} berhasil diaktifkan!`, {
          id: toastId,
        });
        // Reset form
        setFormData({
          displayName: '',
          email: '',
          password: '',
          role: UserRole.SISWA,
          linkId: '',
          idUnik: '',
        });
      } else {
        toast.error(res.error || 'Gagal aktivasi akun.', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Gagal aktivasi: ' + err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 text-center text-slate-100">
        <div className="max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold lowercase ">Akses Terlarang</h2>
          <p className="text-sm text-slate-400 font-medium font-sans">
            Anda tidak memiliki hak wewenang administratif untuk mengakses pembuatan akun e-Mam
            System.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase tracking-wide text-slate-200 rounded-2xl transition-all"
          >
            Kembali Ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout
      title="Buat Akun Baru"
      subtitle="Aktivasi Akun Pengguna"
      icon={UserPlusIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-8 pb-32 max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto bg-white dark:bg-[#151E32] p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-indigo-500/5 animate-in slide-in-from-bottom-4 duration-500"
        >
          <form onSubmit={handleCreateAccount} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 flex items-center gap-2">
                <ShieldCheckIcon className="w-3.5 h-3.5" /> Pilih Peran Otoritas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  UserRole.ADMIN,
                  UserRole.DEVELOPER,
                  UserRole.KEPALA_MADRASAH,
                  UserRole.WAKAMAD,
                  UserRole.KEPALA_TU,
                  UserRole.GURU,
                  UserRole.GURU_BK,
                  UserRole.STAF,
                  UserRole.PUSTAKAWAN,
                  UserRole.LABORAN,
                  UserRole.PEMBINA_EKSKUL,
                  UserRole.SISWA,
                  UserRole.ORANG_TUA,
                  UserRole.GTK,
                ].map((r, idx) => (
                  <button
                    key={`${r}-${idx}`}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, role: r as UserRole, linkId: '', displayName: '' })
                    }
                    className={`py-3.5 rounded-xl text-[8px] font-bold uppercase border transition-all ${formData.role === r ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-500/30' : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {![UserRole.ADMIN, UserRole.DEVELOPER].includes(formData.role) && (
                <motion.div
                  key="link-data"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 flex items-center gap-2">
                    <IdentificationIcon className="w-3.5 h-3.5" /> Hubungkan{' '}
                    {formData.role === UserRole.SISWA ? 'ID UNIK' : 'NIP'} (Unclaimed)
                  </label>
                  <div className="relative group">
                    <select
                      required
                      value={formData.linkId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const sel =
                          formData.role === UserRole.SISWA
                            ? students.find((s) => s.id === id)
                            : teachers.find((t) => t.id === id);
                        setFormData({
                          ...formData,
                          linkId: id,
                          displayName:
                            (formData.role === UserRole.SISWA
                              ? (sel as Student)?.namaLengkap
                              : (sel as Teacher)?.name) || '',
                          idUnik:
                            (formData.role === UserRole.SISWA
                              ? (sel as Student)?.idUnik
                              : (sel as Teacher)?.nip) || '',
                          email: (sel as any)?.email || formData.email,
                        });
                      }}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-[11px] font-bold outline-none border border-slate-200 dark:border-slate-700 appearance-none cursor-pointer uppercase shadow-inner group-focus-within:border-indigo-500 transition-all"
                    >
                      <option value="">-- PILIH DATA BELUM TERHUBUNG --</option>
                      {availableLinks.length > 0 ? (
                        formData.role === UserRole.SISWA ? (
                          (availableLinks as Student[]).map((s, idx) => (
                            <option key={`${s.id}-${idx}`} value={s.id!}>
                              {s.namaLengkap} ({s.idUnik})
                            </option>
                          ))
                        ) : (
                          (availableLinks as Teacher[]).map((t, idx) => (
                            <option key={`${t.id}-${idx}`} value={t.id!}>
                              {t.name} ({t.nip})
                            </option>
                          ))
                        )
                      ) : (
                        <option disabled value="">
                          TIDAK ADA DATA TERSEDIA
                        </option>
                      )}
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {[UserRole.ADMIN, UserRole.DEVELOPER].includes(formData.role) && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    Nama Tampilan Identitas
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="text"
                      placeholder="NAMA LENGKAP ADMIN"
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData({ ...formData, displayName: e.target.value.toUpperCase() })
                      }
                      className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none shadow-inner uppercase"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    Email Kredensial
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="email"
                      placeholder="email@sekolah.id"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value.toLowerCase() })
                      }
                      className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    Password Akses
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="password"
                      placeholder="MIN. 6 KARAKTER"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex gap-3">
                <InfoIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                <p className="text-[9px] text-indigo-700 dark:text-indigo-300 font-bold uppercase leading-relaxed tracking-tight">
                  Menghubungkan akun akan secara otomatis memperbarui status klaim (isClaimed) pada
                  data induk agar tidak dapat didaftarkan kembali oleh user lain.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-pink-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-pink-500/50 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 transition-all hover:bg-pink-500"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShieldCheckIcon className="w-5 h-5" />
                )}
                AKTIVASI AKSES USER
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default CreateAccount;
