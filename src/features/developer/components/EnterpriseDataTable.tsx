import React from 'react';
import { EnterpriseEmptyState } from './EnterpriseEmptyState';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface EnterpriseDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onAddEmpty?: () => void;
}

export function EnterpriseDataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyTitle,
  emptyDescription,
  onAddEmpty,
}: EnterpriseDataTableProps<T>) {
  if (!loading && data.length === 0) {
    return (
      <EnterpriseEmptyState
        title={emptyTitle}
        description={emptyDescription}
        onAction={onAddEmpty}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-[#0B1121] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0B1121]/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
              >
                {columns.map((col, idx) => {
                  const content =
                    typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode);

                  return (
                    <td
                      key={idx}
                      className={`px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 ${
                        col.className || ''
                      }`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
