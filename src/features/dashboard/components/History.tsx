/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/layouts/Layout';
import {
  ClockIcon,
  PlusIcon,
  XCircleIcon,
  TrashIcon,
  Squares2x2Icon,
  Search,
  CheckCircleIcon,
  ArrowRightIcon,
  // Ikon Fitur yang bisa dipilih
  CalendarIcon,
  MegaphoneIcon,
  BuildingLibraryIcon,
  CameraIcon,
  ShieldCheckIcon,
  UserIcon,
  EnvelopeIcon,
  ChartBarIcon,
  IdentificationIcon,
  BookOpenIcon,
} from '@/shared/Icons';
import { ViewState, UserRole, ROLE_GROUPS } from '@/types';
import { toast } from 'sonner';

interface ShortcutMenu {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  view: ViewState;
  color: string;
  bg: string;
  roles?: UserRole[];
}

const History: React.FC<{
  onBack: () => void;
  onNavigate: (v: ViewState) => void;
  userRole: UserRole;
}> = ({ onBack, onNavigate, userRole }) => {
  const ALL_AVAILABLE_MENUS: ShortcutMenu[] = [
    {
      id: 'jadwal',
      label: 'Jadwal Mingguan',
      description: 'Cek jadwal KBM per rombel',
      icon: CalendarIcon,
      view: ViewState.SCHEDULE,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/30',
    },
    {
      id: 'berita',
      label: 'Berita Sekolah',
      description: 'Informasi dan pengumuman terbaru',
      icon: MegaphoneIcon,
      view: ViewState.NEWS,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    },
    {
      id: 'madrasah',
      label: 'Profil Madrasah',
      description: 'Identitas dan legalitas digital',
      icon: BuildingLibraryIcon,
      view: ViewState.MADRASAH_INFO,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      id: 'scanner',
      label: 'Lensa Presensi',
      description: 'Scan QR untuk absensi harian',
      icon: CameraIcon,
      view: ViewState.SCANNER,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-900/30',
      roles: ROLE_GROUPS.ALL_GTK,
    },
    {
      id: 'poin',
      label: 'Kedisiplinan',
      description: 'Database poin sikap siswa',
      icon: ShieldCheckIcon,
      view: ViewState.POINTS,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-900/30',
    },
    {
      id: 'idcard',
      label: 'ID Card Digital',
      description: 'Kartu pelajar berbasis sistem',
      icon: IdentificationIcon,
      view: ViewState.ID_CARD,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
    },
    {
      id: 'surat',
      label: 'Layanan PTSP',
      description: 'Pengajuan surat administrasi',
      icon: EnvelopeIcon,
      view: ViewState.LETTERS,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-900/30',
    },
    {
      id: 'profil',
      label: 'Profil Saya',
      description: 'Atur identitas dan keamanan',
      icon: UserIcon,
      view: ViewState.PROFILE,
      color: 'text-slate-600',
      bg: 'bg-slate-50 dark:bg-slate-800',
    },
    {
      id: 'laporan',
      label: 'Cetak Database',
      description: 'Export laporan harian/bulanan',
      icon: ChartBarIcon,
      view: ViewState.REPORTS,
      color: 'text-indigo-700',
      bg: 'bg-indigo-100 dark:bg-indigo-900/40',
      roles: [UserRole.ADMIN, UserRole.DEVELOPER],
    },
    {
      id: 'jurnal',
      label: 'Jurnal Guru',
      description: 'Log materi KBM harian',
      icon: BookOpenIcon,
      view: ViewState.JOURNAL,
      color: 'text-pink-600',
      bg: 'bg-pink-50 dark:bg-pink-900/30',
    },
  ];
  const [pinnedMenus, setPinnedMenus] = useState<ShortcutMenu[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Muat menu dari localStorage saat mount
  useEffect(() => {
    const saved = localStorage.getItem('emam_pinned_menus');
    if (saved) {
      try {
        const ids = JSON.parse(saved) as string[];
        const mapped = ids
          .map((id) => ALL_AVAILABLE_MENUS.find((m) => m.id === id))
          .filter(Boolean) as ShortcutMenu[];
        setPinnedMenus(mapped);
      } catch (e) {
        console.error('Gagal memuat menu favorit');
      }
    }
  }, []);

  const saveToStorage = (menus: ShortcutMenu[]) => {
    const ids = menus.map((m) => m.id);
    localStorage.setItem('emam_pinned_menus', JSON.stringify(ids));
  };

  const handleTogglePin = (menu: ShortcutMenu) => {
    const isPinned = pinnedMenus.find((m) => m.id === menu.id);
    let nextMenus = [];
    if (isPinned) {
      nextMenus = pinnedMenus.filter((m) => m.id !== menu.id);
      toast.info(`${menu.label} dihapus dari Akademik.`);
    } else {
      nextMenus = [...pinnedMenus, menu];
      toast.success(`${menu.label} disematkan ke Akademik.`);
    }
    setPinnedMenus(nextMenus);
    saveToStorage(nextMenus);
  };

  const filteredChoices = useMemo(() => {
    return ALL_AVAILABLE_MENUS.filter(
      (m) =>
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!m.roles || m.roles.includes(userRole)),
    );
  }, [searchQuery, userRole]);

  return (
    <Layout
      title="Akademik"
      subtitle="Daftar menu akademik"
      icon={ClockIcon}
      onBack={onBack}
      actions={
        <button
          onClick={() => setIsSelectorOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold shadow-lg active:scale-90 transition-all flex items-center gap-2 border border-white/10 capitalize"
        >
          <PlusIcon className="w-4 h-4" /> Kelola
        </button>
      }
    >
      <div className="p-5 lg:p-10 pb-40 space-y-8 animate-in fade-in duration-500">
        {/* --- DAFTAR MENU TERSEMAT (LIST VIEW) --- */}
        {pinnedMenus.length > 0 ? (
          <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
            {pinnedMenus.map((menu) => (
              <div
                key={menu.id}
                onClick={() => onNavigate(menu.view)}
                className="group relative w-full flex items-center gap-4 p-4 bg-white dark:bg-[#151E32] rounded-[1.8rem] border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all cursor-pointer overflow-hidden"
              >
                {/* Background Decoration */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none -translate-y-1/2 translate-x-1/2 ${menu.bg} rounded-full blur-2xl`}
                ></div>

                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${menu.bg} ${menu.color} group-hover:scale-110 transition-transform`}
                >
                  <menu.icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-none block">
                    {menu.label}
                  </span>
                  <p className="text-[10px] font-medium text-slate-400 mt-1.5 truncate opacity-80 group-hover:opacity-100 transition-opacity">
                    {menu.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 pl-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin(menu);
                    }}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                    title="Hapus dari Akademik"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <ArrowRightIcon className="w-4 h-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- EMPTY STATE --- */
          <div className="py-24 text-center bg-white dark:bg-[#151E32] rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center gap-6 shadow-inner">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-300">
              <Squares2x2Icon className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white capitalize">
                Daftar masih kosong
              </h4>
              <p className="text-[11px] font-medium text-slate-400 mt-2 max-w-[200px] mx-auto leading-relaxed capitalize">
                Klik tombol "Kelola" di bagian atas untuk memilih fitur yang ingin ditampilkan.
              </p>
            </div>
          </div>
        )}

        {/* --- SELECTOR MODAL --- */}
        {isSelectorOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#0B1121] w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1121] z-10 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight leading-none">
                    Konfigurasi Akademik
                  </h3>
                  <p className="text-[10px] font-medium text-indigo-500 mt-2">
                    Pilih menu untuk disematkan
                  </p>
                </div>
                <button
                  onClick={() => setIsSelectorOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <XCircleIcon className="w-7 h-7" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 shrink-0">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600" />
                  <input
                    type="text"
                    placeholder="Cari nama menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-[#151E32] border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                {filteredChoices.map((menu) => {
                  const isPinned = pinnedMenus.some((m) => m.id === menu.id);
                  return (
                    <button
                      key={menu.id}
                      onClick={() => handleTogglePin(menu)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isPinned
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-sm'
                          : 'bg-white dark:bg-[#151E32] border-slate-100 dark:border-slate-800 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${menu.bg} ${menu.color}`}
                        >
                          <menu.icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <span
                            className={`text-[12px] font-bold tracking-tight block ${isPinned ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
                          >
                            {menu.label}
                          </span>
                          <span className="text-[9px] font-medium text-slate-400 block mt-0.5">
                            {menu.id}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                          isPinned
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-200'
                        }`}
                      >
                        {isPinned && <CheckCircleIcon className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1121] shrink-0">
                <button
                  onClick={() => setIsSelectorOpen(false)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-bold shadow-xl active:scale-95 transition-all"
                >
                  Selesai Mengatur
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default History;
