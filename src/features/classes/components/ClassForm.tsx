import React, { useState, useEffect } from 'react';
import type { IClassEntity } from '@/repositories/contracts/IClassRepository';
import type { ClassFormData } from '../schemas/class.schema';
import { validateClass } from '../validators/class.validator';
import { CLASS_CONSTANTS } from '../constants/class.constants';

interface ClassFormProps {
  initialData?: IClassEntity | null;
  onSubmit: (data: ClassFormData) => Promise<void>;
  onCancel: () => void;
}

export const ClassForm: React.FC<ClassFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [namaKelas, setNamaKelas] = useState(initialData?.namaKelas || '');
  const [kodeKelas, setKodeKelas] = useState(initialData?.kodeKelas || '');
  const [tingkat, setTingkat] = useState(initialData?.tingkat || '10');
  const [jurusan, setJurusan] = useState(initialData?.jurusan || '');
  const [tahunAjaran, setTahunAjaran] = useState(initialData?.tahunAjaran || CLASS_CONSTANTS.DEFAULT_TAHUN_AJARAN);
  const [semester, setSemester] = useState(initialData?.semester || 'ganjil');
  const [status, setStatus] = useState(initialData?.status || 'aktif');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNamaKelas(initialData.namaKelas);
      setKodeKelas(initialData.kodeKelas);
      setTingkat(initialData.tingkat);
      setJurusan(initialData.jurusan || '');
      setTahunAjaran(initialData.tahunAjaran);
      setSemester(initialData.semester);
      setStatus(initialData.status);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateClass({
      namaKelas,
      kodeKelas,
      tingkat,
      jurusan,
      tahunAjaran,
      semester,
      status,
    });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      await onSubmit({
        namaKelas,
        kodeKelas,
        tingkat,
        jurusan,
        tahunAjaran,
        semester,
        status,
      });
    } catch (err: any) {
      setErrors([err.message || 'Gagal menyimpan data kelas']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          <ul className="list-disc pl-5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas *</label>
          <input
            type="text"
            value={namaKelas}
            onChange={(e) => setNamaKelas(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="Contoh: X MIPA 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kode Kelas *</label>
          <input
            type="text"
            value={kodeKelas}
            onChange={(e) => setKodeKelas(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="Contoh: X-MIPA-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat *</label>
          <select
            value={tingkat}
            onChange={(e) => setTingkat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          >
            {CLASS_CONSTANTS.TINGKAT_OPTIONS.map((t) => (
              <option key={t} value={t}>
                Tingkat {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan / Peminatan</label>
          <input
            type="text"
            value={jurusan}
            onChange={(e) => setJurusan(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="Contoh: MIPA / IPS / Agama"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran *</label>
          <input
            type="text"
            value={tahunAjaran}
            onChange={(e) => setTahunAjaran(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="2025/2026"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          >
            <option value="ganjil">Ganjil</option>
            <option value="genap">Genap</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status Kelas</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
        >
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};
