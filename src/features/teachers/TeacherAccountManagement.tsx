/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldIcon,
  RefreshCwIcon,
  AtSignIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SearchIcon,
  ArrowLeftIcon,
  TerminalIcon,
  LockIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
} from 'lucide-react';
import { deleteTeacherIdUnik, getTeachers } from '@/services/teacherService';
import { getCurrentIdToken } from '@/services/authService';
import type { Teacher } from '@/types';
import axios from 'axios';
import { toast } from 'sonner';

interface TeacherManagementProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
}

const TeacherAccountManagement: React.FC<TeacherManagementProps> = ({ onBack, onOpenSidebar }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resetting, setResetting] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<Teacher | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState<Teacher | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      // Use client-side, offline-first optimized getTeachers() function
      const data = await getTeachers(false);
      setTeachers(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Gagal mengambil data guru.');
    } finally {
      setLoading(false);
    }
  };

  const generateTempPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleReset = async (teacher: Teacher) => {
    setResetting(teacher.id!);
    const password = generateTempPassword();
    setTempPassword(password);

    try {
      const token = await getCurrentIdToken();
      const response = await axios.post(
        '/api/developer/admin/reset-teacher-auth',
        {
          teacherId: teacher.id || teacher.idUnik,
          newPassword: password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setShowConfirmModal(null);
        setShowSuccessModal(teacher);
        toast.success('Akun berhasil diaktifkan kembali!');
        fetchTeachers(); // Refresh table
      }
    } catch (error: any) {
      console.error('Reset error:', error);
      const msg = error.response?.data?.message || 'Gagal mereset akun.';
      toast.error(msg);
    } finally {
      setResetting(null);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.info('Password berhasil disalin');
  };

  const filteredTeachers = teachers.filter((t) => {
    const name = t.namaLengkap || (t as any).name || '';
    const email = t.email || '';
    const idUnik = t.idUnik || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idUnik.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={onBack}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all active:scale-95"
            >
              <ArrowLeftIcon size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldIcon className="text-indigo-400" size={18} />
                <h1 className="text-2xl font-bold text-white lowercase ">
                  Teacher Account Management
                </h1>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                developer power tools • auth & sync control • e-Mam System
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group w-full md:w-80">
            <SearchIcon
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Cari Guru, Email atau ID..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Informasi Guru
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wide text-center">
                    ID Unik
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wide text-center">
                    Status Akun
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wide text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <RefreshCwIcon className="text-indigo-400 animate-spin" size={32} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Sinkronisasi Auth...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-600">
                        <AlertCircleIcon size={32} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          Data guru tidak ditemukan
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher, index) => (
                    <tr
                      key={`${teacher.id || 'teacher'}-${index}`}
                      className="border-t border-white/5 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                            {(teacher.namaLengkap || (teacher as any).name || 'G').charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                              {teacher.namaLengkap || (teacher as any).name || 'Guru'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                              <AtSignIcon size={12} />
                              <span className="text-[9px] font-bold uppercase">
                                {teacher.email || 'Email belum diset'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 py-1 px-3 rounded-lg border border-white/5">
                          {teacher.idUnik || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-[8px] font-bold uppercase tracking-wide px-3 py-1 rounded-full ${
                              teacher.accountStatus === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-500 animate-pulse'
                            }`}
                          >
                            {teacher.accountStatus || 'Pending'}
                          </span>
                          {!teacher.isClaimed && (
                            <span className="text-[7px] font-bold text-slate-600 uppercase">
                              Belum Klaim Akun
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center flex flex-col gap-2">
                        <button
                          onClick={() => setShowConfirmModal(teacher)}
                          disabled={resetting === teacher.id}
                          className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wide tracking-wide transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 mx-auto w-full justify-center"
                        >
                          {resetting === teacher.id ? (
                            <RefreshCwIcon size={12} className="animate-spin" />
                          ) : (
                            <RefreshCwIcon size={12} />
                          )}
                          Reset
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Yakin ingin menghapus idUnik guru ini?')) {
                              await deleteTeacherIdUnik(teacher.id!);
                              fetchTeachers();
                              toast.success('idUnik berhasil dihapus');
                            }
                          }}
                          className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wide transition-all active:scale-95 flex items-center gap-2 mx-auto w-full justify-center"
                        >
                          <TrashIcon size={12} />
                          Hapus ID
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl">
          <TerminalIcon size={18} className="text-rose-500 shrink-0" />
          <p className="text-[10px] font-bold text-rose-200/60 leading-relaxed uppercase ">
            Warning: Sistem ini akan mengubah password Firebase Auth secara paksa. Gunakan hanya
            jika guru lupa password atau akun terkunci. Guru akan dipaksa mengubah password pada
            login berikutnya.
          </p>
        </div>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/5 rounded-[3rem] p-8 space-y-6 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

              <div className="w-16 h-16 bg-rose-500/20 rounded-3xl flex items-center justify-center text-rose-500 mx-auto">
                <LockIcon size={32} />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white lowercase ">
                  Konfirmasi Reset
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-normal">
                  Apakah Anda yakin ingin mereset akun guru{' '}
                  <span className="text-indigo-400 font-bold">
                    &quot;{showConfirmModal.namaLengkap || (showConfirmModal as any).name || 'Guru'}&quot;
                  </span>
                  ? Akun akan langsung aktif kembali.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold text-slate-400 uppercase tracking-wide transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleReset(showConfirmModal)}
                  className="px-6 py-4 bg-rose-600 hover:bg-rose-700 rounded-2xl text-[10px] font-bold text-white uppercase tracking-wide shadow-lg shadow-rose-900/20 transition-all active:scale-95"
                >
                  Ya, Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                <CheckCircleIcon size={40} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white lowercase ">
                  Akun Diaktifkan!
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-normal">
                  Silakan bagikan password sementara ini kepada{' '}
                  <span className="text-emerald-400">
                    {showSuccessModal.namaLengkap || (showSuccessModal as any).name || 'Guru'}
                  </span>
                </p>
              </div>

              <div className="relative group">
                <div className="p-6 bg-slate-950 rounded-3xl border border-white/5 font-mono text-xl font-bold text-indigo-400 tracking-wide">
                  {tempPassword}
                </div>
                <button
                  onClick={handleCopyPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-xl text-indigo-400 transition-all"
                >
                  {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                </button>
              </div>

              <button
                onClick={() => setShowSuccessModal(null)}
                className="w-full px-6 py-5 bg-indigo-600 hover:bg-indigo-700 rounded-3xl text-[11px] font-bold text-white uppercase tracking-wide transition-all"
              >
                Selesai
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherAccountManagement;
