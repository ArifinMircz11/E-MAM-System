/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * RE-SAVED TO FIX DYNAMIC IMPORT ISSUE
 */

import { env } from '@/core/config/env';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  AttendanceSession} from '@/features/attendance/services/attendanceService';


import { getStudentData } from '@/services/studentService';
import { getSecurityContext } from '@/core/security/contextHelper';
import { checkInTeacher } from '@/services/teacherAttendanceService';
import { useAutoFix } from '@/hooks/useAutoFix';
import { useAttendance } from '@/features/attendance/hooks/useAttendance';
import {
  SunIcon,
  ArrowPathIcon,
  HeartIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  WifiIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon,
  MapPinIcon,
  Search,
} from '@/shared/Icons';
import type {
  Student} from '@/types';
import {
  UserRole,
} from '@/types';
import { toast } from 'sonner';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getClassById } from '@/services/classService';
import { getActiveAcademicYear } from '@/services/academicService';
import { useUserStore } from '@/stores/userStore';

const isMockMode = env.IS_DEV || localStorage.getItem('emam_simulated_offline') === 'true';

const CameraStream = React.memo(() => {
  return (
    <div
      id="reader-core"
      className="absolute inset-0 w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:!object-cover opacity-100 overflow-hidden [&_canvas]:hidden z-0"
    ></div>
  );
});
CameraStream.displayName = 'CameraStream';

interface QRScannerProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
  userRole?: UserRole;
}

interface RecentScan {
  id: string;
  idUnik?: string;
  className?: string;
  name: string;
  time: string;
  status: string;
  isReadOnly?: boolean;
  isOffline?: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onBack, onOpenSidebar, userRole }) => {
  const { safeCall } = useAutoFix();
  const { recordScan } = useAttendance();
  const [session, setSession] = useState<AttendanceSession | 'Luar Sesi'>('Luar Sesi');
  const [isHaidMode, setIsHaidMode] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Trial/Simulation States
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(
    () => localStorage.getItem('emam_simulated_offline') === 'true',
  );
  const [isDbConnected, setIsDbConnected] = useState(() => {
    const isSimOffline = localStorage.getItem('emam_simulated_offline') === 'true';
    return isSimOffline ? false : navigator.onLine;
  });
  const [showTrialConsole, setShowTrialConsole] = useState(false);
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [manualQrCode, setManualQrCode] = useState('');
  const [sessionOverride, setSessionOverride] = useState<AttendanceSession | 'Auto'>(
    () => (localStorage.getItem('emam_session_override') as any) || 'Auto',
  );

  // Sync state values with localStorage in real-time
  useEffect(() => {
    const checkLocalStorage = () => {
      const simOffline = localStorage.getItem('emam_simulated_offline') === 'true';
      const overrideVal = (localStorage.getItem('emam_session_override') as any) || 'Auto';

      setIsSimulatedOffline(simOffline);
      setSessionOverride(overrideVal);
    };

    window.addEventListener('storage', checkLocalStorage);
    const interval = setInterval(checkLocalStorage, 1000); // Check every second for snappy react updates across tabs

    return () => {
      window.removeEventListener('storage', checkLocalStorage);
      clearInterval(interval);
    };
  }, []);

  const {
    isSyncing,
    pendingCount: unsyncedCount,
    forceSync: handleSync,
    checkPending,
  } = useOfflineSync();
  const [lastScanned, setLastScanned] = useState<RecentScan | null>(null);
  const [scanHistory, setScanHistory] = useState<RecentScan[]>([]);
  const [showFlash, setShowFlash] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const scannerRef = useRef<any>(null);
  const isLocked = useRef(false);
  const lastScannedCode = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);
  const isMounted = useRef(true);

  // Sync effect with simulation support
  useEffect(() => {
    setIsDbConnected(isSimulatedOffline ? false : navigator.onLine);
    if (navigator.onLine && !isSimulatedOffline) {
      handleSync();
    }
  }, [isSimulatedOffline, handleSync]);

  useEffect(() => {
    const handleConnectionChange = () => {
      setIsDbConnected(isSimulatedOffline ? false : navigator.onLine);
      if (navigator.onLine && !isSimulatedOffline) {
        handleSync();
      }
    };

    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, [handleSync, isSimulatedOffline]);

  const playBeep = (type: 'success' | 'error' = 'success') => {
    try {
      const url =
        type === 'success'
          ? 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
          : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3';

      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // Audio playback failed silently
    }
  };

  const detectSession = useCallback((config: any): AttendanceSession | 'Luar Sesi' => {
    const now = new Date();
    const currentDay = now.getDay(); // 0(Sun) - 6(Sat)
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (config?.workingDays && !config.workingDays.includes(currentDay)) return 'Luar Sesi';

    const toMin = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    // Determine config set based on day
    let dayConfig: any = null;
    if (currentDay === 1 && config?.monday) {
      dayConfig = config.monday;
    } else if (currentDay >= 2 && currentDay <= 5 && config?.tuesdayToFriday) {
      dayConfig = config.tuesdayToFriday;
    }

    // Fallback and values
    const mLimit = dayConfig ? toMin(dayConfig.masuk) : config ? toMin(config.masukLimit) : 480;
    const dStart = dayConfig ? toMin(dayConfig.duhaStart) : config ? toMin(config.duhaStart) : 481;
    const dEnd = dayConfig ? toMin(dayConfig.duhaEnd) : config ? toMin(config.duhaEnd) : 600;
    const zStart = dayConfig
      ? toMin(dayConfig.zuhurStart)
      : config
        ? toMin(config.zuhurStart)
        : 720;
    const zEnd = dayConfig ? toMin(dayConfig.zuhurEnd) : config ? toMin(config.zuhurEnd) : 840;
    const aStart = dayConfig
      ? toMin(dayConfig.asharStart)
      : config
        ? toMin(config.asharStart)
        : 900;
    const aEnd = dayConfig ? toMin(dayConfig.asharEnd) : config ? toMin(config.asharEnd) : 1020;

    let pLimitStr = dayConfig ? dayConfig.pulang : config?.pulangLimit || '16:00';
    if (!dayConfig && currentDay === 5) pLimitStr = config?.pulangLimitJumat || '11:30';
    const pLimit = toMin(pLimitStr);

    if (currentTime <= mLimit) return 'Masuk';
    if (currentTime >= dStart && currentTime <= dEnd) return 'Duha';
    if (currentTime >= zStart && currentTime <= zEnd) return 'Zuhur';
    if (currentTime >= aStart && currentTime <= aEnd) return 'Ashar';
    if (currentTime >= pLimit && currentTime <= pLimit + 240) return 'Pulang';

    return 'Luar Sesi';
  }, []);

  const handleScan = useCallback(
    async (decodedText: string) => {
      const cleanCode = decodedText.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      if (!cleanCode) return;

      // Throttle: Prevent processing if locked OR same code scanned within 0.5 seconds
      const now = Date.now();
      if (isLocked.current) return;
      if (lastScannedCode.current === cleanCode && now - lastScannedTime.current < 500) {
        return;
      }

      isLocked.current = true;
      lastScannedCode.current = cleanCode;
      lastScannedTime.current = now;

      // --- LOGIKA KHUSUS GURU (GPS REQUIRED) ---
      const isTeacher = userRole === UserRole.GURU || userRole === UserRole.WALI_KELAS;
      let isClassCode = false;

      // We check if it's a class code first if the user is a teacher
      if (isTeacher && !isMockMode) {
        try {
          const classData = await getClassById(cleanCode);
          if (classData) {
            isClassCode = true;
          }
        } catch {
          // Check failed, assuming student.
        }
      }

      if (isTeacher && isClassCode) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserLocation({ lat: latitude, lng: longitude });

            await safeCall(async () => {
              const result = await checkInTeacher(
                useUserStore.getState().uid || 'anonymous',
                useUserStore.getState().email || useUserStore.getState().user?.profile?.displayName || (useUserStore.getState().user as any)?.displayName || 'guru',
                cleanCode, // QR from class
                'qr-v1', // dummy token
                latitude,
                longitude,
              );

              playBeep(result.status === 'VALID' ? 'success' : 'error');
              setShowFlash(true);
              setTimeout(() => setShowFlash(false), 300);

              const scanRes: RecentScan = {
                id: cleanCode,
                name: 'check-in kelas',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: result.status === 'VALID' ? 'berhasil' : `gagal: jarak ${result.distance}m`,
              };
              setLastScanned(scanRes);
              setScanHistory((prev) => [scanRes, ...prev].slice(0, 3));
              setTimeout(() => setLastScanned(null), 4000);

              if (result.status === 'INVALID') {
                toast.error('presensi ditolak: lokasi anda terlalu jauh dari kelas.');
              } else {
                toast.success('presensi berhasil: anda telah masuk kelas.');
              }
            }, 'checkInTeacher');

            setIsLocating(false);
            setTimeout(() => {
              isLocked.current = false;
            }, 2000);
          },
          (err) => {
            setIsLocating(false);
            toast.error('gagal mendapatkan lokasi. aktifkan gps untuk absen guru.');
            isLocked.current = false;
          },
          { enableHighAccuracy: true },
        );

        return;
      }

      // Attempt to find student locally for instant feedback
      const localStudent = await getStudentData(cleanCode);

      // --- LOGIKA READ-ONLY (PENCARIAN BERLAPIS) ---
      if (session === 'Luar Sesi') {
        try {
          let studentName = localStudent?.namaLengkap || 'identitas tidak dikenal';
          let studentIdUnik = localStudent?.idUnik || '-';
          let studentClass = localStudent?.tingkatRombel || '-';
          let found = !!localStudent;

          if (isMockMode && !found) {
            studentName = 'siswa simulasi (read-only)';
            studentIdUnik = 'SIM-001';
            studentClass = 'X-MIPA-1';
            found = true;
          }

          if (isMounted.current) {
            playBeep(found ? 'success' : 'error');
            if (navigator.vibrate) navigator.vibrate(found ? 50 : [50, 50, 50]);
            setShowFlash(true);
            setTimeout(() => setShowFlash(false), 200);

            const readOnlyResult: RecentScan = {
              id: cleanCode,
              idUnik: studentIdUnik,
              className: studentClass,
              name: studentName,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: found ? 'rekaman sesi tidak aktif' : 'data tidak ditemukan',
              isReadOnly: true,
              isOffline: isSimulatedOffline || !navigator.onLine,
            };

            setLastScanned(readOnlyResult);
            setScanHistory((prev) => [readOnlyResult, ...prev].slice(0, 3));
            setTimeout(() => setLastScanned(null), 5000); // Extended timeout
            setTimeout(() => {
              isLocked.current = false;
            }, 500);
            return;
          }
        } catch {
          isLocked.current = false;
          return;
        }
      }

      try {
        // --- LOGIKA OFFLINE-FIRST ---
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const isOfflineStatus = isSimulatedOffline || !navigator.onLine;

        // Quick RAM Preview using local cache if available
        const tempScan: RecentScan = {
          id: cleanCode,
          idUnik: localStudent?.idUnik,
          name: localStudent?.namaLengkap || 'memproses...',
          className: localStudent?.tingkatRombel,
          time: timeStr,
          status: isOfflineStatus ? 'tersimpan offline' : 'mensinkronkan...',
          isOffline: isOfflineStatus,
        };
        setLastScanned(tempScan);

        // Call modern useAttendance hook to manage offline queues and sync operations seamlessly
        const result = await recordScan(cleanCode, session as AttendanceSession, isHaidMode);

        if (result.success) {
          const updatedScan: RecentScan = {
            ...tempScan,
            name: result.student?.namaLengkap || localStudent?.namaLengkap || 'siswa',
            idUnik: result.student?.idUnik || localStudent?.idUnik,
            className: result.student?.tingkatRombel || localStudent?.tingkatRombel,
            status: isOfflineStatus
              ? `tersimpan offline (${session.toLowerCase()})`
              : result.message.toLowerCase().includes('sudah')
                ? result.message.toLowerCase()
                : `${result.message.toLowerCase()} (${session.toLowerCase()})`,
            isOffline: isOfflineStatus,
          };
          setLastScanned(updatedScan);
          setScanHistory((prev) => [updatedScan, ...prev].slice(0, 3));
          playBeep('success');
          if (navigator.vibrate) navigator.vibrate(isOfflineStatus ? 50 : 150);
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 300);
          setTimeout(() => setLastScanned(null), 3000);
        } else {
          toast.error(result.message.toLowerCase());
          playBeep('error');
          const failedScan: RecentScan = {
            ...tempScan,
            status: result.message.toLowerCase(),
          };
          setLastScanned(failedScan);
          setTimeout(() => setLastScanned(null), 3000);
        }

        setTimeout(() => {
          isLocked.current = false;
          lastScannedCode.current = null;
        }, 500);
      } catch {
        toast.error('terjadi kesalahan sistem saat memproses scan.');
        isLocked.current = false;
      }
    },
    [session, isHaidMode, userRole, isSimulatedOffline],
  );

  const startScanner = useCallback(
    async (mode: 'environment' | 'user') => {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {}
      }

      const container = document.getElementById('reader-core');
      if (!container || !isMounted.current) return;

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        const html5QrCode = new Html5Qrcode('reader-core', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: mode },
          {
            fps: 10, // Optimize for performance and reduce lag
            qrbox: (width, height) => {
              // Dynamic crop box scaled elegantly to ensure quick scanning
              const size = Math.min(width, height) * 0.7;
              return {
                width: Math.max(250, Math.min(320, size)),
                height: Math.max(250, Math.min(320, size)),
              };
            },
            videoConstraints: {
              facingMode: mode,
              // Lower resolution for faster evaluation
              width: { ideal: 640 },
              height: { ideal: 480 },
              focusMode: 'continuous',
              frameRate: { ideal: 10, max: 15 },
            } as any,
          },
          (decodedText) => handleScan(decodedText),
          () => {
            /* ignore errors */
          },
        );

        if (isMounted.current) {
          try {
            const capabilities = html5QrCode.getRunningTrackCapabilities();
            setHasTorch(!!(capabilities as any)?.torch);
          } catch (e) {
            setHasTorch(false);
          }
        }
      } catch (err: any) {
        if (mode === 'environment' && isMounted.current) {
          setFacingMode('user');
        }
      }
    },
    [handleScan],
  );

  useEffect(() => {
    isMounted.current = true;
    let configData: any = null;

    const initScannerSystem = async () => {
      setIsInitializing(true);

      try {
        const activeYear = await getActiveAcademicYear();
        if (activeYear) {
          configData = (activeYear as any).config;
          setIsDbConnected(isSimulatedOffline ? false : navigator.onLine);
        }
      } catch (e) {
        setIsDbConnected(isSimulatedOffline ? false : navigator.onLine);
      }

      if (isMounted.current) {
        if (sessionOverride !== 'Auto') {
          setSession(sessionOverride);
        } else {
          setSession(detectSession(configData));
        }
        setIsInitializing(false);
      }
    };

    initScannerSystem();

    // Auto-update session every minute
    const interval = setInterval(() => {
      if (isMounted.current) {
        if (sessionOverride !== 'Auto') {
          setSession(sessionOverride);
        } else {
          setSession(detectSession(configData));
        }
      }
    }, 60000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [detectSession, sessionOverride, isSimulatedOffline]);

  useEffect(() => {
    if (!isInitializing) {
      startScanner(facingMode);
    }
    return () => {
      if (scannerRef.current && scannerRef.current.getState() === 2) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [facingMode, isInitializing, startScanner]);

  const loadLocalStudents = async () => {
    try {
      const { studentRepository } = await import('@/features/students/repositories/StudentRepository');
      // Using static import for getSecurityContext
      const securityContext = getSecurityContext();
      const list = await studentRepository.getAll(securityContext);
      setLocalStudents(list || []);
    } catch (err) {
      console.warn('Failed to load local students:', err);
    }
  };

  const seedTrialStudents = async () => {
    try {
      const { studentRepository } = await import('@/features/students/repositories/StudentRepository');
      // Using static import for getSecurityContext
      const context = getSecurityContext();
      const activeTenantId = useUserStore.getState().tenantId || '30315537';

      const mockStudents: Student[] = [
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
        } as any,
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
        } as any,
        {
          idUnik: 'STD-003',
          tenantId: activeTenantId,
          namaLengkap: 'Muhammad Rizky',
          nisn: '1002030407',
          tingkatRombel: 'XI-IIS-1',
          className: 'XI-IIS-1',
          classId: 'class_xi_iis_1',
          rombel: 'XI-IIS-1',
          statusAktif: true,
          status: 'Aktif',
          gender: 'L',
          sistemJangkar: { tenantId: activeTenantId },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
        {
          idUnik: 'STD-004',
          tenantId: activeTenantId,
          namaLengkap: 'Zahra Maulida',
          nisn: '1002030408',
          tingkatRombel: 'XI-IIS-2',
          className: 'XI-IIS-2',
          classId: 'class_xi_iis_2',
          rombel: 'XI-IIS-2',
          statusAktif: true,
          status: 'Aktif',
          gender: 'P',
          sistemJangkar: { tenantId: activeTenantId },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
        {
          idUnik: 'STD-005',
          tenantId: activeTenantId,
          namaLengkap: 'Rizwan Hakim',
          nisn: '1002030409',
          tingkatRombel: 'XII-IBB',
          className: 'XII-IBB',
          classId: 'class_xii_ibb',
          rombel: 'XII-IBB',
          statusAktif: true,
          status: 'Aktif',
          gender: 'L',
          sistemJangkar: { tenantId: activeTenantId },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
      ];

      await studentRepository.saveBatch(context, mockStudents);

      // Seed mock classes matching these students
      const { classRepository } = await import('@/repositories/classRepository');
      const mockClasses = [
        {
          id: 'class_x_mipa_1',
          classId: 'class_x_mipa_1',
          name: 'X-MIPA-1',
          level: 'X',
          academicYear: '2025/2026',
          tenantId: activeTenantId,
        },
        {
          id: 'class_x_mipa_2',
          classId: 'class_x_mipa_2',
          name: 'X-MIPA-2',
          level: 'X',
          academicYear: '2025/2026',
          tenantId: activeTenantId,
        },
        {
          id: 'class_xi_iis_1',
          classId: 'class_xi_iis_1',
          name: 'XI-IIS-1',
          level: 'XI',
          academicYear: '2025/2026',
          tenantId: activeTenantId,
        },
        {
          id: 'class_xi_iis_2',
          classId: 'class_xi_iis_2',
          name: 'XI-IIS-2',
          level: 'XI',
          academicYear: '2025/2026',
          tenantId: activeTenantId,
        },
        {
          id: 'class_xii_ibb',
          classId: 'class_xii_ibb',
          name: 'XII-IBB',
          level: 'XII',
          academicYear: '2025/2026',
          tenantId: activeTenantId,
        },
      ];
      const securityContext = getSecurityContext();
      await classRepository.saveBatch(securityContext, mockClasses);

      toast.success('5 siswa & kelas uji coba berhasil didaftarkan di local database!');
      await loadLocalStudents();
    } catch (err) {
      toast.error('Gagal mendaftarkan siswa uji coba.');
      console.error(err);
    }
  };

  useEffect(() => {
    loadLocalStudents();
  }, []);

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const next = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: next }] } as any);
      setIsTorchOn(next);
    } catch (e) {}
  };

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    toast.info(`kamera dibalik ke ${nextMode === 'user' ? 'depan' : 'belakang'}`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualQrCode.trim();
    if (!clean) {
      toast.error('Masukkan ID Unik atau NISN siswa.');
      return;
    }
    handleScan(clean);
    setManualQrCode('');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black relative overflow-hidden select-none">
      {/* LAYER 0: CAMERA */}
      <CameraStream />

      {/* LAYER 1: FLASH EFFECT */}
      <div
        className={`fixed inset-0 z-[100] pointer-events-none transition-opacity duration-300 ${showFlash ? 'opacity-40' : 'opacity-0'} ${isHaidMode ? 'bg-rose-400' : 'bg-emerald-400'}`}
      ></div>

      {/* LAYER 2: UI CONTENT */}
      <div className="absolute inset-0 z-[200] flex flex-col pointer-events-none">
        {/* UI LAYER CHECK (DEBUG) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/5">
          <p className="text-[6px] font-bold text-white/30 tracking-wide lowercase">
            e-mam lense mode active
          </p>
        </div>

        {isInitializing ? (
          <div className="h-full flex flex-col items-center justify-center gap-6 bg-black">
            <div className="w-16 h-16 relative opacity-20">
              <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-[10px] font-bold text-emerald-500/40 lowercase tracking-wide animate-pulse">
              initializing lense v6.2
            </p>
          </div>
        ) : (
          <div className="h-full w-full relative flex flex-col">
            {/* Header */}
            <div className="pt-12 px-6 flex items-start justify-between">
              <button
                onClick={onBack}
                className="p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 text-white active:scale-95 pointer-events-auto transition-all"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-end gap-2">
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 px-5 py-3 rounded-2xl flex flex-col items-end">
                  {session !== 'Luar Sesi' && (
                    <span className="text-[9px] font-bold lowercase tracking-wide text-emerald-400/60 mb-1">
                      sesi: {session.toLowerCase()}
                    </span>
                  )}
                  <span className="text-sm font-mono font-bold text-white/80">
                    {new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex gap-2">
                  {unsyncedCount > 0 && (
                    <button
                      onClick={handleSync}
                      disabled={isSyncing || !isDbConnected}
                      className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-[7px] font-bold lowercase flex items-center gap-1.5 active:scale-95 transition-all pointer-events-auto"
                      title="Click to Force Sync"
                    >
                      <CloudArrowUpIcon
                        className={`w-2.5 h-2.5 ${isSyncing ? 'animate-bounce' : ''}`}
                      />
                      {unsyncedCount} pending
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleSync();
                      toast.info(
                        `Connection: ${isDbConnected ? 'Online' : 'Offline'} (Simulated: ${isSimulatedOffline ? 'Yes' : 'No'})`,
                      );
                    }}
                    className={`px-3 py-1 rounded-full border text-[7px] font-bold lowercase tracking-wide active:scale-95 transition-all pointer-events-auto ${isDbConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400/80' : 'bg-rose-500/10 border-rose-500/20 text-rose-400/80'}`}
                  >
                    {isDbConnected ? 'online' : 'offline'}
                  </button>
                </div>
              </div>
            </div>

            {/* Mode Haid */}
            {session !== 'Luar Sesi' &&
              userRole !== UserRole.GURU &&
              userRole !== UserRole.WALI_KELAS && (
                <div className="mt-8 flex justify-center px-4">
                  <button
                    onClick={() => setIsHaidMode(!isHaidMode)}
                    className={`px-8 py-3.5 rounded-full flex items-center gap-3 border border-white/5 transition-all font-bold text-[9px] lowercase tracking-wide pointer-events-auto ${
                      isHaidMode
                        ? 'bg-rose-600/80 text-white scale-105'
                        : 'bg-black/40 backdrop-blur-xl text-white/30'
                    }`}
                  >
                    <HeartIcon
                      className={`w-3.5 h-3.5 ${isHaidMode ? 'fill-current animate-pulse' : ''}`}
                    />
                    {isHaidMode ? 'mode ibadah aktif' : 'ibadah (haid)'}
                  </button>
                </div>
              )}

            {isLocating && (
              <div className="mt-8 flex justify-center px-4">
                <button
                  onClick={() => {
                    if (userLocation) {
                      toast.info(
                        `Lokasi: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`,
                      );
                    } else {
                      toast.info('Sedang mencari sinyal GPS...');
                    }
                  }}
                  className="px-8 py-3.5 rounded-full flex items-center gap-3 bg-indigo-600/80 border border-white/5 text-white font-bold text-[9px] lowercase tracking-wide animate-pulse pointer-events-auto active:scale-95 transition-all"
                >
                  <MapPinIcon className="w-3.5 h-3.5 animate-bounce" />
                  mensinkronkan gps...
                </button>
              </div>
            )}

            <div className="flex-1"></div>

            {/* Manual ID Input for damaged/unreadable cards */}
            <div className="px-6 mb-3 pointer-events-auto">
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    list="local-students-list"
                    value={manualQrCode}
                    onChange={(e) => setManualQrCode(e.target.value)}
                    placeholder="Ketik ID Unik / NISN (Kartu Rusak)..."
                    className="w-full pl-10 pr-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 shadow-lg"
                  />
                  <datalist id="local-students-list">
                    {localStudents.map((s, idx) => (
                      <option key={`student-opt-${s.id || s.idUnik || 'n'}-${idx}`} value={s.idUnik || s.id}>
                        {s.namaLengkap} ({s.idUnik || s.id})
                      </option>
                    ))}
                  </datalist>
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg active:scale-95 shrink-0"
                >
                  Catat
                </button>
              </form>
            </div>

            {/* History Reel */}
            <div className="px-6 pb-4 space-y-2 mb-2">
              {scanHistory.map((h, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/5`}
                  style={{ opacity: 1 - i * 0.3 }}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${h.isReadOnly ? 'bg-amber-500/10 text-amber-400/60' : h.status.includes('haid') || h.status.includes('Haid') ? 'bg-rose-500/10 text-rose-400/60' : 'bg-emerald-500/10 text-emerald-400/60'}`}
                  >
                    {h.name.charAt(0).toLowerCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white/70 lowercase truncate tracking-tight">
                      {h.name}
                      {(h.idUnik || h.className) && (
                        <span className="ml-2 text-[7px] text-white/20 font-mono tracking-wide uppercase">
                          {h.idUnik && `ID:${h.idUnik}`} {h.className && `• ${h.className}`}
                        </span>
                      )}
                    </p>
                    <p className="text-[8px] font-medium text-white/30 lowercase tracking-tight">
                      {h.status} • {h.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="pb-12 flex justify-center gap-8">
              {/* Flashlight */}
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-75 pointer-events-auto border border-white/5 ${isTorchOn ? 'bg-emerald-500 text-white' : 'bg-black/40 backdrop-blur-xl text-white/20'}`}
                >
                  <SunIcon className="w-6 h-6" />
                </button>
              )}

              {/* Camera Switch */}
              <button
                onClick={toggleCamera}
                className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl text-white/20 flex items-center justify-center transition-all active:scale-75 pointer-events-auto border border-white/5 hover:text-white"
              >
                <ArrowPathIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LAYER 3: SCANNED POPUP (GLOBAL OVERLAY) - MOVED TO BOTTOM TO AVOID COVERING SCANNER */}
      <AnimatePresence>
        {lastScanned && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-36 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] z-[1000] pointer-events-none"
          >
            <div
              className={`px-4 py-3 rounded-2xl border border-white/5 backdrop-blur-xl flex items-center gap-3 shadow-2xl ${
                lastScanned.isReadOnly
                  ? 'bg-amber-600/80'
                  : isHaidMode
                    ? 'bg-rose-600/80'
                    : 'bg-emerald-600/80'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                {lastScanned.isReadOnly ? (
                  <ShieldCheckIcon className="w-5 h-5 text-white/80" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5 text-white/80" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-bold text-white lowercase truncate leading-tight">
                  {lastScanned.name}
                  {lastScanned.isOffline && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-black/30 text-[6px] text-white/60 font-bold uppercase  inline-flex items-center gap-1">
                      <WifiIcon className="w-1.5 h-1.5 opacity-50" />
                      offline
                    </span>
                  )}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  {lastScanned.className && (
                    <span className="text-[8px] font-bold text-white/50 px-1.5 py-0.5 bg-black/20 rounded lowercase">
                      {lastScanned.className}
                    </span>
                  )}
                  {lastScanned.idUnik && (
                    <span className="text-[8px] font-mono text-white/30 lowercase">
                      {lastScanned.idUnik}
                    </span>
                  )}
                </div>
                <p className="text-[9px] font-medium text-white/70 lowercase truncate mt-1">
                  {lastScanned.status}
                </p>
              </div>
              <div className="text-[8px] font-mono text-white/40 grayscale">{lastScanned.time}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRScanner;
