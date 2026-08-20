import React, { useState, useMemo } from 'react';
import { ViewState } from '@/types';
import { DEVELOPER_MENU_GROUPS } from '../../constants/menus';
import { filterMenuGroupsByRoleAndQuery } from '../../utils/menuMapper';
import { TenantContext } from '@/core/context/TenantContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Search, Squares2x2Icon } from '@/shared/Icons';

interface DevFeatureGridProps {
  onNavigate: (view: ViewState) => void;
}

export const DevFeatureGrid: React.FC<DevFeatureGridProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const security = TenantContext.getContext();
  const role = security.role;
  const permissions = Array.from(security.permissions || []) as string[];

  const groups = useMemo(() => {
    return filterMenuGroupsByRoleAndQuery(DEVELOPER_MENU_GROUPS, role, permissions, searchQuery);
  }, [role, permissions, searchQuery]);

  const renderIcon = (iconName: string) => {
    const IconComp = (LucideIcons as any)[iconName] || LucideIcons.Layers;
    return <IconComp className="w-6 h-6 text-indigo-500 group-hover:text-white transition-colors" />;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Squares2x2Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Grid Navigasi Developer Console
            </h2>
            <p className="text-xs text-slate-400">
              Pusat fitur engine & governance terstruktur berdasarkan hak akses peran aktif ({role})
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari modul atau alat dev..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </div>
      </div>

      {/* Grid Sections */}
      <div className="space-y-8">
        {groups.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
            <p className="text-sm font-medium text-slate-400">
              Tidak ada modul developer yang cocok dengan pencarian "{searchQuery}" atau izin akses Anda ({role}).
            </p>
          </div>
        ) : (
          groups.map((group, gIdx) => (
            <motion.div
              key={group.title || gIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: gIdx * 0.05 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 px-1">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {group.title}
                </h3>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {group.items.map((item, idx) => (
                  <motion.button
                    key={item.id || idx}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (item.viewState) {
                        onNavigate(item.viewState);
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-3 bg-slate-900/90 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all duration-200 cursor-pointer group text-left"
                    title={item.label}
                  >
                    <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-inner group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all">
                      {renderIcon(item.iconName)}
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-white leading-tight tracking-tight text-center line-clamp-2 w-full">
                      {item.label}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default DevFeatureGrid;
