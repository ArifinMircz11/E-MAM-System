import React from 'react';
import { CheckCircleIcon } from '@/shared/Icons';
import type { LetterRequest } from '@/types';

interface WorkflowTimelineProps {
  letter: LetterRequest;
  isTU: boolean;
  isValidator: boolean;
  isSigner: boolean;
}

interface TimelineItemProps {
  label: string;
  active: boolean;
  completed: boolean;
  date?: string;
  actor?: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  label,
  active,
  completed,
  date,
  actor,
}) => (
  <div className="flex gap-4 min-h-[60px]">
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${
          completed
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : active
              ? 'bg-white border-indigo-600 text-indigo-600 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-300'
        }`}
      >
        {completed ? (
          <CheckCircleIcon className="w-4 h-4" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-current"></div>
        )}
      </div>
      <div className={`w-0.5 flex-1 ${completed ? 'bg-indigo-600' : 'bg-slate-200'} my-1`}></div>
    </div>
    <div className={`pb-6 ${completed || active ? 'opacity-100' : 'opacity-50'}`}>
      <p className="text-xs font-bold tracking-wider">{label}</p>
      {completed && actor && <p className="text-[10px] text-slate-500">Oleh: {actor}</p>}
      {completed && date && (
        <p className="text-[9px] text-slate-400">
          {new Date(date).toLocaleDateString()} {new Date(date).toLocaleTimeString().slice(0, 5)}
        </p>
      )}
    </div>
  </div>
);

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  letter,
  isTU,
  isValidator,
  isSigner,
}) => {
  return (
    <div className="border-t border-b border-slate-100 dark:border-slate-800 py-6">
      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">
        Status Workflow
      </h5>
      <div className="relative">
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800 -z-10"></div>

        <TimelineItem
          label="Pengajuan Masuk"
          active={false}
          completed={true}
          date={letter.date}
          actor={letter.userName}
        />
        <TimelineItem
          label="Diproses Admin"
          active={letter.status === 'Pending'}
          completed={['Proses', 'Verified', 'Validated', 'Signed'].includes(letter.status)}
        />
        <TimelineItem
          label="Verifikasi Tata Usaha"
          active={letter.status === 'Proses'}
          completed={['Verified', 'Validated', 'Signed'].includes(letter.status)}
          date={letter.verifiedAt}
          actor={letter.verifiedBy || (isTU ? 'Menunggu Anda' : 'Staf TU')}
        />
        <TimelineItem
          label="Validasi Pimpinan (Waka)"
          active={letter.status === 'Verified'}
          completed={['Validated', 'Signed'].includes(letter.status)}
          date={letter.validatedAt}
          actor={letter.validatedBy || (isValidator ? 'Menunggu Anda' : 'Waka Bidang')}
        />
        <TimelineItem
          label="Tanda Tangan Kepala"
          active={letter.status === 'Validated'}
          completed={letter.status === 'Signed'}
          date={letter.signedAt}
          actor={letter.signedBy || (isSigner ? 'Menunggu Anda' : 'Kepala Madrasah')}
        />
      </div>
    </div>
  );
};

export default WorkflowTimeline;
