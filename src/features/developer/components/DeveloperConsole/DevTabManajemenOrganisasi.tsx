import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  Layers,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrganizationItem {
  id: string;
  parentId: string | null;
  organizationType: 'kanwil' | 'kemenag' | 'madrasah';
  organizationCode: string;
  kodeSatker: string;
  name: string;
  province?: string;
  city?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export const DevTabManajemenOrganisasi: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'kanwil' | 'kemenag' | 'madrasah'>('kanwil');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [organizations, setOrganizations] = useState<OrganizationItem[]>([
    {
      id: 'org_kanwil_01',
      parentId: null,
      organizationType: 'kanwil',
      organizationCode: 'KWL-63',
      kodeSatker: '6300',
      name: 'Kanwil Kementerian Agama Provinsi Kalimantan Selatan',
      province: 'Kalimantan Selatan',
      city: 'Banjarmasin',
      status: 'active',
      createdAt: '2025-01-10',
    },
    {
      id: 'org_kemenag_01',
      parentId: 'org_kanwil_01',
      organizationType: 'kemenag',
      organizationCode: 'KEM-6301',
      kodeSatker: '630101',
      name: 'Kemenag Kabupaten Hulu Sungai Tengah',
      province: 'Kalimantan Selatan',
      city: 'Barabai',
      status: 'active',
      createdAt: '2025-01-12',
    },
    {
      id: 'org_kemenag_02',
      parentId: 'org_kanwil_01',
      organizationType: 'kemenag',
      organizationCode: 'KEM-6302',
      kodeSatker: '630102',
      name: 'Kemenag Kota Banjarmasin',
      province: 'Kalimantan Selatan',
      city: 'Banjarmasin',
      status: 'active',
      createdAt: '2025-01-12',
    },
    {
      id: 'org_madrasah_01',
      parentId: 'org_kemenag_01',
      organizationType: 'madrasah',
      organizationCode: 'MAD-30315537',
      kodeSatker: '630101001',
      name: 'MAN 1 Hulu Sungai Tengah',
      province: 'Kalimantan Selatan',
      city: 'Barabai',
      status: 'active',
      createdAt: '2025-01-15',
    },
    {
      id: 'org_madrasah_02',
      parentId: 'org_kemenag_01',
      organizationType: 'madrasah',
      organizationCode: 'MAD-30315536',
      kodeSatker: '630101002',
      name: 'MAN 2 Hulu Sungai Tengah',
      province: 'Kalimantan Selatan',
      city: 'Barabai',
      status: 'active',
      createdAt: '2025-01-16',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    organizationCode: '',
    kodeSatker: '',
    province: 'Kalimantan Selatan',
    city: '',
    parentId: '',
    organizationType: 'kanwil' as 'kanwil' | 'kemenag' | 'madrasah',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredOrgs = organizations.filter((org) => {
    const matchType = org.organizationType === activeSubTab;
    const matchSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.kodeSatker.includes(searchQuery) ||
      org.organizationCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleOpenAdd = (type: 'kanwil' | 'kemenag' | 'madrasah') => {
    setActiveSubTab(type);
    setFormData({
      name: '',
      organizationCode: `ORG-${Math.floor(1000 + Math.random() * 9000)}`,
      kodeSatker: `63${Math.floor(1000 + Math.random() * 9000)}`,
      province: 'Kalimantan Selatan',
      city: '',
      parentId: type === 'kanwil' ? '' : type === 'kemenag' ? 'org_kanwil_01' : 'org_kemenag_01',
      organizationType: type,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.kodeSatker.trim()) {
      toast.error('Nama organisasi dan Kode Satker wajib diisi!');
      return;
    }

    const newOrg: OrganizationItem = {
      id: `org_${Date.now()}`,
      parentId: formData.organizationType === 'kanwil' ? null : formData.parentId || null,
      organizationType: formData.organizationType,
      organizationCode: formData.organizationCode,
      kodeSatker: formData.kodeSatker,
      name: formData.name,
      province: formData.province,
      city: formData.city,
      status: formData.status,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setOrganizations([newOrg, ...organizations]);
    setIsModalOpen(false);
    toast.success(`Berhasil menambahkan ${formData.organizationType.toUpperCase()}: ${formData.name}`);
  };

  const toggleStatus = (id: string) => {
    setOrganizations(
      organizations.map((org) =>
        org.id === id ? { ...org, status: org.status === 'active' ? 'inactive' : 'active' } : org
      )
    );
    toast.success('Status organisasi berhasil diperbarui');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Enterprise Architecture e-MAM</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Organisasi (Hierarki)</h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Kelola struktur vertikal instansi dari tingkat Kanwil Kementerian Agama, Kemenag Kabupaten/Kota, hingga Satuan Pendidikan Madrasah.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleOpenAdd(activeSubTab)}
            className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah {activeSubTab.toUpperCase()}</span>
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-8">
        {(['kanwil', 'kemenag', 'madrasah'] as const).map((tab) => {
          const count = organizations.filter((o) => o.organizationType === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-3 font-bold text-sm uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors ${
                activeSubTab === tab
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{tab === 'kanwil' ? 'Kanwil' : tab === 'kemenag' ? 'Kemenag Kab/Kota' : 'Madrasah'}</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Cari ${activeSubTab} berdasarkan nama atau kode satker...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Menampilkan {filteredOrgs.length} data terstruktur
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Nama Instansi</th>
                <th className="py-3 px-4">Kode Satker</th>
                <th className="py-3 px-4">Kode Org</th>
                <th className="py-3 px-4">Wilayah</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Tidak ada data organisasi untuk kategori {activeSubTab.toUpperCase()}.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  const parentOrg = organizations.find((o) => o.id === org.parentId);
                  return (
                    <tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{org.name}</div>
                        {parentOrg && (
                          <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                            <span>Induk:</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {parentOrg.name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {org.kodeSatker}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {org.organizationCode}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{org.city ? `${org.city}, ` : ''}{org.province}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleStatus(org.id)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            org.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                          }`}
                        >
                          {org.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{org.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setDetailModalOpen(true);
                            }}
                            title="Detail Organisasi"
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Tambah {formData.organizationType.toUpperCase()} Baru
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formData.organizationType !== 'kanwil' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Instansi Induk (Parent)
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                  >
                    {organizations
                      .filter((o) =>
                        formData.organizationType === 'kemenag' ? o.organizationType === 'kanwil' : o.organizationType === 'kemenag'
                      )
                      .map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name} ({parent.kodeSatker})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nama Instansi / Madrasah
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kemenag Kabupaten Banjar / MAN 1 Banjar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Kode Satker
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kodeSatker}
                    onChange={(e) => setFormData({ ...formData, kodeSatker: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Kode Organisasi
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organizationCode}
                    onChange={(e) => setFormData({ ...formData, organizationCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Kabupaten / Kota
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Barabai / Banjarmasin"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md"
                >
                  Simpan Organisasi
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {detailModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                  {selectedOrg.organizationType}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">{selectedOrg.name}</h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Satker:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedOrg.kodeSatker}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Organisasi:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedOrg.organizationCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Wilayah:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedOrg.city ? `${selectedOrg.city}, ` : ''}{selectedOrg.province}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold ${selectedOrg.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedOrg.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
