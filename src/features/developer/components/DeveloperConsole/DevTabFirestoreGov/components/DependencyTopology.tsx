import React from 'react';

/**
 * DEPENDENCY TOPOLOGY COMPONENT
 * 
 * Modul untuk memvisualisasikan relasi bertingkat antara koleksi Firestore.
 * Membantu memahami cascade isolasi tenant dan ketergantungan data referensial.
 */

export const DependencyTopology: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#0B1124] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-white">Database Dependency Topology</h3>
        <p className="text-[9px] text-slate-400">Enterprise relational graph modeling parent-child cascades of Firestore Collections</p>
      </div>

      <div className="space-y-4">
        {/* Topology Node Group 1 */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h4 className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider">Tenant Partition Cascade</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-[#0E152B] rounded-xl border border-indigo-500/10 text-center font-bold text-[10px]">
              <p className="text-slate-400 text-[8px] uppercase font-bold">Root Parent</p>
              <p className="text-slate-800 dark:text-white mt-0.5 font-mono">tenants</p>
            </div>
            <div className="p-3 bg-white dark:bg-[#0E152B] rounded-xl border border-slate-100 dark:border-slate-800/80 text-center text-[10px] flex flex-col justify-center">
              <p className="text-slate-400 text-[8px] uppercase">Child Node</p>
              <p className="text-slate-800 dark:text-white mt-0.5 font-mono">users</p>
            </div>
            <div className="p-3 bg-white dark:bg-[#0E152B] rounded-xl border border-slate-100 dark:border-slate-800/80 text-center text-[10px] flex flex-col justify-center">
              <p className="text-slate-400 text-[8px] uppercase">Child Node</p>
              <p className="text-slate-800 dark:text-white mt-0.5 font-mono">students</p>
            </div>
            <div className="p-3 bg-white dark:bg-[#0E152B] rounded-xl border border-slate-100 dark:border-slate-800/80 text-center text-[10px] flex flex-col justify-center">
              <p className="text-slate-400 text-[8px] uppercase">Child Node</p>
              <p className="text-slate-800 dark:text-white mt-0.5 font-mono">attendance</p>
            </div>
          </div>
        </div>

        {/* Topology Node Group 2 */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h4 className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">Student Relational Cascade</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-[#0E152B] rounded-xl border border-amber-500/10 text-center font-bold text-[10px]">
              <p className="text-slate-400 text-[8px] uppercase font-bold">Root Parent</p>
              <p className="text-slate-800 dark:text-white mt-0.5 font-mono">students</p>
            </div>
            <div className="p-3 bg-white dark:bg-[#0E152B] rounded-xl border border-slate-100 dark:border-slate-800/80 text-center text-[10px] flex flex-col justify-center">
              <p className="text-slate-400 text-[8px] uppercase">Child Node</p>
              <p className="text-slate-800 dark:text-white mt-0.5 font-mono">attendance</p>
            </div>
            <div className="p-3 bg-white dark:bg-[#0E152B] rounded-xl border border-slate-100 dark:border-slate-800/80 text-center text-[10px] flex flex-col justify-center">
              <p className="text-slate-400 text-[8px] uppercase">Child Node</p>
              <p className="text-slate-800 dark:text-white mt-0.5 font-mono">student_points</p>
            </div>
            <div className="p-3 bg-white dark:bg-[#0E152B] rounded-xl border border-indigo-500/10 text-center text-[10px] flex flex-col justify-center">
              <p className="text-slate-400 text-[8px] uppercase">Aggregation</p>
              <p className="text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono font-bold">student_point_summaries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exportable Mermaid Syntax */}
      <div>
        <span className="text-[8px] font-bold uppercase text-slate-400 block mb-1">Mermaid Graph Structure (Copy-Paste Compatible)</span>
        <pre className="text-[9px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-900 p-4 rounded-xl overflow-x-auto max-h-52 border border-slate-200/50 dark:border-slate-800">
          {`graph TD
  tenants --> users
  tenants --> teachers
  tenants --> students
  tenants --> attendance
  tenants --> letters
  tenants --> notifications

  students --> attendance
  students --> student_points
  students --> point_records
  students --> student_point_summaries`}
        </pre>
      </div>
    </div>
  );
};
