import React from 'react';
import { useDeleteField } from '@/hooks/useDeleteField';
import { Trash2 } from 'lucide-react';

interface DeleteFieldButtonProps {
  collectionPath: string;
  documentId: string;
  fieldPath: string;
  onSuccess?: () => void;
  label?: string;
  className?: string;
}

export function DeleteFieldButton({
  collectionPath,
  documentId,
  fieldPath,
  onSuccess,
  label = 'Delete',
  className = 'text-red-500 hover:text-red-700 p-2',
}: DeleteFieldButtonProps) {
  const { deleteField, isLoading } = useDeleteField();

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the field "${fieldPath}"?`)) {
      const success = await deleteField(collectionPath, documentId, fieldPath);
      if (success && onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isLoading}
      className={className}
      aria-label="Delete field"
    >
      {isLoading ? (
        '...'
      ) : (
        <span className="flex items-center gap-1">
          <Trash2 size={16} />
          {label}
        </span>
      )}
    </button>
  );
}
