import React, { useState, useEffect, useMemo } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useSystemStore } from '@/stores/systemStore';
import {
  createLetterRequest,
  updateLetterStatus,
  deleteLetter,
  uploadLetterAttachment,
  markLettersAsRead,
} from '@/services/letterService';
import { useLetters } from '@/services/hooks/useLetters';
import type { MadrasahData, LetterRequest, LetterStatus } from '@/types';
import { UserRole, ServiceCategory } from '@/types';
import LetterPreview from './LetterPreview';
import { isMockMode } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import Layout from '@/layouts/Layout';
import {
  EnvelopeIcon,
  PlusIcon,
  FileText,
  TrashIcon,
  SparklesIcon,
  Loader2,
  XCircleIcon,
} from '@/shared/Icons';
import { getStudentByUserId } from '@/services/studentService';
import { getClassById } from '@/services/classService';

import {
  LetterDateGroup,
  CategorySelectGrid,
  CreateLetterForm,
  LetterDetailView,
  SubmitConfirmModal,
  LetterPreviewModal,
  type LetterFormData,
} from './components';

interface LettersProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
  userRole: UserRole;
  isPublic?: boolean;
}

const Letters: React.FC<LettersProps> = ({
  onBack,
  onOpenSidebar,
  userRole,
  isPublic = false,
}) => {
  // Roles and permissions
  const isTU =
    userRole === UserRole.STAF || userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;
  const isValidator = userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;
  const isSigner = userRole === UserRole.KEPALA_MADRASAH || userRole === UserRole.DEVELOPER;
  const canViewAll = isTU || isValidator || isSigner;

  const isApplicant = [
    UserRole.SISWA,
    UserRole.GURU,
    UserRole.ORANG_TUA,
    UserRole.STAF,
    UserRole.WALI_KELAS,
    UserRole.KETUA_KELAS,
  ].includes(userRole);

  const {
    letters: dbLetters,
    loading: dbLoading,
    refetch,
    invalidateCache,
  } = useLetters(userRole, canViewAll, isPublic);

  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockMode) {
      setLetters([
        {
          id: '1',
          userId: 'mock',
          tenantId: '30315537',
          userName: 'Ahmad Dahlan',
          userRole: UserRole.SISWA,
          category: ServiceCategory.SISWA,
          type: 'Surat Keterangan Aktif',
          description: 'Untuk persyaratan beasiswa prestasi daerah.',
          date: new Date().toISOString(),
          status: 'Verified',
          letterNumber: '421/105/MAN1/2024',
          verifiedBy: 'Staf TU',
          verifiedAt: new Date().toISOString(),
        },
      ] as any);
      setLoading(false);
    } else {
      setLetters(dbLetters);
      setLoading(dbLoading);
    }
  }, [dbLetters, dbLoading]);

  const [filterStatus, setFilterStatus] = useState<LetterStatus | 'All'>('All');
  const [madrasah, setMadrasah] = useState<MadrasahData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'create' | 'detail' | 'preview' | 'category-select'>(
    'category-select',
  );
  const [selectedLetter, setSelectedLetter] = useState<LetterRequest | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Form State
  const [formData, setFormData] = useState<LetterFormData>({
    type: '',
    description: '',
    userName: '',
    contactInfo: '',
    dataKelulusan: '',
    className: '',
    waliKelas: '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUserStudent, setCurrentUserStudent] = useState<any>(null);

  // Admin/TU Action State
  const [adminNote, setAdminNote] = useState('');
  const [letterNumber, setLetterNumber] = useState('');

  const fetchMadrasahInfo = useSystemStore((state) => state.fetchMadrasahInfo);

  // Fetch Data
  const fetchLetters = async () => {
    if (isPublic) {
      setLoading(false);
      handleCreate();
      return;
    }
    refetch();
  };

  useEffect(() => {
    fetchLetters();

    const getMadrasah = async () => {
      try {
        const info = await fetchMadrasahInfo();
        if (info) setMadrasah(info);
      } catch (e) {
        console.error('Error fetching madrasah info in letters:', e);
      }
    };
    getMadrasah();
  }, [canViewAll, fetchMadrasahInfo, isPublic]);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (isMockMode) {
        setCurrentUserStudent({
          tingkatRombel: '10 A',
          namaLengkap: 'Nawwafi Akrm Khalifi',
          waliKelasNama: 'Ustadz Ahmad',
        });
        return;
      }
      const user = useAuthStore.getState().user;
      if (user && (userRole === UserRole.SISWA || userRole === UserRole.ORANG_TUA)) {
        try {
          const studentData = user ? await getStudentByUserId(user.uid) : null;

          if (studentData) {
            const baseStudent = { ...studentData } as any;
            setCurrentUserStudent(baseStudent);

            if (studentData.tingkatRombel) {
              const classData = await getClassById(studentData.tingkatRombel);
              if (classData && classData.teacherName) {
                setCurrentUserStudent((prev: any) => ({
                  ...prev,
                  waliKelasNama: classData.teacherName,
                }));
              }
            }
          }
        } catch (err) {
          console.error('Error fetching student profile for letter:', err);
        }
      }
    };

    fetchStudentProfile();
  }, [userRole]);

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const filteredLetters = useMemo(() => {
    if (filterStatus === 'All') return letters;
    return letters.filter((l) => l.status === filterStatus);
  }, [letters, filterStatus]);

  const groupedLetters = useMemo(() => {
    const groups: Record<string, LetterRequest[]> = {};
    filteredLetters.forEach((letter) => {
      const dateKey = letter.date ? letter.date.split('T')[0] : 'Tanggal Tidak Diketahui';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(letter);
    });
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .reduce(
        (acc, key) => {
          acc[key] = groups[key];
          return acc;
        },
        {} as Record<string, LetterRequest[]>,
      );
  }, [filteredLetters]);

  useEffect(() => {
    if (Object.keys(groupedLetters).length > 0 && Object.keys(expandedDates).length === 0) {
      const firstDate = Object.keys(groupedLetters)[0];
      setExpandedDates({ [firstDate]: true });
    }
  }, [groupedLetters]);

  const toggleDateGroup = async (dateKey: string) => {
    const isNowExpanded = !expandedDates[dateKey];
    setExpandedDates((prev) => ({
      ...prev,
      [dateKey]: isNowExpanded,
    }));

    if (isNowExpanded) {
      const unreadLetterIds = (groupedLetters[dateKey] || [])
        .filter((l) => !l.is_read && l.id)
        .map((l) => l.id as string);

      if (unreadLetterIds.length > 0) {
        try {
          await markLettersAsRead(unreadLetterIds);
          setLetters((prev) =>
            prev.map((l) => {
              if (l.id && unreadLetterIds.includes(l.id)) {
                return { ...l, is_read: true };
              }
              return l;
            }),
          );
        } catch (err) {
          console.error('Failed marking letters as read:', err);
        }
      }
    }
  };

  const handleCreate = () => {
    if (isPublic) {
      setSelectedCategory(null);
      setViewMode('category-select');
    } else {
      const parsedCat =
        userRole === UserRole.SISWA
          ? ServiceCategory.SISWA
          : userRole === UserRole.GTK ||
              [UserRole.GURU, UserRole.STAF, UserRole.WALI_KELAS].includes(userRole)
            ? ServiceCategory.GTK
            : ServiceCategory.SISWA;
      setSelectedCategory(parsedCat);

      setFormData({
        type: '',
        description: '',
        userName: useAuthStore.getState().user?.displayName || currentUserStudent?.namaLengkap || '',
        contactInfo: useAuthStore.getState().user?.email || useAuthStore.getState().user?.profile?.phoneNumber || '',
        dataKelulusan: '',
        className:
          parsedCat === ServiceCategory.SISWA && currentUserStudent
            ? currentUserStudent.tingkatRombel || ''
            : '',
        waliKelas:
          parsedCat === ServiceCategory.SISWA && currentUserStudent
            ? currentUserStudent.waliKelasNama || ''
            : '',
      });
      setViewMode('create');
    }
    setIsModalOpen(true);
  };

  const handleSelectCategory = (cat: ServiceCategory) => {
    setSelectedCategory(cat);
    setFormData({
      type: '',
      description: '',
      userName: useAuthStore.getState().user?.displayName || currentUserStudent?.namaLengkap || '',
      contactInfo: useAuthStore.getState().user?.email || useAuthStore.getState().user?.profile?.phoneNumber || '',
      dataKelulusan: '',
      className:
        cat === ServiceCategory.SISWA && currentUserStudent
          ? currentUserStudent.tingkatRombel || ''
          : '',
      waliKelas:
        cat === ServiceCategory.SISWA && currentUserStudent
          ? currentUserStudent.waliKelasNama || ''
          : '',
    });
    setAttachment(null);
    setViewMode('create');
  };

  const getServiceTypes = (cat: ServiceCategory) => {
    switch (cat) {
      case ServiceCategory.GTK:
        return [
          'Surat tugas / perjalanan dinas',
          'Cuti / izin',
          'SK / administrasi kepegawaian',
          'Permintaan dokumen internal',
          'Pengajuan sarana prasarana',
        ];
      case ServiceCategory.SISWA:
        return [
          'Surat aktif siswa',
          'Surat izin / sakit',
          'Pengajuan pindah sekolah',
          'Legalisir dokumen',
          'Permohonan kartu pelajar',
        ];
      case ServiceCategory.ALUMNI:
        return [
          'Legalisir ijazah',
          'Transkrip nilai',
          'Surat keterangan alumni',
          'Verifikasi data lulusan',
        ];
      case ServiceCategory.TAMU:
        return [
          'Permohonan kunjungan',
          'Surat pengantar',
          'Permintaan data publik',
          'Pengaduan / aspirasi',
          'Kerja sama / instansi',
        ];
      default:
        return [];
    }
  };

  const handleView = async (letter: LetterRequest) => {
    setSelectedLetter(letter);
    setAdminNote(letter.adminNote || '');
    setLetterNumber(letter.letterNumber || '');
    setViewMode('detail');
    setIsModalOpen(true);

    if (!letter.is_read && letter.id) {
      try {
        await markLettersAsRead([letter.id]);
        setLetters((prev) =>
          prev.map((l) => {
            if (l.id === letter.id) {
              return { ...l, is_read: true };
            }
            return l;
          }),
        );
      } catch (err) {
        console.error('Failed marking letter as read on view:', err);
      }
    }
  };

  const executeSubmitRequest = async () => {
    const toastId = toast.loading('Mengirim permohonan...');
    setIsUploading(true);
    try {
      const tenantId = useUserStore.getState().tenantId;
      if (!tenantId) throw new Error('tenantId required');

      const user = useAuthStore.getState().user;
      const userName = isPublic
        ? formData.userName
        : user?.displayName || (isMockMode ? 'User Simulasi' : 'Pengguna');
      const uid = isPublic ? undefined : user?.id || (isMockMode ? 'user-1' : 'unknown');

      let attachmentUrl = '';
      if (attachment) {
        toast.loading('Mengunggah lampiran dokumen...', { id: toastId });
        attachmentUrl = await uploadLetterAttachment(attachment);
      }

      toast.loading('Menyimpan data permohonan ke database...', { id: toastId });
      const requestData: any = {
        userId: uid,
        tenantId: tenantId,
        userName: formData.userName || userName,
        userRole: isPublic ? 'Tamu' : userRole,
        category: selectedCategory!,
        type: formData.type,
        description: formData.description,
        date: new Date().toISOString(),
        status: 'Pending',
        contactInfo: formData.contactInfo,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        className: formData.className || undefined,
        waliKelas: formData.waliKelas || undefined,
        formData: {
          dataKelulusan: formData.dataKelulusan,
        },
      };

      await createLetterRequest(requestData as any);

      if (!isPublic) {
        invalidateCache();
      }

      toast.success('Permohonan berhasil dikirim!', { id: toastId });
      setIsModalOpen(false);
      setAttachment(null);
      if (isPublic) {
        toast.info('Terima kasih. Anda akan diarahkan kembali ke halaman utama.');
        setTimeout(() => {
          onBack();
        }, 2000);
      }
    } catch (e: any) {
      console.error(e?.message || 'Error');
      toast.error('Gagal mengirim permohonan.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.description) {
      toast.error('Mohon lengkapi data permohonan.');
      return;
    }

    if (isPublic && (!formData.userName || !formData.contactInfo)) {
      toast.error('Mohon lengkapi identitas Anda.');
      return;
    }

    const isSakitIzinType =
      formData.type.toLowerCase().includes('izin') ||
      formData.type.toLowerCase().includes('sakit') ||
      formData.type.toLowerCase().includes('ijin');

    if (isSakitIzinType) {
      setShowConfirmSubmit(true);
    } else {
      executeSubmitRequest();
    }
  };

  const handleUpdateStatus = async (newStatus: LetterStatus) => {
    if (!selectedLetter) return;

    if (newStatus === 'Verified' && !letterNumber) {
      toast.error('Nomor surat wajib diisi oleh Tata Usaha.');
      return;
    }

    const toastId = toast.loading('Memperbarui status surat...');
    try {
      const updatePayload: Partial<LetterRequest> = {
        status: newStatus,
        adminNote: adminNote,
      };

      const user = useAuthStore.getState().user;
      const actorName = user?.displayName || 'System';

      if (newStatus === 'Verified') {
        updatePayload.letterNumber = letterNumber;
        updatePayload.verifiedBy = actorName;
        updatePayload.verifiedAt = new Date().toISOString();
      } else if (newStatus === 'Validated') {
        updatePayload.validatedBy = actorName;
        updatePayload.validatedAt = new Date().toISOString();
      } else if (newStatus === 'Signed') {
        updatePayload.signedBy = actorName;
        updatePayload.signedAt = new Date().toISOString();
        updatePayload.digitalSignatureHash = `SIGNED-${selectedLetter.id}-${Date.now()}`;
      }

      await updateLetterStatus(selectedLetter.id!, newStatus, updatePayload);
      invalidateCache();

      toast.success(`Status berhasil diubah: ${newStatus}`, { id: toastId });
      setIsModalOpen(false);
    } catch (e) {
      toast.error('Gagal memperbarui status.', { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus permohonan ini?')) {
      try {
        await deleteLetter(id);
        invalidateCache();
        toast.success('Permohonan dihapus.');
        if (isModalOpen) setIsModalOpen(false);
      } catch (e) {
        toast.error('Gagal menghapus.');
      }
    }
  };

  return (
    <Layout
      title="Layanan Surat"
      subtitle="Sistem Terpadu PTSP"
      icon={EnvelopeIcon}
      onBack={onBack}
      onOpenSidebar={onOpenSidebar}
      actions={
        <button
          onClick={handleCreate}
          disabled={loading}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            loading
              ? 'bg-slate-100 text-slate-300'
              : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700'
          }`}
        >
          <PlusIcon className="w-4 h-4" /> Ajukan
        </button>
      }
    >
      <div className="p-4 lg:p-6 pb-24 space-y-6">
        {/* Status Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Pending', 'Proses', 'Verified', 'Validated', 'Signed', 'Ditolak'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  filterStatus === status
                    ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {status === 'All' ? 'Semua' : status === 'Signed' ? 'Selesai' : status}
              </button>
            ),
          )}
        </div>

        {/* Letters List or Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-wide">Sinkronisasi PTSP...</p>
          </div>
        ) : Object.keys(groupedLetters).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedLetters).map(([dateKey, groupLetters]) => (
              <LetterDateGroup
                key={dateKey}
                dateKey={dateKey}
                groupLetters={groupLetters}
                isExpanded={!!expandedDates[dateKey]}
                canViewAll={canViewAll}
                onToggle={toggleDateGroup}
                onViewLetter={handleView}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <EnvelopeIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Belum ada permohonan surat.
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 text-indigo-600 font-bold text-xs hover:underline"
            >
              Buat Permohonan Baru
            </button>
          </div>
        )}

        {/* Primary Modal Container */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  {viewMode === 'create' ? (
                    <PlusIcon className="w-5 h-5 text-indigo-500" />
                  ) : viewMode === 'category-select' ? (
                    <SparklesIcon className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-indigo-500" />
                  )}
                  {viewMode === 'create'
                    ? 'Buat Permohonan'
                    : viewMode === 'category-select'
                      ? 'Pilih Layanan'
                      : 'Detail Surat'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto">
                {viewMode === 'preview' && selectedLetter && madrasah ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <LetterPreview letter={selectedLetter} madrasah={madrasah} />
                  </div>
                ) : viewMode === 'category-select' ? (
                  <CategorySelectGrid onSelectCategory={handleSelectCategory} />
                ) : viewMode === 'create' ? (
                  <CreateLetterForm
                    isPublic={isPublic}
                    selectedCategory={selectedCategory}
                    formData={formData}
                    attachment={attachment}
                    setFormData={setFormData}
                    setAttachment={setAttachment}
                    getServiceTypes={getServiceTypes}
                    onSubmit={handleSubmitRequest}
                  />
                ) : selectedLetter ? (
                  <LetterDetailView
                    selectedLetter={selectedLetter}
                    userRole={userRole}
                    isTU={isTU}
                    isValidator={isValidator}
                    isSigner={isSigner}
                    letterNumber={letterNumber}
                    setLetterNumber={setLetterNumber}
                    handleUpdateStatus={handleUpdateStatus}
                    onOpenPreview={() => setIsPreviewOpen(true)}
                  />
                ) : null}
              </div>

              {/* Modal Footer Controls */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-900 z-10">
                {viewMode === 'preview' ? (
                  <button
                    onClick={() => setViewMode('detail')}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700"
                  >
                    Kembali ke Detail
                  </button>
                ) : viewMode === 'category-select' ? (
                  <button
                    onClick={() => (isPublic ? onBack() : setIsModalOpen(false))}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm"
                  >
                    Batal
                  </button>
                ) : viewMode === 'create' ? (
                  <>
                    <button
                      onClick={() =>
                        isPublic ? setViewMode('category-select') : setIsModalOpen(false)
                      }
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm"
                    >
                      {isPublic ? 'Kembali' : 'Batal'}
                    </button>
                    <button
                      form="createForm"
                      type="submit"
                      disabled={isUploading}
                      className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        'Kirim Permohonan'
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {selectedLetter?.status === 'Pending' && isApplicant && (
                      <button
                        onClick={() => handleDelete(selectedLetter.id!)}
                        className="px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                      >
                        <TrashIcon className="w-4 h-4" /> Batalkan
                      </button>
                    )}
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-200"
                    >
                      Tutup
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmSubmit && (
          <SubmitConfirmModal
            type={formData.type}
            onClose={() => setShowConfirmSubmit(false)}
            onConfirm={() => {
              setShowConfirmSubmit(false);
              executeSubmitRequest();
            }}
          />
        )}

        {/* Fullscreen Print / Preview Modal */}
        {isPreviewOpen && selectedLetter && madrasah && (
          <LetterPreviewModal
            letter={selectedLetter}
            madrasah={madrasah}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Letters;
