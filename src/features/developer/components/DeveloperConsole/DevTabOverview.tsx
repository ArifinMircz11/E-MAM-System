import React from 'react';
import {
  MegaphoneIcon,
  SaveIcon,
  Loader2,
  SparklesIcon,
  ArrowPathIcon,
  RectangleStackIcon,
  ArrowDownTrayIcon,
  UserIcon,
  ShieldCheckIcon,
} from '@/shared/Icons';
import type { ViewState } from '@/types';
import { UserRole } from '@/types';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { useDevConsoleContext } from '../../context/DeveloperContext';

interface DevTabOverviewProps {
  onNavigate?: (view: ViewState) => void;
}

export const DevTabOverview: React.FC<DevTabOverviewProps> = ({
  onNavigate,
}) => {
  const dev = useDevConsoleContext();
  const {
    userRole,
    systemAlert,
    setSystemAlert,
    isSavingAlert,
    handleSaveAlert,
    featureToggles,
    isSavingFeatures,
    handleSaveFeatures,
    setShowScheduleReminder,
    incrementMasterVersion,
    handleDownloadFirestoreSchemas,
    isDownloadingSchema,
    testNumber,
    setTestNumber,
    testMessage,
    setTestMessage,
    sendTestWhatsApp,
    sendingTest,
    impersonateList,
    loadingImpersonate,
    fetchUsersForImpersonation,
    onImpersonate,
    clearMonth,
    setClearMonth,
    handleClearAttendanceByMonth,
    handleExportAttendancePDF,
    isRepairing,
    dummyClass,
    setDummyClass,
    dummyDate,
    setDummyDate,
    dummyDateEnd,
    setDummyDateEnd,
    dummySession,
    setDummySession,
    isGeneratingDummy,
    isMigrating,
    handleGenerateDummyStudents,
    handleGenerateDummyTeacherAttendance,
    handleGenerateDummyAttendance,
    handleDeleteDummyAttendance,
    handleGenerateRandomAttendance,
    handleGenerateRandomPoints,
    handleGenerateRandomHaid,
    handleGenerateRandomLetters,
    handleGenerateAhmadAlfareziHistory,
    generateDummyChats,
    generateDummyComplaints,
    executeDatabaseSchemaMigration,
    classes,
    addLog,
    logs,
    setLogs,
  } = dev;

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 space-y-6 overflow-y-auto custom-scrollbar pb-40">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* System Broadcast Alert */}
          <div
            className={`bg-white dark:bg-[#151E32] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 relative ${userRole !== UserRole.DEVELOPER ? 'opacity-60 grayscale-[0.5]' : ''}`}
          >
            {userRole !== UserRole.DEVELOPER && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-[1px] rounded-3xl cursor-not-allowed">
                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold uppercase text-rose-500 tracking-wide">
                    Akses Developer Saja
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MegaphoneIcon className="w-5 h-5 text-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-wide">
                System Broadcast Alert
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <div>
                  <p className="text-[10px] font-bold uppercase leading-none">Status Notifikasi</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                    Aktifkan untuk menampilkan banner di Dashboard
                  </p>
                </div>
                <button
                  onClick={() => setSystemAlert((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${systemAlert.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${systemAlert.isActive ? 'translate-x-6' : 'translate-x-0.5'}`}
                  ></div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1">
                    Judul Notifikasi
                  </label>
                  <input
                    type="text"
                    value={systemAlert.title || ''}
                    onChange={(e) => setSystemAlert((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1">
                    Target Role (Pisahkan dengan koma, atau ALL)
                  </label>
                  <input
                    type="text"
                    value={(systemAlert.targetRoles || []).join(', ')}
                    onChange={(e) =>
                      setSystemAlert((prev) => ({
                        ...prev,
                        targetRoles: e.target.value.split(',').map((s) => s.trim()),
                      }))
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide ml-1">
                  Pesan Notifikasi
                </label>
                <textarea
                  value={systemAlert.message || ''}
                  onChange={(e) => setSystemAlert((prev) => ({ ...prev, message: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveAlert}
                  disabled={isSavingAlert}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold lowercase tracking-wide shadow-lg shadow-indigo-500/10 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSavingAlert ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <SaveIcon className="w-3 h-3" />
                  )}
                  simpan pengaturan
                </button>
              </div>
            </div>
          </div>

          {/* System Feature Toggles */}
          <div
            className={`bg-white dark:bg-[#151E32] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 relative ${userRole !== UserRole.DEVELOPER ? 'opacity-60 grayscale-[0.5]' : ''}`}
          >
            {userRole !== UserRole.DEVELOPER && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-[1px] rounded-3xl cursor-not-allowed"></div>
            )}
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wide">
                System Feature Toggles
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <div className="text-left">
                  <p className="text-[10px] font-bold lowercase leading-none">
                    pemberitahuan jadwal
                  </p>
                  <p className="text-[8px] font-medium text-slate-400 lowercase mt-1">
                    munculkan modal pengingat jadwal jika guru belum mengisi
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowScheduleReminder(true)}
                    className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                    title="Preview modal"
                  >
                    <SparklesIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      handleSaveFeatures({
                        ...featureToggles,
                        scheduleReminder: !featureToggles.scheduleReminder,
                      });
                    }}
                    disabled={isSavingFeatures}
                    className={`w-10 h-5 rounded-full relative transition-colors ${featureToggles.scheduleReminder ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${featureToggles.scheduleReminder ? 'translate-x-5' : 'translate-x-0.5'}`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Master Version Control */}
          <div className="bg-white dark:bg-[#151E32] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowPathIcon className="w-5 h-5 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-white">
                  Master Version Control
                </h3>
              </div>
              <button
                onClick={async () => {
                  await incrementMasterVersion();
                  addLog('MANUAL VERSION INCREMENT EXECUTED.');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Force Master Sync
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">
              Update tanda versi global agar perangkat klien melakukan sinkronisasi data master
              (Siswa/Config) secara instan.
            </p>
          </div>

          {/* Firestore Schema Metadata */}
          <div className="bg-white dark:bg-[#151E32] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RectangleStackIcon className="w-5 h-5 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-white">
                  Firestore Schema Metadata
                </h3>
              </div>
              <button
                onClick={handleDownloadFirestoreSchemas}
                disabled={isDownloadingSchema}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {isDownloadingSchema ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                )}
                Unduh Skema (JSON)
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">
              Menganalisis, mengekstrak, dan mengunduh seluruh skema koleksi beserta tipe data field
              dari Firestore secara dinamis & real-time.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* WhatsApp Integration Test */}
          <div className="bg-white dark:bg-[#151E32] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-white">
                WhatsApp Integration Test
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 font-bold">
              Kirim pesan uji coba langsung ke nomor target melalui API FlowKirim.
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="Nomor Tujuan (Contoh: 628xxxx)"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20"
              />
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Tulis pesan Anda di sini..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold min-h-[80px] focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                onClick={sendTestWhatsApp}
                disabled={sendingTest}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wide shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {sendingTest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SparklesIcon className="w-4 h-4" />
                )}
                Kirim Pesan Tes
              </button>
            </div>
          </div>

          {/* User Impersonation */}
          <div className="bg-white dark:bg-[#151E32] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wide">User Impersonation</h3>
              </div>
              <button
                onClick={() => fetchUsersForImpersonation()}
                disabled={loadingImpersonate}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 active:scale-95 transition-all"
              >
                {loadingImpersonate ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ArrowPathIcon className="w-3 h-3" />
                )}
                Muat Pengguna
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {impersonateList.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4 italic">
                  Klik "Muat Pengguna" untuk melihat daftar.
                </p>
              ) : (
                impersonateList.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {u.displayName || u.email || 'Unknown User'}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                        {u.role} {u.studentId ? `| ID: ${u.studentId}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        onImpersonate(
                          u.role,
                          u.displayName || u.email || 'Unknown User',
                          u.studentId,
                        )
                      }
                      className="px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      View As
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Attendance Management */}
          <div className="flex flex-col gap-2 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900 rounded-2xl">
            <p className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
              Clear Attendance By Month
            </p>
            <input
              type="month"
              value={clearMonth}
              onChange={(e) => setClearMonth(e.target.value)}
              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-lg text-xs"
            />
            <button
              onClick={handleClearAttendanceByMonth}
              disabled={!clearMonth || isRepairing}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase shadow-lg shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              Hapus Data Bulan Ini
            </button>
            <button
              onClick={handleExportAttendancePDF}
              disabled={!clearMonth || isRepairing}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              Download PDF Kehadiran
            </button>
          </div>
        </div>
      </div>

      {/* Dummy Generator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3 p-5 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <SparklesIcon className="w-5 h-5 text-indigo-500" />
            <p className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 font-mono">
              Dummy Generator (v6.5)
            </p>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Target Rombel +</p>
              <select
                value={dummyClass}
                onChange={(e) => setDummyClass(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800 rounded-xl text-xs font-bold"
              >
                <option value="All">All</option>
                {classes.map((c) => (
                  <option key={c.classId || c.id} value={c.classId || c.id}>
                    {c.name || c.classId || c.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Dari Tanggal</p>
                <input
                  type="date"
                  value={dummyDate}
                  onChange={(e) => setDummyDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800 rounded-xl text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-slate-400 uppercase">s.d Tanggal</p>
                <input
                  type="date"
                  value={dummyDateEnd}
                  onChange={(e) => setDummyDateEnd(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[8px] font-bold text-slate-400 uppercase">Mode Sesi</p>
            <select
              value={dummySession}
              onChange={(e) => setDummySession(e.target.value as any)}
              className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800 rounded-xl text-xs font-bold"
            >
              <option value="all">Semua Sesi (Realistik)</option>
              <option value="masuk">Masuk Saja</option>
              <option value="duha">Duha Saja</option>
              <option value="zuhur">Zuhur Saja</option>
              <option value="ashar">Ashar Saja</option>
              <option value="pulang">Pulang Saja</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={async () => {
                await generateDummyChats();
                await generateDummyComplaints();
              }}
              disabled={isGeneratingDummy}
              className="w-full py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-[9px] font-bold uppercase hover:bg-rose-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-between px-4 group"
            >
              <span>3. Hasilkan dummy chat & pengaduan</span>
              <HelpTooltip text="Membuat data obrolan dan pengaduan palsu untuk ujicoba sistem (Pola 4)." />
            </button>
            <button
              onClick={async () => {
                await executeDatabaseSchemaMigration();
              }}
              disabled={isMigrating || isGeneratingDummy}
              className="w-full py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-[9px] font-bold uppercase hover:bg-rose-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-between px-4 group"
            >
              <span>4. Migrasikan skema bidang database</span>
              <HelpTooltip text="Menyelaraskan field-field lama (studentID, NIP) ke format baru (studentsid, teachersid) secara massal." />
            </button>
            <button
              onClick={handleGenerateDummyStudents}
              disabled={isGeneratingDummy}
              className="w-full py-2 bg-slate-800 text-slate-100 rounded-xl text-[9px] font-bold uppercase hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
            >
              1. Generate 20 Siswa Dummy (Jika Kosong)
            </button>
            <button
              onClick={handleGenerateDummyTeacherAttendance}
              disabled={isGeneratingDummy}
              className="w-full py-2 bg-slate-700 text-slate-100 rounded-xl text-[9px] font-bold uppercase hover:bg-slate-600 active:scale-95 transition-all disabled:opacity-50 mt-2"
            >
              2. Generate Absensi Guru Dummy
            </button>
            <button
              onClick={handleGenerateDummyAttendance}
              disabled={isGeneratingDummy}
              className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-bold uppercase shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGeneratingDummy ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <SparklesIcon className="w-3 h-3" />
              )}
              2. e-Mam v8.0 Point Engine (+Omni-Guard)
            </button>
            <button
              onClick={handleDeleteDummyAttendance}
              disabled={isGeneratingDummy}
              className="w-full py-2 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-xl text-[9px] font-bold uppercase hover:bg-rose-200 active:scale-95 transition-all disabled:opacity-50"
            >
              Hapus Data Kehadiran Hari Terpilih
            </button>
          </div>
          <div className="p-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
            <p className="text-[7px] text-indigo-700 dark:text-indigo-300 font-bold leading-tight uppercase">
              Logic: Omni-Guard Point Engine (Alpha +10, Late/PC/TS +5, Haid 0).
            </p>
          </div>
        </div>

        {/* Kernel Log Output */}
        <div className="bg-slate-900 rounded-3xl p-6 font-mono text-[10px] flex-1 min-h-[300px] border border-slate-800 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
            <span className="text-indigo-400 font-bold uppercase tracking-wide">
              Kernel Log Output
            </span>
            <button
              onClick={() => setLogs([])}
              className="text-[8px] text-slate-400 hover:text-white uppercase transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {logs.map((l, i) => (
              <p key={i} className="text-slate-400 leading-relaxed">
                <span className="text-slate-500">[{i}]</span> {l}
              </p>
            ))}
            {logs.length === 0 && (
              <p className="text-slate-500 italic">Listening for system kernel messages...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
