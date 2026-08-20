/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Student Points & Sanctions Management View
 */

import React, { useState, useEffect } from 'react';
import Layout from '@/layouts/Layout';
import {
  StarIcon,
  Search,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@/shared/Icons';
import {
  BarChart2,
  User,
  PlusCircle,
  Settings,
  Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  addStudentPoint,
  getStudentPointsHistory,
  getStudentPointSummary,
  getAllPointSummaries,
  getPointCategories,
  deletePointRecord,
  clearAllPointsHistory,
} from '@/services/pointService';
import type {
  StudentPoint,
  StudentPointSummary,
  PointType,
} from '@/domain/point/pointDomain';
import {
  getLevelDisplay,
} from '@/domain/point/pointDomain';
import {
  handleFirestoreError,
  OperationType,
  getFriendlyErrorMessage,
} from '@/services/authService';
import { getSecurityContext } from '@/core/security/contextHelper';
import { getClasses } from '@/services/classService';
import { getStudentData, getStudentsByClass } from '@/services/studentService';
import { getTeacherData } from '@/services/teacherService';
import { getUserData } from '@/services/userService';
import type { PointCategory, Student } from '@/types';
import { UserRole } from '@/types';
import { useStudentStore } from '@/stores/studentStore';
import { toast } from 'sonner';
import PointCategorySettings from './PointCategorySettings';
import { useAutoFix } from '@/hooks/useAutoFix';
import { DashboardRekapView } from './components/DashboardRekapView';
import { IndividuPoinView } from './components/IndividuPoinView';
import { usePointDashboardStore } from './stores/pointDashboardStore';
import { usePointIndividualStore } from './stores/pointIndividualStore';

import {
  StudentPointRow,
  LeaderboardRow,
  AddPointModal,
  ClearPointsModal,
  DeletePointRecordModal,
  StudentPointDetail,
} from './components';

interface PointsViewProps {
  onBack: () => void;
  userRole: UserRole;
  studentsId?: string;
  onNavigate?: (v: any) => void;
}

const PointsView: React.FC<PointsViewProps> = ({ onBack, userRole, studentsId, onNavigate }) => {
  const globalClass = useStudentStore((state) => state.selectedClass);
  const { mainTab, setMainTab } = usePointDashboardStore();
  const { setSelectedStudentId } = usePointIndividualStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [summary, setSummary] = useState<StudentPointSummary | null>(null);
  const [history, setHistory] = useState<StudentPoint[]>([]);
  const [summaries, setSummaries] = useState<StudentPointSummary[]>([]);
  const [viewType, setViewType] = useState<'Search' | 'Leaderboard' | 'Settings'>('Search');
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (globalClass?.name) return globalClass.name;
    return '10 A';
  });

  // Global sync
  useEffect(() => {
    if (globalClass?.name) {
      setSelectedClass(globalClass.name);
    }
  }, [globalClass]);

  const [classes, setClasses] = useState<string[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<PointCategory[]>([]);

  useEffect(() => {
    getPointCategories().then(setDynamicCategories).catch(console.error);
  }, []);

  // Form state
  const [pointValue, setPointValue] = useState<number>(0);
  const [pointType, setPointType] = useState<PointType>('Misconduct');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { safeCall } = useAutoFix();
  const [isClearing, setIsClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [pointToDelete, setPointToDelete] = useState<{
    id: string;
    studentsId: string;
    category: string;
    description: string;
    points: number;
  } | null>(null);

  const handleClearAllPoints = () => {
    setConfirmInput('');
    setShowClearModal(true);
  };

  const executeClearAllPoints = async () => {
    if (confirmInput.toUpperCase() !== 'RESET') {
      toast.error('Harap ketik kata "RESET" dengan tepat untuk mengonfirmasi.');
      return;
    }

    setIsClearing(true);
    setShowClearModal(false);
    try {
      await safeCall(async () => {
        await clearAllPointsHistory();
        toast.success(`Berhasil menghapus seluruh riwayat poin dan me-reset profil siswa ke 0.`);
      }, 'PointsView.ClearAll');
    } catch (error) {
      console.error(error);
      toast.error('Gagal melakukan reset poin.');
    } finally {
      setIsClearing(false);
    }
  };

  const isStaff = [
    UserRole.ADMIN,
    UserRole.DEVELOPER,
    UserRole.GURU,
    UserRole.WALI_KELAS,
    UserRole.STAF,
    UserRole.GTK,
    UserRole.GURU_BK,
    UserRole.KESISWAAN,
  ].includes(userRole);
  const isStudentOnly = [UserRole.SISWA, UserRole.KETUA_KELAS, UserRole.ORANG_TUA].includes(
    userRole,
  );

  useEffect(() => {
    getClasses()
      .then((data) => {
        const names = data.map((d) => d.name).sort();
        setClasses(names);
      })
      .catch((e) => {
        handleFirestoreError(e, OperationType.LIST, 'classes');
      });
  }, []);

  useEffect(() => {
    if (userRole === UserRole.GURU) {
      const fetchTeacherProfile = async () => {
        try {
          const context = getSecurityContext();
          const uid = context.uid;
          if (!uid) return;
          const userData = await getUserData(uid);
          if (userData?.teacherId) {
            const tData = await getTeacherData(userData.teacherId);
            if (tData) {
              const rombelField = tData.tingkatRombel || (tData as any).rombel;
              if (rombelField) {
                const assignedRombel = rombelField === 'semua rombel' ? '10 A' : rombelField;
                setSelectedClass(assignedRombel);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to auto-resolve teacher rombel:', e);
        }
      };
      fetchTeacherProfile();
    }
  }, [userRole]);

  useEffect(() => {
    if (studentsId && isStudentOnly) {
      loadStudentAsUser(studentsId);
    }
    if (viewType === 'Leaderboard') {
      loadLeaderboard();
    }
  }, [studentsId, userRole, viewType]);

  const loadLeaderboard = async (force = false) => {
    setLoading(true);
    try {
      const data = await getAllPointSummaries(undefined, 20, force);
      setSummaries(data.map((s: any) => ({ ...s, studentsId: s.studentId || s.studentsId })));
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat peringkat: ' + getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAsUser = async (sId: string, force = false) => {
    setLoading(true);
    try {
      const sData = await getStudentData(sId);
      if (sData) {
        setSelectedStudent(sData);
        const [sum, hist] = await Promise.all([
          getStudentPointSummary(sId, force),
          getStudentPointsHistory(sId, 50, force),
        ]);
        setSummary(
          sum ? ({ ...sum, studentsId: (sum as any).studentId || sum.studentsId } as any) : null,
        );
        setHistory(
          hist.map((h: any) => ({ ...h, studentsId: (h as any).studentId || h.studentsId })),
        );
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data poin Anda: ' + getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = async () => {
    const queryStr = searchQuery.trim();
    setLoading(true);
    try {
      const isPotentialId =
        /^\d+$/.test(queryStr) || (queryStr.length >= 5 && !queryStr.includes(' '));

      if (isPotentialId) {
        const sData = await getStudentData(queryStr);
        if (sData) {
          setStudents([sData]);
          setLoading(false);
          return;
        }
      }

      const isDeveloper = userRole === UserRole.DEVELOPER || userRole === UserRole.ADMIN;
      const isAllClass =
        selectedClass === 'All' ||
        selectedClass === 'Semua Kelas' ||
        selectedClass === 'Semua Rombel (Beban 10 A)';
      const targetClass = isAllClass ? (isDeveloper ? 'All' : '10 A') : selectedClass;

      let results: Student[] = [];
      if (targetClass === 'All') {
        const all = await getStudentsByClass('All');
        if (queryStr) {
          results = all
            .filter((s) => (s.namaLengkap || '').toLowerCase().includes(queryStr.toLowerCase()))
            .slice(0, 30);
        } else {
          results = all.slice(0, 50);
        }
      } else {
        const classList = await getStudentsByClass(targetClass);
        if (queryStr) {
          results = classList
            .filter((s) => (s.namaLengkap || '').toLowerCase().includes(queryStr.toLowerCase()))
            .slice(0, 20);
        } else {
          results = classList.slice(0, 20);
        }
      }

      setStudents(results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Gagal mencari siswa: ' + getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (student: any, force = false) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const [sum, hist] = await Promise.all([
        getStudentPointSummary(student.id, force),
        getStudentPointsHistory(student.id, 50, force),
      ]);
      setSummary(
        sum ? ({ ...sum, studentsId: (sum as any).studentId || sum.studentsId } as any) : null,
      );
      setHistory(
        hist.map((h: any) => ({ ...h, studentsId: (h as any).studentId || h.studentsId })),
      );
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data poin: ' + getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || pointValue === 0) return;

    setIsSubmitting(true);
    try {
      const finalValue = pointType === 'Misconduct' ? Math.abs(pointValue) : -Math.abs(pointValue);

      const selectedCat = dynamicCategories.find(
        (c) =>
          c.name === category &&
          (pointType === 'Achievement' ? c.type === 'Prestasi' : c.type === 'Pelanggaran'),
      );

      const result = await addStudentPoint({
        studentsId: selectedStudent.id,
        studentName: selectedStudent.namaLengkap,
        classId: selectedStudent.tingkatRombel || 'N/A',
        points: finalValue,
        type: pointType,
        category,
        categoryId: selectedCat?.id,
        description,
      });

      if ((result as any)?.status === 'QUEUED_OFFLINE') {
        toast.warning('Offline: Catatan berhasil disimpan ke antrean lokal (Sync Pending).');
      } else {
        toast.success('Poin berhasil dicatat');
      }
      setIsAddMode(false);
      setPointValue(0);
      setDescription('');
      setCategory('');

      handleSelectStudent(selectedStudent);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan poin: ' + getFriendlyErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeletePoint = async () => {
    if (!pointToDelete) return;
    try {
      await safeCall(async () => {
        await deletePointRecord(pointToDelete.id, pointToDelete.studentsId);
      }, 'PointsView.DeletePoint');
      toast.success('Poin berhasil dihapus');
      setPointToDelete(null);
      handleSelectStudent(selectedStudent, true);
    } catch (e) {
      toast.error('Gagal menghapus poin');
    }
  };

  return (
    <Layout title="Sistem Poin & Sanksi" subtitle="Integrity First" icon={StarIcon} onBack={onBack}>
      <div className="p-4 max-w-5xl mx-auto space-y-6 pb-24">
        {/* TOP LEVEL NAVIGATION TABS */}
        {!isStudentOnly && (
          <div className="flex border-b border-gray-200 gap-2 sm:gap-6 overflow-x-auto pb-1">
            <button
              onClick={() => setMainTab('dashboard')}
              className={`pb-2.5 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                mainTab === 'dashboard'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Dashboard Rekap
            </button>

            <button
              onClick={() => setMainTab('individual')}
              className={`pb-2.5 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                mainTab === 'individual'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <User className="w-4 h-4" />
              Individu
            </button>

            <button
              onClick={() => setMainTab('input')}
              className={`pb-2.5 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                mainTab === 'input'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Input & Cari Poin
            </button>

            {[UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU_BK, UserRole.KESISWAAN].includes(
              userRole,
            ) && (
              <button
                onClick={() => setMainTab('categories')}
                className={`pb-2.5 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  mainTab === 'categories'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                Kategori & Aturan
              </button>
            )}
          </div>
        )}

        {/* MAIN TAB 1: DASHBOARD REKAP */}
        {mainTab === 'dashboard' && !isStudentOnly && (
          <DashboardRekapView
            onSelectStudent={(studentId) => {
              setSelectedStudentId(studentId);
              setMainTab('individual');
            }}
          />
        )}

        {/* MAIN TAB 2: INDIVIDU POIN */}
        {(mainTab === 'individual' || isStudentOnly) && (
          <IndividuPoinView initialStudentId={studentsId || null} />
        )}

        {/* MAIN TAB 3: INPUT & CARI POIN */}
        {mainTab === 'input' && !isStudentOnly && (
          <div className="space-y-6">
            {loading && isStudentOnly && !selectedStudent && (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!selectedStudent && !isStudentOnly && (
              <div className="flex p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setViewType('Search')}
                  className={`flex-1 py-2 text-[10px] font-bold tracking-wide rounded-xl transition-all ${
                    viewType === 'Search' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'
                  }`}
                >
                  Cari Siswa
                </button>
                <button
                  onClick={() => setViewType('Leaderboard')}
                  className={`flex-1 py-2 text-[10px] font-bold tracking-wide rounded-xl transition-all ${
                    viewType === 'Leaderboard' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'
                  }`}
                >
                  Peringkat
                </button>
              </div>
            )}

            {!selectedStudent && !isStudentOnly && viewType === 'Search' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold tracking-wide text-slate-400">Cari Siswa</h3>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg py-1 px-2 text-[10px] font-bold outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="All">Semua Rombel</option>
                      {classes.map((c, i) => (
                        <option key={`${c}-${i}`} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Nama Lengkap Siswa..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 pl-10 text-sm focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
                      />
                    </div>
                    <button
                      onClick={searchStudents}
                      className="bg-amber-500 text-white px-5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      Cari
                    </button>
                  </div>
                </div>

                {loading && (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                <div className="grid gap-3">
                  {students.map((s, idx) => (
                    <StudentPointRow
                      key={s.id}
                      s={s}
                      idx={idx}
                      onClick={() => handleSelectStudent(s)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {!selectedStudent && !isStudentOnly && viewType === 'Leaderboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold tracking-wide text-slate-400">
                      Peringkat Poin Siswa
                    </h3>
                    <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                      TOP 20
                    </div>
                  </div>

                  <div className="space-y-2">
                    {summaries.map((s, idx) => (
                      <LeaderboardRow
                        key={s.studentsId}
                        s={s}
                        idx={idx}
                        getLevelDisplay={getLevelDisplay}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {selectedStudent && (
              <StudentPointDetail
                selectedStudent={selectedStudent}
                summary={summary}
                history={history}
                isStaff={isStaff}
                isStudentOnly={isStudentOnly}
                onBackToSearch={() => setSelectedStudent(null)}
                onOpenAddModal={(type) => {
                  setPointType(type);
                  setIsAddMode(true);
                }}
                onSetPointToDelete={(data) => setPointToDelete(data)}
              />
            )}
          </div>
        )}

        {/* MAIN TAB 4: KATEGORI & ATURAN */}
        {mainTab === 'categories' && !isStudentOnly && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="-mx-4 -mt-2">
              <PointCategorySettings
                onBack={() => setMainTab('dashboard')}
                userRole={userRole}
                hideHeader={true}
              />
            </div>

            {[UserRole.ADMIN, UserRole.DEVELOPER].includes(userRole) && (
              <div className="bg-rose-50 dark:bg-rose-950/20 rounded-3xl p-6 border border-rose-100 dark:border-rose-900/30 space-y-4 mx-4">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400">
                      Zona Bahaya (Tindakan Administratif)
                    </h4>
                    <p className="text-[10px] text-rose-600 dark:text-rose-400/80 font-bold mt-1">
                      Menghapus semua riwayat poin akan me-reset total poin seluruh siswa ke angka
                      0. Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearAllPoints}
                  disabled={isClearing}
                  className="w-full py-3.5 bg-rose-600 text-white rounded-2xl text-[10px] font-bold tracking-wide shadow-lg shadow-rose-500/20 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-clear-all-points"
                >
                  <TrashIcon className="w-4 h-4" />
                  {isClearing ? 'MEMPROSES RESET...' : 'HAPUS SEMUA HISTORY & RESET POIN'}
                </button>
              </div>
            )}
          </motion.div>
        )}

        <AddPointModal
          isOpen={isAddMode}
          onClose={() => setIsAddMode(false)}
          pointType={pointType}
          setPointType={setPointType}
          pointValue={pointValue}
          setPointValue={setPointValue}
          category={category}
          setCategory={setCategory}
          description={description}
          setDescription={setDescription}
          dynamicCategories={dynamicCategories}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitPoint}
        />

        <DeletePointRecordModal
          pointToDelete={pointToDelete}
          onClose={() => setPointToDelete(null)}
          onConfirmDelete={handleConfirmDeletePoint}
        />

        <ClearPointsModal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          confirmInput={confirmInput}
          setConfirmInput={setConfirmInput}
          isClearing={isClearing}
          onExecuteClear={executeClearAllPoints}
        />
      </div>
    </Layout>
  );
};

export default PointsView;
