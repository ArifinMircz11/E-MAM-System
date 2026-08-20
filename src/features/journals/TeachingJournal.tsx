import { useUserStore } from '@/stores/userStore';
/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * MODULE: TEACHING JOURNAL (JURNAL MENGAJAR GURU)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/layouts/Layout';
import { SyncStatus } from '@/domain/entities/base';
import {
  BookOpenIcon,
  PlusIcon,
  CalendarIcon,
  SparklesIcon,
  SaveIcon,
  Loader2,
  Search,
  TrashIcon,
  ClockIcon,
} from '@/shared/Icons';
import type { JournalEntry, ClassData } from '@/types';
import { UserRole } from '@/types';
import { getJournals, addJournal } from '@/services/academicService';
import { getClasses } from '@/services/classService';
import { JournalCacheService } from '@/services/journalCacheService';
import { useAutoFix } from '@/hooks/useAutoFix';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { refineJournalText, getAiQueryCount } from '@/services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserProfile } from '@/services/userService';
import { deleteJournal } from '@/services/academicService';

interface TeachingJournalProps {
  onBack?: () => void;
  userRole?: UserRole;
  filterClassName?: string;
}

const TeachingJournal: React.FC<TeachingJournalProps> = ({
  onBack,
  userRole: initialUserRole,
  filterClassName,
}) => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'riwayat' | 'catat'>('riwayat');
  const [userRole, setUserRole] = useState<UserRole>(initialUserRole || UserRole.GURU);
  const [userContext, setUserContext] = useState<{ id: string; name: string; email?: string }>({
    id: 'mock-teacher-1',
    name: 'Guru Pengajar',
  });

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    className: filterClassName || '',
    subject: '',
    jamKe: '1-2',
    materi: '',
    catatan: '',
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState(filterClassName || '');

  // AI Refinement state
  const [isRefining, setIsRefining] = useState(false);
  const [refinedMateri, setRefinedMateri] = useState('');
  const [refinedCatatan, setRefinedCatatan] = useState('');
  const [showAiProposal, setShowAiProposal] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const { safeCall } = useAutoFix();

  // Role grouping
  const isSiswaParent = [UserRole.SISWA, UserRole.ORANG_TUA].includes(userRole);
  const isGuru =
    userRole === UserRole.GURU || userRole === UserRole.WALI_KELAS || userRole === UserRole.GTK;
  const canSeeAllJournals = [
    UserRole.ADMIN,
    UserRole.KEPALA_MADRASAH,
    UserRole.STAF,
    UserRole.DEVELOPER,
  ].includes(userRole);

  const quickSubjects = [
    "Al-Qur'an Hadis",
    'Aqidah Akhlak',
    'Fikih',
    'Sejarah Kebudayaan Islam (SKI)',
    'Matematika Wajib',
    'Matematika Peminatan',
    'Fisika',
    'Kimia',
    'Biologi',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Bahasa Arab',
    'Sejarah Indonesia',
    'Ekonomi',
    'Geografi',
    'Sosiologi',
    'PPKn',
    'Seni Budaya',
    'PJOK',
  ];

  // Fetch identity and roles
  useEffect(() => {
    const initAndFetchProfile = async () => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        try {
          const uData = await getUserProfile(currentUser.uid);
          if (uData) {
            setUserRole((uData?.role as UserRole) || UserRole.GURU);
            setUserContext({
              id: currentUser.uid,
              name: uData?.displayName || currentUser.displayName || 'Guru Pengajar',
              email: currentUser.email || '',
            });
          }
        } catch (err) {
          console.warn('Error fetching user profile:', err);
        }
      } else {
        // Mock default
        setUserContext({
          id: 'mock-teacher-1',
          name: 'Budi Santoso, S.Pd',
          email: 'budi.santoso@e-mam.sch.id',
        });
      }
    };
    initAndFetchProfile();
  }, [initialUserRole]);

  // Main fetch call representing class and journals
  const fetchData = useCallback(async () => {
    setLoading(true);
    await safeCall(async () => {
      // 1. Fetch Classes for dropdown selection
      const classesData = await getClasses();
      setClasses(classesData);

      // Pre-select first class if available
      if (classesData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          className: filterClassName || prev.className || classesData[0].name,
        }));
      }

      // 2. Fetch Journals KBM
      const teacherFilterId = canSeeAllJournals ? undefined : userContext.id;

      const tenantId = useUserStore.getState().tenantId;
      if (!tenantId) throw new Error('tenantId required');

      const journalsData = await JournalCacheService.getJournals(tenantId);
      const filteredJournals = teacherFilterId
        ? journalsData.filter((j) => j.teacherId === teacherFilterId)
        : journalsData;
      setJournals(filteredJournals);
    }, 'TeachingJournal.fetchData');
    setLoading(false);
  }, [userContext.id, canSeeAllJournals, safeCall, filterClassName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (filterClassName) {
      setSelectedClassFilter(filterClassName);
      setFormData((prev) => ({ ...prev, className: filterClassName }));
    }
  }, [filterClassName]);

  // Handle addition of journal entry
  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className || !formData.subject || !formData.materi) {
      toast.warning('Silakan lengkapi pilihan kelas, mata pelajaran, dan rincian materi KBM.');
      return;
    }

    setSubmitting(true);

    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    const newEntry: Omit<JournalEntry, 'id'> = {
      tenantId,
      teacherId: userContext.id,
      teacherName: userContext.name,
      className: formData.className,
      subject: formData.subject,
      date: formData.date,
      jamKe: formData.jamKe,
      materi: formData.materi.trim(),
      catatan: formData.catatan.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: SyncStatus.LOCAL_ONLY,
      version: 1,
      deleted: false,
    };

    const result = await safeCall(async () => {
      return await addJournal(newEntry);
    }, 'TeachingJournal.addJournal');

    if (result) {
      toast.success('Jurnal KBM harian berhasil didokumentasikan!');
      setFormData((prev) => ({
        ...prev,
        materi: '',
        catatan: '',
      }));
      setShowAiProposal(false);
      setRefinedMateri('');
      setRefinedCatatan('');

      // Refresh local journal list
      const teacherFilterId = canSeeAllJournals ? undefined : userContext.id;
      const updatedJournals = await getJournals(teacherFilterId);
      setJournals(updatedJournals);
      setActiveTab('riwayat');
    } else {
      toast.error('Gagal menyimpan jurnal. Silakan periksa koneksi internet Anda.');
    }
    setSubmitting(false);
  };

  // Refine text via Gemini AI Integration
  const handleRefineWithAi = async () => {
    if (getAiQueryCount() >= 5) {
      toast.error('Batas maksimal 5 pertanyaan AI telah tercapai.');
      return;
    }

    if (!formData.subject || !formData.materi) {
      toast.warning(
        'Silakan isi mata pelajaran dan materi minimal sebelum melakukan perbaikan AI.',
      );
      return;
    }

    setIsRefining(true);
    try {
      const rawRefined = await refineJournalText(
        formData.subject,
        formData.materi,
        formData.catatan || 'Kondisi kelas kondusif.',
      );

      // Distribute output (we can split by standard format or make structured AI advice)
      if (rawRefined && !rawRefined.toLowerCase().includes('maaf')) {
        setRefinedMateri(rawRefined);
        setShowAiProposal(true);
        toast.success('AI Co-Pilot berhasil merapikan deskripsi jurnal Anda!');
      } else {
        toast.error('Gagal menghubungi asisten AI saat ini.');
      }
    } catch (err) {
      toast.error('Gagal menyelaraskan dengan asisten AI.');
    } finally {
      setIsRefining(false);
    }
  };

  // Apply AI Refinement
  const applyAiProposal = () => {
    setFormData((prev) => ({
      ...prev,
      materi: refinedMateri,
    }));
    setShowAiProposal(false);
    toast.success('Diksi formal AI berhasil diterapkan pada rincian materi!');
  };

  // Handle entry deletion for admin/teachers
  const handleDeleteEntry = async (journalId: string) => {
    if (
      !window.confirm('Apakah Anda yakin ingin menghapus catatan jurnal KBM ini dari lini masa?')
    ) {
      return;
    }

    await safeCall(async () => {
      await deleteJournal(journalId);
      toast.success('Jurnal KBM berhasil dihapus.');

      // Refresh local journals list
      setJournals((prev) => prev.filter((j) => j.id !== journalId));
    }, 'TeachingJournal.deleteJournal');
  };

  // Memoized Search Filter
  const filteredJournals = useMemo(() => {
    return journals.filter((entry) => {
      const matchesSearch =
        (entry.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.materi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.catatan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.teacherName || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = selectedClassFilter === '' || entry.className === selectedClassFilter;

      return matchesSearch && matchesClass;
    });
  }, [journals, searchQuery, selectedClassFilter]);

  const contentEl = (
    <div className={`max-w-7xl mx-auto space-y-6 ${filterClassName ? '' : 'px-4 py-6 pb-24'}`}>
      {/* --- DYNAMIC WELCOME BANNER --- */}
      {!filterClassName && (
        <div className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <BookOpenIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide">
                Identitas Logged-In
              </p>
              <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                {userContext.name}
              </h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-1">
                Role: {userRole} •{' '}
                {canSeeAllJournals ? 'Akses Madrasah Terbuka' : 'Akses Guru Terbatas'}
              </p>
            </div>
          </div>

          <div className="flex md:flex-col items-end gap-1.5 shrink-0 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400">Total Entry Jurnal KBM:</span>
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 leading-none">
              {journals.length}
            </span>
          </div>
        </div>
      )}

      {/* --- NAVIGATION TABS --- */}
      {isGuru && (
        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800 max-w-md">
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === 'riwayat'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Lini Riwayat Jurnal
          </button>
          <button
            onClick={() => setActiveTab('catat')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'catat'
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Catat Jurnal Baru
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'riwayat' ? (
          <motion.div
            key="riwayat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* --- RIWAYAT FILTERS --- */}
            <div
              className={`bg-white dark:bg-[#0B1121] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 ${filterClassName ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari materi, catatan, atau guru..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-805 placeholder-slate-400 tracking-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700 dark:text-white"
                />
              </div>

              {!filterClassName && (
                <div>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700 dark:text-white"
                  >
                    <option value="">Semua Kelas / Rombel</option>
                    {classes.map((cl) => (
                      <option key={cl.id} value={cl.name}>
                        {cl.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Ditemukan: {filteredJournals.length} Jurnal
              </div>
            </div>

            {/* --- RIWAYAT LISTS FEED --- */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-[#0B1121] rounded-3xl border border-slate-100 dark:border-slate-800">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">
                  Memuat Lini Masa Jurnal...
                </p>
              </div>
            ) : filteredJournals.length === 0 ? (
              <div className="py-24 text-center bg-white dark:bg-[#0B1121] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6">
                <BookOpenIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4 animate-bounce" />
                <h3 className="text-sm font-bold text-slate-705 dark:text-slate-300 uppercase tracking-wide">
                  Belum Ada Riwayat KBM
                </h3>
                <p className="text-[10px] text-slate-400 max-w-sm font-bold uppercase mt-2 tracking-wide leading-relaxed">
                  Tidak ditemukan kecocokan log harian guru. Silakan daftarkan jurnal baru KBM Anda
                  melalu tab "Catat Jurnal Baru".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJournals.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative group hover:border-indigo-100 dark:hover:border-slate-800 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Entry Header Info */}
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                          Kelas {entry.className}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                          <ClockIcon className="w-3.5 h-3.5 text-slate-300" />
                          Jam {entry.jamKe}
                        </span>
                      </div>

                      {/* Subject Label */}
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-2">
                        {entry.subject}
                      </h4>

                      {/* Material Text Area */}
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                        <p className="border-b border-slate-100 dark:border-slate-800 pb-1 text-[8px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                          Materi KBM
                        </p>
                        {entry.materi}
                      </div>

                      {/* Class Notes (if any) */}
                      {entry.catatan && (
                        <div className="mt-3.5 bg-amber-50/50 dark:bg-amber-950/15 p-3.5 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed font-semibold">
                          <p className="text-[8px] uppercase font-bold tracking-wider text-amber-500 mb-1.5 leading-none">
                            Catatan Kejadian Kelas:
                          </p>
                          {entry.catatan}
                        </div>
                      )}
                    </div>

                    {/* Footer Signature */}
                    <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          Guru Pengajar
                        </p>
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate lowercase max-w-[180px]">
                          {entry.teacherName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-300" />
                          {entry.date}
                        </span>

                        {/* Trash button if owner or Admin */}
                        {(userContext.id === entry.teacherId || canSeeAllJournals) && (
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:text-rose-400 rounded-xl transition-all border border-rose-100/30"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="catat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* --- WRITE JOURNAL FORM --- */}
            <form
              onSubmit={handleSubmitJournal}
              className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Date Input */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide pl-1 mb-2">
                    Tanggal Tatap Muka
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-705 focus:ring-2 focus:ring-indigo-500 text-slate-705 focus:outline-none transition-all text-slate-700 dark:text-white"
                    required
                  />
                </div>

                {/* Class selection dropdown */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide pl-1 mb-2">
                    Pilih Rombel / Kelas Binaan
                  </label>
                  <select
                    value={formData.className}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, className: e.target.value }))
                    }
                    disabled={!!filterClassName}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  >
                    {filterClassName ? (
                      <option value={filterClassName}>Kelas {filterClassName}</option>
                    ) : (
                      classes.map((cl) => (
                        <option key={cl.id} value={cl.name}>
                          Kelas {cl.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Learning hour selection */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide pl-1 mb-2">
                    Jam Pembelajaran KBM
                  </label>
                  <select
                    value={formData.jamKe}
                    onChange={(e) => setFormData((prev) => ({ ...prev, jamKe: e.target.value }))}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700 dark:text-white"
                    required
                  >
                    <option value="1-2">Jam Ke 1 - 2 (Pagi)</option>
                    <option value="3-4">Jam Ke 3 - 4 (Pertengahan)</option>
                    <option value="5-6">Jam Ke 5 - 6 (Siang)</option>
                    <option value="7-8">Jam Ke 7 - 8 (Sore)</option>
                    <option value="9-10">Jam Ke 9 - 10 (Sore Akhir)</option>
                  </select>
                </div>
              </div>

              {/* Subject selection */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide pl-1 mb-2">
                  Mata Pelajaran KBM
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Matematika Peminatan"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700 dark:text-white mb-2"
                  required
                />
                {/* Quick choice pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickSubjects.slice(0, 10).map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, subject: subj }))}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border transition-all ${
                        formData.subject === subj
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-500 dark:bg-slate-900 dark:border-slate-800'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Materi detail with Inline AI refine suggestion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                    Ringkasan Materi Pembelajaran KBM (Wajib)
                  </label>
                  <button
                    type="button"
                    onClick={handleRefineWithAi}
                    disabled={isRefining || !formData.materi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-slate-900 dark:disabled:to-slate-900 disabled:text-slate-400 disabled:shadow-none text-white rounded-lg text-[8px] font-bold uppercase tracking-wide shadow-md transition-all active:scale-[0.98]"
                  >
                    {isRefining ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Merapikan Kalimat...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-3 h-3 text-indigo-200 animate-pulse" />
                        Sempurnakan dengan AI
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={4}
                  placeholder="Contoh materi kasar: Matematika tentang eksponen dan logaritma kelas 10, anak-anak merasionalkan akar-akar kuadrat."
                  value={formData.materi}
                  onChange={(e) => setFormData((prev) => ({ ...prev, materi: e.target.value }))}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700 dark:text-white leading-relaxed"
                  required
                ></textarea>

                {/* AI Refine Proposal panel showing recommendations inside form */}
                <AnimatePresence>
                  {showAiProposal && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-indigo-500 animate-bounce" />
                        <h5 className="text-[9px] font-bold uppercase text-indigo-700 dark:text-indigo-400 tracking-wider leading-none">
                          Draft Hasil Sentuhan Madani AI:
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold italic bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 leading-relaxed">
                        "{refinedMateri}"
                      </p>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={applyAiProposal}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[8px] font-bold uppercase tracking-wide shadow-md transition-all active:scale-95"
                        >
                          Terapkan AI ✨
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAiProposal(false)}
                          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-[8px] font-bold uppercase tracking-wide border border-slate-200/50 dark:border-slate-800 transition-all"
                        >
                          Batal
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Catatan / kejadian penting inside class */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide pl-1 mb-2">
                  Catatan Kejadian Kelas / Tindak Lanjut (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Siswa antusias, namun 1 orang siswa izin sakit dan 1 orang terlambat masuk kelas."
                  value={formData.catatan}
                  onChange={(e) => setFormData((prev) => ({ ...prev, catatan: e.target.value }))}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700 dark:text-white leading-relaxed"
                ></textarea>
              </div>

              {/* Submitting button action */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-100 dark:disabled:bg-slate-900/50 disabled:text-slate-400 hover:shadow-xl shadow-lg shadow-indigo-500/10 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      Sedang Menyimpan Jurnal KBM...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="w-4 h-4" />
                      Simpan Jurnal KBM Harian
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (filterClassName) {
    return contentEl;
  }

  return (
    <Layout
      title="Jurnal Mengajar Guru"
      subtitle="Dokumentasi KBM & Agenda Tatap Muka"
      onBack={onBack}
      icon={BookOpenIcon}
    >
      {contentEl}
    </Layout>
  );
};

export default TeachingJournal;
