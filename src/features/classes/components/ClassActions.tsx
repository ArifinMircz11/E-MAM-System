import React from 'react';

interface ClassActionsProps {
  onSearchChange: (q: string) => void;
  searchValue: string;
  tingkatFilter: string;
  onTingkatChange: (t: string) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
  onRefresh: () => void;
  onCreateClick: () => void;
  canCreate: boolean;
}

export const ClassActions: React.FC<ClassActionsProps> = ({
  onSearchChange,
  searchValue,
  tingkatFilter,
  onTingkatChange,
  statusFilter,
  onStatusChange,
  onRefresh,
  onCreateClick,
  canCreate,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama atau kode kelas..."
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
        />

        <select
          value={tingkatFilter}
          onChange={(e) => onTingkatChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">Semua Tingkat</option>
          <option value="7">Tingkat 7</option>
          <option value="8">Tingkat 8</option>
          <option value="9">Tingkat 9</option>
          <option value="10">Tingkat 10</option>
          <option value="11">Tingkat 11</option>
          <option value="12">Tingkat 12</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>

        <button
          onClick={onRefresh}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Muat Ulang
        </button>
      </div>

      {canCreate && (
        <button
          onClick={onCreateClick}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm flex items-center justify-center space-x-2"
        >
          <span>+ Tambah Kelas</span>
        </button>
      )}
    </div>
  );
};
