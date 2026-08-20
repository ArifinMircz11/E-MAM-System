import React from 'react';
import { CheckCircleIcon, UserIcon, PlusIcon } from '@/shared/Icons';

export const DEFAULT_TIME_SLOTS = [
  { period: 1, time: '07:30 - 08:15', isBreak: false },
  { period: 2, time: '08:15 - 09:00', isBreak: false },
  { period: 3, time: '09:00 - 09:45', isBreak: false },
  { period: 'break1', time: '09:45 - 10:00', subject: 'ISTIRAHAT', isBreak: true },
  { period: 4, time: '10:00 - 10:45', isBreak: false },
  { period: 5, time: '10:45 - 11:30', isBreak: false },
  { period: 6, time: '11:30 - 12:15', isBreak: false },
  { period: 'break2', time: '12:15 - 12:30', subject: 'ISTIRAHAT', isBreak: true },
  { period: 7, time: '12:30 - 13:15', isBreak: false },
  { period: 8, time: '13:15 - 14:00', isBreak: false },
  { period: 9, time: '14:00 - 14:45', isBreak: false },
  { period: 10, time: '14:45 - 15:30', isBreak: false },
  { period: 11, time: '15:30 - 16:15', isBreak: false },
];

export const ScheduleTimeline = ({
  schedules,
  onSlotClick,
  userRole,
}: {
  schedules: any[];
  onSlotClick: (slot: any) => void;
  userRole?: string;
}) => {
  const now = new Date();
  const currentTimeString =
    now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  const staffRoles = [
    'admin',
    'developer',
    'kepala_madrasah',
    'wakamad',
    'kepala_tu',
    'guru',
    'guru_bk',
    'wali_kelas',
    'staf',
    'pustakawan',
    'laboran',
    'gtk',
    'kurikulum',
    'piket',
    'kesiswaan',
    'humas',
    'pembina_ekskul',
    'ketua_kelas',
  ];
  const isGuru = userRole && staffRoles.includes(userRole);

  return (
    <div className="relative pl-6 pb-6 space-y-1.5">
      <div className="absolute left-3 top-2 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800/50"></div>

      {DEFAULT_TIME_SLOTS.map((slot, idx) => {
        const filledData = schedules.find((s) => s.time === slot.time);
        const isBreak = slot.isBreak;
        const isNow =
          currentTimeString >= slot.time.split(' - ')[0] &&
          currentTimeString <= slot.time.split(' - ')[1];
        const subject = filledData ? filledData.subject : isBreak ? slot.subject : 'Slot Kosong';
        const teacher = filledData ? filledData.teacherName || filledData.teacher : null;
        const isLocked = filledData ? filledData.isLocked : false;
        const canEdit = !isBreak && isGuru && !isLocked;

        return (
          <div key={idx} className="relative group">
            {/* Titik Timeline */}
            <div
              className={`absolute -left-[20px] top-3.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#020617] transition-all duration-500 z-10 ${
                isNow
                  ? 'bg-emerald-500 ring-2 ring-emerald-500/20 scale-125'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            ></div>

            <div
              onClick={() => {
                if (canEdit || (isGuru && !isBreak)) onSlotClick({ ...slot, filledData });
              }}
              className={`p-3 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                isBreak
                  ? 'bg-slate-50/30 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800/30 py-2'
                  : filledData
                    ? 'bg-white dark:bg-[#151E32] border-slate-100 dark:border-slate-800 shadow-sm'
                    : 'bg-white/20 dark:bg-[#151E32]/20 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-300'
              } ${isNow ? 'ring-1 ring-emerald-500 border-emerald-500/30' : ''}`}
            >
              <div className="flex justify-between items-center">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold   ${
                        isBreak
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30'
                      }`}
                    >
                      {slot.time}
                    </span>
                    {typeof slot.period === 'number' && (
                      <span className="text-[8px] font-bold text-slate-300 uppercase">
                        #{slot.period}
                      </span>
                    )}
                    {isLocked && <CheckCircleIcon className="w-2.5 h-2.5 text-emerald-500" />}
                  </div>

                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <h4
                      className={`text-xs font-bold uppercase truncate ${
                        isBreak
                          ? 'text-slate-400 italic font-medium'
                          : filledData
                            ? 'text-slate-800 dark:text-slate-100'
                            : 'text-slate-300'
                      }`}
                    >
                      {subject}
                    </h4>

                    {teacher && (
                      <div className="flex items-center gap-1 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700">
                        <UserIcon className="w-2 h-2 text-slate-400" />
                        <p className="text-[7px] font-bold text-slate-500 uppercase truncate max-w-[80px]">
                          {teacher.split(' ')[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {!filledData && !isBreak && isGuru && (
                  <button className="w-6 h-6 rounded-lg bg-indigo-600 text-white shadow-sm flex items-center justify-center shrink-0 active:scale-90 ml-2">
                    <PlusIcon className="w-3 h-3" />
                  </button>
                )}

                {isNow && !isBreak && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
