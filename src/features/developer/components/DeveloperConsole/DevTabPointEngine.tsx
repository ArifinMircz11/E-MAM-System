import React, { useState, useRef, useEffect } from 'react';
import { CommandLineIcon, ChevronDownIcon, CheckCircleIcon } from '@/shared/Icons';
import { DevActionButton } from './DevActionButton';

import { useDevConsoleContext } from '../../context/DeveloperContext';

interface DevTabPointEngineProps {
  handleGenerateRandomPoints?: () => Promise<void>;
  classes?: any[];
  dummyClass?: string;
  setDummyClass?: (val: string) => void;
  simSelectedRombels?: string[];
  setSimSelectedRombels?: (val: string[]) => void;
}

export const DevTabPointEngine: React.FC<DevTabPointEngineProps> = (props) => {
  const dev = useDevConsoleContext();

  const handleGenerateRandomPoints = props.handleGenerateRandomPoints ?? dev?.handleGenerateRandomPoints ?? (async () => {});
  const classes = props.classes ?? dev?.classes ?? [];
  const dummyClass = props.dummyClass ?? dev?.dummyClass ?? '10 A';
  const setDummyClass = props.setDummyClass ?? dev?.setDummyClass ?? (() => {});
  const simSelectedRombels = props.simSelectedRombels ?? dev?.simSelectedRombels ?? [];
  const setSimSelectedRombels = props.setSimSelectedRombels ?? dev?.setSimSelectedRombels ?? (() => {});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleClass = (classId: string) => {
    if (simSelectedRombels?.includes(classId)) {
      setSimSelectedRombels(simSelectedRombels.filter((c) => c !== classId));
    } else {
      setSimSelectedRombels([...(simSelectedRombels || []), classId]);
    }
  };

  const toggleAll = () => {
    if (simSelectedRombels?.length === classes?.length && classes?.length > 0) {
      setSimSelectedRombels([]);
    } else {
      setSimSelectedRombels(classes?.map((c) => c.classId || c.id) || []);
    }
  };

  const isAllSelected = classes?.length > 0 && simSelectedRombels?.length === classes?.length;

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full pb-32 custom-scrollbar space-y-6">
      <div className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl max-w-3xl space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <CommandLineIcon className="w-5 h-5 text-orange-500 animate-pulse" /> Omni-Guard Point
            Engine Rules V8.0
          </h3>
          <p className="text-[10px] font-bold text-slate-500 mt-1">
            Mengaktifkan point-penalty metric system untuk akumulasi otomatis poin BK siswa
            berdasarkan keterlambatan, dispensasi, sakit & haid.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Point Engine Status (Omni-Guard)
                </p>
                <p className="text-[8.5px] font-bold text-slate-400">
                  Verifikator otomatis kedisiplinan BK terintegrasi.
                </p>
              </div>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-bold">
                ENABLED
              </span>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
              <h4 className="text-[9px] font-bold uppercase text-indigo-500 tracking-wider">
                Metrik Aturan Pengurangan Poin default
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-[#0B1121] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">
                    Alpha (Tanpa Keterangan)
                  </p>
                  <p className="text-sm font-bold text-rose-500 mt-1">+10 Poin</p>
                </div>
                <div className="bg-white dark:bg-[#0B1121] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">
                    Late (Terlambat) / Izin
                  </p>
                  <p className="text-sm font-bold text-amber-500 mt-1">+5 Poin</p>
                </div>
                <div className="bg-white dark:bg-[#0B1121] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">
                    Sakit / Istirahat Haid
                  </p>
                  <p className="text-sm font-bold text-teal-500 mt-1">0 Poin</p>
                </div>
              </div>
            </div>

            <div
              className="space-y-2 pt-3 border-t border-slate-150 dark:border-slate-800"
              ref={dropdownRef}
            >
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Target Rombel Kelas
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-[10px] font-bold border border-slate-150 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer justify-between text-slate-700 dark:text-slate-200"
                >
                  <span className="truncate">
                    {!simSelectedRombels || simSelectedRombels.length === 0
                      ? 'Pilih Kelas'
                      : isAllSelected
                        ? 'Semua Kelas'
                        : `${simSelectedRombels.length} Kelas Dipilih`}
                  </span>
                  <ChevronDownIcon
                    className={`w-3 h-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full mt-1 left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      <div
                        className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-3 border-b border-slate-100 dark:border-slate-700"
                        onClick={toggleAll}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isAllSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}
                        >
                          {isAllSelected && <CheckCircleIcon className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          Pilih Semua Kelas
                        </span>
                      </div>
                      {classes.map((c) => {
                        const classIdentifier = c.classId || c.id;
                        const isSelected = simSelectedRombels?.includes(classIdentifier);
                        return (
                          <div
                            key={classIdentifier}
                            className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-3"
                            onClick={() => toggleClass(classIdentifier)}
                          >
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}
                            >
                              {isSelected && <CheckCircleIcon className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              {c.name || classIdentifier}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-150 dark:border-slate-800">
              <DevActionButton
                label="Simulasi & Inject Poin Acak (Randomizer)"
                variant="primary"
                onAction={handleGenerateRandomPoints}
              />
              <DevActionButton
                label="Lihat Daftar Siswa Kelas Terpilih"
                variant="warning"
                onAction={async () => {
                  if (!simSelectedRombels || simSelectedRombels.length === 0) {
                    alert('Silakan pilih kelas terlebih dahulu');
                    return;
                  }
                  const { useStudentStore, useUIStore } = await import('@/stores');
                  const { ViewState } = await import('@/types');
                  const selectedClassObj = classes.find(
                    (c) => (c.classId || c.id) === simSelectedRombels[0],
                  );
                  if (selectedClassObj) {
                    useStudentStore.getState().setSelectedClass(selectedClassObj);
                    useUIStore.getState().setCurrentView(ViewState.STUDENTS);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
