import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  SearchIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  FilterIcon,
  MessageCircleIcon,
} from 'lucide-react';

interface AttendancePanelProps {
  isOpen: boolean;
  onClose: () => void;
  stats: any;
  liveAttendance: any;
  onRemindParent?: (studentId: string) => void;
}

const AttendancePanel: React.FC<AttendancePanelProps> = ({
  isOpen,
  onClose,
  stats,
  liveAttendance,
  onRemindParent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'late' | 'none'>('all');

  const analyticalData = [
    {
      label: 'Hadir',
      value: stats.onTimeToday,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      desc: 'Siswa standby di lingkungan Madrasah',
    },
    {
      label: 'Terlambat',
      value: stats.lateToday,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      desc: 'Siswa masuk setelah batas toleransi',
    },
    {
      label: 'Izin/Sakit',
      value: stats.permittedToday,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      desc: 'Terdata secara resmi oleh wali kelas',
    },
    {
      label: 'Haid',
      value: stats.haidToday || 0,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      desc: 'Siswi hadir, berhalangan ibadah',
    },
    {
      label: 'Alpa',
      value: stats.absentToday || 0,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      desc: 'Prioritas: Belum ada keterangan',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-slate-950 border-l border-white/5 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white lowercase ">
                  Analytical View
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                  Supervisi Kehadiran Terpadu • Kamad View
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
              {/* 1. Summary Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {analyticalData.map((item, idx) => (
                  <div
                    key={idx}
                    className={`${item.bg} p-5 rounded-[2rem] border border-white/5 space-y-2 relative overflow-hidden group`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-12 h-12 ${item.color.replace('text', 'bg')}/10 rounded-full blur-xl`}
                    ></div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wide ${item.color}`}
                    >
                      {item.label}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{item.value}</span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase">Jiwa</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Quick Actions */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                  Tindakan Cepat
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    className="w-full p-4 bg-indigo-600 hover:bg-indigo-700 rounded-3xl flex items-center justify-between group transition-all"
                    onClick={() => {
                      /* Trigger WhatsApp Gateway */
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <MessageCircleIcon size={18} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">Ingatkan Orang Tua</p>
                        <p className="text-[9px] text-indigo-200 font-medium">
                          Kirim WA massal untuk absensi kosong
                        </p>
                      </div>
                    </div>
                    <ChevronRightIcon
                      size={16}
                      className="text-white/40 group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </div>

              {/* 3. Detailed List Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Daftar Aktif
                  </h3>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-slate-800 rounded-lg text-slate-400">
                      <FilterIcon size={12} />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                  <SearchIcon
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Cari nama siswa atau kelas..."
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Placeholder for List (Real data would be mapped here) */}
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-800/30 border border-white/5 rounded-3xl flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                          S{i}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Siswa Contoh {i}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase ">
                            Kelas XII IPA {i} • Scan 07:1{i}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-bold rounded-full uppercase tracking-wide">
                        Hadir
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-wide py-4 italic">
                    Data sinkronisasi per 2 menit
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <AlertCircleIcon size={16} className="text-indigo-400 shrink-0" />
                <p className="text-[9px] font-bold text-indigo-200 leading-tight">
                  Data di atas adalah ringkasan live. Untuk laporan resmi bulanan, silakan buka menu
                  Laporan Terpadu.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AttendancePanel;
