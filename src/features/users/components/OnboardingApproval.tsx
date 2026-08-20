import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  OnboardingRequest} from '@/services/onboardingService';
import {
  resolveOnboardingRequest,
  subscribePendingOnboardingRequests,
} from '@/services/onboardingService';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useAutoFix } from '@/hooks/useAutoFix';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2,
  GraduationCapIcon,
  BookOpenIcon,
  PhoneIcon,
  HomeIcon,
  AlertCircleIcon,
} from '@/shared/Icons';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

interface Gate2ComparisonCardProps {
  req: OnboardingRequest;
  isProcessing: string | null;
  handleApprove: (req: OnboardingRequest) => Promise<void>;
  handleRejectClick: (req: OnboardingRequest) => void;
}

const Gate2ComparisonCard: React.FC<Gate2ComparisonCardProps> = ({
  req,
  isProcessing,
  handleApprove,
  handleRejectClick,
}) => {
  const [masterData, setMasterData] = useState<any>(null);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const isSiswa = req.role === 'siswa';
  const info = req.formData || {};
  const targetId = info.targetId || '';

  useEffect(() => {
    if (targetId) {
      setLoadingMaster(true);
      const context = getSecurityContext();
      const repo = isSiswa ? studentRepository : teacherRepository;
      
      repo.getById(context, targetId)
        .then((data) => {
          if (data) {
            setMasterData(data);
          }
        })
        .catch((err) => {
          console.error('Gagal memuat perbandingan data master:', err);
        })
        .finally(() => {
          setLoadingMaster(false);
        });
    }
  }, [targetId, isSiswa]);

  const isConfirmed = isChecked;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 lg:p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      {/* Accent strip */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSiswa ? 'bg-indigo-500' : 'bg-emerald-500'}`}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-150 dark:border-slate-850 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${
              isSiswa
                ? 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-500 border-indigo-100 dark:border-indigo-800'
                : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 border-emerald-100 dark:border-emerald-800'
            }`}
          >
            {isSiswa ? (
              <GraduationCapIcon className="w-5 h-5" />
            ) : (
              <BookOpenIcon className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-[8px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${
                  isSiswa
                    ? 'bg-indigo-505 bg-indigo-500/10 text-indigo-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                {req.role}
              </span>
              <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-505 text-slate-550 dark:text-slate-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                Gate 2: Penautan Data
              </span>
            </div>
            <h3 className="font-extrabold text-slate-800 dark:text-white uppercase text-[11px] tracking-tight mt-1 truncate">
              {req.displayName || req.email}
            </h3>
          </div>
        </div>
        <div className="text-right text-[10px] font-medium text-slate-400">
          ID Identitas:{' '}
          <strong className="text-indigo-400 font-mono text-[11px] bg-slate-950 px-2 py-0.5 border border-slate-800 rounded-md">
            {targetId}
          </strong>
        </div>
      </div>

      {/* Side-by-Side Comparison Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SISI KIRI: DATA PENAUT */}
        <div className="p-4 bg-slate-50 dark:bg-slate-955 dark:bg-slate-950 border border-slate-205 border-slate-200 dark:border-slate-850 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-205 border-slate-200 dark:border-slate-800 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sisi Kiri: Input Pendaftar
            </h4>
          </div>
          <div className="space-y-2 text-[10px] font-medium">
            <div className="flex justify-between">
              <span className="text-slate-400">Nama Lengkap:</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold uppercase">
                {req.displayName || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email SSO:</span>
              <span className="text-slate-800 dark:text-slate-200 font-mono">
                {req.email || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">WA Kontak:</span>
              <span className="text-emerald-500 font-extrabold">
                {info.nomorHpWaliWhatsApp || info.nomorHpSiswa || info.nomorHpWhatsApp || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">NIP/NISN Klaim:</span>
              <span className="text-indigo-400 font-mono font-bold bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                {targetId || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* SISI KANAN: DATA MASTER ASLI */}
        <div className="p-4 bg-slate-50 dark:bg-slate-955 dark:bg-slate-950 border border-slate-205 border-slate-200 dark:border-slate-850 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-205 border-slate-200 dark:border-slate-800 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sisi Kanan: Master Data Sekolah
            </h4>
          </div>
          {loadingMaster ? (
            <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              memuat database asli...
            </div>
          ) : masterData ? (
            <div className="space-y-2 text-[10px] font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Terdaftar:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold uppercase">
                  {masterData.namaLengkap || masterData.name || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {isSiswa ? 'Rombel/Kelas:' : 'Status/Jabatan:'}
                </span>
                <span className="text-emerald-400 font-bold uppercase">
                  {masterData.tingkatRombel || masterData.jabatanDanStatus?.jabatanUtama || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Klaim:</span>
                <span
                  className={`font-bold ${masterData.isClaimed || masterData.linkedUserId ? 'text-rose-500' : 'text-emerald-400'}`}
                >
                  {masterData.isClaimed || masterData.linkedUserId
                    ? 'SUDAH DIKLAIM'
                    : 'BELUM DIKLAIM'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Aktif:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  {masterData.statusAktif || 'Aktif'}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-rose-500 text-[9px] font-bold uppercase tracking-wider space-y-1">
              <AlertCircleIcon className="w-5 h-5 mx-auto opacity-70" />
              <span>ID Master Tidak Ditemukan</span>
              <p className="text-[8px] text-slate-500 lowercase font-bold font-sans">
                mohon ditinjau secara berkas fisik sekolah
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation and Actions Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-850">
        {/* Checkbox Confirmation */}
        <label className="flex items-start gap-2.5 cursor-pointer max-w-md">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-950 accent-indigo-500 mt-0.5 shrink-0"
          />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal lowercase">
            Saya memeriksa bahwa kedua data di atas adalah milik orang yang sama secara{' '}
            <span className="text-indigo-400">Zero-Trust</span>.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isProcessing === req.id ? (
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              memproses...
            </div>
          ) : (
            <>
              <button
                onClick={() => handleApprove(req)}
                disabled={!isConfirmed || isProcessing !== null}
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-emerald-600 disabled:active:scale-100 disabled:cursor-not-allowed text-white font-bold text-[9px] uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Setujui Penautan
              </button>
              <button
                onClick={() => handleRejectClick(req)}
                disabled={isProcessing !== null}
                className="py-3 px-5 bg-rose-505 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white active:scale-95 font-bold text-[9px] uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 border border-rose-500/20"
              >
                <XCircleIcon className="w-4 h-4" />
                Tolak
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const OnboardingApproval: React.FC = () => {
  const { safeCall } = useAutoFix();
  const currentUser = useAuthStore((state) => state.user);

  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingReq, setRejectingReq] = useState<OnboardingRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!currentUser?.tenantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsub = subscribePendingOnboardingRequests(
      currentUser.tenantId,
      (data) => {
        setRequests(data);
        setIsLoading(false);
      },
      (err) => {
        toast.error('Gagal melakukan sinkronisasi real-time onboarding: ' + err.message);
        setIsLoading(false);
      },
    );

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [currentUser?.tenantId]);

  const handleApprove = async (req: OnboardingRequest) => {
    setIsProcessing(req.id);
    try {
      await safeCall(async () => {
        await resolveOnboardingRequest(
          req.id,
          'approved',
          '',
          currentUser?.email || 'admin@e-mam.com',
          currentUser?.uid || 'ADMIN',
          req,
        );
      }, 'OnboardingApproval.Approve');

      toast.success(`Akun ${req.displayName} disetujui! Data master berhasil dibuat.`);

      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyetujui pengajuan: ' + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectClick = (req: OnboardingRequest) => {
    setRejectingReq(req);
    setRejectReason('');
  };

  const submitReject = async () => {
    if (!rejectingReq) return;
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan harus diisi agar pengaju dapat memperbaikinya.');
      return;
    }

    const reqId = rejectingReq.id;
    setIsProcessing(reqId);
    setRejectingReq(null);

    try {
      await safeCall(async () => {
        await resolveOnboardingRequest(
          reqId,
          'rejected',
          rejectReason,
          currentUser?.email || 'admin@e-mam.com',
          currentUser?.uid || 'ADMIN',
          rejectingReq,
        );
      }, 'OnboardingApproval.Reject');

      toast.info(`Pengajuan ditolak dengan alasan: "${rejectReason}"`);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menolak pengajuan: ' + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          memuat data onboarding...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {requests.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-16 text-center opacity-40 flex flex-col items-center justify-center space-y-3"
          >
            <ShieldCheckIcon className="w-16 h-16 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-300">
              Antrian Bersih
            </h3>
            <p className="text-[10px] font-bold text-slate-400 lowercase">
              tidak ada pengajuan profil akun yang menanti approval saat ini.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence initial={false}>
                {requests.map((req) => {
                  if (req.gateType === 'gate2') {
                    return (
                      <Gate2ComparisonCard
                        key={req.id}
                        req={req}
                        isProcessing={isProcessing}
                        handleApprove={handleApprove}
                        handleRejectClick={handleRejectClick}
                      />
                    );
                  }

                  const isSiswa = req.role === 'siswa';
                  const info = req.formData || {};

                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                    >
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        {/* Visual indicator corner */}
                        <span
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSiswa ? 'bg-indigo-505 bg-indigo-500' : 'bg-emerald-500'}`}
                        />

                        {/* Left Role Avatar */}
                        <div
                          className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border shadow-inner ${
                            isSiswa
                              ? 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-500 border-indigo-100 dark:border-indigo-800'
                              : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 border-emerald-100 dark:border-emerald-800'
                          }`}
                        >
                          {isSiswa ? (
                            <GraduationCapIcon className="w-5 h-5" />
                          ) : (
                            <BookOpenIcon className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[8px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${
                                  isSiswa
                                    ? 'bg-indigo-500/10 text-indigo-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {req.role}
                              </span>
                              <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                                PROFIL BARU
                              </span>
                            </div>

                            <h3 className="font-extrabold text-slate-800 dark:text-white uppercase text-[11px] tracking-tight mt-1.5 truncate">
                              {req.displayName || req.email}
                            </h3>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-0.5 truncate">
                              Email SSO: {req.email}
                            </p>
                          </div>

                          {/* FORM DETAILS */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                            {isSiswa ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-400">NISN:</span>
                                  <span className="text-white font-bold">{info.nisn || '-'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-400">L/P:</span>
                                  <span className="text-white font-bold">
                                    {info.jenisKelamin || '-'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-400">Tingkat:</span>
                                  <span className="text-white font-bold">
                                    {info.tingkat || '-'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-400">Rombel:</span>
                                  <span className="text-indigo-400 font-bold">
                                    {info.rombel || info.tingkatRombel || '-'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-400">Wali:</span>
                                  <span className="text-white font-bold">
                                    {info.namaWali || '-'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:col-span-2">
                                  <PhoneIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="font-bold text-slate-400">WA Wali:</span>
                                  <span className="text-emerald-500 font-extrabold">
                                    {info.nomorHpWaliWhatsApp || '-'}
                                  </span>
                                </div>
                                <div className="flex items-start gap-1.5 sm:col-span-2">
                                  <HomeIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-400">Alamat:</span>{' '}
                                    <span className="text-slate-400 dark:text-slate-400">
                                      {info.alamatRumah || '-'}
                                    </span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-400">NIP/ID:</span>
                                  <span className="text-white font-bold">{info.nip || '-'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-400">Kepegawaian:</span>
                                  <span className="text-white font-bold">
                                    {info.statusPegawai || '-'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 col-span-2">
                                  <span className="font-bold text-slate-400">Mapel:</span>
                                  <span className="text-emerald-400 font-bold">
                                    {info.mapelUtama || '-'}
                                  </span>
                                </div>
                                {info.isWaliKelas && (
                                  <div className="flex items-center gap-1.5 col-span-2">
                                    <span className="font-bold text-rose-400">Walikelas Di:</span>
                                    <span className="text-rose-400 font-bold uppercase tracking-wider">
                                      {info.waliKelasDi || '-'}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 sm:col-span-2">
                                  <PhoneIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="font-bold text-slate-400">WA Guru:</span>
                                  <span className="text-emerald-500 font-extrabold">
                                    {info.nomorHpWhatsApp || '-'}
                                  </span>
                                </div>
                                <div className="flex items-start gap-1.5 sm:col-span-2">
                                  <HomeIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-400">Alamat:</span>{' '}
                                    <span className="text-slate-400 dark:text-slate-450">
                                      {info.alamatLengkap || '-'}
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center md:flex-col lg:flex-row gap-2 shrink-0 md:self-stretch justify-end border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 max-w-full">
                        {isProcessing === req.id ? (
                          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                            memproses...
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(req)}
                              className="flex-1 md:w-full lg:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[9px] uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              Setujui
                            </button>
                            <button
                              onClick={() => handleRejectClick(req)}
                              className="flex-1 md:w-full lg:flex-1 py-3 px-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white active:scale-95 font-bold text-[9px] uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 border border-rose-500/20"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              Tolak
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject reason dialog */}
      {rejectingReq && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/10 w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl relative"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                <AlertCircleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white tracking-tight uppercase text-xs">
                  Tolak Profil Pengguna Baru
                </h3>
                <p className="text-[10px] font-bold text-slate-400 lowercase mt-0.5">
                  berikan alasan penolakan untuk{' '}
                  <span className="text-slate-300 font-extrabold">{rejectingReq.displayName}</span>
                </p>
              </div>
            </div>

            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-rose-500 focus:outline-none resize-none placeholder-slate-500"
              placeholder="Contoh: NISN/NIK tidak sesuai dengan data madrasah."
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRejectingReq(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[9px] tracking-wide uppercase rounded-xl transition-colors"
                disabled={isProcessing !== null}
              >
                Batal
              </button>
              <button
                onClick={submitReject}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] tracking-wide uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5"
                disabled={isProcessing !== null}
              >
                <XCircleIcon className="w-4 h-4" />
                Tolak Pengajuan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OnboardingApproval;
