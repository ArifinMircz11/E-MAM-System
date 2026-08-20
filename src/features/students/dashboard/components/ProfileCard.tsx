import React from 'react';
import type { Student } from '@/types';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { getPlaceholderAvatar } from '@/utils/avatarHelper';

interface ProfileCardProps {
  student: Student | null;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ student }) => {
  if (!student) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-[340px] shrink-0 snap-start h-[215px] bg-[#0F172A] border border-indigo-500/10 rounded-[2.5rem] p-5 flex flex-col justify-between relative overflow-hidden group shadow-xl"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-center gap-4 flex-1">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center overflow-hidden border-2 border-indigo-500/20 shadow-sm">
            <img
              src={student.photoURL || getPlaceholderAvatar(student.namaLengkap || 'Siswa')}
              alt={student.namaLengkap}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-[#0F172A] flex items-center justify-center">
            <ShieldCheck className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-tight leading-tight truncate">
            {student.namaLengkap}
          </h2>
          <div className="mt-1 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-10 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                NISN
              </span>
              <span className="text-slate-350 dark:text-slate-300 font-mono ">
                {student.nisn || '-'}
              </span>
            </p>
            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-10 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                Kelas
              </span>
              <span className="text-indigo-400 font-extrabold">{student.tingkatRombel}</span>
            </p>
            <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 uppercase tracking-wide border border-emerald-500/10">
              {student.status || 'Aktif'}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[7.5px] font-bold text-indigo-450 dark:text-indigo-400 uppercase tracking-wide shrink-0 mt-1 flex justify-between border-t border-white/5 pt-2">
        <span>KARTU DIGITAL SISWA</span>
        <span>ID UNIK: {student.idUnik || '-'}</span>
      </div>
    </motion.div>
  );
};
