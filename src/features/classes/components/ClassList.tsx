/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Sub-module: Detail Kelas (Consolidated Architecture e-Mam v8.0)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { isMockMode, getFriendlyErrorMessage } from '@/services/authService';
import { getSecurityContext } from '@/core/security/contextHelper';
import { useAuthStore } from '@/stores/authStore';
import { sendMessageToClass } from '@/services/classChatService';
import { useClassChat } from '@/hooks/useClassChat';
import type { Student, Teacher, ClassData, ViewState, ScheduleItem } from '@/types';
import { UserRole } from '@/types';
import {
  Loader2,
  PencilIcon,
  BookOpenIcon,
  SaveIcon,
  ArrowLeftIcon,
  UsersIcon,
  XCircleIcon,
  PlusIcon,
  ChartBarIcon,
  CalendarIcon,
  FileText,
  UserIcon,
  Search,
  ChevronDownIcon,
  MessageCircleIcon,
  EnvelopeIcon,
  TrashIcon,
  SparklesIcon,
  StarIcon,
  WhatsAppIcon,
} from '@/shared/Icons';
import { toast } from 'sonner';
import { addClass, updateClass, deleteClass, addClassArchive } from '@/services/classService';
import { useStudentStore } from '@/stores/studentStore';
import { useSystemStore } from '@/stores/systemStore';
import { useUserStore } from '@/stores/userStore';
import { normalizeRombelName, isRombelEqual } from '@/utils/rombelHelpers';
import { getSchedules } from '@/services/scheduleService';
import { updateLetterStatus, getLettersByClass } from '@/services/letterService';
import {
  getAttendanceByClassAndDate,
  updateAttendanceManual,
} from '@/features/attendance/services/attendanceService';
import { getAllPointRecords } from '@/services/pointService';
const QRScanner = React.lazy(() => import('@/features/attendance/components/QRScanner'));
import TeachingJournal from '@/features/journals/TeachingJournal';

type ClassView = 'list' | 'detail_tab';
type DetailTab =
  | 'wali_ketua'
  | 'siswa'
  | 'jadwal'
  | 'presensi'
  | 'jurnal'
  | 'poin'
  | 'surat'
  | 'obrolan'
  | 'arsip'
  | 'mapel'
  | 'spp';

interface ClassListProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
  onNavigate: (view: ViewState) => void;
  userRole: UserRole;
}

const ClassList: React.FC<ClassListProps> = ({ onBack, onOpenSidebar, onNavigate, userRole }) => {
  console.log('[RCA Audit] ClassList component mounted, userRole:', userRole);
  const tenantId = useUserStore((s) => s.tenantId) || 'global';
  const [view, setView] = useState<ClassView>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('wali_ketua'); // Default active tab
  const [presensiSubTab, setPresensiSubTab] = useState<'kelas' | 'qr_scanner'>('kelas');

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals & Sub-states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classEditorMode, setClassEditorMode] = useState<'add' | 'edit'>('add');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<ClassData | null>(null);

  const filteredClasses = useMemo(() => {
    return classes.filter(
      (cls) =>
        (cls.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.teacherName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.level || '').toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [classes, searchQuery]);

  const [classFormData, setClassFormData] = useState<Partial<ClassData>>({
    id: '',
    name: '',
    level: '10',
    academicYear: '2025/2026',
    teacherId: '',
    teacherName: '',
    walikelasId: '',
    ketuaKelasId: '',
  });

  // Schedule sub-state
  const [allSchedules, setAllSchedules] = useState<ScheduleItem[]>([]);

  // Point sub-state
  const [pointRecords, setPointRecords] = useState<any[]>([]);
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Letters sub-state
  const [letters, setLetters] = useState<any[]>([]);
  const [loadingLetters, setLoadingLetters] = useState(false);

  const { messages: chatMessages, chatBottomRef } = useClassChat(selectedClass?.id, activeTab);
  const [newMsgText, setNewMsgText] = useState('');
  const [chatChannel, setChatChannel] = useState<'general' | 'individual' | 'mapel' | 'wk' | 'bk'>(
    'general',
  );
  const [customMessages, setCustomMessages] = useState<Record<string, any[]>>({
    individual: [
      {
        senderName: 'Sistem',
        senderRole: 'Sistem',
        messageText: 'Saluran obrolan individu aktif. Hubungi Wali Kelas atau BK secara privat.',
        timestamp: new Date().toISOString(),
      },
    ],
    mapel: [
      {
        senderName: 'Guru Matematika',
        senderRole: 'Guru',
        messageText: 'Anak-anak, jangan lupa besok membawa busur derajat dan penggaris segitiga.',
        timestamp: new Date().toISOString(),
      },
    ],
    wk: [
      {
        senderName: 'Wali Kelas',
        senderRole: 'Wali Kelas',
        messageText:
          'Selamat datang di ruang wali kelas. Silakan sampaikan kendala atau aspirasi kelas di sini & wali kelas akan segera membalas.',
        timestamp: new Date().toISOString(),
      },
    ],
    bk: [
      {
        senderName: 'Konselor BK',
        senderRole: 'Guru BK',
        messageText: 'Layanan Bimbingan Konseling aktif. Segala konsultasi dijaga kerahasiannya.',
        timestamp: new Date().toISOString(),
      },
    ],
  });

  // Daily Attendance sub-state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Archive sub-state
  const archiveInputRef = useRef<HTMLInputElement>(null);
  const [archivingClass, setArchivingClass] = useState(false);

  const canManage =
    userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;
  const getStoredClasses = useStudentStore((state) => state.fetchClasses);
  const getStoredTeachers = useSystemStore((state) => state.fetchTeachers);
  const getStoredStudents = useStudentStore((state) => state.fetchStudents);
  const students = useStudentStore((state) => state.students);

  const isStudent =
    userRole === UserRole.SISWA ||
    userRole === UserRole.KETUA_KELAS ||
    userRole === UserRole.ORANG_TUA;

  // Identify Student's class limit
  const activeStudentClass = useMemo(() => {
    if (!useAuthStore.getState().user) return null;
    const records = students.filter((s) => s.linkedUserId === useAuthStore.getState().user?.id);
    if (records.length > 0) {
      return records[0].tingkatRombel;
    }
    return null;
  }, [students, useAuthStore.getState().user?.id]);

  // Read master data
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const [classesData, teachersData, studentsData] = await Promise.all([
          getStoredClasses(),
          getStoredTeachers(),
          getStoredStudents(),
        ]);

        // Filter classes for Siswa if role-restricted
        let filteredClasses = classesData;
        if (isStudent && activeStudentClass) {
          filteredClasses = classesData.filter((cls) =>
            isRombelEqual(cls.name, activeStudentClass),
          );
        }

        // Sort Alphabetically
        const sortedClasses = [...filteredClasses].sort((a, b) =>
          (a.name || '').localeCompare(b.name || ''),
        );
        setClasses(sortedClasses);
        setTeachers(teachersData);

        // Default select the first class to prevent unselected load (Zero-Waste O(1) directive 3)
        if (sortedClasses.length > 0 && !selectedClass) {
          setSelectedClass(sortedClasses[0]);
        }
      } catch (err: any) {
        console.warn('Gagal memuat data awal cached.', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getStoredClasses, getStoredTeachers, getStoredStudents, isStudent, activeStudentClass]);

  // Load schedules, point_records, daily attendance, letters, archives
  useEffect(() => {
    if (!selectedClass) {
      setClassStudents([]);
      return;
    }

    // Local sync O(1) matching with global user memory cache
    const cachedClassStudents = students
      .filter((s) => {
        if (s.status !== 'Aktif') return false;
        const rombel = normalizeRombelName(s.tingkatRombel);
        if (rombel === 'BELUM_DISET' && (!s.classId || s.classId === 'undefined')) return false;
        if (s.classId && s.classId !== 'undefined' && s.classId === selectedClass.id) return true;
        return isRombelEqual(s.tingkatRombel, selectedClass.name);
      })
      .sort((a, b) => (a.namaLengkap || '').localeCompare(b.namaLengkap || ''));

    setClassStudents(cachedClassStudents);

    const fetchClassData = async () => {
      try {
        const [pointsData, schedulesData] = await Promise.all([
          getAllPointRecords().then((res) =>
            res.filter(
              (p: any) => p.class === selectedClass.name || p.classId === selectedClass.id,
            ),
          ),
          getSchedules(),
        ]);
        setPointRecords(pointsData);
        setAllSchedules(schedulesData.filter((s) => s.class === selectedClass.name));
      } catch (err: any) {
        console.warn('Service: Gagal memuat data kelas terpilih.', err.message);
      }
    };

    if (!isMockMode) {
      fetchClassData();
    }
  }, [selectedClass, students, isMockMode]);

  // Fetch Attendance Records
  useEffect(() => {
    if (!selectedClass || isMockMode || activeTab !== 'presensi') return;

    const fetchAttendance = async () => {
      setLoadingAttendance(true);
      try {
        const data = await getAttendanceByClassAndDate(selectedClass.name, selectedDate);
        setAttendanceRecords(data);
      } catch (err: any) {
        console.warn('Gagal memuat presensi:', err);
      } finally {
        setLoadingAttendance(false);
      }
    };
    fetchAttendance();
  }, [selectedClass, selectedDate, activeTab]);

  // Fetch Letters for Class
  useEffect(() => {
    if (!selectedClass || isMockMode || activeTab !== 'surat') return;

    const fetchLetters = async () => {
      setLoadingLetters(true);
      try {
        const data = await getLettersByClass(selectedClass.name);
        setLetters(data);
      } catch (err: any) {
        console.warn('Gagal memuat surat:', err);
      } finally {
        setLoadingLetters(false);
      }
    };
    fetchLetters();
  }, [selectedClass, activeTab]);

  // Realtime Obrolan Kelas moved to useClassChat hook

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim() || !selectedClass || !useAuthStore.getState().user) return;

    // Safety limit: if student is opening a class other than their claimed activeStudentClass
    if (isStudent && activeStudentClass && !isRombelEqual(selectedClass.name, activeStudentClass)) {
      toast.error('Batas Keamanan: Anda tidak diperbolehkan mengirim pesan di rombel luar!');
      return;
    }

    const todayDateStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0];

    const messageDoc = {
      senderId: useAuthStore.getState().user?.id || 'unknown',
      senderName: useAuthStore.getState().user?.displayName || 'Nama Saya',
      senderRole: userRole,
      messageText: newMsgText,
      timestamp: new Date().toISOString(),
      classID: selectedClass.id,
    };

    const textToClear = newMsgText;
    setNewMsgText('');

    if (chatChannel !== 'general') {
      setCustomMessages((prev) => ({
        ...prev,
        [chatChannel]: [...(prev[chatChannel] || []), messageDoc],
      }));
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    try {
      await sendMessageToClass(selectedClass.id!, messageDoc, todayDateStr);
    } catch (err: any) {
      toast.error('Gagal mengirim obrolan: ' + err.message);
      setNewMsgText(textToClear);
    }
  };

  // Updae letter status harian
  const handleApproveLetter = async (id: string, status: 'Signed' | 'Ditolak') => {
    const tId = toast.loading('Sinkronisasi status surat...');
    try {
      await updateLetterStatus(id, status);
      toast.success(`Surat berhasil di ${status === 'Signed' ? 'setujui' : 'tolak'}!`, { id: tId });

      // Re-fetch letters
      if (selectedClass) {
        const data = await getLettersByClass(selectedClass.name);
        setLetters(data);
      }
    } catch (err: any) {
      toast.error('Gagal memperbarui status surat: ' + err.message, { id: tId });
    }
  };

  // Upload class archive securely in detail item array
  const handleUploadClassArchive = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClass) return;

    setArchivingClass(true);
    const toastId = toast.loading('Mengunggah berkas arsip...');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Url = reader.result as string;
        const newArchive = {
          name: file.name,
          url: base64Url,
          date: new Date().toISOString(),
        };

        await addClassArchive(selectedClass.id!, newArchive);

        setSelectedClass((prev) => {
          if (!prev) return null;
          const existing = prev.archives || [];
          return {
            ...prev,
            archives: [...existing, newArchive],
          };
        });

        const updated = await getStoredClasses(true);
        setClasses(updated);

        toast.success('Dokumen arsip berhasil diarsipkan!', { id: toastId });
      };
    } catch (err: any) {
      toast.error('Gagal mengunggah berkas: ' + err.message, { id: toastId });
    } finally {
      setArchivingClass(false);
    }
  };

  // Manual Attendance Mutation (Sentence case alignment)
  const handleSetAttendance = async (student: Student, status: string) => {
    if (!selectedClass) return;
    const attendanceId = `${student.id || student.studentsId || 'stu'}_${selectedDate}`;
    const updatedRecord = {
      studentId: student.id || student.studentsId,
      studentsId: student.id || student.studentsId,
      studentName: student.namaLengkap,
      class: selectedClass.name,
      date: selectedDate,
      statusGlobal: status as any,
      status: status, // for backwards compat
      sessions: {
        masuk: { time: status === 'Hadir' ? '07:15' : 'Ts', status: status as any },
        duha: { time: status === 'Hadir' ? '08:00' : 'Ts', status: status as any },
        zuhur: { time: status === 'Hadir' ? '12:00' : 'Ts', status: status as any },
        ashar: { time: status === 'Hadir' ? '15:00' : 'Ts', status: status as any },
        pulang: { time: status === 'Hadir' ? '15:45' : 'Ts', status: status as any },
      },
      verifiedAt: new Date().toISOString(),
    };

    if (isMockMode) {
      setAttendanceRecords((prev) => {
        const filtered = prev.filter((r) => r.studentId !== student.id);
        return [...filtered, { id: attendanceId, ...updatedRecord }];
      });
      toast.success('Status kehadiran diperbarui!');
      return;
    }

    try {
      await updateAttendanceManual(attendanceId, updatedRecord);

      setAttendanceRecords((prev) => {
        const filtered = prev.filter(
          (r) => r.studentsId !== student.id && r.studentId !== student.id,
        );
        return [...filtered, { id: attendanceId, ...updatedRecord }];
      });
      toast.success('Status presensi disinkronisasi!');
    } catch (err: any) {
      toast.error('Gagal sinkronisasi presensi: ' + err.message);
    }
  };

  // Simulasikan presensi untuk seluruh kelas (Sentence case / lowercase theme)
  const simulateAttendanceForClass = async () => {
    if (!selectedClass) {
      toast.error('Pilih kelas terlebih dahulu!');
      return;
    }
    setLoadingAttendance(true);
    try {
      const { getSecurityContext } = await import('@/core/security/contextHelper');
      const { studentRepository } = await import('@/features/students/repositories/StudentRepository');
      const { attendanceRepository } = await import('@/repositories/attendanceRepository');
      const context = getSecurityContext();
      const activeTenantId = tenantId || context.tenantId;

      let studentsToSimulate = [...classStudents];

      // Seed mock students if the class is empty
      if (studentsToSimulate.length === 0) {
        toast.loading('rombel kosong, mendaftarkan 3 siswa uji coba...', { id: 'sim-toast' });
        const mockNames = ['Muhammad Fadhil', 'Budi Santoso', 'Citra Lestari'];
        const mockGenders: ('L' | 'P')[] = ['L', 'L', 'P'];
        const seededStudents = mockNames.map((name, idx) => {
          const uniqueId = `STD-${selectedClass.name.replace(/\s+/g, '')}-${idx + 1}`;
          return {
            id: uniqueId,
            idUnik: uniqueId,
            tenantId: activeTenantId,
            namaLengkap: name,
            nisn: `1002030${selectedClass.level || '10'}${idx}`,
            tingkatRombel: selectedClass.name,
            className: selectedClass.name,
            classId: selectedClass.id || (selectedClass as any).classId,
            rombel: selectedClass.name,
            statusAktif: true,
            status: 'Aktif',
            jenisKelamin: mockGenders[idx],
            sistemJangkar: { tenantId: activeTenantId },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any;
        });
        await studentRepository.saveBatch(context, seededStudents);
        studentsToSimulate = seededStudents;
        setClassStudents(seededStudents);
        toast.success('siswa uji coba berhasil didaftarkan!', { id: 'sim-toast' });
      }

      const simulatedRecords: any[] = [];
      studentsToSimulate.forEach((student) => {
        let statusGlobal = 'Hadir';
        const rand = Math.random();
        const isFemale = student.jenisKelamin === 'P';

        if (rand < 0.1) {
          statusGlobal = 'Terlambat';
        } else if (rand < 0.13) {
          statusGlobal = isFemale ? 'Haid' : 'Izin';
        } else if (rand < 0.15) {
          statusGlobal = 'Sakit';
        } else if (rand < 0.16) {
          statusGlobal = 'Alpha';
        }

        const sessions: any = {};
        if (statusGlobal === 'Haid') {
          const haidSession = { time: '07:00 [Haid]', status: 'Haid' };
          sessions.masuk = haidSession;
          sessions.duha = haidSession;
          sessions.zuhur = haidSession;
          sessions.ashar = haidSession;
          sessions.pulang = haidSession;
        } else if (
          statusGlobal === 'Sakit' ||
          statusGlobal === 'Izin' ||
          statusGlobal === 'Alpha'
        ) {
          const absSession = { time: `-- [${statusGlobal}]`, status: statusGlobal };
          sessions.masuk = absSession;
        } else {
          const isLate = statusGlobal === 'Terlambat';
          const masukTime = isLate
            ? `07:${Math.floor(15 + Math.random() * 20)} [T]`
            : `06:${Math.floor(40 + Math.random() * 20)} [H]`;
          const masukStatus = isLate ? 'Terlambat' : 'Hadir';

          sessions.masuk = { time: masukTime, status: masukStatus };
          sessions.duha = { time: `08:15 [H]`, status: 'Hadir' };
          sessions.zuhur = { time: `12:15 [H]`, status: 'Hadir' };
          sessions.ashar = { time: `15:20 [H]`, status: 'Hadir' };
          sessions.pulang = { time: `16:05 [H]`, status: 'Hadir' };
        }

        simulatedRecords.push({
          id: `${student.idUnik || student.id}_${selectedDate}`,
          studentsId: student.idUnik || student.id,
          studentId: student.idUnik || student.id,
          name: student.namaLengkap,
          studentName: student.namaLengkap,
          className: student.className || selectedClass.name,
          classId: student.classId || selectedClass.id,
          class: student.className || selectedClass.name,
          date: selectedDate,
          statusGlobal: statusGlobal,
          status:
            statusGlobal === 'Terlambat'
              ? 'Terlambat'
              : statusGlobal === 'Haid'
                ? 'Hadir'
                : statusGlobal,
          isHaid: statusGlobal === 'Haid',
          sessions: sessions,
          masuk: sessions.masuk?.time || '',
          duha: sessions.duha?.time || '',
          zuhur: sessions.zuhur?.time || '',
          ashar: sessions.ashar?.time || '',
          pulang: sessions.pulang?.time || '',
          totalPointsAdded: statusGlobal === 'Hadir' ? 10 : 0,
          tenantId: activeTenantId,
          lastUpdated: new Date().toISOString(),
        });
      });

      await attendanceRepository.saveBatch(context, simulatedRecords);

      // Sync is handled by SyncEngine in background queue (via saveBatch)
      if (!isMockMode) {
        toast.success('Data simulasi diantrekan untuk sinkronisasi!', {
          id: 'sync-simulation-classlist',
        });
      }

      toast.success(
        `Berhasil simulasi kehadiran kelas ${selectedClass.name} untuk tanggal ${selectedDate}!`,
      );

      // Reload
      const data = await getAttendanceByClassAndDate(selectedClass.name, selectedDate);
      setAttendanceRecords(data);
    } catch (err) {
      toast.error('Gagal melakukan simulasi.');
      console.error(err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleOpenAddClass = () => {
    setClassEditorMode('add');
    setClassFormData({
      id: '',
      name: '',
      level: '10',
      academicYear: '2025/2026',
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassData, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassEditorMode('edit');
    setClassFormData(cls);
    setIsClassModalOpen(true);
  };

  const handleDeleteClass = (cls: ClassData, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmTarget(cls);
  };

  const confirmDeleteClass = async () => {
    if (!deleteConfirmTarget) return;
    const cls = deleteConfirmTarget;
    setDeleteConfirmTarget(null);
    const toastId = toast.loading('Menghapus rombel...');
    try {
      await deleteClass(cls.id!);
      toast.success('Rombel berhasil dihapus.', { id: toastId });
      const updatedClasses = await getStoredClasses(true);
      setClasses(updatedClasses);
      if (selectedClass?.id === cls.id) {
        setSelectedClass(updatedClasses[0] || null);
        if (updatedClasses.length === 0) setView('list');
      }
    } catch (err: any) {
      toast.error('Gagal menghapus rombel: ' + err.message, { id: toastId });
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (classEditorMode === 'add') {
        await addClass(classFormData as ClassData);
        toast.success('Rombel baru berhasil dibuat.');
      } else if (selectedClass?.id) {
        await updateClass(selectedClass.id, classFormData);
        toast.success('Informasi rombel diperbarui.');
      }

      const updatedClasses = await getStoredClasses(true);
      setClasses(updatedClasses);
      setIsClassModalOpen(false);
    } catch (err: any) {
      toast.error('Gagal simpan kelas: ' + getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const currentTheme = selectedClass
    ? {
        bg:
          selectedClass.level === '10'
            ? 'from-indigo-500 to-indigo-700'
            : selectedClass.level === '11'
              ? 'from-emerald-500 to-emerald-700'
              : 'from-rose-500 to-rose-700',
        text:
          selectedClass.level === '10'
            ? 'text-indigo-600'
            : selectedClass.level === '11'
              ? 'text-emerald-600'
              : 'text-rose-600',
      }
    : { bg: 'from-slate-500 to-slate-700', text: 'text-slate-600' };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#020617] overflow-hidden transition-all text-slate-800 dark:text-slate-100">
      {view === 'list' ? (
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar pb-32">
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* HEADER LIST */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0B1121] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                  <BookOpenIcon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider">
                    Rombongan Belajar
                  </span>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white uppercase leading-none mt-1">
                    Semua Kelas
                  </h1>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wide">
                    Pengelolaan Administrasi dan Jurnal Mengajar Terpadu
                  </p>
                </div>
              </div>
              {canManage && (
                <button
                  onClick={handleOpenAddClass}
                  className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  id="btn-tambah-rombel-luar"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Rombel Baru
                  </span>
                </button>
              )}
            </div>

            {/* CARI KELAS */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kelas berdasarkan nama rombel atau wali kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0B1121] text-xs font-bold uppercase rounded-2xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
              />
            </div>

            {/* GRID KELAS */}
            <div className="grid grid-cols-3 min-w-[280px]:grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4">
              {filteredClasses.map((cls) => {
                const studentCount = students.filter(
                  (s) =>
                    s.status === 'Aktif' &&
                    (s.classId === cls.id || isRombelEqual(s.tingkatRombel, cls.name)),
                ).length;
                const cardTheme =
                  cls.level === '10'
                    ? {
                        gradient: 'from-indigo-500 to-violet-600',
                        bg: 'bg-indigo-50 dark:bg-indigo-950/20',
                        border: 'border-indigo-100 dark:border-indigo-900/30',
                        text: 'text-indigo-600 dark:text-indigo-500',
                      }
                    : cls.level === '11'
                      ? {
                          gradient: 'from-emerald-500 to-teal-600',
                          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                          border: 'border-emerald-100 dark:border-emerald-900/30',
                          text: 'text-emerald-600 dark:text-emerald-500',
                        }
                      : {
                          gradient: 'from-rose-500 to-pink-600',
                          bg: 'bg-rose-50 dark:bg-rose-950/20',
                          border: 'border-rose-100 dark:border-rose-900/30',
                          text: 'text-rose-600 dark:text-rose-500',
                        };

                return (
                  <div
                    key={cls.id}
                    onClick={() => {
                      setSelectedClass(cls);
                      setView('detail_tab');
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-95 group w-full text-center relative overflow-hidden h-[134px] cursor-pointer"
                    id={`class-card-${cls.id}`}
                  >
                    {canManage && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={(e) => handleOpenEditClass(cls, e)}
                          title="Edit Rombel"
                          className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClass(cls, e)}
                          title="Hapus Rombel"
                          className="p-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Beautiful round icon sphere */}
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cardTheme.gradient} text-white flex items-center justify-center shadow-md shadow-indigo-500/5 group-hover:scale-105 transition-transform duration-300 relative shrink-0`}
                    >
                      <BookOpenIcon className="w-6 h-6 filter drop-shadow-sm" />
                      {/* Tiny overlay level indicator on bottom-right of icon */}
                      <span className="absolute -bottom-1 -right-1 bg-slate-900 dark:bg-slate-800 px-1 py-0.5 rounded-full text-[6px] font-bold leading-none text-white ring-1 ring-white dark:ring-[#111827] uppercase">
                        L{cls.level}
                      </span>
                    </div>

                    {/* Class Name label */}
                    <div className="mt-2 min-w-0 flex flex-col items-center">
                      <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-tight leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {cls.name}
                      </h3>
                      <span className="text-[7px] text-slate-400 font-extrabold uppercase mt-1 tracking-wider leading-none">
                        {studentCount} Siswa
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredClasses.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 opacity-40">
                  <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-xs font-bold uppercase">Tidak ada rombel yang sesuai</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* MAIN NAVBAR DETAIL KELAS */}
          <div className="bg-white dark:bg-[#0B1121] px-6 py-4 flex items-center justify-between z-40 border-b border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => {
                  if (isStudent || classes.length <= 1) {
                    onBack();
                  } else {
                    setView('list');
                  }
                }}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 transition-all border border-slate-100 dark:border-slate-700"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase text-indigo-500 tracking-wide block mb-0.5">
                  Detail kelas masing-masing
                </span>

                {/* Dropdown pemilih Kelas (O1 Directive) */}
                <div className="flex items-center gap-1 cursor-pointer select-none">
                  <select
                    value={selectedClass?.id || ''}
                    onChange={(e) => {
                      const found = classes.find((c) => c.id === e.target.value);
                      if (found) setSelectedClass(found);
                    }}
                    disabled={isStudent}
                    className="bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none border-none py-0.5 pr-8 appearance-none cursor-pointer focus:ring-0 uppercase leading-none"
                  >
                    {classes.map((cls, idx) => (
                      <option
                        key={`${cls.id}-${idx}`}
                        value={cls.id}
                        className="dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold uppercase select-none"
                      >
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  {!isStudent && (
                    <ChevronDownIcon className="w-4 h-4 text-slate-400 -ml-6 pointer-events-none" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {canManage && selectedClass && (
                <>
                  <button
                    onClick={(e) => handleOpenEditClass(selectedClass, e)}
                    className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-indigo-100 transition-all"
                    title="Edit Rombel"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteClass(selectedClass, e)}
                    className="px-3 py-2 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-rose-100 transition-all"
                    title="Hapus Rombel"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* TWO-COLUMN LAYOUT */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* TAB BAR (Desktop: Left rails, Mobile: Horizontal scrollable pills with categorization) */}
            <div className="md:w-68 bg-white dark:bg-[#0B1121] border-r border-slate-100 dark:border-slate-800 p-4 shrink-0 flex md:flex-col overflow-x-auto md:overflow-y-auto gap-4 custom-scrollbar shrink-0">
              {[
                {
                  title: '1. Kelas Utama',
                  items: [
                    {
                      id: 'wali_ketua',
                      label: selectedClass ? `Detail ${selectedClass.name}` : 'Detail Kelas',
                      icon: UserIcon,
                    },
                  ],
                },
                {
                  title: '2. Data Siswa Kelas',
                  items: [
                    { id: 'siswa', label: 'Data Siswa', icon: UsersIcon },
                    { id: 'wali_ketua', label: 'Wali & Ketua Kelas', icon: UserIcon },
                  ],
                },
                {
                  title: '3. Kehadiran Kelas',
                  items: [{ id: 'presensi', label: 'Absensi & QR', icon: ChartBarIcon }],
                },
                {
                  title: '4. Akademik Kelas',
                  items: [
                    { id: 'jurnal', label: 'Jurnal Kelas', icon: BookOpenIcon },
                    { id: 'jadwal', label: 'Jadwal Pelajaran', icon: CalendarIcon },
                  ],
                },
                {
                  title: '5. Disiplin & Evaluasi',
                  items: [{ id: 'poin', label: 'Sistem Poin', icon: StarIcon }],
                },
                {
                  title: '6. Komunikasi Kelas',
                  items: [{ id: 'obrolan', label: 'Obrolan & BK', icon: MessageCircleIcon }],
                },
                {
                  title: '7. Administrasi Kelas',
                  items: [
                    { id: 'surat', label: 'Layanan Surat', icon: EnvelopeIcon },
                    { id: 'arsip', label: 'Kotak Arsip', icon: FileText },
                  ],
                },
              ].map((group, groupIdx) => (
                <div
                  key={groupIdx}
                  className="flex flex-col gap-1.5 shrink-0 min-w-[150px] md:min-w-0"
                >
                  <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-[0.12em] mb-1 px-3 block">
                    {group.title}
                  </span>
                  <div className="flex flex-row md:flex-col gap-1 w-full overflow-x-auto md:overflow-x-visible">
                    {group.items.map((tab, tabIdx) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={`${tab.id}-${tabIdx}`}
                          onClick={() => {
                            setActiveTab(tab.id as DetailTab);
                          }}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap active:scale-95 transition-all text-left w-full ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="hidden md:block my-1.5 border-b border-slate-50 dark:border-slate-800/20" />
                </div>
              ))}
            </div>

            {/* MAIN TAB CONTENT DISPLAY */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar pb-40">
              {/* TAB 1: Wali & ketua kelas (Sentence case) */}
              {activeTab === 'wali_ketua' && (
                <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Wali Kelas Card */}
                    <div className="bg-white dark:bg-[#151E32] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                      <span className="text-[8px] font-bold uppercase text-indigo-500 tracking-[0.2em] block mb-4">
                        Wali kelas
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner shrink-0 leading-none">
                          <UserIcon className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-150 uppercase tracking-tight leading-none mb-1">
                            {selectedClass?.teacherName || 'BELUM DIATUR'}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                            {selectedClass?.walikelasId
                              ? `ID: ${selectedClass.walikelasId}`
                              : 'Belum diisi'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ketua Kelas Card */}
                    <div className="bg-white dark:bg-[#151E32] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                      <span className="text-[8px] font-bold uppercase text-emerald-500 tracking-[0.2em] block mb-4">
                        Ketua kelas
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner shrink-0 leading-none">
                          <UserIcon className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-150 uppercase tracking-tight leading-none mb-1">
                            {selectedClass?.captainName || 'BELUM DIATUR'}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                            {selectedClass?.ketuaKelasId
                              ? `ID: ${selectedClass.ketuaKelasId}`
                              : 'Belum ditunjuk'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Data siswa (Sentence case) */}
              {activeTab === 'siswa' && (
                <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden max-w-2xl mx-auto animate-in fade-in duration-300">
                  <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">
                      Peserta didik ({classStudents.length})
                    </span>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {classStudents.map((s, idx) => (
                      <div
                        key={`${s.id || s.idUnik || 'student'}-${idx}`}
                        className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate uppercase leading-none">
                              {s.namaLengkap}
                            </h4>
                            {(s.noHp || s.noTelepon) && (
                              <a
                                href={`https://wa.me/${(s.noHp || s.noTelepon || '').replace(/\D/g, '').replace(/^0/, '62')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-emerald-500 hover:text-emerald-400 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <WhatsAppIcon className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                            {s.idUnik} •{' '}
                            {s.jenisKelamin === 'Perempuan' ? 'PEREMPUAN' : 'LAKI-LAKI'}
                          </p>
                        </div>
                        <div className="text-[8px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                          Siswa aktif
                        </div>
                      </div>
                    ))}
                    {classStudents.length === 0 && (
                      <div className="py-20 text-center opacity-20">
                        <UsersIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase">
                          Belum ada siswa terdaftar
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Jadwal pelajaran (Sentence case) */}
              {activeTab === 'jadwal' && (
                <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => {
                    const dayScheds = allSchedules
                      .filter((s) => s.day === day)
                      .sort((a, b) => a.time.localeCompare(b.time));
                    return (
                      <div
                        key={day}
                        className="bg-white dark:bg-[#151E32] p-5 rounded-3xl border border-slate-100 dark:border-slate-800"
                      >
                        <h4 className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider mb-4 block">
                          {day}
                        </h4>
                        {dayScheds.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {dayScheds.map((sched, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                              >
                                <div>
                                  <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-none mb-1">
                                    {sched.subject}
                                  </h5>
                                  <p className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">
                                    {sched.teacherName || 'Guru pengampu'}
                                  </p>
                                </div>
                                <span className="text-[9px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                  {sched.time}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide pl-1 py-1">
                            Tidak ada jam pelajaran
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 4: Laporan presensi (Sentence case) */}
              {activeTab === 'presensi' && (
                <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
                  {/* Sub-navigasi atas presensi */}
                  <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full">
                    <button
                      onClick={() => setPresensiSubTab('kelas')}
                      className={`flex-1 py-3 text-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
                        presensiSubTab === 'kelas'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Absensi Kelas
                    </button>
                    <button
                      onClick={() => setPresensiSubTab('qr_scanner')}
                      className={`flex-1 py-3 text-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
                        presensiSubTab === 'qr_scanner'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Absensi QR Scanner
                    </button>
                  </div>

                  {presensiSubTab === 'kelas' ? (
                    <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide block mb-1">
                            Daftar kehadiran harian
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">
                            {classStudents.length} siswa rombel
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={simulateAttendanceForClass}
                            disabled={loadingAttendance}
                            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] rounded-xl transition-all active:scale-95 lowercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                            title="Simulasikan Presensi untuk Kelas ini"
                          >
                            ⚡ simulasi presensi
                          </button>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none font-bold text-xs uppercase text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
                          />
                        </div>
                      </div>

                      {loadingAttendance ? (
                        <div className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-20" />
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                          {classStudents.map((s, idx) => {
                            const record = attendanceRecords.find(
                              (r) => r.studentsId === s.id || r.studentId === s.id,
                            );
                            const status = record?.status || 'Alpha';

                            return (
                              <div
                                key={`${s.id || s.idUnik || 'student'}-att-${idx}`}
                                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                              >
                                <div className="flex flex-col min-w-0 flex-1 pr-4">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate uppercase leading-none">
                                      {s.namaLengkap}
                                    </h4>
                                    {(s.noHp || s.noTelepon) && (
                                      <a
                                        href={`https://wa.me/${(s.noHp || s.noTelepon || '').replace(/\D/g, '').replace(/^0/, '62')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 text-emerald-500 hover:text-emerald-400 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <WhatsAppIcon className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex items-center flex-wrap gap-2 mt-1">
                                    {['masuk', 'duha', 'zuhur', 'ashar', 'pulang'].map(
                                      (sessionKey) => {
                                        const time = record?.sessions?.[sessionKey]?.time;
                                        const tStr =
                                          time && time !== '--:--' && time !== 'Ts' ? time : 'Ts';
                                        const hasData = tStr !== 'Ts';
                                        return (
                                          <div key={sessionKey} className="flex items-center gap-1">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                                              {sessionKey}:
                                            </span>
                                            <span
                                              className={`text-[9px] font-bold uppercase tracking-wide ${hasData ? 'text-indigo-600' : 'text-slate-300'}`}
                                            >
                                              {tStr}
                                            </span>
                                          </div>
                                        );
                                      },
                                    )}
                                    {!record && (
                                      <span className="text-[8px] font-bold text-rose-400 uppercase tracking-wide">
                                        Belum presensi
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Selection dropdown for staff to change status (Directive 4) */}
                                {!isStudent ? (
                                  <select
                                    value={status}
                                    onChange={(e) => handleSetAttendance(s, e.target.value)}
                                    className={`p-3 text-[9px] font-bold uppercase rounded-xl border outline-none cursor-pointer tracking-wider ${
                                      status === 'Hadir'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-950/20'
                                        : status === 'Izin'
                                          ? 'bg-indigo-50 text-indigo-600 border-indigo-250 dark:bg-indigo-950/20'
                                          : status === 'Sakit'
                                            ? 'bg-amber-50 text-amber-600 border-amber-250 dark:bg-amber-950/20'
                                            : 'bg-rose-50 text-rose-600 border-rose-250 dark:bg-rose-950/20'
                                    }`}
                                  >
                                    <option value="Hadir">Hadir</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Sakit">Sakit</option>
                                    <option value="Alpha">Alpha</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                                      status === 'Hadir'
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : status === 'Izin'
                                          ? 'bg-indigo-100 text-indigo-600'
                                          : status === 'Sakit'
                                            ? 'bg-amber-100 text-amber-600'
                                            : 'bg-rose-100 text-rose-600'
                                    }`}
                                  >
                                    {status}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 animate-in fade-in duration-300">
                      <React.Suspense
                        fallback={
                          <div className="p-20 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                            <p className="text-xs font-bold uppercase mt-4">Memuat Scanner...</p>
                          </div>
                        }
                      >
                        <QRScanner onBack={() => setPresensiSubTab('kelas')} userRole={userRole} />
                      </React.Suspense>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Sistem poin & sanksi (Sentence case) */}
              {activeTab === 'poin' && (
                <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden max-w-2xl mx-auto animate-in fade-in duration-300">
                  <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">
                      Rekap poin pelanggaran
                    </span>
                    {!isStudent && (
                      <button
                        onClick={() => setIsPointModalOpen(true)}
                        className="p-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-wider"
                      >
                        Input poin
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {classStudents.map((s, idx) => {
                      const studentPoints = pointRecords.filter((p) => p.studentId === s.id);
                      const totalPoints =
                        100 +
                        studentPoints.reduce((acc, curr) => {
                          return curr.type === 'Prestasi' ? acc + curr.points : acc - curr.points;
                        }, 0);

                      return (
                        <div
                          key={`${s.id || s.idUnik || 'student'}-points-${idx}`}
                          className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                        >
                          <div className="flex flex-col min-w-0 flex-1 pr-4">
                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate uppercase leading-none mb-1.5">
                              {s.namaLengkap}
                            </h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                              {s.idUnik}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p
                                className={`text-[12px] font-bold leading-none ${totalPoints < 60 ? 'text-rose-600' : 'text-indigo-600'}`}
                              >
                                {totalPoints}
                              </p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
                                Sisa poin
                              </p>
                            </div>
                            {!isStudent && (
                              <button
                                onClick={() => {
                                  setSelectedStudentId(s.id!);
                                  setIsPointModalOpen(true);
                                }}
                                className="p-2 text-amber-500 bg-amber-50 dark:bg-amber-900/30 rounded-xl active:scale-75 transition-transform"
                              >
                                <StarIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: Layanan surat (Sentence case) */}
              {activeTab === 'surat' && (
                <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden max-w-2xl mx-auto animate-in fade-in duration-300">
                  <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">
                      Surat keterangan perizinan
                    </span>
                  </div>

                  {loadingLetters ? (
                    <div className="py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-20" />
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {letters.map((letter, idx) => (
                        <div
                          key={letter.id || idx}
                          className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                        >
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[7px] font-bold text-slate-500 uppercase tracking-wide">
                              {letter.type}
                            </span>
                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-105 uppercase tracking-tight leading-none mt-1">
                              {letter.userName}
                            </h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5">
                              {letter.description}
                            </p>
                            <p className="text-[8px] text-slate-400 capitalize font-medium">
                              {new Date(letter.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 items-center justify-end shrink-0">
                            {letter.status === 'Pending' && !isStudent ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveLetter(letter.id, 'Signed')}
                                  className="px-3.5 py-2 bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl active:scale-95 transition-transform"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleApproveLetter(letter.id, 'Ditolak')}
                                  className="px-3.5 py-2 bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl active:scale-95 transition-transform"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`px-3.5 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider ${
                                  letter.status === 'Signed'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : letter.status === 'Ditolak'
                                      ? 'bg-rose-100 text-rose-600'
                                      : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {letter.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {letters.length === 0 && (
                        <div className="py-20 text-center opacity-20">
                          <EnvelopeIcon className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-[10px] font-bold uppercase">
                            Tidak ada pengajuan surat keterangan
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: Obrolan kelas (Sentence case) */}
              {activeTab === 'obrolan' && (
                <div className="bg-white dark:bg-[#151E32] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden max-w-2xl mx-auto flex flex-col h-[520px] animate-in fade-in duration-300">
                  <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide block mb-1">
                      Saluran harian kelas
                    </span>

                    {/* MULTI CHANNEL PILLS FOR STRUCTURAL ALIGNMENT */}
                    <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                      {[
                        { key: 'general', label: 'Umum' },
                        { key: 'individual', label: 'Chat Individual' },
                        { key: 'mapel', label: 'Chat Mapel' },
                        { key: 'wk', label: 'Chat Wali Kelas (WK)' },
                        { key: 'bk', label: 'Chat BK' },
                      ].map((chan) => (
                        <button
                          key={chan.key}
                          type="button"
                          onClick={() => setChatChannel(chan.key as any)}
                          className={`px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[9px] font-bold uppercase tracking-wider whitespace-nowrap border cursor-pointer active:scale-95 transition-all ${
                            chatChannel === chan.key
                              ? 'text-indigo-600 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30 font-bold'
                              : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-800 font-bold'
                          }`}
                        >
                          {chan.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Message Window Area */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {(chatChannel === 'general'
                      ? chatMessages
                      : customMessages[chatChannel] || []
                    ).map((msg, idx) => {
                      const isMe = msg.senderId === useAuthStore.getState().user?.id;
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wide mb-1">
                            {msg.senderName} ({msg.senderRole})
                          </span>
                          <div
                            className={`p-4 rounded-[1.5rem] text-xs max-w-xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-800'
                            }`}
                          >
                            <p className="leading-snug">{msg.messageText}</p>
                          </div>
                        </div>
                      );
                    })}

                    {(chatChannel === 'general' ? chatMessages : customMessages[chatChannel] || [])
                      .length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-25 text-center p-8">
                        <MessageCircleIcon className="w-12 h-12 mb-2 text-indigo-500" />
                        <p className="text-[10px] font-bold uppercase">Mulai obrolan hari ini</p>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Msg Input form */}
                  {isStudent &&
                  activeStudentClass &&
                  !isRombelEqual(selectedClass?.name || '', activeStudentClass) ? (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-t border-rose-100 dark:border-rose-900/50 text-center text-[10px] font-bold uppercase tracking-wider shrink-0">
                      Akses Terkunci: Kirim pesan hanya diizinkan di Rombel teridentifikasi Anda (
                      {activeStudentClass})
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSendMessage}
                      className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0"
                    >
                      <input
                        type="text"
                        value={newMsgText}
                        onChange={(e) => setNewMsgText(e.target.value)}
                        placeholder="Kirim pesan di sini..."
                        className="flex-1 p-4 bg-white dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-2xl outline-none"
                      />
                      <button
                        type="submit"
                        className="px-5 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wide rounded-2xl active:scale-95 transition-transform shrink-0"
                      >
                        Kirim
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 8: Kotak arsip (Sentence case) */}
              {activeTab === 'arsip' && (
                <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden max-w-2xl mx-auto animate-in fade-in duration-300 p-6">
                  <div className="mb-6 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider">
                        Folder Arsip: {selectedClass?.name}
                      </span>
                      <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">
                        Dokumen & Berkas Digital Kelas {selectedClass?.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {selectedClass?.archives?.map((file: any, index: number) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-500 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900 text-indigo-600 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px] leading-tight">
                              {file.name}
                            </p>
                            <p className="text-[8px] text-slate-400 uppercase font-bold tracking-wider mt-1">
                              {new Date(file.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <SparklesIcon className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                      </a>
                    ))}
                    {(!selectedClass?.archives || selectedClass.archives.length === 0) && (
                      <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 opacity-30">
                        <BookOpenIcon className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                        <p className="text-[10px] font-bold uppercase">
                          Belum ada dokumen di folder kelas ini
                        </p>
                      </div>
                    )}
                  </div>

                  {!isStudent && (
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={archiveInputRef}
                        className="hidden"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleUploadClassArchive}
                      />
                      <button
                        onClick={() => archiveInputRef.current?.click()}
                        disabled={archivingClass}
                        className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl text-[9px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                      >
                        {archivingClass ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PlusIcon className="w-4 h-4" />
                        )}{' '}
                        Unggah Dokumen ke Folder {selectedClass?.name}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8.5: Jurnal Mengajar Kelas (Consolidated e-Mam v8.0) */}
              {activeTab === 'jurnal' && (
                <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300 p-6">
                  <div className="mb-6 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                      <BookOpenIcon className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-indigo-500 tracking-wider">
                        Jurnal Mengajar KBM
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase leading-none mt-1">
                        Sesi KBM - Kelas {selectedClass?.name}
                      </h3>
                      <p className="text-[8px] text-slate-400 font-bold uppercase mt-2 tracking-wide">
                        Agenda harian dan catatan KBM Tatap Muka rombel ini
                      </p>
                    </div>
                  </div>
                  <TeachingJournal filterClassName={selectedClass?.name || ''} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL KELAS */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0B1121] w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-300 flex flex-col max-h-[92vh] relative overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1121] z-10 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase leading-none">
                  {classEditorMode === 'add' ? 'Tambah Rombel' : 'Edit Rombel'}
                </h3>
                <p className="text-[9px] font-bold text-indigo-500 uppercase mt-2 tracking-wide">
                  Master Data Kelas
                </p>
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
              >
                <XCircleIcon className="w-8 h-8" />
              </button>
            </div>

            <div className="p-6 lg:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 pb-12 bg-[#F8FAFC] dark:bg-[#0B1121]">
              <form id="classForm" onSubmit={handleSaveClass} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      ID Dokumen *
                    </label>
                    <input
                      required
                      disabled={classEditorMode === 'edit'}
                      type="text"
                      value={classFormData.id || ''}
                      onChange={(e) =>
                        setClassFormData({ ...classFormData, id: e.target.value.toUpperCase() })
                      }
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none uppercase shadow-inner"
                      placeholder="CONTOH: 10_A_2025"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Tingkat *
                    </label>
                    <select
                      value={classFormData.level || '10'}
                      onChange={(e) =>
                        setClassFormData({ ...classFormData, level: e.target.value })
                      }
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none appearance-none cursor-pointer"
                    >
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Nama Rorbel *
                    </label>
                    <input
                      required
                      type="text"
                      value={classFormData.name || ''}
                      onChange={(e) =>
                        setClassFormData({ ...classFormData, name: e.target.value.toUpperCase() })
                      }
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="MISAL: 10 A"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Tahun Pelajaran *
                    </label>
                    <input
                      required
                      type="text"
                      value={classFormData.academicYear || '2025/2026'}
                      onChange={(e) =>
                        setClassFormData({ ...classFormData, academicYear: e.target.value })
                      }
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="MISAL: 2025/2026"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Wali Kelas
                    </label>
                    <select
                      value={classFormData.walikelasId || ''}
                      onChange={(e) => {
                        const selectedTeacher = teachers.find(
                          (t) => t.teachersId === e.target.value,
                        );
                        setClassFormData({
                          ...classFormData,
                          walikelasId: e.target.value,
                          teacherName: selectedTeacher?.name || '',
                        });
                      }}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 animate-none shrink-0"
                    >
                      <option value="">Pilih Wali Kelas</option>
                      {teachers.map((t, idx) => (
                        <option key={`${t.teachersId}-${idx}`} value={t.teachersId}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Ketua Kelas
                    </label>
                    <select
                      value={classFormData.ketuaKelasId || ''}
                      onChange={(e) => {
                        const selectedStudent = students.find(
                          (s) => s.studentsId === e.target.value,
                        );
                        setClassFormData({
                          ...classFormData,
                          ketuaKelasId: e.target.value,
                          captainName: selectedStudent?.namaLengkap || '',
                        });
                      }}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 animate-none shrink-0"
                    >
                      <option value="">Pilih Ketua Kelas</option>
                      {students
                        .filter(
                          (s) =>
                            s.status === 'Aktif' &&
                            isRombelEqual(s.tingkatRombel, classFormData.name || ''),
                        )
                        .map((s, idx) => (
                          <option key={`${s.studentsId}-${idx}`} value={s.studentsId}>
                            {s.namaLengkap}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsClassModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[1.5rem] font-bold text-[10px] uppercase tracking-wide active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SaveIcon className="w-4 h-4" />
                    )}{' '}
                    SIMPAN
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POIN */}
      {isPointModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0B1121] w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-300 flex flex-col max-h-[92vh] relative overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1121] z-10 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase leading-none">
                  Input Poin
                </h3>
                <p className="text-[9px] font-bold text-indigo-500 uppercase mt-2 tracking-wide">
                  Kedisiplinan & Prestasi
                </p>
              </div>
              <button
                onClick={() => setIsPointModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
              >
                <XCircleIcon className="w-8 h-8" />
              </button>
            </div>
            <div className="p-6 lg:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 pb-12 bg-[#F8FAFC] dark:bg-[#0B1121]">
              <form
                id="pointForm"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const studentId = formData.get('studentId') as string;
                  const student = classStudents.find((s) => s.id === studentId);
                  if (!student) return;

                  setSaving(true);
                  try {
                    const { addStudentPoint } = await import('@/services/pointService');
                    const result = await addStudentPoint({
                      studentId: student.id!,
                      studentName: student.namaLengkap,
                      class: selectedClass!.name,
                      type: formData.get('type') as any,
                      category: formData.get('category') as string,
                      description: formData.get('description') as string,
                      points: parseInt(formData.get('points') as string),
                      date: new Date().toISOString(),
                      recordedBy: 'Sistem',
                    });
                    if ((result as any)?.status === 'QUEUED_OFFLINE') {
                      toast.warning(
                        'Offline: Catatan poin disimpan ke antrean lokal (Sync Pending).',
                      );
                    } else {
                      toast.success('Poin baru disinkronisasi harian!');
                    }
                    setIsPointModalOpen(false);

                    if (selectedClass) {
                      const history = await getAllPointRecords().then((res) =>
                        res.filter(
                          (p: any) =>
                            p.class === selectedClass.name || p.classId === selectedClass.id,
                        ),
                      );
                      setPointRecords(history);
                    }
                  } catch (err: any) {
                    toast.error('Gagal memproses poin: ' + getFriendlyErrorMessage(err));
                  } finally {
                    setSaving(false);
                  }
                }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    Pilih Siswa
                  </label>
                  <select
                    name="studentId"
                    defaultValue={selectedStudentId}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {classStudents.map((s, idx) => (
                      <option key={`${s.id}-${idx}`} value={s.id}>
                        {s.namaLengkap}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Jenis
                    </label>
                    <select
                      name="type"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none appearance-none cursor-pointer"
                    >
                      <option value="Pelanggaran">Pelanggaran (-)</option>
                      <option value="Prestasi">Prestasi (+)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                      Jumlah Poin
                    </label>
                    <input
                      name="points"
                      type="number"
                      min="1"
                      required
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    Kategori
                  </label>
                  <input
                    name="category"
                    type="text"
                    required
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="Contoh: Keterlambatan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    Keterangan
                  </label>
                  <textarea
                    name="description"
                    required
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[100px]"
                    placeholder="Detail kejadian..."
                  ></textarea>
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsPointModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[1.5rem] font-bold text-[10px] uppercase tracking-wide active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SaveIcon className="w-4 h-4" />
                    )}{' '}
                    SIMPAN
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0B1121] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in duration-300 flex flex-col relative overflow-hidden text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-rose-500/10">
              <TrashIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-2">
              Hapus Rombel {deleteConfirmTarget.name}?
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Tindakan ini akan menghapus rombongan belajar secara permanen dari sistem. Pastikan tidak ada data siswa aktif yang terkait.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-bold text-[10px] uppercase tracking-wide active:scale-95 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteClass}
                className="flex-1 py-4 bg-rose-600 text-white rounded-[1.5rem] font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassList;
