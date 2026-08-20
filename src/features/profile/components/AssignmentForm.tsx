/**
 * @license
 * e-Mam System - Assignment & Department Form Component
 */

import React from 'react';
import type { UserAssignment, UserScope } from '@/identity/domain/CanonicalUser';

interface AssignmentFormProps {
  assignment: UserAssignment;
  onChange: (assignment: UserAssignment, scope: UserScope) => void;
  role: string;
}

const DEPARTMENTS = [
  { id: 'tu', name: 'Tata Usaha (TU)' },
  { id: 'kurikulum', name: 'Kurikulum' },
  { id: 'kesiswaan', name: 'Kesiswaan' },
  { id: 'humas', name: 'Humas' },
  { id: 'sarpras', name: 'Sarana & Prasarana' },
];

const POSITIONS = [
  { id: 'guru', name: 'Guru Mapel' },
  { id: 'walas', name: 'Wali Kelas' },
  { id: 'operator', name: 'Operator' },
  { id: 'bk', name: 'Guru BK' },
  { id: 'tu_staff', name: 'Staf TU' },
];

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  assignment,
  onChange,
  role,
}) => {
  const isTeacherOrStaff = ['teacher', 'bk', 'tu', 'admin'].includes(role);

  if (!isTeacherOrStaff) {
    return null;
  }

  const handleFieldChange = (field: keyof UserAssignment, val: string) => {
    const updated = { ...assignment, [field]: val };
    const scope: UserScope = assignment.scope || { level: 'tenant' };
    onChange(updated, scope);
  };

  const handleScopeLevelChange = (level: any) => {
    const scope: UserScope = { ...(assignment.scope || { level: 'tenant' }), level };
    onChange(assignment, scope);
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Penugasan & Unit Kerja (Assignment)
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Department */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Unit Kerja (Department)
          </label>
          <select
            value={assignment.departmentId || ''}
            onChange={(e) => handleFieldChange('departmentId', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Pilih Unit Kerja --</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Position */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Jabatan (Position)
          </label>
          <select
            value={assignment.positionId || ''}
            onChange={(e) => handleFieldChange('positionId', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Pilih Jabatan --</option>
            {POSITIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Scope Level */}
        <div className="space-y-1 sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Cakupan Akses (Scope Level)
          </label>
          <select
            value={assignment.scope?.level || 'tenant'}
            onChange={(e) => handleScopeLevelChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="global">Global (Semua Madrasah)</option>
            <option value="tenant">Madrasah (Satu Tenant)</option>
            <option value="department">Unit Kerja Tertentu</option>
            <option value="class">Kelas Tertentu</option>
          </select>
        </div>
      </div>
    </div>
  );
};
