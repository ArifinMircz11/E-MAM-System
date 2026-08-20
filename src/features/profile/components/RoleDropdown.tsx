/**
 * @license
 * e-Mam System - Role & Roles Selection Component
 */

import React from 'react';

interface RoleDropdownProps {
  role: string;
  roles: string[];
  onRoleChange: (role: string) => void;
  onRolesChange: (roles: string[]) => void;
}

const PRIMARY_ROLES = [
  { id: 'admin', label: 'Administrator' },
  { id: 'teacher', label: 'Guru' },
  { id: 'bk', label: 'Guru BK' },
  { id: 'tu', label: 'Tata Usaha (TU)' },
  { id: 'student', label: 'Siswa' },
  { id: 'parent', label: 'Orang Tua' },
];

const SECONDARY_ROLES = [
  { id: 'teacher', label: 'Guru Mapel' },
  { id: 'walas', label: 'Wali Kelas' },
  { id: 'bk', label: 'Guru BK' },
  { id: 'operator', label: 'Operator Madrasah' },
  { id: 'tu', label: 'Staf TU' },
];

export const RoleDropdown: React.FC<RoleDropdownProps> = ({
  role,
  roles,
  onRoleChange,
  onRolesChange,
}) => {
  const handleRoleSelect = (selectedRole: string) => {
    onRoleChange(selectedRole);
    // Automatically include primary role in roles array if not present
    if (!roles.includes(selectedRole)) {
      onRolesChange([...roles, selectedRole]);
    }
  };

  const handleCheckboxToggle = (roleId: string) => {
    if (roles.includes(roleId)) {
      if (roles.length > 1) {
        onRolesChange(roles.filter((r) => r !== roleId));
      }
    } else {
      onRolesChange([...roles, roleId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Role */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Peran Utama (Primary Role) <span className="text-red-500">*</span>
        </label>
        <select
          value={role}
          onChange={(e) => handleRoleSelect(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm"
        >
          <option value="">-- Pilih Peran Utama --</option>
          {PRIMARY_ROLES.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Roles Checkboxes */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Atribut / Peran Tambahan (Roles) <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          {SECONDARY_ROLES.map((sr) => {
            const checked = roles.includes(sr.id);
            return (
              <label
                key={sr.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  checked
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleCheckboxToggle(sr.id)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-sm">{sr.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
