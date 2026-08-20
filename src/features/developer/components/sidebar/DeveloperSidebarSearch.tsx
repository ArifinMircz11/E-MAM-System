import React from 'react';
import { Search, X } from 'lucide-react';

export interface DeveloperSidebarSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export const DeveloperSidebarSearch: React.FC<DeveloperSidebarSearchProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
}) => {
  return (
    <div className="my-3 px-1">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-3 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari menu developer..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2 pl-8 pr-7 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-2.5 text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer"
            title="Bersihkan pencarian"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
