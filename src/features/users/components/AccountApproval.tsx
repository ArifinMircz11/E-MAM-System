import { useUserStore } from '@/stores/userStore';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2,
  UserIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ClockIcon,
  Search,
  ArrowPathIcon,
} from '@/shared/Icons';
import Layout from '@/layouts/Layout';
import { toast } from 'sonner';
import { useStudentStore } from '@/stores/studentStore';
import { useAdminStore } from '@/stores/adminStore';
import { UserRole } from '@/types';
import { sanitizeError } from '@/utils/firestoreHelpers';
import { approvePendingAccount, deleteAccountByAdmin } from '@/services/authService';
import { OnboardingApproval } from '@/features/users/components/OnboardingApproval';
import { PendingActivationList } from '@/features/users/components/PendingActivationList';

interface ApprovalRequest {
  id: string;
  uid?: string;
  displayName: string;
  email: string;
  role: string;
  idUnik?: string;
  nisn?: string;
  phone?: string;
  isIndependent?: boolean;
  accountStatus?: string;
  status?: string;
  tingkatRombel?: string;
  studentId?: string;
  studentsId?: string;
}

const FIELD_LABELS: Record<string, string> = {
  displayName: 'Nama Lengkap',
  namaLengkap: 'Nama Lengkap',
  tingkatRombel: 'Kelas / Rombel',
  nik: 'NIK',
  tempatLahir: 'Tempat Lahir',
  tanggalLahir: 'Tanggal Lahir',
  namaAyah: 'Nama Ayah',
  namaIbu: 'Nama Ibu',
  pekerjaanAyah: 'Pekerjaan Ayah',
  pekerjaanIbu: 'Pekerjaan Ibu',
  penghasilanOrtu: 'Penghasilan Ortu',
  nomorKIPP_PIP: 'No. KIP / PIP',
  kebutuhanKhusus: 'Kebutuhan Khusus',
  disabilitas: 'Disabilitas',
  phone: 'No. HP Siswa',
  address: 'Alamat',
  nomorHpSiswa: 'No. HP Siswa',
  namaWali: 'Nama Wali',
  hubunganWali: 'Hubungan Wali',
  nomorHpWaliWhatsApp: 'No. WA Wali',
  alamatRumah: 'Alamat Rumah',
  'kontakDanWali.nomorHpSiswa': 'No. HP Siswa',
  'kontakDanWali.alamatRumah': 'Alamat Rumah',
  'kontakDanWali.nomorHpWaliWhatsApp': 'No. WA Wali',
  'kontakDanWali.namaWali': 'Nama Wali',
};

const renderDiff = (req: any) => {
  const changedFields: string[] =
    req.changedFields ||
    Object.keys(req.requestedChanges || {}).filter((k) => k !== 'studentsId' && k !== 'studentId');

  if (changedFields.length === 0) {
    return (
      <div className="mt-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
        Tidak ada perubahan bidang yang terdeteksi
      </div>
    );
  }

  // Filter keys where old matches new
  const activeKeys = changedFields.filter((key) => {
    let oldVal: any = '-';
    let newVal: any = '-';

    if (req.oldData && req.newData) {
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        oldVal = req.oldData[parent]?.[child] ?? '-';
        newVal = req.newData[parent]?.[child] ?? '-';
      } else {
        oldVal = req.oldData[key] ?? '-';
        newVal = req.newData[key] ?? '-';
      }
    } else if (req.requestedChanges) {
      newVal = req.requestedChanges[key] ?? '-';
      if (req.originalData) {
        oldVal = req.originalData[key] ?? '-';
      }
    }
    return String(oldVal).trim() !== String(newVal).trim();
  });

  if (activeKeys.length === 0) return null;

  return (
    <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/60 text-xs space-y-3">
      <p className="text-[9px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#475569] mb-1">
        Detail Perubahan Data (Diff Engine)
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {activeKeys.map((key) => {
          const label = FIELD_LABELS[key] || key;

          let oldVal: any = '-';
          let newVal: any = '-';

          if (req.oldData && req.newData) {
            if (key.includes('.')) {
              const [parent, child] = key.split('.');
              oldVal = req.oldData[parent]?.[child] ?? '-';
              newVal = req.newData[parent]?.[child] ?? '-';
            } else {
              oldVal = req.oldData[key] ?? '-';
              newVal = req.newData[key] ?? '-';
            }
          } else if (req.requestedChanges) {
            newVal = req.requestedChanges[key] ?? '-';
            if (req.originalData) {
              oldVal = req.originalData[key] ?? '-';
            }
          }

          return (
            <div
              key={key}
              className="p-3 bg-white dark:bg-[#0E1526] border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-1.5 shadow-sm"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                {label}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="line-through bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-lg border border-rose-100 dark:border-rose-900/30 font-mono break-all whitespace-normal">
                  {String(oldVal)}
                </span>
                <span className="text-slate-400 font-bold">➔</span>
                <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 font-extrabold font-mono break-all whitespace-normal">
                  {String(newVal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EditDataModal = ({ target, onClose, onSave }: any) => {
  const [formData, setFormData] = useState<any>(target?.rawData || {});
  const classes = useStudentStore((state) => state.classes);

  const handleChange = (k: string, v: string) => setFormData({ ...formData, [k]: v });

  if (!target) return null;

  const editableFields =
    target.type === 'user'
      ? [
          { label: 'Nama Lengkap', key: 'displayName' },
          { label: 'Email', key: 'email' },
          { label: 'No. Telepon / WA', key: 'phone' },
          { label: 'NISN', key: 'nisn' },
          { label: 'ID Unik (Siswa)', key: 'studentsId' },
          { label: 'NIP (Guru)', key: 'teachersId', role: 'teacher' },
          { label: 'Kelas / Rombel', key: 'tingkatRombel' },
          { label: 'Role', key: 'role' },
        ].filter(
          (f) =>
            !f.role ||
            (f.role === 'teacher' &&
              ![UserRole.SISWA, UserRole.KETUA_KELAS].includes(target.rawData.role as UserRole)),
        )
      : [
          { label: 'Kelas / Rombel', key: 'tingkatRombel' },
          { label: 'No. Telepon / WA Siswa', key: 'phone' },
          { label: 'Alamat Domisili Siswa', key: 'address' },
          { label: 'NIK (16 Digit)', key: 'nik' },
          { label: 'Tempat Lahir', key: 'tempatLahir' },
          { label: 'Tanggal Lahir', key: 'tanggalLahir', type: 'date' },
          { label: 'Nama Ayah', key: 'namaAyah' },
          { label: 'Nama Ibu', key: 'namaIbu' },
          { label: 'Pekerjaan Ayah', key: 'pekerjaanAyah' },
          { label: 'Pekerjaan Ibu', key: 'pekerjaanIbu' },
          {
            label: 'Penghasilan Orang Tua',
            key: 'penghasilanOrtu',
            type: 'select',
            options: [
              '-',
              'Kurang dari 1 Juta',
              '1 Juta - 3 Juta',
              '3 Juta - 5 Juta',
              'Lebih dari 5 Juta',
            ],
          },
          { label: 'Nama Wali', key: 'namaWali' },
          { label: 'Hubungan Wali', key: 'hubunganWali' },
          { label: 'No. WhatsApp Wali', key: 'nomorHpWaliWhatsApp' },
          { label: 'No KIP / PIP (Jika Ada)', key: 'nomorKIPP_PIP' },
          {
            label: 'Kebutuhan Khusus',
            key: 'kebutuhanKhusus',
            type: 'select',
            options: [
              'Tidak Ada',
              'Lamban Belajar',
              'Kesulitan Belajar Spesifik',
              'Gangguan Komunikasi',
              'Bakat Luar Biasa',
            ],
          },
          {
            label: 'Disabilitas',
            key: 'disabilitas',
            type: 'select',
            options: ['Tidak Ada', 'Netra', 'Rungu', 'Grahita', 'Daksa', 'Autis'],
          },
        ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-[#151E32] w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
              <PencilIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white tracking-tight uppercase">
              Edit {target.type === 'user' ? 'Data Akun' : 'Pengajuan Data'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-5 no-scrollbar scroll-smooth p-1">
          {editableFields.map((field) => {
            const f = field as any;
            return (
              <div
                key={f.key}
                className="space-y-1.5 focus-within:translate-x-1 transition-transform"
              >
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                  {f.label}
                </label>
                {f.key === 'tingkatRombel' ? (
                  <select
                    value={formData[f.key] || ''}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold transition-all"
                  >
                    <option value="">- Pilih Kelas / Rombel -</option>
                    {classes &&
                      classes.map((cls) => (
                        <option key={cls.id || cls.name} value={cls.name}>
                          {cls.name}
                        </option>
                      ))}
                  </select>
                ) : f.key === 'role' ? (
                  <select
                    value={formData[f.key] || ''}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold transition-all"
                  >
                    <option value="">- Pilih Role -</option>
                    {(UserRole ? Object.values(UserRole) : []).map((role) => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'select' ? (
                  <select
                    value={formData[f.key] || ''}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold transition-all"
                  >
                    {f.options?.map((opt: string) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={formData[f.key] || ''}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold transition-all placeholder:text-slate-400"
                    placeholder={`Masukkan ${f.label}...`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-wide"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-wide hover:bg-indigo-700 shadow-xl shadow-indigo-600/30"
          >
            Simpan Perubahan
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const AccountApproval: React.FC<{
  onBack: () => void;
  initialTab?:
    | 'Persetujuan Akun'
    | 'Persetujuan Data'
    | 'Verifikasi Onboarding'
    | 'Persetujuan Profil Baru';
  onOpenSidebar?: () => void;
}> = ({ onBack, initialTab, onOpenSidebar }) => {
  const usersList = useAdminStore((state) => state.usersList);

  const dataRequests = useAdminStore((state) => state.pendingApprovals);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | 'Persetujuan Akun'
    | 'Akun Disetujui'
    | 'Persetujuan Data'
    | 'Persetujuan Profil Baru'
    | 'GTK'
    | '10'
    | '11'
    | '12'
    | 'Tanpa Rombel'
    | 'Tidak Aktif'
    | 'Verifikasi Onboarding'
  >(
    initialTab === 'Verifikasi Onboarding'
      ? 'Persetujuan Profil Baru'
      : initialTab || 'Persetujuan Akun',
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleForceRefresh = async () => {
    setRefreshing(true);
    const toastId = toast.loading('Membersihkan cache & memuat ulang data segar dari Firestore...');
    try {
      const { localDb } = await import('@/database/dexie');

      const tenantId = useUserStore.getState().tenantId;
      if (!tenantId) throw new Error('tenantId required');

      // Clear cache
      await localDb.cache.delete(`users_list_${tenantId}`);
      await localDb.cache.delete(`pending_approvals_${tenantId}`);

      // Resubscribe to trigger fetch
      useAdminStore.getState().subscribePendingApprovals();
      useAdminStore.getState().subscribeUsersList();

      setTimeout(() => {
        setRefreshing(false);
        toast.success('Cache berhasil diperbarui dengan data Firestore terbaru!', { id: toastId });
      }, 1000);
    } catch (e) {
      setRefreshing(false);
      toast.error('Gagal memperbarui cache data: ' + sanitizeError(e), { id: toastId });
    }
  };

  const students = useStudentStore((state) => state.students);
  const fetchStudents = useStudentStore((state) => state.fetchStudents);
  const classes = useStudentStore((state) => state.classes);

  // Edit State
  const [editTarget, setEditTarget] = useState<{
    id: string;
    type: 'user' | 'data';
    rawData: any;
    originalReq: any;
  } | null>(null);

  // Custom Confirm Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    message: string;
    title?: string;
    onConfirm: () => void;
  } | null>(null);

  const handleSaveEdit = async (updatedData: any) => {
    if (!editTarget) return;
    try {
      if (editTarget.type === 'user') {
        const appClasses = useStudentStore.getState().classes;
        await useAdminStore
          .getState()
          .updateUserDataAndSync(editTarget.id, updatedData, appClasses);
        toast.success('Data user berhasil diperbarui!');
      } else if (editTarget.type === 'data') {
        await useAdminStore.getState().reviseProfileUpdateRequest(editTarget.id, updatedData);
        toast.success('Pengajuan data berhasil direvisi!');
      }
      setEditTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(`Gagal menyimpan perubahan: ${sanitizeError(err)}`);
    }
  };

  const handleSuspendUser = async (id: string, name: string) => {
    setConfirmConfig({
      title: 'Konfirmasi Penonaktifan',
      message: `Apakah Anda yakin ingin MENONAKTIFKAN akun ${name}?`,
      onConfirm: async () => {
        try {
          await useAdminStore.getState().suspendUser(id, name);
          toast.success(`Akun ${name} dinonaktifkan.`);
        } catch (e) {
          console.error(e);
          toast.error(`Gagal menonaktifkan akun: ${sanitizeError(e)}`);
        }
      },
    });
  };

  const handleReactivateUser = async (req: ApprovalRequest) => {
    try {
      await useAdminStore.getState().reactivateUser(req.id, req.displayName);
      toast.success(`Akun ${req.displayName} diaktifkan kembali.`);
    } catch (e) {
      console.error(e);
      toast.error(`Gagal mengaktifkan akun: ${sanitizeError(e)}`);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const unsubPending = useAdminStore.getState().subscribePendingApprovals();
    const unsubUsers = useAdminStore.getState().subscribeUsersList();
    setLoading(false);
    return () => {
      unsubPending();
      unsubUsers();
    };
  }, []);

  const enhancedUsers = useMemo(() => {
    return usersList.map((u) => {
      let assignedClass = u.tingkatRombel || '';
      if (!assignedClass && (u.studentId || u.studentsId)) {
        const sid = u.studentId || u.studentsId;
        const student = students.find(
          (s) => s.id === sid || s.studentsId === sid || s.idUnik === sid,
        );
        if (student && student.tingkatRombel) {
          assignedClass = student.tingkatRombel;
        }
      }
      return { ...u, assignedClass };
    });
  }, [usersList, students]);

  const filteredUsers = useMemo(() => {
    const GTK_ROLES = [
      UserRole.ADMIN,
      UserRole.DEVELOPER,
      UserRole.KEPALA_MADRASAH,
      UserRole.GURU,
      UserRole.WALI_KELAS,
      UserRole.STAF,
      UserRole.GTK,
      UserRole.WAKAMAD,
      UserRole.KEPALA_TU,
      UserRole.GURU_BK,
      UserRole.PUSTAKAWAN,
      UserRole.LABORAN,
      UserRole.PEMBINA_EKSKUL,
      UserRole.HUMAS,
      UserRole.KURIKULUM,
      UserRole.PIKET,
      UserRole.KESISWAAN,
    ];

    const filtered = enhancedUsers.filter((u: any) => {
      const isPending =
        u.status === 'pending' ||
        u.accountStatus === 'pending_approval' ||
        u.status === 'pending_account_approval' ||
        u.status === 'pending_approval' ||
        u.status === 'needs_data_linkage' ||
        u.status === 'pending_data_approval' ||
        u.approvalStatus === 'pending';
      const isInactive =
        u.status === 'inactive' ||
        u.status === 'suspended' ||
        u.accountStatus === 'suspended' ||
        u.accountStatus === 'rejected' ||
        u.status === 'Nonaktif' ||
        u.status === 'Suspended';
      const isStudent = String(u.role).toLowerCase() === 'siswa';

      if (activeTab === 'Persetujuan Akun') {
        return isPending;
      }
      if (activeTab === 'Akun Disetujui') {
        const isApproved = u.status === 'active' || u.accountStatus === 'Active' || u.status === 'Active';
        return isApproved;
      }
      if (activeTab === 'Tidak Aktif') {
        return isInactive && !isPending;
      }

      // Skip pending/suspended accounts for standard role/class tabs to keep lists clean
      if (isPending || isInactive) return false;

      if (activeTab === 'GTK') {
        return GTK_ROLES.includes(u.role as UserRole) || (!isStudent && u.role);
      }
      if (['10', '11', '12'].includes(activeTab)) {
        return isStudent && u.assignedClass?.startsWith(activeTab);
      }
      if (activeTab === 'Tanpa Rombel') {
        const noRombelValues = [
          '',
          '-',
          'BELUM_DISET',
          '-- TANPA ROMBEL --',
          'undefined',
          'TANPA ROMBEL',
        ];
        return (
          isStudent &&
          (!u.assignedClass || noRombelValues.includes(u.assignedClass.trim().toUpperCase()))
        );
      }

      return false;
    });
    return filtered;
  }, [enhancedUsers, activeTab]);

  const searchedUsers = useMemo(() => {
    if (!searchQuery.trim()) return filteredUsers;
    const queryStr = searchQuery.toLowerCase().trim();
    return filteredUsers.filter(
      (u: any) =>
        String(u.displayName || '')
          .toLowerCase()
          .includes(queryStr) ||
        String(u.email || '')
          .toLowerCase()
          .includes(queryStr) ||
        String(u.phone || '')
          .toLowerCase()
          .includes(queryStr) ||
        String(u.nisn || u.studentsId || u.teachersId || '')
          .toLowerCase()
          .includes(queryStr) ||
        String(u.role || '')
          .toLowerCase()
          .includes(queryStr),
    );
  }, [filteredUsers, searchQuery]);

  const searchedDataRequests = useMemo(() => {
    if (!searchQuery.trim()) return dataRequests;
    const queryStr = searchQuery.toLowerCase().trim();
    return dataRequests.filter(
      (req: any) =>
        String(req.displayName || '')
          .toLowerCase()
          .includes(queryStr) ||
        String(req.userId || '')
          .toLowerCase()
          .includes(queryStr) ||
        String(req.idUnik || req.studentsId || req.studentId || req.nisn || '')
          .toLowerCase()
          .includes(queryStr) ||
        Object.keys(req.requestedChanges || {}).some((k) =>
          String(req.requestedChanges[k] || '')
            .toLowerCase()
            .includes(queryStr),
        ),
    );
  }, [dataRequests, searchQuery]);

  const handleApprove = async (req: ApprovalRequest) => {
    try {
      const res = await approvePendingAccount(req);
      if (res.success) {
        toast.success(`Akun ${req.displayName} berhasil disetujui`);
      } else {
        throw new Error(res.message);
      }
    } catch (e: any) {
      toast.error(`Gagal menyetujui akun: ${e?.message || e || ''}`);
    }
  };

  const handleReject = async (id: string) => {
    setConfirmConfig({
      title: 'Konfirmasi Tolak Pendaftaran',
      message: 'Tolak dan hapus data pengajuan ini?',
      onConfirm: async () => {
        try {
          await useAdminStore.getState().rejectPendingAccount(id);
          toast.info('Pendaftaran ditolak.');
        } catch (e) {
          toast.error('Gagal menolak akun.');
        }
      },
    });
  };

  const handleWhatsApp = (req: ApprovalRequest) => {
    if (!req.phone) {
      toast.error('Nomor WhatsApp tidak tersedia');
      return;
    }
    const phone = req.phone.replace(/^0/, '62').replace(/[^\d]/g, '');

    const noRombelValues = [
      '',
      '-',
      'BELUM_DISET',
      '-- TANPA ROMBEL --',
      'undefined',
      'TANPA ROMBEL',
    ];
    const isNoClass =
      !req.tingkatRombel ||
      noRombelValues.includes(
        String(req.tingkatRombel || '')
          .trim()
          .toUpperCase(),
      );
    const isPending = req.accountStatus === 'pending_approval';

    let message = '';
    if (isNoClass && String(req.role).toLowerCase() === 'siswa') {
      message = `Assalamu'alaikum *${req.displayName}*,\n\nKami dari *Admin e-Mam System - MAN 1 HST*. Terkait pendaftaran/data akun Anda, kami mencatat Anda *BELUM TERDAFTAR DI ROMBEL/KELAS*.\n\nMohon informasikannya kepada kami: *Anda dari Kelas/Rombel mana?* (Contoh: 10 A, 11 B, dsb) agar data dapat kami perbarui.\n\nTerima kasih.`;
    } else if (isPending) {
      message = `Assalamu'alaikum *${req.displayName}*,\n\nKami dari *Admin e-Mam System - MAN 1 HST*. Pendaftaran akun Anda sedang kami tinjau. Mohon tunggu proses verifikasi selanjutnya.\n\nTerima kasih.`;
    } else if (req.accountStatus === 'Active' || req.status === 'Active') {
      message = `Assalamu'alaikum *${req.displayName}*,\n\nAlhamdulillah, akun Anda di *e-Mam System - MAN 1 HST* telah *AKTIF/DISETUJUI*.\n\nSilakan login menggunakan email: ${req.email}\n\nTerima kasih.`;
    } else {
      message = `Assalamu'alaikum *${req.displayName}*,\n\nKami dari *Admin e-Mam System - MAN 1 HST*. Terkait akun Anda, mohon hubungi admin untuk informasi lebih lanjut.\n\nTerima kasih.`;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleApproveData = async (
    reqId: string,
    studentId: string,
    userId: string,
    changes: any,
  ) => {
    try {
      await useAdminStore.getState().approveProfileUpdateRequest(reqId, studentId, userId, changes);
      toast.success('Perubahan data disetujui!');
    } catch (err: any) {
      console.error('Gagal menyetujui data:', err);
      toast.error(`Gagal menyetujui data: ${err?.message || err}`);
    }
  };

  const handleRejectData = async (reqId: string) => {
    setConfirmConfig({
      title: 'Tolak Perubahan Data',
      message: 'Tolak perubahan data siswa ini?',
      onConfirm: async () => {
        try {
          await useAdminStore.getState().rejectProfileUpdateRequest(reqId);
          toast.success('Perubahan data ditolak.');
        } catch (err) {
          toast.error('Gagal menolak data');
        }
      },
    });
  };

  const handlePermanentDeleteUser = async (id: string, name: string) => {
    setConfirmConfig({
      title: 'Hapus Permanen Akun',
      message: `HAPUS PERMANEN akun ${name} dari sistem dan Firebase Auth?\n\nTindakan ini tidak bisa dibatalkan!`,
      onConfirm: async () => {
        try {
          const result = await deleteAccountByAdmin(id);
          if (result.success) {
            toast.success(`Akun ${name} berhasil dihapus permanen.`);
          } else {
            throw new Error(result.error || result.message || 'Gagal menghapus akun');
          }
        } catch (e: any) {
          console.error(e);
          toast.error(`Gagal menghapus akun secara permanen: ${sanitizeError(e)}`);
        }
      },
    });
  };

  const handlePermanentDeleteDataRequest = async (id: string) => {
    setConfirmConfig({
      title: 'Hapus Permanen Pengajuan',
      message: 'HAPUS PERMANEN pengajuan data ini?\n\nTindakan ini tidak bisa dibatalkan!',
      onConfirm: async () => {
        try {
          await useAdminStore.getState().deleteProfileUpdateRequest(id);
          toast.success('Pengajuan data berhasil dihapus permanen.');
        } catch (e) {
          console.error(e);
          toast.error('Gagal menghapus pengajuan data.');
        }
      },
    });
  };

  const TABS = [
    'Persetujuan Akun',
    'Akun Disetujui',
    'Persetujuan Profil Baru',
    'Persetujuan Data',
    'GTK',
    '10',
    '11',
    '12',
    'Tanpa Rombel',
    'Tidak Aktif',
  ] as const;

  return (
    <Layout
      title="MODERASI SISTEM"
      subtitle="VERIFIKASI & MANAJEMEN AKSES"
      icon={ShieldCheckIcon}
      onBack={onBack}
      onOpenSidebar={onOpenSidebar}
    >
      <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-44 space-y-8">
        {/* Modern Tab Carousel */}
        <div className="sticky top-0 z-20 pb-2 bg-[#F8FAFC]/80 dark:bg-[#0B1121]/80 backdrop-blur-xl -mx-4 px-4 pt-1">
          <div className="flex p-1.5 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
            {TABS.map((tab) => {
              const count =
                activeTab === tab
                  ? tab === 'Persetujuan Data'
                    ? dataRequests.length
                    : tab === 'Persetujuan Profil Baru'
                      ? undefined
                      : filteredUsers.length
                  : undefined;
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative whitespace-nowrap px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all flex items-center gap-2 group overflow-hidden ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl"
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                  {count !== undefined && (
                    <span
                      className={`relative z-10 px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                    >
                      {count}
                    </span>
                  )}
                  {tab === 'Persetujuan Data' &&
                    activeTab !== 'Persetujuan Data' &&
                    dataRequests.length > 0 && (
                      <span className="relative z-10 w-2 h-2 rounded-full bg-amber-500 animate-pulse border-2 border-white dark:border-slate-900" />
                    )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar & Local Cache Refresh Controller */}
        {activeTab !== 'Persetujuan Profil Baru' && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama, email, nomor HP, NISN, atau role..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:focus:border-indigo-500 transition-all font-sans"
              />
            </div>

            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 border border-emerald-500/10 dark:border-emerald-500/5 bg-emerald-500/5 px-4 py-2.5 rounded-2xl select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Cache Lokal Aktif
                </span>
              </div>

              <button
                type="button"
                disabled={refreshing}
                onClick={handleForceRefresh}
                className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 group hover:border-indigo-600"
                title="Segarkan data dari server"
              >
                <ArrowPathIcon
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}
                />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center flex justify-center flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Menyiapkan Data...
            </p>
          </div>
        ) : activeTab === 'Persetujuan Profil Baru' ? (
          <OnboardingApproval />
        ) : activeTab === 'Persetujuan Data' ? (
          searchedDataRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-32 text-center flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                <ShieldCheckIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              </div>
              <div className="space-y-1">
                <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-slate-800 dark:text-white">
                  Tidak Ada Data
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Tidak ada pengajuan pembaruan data yang cocok saat ini
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-5"
            >
              {searchedDataRequests.map((req: any) => (
                <motion.div
                  variants={itemVariants}
                  key={req.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-amber-500/10 dark:border-amber-500/5 shadow-sm hover:shadow-xl hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-5 truncate">
                        <div className="w-14 h-14 shrink-0 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-800 shadow-inner group-hover:scale-110 transition-transform">
                          <UserIcon className="w-7 h-7" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-slate-800 dark:text-white uppercase text-[13px] tracking-tight truncate">
                              {req.displayName}
                            </p>
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-lg text-[9px] font-bold uppercase ">
                              DATA UPDATE
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-indigo-600 dark:text-indigo-400 font-extrabold">
                              {req.entityType === 'teacher'
                                ? 'GURU / PEGAWAI'
                                : req.entityType === 'user'
                                  ? 'KOREKSI AKUN'
                                  : 'SISWA MATRIK'}
                            </span>
                            {req.entityType === 'student' && req.oldData?.tingkatRombel && (
                              <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-emerald-600 font-bold">
                                {req.oldData.tingkatRombel}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide truncate mt-2">
                            ID: {req.idUnik || req.studentsId || req.studentId || req.nisn}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                              {
                                Object.keys(req.requestedChanges || {}).filter(
                                  (k) => req.requestedChanges[k],
                                ).length
                              }{' '}
                              Kolom Diubah
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() =>
                            setEditTarget({
                              id: req.id,
                              type: 'data',
                              rawData: req.requestedChanges,
                              originalReq: req,
                            })
                          }
                          className="flex-1 sm:flex-none p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Edit Data"
                        >
                          <PencilIcon className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={() =>
                            handleApproveData(
                              req.id,
                              req.studentId || req.studentsId,
                              req.userId,
                              req.requestedChanges,
                            )
                          }
                          className="flex-1 sm:flex-none p-3.5 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                          title="Setujui"
                        >
                          <CheckCircleIcon className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleRejectData(req.id)}
                          className="flex-1 sm:flex-none p-3.5 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                          title="Tolak"
                        >
                          <XCircleIcon className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={() => handlePermanentDeleteDataRequest(req.id)}
                          className="flex-1 sm:flex-none p-3.5 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                          title="Hapus"
                        >
                          <TrashIcon className="w-5 h-5 mx-auto" />
                        </button>
                      </div>
                    </div>
                    {renderDiff(req)}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )
        ) : searchedUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 text-center flex flex-col items-center gap-6"
          >
            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-slate-800">
              <UsersIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </div>
            <div className="space-y-1">
              <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-slate-800 dark:text-white">
                KOSONG / TIDAK COCOK
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Tidak ada record pengguna yang cocok dengan kriteria pencarian
              </p>
            </div>
          </motion.div>
        ) : (
          <PendingActivationList users={searchedUsers} onUpdate={() => {}} />
        )}

        {/* Modals & Dialogs */}
        <AnimatePresence>
          {editTarget && (
            <EditDataModal
              target={editTarget}
              onClose={() => setEditTarget(null)}
              onSave={handleSaveEdit}
            />
          )}

          {confirmConfig && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
              >
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-200 dark:border-rose-800">
                  <ExclamationTriangleIcon className="w-10 h-10 text-rose-600 dark:text-rose-500" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white tracking-tight uppercase text-lg mb-3">
                  {confirmConfig.title || 'Respon Konfirmasi'}
                </h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-8 leading-relaxed">
                  {confirmConfig.message}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmConfig(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-wide"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      confirmConfig.onConfirm();
                      setConfirmConfig(null);
                    }}
                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-wide shadow-xl shadow-rose-500/30"
                  >
                    Ya, Lanjutkan
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default AccountApproval;
