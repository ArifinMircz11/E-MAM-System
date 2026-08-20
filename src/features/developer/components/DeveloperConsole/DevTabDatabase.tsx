import React from 'react';
import {
  RectangleStackIcon,
  Search,
  PlusIcon,
  ArrowPathIcon,
  XCircleIcon,
  ChevronRightIcon,
  TrashIcon,
  PencilIcon,
  InfoIcon,
} from '@/shared/Icons';

interface DevTabDatabaseProps {
  TABEL_SISTEM: any[];
  selectedCollection: string | null;
  setSelectedCollection?: (col: string | null) => void;
  loadCollectionData: (colId: string) => Promise<void>;
  tableLoading: boolean;
  tableHeaders: string[];
  filteredTableData: any[];
  tableSearch?: string;
  setTableSearch?: (val: string) => void;
  handleOpenEdit: (doc: any) => void;
  deleteDocument: (docId: string) => void;
  handleOpenAdd?: () => void;
  setIsCustomCollectionModalOpen: (open: boolean) => void;
  onNavigate?: any;
  safeStringify?: any;
}

export const DevTabDatabase: React.FC<DevTabDatabaseProps> = ({
  TABEL_SISTEM,
  selectedCollection,
  setSelectedCollection,
  loadCollectionData,
  tableLoading,
  tableHeaders,
  filteredTableData,
  tableSearch,
  setTableSearch,
  handleOpenEdit,
  deleteDocument,
  handleOpenAdd,
  setIsCustomCollectionModalOpen,
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Collection Selector */}
      <div className="bg-slate-50 dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 p-2.5 flex items-center gap-2 overflow-x-auto custom-scrollbar bg-opacity-70 backdrop-blur-sm z-10 select-none shadow-sm shrink-0 whitespace-nowrap">
        <div className="text-[9px] font-bold uppercase text-indigo-500 dark:text-indigo-400 tracking-[0.15em] pl-1.5 flex items-center gap-1.5 shrink-0 font-sans">
          <RectangleStackIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Koleksi Utama :</span>
        </div>
        <div className="flex items-center gap-0">
          {TABEL_SISTEM.map((col) => {
            const isSelected = selectedCollection === col.id;
            return (
              <button
                key={col.id}
                onClick={() => loadCollectionData(col.id)}
                className={`px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1 active:scale-95 relative group ${
                  isSelected
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'
                }`}
              >
                <col.icon
                  className={`w-3 h-3 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : (col as any).color || 'text-slate-400'}`}
                />
                <span>{col.label}</span>
                {isSelected && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}
          <button
            onClick={() => setIsCustomCollectionModalOpen(true)}
            className="px-3 py-1.5 text-[9px] font-bold uppercase text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <PlusIcon className="w-3 h-3" /> Custom
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {!selectedCollection ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 animate-pulse">
              <RectangleStackIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Database Explorer Ready
              </h3>
              <p className="text-[10px] font-bold text-slate-400/60 uppercase mt-1 tracking-wider">
                Silahkan pilih koleksi di atas untuk mulai menjelajah.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Table Controls (Search, Add, etc.) */}
            <div className="bg-white dark:bg-[#0B1121] border-b border-slate-200 dark:border-slate-800 p-2 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 z-20">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search current grid..."
                    value={tableSearch}
                    onChange={(e) => (setTableSearch ? setTableSearch(e.target.value) : null)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg py-1.5 pl-8 pr-3 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  onClick={handleOpenAdd}
                  className="px-3 md:px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] md:text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 shadow-lg active:scale-90 transition-all whitespace-nowrap"
                >
                  <PlusIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">Insert Row</span>
                  <span className="sm:hidden">Add</span>
                </button>
                <button
                  onClick={() => loadCollectionData(selectedCollection || '')}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 active:scale-90 hover:text-indigo-600 transition-colors"
                >
                  <ArrowPathIcon
                    className={`w-4 h-4 ${tableLoading ? 'animate-spin text-indigo-500' : ''}`}
                  />
                </button>
                {setSelectedCollection && (
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 active:scale-90 hover:text-rose-500 transition-colors"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto relative custom-scrollbar bg-white dark:bg-[#0B1121]">
              {tableLoading ? (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-[1px]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        ></div>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 animate-pulse">
                      Syncing Kernel Records
                    </p>
                  </div>
                </div>
              ) : filteredTableData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50 p-8 grayscale">
                  <InfoIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Empty Recordset
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-[9px] font-bold text-slate-800 dark:text-slate-200 border-collapse table-fixed min-w-[800px]">
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800 shadow-sm">
                    <tr>
                      <th className="p-3 w-16 bg-slate-100 dark:bg-slate-900 text-center font-bold text-slate-500 border-r border-slate-200 dark:border-slate-800">
                        OPS
                      </th>
                      {tableHeaders.map((h) => (
                        <th
                          key={h}
                          className={`p-3 uppercase tracking-wider text-slate-500 font-bold border-r border-slate-200 dark:border-slate-800 ${h === 'id' ? 'w-40' : 'w-48'}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <ChevronRightIcon className="w-2.5 h-2.5 text-indigo-500" />
                            {h}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredTableData.map((row, idx) => (
                      <tr
                        key={row.id}
                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group"
                      >
                        <td className="p-2 text-center border-r border-slate-50 dark:border-slate-800/50">
                          <div className="flex items-center justify-center gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEdit(row)}
                              className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteDocument(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        {tableHeaders.map((h) => {
                          const val = row[h];
                          let displayVal = String(val);
                          if (val && typeof val === 'object' && val.seconds !== undefined) {
                            displayVal = new Date(val.seconds * 1000).toLocaleString();
                          } else if (typeof val === 'object') {
                            displayVal = JSON.stringify(val);
                          }

                          return (
                            <td
                              key={h}
                              className={`p-3 font-medium border-r border-slate-50 dark:border-slate-800/50 ${h === 'id' ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/5 dark:bg-indigo-900/5' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                              <div className="truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:bg-white dark:group-hover:bg-[#1e293b] group-hover:ring-1 group-hover:ring-indigo-500/50 group-hover:rounded-sm group-hover:px-1 group-hover:relative group-hover:z-10 group-hover:max-w-md transition-all">
                                {displayVal}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
