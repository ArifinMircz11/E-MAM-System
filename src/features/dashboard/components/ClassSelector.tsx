import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronRight } from '@/shared/Icons';
import type { ClassData } from '@/types';
import { useStudentStore } from '@/stores/studentStore';

interface ClassSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cls: ClassData) => void;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const classes = useStudentStore((state) => state.classes);

  const groupedClasses = useMemo(() => {
    const groups: { [key: string]: ClassData[] } = {};
    classes.forEach((cls) => {
      const level = cls.level || 'Lainnya';
      if (!groups[level]) groups[level] = [];
      groups[level].push(cls);
    });
    return Object.keys(groups)
      .sort()
      .map((level) => ({
        level,
        classes: groups[level].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [classes]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-full md:w-96 bg-white dark:bg-[#0B1121] z-50 p-6 flex flex-col shadow-2xl border-l border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pilih Kelas</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
              {groupedClasses.map((group) => (
                <div key={group.level}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                    Tingkat {group.level}
                  </h3>
                  <div className="space-y-1">
                    {group.classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => {
                          onSelect(cls);
                          onClose();
                        }}
                        className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm font-bold text-slate-700 dark:text-slate-300"
                      >
                        {cls.name}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ClassSelector;
