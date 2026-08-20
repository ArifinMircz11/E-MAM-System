import React from 'react';
import {
  RectangleStackIcon,
  ArrowDownTrayIcon,
  Search,
  PlusIcon,
  ArrowPathIcon,
  XCircleIcon,
  SparklesIcon,
} from '@/shared/Icons';
import { DevTabDatabase } from './DevTabDatabase';
import { DevActionButton } from './DevActionButton';
import { SchemaAuditPanel } from './SchemaAuditPanel';
import { useDevConsoleContext } from '../../context/DeveloperContext';

export const DevTabSchemaEngine: React.FC = () => {
  const dev = useDevConsoleContext() as any;
  const {
    handleForceSync,
    isSyncing,
    handleDownloadFirestoreSchemas,
    isDownloadingSchema,
    selectedCollection,
    tableSearch,
    setTableSearch,
    loadCollectionData,
    setSelectedCollection,
    TABEL_SISTEM,
    stats,
    filteredTableData,
    tableLoading,
    tableHeaders,
    onNavigate,
    handleOpenEdit,
    deleteDocument,
    safeStringify,
    setIsCustomCollectionModalOpen,
    handleOpenAdd,
    handleSelfHealingReset,
  } = dev;

  return (
    <div className="p-0.5 overflow-hidden h-full flex flex-col">
      <div className="p-4 overflow-y-auto">
        <SchemaAuditPanel />
      </div>
      <div className="bg-white dark:bg-[#0B1121] border-b border-slate-200 dark:border-slate-800 p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <RectangleStackIcon className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-slate-900 dark:text-white">
              Firestore Schema Explorer
            </h3>
            <p className="text-[8px] md:text-[9px] font-bold text-slate-500">
              Menganalisis koleksi dan metadata sistem.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 shrink-0">
          <DevActionButton
            label="Download Schema"
            icon={<ArrowDownTrayIcon className="w-3.5 h-3.5" />}
            variant="primary"
            onAction={handleDownloadFirestoreSchemas}
            disabled={isDownloadingSchema}
          />
          <DevActionButton
            label="Sync Firestore"
            icon={<ArrowPathIcon className="w-3.5 h-3.5" />}
            variant="success"
            onAction={handleForceSync}
            disabled={isSyncing}
          />
          <DevActionButton
            label="Self Healing"
            icon={<SparklesIcon className="w-3.5 h-3.5" />}
            variant="danger"
            onAction={handleSelfHealingReset}
            disabled={false}
          />

          {selectedCollection && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl shrink-0">
              <div className="relative w-32 md:w-44">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full bg-transparent border-none py-1 pl-7 pr-2 text-[9px] md:text-[10px] font-bold outline-none"
                />
              </div>
              <button
                onClick={handleOpenAdd}
                className="p-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 active:scale-90 transition-all"
                title="Insert Row"
              >
                <PlusIcon className="w-3 h-3" />
                <span className="hidden md:inline ml-1">Insert</span>
              </button>
              <button
                onClick={() => loadCollectionData(selectedCollection)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-500 active:scale-90"
                title="Reload"
              >
                <ArrowPathIcon className="w-3 h-3" />
              </button>
              <button
                onClick={() => setSelectedCollection(null)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-500 active:scale-90"
                title="Close"
              >
                <XCircleIcon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collection Tabs selection strip */}
      <div className="bg-slate-50 dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 p-2 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 whitespace-nowrap">
        <div className="text-[8.5px] font-bold uppercase text-indigo-500 dark:text-indigo-400 tracking-[0.15em] pl-1.5 flex items-center gap-1.5 font-sans mr-2 border-r border-slate-200 dark:border-slate-800 pr-2">
          <RectangleStackIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Pilih Koleksi :</span>
        </div>
        {(TABEL_SISTEM || []).map((col: any) => {
          const isSelected = selectedCollection === col.id;
          return (
            <button
              key={col.id}
              onClick={() => loadCollectionData(col.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 active:scale-95 ${
                isSelected
                  ? 'bg-indigo-500/15 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'bg-white dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-100 dark:border-indigo-950/20'
              }`}
            >
              <col.icon
                className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : (col as any).color || 'text-slate-400'}`}
              />
              <span>{col.label}</span>
              {stats[col.id] !== undefined && (
                <span className="text-[7.5px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded">
                  {stats[col.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden relative">
        {selectedCollection ? (
          <DevTabDatabase
            selectedCollection={selectedCollection}
            setSelectedCollection={setSelectedCollection}
            TABEL_SISTEM={TABEL_SISTEM}
            loadCollectionData={loadCollectionData}
            setIsCustomCollectionModalOpen={setIsCustomCollectionModalOpen}
            filteredTableData={filteredTableData}
            tableLoading={tableLoading}
            tableHeaders={tableHeaders}
            onNavigate={onNavigate}
            handleOpenEdit={handleOpenEdit}
            deleteDocument={deleteDocument}
            safeStringify={safeStringify}
            tableSearch={tableSearch}
            setTableSearch={setTableSearch}
            handleOpenAdd={() => {}}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full gap-3 text-slate-400 select-none">
            <RectangleStackIcon className="w-16 h-16 text-indigo-500/20" />
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Koleksi Belum Dipilih
            </h4>
            <p className="text-[9px] max-w-sm leading-relaxed">
              Pilihlah salah satu koleksi database sistem di atas untuk menelusuri data mentah,
              memasukkan baris baru, memperbarui entri, atau menghapusnya.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
