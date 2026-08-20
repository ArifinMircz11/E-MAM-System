/**
 * @license
 * e-Mam System - Tenant / Madrasah Dropdown Component
 */

import React from 'react';

interface TenantDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const MADRASAH_OPTIONS = [
  { id: 'demo_school', name: 'MAN 1 Hulu Sungai Tengah' },
  { id: 'man2hst', name: 'MAN 2 Hulu Sungai Tengah' },
  { id: 'mtsn1hst', name: 'MTsN 1 Hulu Sungai Tengah' },
  { id: 'mtsn2hst', name: 'MTsN 2 Hulu Sungai Tengah' },
  { id: 'maalhidayah', name: 'MA Al Hidayah' },
  { id: 'global', name: 'Global / Kantor Kemenag' },
];

export const TenantDropdown: React.FC<TenantDropdownProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Pilih Madrasah / Unit Kerja (Tenant) <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm"
      >
        <option value="">-- Pilih Madrasah --</option>
        {MADRASAH_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
};
