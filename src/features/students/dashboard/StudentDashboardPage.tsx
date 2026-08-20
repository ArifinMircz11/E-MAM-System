import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ViewState, UserRole } from '@/types';
import { useStudentDashboard } from './hooks/useStudentDashboard';
import { useUserStore } from '@/stores/userStore';
import { ProfileCard } from './components/ProfileCard';
import { AttendanceTodayCard } from './components/AttendanceTodayCard';
import { PointSummaryCard } from './components/PointSummaryCard';
import { ScheduleTodayCard } from './components/ScheduleTodayCard';
import { PermissionCard } from './components/PermissionCard';
import { LettersCard } from './components/LettersCard';
import { NotificationCard } from './components/NotificationCard';
import { QuickActionCard } from './components/QuickActionCard';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentDashboardPageProps {
  onNavigate: (view: ViewState) => void;
  onOpenSidebar?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  onNavigate,
  onOpenSidebar,
  isDarkMode,
  onToggleTheme,
}) => {
  const { data, isLoading, refresh } = useStudentDashboard();
  const roles = useUserStore((state) => state.roles);
  const isDev = roles.includes(UserRole.DEVELOPER);
  const referenceId = useUserStore((state) => state.referenceId);
  const carouselRef = useRef<HTMLDivElement>(null);

  const getProfileCompleteness = (student: any) => {
    if (!student) return { percentage: 0, checklist: [] };

    const check = (val: any) => {
      if (val === undefined || val === null) return false;
      const str = String(val).trim();
      return (
        str !== '' &&
        str !== '-' &&
        str.toLowerCase() !== 'wajib' &&
        str.toLowerCase() !== 'wajib diisi'
      );
    };

    const checklist = [
      { key: 'nik', label: 'NIK', isComplete: check(student.nik) },
      { key: 'nisn', label: 'NISN', isComplete: check(student.nisn) },
      { key: 'tempatLahir', label: 'Tempat Lahir', isComplete: check(student.tempatLahir) },
      { key: 'tanggalLahir', label: 'Tanggal Lahir', isComplete: check(student.tanggalLahir) },
      { key: 'jenisKelamin', label: 'Jenis Kelamin', isComplete: check(student.jenisKelamin) },
      { key: 'namaAyah', label: 'Nama Ayah', isComplete: check(student.namaAyah) },
      { key: 'namaIbu', label: 'Nama Ibu', isComplete: check(student.namaIbu) },
      { key: 'pekerjaanAyah', label: 'Pekerjaan Ayah', isComplete: check(student.pekerjaanAyah) },
      { key: 'pekerjaanIbu', label: 'Pekerjaan Ibu', isComplete: check(student.pekerjaanIbu) },
      {
        key: 'penghasilanOrtu',
        label: 'Penghasilan Orang Tua',
        isComplete: check(student.penghasilanOrtu),
      },
      { key: 'namaWali', label: 'Nama Wali', isComplete: check(student.kontakDanWali?.namaWali) },
      {
        key: 'nomorHpSiswa',
        label: 'No. HP Siswa',
        isComplete: check(student.kontakDanWali?.nomorHpSiswa),
      },
      {
        key: 'nomorHpWaliWhatsApp',
        label: 'WhatsApp Wali',
        isComplete: check(student.kontakDanWali?.nomorHpWaliWhatsApp),
      },
      {
        key: 'alamatRumah',
        label: 'Alamat Rumah',
        isComplete: check(student.kontakDanWali?.alamatRumah),
      },
    ];

    const filledCount = checklist.filter((item) => item.isComplete).length;
    const percentage = Math.round((filledCount / 14) * 100);

    return { percentage, checklist };
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 356; // 340px card + 16px gap
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const CarouselLoader = () => (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[340px] shrink-0 h-[215px] bg-slate-100 dark:bg-slate-900/50 rounded-[2.5rem] animate-pulse"
        />
      ))}
    </div>
  );

  const user = useUserStore((state) => state.user);
  const userPhoto = user?.profile?.photoURL || null;
  const userName = user?.profile?.displayName || 'Siswa';

  const displayNews =
    data.news && data.news.length > 0
      ? data.news
      : [
          {
            id: 'default-news-1',
            title: 'Penerapan Kartu Digital QR Presensi Terpadu',
            category: 'PENGUMUMAN',
            date: new Date().toISOString(),
            summary:
              'Madrasah kini secara resmi menerapkan sistem presensi modern berbasis scan QR Code kartu digital siswa untuk meningkatkan akurasi data kehadiran harian secara real-time.',
            isPublished: true,
          },
          {
            id: 'default-news-2',
            title: 'Layanan Konsultasi Cerdas e-Mam System Virtual Assistant',
            category: 'AKADEMIK',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            summary:
              'Siswa kini dapat memanfaatkan asisten virtual pintar e-Mam System (Konsultasi AI / Live Chat) untuk menanyakan rincian poin prestasi, pelanggaran, maupun riwayat kehadiran langsung melalui aplikasi.',
            isPublished: true,
          },
          {
            id: 'default-news-3',
            title: 'Persiapan Penilaian Akhir Semester Genap',
            category: 'INFORMASI',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            summary:
              'Menjelang akhir tahun ajaran, seluruh siswa diimbau untuk menjaga kedisiplinan tingkat kehadiran serta mempersiapkan perbaikan nilai akademik sebelum pekan ujian dimulai.',
            isPublished: true,
          },
        ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] transition-colors pb-32">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 pt-8 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              onClick={() => onNavigate(ViewState.PROFILE)}
              className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center p-0 overflow-hidden shadow-sm shrink-0 active:scale-95 transition-all ring-2 ring-white dark:ring-slate-800 cursor-pointer group"
            >
              {userPhoto ? (
                <img
                  src={userPhoto}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  alt="Profile"
                />
              ) : (
                <div className="text-white font-bold text-xl">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                Dashboard Siswa
              </h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-1">
                Selamat Datang, {userName.split(' ')[0]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm active:scale-95 transition-all text-slate-400 shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-white/5 shadow-sm shrink-0"
                title="Ganti Tema"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-500" />
                )}
              </button>
            )}

            <NotificationBell onNavigate={onNavigate} />
          </div>
        </div>

        {/* --- UNIFIED HORIZONTAL MONITORING & NEWS CAROUSEL --- */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              DOK MONITORING & BERITA UTAMA
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollCarousel('left')}
                className="p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5 shadow-sm active:scale-90 transition-all text-slate-400 dark:text-slate-500 hover:text-indigo-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5 shadow-sm active:scale-90 transition-all text-slate-400 dark:text-slate-500 hover:text-indigo-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative group/carousel">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth items-stretch"
            >
              {isLoading && !data.profile ? (
                <CarouselLoader />
              ) : (
                <>
                  {/* Card 1: Student Profile (Welcoming Banner) */}
                  <ProfileCard student={data.profile} />

                  {/* Card 2: Today's Attendance */}
                  <AttendanceTodayCard attendance={data.attendanceToday} />

                  {/* Card 2: Discipline Points */}
                  <PointSummaryCard
                    summary={data.pointSummary}
                    onClickHistory={() => onNavigate(ViewState.POINTS)}
                  />

                  {/* Card 3: Today's Schedule */}
                  <ScheduleTodayCard schedules={data.schedulesToday} />

                  {/* Card 4: Active Permission (Conditional) */}
                  {data.activePermission && (
                    <div className="w-[340px] shrink-0 snap-start h-[215px]">
                      <PermissionCard permission={data.activePermission} />
                    </div>
                  )}

                  {/* Card 5: Latest Letters */}
                  <LettersCard
                    letters={data.letters}
                    onClickAll={() => onNavigate(ViewState.LETTERS)}
                  />

                  {/* Embedded News Cards (Aligning side-by-side with telemetry inside carousel) */}
                  {displayNews.map((item, idx) => (
                    <motion.div
                      key={item.id || idx}
                      whileHover={{ y: -4, scale: 1.01 }}
                      onClick={() => onNavigate(ViewState.NEWS)}
                      className="w-[340px] shrink-0 snap-start h-[215px] bg-[#0F172A] border border-indigo-500/10 rounded-[2.5rem] p-5 flex flex-col justify-between relative overflow-hidden group shadow-xl cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                      <div className="flex items-center gap-2 shrink-0 mb-1">
                        <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 text-[8.5px] font-bold uppercase rounded tracking-wider border border-indigo-500/10">
                          {item.category}
                        </span>
                        <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 font-mono uppercase">
                          {format(parseISO(item.date), 'dd MMM yyyy', { locale: id })}
                        </p>
                      </div>

                      <div className="flex-1 flex flex-col justify-center py-2">
                        <h4 className="text-[12.5px] font-bold text-white uppercase tracking-tight line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                      </div>

                      <div className="text-[7.5px] font-bold text-indigo-400 uppercase tracking-wide shrink-0 mt-1 flex justify-between">
                        <span>Berita & Pengumuman</span>
                        <span>Klik untuk Semua ✓</span>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* --- PROFILE COMPLETION ENGINE (V8.5 Enterprise) FLOATING --- */}
        {data.profile &&
          (() => {
            const { percentage, checklist } = getProfileCompleteness(data.profile);

            if (percentage < 100) {
              return (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-40">
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-amber-500/20 dark:border-amber-500/30 rounded-3xl p-4 shadow-2xl flex flex-col md:flex-row gap-4 items-center justify-between"
                  >
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                            <AlertCircle className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              Status Profil Pendataan
                            </h4>
                            <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                              Profil Siswa <span className="text-amber-500">{percentage}%</span>{' '}
                              Lengkap
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                      <button
                        onClick={() => onNavigate(ViewState.PROFILE)}
                        className="w-full md:w-auto px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-bold uppercase tracking-wide rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <UserCheck className="w-4 h-4" />
                        Lengkapi Sekarang
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            }
            return null; // Don't show anything if perfect, keep it clean
          })()}

        {/* Bottom Grid: Quick Actions & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          <div className="lg:col-span-1">
            <QuickActionCard onNavigate={onNavigate} />
          </div>
          <div className="lg:col-span-2">
            <NotificationCard
              notifications={data.notif}
              onClickAll={() => onNavigate(ViewState.NOTIFICATIONS)}
            />
          </div>
        </div>

        {/* Version Footprint */}
        <div className="text-center pt-8 pb-4">
          <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">
            e-MAM System v8.0 • Academic Manager
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
