/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect } from 'react';
import Layout from '@/layouts/Layout';
import {
  ArrowTrendingUpIcon,
  Loader2,
  CheckCircleIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
} from '@/shared/Icons';
import type { Student } from '@/types';
import {
  getStudentsByClass,
  promoteStudents,
  promoteStudentsToAlumni,
} from '@/services/studentService';
import { toast } from 'sonner';
import { normalizeRombelName, isRombelEqual, generateClassId } from '@/utils/rombelHelpers';
import { useStudentStore } from '@/stores/studentStore';
import { useUserStore } from '@/stores/userStore';

const ClassPromotion: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const classes = useStudentStore((state) => state.classes);
  const fetchClasses = useStudentStore((state) => state.fetchClasses);
  const tenantId = useUserStore((state) => state.tenantId);
  const [sourceClassId, setSourceClassId] = useState<string>('');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [sourceClassName, setSourceClassName] = useState<string>('');
  const [targetClassName, setTargetClassName] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    if (classes.length === 0) {
      fetchClasses();
    }
  }, [classes.length, fetchClasses]);

  useEffect(() => {
    if (sourceClassName) {
      const fetchStudents = async () => {
        setLoading(true);
        const data = await getStudentsByClass(sourceClassName);
        setStudents(data);
        setSelectedStudents(data.map((s) => s.id!));
        setLoading(false);

        // Automatic Target Suggestion e-Mam v8.0 Standard (Auto-create/suggest target class even if not yet created)
        const normSource = normalizeRombelName(sourceClassName);
        const parts = normSource.split(' ');

        if (parts.length >= 2) {
          const level = parts[0];
          const suffix = parts.slice(1).join(' ');

          let suggested = '';
          if (level === '10') {
            suggested = `11 ${suffix}`;
          } else if (level === '11') {
            suggested = `12 ${suffix}`;
          } else if (level === '12') {
            setTargetClassName('ALUMNI');
            setTargetClassId('ALUMNI');
            return;
          }

          if (suggested) {
            const match = classes.find((c) => isRombelEqual(c.name, suggested));
            if (match) {
              setTargetClassName(match.name);
              setTargetClassId(match.id!);
            } else {
              setTargetClassName(suggested);
              setTargetClassId(generateClassId(tenantId || 'tenant_default', suggested));
            }
          }
        }
      };
      fetchStudents();
    } else {
      setStudents([]);
      setSelectedStudents([]);
      setTargetClassName('');
      setTargetClassId('');
    }
  }, [sourceClassName, classes, tenantId]);

  const handleToggleSelect = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudents(students.map((s) => s.id!));
    } else {
      setSelectedStudents([]);
    }
  };

  const handlePromote = async () => {
    if (!targetClassName) {
      toast.error('Pilih rombel tujuan.');
      return;
    }
    if (selectedStudents.length === 0) {
      toast.error('Pilih minimal satu siswa.');
      return;
    }
    if (isRombelEqual(sourceClassName, targetClassName)) {
      toast.error('Rombel asal dan tujuan tidak boleh sama.');
      return;
    }

    setIsPromoting(true);
    try {
      if (targetClassName === 'ALUMNI') {
        const currentYear = new Date().getFullYear().toString();
        await promoteStudentsToAlumni(selectedStudents, currentYear);
        toast.success(`${selectedStudents.length} siswa berhasil diluluskan menjadi Alumni`);
      } else {
        await promoteStudents(selectedStudents, targetClassName, targetClassId);
        toast.success(
          `${selectedStudents.length} siswa berhasil dipindahkan ke ${targetClassName}`,
        );
      }
      setSourceClassName('');
      setSourceClassId('');
      setTargetClassName('');
      setTargetClassId('');
      setStudents([]);
      setSelectedStudents([]);
    } catch (error) {
      toast.error('Gagal melakukan kenaikan kelas.');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <Layout title="Akademik" subtitle="Kenaikan Kelas" icon={ArrowTrendingUpIcon} onBack={onBack}>
      <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto pb-32">
        {/* Info Box */}
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10">
            <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-indigo-900 dark:text-white  tracking-tight">
              Migrasi Massal
            </h3>
            <p className="text-[8px] font-medium text-indigo-700/70 dark:text-indigo-400 mt-0.5 leading-tight">
              Pindah rombel massal atau kelulusan alumni.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
              Rombel Asal
            </label>
            <div className="relative">
              <select
                value={sourceClassName}
                onChange={(e) => {
                  const val = e.target.value;
                  setSourceClassName(val);
                  const cls = classes.find((c) => c.name === val);
                  setSourceClassId(cls?.id || '');
                }}
                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
              >
                <option value="">Pilih Rombel...</option>
                {classes.map((c, i) => (
                  <option key={`${c.id}-${i}`} value={c.name}>
                    {c.name} ({c.academicYear})
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
              Rombel Tujuan
            </label>
            <div className="relative">
              <select
                value={targetClassName}
                onChange={(e) => {
                  const val = e.target.value;
                  setTargetClassName(val);
                  const cls = classes.find((c) => c.name === val);
                  setTargetClassId(cls?.id || '');
                }}
                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none disabled:opacity-50"
                disabled={!sourceClassName}
              >
                <option value="">Pilih Tujuan...</option>
                <optgroup label="Kelulusan">
                  <option value="ALUMNI">LULUS (ALUMNI)</option>
                </optgroup>
                <optgroup label="Rombel Tersedia">
                  {classes.map((c, i) => (
                    <option key={`${c.id}-${i}`} value={c.name}>
                      {c.name} ({c.academicYear})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDownIcon className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
          </div>
        </div>

        {sourceClassName && (
          <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === students.length && students.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">
                  {selectedStudents.length} Siswa Terpilih
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800/50 max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-20" />
                </div>
              ) : students.length > 0 ? (
                students.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleToggleSelect(s.id!)}
                    className={`px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors ${selectedStudents.includes(s.id!) ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(s.id!)}
                        readOnly
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex flex-col">
                        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase leading-none mb-1">
                          {s.namaLengkap}
                        </h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                          {s.idUnik} • {s.jenisKelamin}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center opacity-30">
                  <ExclamationCircleIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-[10px] font-bold uppercase">
                    Tidak ada siswa aktif di rombel ini
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handlePromote}
                disabled={isPromoting || selectedStudents.length === 0 || !targetClassName}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
              >
                {isPromoting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5" />
                )}{' '}
                Pindah Rombel
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClassPromotion;
