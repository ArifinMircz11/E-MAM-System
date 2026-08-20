import React, { useState } from 'react';
import { useOrganizations } from '@/hooks/useTenants';
import type { TenantData } from '@/types';
import {
  PlusIcon,
  PencilSquareIcon,
  PowerIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  Square2StackIcon,
  ArrowDownOnSquareIcon,
  ArrowUpOnSquareIcon,
  ChartBarIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import TenantFormModal from './TenantFormModal';
import CloneTenantModal from './CloneTenantModal';

const OrganizationManagement: React.FC = () => {
  const { organizations, isLoading, isSubmitting, refresh, setStatus, reset } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<TenantData | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const filteredOrganizations = organizations.filter(
    (t) =>
      t.identitas.namaMadrasah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleEdit = (organization: TenantData) => {
    setSelectedOrganization(organization);
    setIsFormModalOpen(true);
  };

  const handleCloneInit = (organization: TenantData) => {
    setSelectedOrganization(organization);
    setIsCloneModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Inactive':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'Suspended':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#020617] overflow-hidden">
      {/* Header */}
      <header className="px-6 py-8 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight uppercase">
              Tenant Madrasah
            </h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1 tracking-wide">
              Enterprise Console & Infrastructure Manager
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedOrganization(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-[0_8px_24px_rgba(79,70,229,0.25)] transition-all active:scale-95 text-xs font-bold uppercase tracking-wider"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Madrasah
          </button>
        </div>

        <div className="mt-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari NPSN, Nama Madrasah, atau ID Tenant..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 transition-all"
          >
            <ArrowPathIcon
              className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin text-indigo-500' : ''}`}
            />
          </button>
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-auto px-6 py-6 custom-scrollbar">
        {isLoading && organizations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin opacity-40 mb-4" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[.2em]">
              Memuat Infrastruktur Tenant...
            </p>
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <MagnifyingGlassIcon className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase">
              Tidak ada tenant ditemukan
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">
              Coba gunakan kata kunci pencarian lain
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrganizations.map((organization, index) => (
              <motion.div
                layout
                key={`${organization.id || 'organization'}-${index}`}
                className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/50 p-6 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wide ${getStatusColor(organization.status)}`}
                  >
                    {organization.status}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveActionId(activeActionId === organization.id ? null : organization.id!)
                      }
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                    </button>

                    <AnimatePresence>
                      {activeActionId === organization.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-3 z-50 flex flex-col gap-1"
                        >
                          <button
                            onClick={() => {
                              handleEdit(organization);
                              setActiveActionId(null);
                            }}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wide transition-colors"
                          >
                            <PencilSquareIcon className="w-4 h-4 text-indigo-500" />
                            Edit Madrasah
                          </button>
                          <button
                            onClick={() => {
                              setStatus(organization.id!, 'Active');
                              setActiveActionId(null);
                            }}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wide transition-colors"
                          >
                            <PowerIcon className="w-4 h-4 text-emerald-500" />
                            Aktivasi
                          </button>
                          <button
                            onClick={() => {
                              setStatus(organization.id!, 'Inactive');
                              setActiveActionId(null);
                            }}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wide transition-colors"
                          >
                            <NoSymbolIcon className="w-4 h-4 text-slate-400" />
                            Nonaktifkan
                          </button>
                          <button
                            onClick={() => {
                              setStatus(organization.id!, 'Suspended');
                              setActiveActionId(null);
                            }}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wide transition-colors"
                          >
                            <NoSymbolIcon className="w-4 h-4 text-rose-500" />
                            Suspend
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-4" />
                          <button
                            onClick={() => {
                              reset(organization.id!);
                              setActiveActionId(null);
                            }}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wide transition-colors"
                          >
                            <ArrowPathIcon className="w-4 h-4 text-orange-500" />
                            Reset Tenant
                          </button>
                          <button
                            onClick={() => {
                              handleCloneInit(organization);
                              setActiveActionId(null);
                            }}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wide transition-colors"
                          >
                            <Square2StackIcon className="w-4 h-4 text-purple-500" />
                            Clone Tenant
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase leading-tight line-clamp-2">
                    {organization.identitas.namaMadrasah}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-lg">
                      {organization.id}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 capitalize">
                      {organization.identitas.npsn || 'NPSN BELUM DISET'}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mb-6 h-8 italic">
                  {organization.identitas.alamat || 'Alamat belum dilengkapi...'}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="space-y-1">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                      Tahun Ajaran
                    </span>
                    <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-200">
                      {organization.konfigurasiSistem.tahunAjaranAktif}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                      Semester
                    </span>
                    <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-200">
                      {organization.konfigurasiSistem.semesterAktif}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4">
                  <div className="flex items-center gap-3">
                    <button
                      title="Backup"
                      className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <ArrowDownOnSquareIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Restore"
                      className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <ArrowUpOnSquareIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Monitoring"
                      className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <ChartBarIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Riwayat"
                      className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-600 hover:text-white transition-all"
                    >
                      <ClockIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TenantFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        tenant={selectedOrganization}
        isSubmitting={isSubmitting}
      />

      <CloneTenantModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        sourceTenant={selectedOrganization}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default OrganizationManagement;
