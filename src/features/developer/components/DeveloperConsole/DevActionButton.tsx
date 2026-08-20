import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DevActionButtonProps {
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
  confirmMessage?: string;
  onAction: () => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

export function DevActionButton({
  label,
  icon,
  variant = 'primary',
  confirmMessage,
  onAction,
  onSuccess,
  onError,
  disabled = false,
}: DevActionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setLoading(true);

    try {
      const result = await onAction();
      toast.success(`${label} berhasil`);
      onSuccess?.(result);
    } catch (error: any) {
      toast.error(`${label} gagal: ${error.message}`);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const colorClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition disabled:opacity-50 ${colorClasses[variant]}`}
    >
      {loading ? <Loader2 className="animate-spin w-4 h-4" /> : icon}
      {loading ? 'Memproses...' : label}
    </button>
  );
}
