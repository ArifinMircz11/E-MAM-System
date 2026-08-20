import React from 'react';
import { XCircleIcon, SparklesIcon } from '@/shared/Icons';

interface PointEngineModalProps {
  report: any[];
  date: string;
  onClose: () => void;
}

export const PointEngineModal: React.FC<PointEngineModalProps> = ({ report, date, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <div className="bg-slate-950/40 w-full max-w-6xl rounded-[3rem] shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-indigo-400 animate-pulse" />
              e-Mam v8.0 Point Engine
              <span className="text-[10px] bg-indigo-600 px-2 py-0.5 rounded-md ml-2 border border-indigo-400/30">
                OMNI-GUARD ACTIVE
              </span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
              Validated Dataset Output: {date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/10"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-slate-950/20">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4 text-center">Masuk</th>
                <th className="px-6 py-4 text-center">Duha</th>
                <th className="px-6 py-4 text-center">Zuhur</th>
                <th className="px-6 py-4 text-center">Ashar</th>
                <th className="px-6 py-4 text-center">Pulang</th>
                <th className="px-6 py-4 text-right">Poin Hari Ini</th>
              </tr>
            </thead>
            <tbody className="space-y-4">
              {report.map((item, idx) => (
                <tr
                  key={idx}
                  className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all"
                >
                  <td className="px-6 py-4 rounded-l-3xl">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[10px] ${item.flagHaid ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}
                      >
                        {item.nama.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white tracking-tight">{item.nama}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">{item.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full ${item.status === 'Alpha' ? 'text-rose-400 bg-rose-500/10' : item.status === 'Terlambat' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}
                    >
                      {item.masuk || (item.status === 'Alpha' ? 'ALPHA' : '-')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-[10px] font-bold ${item.duha === 'Haid' ? 'text-rose-400' : item.duha === '' ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-300'}`}
                    >
                      {item.duha || 'TS'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-[10px] font-bold ${item.zuhur === 'Haid' ? 'text-rose-400' : item.zuhur === '' ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-300'}`}
                    >
                      {item.zuhur || 'TS'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-[10px] font-bold ${item.ashar === 'Haid' ? 'text-rose-400' : item.ashar === '' ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-300'}`}
                    >
                      {item.ashar || 'TS'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">
                    {item.pulang || '-'}
                  </td>
                  <td className="px-6 py-4 text-right rounded-r-3xl">
                    <div
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl border ${item.points === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}
                    >
                      <span className="text-xs font-bold">{item.points}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wide">PTS</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t border-white/5 bg-white/5 backdrop-blur-md flex justify-end">
          <button
            onClick={onClose}
            className="px-10 py-4 bg-white text-slate-950 rounded-2xl text-xs font-bold uppercase tracking-wide shadow-xl active:scale-95 transition-all"
          >
            Tutup Laporan
          </button>
        </div>
      </div>
    </div>
  );
};
