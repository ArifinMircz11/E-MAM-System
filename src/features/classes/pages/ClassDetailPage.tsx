import React, { useEffect, useState } from 'react';
import { useSecurityContext } from '@/core/identity/security-context';
import { classService } from '../services/ClassService';
import type { IClassEntity } from '@/repositories/contracts/IClassRepository';

interface ClassDetailPageProps {
  classId?: string;
  onBack?: () => void;
}

export const ClassDetailPage: React.FC<ClassDetailPageProps> = ({ classId, onBack }) => {
  const securityContext = useSecurityContext();
  const [classItem, setClassItem] = useState<IClassEntity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (!securityContext || !classId) return;
      try {
        const item = await classService.getById(securityContext, classId);
        setClassItem(item);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail kelas');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [securityContext, classId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat detail kelas...</div>;
  }

  if (error || !classItem) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error || 'Kelas tidak ditemukan'}
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium"
          >
            Kembali ke Daftar Kelas
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2 inline-block"
            >
              ← Kembali ke Daftar Kelas
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{classItem.namaKelas}</h1>
          <p className="text-sm text-gray-500">Kode: {classItem.kodeKelas}</p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            classItem.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {classItem.status}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Akademik</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">Tingkat:</span>
            <span className="font-medium text-gray-900">Tingkat {classItem.tingkat}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Jurusan:</span>
            <span className="font-medium text-gray-900">{classItem.jurusan || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Tahun Ajaran:</span>
            <span className="font-medium text-gray-900">{classItem.tahunAjaran}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Semester:</span>
            <span className="font-medium text-gray-900 uppercase">{classItem.semester}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Jumlah Siswa:</span>
            <span className="font-medium text-gray-900">{classItem.jumlahSiswa || 0} Siswa</span>
          </div>
          <div>
            <span className="text-gray-500 block">Tenant ID:</span>
            <span className="font-medium text-gray-900 font-mono text-xs">{classItem.tenantId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
