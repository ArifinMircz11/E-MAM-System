import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from '@/shared/Icons';

/**
 * ATTENDANCE SIMULATION TABLE COMPONENT
 * 
 * Modul untuk memantau data kehadiran siswa secara luring di Dexie.
 * Memungkinkan pengembang melakukan audit visual terhadap proses sinkronisasi QR scanner.
 */

interface AttendanceSimulationTableProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedClassId: string;
  handleClassChange: (classId: string) => void;
  classesList: any[];
  classStudents: any[];
  attendanceRecords: any[];
  isTableLoading: boolean;
  setShowAttendanceTable: (show: boolean) => void;
  selectedClassName?: string;
}

export const AttendanceSimulationTable: React.FC<AttendanceSimulationTableProps> = ({
  selectedDate,
  setSelectedDate,
  selectedClassId,
  handleClassChange,
  classesList,
  classStudents,
  attendanceRecords,
  isTableLoading,
  setShowAttendanceTable,
  selectedClassName
}) => {

  const renderSessionBadge = (session: any) => {
    if (!session) {
      return (
        <div className="flex flex-col items-center justify-center opacity-10">
          <Icons.MinusIcon className="w-3 h-3 text-slate-500" />
        </div>
      );
    }

    const timeStr = session.scannedAt
      ? new Date(session.scannedAt).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--:--';

    return (
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-white font-mono">{timeStr}</span>
        <span className="text-[7px] font-bold text-slate-500 uppercase ">
          {session.status || 'Hadir'}
        </span>
      </div>
    );
  };

  const alreadyScannedCount = classStudents.filter((s) =>
    attendanceRecords.some((r) => r.studentsId === s.idUnik),
  ).length;

  const haidCount = attendanceRecords.filter((r) => r.isHaid || r.statusGlobal === 'Haid').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1100] flex items-center justify-center p-4 md:p-6 pointer-events-auto text-white"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="bg-slate-900/95 border border-indigo-500/20 w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl shadow-black text-slate-100"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Icons.TablePropertiesIcon className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold lowercase tracking-wider text-indigo-400 font-mono">
                tabel kehadiran kelas (simulasi)
              </h3>
            </div>
            <p className="text-[9px] text-slate-400 lowercase mt-1 font-mono">
              memantau presensi luring (dexie cache) per rombel
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-indigo-500/50"
            />

            {classesList.length > 0 ? (
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-indigo-500/50 font-bold"
              >
                {classesList.map((c, index) => (
                  <option
                    key={c.classId || `class-${index}`}
                    value={c.classId}
                    className="bg-slate-950 text-white font-bold"
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl lowercase">
                belum ada kelas
              </div>
            )}

            <button
              onClick={() => setShowAttendanceTable(false)}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {classStudents.length > 0 && (
          <div className="px-6 md:px-8 py-3 bg-white/[0.02] border-b border-white/5 shrink-0 grid grid-cols-4 gap-2 text-center text-slate-100">
            <div className="bg-white/5 rounded-xl py-2 px-3 border border-white/5 flex flex-col">
              <span className="text-[8px] font-bold text-slate-400 lowercase">total siswa</span>
              <span className="text-sm font-bold text-white font-mono">{classStudents.length}</span>
            </div>
            <div className="bg-emerald-500/5 rounded-xl py-2 px-3 border border-emerald-500/10 flex flex-col">
              <span className="text-[8px] font-bold text-emerald-400/60 lowercase">sudah scan</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{alreadyScannedCount}</span>
            </div>
            <div className="bg-amber-500/5 rounded-xl py-2 px-3 border border-amber-500/10 flex flex-col">
              <span className="text-[8px] font-bold text-amber-400/60 lowercase">belum scan</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{classStudents.length - alreadyScannedCount}</span>
            </div>
            <div className="bg-indigo-500/5 rounded-xl py-2 px-3 border border-indigo-500/10 flex flex-col">
              <span className="text-[8px] font-bold text-indigo-400/60 lowercase">haid (tidak shalat)</span>
              <span className="text-sm font-bold text-indigo-400 font-mono">{haidCount}</span>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {isTableLoading ? (
            <div className="h-48 flex items-center justify-center gap-2">
              <Icons.Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-[10px] font-bold lowercase tracking-wide text-slate-400 animate-pulse">
                loading dexie records...
              </span>
            </div>
          ) : classStudents.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-1">
              <span className="text-2xl">👥</span>
              <p className="text-[10px] font-bold uppercase text-slate-700 dark:text-white">tidak ada siswa</p>
              <p className="text-[8px] text-slate-400 font-mono">rombel ini belum memiliki siswa yang terdaftar di local cache.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[8px] font-bold tracking-wider text-slate-400 lowercase font-mono">
                    <th className="py-3 px-4">siswa</th>
                    <th className="py-3 px-4 text-center">subuh/masuk</th>
                    <th className="py-3 px-4 text-center">duha</th>
                    <th className="py-3 px-4 text-center">zuhur</th>
                    <th className="py-3 px-4 text-center">ashar</th>
                    <th className="py-3 px-4 text-center">pulang</th>
                    <th className="py-3 px-4 text-right">status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {classStudents
                    .sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap))
                    .map((student, index) => {
                      const record = attendanceRecords.find((r) => r.studentsId === student.idUnik);
                      return (
                        <tr key={`${student.id || student.idUnik || 'std'}-${index}`} className="hover:bg-white/[0.01] transition-colors text-[10px]">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold lowercase text-slate-300">
                                {student.namaLengkap.charAt(0).toLowerCase()}
                              </div>
                              <div>
                                <p className="font-extrabold text-white lowercase leading-tight">{student.namaLengkap}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[7px] font-mono text-white/30 lowercase">{student.idUnik}</span>
                                  <span className="text-[7px] font-mono text-white/30 uppercase">• {student.jenisKelamin}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">{renderSessionBadge(record?.sessions?.masuk)}</td>
                          <td className="py-3.5 px-4 text-center">{renderSessionBadge(record?.sessions?.duha)}</td>
                          <td className="py-3.5 px-4 text-center">{renderSessionBadge(record?.sessions?.zuhur)}</td>
                          <td className="py-3.5 px-4 text-center">{renderSessionBadge(record?.sessions?.ashar)}</td>
                          <td className="py-3.5 px-4 text-center">{renderSessionBadge(record?.sessions?.pulang)}</td>
                          <td className="py-3.5 px-4 text-right">
                            {record ? (
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold lowercase tracking-wider ${record.statusGlobal === 'Haid' || record.isHaid ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : record.statusGlobal === 'Terlambat' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>
                                {record.statusGlobal.toLowerCase()}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-bold text-white/20 bg-white/5 border border-white/5 lowercase">belum scan</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 shrink-0 flex items-center justify-between text-[8px] text-white/30 lowercase font-mono">
          <span>dexie cache: {classStudents.length} siswa loaded</span>
          <span>{selectedClassName || '-'} • {selectedDate}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
