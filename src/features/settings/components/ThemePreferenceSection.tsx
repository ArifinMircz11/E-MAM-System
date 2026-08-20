import React, { useState } from 'react';
import { useUIStore, ColorTheme } from '@/stores/uiStore';
import { 
  Sparkles, 
  CheckCircle2, 
  Palette, 
  Eye, 
  UserCheck, 
  BarChart3, 
  Calendar 
} from 'lucide-react';
import { toast } from 'sonner';

export interface ThemeDefinition {
  id: ColorTheme;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  primaryHex: string;
  accentHex: string;
  gradientClass: string;
  bgLightClass: string;
  borderClass: string;
  previewColors: {
    headerGradient: string;
    primaryBtnBg: string;
    primaryBtnText: string;
    activeTabBg: string;
    activeTabText: string;
    badgeBg: string;
    badgeText: string;
    cardBorder: string;
    statValueColor: string;
    progressBarBg: string;
  };
}

export const THEME_OPTIONS: ThemeDefinition[] = [
  {
    id: 'classic-blue',
    name: 'Classic Blue',
    tagline: 'Elegan, Profesional & Bersih',
    badge: 'Default Madrasah',
    description: 'Nuansa biru safir klasik dengan tata letak bersih dan profesional untuk aktivitas staf harian.',
    primaryHex: '#2563eb',
    accentHex: '#3b82f6',
    gradientClass: 'from-blue-600 via-indigo-600 to-blue-700',
    bgLightClass: 'bg-blue-50/50 dark:bg-blue-950/20',
    borderClass: 'border-blue-200 dark:border-blue-800/40',
    previewColors: {
      headerGradient: 'from-blue-600 to-indigo-700',
      primaryBtnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
      primaryBtnText: 'text-white',
      activeTabBg: 'bg-blue-600 text-white shadow-md shadow-blue-500/20',
      activeTabText: 'text-white',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      badgeText: 'text-blue-700 dark:text-blue-300',
      cardBorder: 'border-blue-100 dark:border-blue-900/50',
      statValueColor: 'text-blue-600 dark:text-blue-400',
      progressBarBg: 'bg-blue-600',
    },
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    tagline: 'Segar, Alami & Menenangkan',
    badge: 'Kemenag Green',
    description: 'Nuansa hijau emerald khas madrasah yang tenang, segar, dan estetis untuk kenyamanan mata.',
    primaryHex: '#059669',
    accentHex: '#10b981',
    gradientClass: 'from-emerald-600 via-teal-600 to-emerald-700',
    bgLightClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    borderClass: 'border-emerald-200 dark:border-emerald-800/40',
    previewColors: {
      headerGradient: 'from-emerald-600 to-teal-700',
      primaryBtnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      primaryBtnText: 'text-white',
      activeTabBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
      activeTabText: 'text-white',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      cardBorder: 'border-emerald-100 dark:border-emerald-900/50',
      statValueColor: 'text-emerald-600 dark:text-emerald-400',
      progressBarBg: 'bg-emerald-600',
    },
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    tagline: 'Futuristik, Sleek & Modern',
    badge: 'Ultra High-Contrast',
    description: 'Nuansa slate dan indigo futuristik kontras tinggi yang eksklusif untuk staf modern.',
    primaryHex: '#334155',
    accentHex: '#6366f1',
    gradientClass: 'from-slate-800 via-indigo-900 to-slate-900',
    bgLightClass: 'bg-slate-100/60 dark:bg-slate-900/40',
    borderClass: 'border-slate-300 dark:border-slate-700',
    previewColors: {
      headerGradient: 'from-slate-800 to-indigo-900',
      primaryBtnBg: 'bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 text-white',
      primaryBtnText: 'text-white',
      activeTabBg: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
      activeTabText: 'text-white',
      badgeBg: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      badgeText: 'text-indigo-700 dark:text-indigo-300',
      cardBorder: 'border-slate-200 dark:border-slate-800',
      statValueColor: 'text-indigo-600 dark:text-indigo-400',
      progressBarBg: 'bg-indigo-600',
    },
  },
];

export const ThemePreferenceSection: React.FC = () => {
  const colorTheme = useUIStore((state) => state.colorTheme);
  const setColorTheme = useUIStore((state) => state.setColorTheme);
  const [hoveredTheme, setHoveredTheme] = useState<ColorTheme | null>(null);

  const activePreviewTheme = THEME_OPTIONS.find((t) => t.id === (hoveredTheme || colorTheme)) || THEME_OPTIONS[0];
  const isPreviewingHover = hoveredTheme !== null && hoveredTheme !== colorTheme;

  const handleSelectTheme = (theme: ThemeDefinition) => {
    setColorTheme(theme.id);
    toast.success(`Tema ${theme.name} berhasil diterapkan!`, {
      description: theme.tagline,
      icon: <Palette className="w-5 h-5 text-indigo-500" />,
    });
  };

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between ml-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Tema & Tampilan Utama
          </h3>
        </div>
        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
          Personalisasi UI
        </span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-5 lg:p-6 shadow-sm space-y-6">
        {/* Interactive Live Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              Pratinjau Langsung (Live Preview)
            </span>
            {isPreviewingHover ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60 animate-pulse">
                <Sparkles className="w-3 h-3" />
                Hovering: {activePreviewTheme.name}
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-400">
                Arahkan kursor ke opsi tema di bawah untuk live preview
              </span>
            )}
          </div>

          {/* Mini Mockup UI Container */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 shadow-inner transition-all duration-300">
            {/* Header Mockup */}
            <div className={`p-3 rounded-xl bg-gradient-to-r ${activePreviewTheme.previewColors.headerGradient} text-white shadow-md flex items-center justify-between transition-all duration-300`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xs">
                  M
                </div>
                <div>
                  <h4 className="text-xs font-extrabold tracking-tight">e-MAM System</h4>
                  <p className="text-[9px] text-white/80 font-medium">Madrasah Digital Ecosystem</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Staf Active
                </span>
                <div className="w-6 h-6 rounded-full bg-white/30 border border-white/40 flex items-center justify-center text-[10px] font-bold">
                  TU
                </div>
              </div>
            </div>

            {/* Navigation Tabs Mockup */}
            <div className="flex items-center gap-1.5 mt-3 px-1 overflow-x-auto">
              <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all duration-300 ${activePreviewTheme.previewColors.activeTabBg}`}>
                <BarChart3 className="w-3 h-3" />
                Dashboard
              </div>
              <div className="px-3 py-1.5 rounded-xl text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Presensi
              </div>
              <div className="px-3 py-1.5 rounded-xl text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Jadwal
              </div>
            </div>

            {/* Body Content Mockup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {/* Presensi Summary Card */}
              <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 border ${activePreviewTheme.previewColors.cardBorder} shadow-sm space-y-2 transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                    Presensi Siswa Hari Ini
                  </span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${activePreviewTheme.previewColors.badgeBg}`}>
                    98.5% Hadir
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-black tracking-tight ${activePreviewTheme.previewColors.statValueColor}`}>
                    432
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    / 440 Siswa
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${activePreviewTheme.previewColors.progressBarBg}`}
                    style={{ width: '98%' }}
                  />
                </div>
              </div>

              {/* Quick Control Card */}
              <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 border ${activePreviewTheme.previewColors.cardBorder} shadow-sm flex flex-col justify-between space-y-2 transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    Aksi Cepat Staf
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                  Tampilan tombol dan elemen interaktif disesuaikan dengan skema warna pilihan.
                </p>
                <button
                  type="button"
                  className={`w-full py-1.5 px-3 rounded-xl text-[10px] font-extrabold shadow-sm flex items-center justify-center gap-1 transition-all duration-300 ${activePreviewTheme.previewColors.primaryBtnBg}`}
                >
                  <Sparkles className="w-3 h-3" />
                  + Catat Presensi Kelas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Options Grid */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1">
            Pilihan Tema Warna (3 Varian Khusus)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = colorTheme === theme.id;
              const isHovered = hoveredTheme === theme.id;

              return (
                <div
                  key={theme.id}
                  onMouseEnter={() => setHoveredTheme(theme.id)}
                  onMouseLeave={() => setHoveredTheme(null)}
                  onClick={() => handleSelectTheme(theme)}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? `${theme.bgLightClass} ${theme.borderClass} ring-4 ring-indigo-500/10 shadow-md`
                      : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                  }`}
                >
                  {/* Selected Indicator Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Color Palette Dots */}
                      <div className="flex items-center -space-x-1">
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-sm inline-block"
                          style={{ backgroundColor: theme.primaryHex }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-sm inline-block"
                          style={{ backgroundColor: theme.accentHex }}
                        />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {theme.badge}
                      </span>
                    </div>

                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Aktif
                      </span>
                    ) : isHovered ? (
                      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                        Previewing
                      </span>
                    ) : null}
                  </div>

                  {/* Theme Info */}
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {theme.name}
                    </h4>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {theme.tagline}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
                      {theme.description}
                    </p>
                  </div>

                  {/* Visual Color Gradient Strip */}
                  <div className="pt-2">
                    <div className={`h-2.5 w-full rounded-full bg-gradient-to-r ${theme.gradientClass} shadow-inner`} />
                  </div>

                  {/* Select Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTheme(theme);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-[10px] font-extrabold transition-all ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Tema Terpasang' : 'Pilih Tema Ini'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
