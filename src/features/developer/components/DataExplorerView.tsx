import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  MoreVertical,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Settings2,
} from 'lucide-react';
import { CollectionRegistry } from '@/core/registry/CollectionRegistry';
import { GenericCollectionService } from '@/services/GenericCollectionService';
import { getSecurityContext } from '@/core/security/contextHelper';

interface DataExplorerProps {
  collectionName: string;
  onItemClick?: (item: any) => void;
  onAddClick?: () => void;
}

export const DataExplorerView: React.FC<DataExplorerProps> = ({
  collectionName,
  onItemClick,
  onAddClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  );

  const metadata = useMemo(() => CollectionRegistry.get(collectionName), [collectionName]);
  const securityContext = useMemo(() => getSecurityContext(), []);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['collection', collectionName, securityContext.tenantId],
    queryFn: () => GenericCollectionService.getData(collectionName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    let result = [...data];

    // 1. Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((item) => JSON.stringify(item).toLowerCase().includes(lowerSearch));
    }

    // 2. Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  if (!metadata) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <Settings2 className="w-12 h-12 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-700">Koleksi Tidak Ditemukan</h3>
        <p className="text-sm text-slate-400">
          Koleksi "{collectionName}" belum terdaftar dalam registry.
        </p>
      </div>
    );
  }

  const canCreate =
    (securityContext.permissions as any)?.has?.(metadata.permissions.create) ||
    (Array.isArray(securityContext.permissions) && securityContext.permissions.includes(metadata.permissions.create as any)) ||
    securityContext.role === 'developer';

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header / Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <metadata.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-none tracking-tight">
              {metadata.label}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
              {filteredData.length} records found
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          {canCreate && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {metadata.fields
                  .filter((f) => !f.hidden)
                  .map((field) => (
                    <th key={field.key} className="px-4 py-3" style={{ width: field.width }}>
                      <div
                        className={`flex items-center gap-1 ${field.sortable ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                        onClick={() => {
                          if (!field.sortable) return;
                          setSortConfig((prev) => ({
                            key: field.key,
                            direction:
                              prev?.key === field.key && prev.direction === 'asc' ? 'desc' : 'asc',
                          }));
                        }}
                      >
                        {field.label}
                        {field.sortable && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                  ))}
                <th className="px-4 py-3 text-right w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <tr>
                    <td colSpan={metadata.fields.length + 1} className="py-20 text-center">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-20" />
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, idx) => (
                    <motion.tr
                      key={
                        item[metadata.primaryKey]
                          ? `${item[metadata.primaryKey]}-${idx}`
                          : `row-${idx}`
                      }
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => onItemClick?.(item)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      {metadata.fields
                        .filter((f) => !f.hidden)
                        .map((field) => (
                          <td
                            key={field.key}
                            className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300"
                          >
                            {renderCell(field, item)}
                          </td>
                        ))}
                      <td className="px-4 py-3 text-right">
                        <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>

          {!isLoading && paginatedData.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-2">
              <FileText className="w-10 h-10 text-slate-200" />
              <p className="text-sm font-bold text-slate-400">Tidak ada data untuk ditampilkan</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          Page {page} of {Math.ceil(filteredData.length / pageSize) || 1}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * pageSize >= filteredData.length}
            className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const renderCell = (field: any, item: any) => {
  const value = item[field.key];

  if (field.render) return field.render(value, item);

  switch (field.type) {
    case 'avatar':
      return (
        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
          <img
            src={
              value ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName || item.namaLengkap || 'U')}&background=random`
            }
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      );
    case 'badge':
      const option = field.options?.find((o: any) => o.value === value);
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${option?.color || 'bg-slate-100 text-slate-600'}`}
        >
          {option?.label || value || '-'}
        </span>
      );
    case 'date':
      return value ? new Date(value).toLocaleDateString('id-ID') : '-';
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return value?.toString() || '-';
  }
};
