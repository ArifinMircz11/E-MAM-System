/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React from 'react';
const TEACHER_LIST: string[] = [];

interface TeacherDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const TeacherDropdown: React.FC<TeacherDropdownProps> = ({
  value,
  onChange,
  label,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="">Pilih Guru Mapel</option>
        {TEACHER_LIST.map((teacher, index) => (
          <option key={index} value={teacher}>
            {teacher}
          </option>
        ))}
      </select>
    </div>
  );
};
