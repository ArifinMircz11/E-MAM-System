/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * @author Akhmad Arifin 199010042025211012
 * Pembuat Aplikasi dan Algoritma dan Struktur Data
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLogo, Loader2, CheckIcon } from '@/shared/Icons';
import { useAuthStore } from '@/stores/authStore';
import { useDataSubmission } from '@/hooks/useDataSubmission';
import { userRepository } from '@/repositories/userRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

interface DataSubmissionFormProps {
  onBack: () => void;
}

export const DataSubmissionForm: React.FC<DataSubmissionFormProps> = ({ onBack }) => {
  const user = useAuthStore((state) => state.user);
  const { submit, isSubmitting } = useDataSubmission();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    referenceId: '',
    tenantId: '',
    role: '',
    roles: [] as string[],
    note: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      setIsLoadingData(true);
      try {
        const secCtx = getSecurityContext();
        const data = await userRepository.getById(secCtx, user.uid);
        if (data) {
          setFormData((prev) => ({
            ...prev,
            displayName: data.profile?.displayName || (data as any).displayName || '',
            email: data.profile?.email || (data as any).email || '',
            phone: data.profile?.phoneNumber || (data as any).phoneNumber || '',
            referenceId: data.referenceId || data.idUnik || '',
            tenantId: data.tenantId || '',
            role: data.role || '',
            roles: Array.isArray(data.roles) ? data.roles : data.role ? [data.role] : [],
          }));
        }
      } catch (error) {
        console.error('Error fetching user data for submission form:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  const roleInstructions: Record<string, string> = {
    admin: 'Pastikan semua data admin diisi dengan lengkap untuk akses sistem.',
    staf: 'Lengkapi profil staf dengan data kependidikan terbaru.',
    kepala_tu: 'Inputkan data detail TU untuk keperluan administrasi surat.',
    kepala_madrasah: 'Pastikan data kontak kepala madrasah sudah sesuai.',
    siswa: 'Siswa wajib mengisi NISN dan data orang tua.',
    orangtua: 'Inputkan data nomor HP aktif agar dapat menerima notifikasi.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const success = await submit(user.uid, formData, formData.referenceId);
    if (success) {
      onBack();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    if (e.target.name === 'roles') {
      const options = (e.target as HTMLSelectElement).options;
      const values: string[] = [];
      for (let i = 0, l = options.length; i < l; i++) {
        if (options[i].selected) values.push(options[i].value);
      }
      setFormData((prev) => ({ ...prev, roles: values }));
    } else {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-950 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900 p-8 rounded-3xl border border-white/10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-6">
          <AppLogo className="w-12 h-12 mb-4" />
          <h2 className="text-lg font-bold uppercase tracking-wide text-center">
            Pengajuan Perbaikan Data
          </h2>
          {isLoadingData && (
            <p className="text-[10px] text-indigo-400 animate-pulse mt-2">
              Memuat data profil saat ini...
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase ">
              Reference ID (NISN/NUPTK/ID)
            </label>
            <input
              name="referenceId"
              value={formData.referenceId}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 transition-colors"
              placeholder="ID Referensi Anda..."
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase ">
                Tenant ID (NPSN)
              </label>
              <input
                name="tenantId"
                value={formData.tenantId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 transition-colors"
                placeholder="Tenant ID..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase ">
                Peran Utama
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 transition-colors"
              >
                <option value="">Pilih Peran Utama</option>
                <option value="admin">Admin</option>
                <option value="staf">Staf</option>
                <option value="kepala_tu">Kepala TU</option>
                <option value="kepala_madrasah">Kepala Madrasah</option>
                <option value="siswa">Siswa</option>
                <option value="orangtua">Orang Tua</option>
                <option value="guru">Guru</option>
              </select>
            </div>
          </div>
          {formData.role && roleInstructions[formData.role] && (
            <p className="text-[10px] font-medium text-indigo-400 bg-indigo-400/10 p-2 rounded-lg border border-indigo-400/20">
              {roleInstructions[formData.role]}
            </p>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase ">
              Tugas Tambahan (roles)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { val: 'admin', label: 'Admin' },
                { val: 'staf', label: 'Staf' },
                { val: 'kepala_tu', label: 'Kepala TU' },
                { val: 'kepala_madrasah', label: 'Kepala Madrasah' },
                { val: 'siswa', label: 'Siswa' },
                { val: 'orangtua', label: 'Orang Tua' },
                { val: 'guru', label: 'Guru' },
                { val: 'wakamad', label: 'Wakamad' },
                { val: 'wali_kelas', label: 'Wali Kelas' },
                { val: 'bk', label: 'Guru BK' },
                { val: 'perpustakaan', label: 'Perpustakaan' },
              ].map((role) => {
                const isSelected = formData.roles.includes(role.val);
                return (
                  <button
                    key={role.val}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setFormData((prev) => ({
                          ...prev,
                          roles: prev.roles.filter((r) => r !== role.val),
                        }));
                      } else {
                        setFormData((prev) => ({ ...prev, roles: [...prev.roles, role.val] }));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {role.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 italic mt-1.5">
              Ketuk peran untuk menambah/menghapus tugas tambahan
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase ">
              Nama Lengkap
            </label>
            <input
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 transition-colors"
              placeholder="Nama lengkap baru..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase ">
                Email
              </label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 transition-colors"
                placeholder="Email baru..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase ">
                No. Telepon
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 transition-colors"
                placeholder="No. telepon baru..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase ">
              Catatan Perubahan
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 transition-colors"
              rows={3}
              placeholder="Sebutkan alasan atau detail perubahan lainnya..."
            />
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <svg
                className="w-4 h-4 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-[10px] font-medium text-slate-300 leading-relaxed">
              Setelah mengirim, Anda disarankan untuk{' '}
              <span className="text-indigo-400 font-bold">
                menghubungi Admin/Developer via WhatsApp ke 6285194030064
              </span>{' '}
              untuk mempercepat proses verifikasi dan persetujuan data Anda.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-indigo-600 rounded-2xl font-bold uppercase tracking-wide text-xs hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
              {isSubmitting ? 'Mengirim...' : 'Kirim untuk Review'}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3.5 bg-slate-800 rounded-2xl font-bold uppercase tracking-wide text-xs hover:bg-slate-700 transition-all active:scale-[0.98]"
            >
              Kembali
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DataSubmissionForm;
