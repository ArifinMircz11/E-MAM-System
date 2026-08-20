/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin (Lead Developer & System Architect)
 * NIP: 19901004 202521 1012
 * Role: Fullstack & UI/UX Engineer
 * Description: Mengembangkan solusi teknologi pendidikan untuk efisiensi dan transparansi manajemen madrasah.
 * Copyright (c) 2025 MAN 1 Hulu Sungai Tengah. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import Layout from '@/layouts/Layout';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  PlusIcon, 
  TrashIcon, 
  Loader2,
  ChevronDownIcon,
  ChevronUpIcon,
  BookOpenIcon,
  SettingsIcon
} from '@/shared/Icons';
import { toast } from 'sonner';
import {
  getAcademicYears,
  saveAcademicYear,
  deleteAcademicYear,
  activateAcademicYear,
  getSemesters,
  saveSemester,
  deleteSemester,
  activateSemester,
} from '@/services/academicService';
import { useDataStore } from '@/stores/dataStore';
import type { AcademicYear as AcademicYearData, Semester } from '@/types';
import { useAutoFix } from '@/hooks/useAutoFix';
import { motion, AnimatePresence } from 'motion/react';
import { useUserStore } from '@/stores/userStore';
import { UserRole } from '@/types/roles';

interface AcademicYearProps {
  onBack: () => void;
}

const AcademicYear: React.FC<AcademicYearProps> = ({ onBack }) => {
  const { academicYears, setAcademicYears, semesters, setSemesters, isDataLoaded } = useDataStore();
  const [loading, setLoading] = useState(!isDataLoaded.academicYears || !isDataLoaded.semesters);
  const [expandedYearId, setExpandedYearId] = useState<string | null>(null);
  const { safeCall } = useAutoFix();

  const roles = useUserStore((state) => state.roles);
  const userRole = useUserStore((state) => state.role);
  const actualRoles = roles && roles.length > 0 ? roles : (userRole ? [userRole] : []);

  const canManage = actualRoles.some(r =>
    [UserRole.DEVELOPER, UserRole.ADMIN, UserRole.KEPALA_MADRASAH, UserRole.KEPALA_TU, UserRole.WAKAMAD].includes(r as any)
  );

  useEffect(() => {
    const fetchData = async () => {
      if (isDataLoaded.academicYears && isDataLoaded.semesters && academicYears.length > 0) {
        setLoading(false);
        return;
      }

      await safeCall(async () => {
        const [yearsData, semestersData] = await Promise.all([
          getAcademicYears(),
          getSemesters()
        ]);
        setAcademicYears(yearsData);
        setSemesters(semestersData);
      }, 'FetchAcademicData');
      setLoading(false);
    };
    fetchData();
  }, []);

  const activeYear = academicYears.find((y) => y.isActive);

  const handleActivate = async (id: string) => {
    await safeCall(async () => {
      await activateAcademicYear(id, academicYears);
      setAcademicYears(academicYears.map((y) => ({ ...y, isActive: y.id === id })));
      toast.success('Tahun ajaran aktif berhasil diperbarui.');
    }, 'ActivateAcademicYear');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini? Semua semester terkait juga akan terhapus secara logis.')) {
      await safeCall(async () => {
        await deleteAcademicYear(id);
        setAcademicYears(academicYears.filter((y) => y.id !== id));
        toast.success('Data berhasil dihapus.');
      }, 'DeleteAcademicYear');
    }
  };

  const handleAddYear = async () => {
    const lastYear = academicYears[0] || { name: '2024/2025' };
    let newName = lastYear.name;

    const parts = lastYear.name.split('/');
    if (parts.length === 2) {
      newName = `${parseInt(parts[0]) + 1}/${parseInt(parts[1]) + 1}`;
    }

    const newYearData: Partial<AcademicYearData> = {
      name: newName,
      isActive: false,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    };

    await safeCall(async () => {
      const result = await saveAcademicYear(newYearData);
      const finalAdded = { ...newYearData, id: result.id } as AcademicYearData;
      
      // Auto-create standard semesters for new year
      const standardSemesters = [
        { name: 'Ganjil', code: '1', isActive: true },
        { name: 'Genap', code: '2', isActive: false }
      ];
      
      const createdSemesters: Semester[] = [];
      for (const sem of standardSemesters) {
        const semResult = await saveSemester({
          ...sem,
          academicYearId: result.id,
          startDate: newYearData.startDate,
          endDate: ''
        });
        createdSemesters.push({
          ...sem,
          id: semResult.id,
          academicYearId: result.id,
          startDate: newYearData.startDate || '',
          endDate: ''
        } as Semester);
      }

      setAcademicYears([finalAdded, ...academicYears]);
      setSemesters([...createdSemesters, ...semesters]);
      toast.success(`Tahun ajaran ${newName} & semester standar berhasil ditambahkan.`);
    }, 'AddAcademicYear');
  };

  const handleActivateSemester = async (semId: string, yearId: string) => {
    await safeCall(async () => {
      await activateSemester(semId, yearId);
      setSemesters(semesters.map(s => {
        if (s.academicYearId === yearId) {
          return { ...s, isActive: s.id === semId };
        }
        return s;
      }));
      toast.success('Semester aktif berhasil diperbarui.');
    }, 'ActivateSemester');
  };

  const toggleExpand = (id: string) => {
    setExpandedYearId(expandedYearId === id ? null : id);
  };

  return (
    <Layout
      title="Tahun Pelajaran"
      subtitle="Manajemen Kalender & Semester"
      icon={CalendarIcon}
      onBack={onBack}
      actions={
        canManage ? (
          <button
            onClick={handleAddYear}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <PlusIcon className="w-4 h-4" /> Tambah Tahun Ajaran
          </button>
        ) : null
      }
    >
      <div className="p-6 pb-24 space-y-8 max-w-5xl mx-auto">
        {/* Active Year Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2.5 bg-green-50 dark:bg-green-500/10 px-4 py-1.5 rounded-full border border-green-100 dark:border-green-500/20">
                <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Tahun Ajaran Aktif</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {activeYear?.name || 'Belum Ditentukan'}
                </h2>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {activeYear?.startDate || '---'} s/d {activeYear?.endDate || '---'}
                    </span>
                  </div>
                  {semesters.find(s => s.academicYearId === activeYear?.id && s.isActive) && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                      <BookOpenIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Semester {semesters.find(s => s.academicYearId === activeYear?.id && s.isActive)?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
              <CalendarIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Year History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              Daftar Tahun Pelajaran
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Total: {academicYears.length} Tahun
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-4" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mengumpulkan Data Akademik...</p>
                </div>
              ) : academicYears.length > 0 ? (
                academicYears.map((year) => {
                  const yearSemesters = semesters.filter(s => s.academicYearId === year.id);
                  const isExpanded = expandedYearId === year.id;
                  
                  return (
                    <div key={year.id} className="group transition-colors">
                      {/* Year Row */}
                      <div className={`p-5 flex items-center justify-between gap-4 transition-all ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/40' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}>
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${year.isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                            <CalendarIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{year.name}</h4>
                              {year.isActive && (
                                <span className="bg-green-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Aktif</span>
                              )}
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                              {yearSemesters.length} Semester Terdaftar
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!year.isActive && canManage && (
                            <button
                              onClick={() => handleActivate(year.id)}
                              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-bold uppercase text-slate-600 dark:text-slate-400 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all active:scale-95"
                            >
                              Aktifkan
                            </button>
                          )}
                          <button
                            onClick={() => toggleExpand(year.id)}
                            className={`p-2 rounded-xl border transition-all ${isExpanded ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          >
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                          </button>
                          {canManage && (
                            <button
                              onClick={() => handleDelete(year.id)}
                              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Semester Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden bg-white dark:bg-[#0B1121]"
                          >
                            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/50">
                              <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Manajemen Semester</span>
                                  {canManage && (
                                    <button className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline text-[10px] font-bold uppercase tracking-wide">
                                      <PlusIcon className="w-3.5 h-3.5" /> Tambah Semester
                                    </button>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {yearSemesters.length > 0 ? (
                                    yearSemesters.map((sem) => (
                                      <div key={sem.id} className={`p-4 rounded-2xl border transition-all ${sem.isActive ? 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sem.isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                              <BookOpenIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <h5 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{sem.name}</h5>
                                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Kode: {sem.code}</p>
                                            </div>
                                          </div>
                                          {sem.isActive ? (
                                            <div className="bg-green-500 text-white text-[7px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Aktif</div>
                                          ) : (
                                            canManage ? (
                                              <button 
                                                onClick={() => handleActivateSemester(sem.id, year.id)}
                                                className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide hover:underline"
                                              >
                                                Aktifkan
                                              </button>
                                            ) : null
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-t border-slate-100 dark:border-slate-800/50 pt-3 mt-3">
                                          <div className="flex items-center gap-1.5">
                                            <CalendarIcon className="w-3 h-3" />
                                            Mulai: {sem.startDate || '---'}
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <SettingsIcon className="w-3 h-3" />
                                            Selesai: {sem.endDate || '---'}
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="col-span-2 py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide italic">Belum ada semester diatur untuk tahun ini</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center">
                  <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide italic">Data Akademik Belum Tersedia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AcademicYear;
