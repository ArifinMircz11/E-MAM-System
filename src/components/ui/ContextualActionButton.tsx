import React from 'react';
import { useContextualActionButton } from '@/hooks/useContextualActionButton';
import { Clock, FileText } from 'lucide-react';

interface ContextualButtonProps {
  onClick: (actionType: string) => void;
  className?: string;
}

export function ContextualActionButton({ onClick, className }: ContextualButtonProps) {
  const { label, actionType, canPerformAction } = useContextualActionButton();

  if (!canPerformAction) return null;

  return (
    <button
      onClick={() => onClick(actionType)}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition ${className}`}
    >
      {actionType === 'PRESENSI' ? <Clock size={16} /> : <FileText size={16} />}
      {label}
    </button>
  );
}
