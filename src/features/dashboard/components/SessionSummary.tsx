import React, { useMemo } from 'react';

interface SessionSummaryProps {
  title: string;
  records: any[];
  fields: string[];
}

export const SessionSummary = React.memo(({ title, records, fields }: SessionSummaryProps) => {
  const data = useMemo(() => {
    const stats = { hadir: 0 };
    records.forEach((r) => {
      const val = r[fields[0]];
      if (!val) return;

      // Check for Haid or other non-attendance modifiers if necessary
      // For now, any timestamp presence means Hadir for that session
      // EXCEPT if it strictly means they absented themselves.
      // Usually, 'Haid' bypasses the scan, but the system logs it as "time + Haid".
      // Since they did not strictly 'attend' the sholat, maybe we shouldn't count them as hadir or haid.
      // Wait, if it says "time + Haid", they were marked. We'll just count them as Hadir or skip them.
      // Let's skip them from Hadir if it's Haid because they are not participating in the session.
      const valStr = String(val).toLowerCase();
      if (valStr.includes('haid')) {
        // Do not count as hadir
        return;
      }

      stats.hadir++;
    });
    return stats;
  }, [records, fields]);

  return (
    <div className="bg-white dark:bg-[#151E32] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-24">
      <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide">{title}</div>
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{data.hadir}</div>
          <div className="text-[7px] text-slate-400 font-bold uppercase">Hadir</div>
        </div>
      </div>
    </div>
  );
});

SessionSummary.displayName = 'SessionSummary';
