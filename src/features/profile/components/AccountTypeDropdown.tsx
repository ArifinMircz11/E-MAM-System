/**
 * @license
 * e-Mam System - Account Type Dropdown Component
 */

import React from 'react';
import type { AccountType } from '@/types';

interface AccountTypeDropdownProps {
  value: AccountType;
  onChange: (value: AccountType) => void;
  isDeveloperEligible?: boolean;
}

export const AccountTypeDropdown: React.FC<AccountTypeDropdownProps> = ({
  value,
  onChange,
  isDeveloperEligible = false,
}) => {
  if (!isDeveloperEligible) {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tipe Akun
        </label>
        <input
          type="text"
          value="Madrasah"
          readOnly
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-medium cursor-not-allowed"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Tipe Akun <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AccountType)}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm"
      >
        <option value={AccountType.MADRASAH}>Madrasah</option>
        <option value={AccountType.DEVELOPER}>Developer</option>
      </select>
    </div>
  );
};
