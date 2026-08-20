import React, { useState, useEffect, useMemo } from 'react';
import type { PointCategory} from '@/types';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import {
  getPointCategories,
  addPointCategory,
  updatePointCategory,
  deletePointCategory,
  seedDefaultPointCategories,
} from '@/services/pointService';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2,
  RefreshCwIcon,
} from '@/shared/Icons';

interface PointCategorySettingsProps {
  onBack?: () => void;
  userRole?: UserRole;
  hideHeader?: boolean;
}

const PointCategorySettings: React.FC<PointCategorySettingsProps> = ({
  onBack,
  userRole,
  hideHeader = false,
}) => {
  const [categories, setCategories] = useState<PointCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<PointCategory>>({
    name: '',
    points: 0,
    type: 'Pelanggaran',
    description: '',
    isActive: true,
    linkedToAttendance: false,
    linkedSession: null,
  });

  const canManage = userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const fetchedCategories = await getPointCategories();
      setCategories(fetchedCategories);
    } catch (err: any) {
      toast.error('Gagal memuat kategori: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const pelanggaranCategories = useMemo(() => {
    return categories.filter((c) => c.type?.toLowerCase() === 'pelanggaran');
  }, [categories]);

  const prestasiCategories = useMemo(() => {
    return categories.filter((c) => c.type?.toLowerCase() === 'prestasi');
  }, [categories]);

  const handleEdit = (category: PointCategory) => {
    setEditingId(category.id);
    setFormData(category);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      points: 0,
      type: 'Pelanggaran',
      description: '',
      isActive: true,
      linkedToAttendance: false,
    });
    setIsModalOpen(true);
  };

  const seedDefaults = async () => {
    setLoading(true);
    try {
      await seedDefaultPointCategories();
      toast.success('Kategori default dibuat.');
      fetchCategories();
    } catch (err: any) {
      toast.error('Gagal membuat default: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus kategori "${name}"?`)) return;
    try {
      await deletePointCategory(id);
      toast.success('Kategori berhasil dihapus.');
      fetchCategories();
    } catch (err: any) {
      toast.error('Gagal menghapus: ' + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Nama kategori wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const categoryData = {
        ...formData,
        points: isNaN(formData.points as any) ? 0 : Number(formData.points),
      };

      if (editingId) {
        await updatePointCategory(editingId, categoryData);
        toast.success('Kategori diperbarui.');
      } else {
        await addPointCategory(categoryData);
        toast.success('Kategori ditambahkan.');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1121]">
      {!hideHeader && (
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1121] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
              Kategori Poin
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
              Pelanggaran & Prestasi Siswa
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setRefreshing(true);
                  await fetchCategories();
                  setRefreshing(false);
                  toast.success('Kategori diperbarui.');
                }}
                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <RefreshCwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => {
                  handleAddNew();
                  setFormData((prev) => ({ ...prev, type: 'Pelanggaran' }));
                }}
                className="flex items-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-2xl text-[9px] font-bold uppercase tracking-wide shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
              >
                <PlusIcon className="w-4 h-4" /> Pelanggaran (+)
              </button>
              <button
                onClick={() => {
                  handleAddNew();
                  setFormData((prev) => ({ ...prev, type: 'Prestasi' }));
                }}
                className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-2xl text-[9px] font-bold uppercase tracking-wide shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <PlusIcon className="w-4 h-4" /> Prestasi (-)
              </button>
            </div>
          )}
        </div>
      )}

      {hideHeader && canManage && (
        <div className="px-6 pt-4 flex gap-2">
          <button
            onClick={() => {
              handleAddNew();
              setFormData((prev) => ({ ...prev, type: 'Pelanggaran' }));
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-2xl text-[9px] font-bold uppercase tracking-wide shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
          >
            <PlusIcon className="w-4 h-4" /> Pelanggaran (+)
          </button>
          <button
            onClick={() => {
              handleAddNew();
              setFormData((prev) => ({ ...prev, type: 'Prestasi' }));
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-2xl text-[9px] font-bold uppercase tracking-wide shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <PlusIcon className="w-4 h-4" /> Prestasi (-)
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${hideHeader ? 'p-2 pt-4' : 'p-6'} space-y-6 pb-40`}>
        {categories.length === 0 && !loading ? (
          <div className="text-center p-10 bg-white dark:bg-[#151E32] rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">
              Belum ada kategori!
            </h3>
            <button
              onClick={seedDefaults}
              className="mt-4 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-wide shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
            >
              Buat Kategori Default
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section Pelanggaran */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Pelanggaran (Positif +)
                </h3>
              </div>

              <div className="space-y-3">
                {pelanggaranCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white dark:bg-[#151E32] p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                          {cat.name}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                          +{cat.points} Poin
                        </p>
                        {cat.linkedToAttendance && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-bold uppercase tracking-wide border border-indigo-100">
                            <CheckCircleIcon className="w-3 h-3" /> Auto Presensi
                          </span>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {cat.description && (
                      <p className="mt-3 text-[10px] text-slate-400 leading-relaxed font-medium uppercase tracking-wide">
                        {cat.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section Prestasi */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Prestasi (Negatif -)
                </h3>
              </div>

              <div className="space-y-3">
                {prestasiCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white dark:bg-[#151E32] p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                          {cat.name}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                          {cat.points} Poin
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {cat.description && (
                      <p className="mt-3 text-[10px] text-slate-400 leading-relaxed font-medium uppercase tracking-wide">
                        {cat.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0B1121] w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XCircleIcon className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-2 block">
                    Tipe Kategori
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'Pelanggaran' })}
                      className={`py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${formData.type === 'Pelanggaran' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                      Pelanggaran
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'Prestasi' })}
                      className={`py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${formData.type === 'Prestasi' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                      Prestasi
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-2 block">
                    Nama Kategori
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border-transparent rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase"
                    placeholder="CONTOH: TERLAMBAT, JUARA LOMBA"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-2 block">
                    Nilai Poin (Gunakan Positif untuk Pelanggaran, Negatif untuk Prestasi)
                  </label>
                  <input
                    required
                    type="number"
                    value={isNaN(formData.points as any) ? '' : formData.points}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, points: val === '' ? NaN : parseInt(val) });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-transparent rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="Nilai Poin (+ Pelanggaran, - Prestasi)"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-2 block">
                    Keterangan
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-transparent rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none uppercase"
                    placeholder="DESKRIPSI KATEGORI..."
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                      Hubungkan ke Absensi
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      Aktifkan untuk kategori keterlambatan/alpha
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.linkedToAttendance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        linkedToAttendance: e.target.checked,
                        linkedSession: e.target.checked ? formData.linkedSession : null,
                      })
                    }
                    className="w-5 h-5 rounded accent-indigo-600"
                  />
                </div>

                {formData.linkedToAttendance && (
                  <div className="animate-in slide-in-from-top-4 duration-300">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-2 block">
                      Sesi Terkait (Khusus Pelanggaran)
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['masuk', 'duha', 'zuhur', 'ashar', 'pulang'].map((sess) => (
                        <button
                          key={sess}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              linkedSession: formData.linkedSession === sess ? null : (sess as any),
                            })
                          }
                          className={`py-2 rounded-xl border text-[8px] font-bold uppercase transition-all ${formData.linkedSession === sess ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}
                        >
                          {sess}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wide active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircleIcon className="w-5 h-5" />
                  )}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointCategorySettings;
