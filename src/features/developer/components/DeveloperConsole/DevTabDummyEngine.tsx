import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, ChevronDownIcon, CheckCircleIcon } from '@/shared/Icons';
import { DevActionButton } from './DevActionButton';

import { useDevConsoleContext } from '../../context/DeveloperContext';

interface DevTabDummyEngineProps {
  dummyClass?: string;
  setDummyClass?: (val: string) => void;
  simSelectedRombels?: string[];
  setSimSelectedRombels?: (val: string[]) => void;
  classes?: any[];
  dummyDate?: string;
  setDummyDate?: (val: string) => void;
  dummyDateEnd?: string;
  setDummyDateEnd?: (val: string) => void;
  handleGenerateDummyStudents?: () => Promise<void>;
  isGeneratingDummy?: boolean;
  handleGenerateDummyTeacherAttendance?: () => Promise<void>;
  generateDummyChats?: () => Promise<void>;
  generateDummyComplaints?: () => Promise<void>;
  handleGenerateRandomAttendance?: () => Promise<void>;
  handleDeleteDummyAttendance?: () => Promise<void>;
}

export const DevTabDummyEngine: React.FC<DevTabDummyEngineProps> = (props) => {
  const dev = useDevConsoleContext();

  const dummyClass = props.dummyClass ?? dev?.dummyClass ?? '10 A';
  const setDummyClass = props.setDummyClass ?? dev?.setDummyClass ?? (() => {});
  const simSelectedRombels = props.simSelectedRombels ?? dev?.simSelectedRombels ?? [];
  const setSimSelectedRombels = props.setSimSelectedRombels ?? dev?.setSimSelectedRombels ?? (() => {});
  const classes = props.classes ?? dev?.classes ?? [];
  const dummyDate = props.dummyDate ?? dev?.dummyDate ?? '';
  const setDummyDate = props.setDummyDate ?? dev?.setDummyDate ?? (() => {});
  const dummyDateEnd = props.dummyDateEnd ?? dev?.dummyDateEnd ?? '';
  const setDummyDateEnd = props.setDummyDateEnd ?? dev?.setDummyDateEnd ?? (() => {});
  const handleGenerateDummyStudents = props.handleGenerateDummyStudents ?? dev?.handleGenerateDummyStudents ?? (async () => {});
  const isGeneratingDummy = props.isGeneratingDummy ?? dev?.isGeneratingDummy ?? false;
  const handleGenerateDummyTeacherAttendance = props.handleGenerateDummyTeacherAttendance ?? dev?.handleGenerateDummyTeacherAttendance ?? (async () => {});
  const generateDummyChats = props.generateDummyChats ?? dev?.generateDummyChats ?? (async () => {});
  const generateDummyComplaints = props.generateDummyComplaints ?? dev?.generateDummyComplaints ?? (async () => {});
  const handleGenerateRandomAttendance = props.handleGenerateRandomAttendance ?? dev?.handleGenerateRandomAttendance ?? (async () => {});
  const handleDeleteDummyAttendance = props.handleDeleteDummyAttendance ?? dev?.handleDeleteDummyAttendance ?? (async () => {});
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
            <SparklesIcon className="w-5 h-5 text-purple-500" /> Enterprise Dummy Data Engine v6.5
          </h3>
          <p className="text-[10px] font-bold text-slate-500 mt-1">
            Mengisi database Firestore instan dengan ribuan simulasi data siswa, kehadiran rombel,
            riwayat haid, dan direct chats secara sekuensial.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5" ref={dropdownRef}>
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

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Mulai Tanggal
                </label>
                <input
                  type="date"
                  value={dummyDate}
                  onChange={(e) => setDummyDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-[#1E293B] rounded-xl px-3 py-2 text-[10px] font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Akhir Tanggal
                </label>
                <input
                  type="date"
                  value={dummyDateEnd}
                  onChange={(e) => setDummyDateEnd(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-[#1E293B] rounded-xl px-3 py-2 text-[10px] font-bold"
                />
              </div>
            </div>
          </div>

          <div className="border border-slate-100 dark:border-indigo-950/20 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
            <h4 className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">
              Generator Pemicu Cepat (Sequential Seeds)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <DevActionButton
                label="Generate 20 Siswa Dummy"
                onAction={handleGenerateDummyStudents}
                disabled={isGeneratingDummy}
              />

              <DevActionButton
                label="Absensi Guru Dummy"
                onAction={handleGenerateDummyTeacherAttendance}
                disabled={isGeneratingDummy}
              />

              <DevActionButton
                label="Chats & Sapaan Dummy"
                onAction={generateDummyChats}
                disabled={isGeneratingDummy}
              />

              <DevActionButton
                label="Dummy Pengaduan Staf"
                onAction={generateDummyComplaints}
                disabled={isGeneratingDummy}
              />

              <DevActionButton
                label="Simulasi Presensi, Poin, & Surat"
                variant="success"
                onAction={handleGenerateRandomAttendance}
                disabled={isGeneratingDummy}
              />

              <DevActionButton
                label="Wipe Dummy Attendance"
                variant="danger"
                confirmMessage="Yakin hapus data ini?"
                onAction={handleDeleteDummyAttendance}
                disabled={isGeneratingDummy}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
