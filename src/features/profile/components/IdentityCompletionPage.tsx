/**
 * @license
 * e-Mam System - Identity Completion Wizard Page
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  UserIcon,
} from '@/shared/Icons';
import { TenantDropdown } from './TenantDropdown';
import { AccountTypeDropdown } from './AccountTypeDropdown';
import type { AccountType } from '@/types';
import { UserRole } from '@/types/roles';
import { RoleDropdown } from './RoleDropdown';
import { AssignmentForm } from './AssignmentForm';
import { IdentityCompletionService } from '@/services/IdentityCompletionService';
import type { CanonicalUser, UserAssignment, UserScope } from '@/identity/domain/CanonicalUser';
import { toast } from 'sonner';

interface IdentityCompletionPageProps {
  user: CanonicalUser;
  onCompleted: (updatedUser: CanonicalUser) => void;
}

export const IdentityCompletionPage: React.FC<IdentityCompletionPageProps> = ({
  user,
  onCompleted,
}) => {
  const [tenantId, setTenantId] = useState(user.tenantId || '');
  const [accountType, setAccountType] = useState<AccountType>(user.accountType ?? AccountType.MADRASAH);
  const [role, setRole] = useState<UserRole>(Object.values(UserRole).includes(user.role as UserRole) ? user.role as UserRole : UserRole.GURU);
  const [roles, setRoles] = useState<UserRole[]>(Array.isArray(user.roles) ? user.roles.filter((r): r is UserRole => Object.values(UserRole).includes(r as UserRole)) : user.role && Object.values(UserRole).includes(user.role as UserRole) ? [user.role as UserRole] : []);
  const [assignment, setAssignment] = useState<UserAssignment>(user.assignment || {});
  const [scope, setScope] = useState<UserScope>(user.scope || { level: 'tenant' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDeveloperEligible =
    user.email?.includes('admin') ||
    user.email?.includes('developer') ||
    user.email === 'developer@example.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantId) {
      toast.error('Silakan pilih Madrasah / Tenant terlebih dahulu.');
      return;
    }
    if (!role) {
      toast.error('Silakan pilih Peran Utama (Role).');
      return;
    }
    if (roles.length === 0) {
      toast.error('Silakan pilih setidaknya satu atribut peran (roles).');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await IdentityCompletionService.completeProfile(user.uid, {
        tenantId,
        accountType: isDeveloperEligible ? accountType : AccountType.MADRASAH,
        role,
        roles,
        assignment,
        scope,
      });

      onCompleted(updated);
    } catch (error: any) {
      console.error('Failed to complete identity:', error);
      toast.error(error.message || 'Gagal melengkapi identitas akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Selamat Datang, {user.displayName || 'Pengguna'}!</h1>
              <p className="text-indigo-100 text-sm">
                Akun Anda telah terautentikasi. Silakan lengkapi identitas bisnis & penugasan untuk melanjutkan.
              </p>
            </div>
          </div>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Account info summary */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">UID: {user.uid}</p>
            </div>
          </div>

          {/* Tenant / Madrasah Selection */}
          <TenantDropdown value={tenantId} onChange={setTenantId} />

          {/* Account Type Selection */}
          <AccountTypeDropdown
            value={accountType}
            onChange={setAccountType}
            isDeveloperEligible={isDeveloperEligible}
          />

          {/* Role & Roles Selection */}
          <RoleDropdown
            role={role}
            roles={roles}
            onRoleChange={setRole}
            onRolesChange={setRoles}
          />

          {/* Assignment & Scope Form */}
          <AssignmentForm
            assignment={assignment}
            onChange={(newAssignment, newScope) => {
              setAssignment(newAssignment);
              setScope(newScope);
            }}
            role={role}
          />

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
              <span>Single Source of Truth (SSOT)</span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <span>Simpan & Masuk ke Dashboard</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default IdentityCompletionPage;
