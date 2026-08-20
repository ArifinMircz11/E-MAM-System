import React, { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ClassAttendanceCard } from './ClassAttendanceCard';
import { useStudentStore } from '@/stores/studentStore';
import SmartFilterBar from './SmartFilterBar';
import ClassSelector from './ClassSelector';

export const ClassAttendanceGrid = ({ classesData, onSelectClass }: any) => {
  const [filter, setFilter] = useState('Semua');
  const selectedClass = useStudentStore((state) => state.selectedClass);
  const setSelectedClass = useStudentStore((state) => state.setSelectedClass);
  const [isClassSelectorOpen, setIsClassSelectorOpen] = useState(false);

  const levels = ['Semua', '10', '11', '12'];
  const parentRef = useRef(null);

  const filteredClasses = (classesData || []).filter((c: any) => {
    if (!c) return false;
    const nameStr = c.name || '';
    return filter === 'Semua'
      ? true
      : nameStr.startsWith(filter) || String(c.level || '') === filter;
  });

  const rowVirtualizer = useVirtualizer({
    count: filteredClasses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  return (
    <div className="flex flex-col gap-1.5 animate-in slide-in-from-bottom-4 duration-500">
      <SmartFilterBar
        selectedClass={selectedClass}
        onOpenClassSelector={() => setIsClassSelectorOpen(true)}
      />
      <ClassSelector
        isOpen={isClassSelectorOpen}
        onClose={() => setIsClassSelectorOpen(false)}
        onSelect={(cls: any) => {
          setSelectedClass(cls);
          onSelectClass(cls);
        }}
      />

      <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-0.5 scrollbar-hide px-2">
        <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          {levels.map((lv) => (
            <button
              key={lv}
              onClick={() => setFilter(lv)}
              className={`px-3 py-1 rounded-lg text-[8px] font-extrabold tracking-widest transition-all ${
                filter === lv
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={`Filter Tingkat ${lv}`}
            >
              {lv}
            </button>
          ))}
        </div>
      </div>

      <div ref={parentRef} className="h-[500px] overflow-auto scrollbar-hide">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="px-2 pb-1.5"
            >
              <ClassAttendanceCard
                c={filteredClasses[virtualRow.index]}
                onClick={() => onSelectClass(filteredClasses[virtualRow.index])}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
