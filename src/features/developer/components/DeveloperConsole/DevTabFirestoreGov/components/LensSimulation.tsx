import React, { useState, useEffect } from 'react';
import * as Icons from '@/shared/Icons';
import { toast } from 'sonner';

/**
 * LENS SIMULATION COMPONENT
 * 
 * Modul untuk simulasi pemindaian QR Code (Lensa) dan data kehadiran.
 * Digunakan untuk pengujian fitur offline-first tanpa perangkat fisik.
 */

export const LensSimulation: React.FC = () => {
  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState(
    () => localStorage.getItem('emam_simulated_offline') === 'true',
  );
  const [sessionOverride, setSessionOverrideState] = useState(
    () => localStorage.getItem('emam_session_override') || 'Auto',
  );
  const [localStudentsForSim, setLocalStudentsForSim] = useState<any[]>([]);
  const [selectedStudentIdForSim, setSelectedStudentIdForSim] = useState('');
  const [manualQrCodeForSim, setManualQrCodeForSim] = useState('');
  const [isSimulatingAction, setIsSimulatingAction] = useState(false);
  const [simulatedScanHistory, setSimulatedScanHistory] = useState<any[]>([]);

  const loadLocalStudentsForSim = async () => {
    try {
      const { studentRepository } = await import('@/features/students/repositories/StudentRepository');
      const { getSecurityContext } = await import('@/core/security/contextHelper');
      const securityContext = getSecurityContext();
      const list = await studentRepository.getAll(securityContext);
      setLocalStudentsForSim(list || []);
    } catch (err) {
      console.warn('Failed to load local students for sim:', err);
    }
  };

  useEffect(() => {
    loadLocalStudentsForSim();
  }, []);

  const toggleSimulatedOffline = () => {
    const next = !isSimulatedOffline;
    localStorage.setItem('emam_simulated_offline', String(next));
    setIsSimulatedOfflineState(next);
    window.dispatchEvent(new Event('storage'));
  };

  const updateSessionOverride = (val: string) => {
    localStorage.setItem('emam_session_override', val);
    setSessionOverrideState(val);
    window.dispatchEvent(new Event('storage'));
  };

  const seedTrialStudentsForSim = async () => {
    try {
      setIsSimulatingAction(true);
      const { studentRepository } = await import('@/features/students/repositories/StudentRepository');
      const { classRepository } = await import('@/repositories/classRepository');
      const { getSecurityContext } = await import('@/core/security/contextHelper');
      const { useUserStore } = await import('@/stores/userStore');

      const context = getSecurityContext();
      const activeTenantId = useUserStore.getState().tenantId || '30315537';

      const mockStudents: any[] = [
        {
          idUnik: 'STD-001',
          tenantId: activeTenantId,
          namaLengkap: 'Achmad Fauzi',
          nisn: '1002030405',
          tingkatRombel: 'X-MIPA-1',
          className: 'X-MIPA-1',
          classId: 'class_x_mipa_1',
          rombel: 'X-MIPA-1',
          statusAktif: true,
          status: 'Aktif',
          gender: 'L',
          sistemJangkar: { tenantId: activeTenantId },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          idUnik: 'STD-002',
          tenantId: activeTenantId,
          namaLengkap: 'Siti Aminah',
          nisn: '1002030406',
          tingkatRombel: 'X-MIPA-2',
          className: 'X-MIPA-2',
          classId: 'class_x_mipa_2',
          rombel: 'X-MIPA-2',
          statusAktif: true,
          status: 'Aktif',
          gender: 'P',
          sistemJangkar: { tenantId: activeTenantId },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      await studentRepository.saveBatch(context, mockStudents);
      toast.success('Siswa uji coba berhasil didaftarkan!');
      await loadLocalStudentsForSim();
    } catch (err) {
      toast.error('Gagal mendaftarkan siswa uji coba.');
    } finally {
      setIsSimulatingAction(false);
    }
  };

  const runSimulatedScan = async (rawCode: string) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) {
      toast.error('Masukkan kode scan!');
      return;
    }

    setIsSimulatingAction(true);
    try {
      const { recordAttendanceByScan } = await import(
        '@/features/attendance/services/attendanceService'
      );

      let activeSession = sessionOverride;
      if (activeSession === 'Auto') {
        const now = new Date();
        const currentHour = now.getHours();
        if (currentHour < 8) activeSession = 'Masuk';
        else if (currentHour < 10) activeSession = 'Duha';
        else if (currentHour < 13) activeSession = 'Zuhur';
        else if (currentHour < 16) activeSession = 'Ashar';
        else activeSession = 'Pulang';
      }

      const result = await recordAttendanceByScan(cleanCode, activeSession as any, false);

      const historyItem = {
        id: cleanCode,
        name: (result as any).student?.namaLengkap || 'Siswa Tidak Dikenal',
        time: new Date().toLocaleTimeString(),
        status: result.message,
        success: result.success,
      };

      setSimulatedScanHistory((prev) => [historyItem, ...prev].slice(0, 10));
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setIsSimulatingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection & Session Simulation */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold uppercase mb-4 text-slate-800 dark:text-white">Environment Control</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Connection Mode</span>
                <span className={`text-xs font-bold ${isSimulatedOffline ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {isSimulatedOffline ? 'OFFLINE SIMULATED' : 'ONLINE'}
                </span>
              </div>
              <button 
                onClick={toggleSimulatedOffline}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${isSimulatedOffline ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
              >
                {isSimulatedOffline ? 'Go Online' : 'Go Offline'}
              </button>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Session Override</span>
              <div className="grid grid-cols-3 gap-1.5">
                {['Auto', 'Masuk', 'Duha', 'Zuhur', 'Ashar', 'Pulang'].map(s => (
                  <button
                    key={s}
                    onClick={() => updateSessionOverride(s)}
                    className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border transition ${sessionOverride === s ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Scan Simulator */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold uppercase mb-4 text-slate-800 dark:text-white">Scan Simulator</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Manual QR Code / ID</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={manualQrCodeForSim}
                  onChange={(e) => setManualQrCodeForSim(e.target.value)}
                  placeholder="Paste QR Code Content..."
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button 
                  onClick={() => runSimulatedScan(manualQrCodeForSim)}
                  disabled={isSimulatingAction}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                >
                  Scan
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Local Student</label>
              <select 
                value={selectedStudentIdForSim}
                onChange={(e) => {
                  setSelectedStudentIdForSim(e.target.value);
                  runSimulatedScan(e.target.value);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="">-- Pilih Siswa di Dexie --</option>
                {localStudentsForSim.map(s => (
                  <option key={s.idUnik} value={s.idUnik}>{s.namaLengkap} ({s.idUnik})</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={seedTrialStudentsForSim}
              className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition rounded-xl"
            >
              + Seed Trial Data (Dexie)
            </button>
          </div>
        </div>
      </div>

      {/* Recent Scan History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-white">Recent Simulation History</h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{simulatedScanHistory.length} logs</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {simulatedScanHistory.map((item, idx) => (
            <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950 transition">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {item.success ? <Icons.CheckIcon className="w-4 h-4" /> : <Icons.XMarkIcon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{item.time}</p>
                <p className={`text-[9px] font-bold ${item.success ? 'text-emerald-500' : 'text-rose-500'}`}>{item.status}</p>
              </div>
            </div>
          ))}
          {simulatedScanHistory.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs font-medium italic">
              Belum ada riwayat simulasi pemindaian.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
