/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect } from 'react';
import Layout from '@/layouts/Layout';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  Loader2,
  RectangleStackIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  SaveIcon,
  ArrowRightIcon,
  XCircleIcon,
} from '@/shared/Icons';
import { ScheduleDatePicker } from './ScheduleDatePicker';
import { ScheduleTimeline } from './ScheduleTimeline';
import {
  getTeacherMasterDataMinimal,
  getSubjectMasterDataMinimal,
} from '@/services/masterDataService';
import { isMockMode } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useStudentStore } from '@/stores/studentStore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getSchedules, saveScheduleItemWithBatch } from '@/services/scheduleService';
import type { ScheduleItem } from '@/types';
import { UserRole, COMMON_SUBJECTS } from '@/types';

interface ScheduleProps {
  onBack: () => void;
  userRole?: UserRole;
  studentsId?: string;
  onOpenSidebar?: () => void;
}

type SubView = 'dashboard' | 'timetable' | 'session_config' | 'loading';

interface DaySessionConfig {
  masuk: string;
  duhaStart: string;
  duhaEnd: string;
  zuhurStart: string;
  zuhurEnd: string;
  asharStart: string;
  asharEnd: string;
  pulang: string;
}

interface SessionConfig {
  workingDays: number[];
  monday: DaySessionConfig;
  tuesday: DaySessionConfig;
  wednesday: DaySessionConfig;
  thursday: DaySessionConfig;
  friday: DaySessionConfig;
  saturday: DaySessionConfig;
  sunday: DaySessionConfig;
  // Fields below for backward compatibility
  tuesdayToFriday?: DaySessionConfig;
  masukLimit: string;
  duhaStart: string;
  duhaEnd: string;
  zuhurStart: string;
  zuhurEnd: string;
  asharStart: string;
  asharEnd: string;
  pulangLimit: string;
  pulangLimitJumat: string;
}

const Schedule: React.FC<ScheduleProps> = ({ onBack, userRole, studentsId, onOpenSidebar }) => {
  const globalSelectedClass = useStudentStore((state) => state.selectedClass);
  const [view, setView] = useState<SubView>('loading');
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState(() => {
    if (globalSelectedClass?.name) return globalSelectedClass.name;
    return localStorage.getItem('emam_filter_schedule_class') || '';
  });

  // Sync with global class context if available
  useEffect(() => {
    if (globalSelectedClass?.name) {
      setSelectedClass(globalSelectedClass.name);
      setView('timetable'); // Auto switch to timetable view if class is selected from dashboard
    }
  }, [globalSelectedClass]);

  const [isTeacherView, setIsTeacherView] = useState(false);
  const [activeYearDocId, setActiveYearDocId] = useState<string | null>(null);

  // Persist selected class
  useEffect(() => {
    if (selectedClass) {
      localStorage.setItem('emam_filter_schedule_class', selectedClass);
    }
  }, [selectedClass]);

  const handleExport = () => {
    const text =
      `Jadwal ${selectedClass}\n` +
      allSchedules
        .filter((s) => s.class === selectedClass)
        .map((s) => `${s.day} ${s.time} - ${s.subject}`)
        .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jadwal_${selectedClass}.txt`;
    a.click();
  };
  const [classes, setClasses] = useState<any[]>([]);
  const [allSchedules, setAllSchedules] = useState<ScheduleItem[]>([]);
  const [studentClass, setStudentClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    if (day === 0 || day === 6) {
      // Find Monday
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(new Date().setDate(diff));
    }
    return d;
  });
  const [currentTeacherSubject, setCurrentTeacherSubject] = useState<string>('');

  // Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [modalSubject, setModalSubject] = useState('');
  const [modalTeacher, setModalTeacher] = useState('');
  const [teacherOptions, setTeacherOptions] = useState<any[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);

  const isStudent =
    userRole === UserRole.SISWA ||
    userRole === UserRole.KETUA_KELAS ||
    userRole === UserRole.ORANG_TUA;

  useEffect(() => {
    // Load all subjects once to have a reference for filtering
    getSubjectMasterDataMinimal().then(setAllSubjects);
  }, []);

  // Filter subjects whenever teacher changes
  useEffect(() => {
    if (!modalTeacher) {
      setSubjectOptions(
        allSubjects.length > 0 ? allSubjects : COMMON_SUBJECTS.map((s) => ({ id: s, name: s })),
      );
      return;
    }

    // Find teacher to get subjects
    import('@/services/teacherService').then((service) => {
      service.getTeachers(true).then((teachers) => {
        const teacher = teachers.find((t) => t.name === modalTeacher);
        if (teacher && teacher.subject) {
          const teacherSubjects = teacher.subject.split(',').map((s) => s.trim());
          const filtered = allSubjects.filter((s) => teacherSubjects.includes(s.name));

          // If no match in master data, use the teacher's subject strings
          if (filtered.length === 0) {
            setSubjectOptions(teacherSubjects.map((s) => ({ id: s, name: s })));
          } else {
            setSubjectOptions(filtered);
          }
        } else {
          setSubjectOptions(
            allSubjects.length > 0 ? allSubjects : COMMON_SUBJECTS.map((s) => ({ id: s, name: s })),
          );
        }
      });
    });
  }, [modalTeacher, allSubjects]);

  const [sessionConfig, setSessionConfig] = useState<SessionConfig>(() => {
    const defaultConfig: DaySessionConfig = {
      masuk: '07:30',
      duhaStart: '07:31',
      duhaEnd: '10:00',
      zuhurStart: '12:00',
      zuhurEnd: '14:00',
      asharStart: '15:30',
      asharEnd: '16:30',
      pulang: '16:00',
    };

    return {
      workingDays: [1, 2, 3, 4, 5],
      monday: { ...defaultConfig },
      tuesday: { ...defaultConfig },
      wednesday: { ...defaultConfig },
      thursday: { ...defaultConfig },
      friday: { ...defaultConfig, pulang: '11:45' },
      saturday: { ...defaultConfig },
      sunday: { ...defaultConfig },
      masukLimit: '07:30',
      duhaStart: '07:31',
      duhaEnd: '10:00',
      zuhurStart: '12:00',
      zuhurEnd: '14:00',
      asharStart: '15:30',
      asharEnd: '16:30',
      pulangLimit: '16:00',
      pulangLimitJumat: '11:30',
    };
  });

  useEffect(() => {
    const init = async () => {
      if (!userRole) return;
      if (isMockMode) {
        setClasses([{ id: '1', name: 'XII IPA 1' }]);
        setAllSchedules([
          {
            id: '1',
            day: 'Senin',
            time: '07:30 - 08:15',
            subject: 'Matematika (Mariana)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: '2',
            day: 'Senin',
            time: '08:15 - 09:00',
            subject: 'Kimia (Rusmalina)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: '3',
            day: 'Senin',
            time: '09:00 - 09:45',
            subject: 'Kimia (Rusmalina)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: 'break1',
            day: 'Senin',
            time: '09:45 - 10:00',
            subject: 'ISTIRAHAT',
            class: 'XII IPA 1',
            room: '-',
          },
          {
            id: '4',
            day: 'Senin',
            time: '10:00 - 10:45',
            subject: 'Sejarah (Alfi Syahrin)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: '5',
            day: 'Senin',
            time: '10:45 - 11:30',
            subject: 'Sejarah (Alfi Syahrin)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: '6',
            day: 'Senin',
            time: '11:30 - 12:15',
            subject: 'Tafsir (Juhda Rahlia)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: 'break2',
            day: 'Senin',
            time: '12:15 - 12:30',
            subject: 'ISTIRAHAT',
            class: 'XII IPA 1',
            room: '-',
          },
          {
            id: '7',
            day: 'Senin',
            time: '12:30 - 13:15',
            subject: 'Tafsir (Juhda Rahlia)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: '8',
            day: 'Senin',
            time: '13:15 - 14:00',
            subject: 'BTA (Farah Adefia)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: '9',
            day: 'Senin',
            time: '14:00 - 14:45',
            subject: 'BTA (Farah Adefia)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: '10',
            day: 'Senin',
            time: '14:45 - 15:30',
            subject: 'Informatika (Rajib Habibi)',
            class: 'XII IPA 1',
            room: 'Lab Komp',
          },
          {
            id: '11',
            day: 'Senin',
            time: '15:30 - 16:15',
            subject: 'Olahraga (Opsional)',
            class: 'XII IPA 1',
            room: 'Lapangan',
          },

          // Hari Lain
          {
            id: 't1',
            day: 'Selasa',
            time: '07:30 - 08:15',
            subject: 'Matematika (Mariana)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: 't2',
            day: 'Selasa',
            time: '08:15 - 09:00',
            subject: 'Kimia (Rusmalina)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: 'w1',
            day: 'Rabu',
            time: '07:30 - 08:15',
            subject: 'Matematika (Mariana)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: 'th1',
            day: 'Kamis',
            time: '07:30 - 08:15',
            subject: 'Matematika (Mariana)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
          {
            id: 'f1',
            day: 'Jumat',
            time: '07:30 - 08:15',
            subject: 'Tafsir (Juhda Rahlia)',
            class: 'XII IPA 1',
            room: 'R. 12',
          },
        ]);
        if (isStudent) {
          setStudentClass('XII IPA 1');
          setSelectedClass('XII IPA 1');
          setView('timetable');
        } else {
          setView('dashboard');
        }
        return;
      }

      try {
        // Fetch classes
        const { getClasses } = await import('@/services/classService');
        const data = await getClasses();
        setClasses(data);

        // Fetch teacher's subject if user is a teacher
        const user = useAuthStore.getState().user;
        if (
          user &&
          userRole &&
          [UserRole.GURU, UserRole.WALI_KELAS].includes(userRole)
        ) {
          try {
            const { getUserData } = await import('@/services/userService');
            const userDoc = await getUserData(user.id);
            if (userDoc) {
              const linkedTeacherId = userDoc.teacherId;
              if (linkedTeacherId) {
                const { getTeacherData } = await import('@/services/teacherService');
                const teacherDoc = await getTeacherData(linkedTeacherId);
                if (teacherDoc && teacherDoc.subject) {
                  setCurrentTeacherSubject(teacherDoc.subject);
                }
              }
            }
          } catch (err: any) {
            console.log('Could not fetch teacher subject details', err?.message || 'Error');
          }
        }

        // Fetch schedules
        const scheduleData = await getSchedules();
        setAllSchedules(scheduleData);

        // If student, fetch their class
        if (isStudent && studentsId) {
          const { getStudentData } = await import('@/services/studentService');
          const sDoc = await getStudentData(studentsId);
          if (sDoc) {
            const rombel = sDoc.tingkatRombel;
            if (rombel) {
              setStudentClass(rombel);
              setSelectedClass(rombel);
              setView('timetable');
            } else {
              setView('dashboard');
            }
          } else {
            setView('dashboard');
          }
        } else {
          setView('dashboard');
        }

        // Fetch active year config
        const { getActiveAcademicYear } = await import('@/services/academicService');
        const yearData = await getActiveAcademicYear();
        if (yearData) {
          setActiveYearDocId(yearData.id);
          if (yearData.config) {
            setSessionConfig((prev) => {
              const merged = { ...prev, ...yearData.config };
              // Migration: Populate nested configs if they don't exist
              if (!merged.monday) {
                merged.monday = {
                  masuk: yearData.config.masukLimit || prev.monday.masuk,
                  duhaStart: yearData.config.duhaStart || prev.monday.duhaStart,
                  duhaEnd: yearData.config.duhaEnd || prev.monday.duhaEnd,
                  zuhurStart: yearData.config.zuhurStart || prev.monday.zuhurStart,
                  zuhurEnd: yearData.config.zuhurEnd || prev.monday.zuhurEnd,
                  asharStart: yearData.config.asharStart || prev.monday.asharStart,
                  asharEnd: yearData.config.asharEnd || prev.monday.asharEnd,
                  pulang: yearData.config.pulangLimit || prev.monday.pulang,
                };
              }

              const baseTueFri = yearData.config.tuesdayToFriday || {
                masuk: yearData.config.masukLimit || prev.tuesday.masuk,
                duhaStart: yearData.config.duhaStart || prev.tuesday.duhaStart,
                duhaEnd: yearData.config.duhaEnd || prev.tuesday.duhaEnd,
                zuhurStart: yearData.config.zuhurStart || prev.tuesday.zuhurStart,
                zuhurEnd: yearData.config.zuhurEnd || prev.tuesday.zuhurEnd,
                asharStart: yearData.config.asharStart || prev.tuesday.asharStart,
                asharEnd: yearData.config.asharEnd || prev.tuesday.asharEnd,
                pulang: yearData.config.pulangLimit || prev.tuesday.pulang,
              };

              if (!merged.tuesday) merged.tuesday = { ...baseTueFri };
              if (!merged.wednesday) merged.wednesday = { ...baseTueFri };
              if (!merged.thursday) merged.thursday = { ...baseTueFri };
              if (!merged.friday)
                merged.friday = {
                  ...baseTueFri,
                  pulang: yearData.config.pulangLimitJumat || baseTueFri.pulang,
                };
              if (!merged.saturday) merged.saturday = { ...baseTueFri };
              if (!merged.sunday) merged.sunday = { ...baseTueFri };

              return merged;
            });
          }
        }

        // Fetch Teacher Subject if logged in as Teacher
        const authUser = useAuthStore.getState().user;
        if (
          authUser?.id &&
          (userRole === UserRole.GURU ||
            userRole === UserRole.WALI_KELAS ||
            userRole === UserRole.GURU_BK ||
            userRole === UserRole.PEMBINA_EKSKUL)
        ) {
          const { getTeachers } = await import('@/services/teacherService');
          const teachers = await getTeachers();
          const myTeacher = teachers.find((t) => t.linkedUserId === authUser.id);
          if (myTeacher && myTeacher.subject) {
            setCurrentTeacherSubject(myTeacher.subject);
          }
        }
      } catch (e) {
        console.error('Failed to fetch schedule data', e);
        setView('dashboard');
      }
    };

    init();
  }, [studentsId, userRole]);

  const handleSlotClick = async (slot: any) => {
    setSelectedSlot(slot);
    setModalSubject(slot.filledData?.subject || currentTeacherSubject || '');
    setModalTeacher(slot.filledData?.teacherName || useAuthStore.getState().user?.displayName || '');
    setIsSlotModalOpen(true);

    // Load master data with extreme savings
    const teachers = await getTeacherMasterDataMinimal();
    const subjects = await getSubjectMasterDataMinimal();
    setTeacherOptions(teachers);
    setSubjectOptions(subjects);
  };

  const handleSaveSlot = async () => {
    if (!modalSubject.trim() || !modalTeacher.trim()) {
      toast.error('Mata Pelajaran dan Nama Guru harus diisi.');
      return;
    }

    const dayString = format(selectedDate, 'EEEE', { locale: id });
    const newItem: ScheduleItem = {
      id: selectedSlot.filledData?.id || Date.now().toString(),
      day: dayString,
      time: selectedSlot.time,
      subject: modalSubject,
      class: selectedClass,
      room: 'Menyesuaikan',
      teacherName: modalTeacher,
      isLocked: true,
    };

    setSaving(true);
    try {
      await saveScheduleItemWithBatch(newItem);

      setAllSchedules((prev) => {
        const filtered = prev.filter(
          (s) => !(s.day === newItem.day && s.time === newItem.time && s.class === newItem.class),
        );
        return [...filtered, newItem];
      });

      toast.success('Jadwal terpilih berhasil dikunci!');
      setIsSlotModalOpen(false);
    } catch (error: any) {
      console.error('Save slot failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkingDay = (day: number) => {
    setSessionConfig((prev) => {
      const current = [...prev.workingDays];
      if (current.includes(day)) {
        return { ...prev, workingDays: current.filter((d) => d !== day) };
      } else {
        return { ...prev, workingDays: [...current, day].sort() };
      }
    });
  };

  const handleSaveSessions = async () => {
    if (!activeYearDocId) {
      toast.error('Tidak ada Tahun Ajaran aktif yang ditemukan.');
      return;
    }
    setSaving(true);
    const toastId = toast.loading('Sinkronisasi Sesi ke Tahun Ajaran Aktif...');
    try {
      if (!isMockMode) {
        const { saveAcademicYear } = await import('@/services/academicService');
        await saveAcademicYear({ id: activeYearDocId, config: sessionConfig });
      }
      toast.success('Konfigurasi Jadwal Global Diperbarui.', { id: toastId });
      setView('dashboard');
    } catch (e: any) {
      toast.error('Gagal menyimpan konfigurasi sesi.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at"];

  const renderDashboard = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
            <ClockIcon className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-400 tracking-[0.2em]">Pengaturan sesi</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MenuTile
            title="Jam Sesi & Hari Aktif"
            desc="Window waktu scan & kalender efektif"
            icon={ClockIcon}
            color="indigo"
            onClick={() => setView('session_config')}
          />
          <MenuTile
            title="Lihat Jadwal Mingguan"
            desc="Dasbor jadwal KBM per rombel"
            icon={RectangleStackIcon}
            color="indigo"
            onClick={() => setView('timetable')}
          />
        </div>
      </section>

      <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-center opacity-60">
        <p className="text-[9px] font-bold text-slate-400 tracking-[0.2em] leading-relaxed">
          Konfigurasi ini bertindak sebagai master kernel untuk validasi presensi harian <br />
          yang disimpan langsung di dokumen tahun ajaran aktif.
        </p>
      </div>
    </div>
  );

  const [configTab, setConfigTab] = useState<number>(1);

  const renderSessionConfig = () => {
    const dayKeys: Record<number, keyof SessionConfig> = {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
    };

    const currentKey = dayKeys[configTab];
    const currentConfig = sessionConfig[currentKey] as DaySessionConfig;

    const updateCurrentConfig = (field: keyof DaySessionConfig, value: string) => {
      setSessionConfig((prev) => ({
        ...prev,
        [currentKey]: {
          ...currentConfig,
          [field]: value,
        },
      }));
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto pb-20">
        <div className="bg-white dark:bg-[#0F172A] rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden relative">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="p-8 lg:p-12 relative z-10 space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                  <ClockIcon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none lowercase">
                    konfigurasi jam sesi
                  </h3>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[9px] font-bold text-indigo-500/60 tracking-[0.2em] lowercase">
                      {activeYearDocId || 'master kernel system'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {/* SECTION 1: WORKING DAYS */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 border border-indigo-100/50 dark:border-indigo-500/20">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">
                    Kalender efektif (Hari kerja)
                  </h4>
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                  {[1, 2, 3, 4, 5].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkingDay(day)}
                      className={`py-6 px-1 rounded-3xl text-[9px] font-bold transition-all border-2 relative overflow-hidden group flex flex-col items-center justify-center gap-2 ${
                        sessionConfig.workingDays.includes(day)
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_10px_30px_-5px_rgba(79,70,229,0.3)]'
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-300'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-all ${sessionConfig.workingDays.includes(day) ? 'bg-white' : 'bg-slate-200 dark:bg-slate-700'}`}
                      ></div>
                      {dayNames[day]}
                      {sessionConfig.workingDays.includes(day) && (
                        <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2: SCANNER SESSIONS */}
              <div className="space-y-8 bg-white dark:bg-slate-900/40 p-8 md:p-10 rounded-[3rem] border border-slate-200/60 dark:border-white/5 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl transition-all group-hover:scale-125"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl transition-all group-hover:scale-125"></div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transform transition-transform group-hover:rotate-12">
                      <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide leading-none">
                        Pengaturan sesi pemindaian
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 tracking-wide mt-1.5 opacity-70">
                        Konfigurasi window absensi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Day Toggle Switcher */}
                <div className="flex p-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[2.5rem] w-full max-w-xl mx-auto relative z-10 border border-white/20 dark:border-white/5 overflow-x-auto scrollbar-hide shrink-0">
                  {[1, 2, 3, 4, 5].map((day) => {
                    const isActive = configTab === day;
                    return (
                      <button
                        key={day}
                        onClick={() => setConfigTab(day)}
                        className={`flex-1 py-4 px-3 rounded-[1.5rem] text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300 min-w-[80px] relative ${
                          isActive
                            ? 'text-indigo-600'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        <span className="relative z-10">{dayNames[day]}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeSessionTab"
                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-[1.5rem] shadow-xl shadow-indigo-500/10 ring-1 ring-slate-200/50 dark:ring-white/10"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="space-y-10 animate-in fade-in duration-300"
                  key={dayKeys[configTab]}
                >
                  {/* Masuk & Pulang */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TimeField
                      label={`Batas Masuk (${dayNames[configTab]})`}
                      value={currentConfig.masuk}
                      icon={ArrowRightIcon}
                      color="emerald"
                      onChange={(v: any) => updateCurrentConfig('masuk', v)}
                    />
                    <TimeField
                      label={`Sesi Pulang (${dayNames[configTab]})`}
                      value={currentConfig.pulang}
                      icon={ArrowLeftIcon}
                      color="orange"
                      onChange={(v: any) => updateCurrentConfig('pulang', v)}
                    />
                  </div>

                  {/* Window Ibadah */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h4 className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-[0.3em] shrink-0">
                        Waktu Ibadah
                      </h4>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <IbadahCard
                        label="Duha"
                        start={currentConfig.duhaStart}
                        end={currentConfig.duhaEnd}
                        color="rose"
                        onStartChange={(v: any) => updateCurrentConfig('duhaStart', v)}
                        onEndChange={(v: any) => updateCurrentConfig('duhaEnd', v)}
                      />
                      <IbadahCard
                        label="Zuhur"
                        start={currentConfig.zuhurStart}
                        end={currentConfig.zuhurEnd}
                        color="indigo"
                        onStartChange={(v: any) => updateCurrentConfig('zuhurStart', v)}
                        onEndChange={(v: any) => updateCurrentConfig('zuhurEnd', v)}
                      />
                      <IbadahCard
                        label="Ashar"
                        start={currentConfig.asharStart}
                        end={currentConfig.asharEnd}
                        color="teal"
                        onStartChange={(v: any) => updateCurrentConfig('asharStart', v)}
                        onEndChange={(v: any) => updateCurrentConfig('asharEnd', v)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setView('dashboard')}
                className="flex-1 py-5 rounded-[2rem] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[11px] tracking-[0.2em] active:scale-95 transition-all shadow-inner"
              >
                Batalkan perubahan
              </button>
              <button
                onClick={handleSaveSessions}
                disabled={saving}
                className="flex-[2] py-5 rounded-[2rem] bg-indigo-600 text-white font-bold text-[11px] tracking-[0.3em] shadow-2xl shadow-indigo-500/40 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <SaveIcon className="w-6 h-6" />
                )}
                Sinkronisasi database aktif
              </button>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-8 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-lg mx-auto">
              Konfigurasi ini bertindak sebagai <span className="text-indigo-500">Master Rule</span>{' '}
              untuk validasi scan presensi di seluruh aplikasi. Pastikan data akurat sebelum menekan
              tombol sinkronisasi.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const IbadahCard = ({ label, start, end, color, onStartChange, onEndChange }: any) => {
    const colors: any = {
      rose: 'text-rose-500 border-rose-500/10 bg-rose-500/5',
      indigo: 'text-indigo-500 border-indigo-500/10 bg-indigo-500/5',
      teal: 'text-teal-600 border-teal-500/10 bg-teal-500/5',
    };

    return (
      <div
        className={`p-6 rounded-[2.5rem] border backdrop-blur-sm space-y-5 transition-all duration-300 hover:bg-white dark:hover:bg-white/5 ${colors[color]}`}
      >
        <div className="flex items-center justify-center gap-2 opacity-50">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-center">{label}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative group/input">
            <input
              type="time"
              value={start}
              onChange={(e) => onStartChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl py-3 px-2 text-xs font-bold text-center outline-none focus:ring-2 focus:ring-current/20"
            />
          </div>
          <span className="text-slate-300 font-bold opacity-30">/</span>
          <div className="flex-1 relative group/input">
            <input
              type="time"
              value={end}
              onChange={(e) => onEndChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl py-3 px-2 text-xs font-bold text-center outline-none focus:ring-2 focus:ring-current/20"
            />
          </div>
        </div>
      </div>
    );
  };

  const TimeField = ({ label, value, onChange, icon: Icon, color }: any) => {
    const colors: any = {
      emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600',
      orange: 'from-orange-500/20 to-orange-500/5 text-orange-600',
      indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-600',
    };
    const iconBase = colors[color].split(' ').pop();

    return (
      <div className="group space-y-4">
        <div className="flex items-center gap-3 ml-2 transition-all group-hover:translate-x-1">
          <div
            className={`p-1.5 rounded-lg bg-gradient-to-br ${colors[color]} border border-white/20 shadow-sm`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            {label}
          </label>
        </div>
        <div className="relative">
          <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-[1.8rem] py-5 px-8 text-lg font-bold text-slate-800 dark:text-white shadow-sm outline-none focus:border-indigo-500/50 focus:ring-8 focus:ring-indigo-500/5 transition-all cursor-pointer appearance-none"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/10 opacity-50">
            <ClockIcon className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    );
  };

  const renderTimetable = () => {
    const filtered = isTeacherView
      ? allSchedules.filter((s) => s.teacherName === (useAuthStore.getState().user?.displayName || ''))
      : allSchedules.filter((s) => s.class === selectedClass);
    const dayName = format(selectedDate, 'EEEE', { locale: id });

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-6 lg:p-8">
        {selectedClass || isTeacherView ? (
          <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header: Date Picker Row - perfectly aligned width */}
            <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850">
              <ScheduleDatePicker selectedDate={selectedDate} onSelect={setSelectedDate} />
            </div>

            {/* Body: Timeline slots */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">
                    {dayName}
                  </h3>
                  <p className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] mt-2">
                    Agenda {format(selectedDate, 'd MMMM yyyy', { locale: id })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                  <ClockIcon className="w-6 h-6" />
                </div>
              </div>

              {!isTeacherView && selectedClass && filtered.length === 0 && (
                <div className="p-3 mb-8 bg-amber-950/40 border border-amber-900/60 text-amber-400 text-sm rounded-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Data contoh diaktifkan otomatis karena jadwal di database untuk kelas ini masih
                  kosong.
                </div>
              )}

              <ScheduleTimeline
                schedules={filtered.filter((s) => s.day === dayName)}
                userRole={userRole}
                onSlotClick={handleSlotClick}
              />
            </div>
          </div>
        ) : (
          <div className="py-24 text-center opacity-30 flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-300">
              <RectangleStackIcon className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-400 tracking-wide">
                Silakan pilih rombel
              </h4>
              <p className="text-[10px] font-bold text-slate-300 mt-2">
                Gunakan menu dropdown di atas
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout
      title={view !== 'timetable' ? 'Jadwal' : ''}
      subtitle={
        view === 'loading'
          ? 'Memuat...'
          : view === 'dashboard'
            ? 'Arsitektur Modular'
            : view === 'session_config'
              ? 'Konfigurasi Sesi'
              : undefined
      }
      icon={view !== 'timetable' ? CalendarIcon : undefined}
      onBack={view === 'dashboard' || isStudent ? onBack : () => setView('dashboard')}
      withBottomNav={true}
      contentClassName={view === 'timetable' ? 'p-0' : undefined}
      customHeader={
        view === 'timetable' ? (
          <div className="flex-1 w-full pl-2">
            {!isStudent ? (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full max-w-[200px] bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled className="text-slate-500">
                  Pilih Kelas
                </option>
                {classes.map((c, i) => (
                  <option
                    key={`${c.id}-${i}`}
                    value={c.name}
                    className="text-slate-900 dark:text-white"
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl px-4 py-2.5 text-xs font-bold uppercase max-w-[200px] text-center border border-indigo-100 dark:border-indigo-800/50">
                {selectedClass || 'Jadwal Kelas'}
              </div>
            )}
          </div>
        ) : undefined
      }
    >
      <div
        className={`pb-32 max-w-5xl mx-auto w-full ${view === 'timetable' ? 'p-0' : 'p-5 lg:p-8'}`}
      >
        {view === 'loading' && (
          <div className="py-40 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Menyiapkan Jadwal...
            </p>
          </div>
        )}
        {view === 'dashboard' && renderDashboard()}
        {view === 'session_config' && renderSessionConfig()}
        {view === 'timetable' && renderTimetable()}

        {/* Modal Isi Jadwal */}
        {isSlotModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsSlotModalOpen(false)}
            ></div>
            <div className="relative bg-white dark:bg-[#020617] w-full max-w-sm rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>

              <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight mb-2 pr-10">
                Kunci jadwal
              </h3>
              <div className="flex flex-col gap-1 mb-6 text-xs font-bold text-slate-500">
                <div>
                  Kelas: <span className="text-indigo-500">{selectedClass}</span>
                </div>
                <div>
                  Waktu:{' '}
                  <span className="text-slate-800 dark:text-slate-300">
                    {format(selectedDate, 'EEEE', { locale: id })} • {selectedSlot?.time}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 tracking-wide mb-2">
                    Mata pelajaran
                  </label>
                  <select
                    value={modalSubject}
                    onChange={(e) => setModalSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="">Pilih Mata Pelajaran...</option>
                    {subjectOptions.map((opt) => (
                      <option key={opt.id} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 tracking-wide mb-2">
                    Nama guru
                  </label>
                  <select
                    value={modalTeacher}
                    onChange={(e) => setModalTeacher(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="">Pilih Guru...</option>
                    {teacherOptions.map((opt) => (
                      <option key={opt.id} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSaveSlot}
                  disabled={saving || !modalSubject.trim() || !modalTeacher.trim()}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold tracking-wide py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/30"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="font-bold text-lg">✓</div>
                  )}
                  <span>Simpan & kunci jadwal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const MenuTile = ({ title, desc, icon: Icon, color, onClick }: any) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  };
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-[#151E32] p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-left flex items-center gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${colors[color]}`}
      >
        <Icon className="w-7 h-7" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-tight leading-none mb-1.5">
          {title}
        </h4>
        <p className="text-[9px] font-bold text-slate-400 truncate tracking-wider">{desc}</p>
      </div>
      <ArrowRightIcon className="w-4 h-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
    </button>
  );
};

export default Schedule;
