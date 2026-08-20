import React from 'react';
import { ServiceCategory } from '@/types';
import { PlusIcon } from '@/shared/Icons';

export interface LetterFormData {
  type: string;
  description: string;
  userName: string;
  contactInfo: string;
  dataKelulusan: string;
  className: string;
  waliKelas: string;
}

interface CreateLetterFormProps {
  isPublic: boolean;
  selectedCategory: ServiceCategory | null;
  formData: LetterFormData;
  attachment: File | null;
  setFormData: React.Dispatch<React.SetStateAction<LetterFormData>>;
  setAttachment: React.Dispatch<React.SetStateAction<File | null>>;
  getServiceTypes: (cat: ServiceCategory) => string[];
  onSubmit: (e: React.FormEvent) => void;
}

export const CreateLetterForm: React.FC<CreateLetterFormProps> = ({
  isPublic,
  selectedCategory,
  formData,
  attachment,
  setFormData,
  setAttachment,
  getServiceTypes,
  onSubmit,
}) => {
  return (
    <form
      id="createForm"
      onSubmit={onSubmit}
      className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {isPublic && (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Identitas Pemohon
          </h4>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Nama Lengkap
            </label>
            <input
              required
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Nama sesuai KTP/Ijazah"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Kontak (WhatsApp/Email)
            </label>
            <input
              required
              type="text"
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="0812xxxx atau email@anda.com"
            />
          </div>
        </div>
      )}

      {!isPublic && (
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
            Nama Pemohon
          </label>
          <input
            required
            type="text"
            value={formData.userName}
            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Nama Lengkap Pemohon"
          />
        </div>
      )}

      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
          Jenis Layanan {selectedCategory}
        </label>
        <select
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Pilih Jenis Layanan</option>
          {selectedCategory &&
            getServiceTypes(selectedCategory).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
        </select>
      </div>

      {selectedCategory === ServiceCategory.SISWA && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
              Kelas / Rombel
            </label>
            <input
              type="text"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Contoh: 10 A"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
              Wali Kelas
            </label>
            <input
              type="text"
              value={formData.waliKelas}
              onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Nama Wali Kelas"
            />
          </div>
        </div>
      )}

      {selectedCategory === ServiceCategory.ALUMNI && (
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
            Data Kelulusan (Tahun/NISN)
          </label>
          <input
            type="text"
            value={formData.dataKelulusan}
            onChange={(e) => setFormData({ ...formData, dataKelulusan: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Contoh: Lulus 2020 / NISN: 00123456"
          />
        </div>
      )}

      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
          Keperluan / Keterangan Tambahan
        </label>
        <textarea
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          placeholder="Jelaskan keperluan permohonan Anda secara detail..."
        />
      </div>

      {!isPublic && (
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
            Lampiran Dokumen (Opsional)
          </label>
          <div className="relative group">
            <input
              type="file"
              onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-center group-hover:border-indigo-500 transition-colors">
              <div className="flex flex-col items-center gap-1">
                <PlusIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600">
                  {attachment ? attachment.name : 'Klik atau seret file ke sini'}
                </span>
                <span className="text-[9px] text-slate-400">PDF, JPG, PNG (Max 5MB)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium leading-relaxed">
          <span className="font-bold uppercase mr-1">Catatan:</span>
          Pastikan data yang Anda masukkan sudah benar. Admin akan memverifikasi permohonan Anda
          dalam 1-3 hari kerja.
        </p>
      </div>
    </form>
  );
};

export default CreateLetterForm;
