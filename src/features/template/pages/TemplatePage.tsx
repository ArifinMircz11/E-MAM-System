import React from 'react';
import { useTemplate } from '../hooks/useTemplate';
import { useTemplateStore } from '../state/templateStore';
import { TemplateTable } from '../components/TemplateTable';
import { TemplateForm } from '../components/TemplateForm';
import type { ITemplateEntity } from '@/repositories/contracts/ITemplateRepository';

export const TemplatePage: React.FC = () => {
  const { items, loading, error, refresh, createItem, updateItem, deleteItem } = useTemplate();
  const { isModalOpen, setModalOpen, selectedItem, setSelectedItem, filter, setFilter } = useTemplateStore();

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ITemplateEntity) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleSubmitForm = async (formData: any) => {
    if (selectedItem) {
      await updateItem(selectedItem.id, formData);
    } else {
      await createItem(formData);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Foundation Module</h1>
          <p className="text-sm text-gray-500">
            Enterprise Offline-First Template Component compliant with v7.8 Architecture Freeze.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm"
        >
          + New Template
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <input
          type="text"
          value={filter.searchQuery}
          onChange={(e) => setFilter({ searchQuery: e.target.value })}
          placeholder="Search templates..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => refresh()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Loading templates...</div>
      ) : (
        <TemplateTable items={items} onEdit={handleOpenEdit} onDelete={deleteItem} />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {selectedItem ? 'Edit Template' : 'Create New Template'}
            </h2>
            <TemplateForm
              initialData={selectedItem}
              onSubmit={handleSubmitForm}
              onCancel={() => {
                setModalOpen(false);
                setSelectedItem(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
