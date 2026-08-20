import React from 'react';
import type { ITemplateEntity } from '@/repositories/contracts/ITemplateRepository';

interface TemplateCardProps {
  item: ITemplateEntity;
  onEdit: (item: ITemplateEntity) => void;
  onDelete: (id: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ item, onEdit, onDelete }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
          {item.syncStatus || 'synced'}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
        <div className="space-x-2">
          <button
            onClick={() => onEdit(item)}
            className="text-indigo-600 hover:text-indigo-900 font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-600 hover:text-red-900 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
