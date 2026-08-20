import React, { useState, useEffect, useRef } from 'react';
import { Search, X, GraduationCap, UserCheck, BookOpen, Clock, Zap } from 'lucide-react';
import { useLocalSearch } from '@/hooks/useLocalSearch';
import type { SearchResultItem } from '@/services/LocalSearchService';

interface LocalSearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity?: (item: SearchResultItem) => void;
}

export const LocalSearchPalette: React.FC<LocalSearchPaletteProps> = ({
  isOpen,
  onClose,
  onSelectEntity,
}) => {
  const { query, setQuery, entityType, setEntityType, result, isLoading } = useLocalSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [result.items]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 md:pt-24 px-4 animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Search Header Input */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3 bg-slate-950/50">
          <Search className="w-5 h-5 text-indigo-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari siswa, guru, atau kelas (offline-first Dexie index)..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors mr-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Filter Tabs & Telemetry metrics */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            {(['all', 'student', 'teacher', 'class'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setEntityType(t)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  entityType === t
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {t === 'all' ? 'Semua' : t === 'student' ? 'Siswa' : t === 'teacher' ? 'Guru' : 'Kelas'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400" title="Dexie Indexed Local Query Speed">
              <Zap className="w-3 h-3" />
              {result.durationMs}ms
            </span>
            <span>{result.totalCount} hasil</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5">
          {isLoading && (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse font-mono">
              Memindai indeks lokal Dexie...
            </div>
          )}

          {!isLoading && result.items.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              {query ? 'Tidak ditemukan data yang cocok dengan kueri.' : 'Ketik untuk mulai pencarian lokal cepat...'}
            </div>
          )}

          {!isLoading &&
            result.items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectEntity?.(item);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                  selectedIndex === idx
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      item.type === 'student'
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : item.type === 'teacher'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {item.type === 'student' && <GraduationCap className="w-4 h-4" />}
                    {item.type === 'teacher' && <UserCheck className="w-4 h-4" />}
                    {item.type === 'class' && <BookOpen className="w-4 h-4" />}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span
                        className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.type === 'student'
                            ? 'bg-blue-500/20 text-blue-300'
                            : item.type === 'teacher'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{item.subtitle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950/40 px-2 py-1 rounded-lg border border-slate-800">
                    {item.meta}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-indigo-400" />
            Didukung oleh Dexie.js IndexedDB Engine (100% Offline Capable)
          </span>
          <span className="flex items-center gap-1">
            Tekan <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">ESC</kbd> untuk tutup
          </span>
        </div>

      </div>
    </div>
  );
};
