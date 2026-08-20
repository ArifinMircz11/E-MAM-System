import React from 'react';
import type { IClassEntity } from '@/repositories/contracts/IClassRepository';

interface ClassCardProps {
  item: IClassEntity;
  onEdit: (item: IClassEntity) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export const ClassCard: React.FC<ClassCardProps> = ({ item, onEdit, onDelete, canUpdate, canDelete }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">
            Kode: {item.kodeKelas}
          </span>
          <h3 className="text-lg font-bold text-gray-900 mt-2">{item.namaKelas}</h3>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            item.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {item.status}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600 mb-4">
        <div>Tingkat: <span className="font-medium text-gray-900">{item.tingkat}</span> {item.jurusan ? `(${item.jurusan})` : ''}</div>
        <div>Tahun Ajaran: <span className="font-medium text-gray-900">{item.tahunAjaran} ({item.semester})</span></div>
        <div>Jumlah Siswa: <span className="font-medium text-gray-900">{item.jumlahSiswa || 0} siswa</span></div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs text-gray-400">
        <span>Sync: {item.syncStatus || 'synced'}</span>
        <div className="space-x-3">
          {canUpdate && (
            <button
              onClick={() => onEdit(item)}
              className="text-indigo-600 hover:text-indigo-900 font-medium"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="text-red-600 hover:text-red-900 font-medium"
            >
              Nonaktifkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
