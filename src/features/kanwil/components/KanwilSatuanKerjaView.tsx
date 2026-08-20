import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingLibraryIcon, 
  GlobeAltIcon, 
  MapPinIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  XMarkIcon,
  CheckIcon
} from '@/shared/Icons';
import { KanwilDashboardService } from '../services/kanwilDashboardService';
import type { SatuanKerjaData, SatuanKerjaType } from '../types';
import { toast } from 'sonner';

export const KanwilSatuanKerjaView: React.FC = () => {
  const [list, setList] = useState<SatuanKerjaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SatuanKerjaData | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    region: '',
    type: 'KANKENAG_KAB_KOTA' as SatuanKerjaType
  });

  const loadData = async () => {
    setIsLoading(true);
    const data = await KanwilDashboardService.getSatuanKerjaList();
    setList(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: '',
      region: '',
      type: 'KANKENAG_KAB_KOTA'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SatuanKerjaData) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      region: item.region,
      type: item.type
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus Satuan Kerja ini?')) {
      try {
        await KanwilDashboardService.deleteSatuanKerja(id);
        toast.success('Satuan Kerja berhasil dihapus');
        loadData();
      } catch (err) {
        toast.error('Gagal menghapus data');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await KanwilDashboardService.updateSatuanKerja(editingItem.id, formData);
        toast.success('Satuan Kerja berhasil diperbarui');
      } else {
        await KanwilDashboardService.createSatuanKerja(formData);
        toast.success('Satuan Kerja baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Gagal menyimpan data');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/10 mb-2">
            <BuildingLibraryIcon className="w-3.5 h-3.5" /> Struktur Organisasi Kanwil
          </span>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">
            Satuan Kerja Wilayah
          </h1>
          <p className="text-[11px] font-bold text-slate-500 mt-2 max-w-lg">
            Manajemen Kantor Kementerian Agama Kabupaten / Kota di wilayah Provinsi Kalimantan Selatan.
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Tambah Satker</span>
        </button>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sinkronisasi Basis Data...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Tidak ada data satuan kerja</p>
          </div>
        ) : (
          <AnimatePresence>
            {list.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-full"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center shadow-inner">
                      <BuildingLibraryIcon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-xl transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                      KODE: {item.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase leading-tight tracking-tight">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                    <MapPinIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{item.region}</span>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full uppercase ">
                    {item.type.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Verified</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingItem ? 'Edit Satuan Kerja' : 'Satker Baru'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Identitas Organisasi Satker</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-2xl transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">Nama Instansi</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-teal-500/10 outline-none"
                      placeholder="Contoh: Kankemenag Kab. Banjar"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">Kode Satker</label>
                      <input
                        required
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:ring-4 focus:ring-teal-500/10 outline-none"
                        placeholder="63.XX"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">Tipe</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as SatuanKerjaType })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10"
                      >
                        <option value="KANWIL">KANWIL</option>
                        <option value="KANKENAG_KAB_KOTA">KAB / KOTA</option>
                        <option value="MADRASAH">MADRASAH</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">Wilayah / Kabupaten</label>
                    <input
                      required
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-teal-500/10 outline-none"
                      placeholder="Contoh: Kabupaten Banjar"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[2rem] text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] px-6 py-4 bg-teal-600 text-white rounded-[2rem] text-xs font-bold uppercase tracking-wider shadow-xl shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span>{editingItem ? 'Simpan Perubahan' : 'Daftarkan Satker'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanwilSatuanKerjaView;

