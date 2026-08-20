/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin (Lead Developer & System Architect)
 * NIP: 19901004 202521 1012
 * Role: Fullstack & UI/UX Engineer
 * Copyright (c) 2025 MAN 1 Hulu Sungai Tengah. All rights reserved.
 */

import { useState, useEffect } from 'react';
import type { ViewState, AboutContent, FAQItemData } from '@/types';
import { UserRole } from '@/types';
import {
  EmamLogo,
  MapPinIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  SparklesIcon,
  InfoIcon,
  CommandLineIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  ClockIcon,
  HeartIcon,
  BanknotesIcon,
  Loader2,
  PencilIcon,
  SaveIcon,
} from '@/shared/Icons';
import { useAboutContent } from '@/hooks/useAboutContent';

interface AboutProps {
  onBack: () => void;
  userRole: UserRole;
  onNavigate: (v: ViewState) => void;
  onOpenSidebar?: () => void;
}

// Icon Map for dynamic icons from Firestore
const iconMap: Record<string, any> = {
  BanknotesIcon: BanknotesIcon,
  GlobeAltIcon: GlobeAltIcon,
  ShieldCheckIcon: ShieldCheckIcon,
  HeartIcon: HeartIcon,
  ClockIcon: ClockIcon,
  SparklesIcon: SparklesIcon,
};

const FAQItem: React.FC<FAQItemData> = ({ question, answer, iconName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = iconMap[iconName] || InfoIcon;

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-all shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight  tracking-tight">
            {question}
          </span>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-5 pt-0 animate-in fade-in slide-in-from-top-2">
          <div className="pl-12 pr-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium border-l-2 border-indigo-100 dark:border-indigo-900/50 pl-4">
              {answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const About: React.FC<AboutProps> = ({ onBack, userRole, onNavigate, onOpenSidebar }) => {
  const [isEditing, setIsEditing] = useState(false);
  const isDeveloper = userRole === UserRole.DEVELOPER || userRole === UserRole.ADMIN;
  const { content, isLoading, isSaving, saveContent, setContent } = useAboutContent();

  const [localContent, setLocalContent] = useState<AboutContent & { devRole?: string }>({
    engineVersion: '8.0.0-stable',
    brandingText:
      'Ekosistem digital madrasah terintegrasi yang menjembatani teknologi, transparansi, dan inklusivitas pendidikan di MAN 1 Hulu Sungai Tengah.',
    devName: 'AKHMAD ARIFIN',
    devNip: '19901004 202521 1012',
    devRole: 'Penata Layanan Operasional',
    devQuote:
      'Menghadirkan solusi teknologi yang memberikan dampak nyata bagi efisiensi layanan operasional pendidikan dan masyarakat.',
    faqs: [
      {
        iconName: 'BanknotesIcon',
        question: 'Digitalisasi Operasional Terpadu',
        answer:
          'e-Mam v8.0 mengintegrasikan seluruh alur kerja akademik, keuangan, dan kesiswaan secara seamless, mengurangi birokrasi dan fokus pada kualitas pendidikan.',
      },
      {
        iconName: 'GlobeAltIcon',
        question: 'Skalabilitas & Ketahanan Sistem',
        answer:
          'Arsitektur cloud-native yang fleksibel menjamin layanan selalu tersedia (Uptime 99.9%) dan siap dikembangkan sesuai pertumbuhan Madrasah di era 5.0.',
      },
      {
        iconName: 'ShieldCheckIcon',
        question: 'Integritas Data Berbasis Audit Log',
        answer:
          'Setiap transaksi data dicatat secara permanen untuk menjamin transparansi dan akuntabilitas pengelolaan akademik madrasah yang profesional.',
      },
    ],
  });

  useEffect(() => {
    if (content) {
      setLocalContent((prev) => ({ ...prev, ...content }));
    }
  }, [content]);

  const handleSave = async () => {
    const success = await saveContent(localContent);
    if (success) setIsEditing(false);
  };

  const devPhoto = 'https://lh3.googleusercontent.com/d/1N61n6BzZXDnRCGA3BcmTpFYS0MYh6o4E';

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] transition-colors">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 pt-8 flex items-center gap-4 z-10 sticky top-0 border-b border-slate-100 dark:border-white/5">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 active:scale-90 transition-all font-bold"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-tight">
            Informasi Sistem <InfoIcon className="w-4 h-4 text-indigo-500" />
          </h2>
          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-none mt-0.5">
            V8.0 Architecture
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 lg:p-8 pb-32 custom-scrollbar space-y-8">
        {isEditing ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-8 shadow-lg space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                Nama Developer
              </label>
              <input
                type="text"
                value={localContent.devName}
                onChange={(e) => setLocalContent({ ...localContent, devName: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                NIP Developer
              </label>
              <input
                type="text"
                value={localContent.devNip}
                onChange={(e) => setLocalContent({ ...localContent, devNip: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                Role Developer
              </label>
              <input
                type="text"
                value={localContent.devRole}
                onChange={(e) => setLocalContent({ ...localContent, devRole: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                Quote Developer
              </label>
              <textarea
                rows={2}
                value={localContent.devQuote}
                onChange={(e) => setLocalContent({ ...localContent, devQuote: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                Engine Version
              </label>
              <input
                type="text"
                value={localContent.engineVersion}
                onChange={(e) =>
                  setLocalContent({ ...localContent, engineVersion: e.target.value })
                }
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                Branding Text
              </label>
              <textarea
                rows={3}
                value={localContent.brandingText}
                onChange={(e) => setLocalContent({ ...localContent, brandingText: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-medium"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-wide flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SaveIcon className="w-4 h-4" />
                )}{' '}
                Simpan
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-[10px] uppercase tracking-wide"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700 space-y-8">
            {isDeveloper && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm rounded-[1.5rem] flex items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wide hover:border-indigo-500 transition-all active:scale-[0.98]"
              >
                <PencilIcon className="w-4 h-4" /> Edit Konten Edukasi
              </button>
            )}
            {/* Main Branding Card */}
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-white/5 p-10 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>

              <div className="flex justify-center mb-8">
                <div className="w-36 h-36 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-700">
                  <EmamLogo className="w-full h-full" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-tight">
                e-Mam System
              </h1>
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-6">
                Integrated Madrasah Academic Manager
              </p>

              <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed max-w-sm mx-auto mb-8 font-medium">
                {localContent.brandingText}
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <span className="px-5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide border border-slate-100 dark:border-white/5">
                  Engine v{localContent.engineVersion}
                </span>
                <span className="px-5 py-2.5 rounded-2xl bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 border border-indigo-500/10">
                  <SparklesIcon className="w-4 h-4" /> AI Powered
                </span>
              </div>
            </div>

            {/* Developer Info Card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
                  Arsitek Sistem
                </h3>
                <div className="px-3 py-1 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-[8px] font-bold text-white uppercase tracking-wide shadow-lg shadow-indigo-500/25">
                  Core Contributor
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group/dev">
                <div className="p-8 flex items-center gap-6 border-b border-slate-50 dark:border-white/5 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-white/5">
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 dark:bg-slate-800 overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 shrink-0 group-hover/dev:scale-110 transition-transform duration-700">
                    <img
                      src={devPhoto}
                      className="w-full h-full object-cover"
                      alt={localContent.devName}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-xl leading-tight truncate">
                      {localContent.devName}
                    </h4>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wide mt-2 flex items-center gap-2">
                      <ShieldCheckIcon className="w-4 h-4" />
                      {localContent.devRole}
                    </p>
                  </div>
                </div>
                <div className="p-8 bg-slate-50/40 dark:bg-white/[0.02]">
                  <div className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5 shrink-0">
                      <CommandLineIcon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1 mb-4">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                          Nomor Induk Pegawai
                        </span>
                        <p className="text-[13px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase">
                          {localContent.devNip}
                        </p>
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold italic border-l-4 border-indigo-200 dark:border-indigo-500/20 pl-6 py-1">
                        "{localContent.devQuote}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-indigo-500" /> Nilai Tambah & Inovasi
                Layanan
              </h3>
              <div className="space-y-4">
                {localContent.faqs.map((faq, idx) => (
                  <FAQItem
                    key={idx}
                    iconName={faq.iconName}
                    question={faq.question}
                    answer={faq.answer}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instansi Info */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 space-y-8 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-500/5 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-500/10">
              <MapPinIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Lokasi Kampus Utama
              </h4>
              <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-1.5 font-bold leading-relaxed">
                Jl. H. Damanhuri No. 12, Barabai, <br />
                Hulu Sungai Tengah, Kalsel, 71311
              </p>
            </div>
          </div>

          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-500/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/10">
              <GlobeAltIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Informasi Publik & Kontak
              </h4>
              <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-1.5 font-bold uppercase tracking-tight">
                www.example.com <br />
                info@example.com
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pb-20 pt-8 opacity-40">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 leading-relaxed">
            © {localContent.devName} I {localContent.devNip}
          </p>
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            &copy; 2025 MAN 1 Hulu Sungai Tengah. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
