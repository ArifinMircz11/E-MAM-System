import React, { useState, useEffect, useRef } from 'react';
import { CpuChipIcon, ArrowPathIcon, ChevronDownIcon, CheckCircleIcon } from '@/shared/Icons';
import { useAuthStore } from '@/stores/authStore';
import { classRepository } from '@/repositories/classRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { simulationService } from '@/services/simulationService';
import { getSecurityContext } from '@/core/security/contextHelper';

export const AuditBulkSimulation: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId || '';
  const [classes, setClasses] = useState<any[]>([]);

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [status, setStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadClasses = async () => {
      let classData = await classRepository.getByTenant(getSecurityContext(), tenantId);

      // Fallback: If no classes found in class repo, derive from student data
      if (!classData || classData.length === 0) {
        const context: any = {
          uid: 'dev_user',
          tenantId,
          roles: ['Super Admin'],
        };
        const students = await studentRepository.getByTenant(tenantId);
        const uniqueClasses = new Map();

        students.forEach((s) => {
          const id = s.classId || s.className || s.tingkatRombel;
          const name = s.className || s.tingkatRombel || s.classId || 'Tanpa Kelas';
          if (id && !uniqueClasses.has(id)) {
            uniqueClasses.set(id, { classId: id, name });
          }
        });

        classData = Array.from(uniqueClasses.values());
      }

      setClasses(classData);
    };

    loadClasses();
  }, [tenantId]);

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
    if (selectedClasses?.includes(classId)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== classId));
    } else {
      setSelectedClasses([...(selectedClasses || []), classId]);
    }
  };

  const toggleAll = () => {
    if (selectedClasses?.length === classes?.length && classes?.length > 0) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(classes?.map((c) => c.classId) || []);
    }
  };

  const runSimulation = async () => {
    if (!selectedClasses || selectedClasses.length === 0) return;
    setStatus('running');
    await simulationService.generateBulk(tenantId, selectedClasses, 50);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 3000);
  };

  const isAllSelected = classes.length > 0 && selectedClasses.length === classes.length;

  return (
    <div className="p-6 md:p-8 bg-white dark:bg-[#0f172a]/50 backdrop-blur-md rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
            <CpuChipIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-tight text-slate-800 dark:text-slate-100">
              Simulasi Bulk
            </h4>
            <p className="text-[10px] font-bold text-slate-400">Presensi 90%, Poin 5%, Surat 5%</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide border-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[140px] justify-between"
            >
              <span className="truncate max-w-[100px]">
                {selectedClasses.length === 0
                  ? 'Pilih Kelas'
                  : isAllSelected
                    ? 'Semua Kelas'
                    : `${selectedClasses.length} Kelas Dipilih`}
              </span>
              <ChevronDownIcon
                className={`w-3 h-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  <div
                    className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-2 border-b border-slate-100 dark:border-slate-700"
                    onClick={toggleAll}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${isAllSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}
                    >
                      {isAllSelected && <CheckCircleIcon className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Pilih Semua Kelas
                    </span>
                  </div>
                  {classes.map((c) => {
                    const isSelected = selectedClasses?.includes(c.classId);
                    return (
                      <div
                        key={c.classId}
                        className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-2"
                        onClick={() => toggleClass(c.classId)}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}
                        >
                          {isSelected && <CheckCircleIcon className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {c.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={runSimulation}
            disabled={status === 'running' || selectedClasses.length === 0}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all flex items-center gap-2"
          >
            {status === 'running' ? '...' : <ArrowPathIcon className="w-3 h-3" />}
            Run Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
