import { useUserStore } from '@/stores/userStore';

/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * MODULE: ACADEMIC ASSIGNMENTS
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/layouts/Layout';
import {
  AcademicCapIcon,
  PlusIcon,
  UserIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  Loader2,
  ShieldCheckIcon,
  BriefcaseIcon,
  ChartBarIcon,
  TrashIcon,
  BookOpenIcon,
  SaveIcon,
  XCircleIcon,
} from '@/shared/Icons';
import type { Assignment, Submission} from '@/types';
import { UserRole, COMMON_SUBJECTS } from '@/types';
import {
  getAssignments,
  addAssignment,
  deleteAssignment,
  addSubmission,
  getSubmissions,
  getMySubmission,
  gradeSubmission,
  updateSubmission,
  getAllMySubmissions,
} from '@/services/academicService';
import { useAutoFix } from '@/hooks/useAutoFix';
import { isMockMode } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { userRepository } from '@/repositories/userRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import { classRepository } from '@/repositories/classRepository';
import { TenantContext } from '@/core/context/TenantContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AssignmentsProps {
  onBack: () => void;
  userRole: UserRole;
}

const Assignments: React.FC<AssignmentsProps> = ({ onBack, userRole }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    className: '',
    dueDate: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
  });

  const [teachers, setTeachers] = useState<any[]>([]);

  // Memoized available subjects for dropdown
  const availableSubjects = useMemo(() => {
    const existingSubjects = assignments.map((a) => a.subject);
    const teacherSubjects = teachers.flatMap((t) =>
      (t.subject || '').split(',').map((s: string) => s.trim()),
    );
    const all = Array.from(new Set([...COMMON_SUBJECTS, ...existingSubjects, ...teacherSubjects]))
      .filter(Boolean)
      .sort();
    return all;
  }, [assignments, teachers]);
  const [activeTab, setActiveTab] = useState<'tugas' | 'agenda'>('tugas');
  const [userContext, setUserContext] = useState<{ class?: string; name?: string; id?: string }>(
    {},
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Submission States
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<Record<string, Submission>>({});

  // Teacher Review States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const { safeCall } = useAutoFix();

  // Role grouping
  const isSiswa = userRole === UserRole.SISWA;
  const isGuru =
    userRole === UserRole.GURU || userRole === UserRole.WALI_KELAS || userRole === UserRole.GTK;
  const isSuperUser = [
    UserRole.ADMIN,
    UserRole.KEPALA_MADRASAH,
    UserRole.STAF,
    UserRole.DEVELOPER,
  ].includes(userRole);

  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    const targetClass = userContext.class || 'XII IPA 1';

    await safeCall(async () => {
      let data: Assignment[] = [];
      const context = TenantContext.getContext() as any;
      if (isSiswa) {
        data = await getAssignments(targetClass);
        // Fetch all my submissions in one go
        const mySubs = await getAllMySubmissions(user?.id || 'mock-siswa-1');
        const subsMap: Record<string, Submission> = {};
        mySubs.forEach((s) => {
          subsMap[s.assignmentId] = s;
        });
        setMySubmissions(subsMap);
      } else if (isGuru) {
        const all = await getAssignments();
        data = all.filter((a) => a.teacherId === (user?.id || 'mock-teacher-1'));
      } else if (isSuperUser) {
        data = await getAssignments();
      }
      setAssignments(data);

      // Fetch teachers for subject suggestions
      const [tSnap, cSnap] = await Promise.all([
        teacherRepository.getByTenant(context, context.tenantId),
        classRepository.getByTenant(context, context.tenantId),
      ]);
      setTeachers(tSnap);
      setClasses(cSnap.map((d) => ({ ...d })));
    }, 'fetchAssignments');

    setLoading(false);
  }, [userContext.class, userContext.id, userContext.name, isSiswa, isGuru, isSuperUser, safeCall]);

  useEffect(() => {
    const init = async () => {
      let targetClass = '';
      if (!isMockMode && user) {
        const context = TenantContext.getContext() as any;
        const userData = await userRepository.getById(context, user.id);
        if (userData) {
          targetClass = (userData as any)?.class || '';
          setUserContext({ class: targetClass, name: userData?.profile?.displayName || (userData as any)?.displayName, id: user.id });
        }
      } else {
        targetClass = 'XII IPA 1';
        setUserContext({ class: targetClass, name: 'User Simulasi', id: 'mock-user-id' });
      }
      setLoading(false);
    };
    init();
  }, [userRole]);

  useEffect(() => {
    if (userContext.class || isSuperUser || isGuru) {
      fetchAssignments();
    }
  }, [userContext.class, userRole, isSuperUser, isGuru]);

  const handleDelete = async (id: string) => {
    await safeCall(async () => {
      await deleteAssignment(id);
      toast.success('Tugas berhasil dihapus.');
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }, 'deleteAssignment');
    setIsDeleting(null);
  };

  const handleSubmission = async () => {
    if (!selectedAssignment || !submissionContent || isSubmitting) return;
    setIsSubmitting(true);
    await safeCall(async () => {
      const tenantId = useUserStore.getState().tenantId;
      if (!tenantId) throw new Error('tenantId required');
      const existingSub = mySubmissions[selectedAssignment.id];

      if (existingSub && existingSub.id) {
        // Update existing
        await updateSubmission(existingSub.id, submissionContent);
        toast.success('Tugas berhasil diperbarui!');
      } else {
        // Create new
        const sub: any = {
          assignmentId: selectedAssignment.id,
          studentId: userContext.id || 'unknown',
          studentName: userContext.name || 'Student',
          content: submissionContent,
          submittedAt: new Date().toISOString(),
          status: 'Submitted',
          tenantId: tenantId,
        };
        await addSubmission(sub as any);
        toast.success('Tugas berhasil dikumpulkan!');
      }

      setIsSubmitModalOpen(false);
      setSubmissionContent('');
      // Refresh
      const s = await getMySubmission(selectedAssignment.id, userContext.id || 'unknown');
      if (s) setMySubmissions((prev) => ({ ...prev, [selectedAssignment.id]: s }));
    }, 'handleSubmission');
    setIsSubmitting(false);
  };

  const loadSubmissions = async (assignmentId: string) => {
    setLoadingSubmissions(true);
    await safeCall(async () => {
      const data = await getSubmissions(assignmentId);
      setSubmissions(data);
    }, 'loadSubmissions');
    setLoadingSubmissions(false);
  };

  const handleGrade = async () => {
    if (!selectedSubmission || !selectedSubmission.id) return;
    setIsGrading(true);
    await safeCall(async () => {
      await gradeSubmission(selectedSubmission.id!, grade, feedback);
      toast.success('Penilaian berhasil disimpan.');
      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id ? { ...s, grade, feedback, status: 'Graded' as const } : s,
        ),
      );
      setSelectedSubmission(null);
    }, 'handleGrade');
    setIsGrading(false);
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.className || !formData.title) {
      toast.error('Mohon lengkapi data wajib.');
      return;
    }

    setSubmitting(true);
    await safeCall(async () => {
      const tenantId = useUserStore.getState().tenantId;
      if (!tenantId) throw new Error('tenantId required');
      const teacherName = userContext.name || user?.displayName || 'Guru';
      const teacherId = user?.id || 'unknown';

      await addAssignment({
        ...formData,
        teacherId,
        teacherName,
        status: 'Open',
        tenantId: tenantId,
      });

      toast.success('Tugas berhasil dipublikasikan.');
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        subject: '',
        className: '',
        dueDate: '',
        priority: 'Medium' as 'Low' | 'Medium' | 'High',
      });

      fetchAssignments();
    }, 'handleAddAssignment');
    setSubmitting(false);
  };

  const getPriorityBadge = (priority: string | undefined) => {
    switch (priority) {
      case 'High':
        return (
          <span className="text-[6px] font-bold text-white bg-rose-600 px-1.5 py-0.5 rounded-md">
            TINGGI
          </span>
        );
      case 'Medium':
        return (
          <span className="text-[6px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
            SEDANG
          </span>
        );
      default:
        return (
          <span className="text-[6px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md">
            RENDAH
          </span>
        );
    }
  };

  const getPageConfig = () => {
    if (isSiswa)
      return {
        title: `Tugas Kelas ${userContext.class}`,
        icon: AcademicCapIcon,
        label: 'Tugas Saya',
      };
    if (isGuru) return { title: 'Manajemen Tugas', icon: BriefcaseIcon, label: 'Koleksi Saya' };
    if (isSuperUser)
      return { title: 'Monitoring Akademik', icon: ShieldCheckIcon, label: 'Semua Rombel' };
    return { title: 'Daftar Tugas', icon: AcademicCapIcon, label: 'Tugas' };
  };

  const config = getPageConfig();

  return (
    <Layout
      title="Akademik"
      subtitle={config.title}
      icon={config.icon}
      onBack={onBack}
      actions={
        isGuru &&
        activeTab === 'tugas' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg active:scale-90 transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-[8px] font-bold  tracking-wide hidden sm:inline">Baru</span>
          </button>
        )
      }
    >
      {/* MODAL TAMBAH TUGAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#0B1224] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1224] shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase leading-none">
                  Buat Tugas Baru
                </h3>
                <p className="text-[9px] font-bold text-indigo-500 uppercase mt-2 tracking-wide">
                  Manajemen Kelas Digital
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <XCircleIcon className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#F8FAFC] dark:bg-[#0B1224]">
              <form onSubmit={handleAddAssignment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    Judul Tugas *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Latihan Soal Aljabar"
                    className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Mata Pelajaran *
                    </label>
                    <div className="relative">
                      <input
                        required
                        list="subject-list"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Pilih/Ketik..."
                        className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                      />
                      <datalist id="subject-list">
                        {availableSubjects.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                        <BookOpenIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Rombel *
                    </label>
                    <select
                      required
                      value={formData.className}
                      onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                      className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                    >
                      <option value="">Pilih Kelas</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Batas Pengumpulan *
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Prioritas
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value as any })
                      }
                      className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                    >
                      <option value="Low">Rendah</option>
                      <option value="Medium">Sedang</option>
                      <option value="High">Tinggi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    Instruksi Tugas
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Tulis detail instruksi tugas di sini..."
                    className="w-full p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[120px]"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold text-[10px] uppercase tracking-wide active:scale-95 transition-all shadow-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SaveIcon className="w-4 h-4" />
                    )}
                    PUBLIKASIKAN
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {isDeleting && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <TrashIcon className="w-8 h-8 text-rose-500" />
              </div>
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hapus Tugas?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsDeleting(null)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(isDeleting)}
                  className="py-3 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Submit Modal for Students */}
        {isSiswa && isSubmitModalOpen && selectedAssignment && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  Pengumpulan Tugas
                </h3>
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <PlusIcon className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-3xl mb-6 border border-indigo-100 dark:border-indigo-800/50">
                <p className="text-[7px] font-bold text-indigo-600 uppercase tracking-wide mb-1">
                  {selectedAssignment.subject}
                </p>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase">
                  {selectedAssignment.title}
                </h4>
              </div>

              {mySubmissions[selectedAssignment.id]?.status === 'Graded' ? (
                <div className="space-y-4 mb-6">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                        Nilai Anda
                      </span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {mySubmissions[selectedAssignment.id].grade}
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                        Feedback Guru
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                        "{mySubmissions[selectedAssignment.id].feedback || 'Tidak ada catatan.'}"
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-2">
                      Jawaban Tersimpan
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 break-all">
                      {mySubmissions[selectedAssignment.id].content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2 block ml-1">
                      Input Jawaban / Link Tugas
                    </label>
                    <textarea
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder="Tulis jawaban atau tempelkan link Google Drive/Youtube di sini..."
                      className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <button
                    onClick={handleSubmission}
                    disabled={isSubmitting || !submissionContent}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-wide shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : mySubmissions[selectedAssignment.id] ? (
                      'Update Tugas'
                    ) : (
                      'Kirim Tugas'
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Teacher Review Modal */}
        {(isGuru || isSuperUser) && isReviewModalOpen && selectedAssignment && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col shrink-0 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    Koreksi Tugas
                  </h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                    {selectedAssignment.className} • {selectedAssignment.subject}
                  </p>
                </div>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <PlusIcon className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {loadingSubmissions ? (
                  <div className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-20" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Belum ada siswa yang mengumpulkan.
                    </p>
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 bg-slate-50 dark:bg-[#151E32] rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {sub.studentName.charAt(0)}
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-800 dark:text-white text-[11px] uppercase">
                              {sub.studentName}
                            </h5>
                            <p className="text-[7px] text-slate-400 font-bold uppercase ">
                              {new Date(sub.submittedAt).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                        {sub.status === 'Graded' && (
                          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold">
                            NILAI: {sub.grade}
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl mb-4 border border-slate-50 dark:border-slate-700">
                        <p className="text-xs text-slate-600 dark:text-slate-300 break-all leading-relaxed">
                          {sub.content}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setGrade(sub.grade || 0);
                          setFeedback(sub.feedback || '');
                        }}
                        className="text-[8px] font-bold text-indigo-600 flex items-center gap-1 uppercase tracking-wide hover:translate-x-1 transition-transform"
                      >
                        {sub.status === 'Graded' ? 'Update Nilai' : 'Berikan Nilai'}{' '}
                        <ArrowRightIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Grading Modal */}
        <AnimatePresence>
          {selectedSubmission && (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 max-w-sm w-full shadow-2xl relative"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
                  Penilaian: {selectedSubmission.studentName}
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">
                      Masukkan Nilai (0-100)
                    </label>
                    <input
                      type="number"
                      value={grade}
                      onChange={(e) => setGrade(parseInt(e.target.value))}
                      max={100}
                      min={0}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-indigo-600 text-center text-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">
                      Feedback / Catatan
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Contoh: Sangat bagus, perhatikan kerapian tulisan."
                      className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[9px] font-bold uppercase tracking-wide active:scale-95 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleGrade}
                      disabled={isGrading}
                      className="py-3.5 bg-indigo-600 text-white rounded-2xl text-[9px] font-bold uppercase tracking-wide shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                      {isGrading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        'Simpan Nilai'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </AnimatePresence>

      <div className="p-3 lg:p-6 pb-32 space-y-4">
        {/* Dashboard Header for Admin/Kamad */}
        {isSuperUser && (
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
              <ChartBarIcon className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-70">
                Supervisi Global
              </p>
              <h3 className="text-xl font-bold mt-1">{assignments.length} Tugas Aktif</h3>
              <div className="flex gap-2 mt-4">
                <div className="px-3 py-1 bg-white/20 rounded-lg text-[7px] font-bold uppercase border border-white/10">
                  Semua Kelas
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-lg text-[7px] font-bold uppercase border border-white/10">
                  Pantauan Realtime
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('tugas')}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wide transition-all ${activeTab === 'tugas' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-400'}`}
          >
            {config.label}
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wide transition-all ${activeTab === 'agenda' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-400'}`}
          >
            Agenda Hari Ini
          </button>
        </div>

        {activeTab === 'tugas' ? (
          loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-20" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {assignments.map((assignment, idx) => (
                <div
                  key={`${assignment.id}-${idx}`}
                  className="bg-white dark:bg-[#151E32] p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-all hover:border-indigo-200"
                >
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${assignment.priority === 'High' ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  ></div>

                  <div className="flex justify-between items-start mb-3 pl-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[6px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded uppercase ">
                          {assignment.subject}
                        </span>
                        {getPriorityBadge(assignment.priority)}
                        {isSuperUser && (
                          <span className="text-[6px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                            {assignment.className}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-[12px] truncate uppercase tracking-tight leading-none">
                        {assignment.title}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end shrink-0 ml-2">
                      <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wide">
                        Deadline
                      </span>
                      <span className="text-[8px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md mt-0.5 border border-rose-100 uppercase">
                        {new Date(assignment.dueDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pl-2 mb-4 font-medium italic">
                    "{assignment.description}"
                  </p>

                  <div className="flex items-center justify-between pl-2 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide truncate max-w-[120px]">
                        {assignment.teacherName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(isGuru || isSuperUser) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDeleting(assignment.id);
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div
                        className="flex items-center gap-1 text-indigo-600 group-hover:translate-x-1 transition-transform cursor-pointer"
                        onClick={() => {
                          if (isSiswa) {
                            setSelectedAssignment(assignment);
                            setIsSubmitModalOpen(true);
                            setSubmissionContent(mySubmissions[assignment.id]?.content || '');
                          } else if (isGuru || isSuperUser) {
                            setSelectedAssignment(assignment);
                            setIsReviewModalOpen(true);
                            loadSubmissions(assignment.id);
                          }
                        }}
                      >
                        <span className="text-[8px] font-bold uppercase">
                          {isSiswa
                            ? mySubmissions[assignment.id]
                              ? mySubmissions[assignment.id].status === 'Graded'
                                ? 'Lihat Nilai'
                                : 'Update'
                              : 'Kumpulkan'
                            : 'Pantauan'}
                        </span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-[#151E32] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 opacity-60">
                  <AcademicCapIcon className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Belum Ada Daftar Tugas
                  </p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="px-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                Kalender Harian
              </p>
            </div>
            <div className="p-5 bg-white dark:bg-[#151E32] rounded-[2.2rem] border border-indigo-50 dark:border-indigo-900/30 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex flex-col items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
                <span className="text-[11px] font-bold">07:30</span>
                <div className="w-4 h-[1px] bg-indigo-200 my-1"></div>
                <span className="text-[8px] font-bold opacity-60">WIB</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 dark:text-white text-[12px] truncate uppercase">
                  KBM Reguler
                </h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-1">
                  Sesuai Kalender Akademik 2025
                </p>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Assignments;
