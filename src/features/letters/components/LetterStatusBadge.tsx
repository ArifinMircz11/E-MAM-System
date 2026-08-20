import React from 'react';
import type { LetterStatus } from '@/types';
import {
  ClockIcon,
  ArrowPathIcon,
  FileText,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@/shared/Icons';

interface LetterStatusBadgeProps {
  status: LetterStatus;
  showIcon?: boolean;
  className?: string;
}

export const getStatusBadgeStyle = (status: LetterStatus): string => {
  switch (status) {
    case 'Pending':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    case 'Proses':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'Verified':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Validated':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Signed':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'Ditolak':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

export const getStatusIcon = (status: LetterStatus) => {
  switch (status) {
    case 'Pending':
      return <ClockIcon className="w-3.5 h-3.5" />;
    case 'Proses':
      return <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />;
    case 'Verified':
      return <FileText className="w-3.5 h-3.5" />;
    case 'Validated':
      return <ShieldCheckIcon className="w-3.5 h-3.5" />;
    case 'Signed':
      return <CheckCircleIcon className="w-3.5 h-3.5" />;
    case 'Ditolak':
      return <XCircleIcon className="w-3.5 h-3.5" />;
    default:
      return null;
  }
};

export const LetterStatusBadge: React.FC<LetterStatusBadgeProps> = ({
  status,
  showIcon = true,
  className = '',
}) => {
  const displayStatus = status === 'Signed' ? 'Selesai' : status;
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 ${getStatusBadgeStyle(
        status,
      )} ${className}`}
    >
      {showIcon && getStatusIcon(status)}
      {displayStatus}
    </span>
  );
};

export default LetterStatusBadge;
