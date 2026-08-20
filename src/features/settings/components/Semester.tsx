/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin (Lead Developer & System Architect)
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
  BookOpenIcon,
  ChevronDownIcon
} from '@/shared/Icons';
import { toast } from 'sonner';
import {
  getAcademicYears,
  getSemesters,
  saveSemester,
  deleteSemester,
  activateSemester,
} from '@/services/academicService';
import { useDataStore } from '@/stores/dataStore';
import type { AcademicYear as AcademicYearData, Semester as SemesterData } from '@/types';
import { useAutoFix } from '@/hooks/useAutoFix';
import { motion, AnimatePresence } from 'motion/react';
import { useUserStore } from '@/stores/userStore';
import { UserRole } from '@/types/roles';

interface SemesterProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
}

export const Semester: React.FC<SemesterProps> = ({ onBack, onOpenSidebar }) => {
  const [academicYears, setAcademicYears] = useState<AcademicYearData[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [semesters, setSemesters] = useState<SemesterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create state for addition dialog
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSemName, setNewSemName] = useState('Ganjil');
  const [newSemCode, setNewSemCode] = useState('1');

  const { isDataLoaded, setAcademicYears: setStoreYears, setSemesters: setStoreSemesters } = useDataStore();
  const { safeCall } = useAutoFix();

  const roles = useUserStore((state) => state.roles);
  const userRole = useUserStore((state) => state.role);
  const actualRoles = roles && roles.length > 0 ? roles : (userRole ? [userRole] : []);

  const canManage = actualRoles.some(r =>
    [UserRole.DEVELOPER, UserRole.ADMIN, UserRole.KEPALA_MADRASAH, UserRole.KEPALA_TU, UserRole.WAKAMAD].includes(r as any)
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const years = await getAcademicYears();
        setAcademicYears(years);
        setStoreYears(years);

        const activeYear = years.find(y => y.isActive) || years[0];
        if (activeYear) {
          setSelectedYearId(activeYear.id);
          const sems = await getSemesters(activeYear.id);
          setSemesters(sems);
        }
      } catch (err) {
        console.error('Error loading academic config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync selected year semesters
  useEffect(() => {
    if (!selectedYearId) return;
    
    const loadSelectedSemesters = async () => {
      setLoading(true);
      try {
        const sems = await getSemesters(selectedYearId);
        setSemesters(sems);
      } catch (err) {
        console.error('Error loading semesters:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSelectedSemesters();
  }, [selectedYearId]);

  const activeYear = academicYears.find(y => y.id === selectedYearId);
  const activeSemester = semesters.find(s => s.isActive);

  const handleActivate = async (semId: string) => {
    await safeCall(async () => {
      await activateSemester(semId, selectedYearId);
      setSemesters(semesters.map(s => ({
        ...s,
        isActive: s.id === semId
      })));
      toast.success('Semester aktif berhasil diperbarui.');
    }, 'ActivateSemester');
  };

  const handleDelete = async (semId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus semester ini?')) return;
    
    await safeCall(async () => {
      await deleteSemester(semId);
      setSemesters(semesters.filter(s => s.id !== semId));
      toast.success('Semester berhasil dihapus.');
    }, 'DeleteSemester');
  };

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYearId) {
      toast.error('Pilih Tahun Pelajaran terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    await safeCall(async () => {
      const result = await saveSemester({
        name: newSemName,
        code: newSemCode,
        academicYearId: selectedYearId,
        isActive: semesters.length === 0, // Make active if it is the first semester
      } as any);

      const addedSemester: SemesterData = {
        id: result.id,
        name: newSemName,
        code: newSemCode,
        academicYearId: selectedYearId,
        isActive: semesters.length === 0,
        tenantId: '', // Added by service
      } as SemesterData;

      setSemesters([...semesters, addedSemester]);
      setShowAddModal(false);
      toast.success('Semester baru berhasil ditambahkan.');
    }, 'AddSemester');
    setIsSubmitting(false);
  };

  return (
    <Layout
      title="Semester"
      subtitle="Manajemen & Konteks Semester Akademik"
      icon={BookOpenIcon}
      onBack={onBack}
      actions={
        canManage && selectedYearId ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <PlusIcon className="w-4 h-4" /> Tambah Semester
          </button>
        ) : null
      }
    >
      <div className="p-6 pb-24 space-y-8 max-w-5xl mx-auto">
        
        {/* Selector Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Pilih Tahun Pelajaran</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gunakan drop-down di sebelah kanan untuk melihat semester dari tahun ajaran lain.</p>
          </div>
          <div className="relative min-w-[240px]">
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 pl-4 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.isActive ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
              <ChevronDownIcon className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Active Semester Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2.5 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                <CheckCircleIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Semester Aktif saat ini</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Semester {activeSemester?.name || 'Belum Ditentukan'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest font-bold">
                  Tahun Pelajaran: {activeYear?.name || '---'}
                </p>
              </div>
            </div>
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
              <BookOpenIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Semester History/List Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Daftar Semester ({activeYear?.name})</h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : semesters.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
              <BookOpenIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Belum ada Semester</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">Tahun Pelajaran ini belum memiliki semester yang didaftarkan.</p>
              {canManage && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-6 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  Buat Semester
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {semesters.map((sem) => (
                <div 
                  key={sem.id}
                  className={`bg-white dark:bg-slate-900 rounded-[2rem] p-6 border transition-all ${
                    sem.isActive 
                      ? 'border-green-500 dark:border-green-500/50 shadow-md shadow-green-500/5' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                        sem.isActive 
                          ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400' 
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400'
                      }`}>
                        <BookOpenIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">Semester {sem.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kode: {sem.code}</span>
                      </div>
                    </div>
                    <div>
                      {sem.isActive ? (
                        <span className="bg-green-500 text-white text-[8px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Aktif</span>
                      ) : (
                        canManage && (
                          <button
                            onClick={() => handleActivate(sem.id)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-green-500 hover:text-white dark:hover:bg-green-500 rounded-lg text-[9px] font-bold uppercase text-slate-600 dark:text-slate-400 transition-colors"
                          >
                            Aktifkan
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  
                  {canManage && !sem.isActive && (
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                      <button
                        onClick={() => handleDelete(sem.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase transition-colors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Semester Dialog Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Tambah Semester Baru</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tambahkan semester ke tahun pelajaran {activeYear?.name}</p>
              </div>

              <form onSubmit={handleAddSemester} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Nama Semester</label>
                  <select
                    value={newSemName}
                    onChange={(e) => {
                      setNewSemName(e.target.value);
                      setNewSemCode(e.target.value === 'Ganjil' ? '1' : '2');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Kode Semester</label>
                  <input
                    type="text"
                    value={newSemCode}
                    onChange={(e) => setNewSemCode(e.target.value)}
                    placeholder="Contoh: 1 atau 2"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-2xl text-xs font-bold uppercase text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Semester;
