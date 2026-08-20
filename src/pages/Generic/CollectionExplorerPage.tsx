import React from 'react';
import { DataExplorerView } from '@/features/developer/components/DataExplorerView';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface CollectionExplorerPageProps {
  collectionName: string;
  onBack: () => void;
  onOpenSidebar: () => void;
}

const CollectionExplorerPage: React.FC<CollectionExplorerPageProps> = ({
  collectionName,
  onBack,
  onOpenSidebar,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Top Bar for Generic View */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Data Explorer
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSidebar}
            className="p-2 lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <div className="w-4 h-4 flex flex-col justify-between items-end">
              <div className="w-full h-0.5 bg-slate-400 rounded-full" />
              <div className="w-2/3 h-0.5 bg-slate-400 rounded-full" />
              <div className="w-full h-0.5 bg-slate-400 rounded-full" />
            </div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <DataExplorerView
          collectionName={collectionName}
          onAddClick={() => {
            // Placeholder for generic add
            console.log(`Add new item to ${collectionName}`);
          }}
          onItemClick={(item) => {
            // Placeholder for generic edit
            console.log(`Edit item in ${collectionName}:`, item);
          }}
        />
      </div>
    </motion.div>
  );
};

export default CollectionExplorerPage;
