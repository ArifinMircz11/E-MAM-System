import { useAuthStore } from '@/stores/authStore';
import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { isMockMode, logout } from '@/services/authService';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import { profileRequestRepository } from '@/repositories/ProfileRequestRepository';
import { TenantContext } from '@/core/context/TenantContext';
import Layout from '@/layouts/Layout';
import {
  LogOutIcon,
  SparklesIcon,
  PlusIcon,
  SaveIcon,
  CameraIcon,
  UserIcon,
  IdentificationIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from '@/shared/Icons';
import type { ViewState } from '@/types';
import { UserRole } from '@/types';
import { roleIcons } from '@/constants/dashboard';
import { toast } from 'sonner';
import { uploadTeacherFile } from '@/services/teacherService';
import { useStudentStore } from '@/stores/studentStore';
import { useSystemStore } from '@/stores/systemStore';
import { useProfileStore } from '@/stores/profileStore';
import { useAutoFix } from '@/hooks/useAutoFix';
import { updateUserProfilePhoto, updateUserCoverPhoto } from '@/services/authService';
import { submitProfileUpdateRequest, updateFullProfileAndAuth } from '@/services/userService';
import { isStudent as isStudentService } from '@/services/securityService';

const ProfileHome = React.lazy(() =>
  import('./ProfileHome').then((m) => ({ default: m.ProfileHome })),
);
const ProfileAccordion = React.lazy(() =>
  import('./ProfileAccordion').then((m) => ({ default: m.ProfileAccordion })),
);

// --- Shared Types & Helpers ---
interface UserProfile {
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  coverURL?: string;
  uid: string;
  phone?: string;
  class?: string;
  address?: string;
  archives?: any[];
  [key: string]: any;
}

const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

// --- Main component ---
const Profile: React.FC<{
  onBack: () => void;
  onLogout: () => void;
  onNavigate?: (view: ViewState) => void;
  onOpenSidebar?: () => void;
}> = ({ onBack, onLogout, onOpenSidebar }) => {
  const { safeCall } = useAutoFix();
  const storeProfile = useProfileStore((s) => s.profile);
  const coreUser = useAuthStore((s) => s.user);
  const profileLoading = useProfileStore((s) => s.isLoading);

  const [profile, setProfile] = useState<UserProfile | null>(storeProfile);
  const [openSection, setOpenSection] = useState<string | null>('home');
  const [loading, setLoading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0 });

  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Koreksi Biodata');
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const classes = useStudentStore((state) => state.classes);
  const fetchClasses = useStudentStore((state) => state.fetchClasses);
  const [editForm, setEditForm] = useState({
    displayName: '',
    // Data Kontak & Wali (New Schema)
    phone: '', // nomorHpSiswa backward compat
    address: '', // alamatRumah backward compat
    nomorHpSiswa: '',
    namaWali: '',
    hubunganWali: '',
    nomorHpWaliWhatsApp: '',
    alamatRumah: '',
    // Keluarga
    namaAyah: '',
    namaIbu: '',
    pekerjaanAyah: '',
    pekerjaanIbu: '',
    penghasilanOrtu: '',
    penghasilanAyahNominal: '',
    penghasilanIbuNominal: '',
    // Data Pokok
    nik: '',
    nisn: '',
    idUnik: '',
    jenisKelamin: '',
    status: '',
    tempatLahir: '',
    tanggalLahir: '',
    nomorKIPP_PIP: '',
    kebutuhanKhusus: '',
    disabilitas: '',
    // Pendidik
    subject: '',
    mapel: '',
    // Akademik
    tingkatRombel: '',
    tahunAngkatan: '',
    targetRombel: '',
    tanggalDiterima: '',
  });
  const [saving, setSaving] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);

  // Profile Sync & Merging Real Database Values (Students/Teachers collections)
  useEffect(() => {
    if (classes.length === 0) {
      fetchClasses().catch(() => {});
    }

    if (!storeProfile && coreUser) {
      setLoading(true);
    } else if (storeProfile) {
      setProfile(storeProfile);
      setLoading(false);

      // Initial check missing fields for e-Mam System v6.5 compliance
      const required = [
        'nik',
        'namaAyah',
        'namaIbu',
        'namaWali',
        'tempatLahir',
        'tanggalLahir',
        'address',
        'phone',
      ];
      const missing = required.filter((f) => !(storeProfile as any)[f]);
      setMissingFields(missing);
    }
  }, [storeProfile, coreUser]);

  // Fetch and merge actual database student/teacher details for real dynamic rendering
  useEffect(() => {
    if (!coreUser) return;

    const loadLinkedDbData = async () => {
      try {
        const context = TenantContext.getContext() as any;
        const isStudent = isStudentService(coreUser.role?.toLowerCase() || '');
        const sId = (coreUser as any).studentsId || (coreUser as any).studentId;
        const tId = (coreUser as any).teachersId || (coreUser as any).teacherId;

        if (isStudent && sId) {
          // Fetch data from local repository
          const sData = (await studentRepository.getById(context, sId)) as any;
          if (sData) {

            setProfile((prev) => {
              const updated = prev
                ? {
                    ...prev,
                    idUnik: sData.studentsId || sData.studentId || sData.idUnik || prev.idUnik,
                    nisn: sData.nisn || prev.nisn || '-',
                    nik: sData.nik || prev.nik || '-',
                    tempatLahir: sData.tempatLahir || prev.tempatLahir || '-',
                    tanggalLahir: sData.tanggalLahir || prev.tanggalLahir || '-',
                    phone: sData.kontakDanWali?.nomorHpSiswa || prev.phone || '-',
                    address: sData.kontakDanWali?.alamatRumah || prev.address || '-',
                    class: sData.tingkatRombel || sData.class || prev.class || '-',
                    namaAyah: sData.namaAyah || prev.namaAyah || '-',
                    namaIbu: sData.namaIbu || prev.namaIbu || '-',
                    pekerjaanAyah: sData.pekerjaanAyah || prev.pekerjaanAyah || '-',
                    pekerjaanIbu: sData.pekerjaanIbu || prev.pekerjaanIbu || '-',
                    penghasilanOrtu: sData.penghasilanOrtu || prev.penghasilanOrtu || '-',
                    nomorKIPP_PIP: sData.nomorKIPP_PIP || prev.nomorKIPP_PIP || '-',
                    kebutuhanKhusus: sData.kebutuhanKhusus || prev.kebutuhanKhusus || '-',
                    disabilitas: sData.disabilitas || prev.disabilitas || '-',
                    namaWali:
                      sData.kontakDanWali?.namaWali || sData.namaWali || prev.namaWali || '-',
                    hubunganWali:
                      sData.kontakDanWali?.hubunganWali ||
                      sData.hubunganWali ||
                      prev.hubunganWali ||
                      '-',
                    nomorHpWaliWhatsApp:
                      sData.kontakDanWali?.nomorHpWaliWhatsApp || prev.nomorHpWaliWhatsApp || '-',
                    alamatRumah: sData.kontakDanWali?.alamatRumah || prev.alamatRumah || '-',
                  }
                : null;

              if (updated) {
                const required = [
                  'nik',
                  'namaAyah',
                  'namaIbu',
                  'namaWali',
                  'tempatLahir',
                  'tanggalLahir',
                  'address',
                  'phone',
                ];
                const missing = required.filter((f) => !(updated as any)[f] || (updated as any)[f] === '-');
                setMissingFields(missing);
              }
              return updated;
            });
          }
        } else if (!isStudent && tId) {
          const tData = (await teacherRepository.getById(context, tId)) as any;
          if (tData) {
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    nip: tData.nip || prev.nip || '-',
                    nik: tData.nik || prev.nik || '-',
                    mapel: tData.mapel || tData.subject || prev.mapel || '-',
                    subject: tData.subject || tData.mapel || prev.subject || '-',
                    jabatan: tData.jabatan || prev.jabatan || '-',
                    phone: tData.noTelepon || tData.phone || prev.phone || tData.whatsapp || '-',
                    address: tData.alamat || tData.address || prev.address || '-',
                    archives: tData.archives || prev.archives || [],
                  }
                : prev,
            );
          }
        }
      } catch (err) {
        console.error('Error loading linked database data:', err);
      }
    };

    loadLinkedDbData();
  }, [coreUser]);

  // Background Data Check (Today restriction check & stats)
  useEffect(() => {
    if (!coreUser) return;

    const checkBackgroundData = async () => {
      // 1. Pending Profile Update Requests
      try {
        const tenantId = TenantContext.getTenantId();
        const snapReq = await profileRequestRepository.fetchPending(tenantId);
        const userPending = snapReq.filter(r => r.userId === coreUser.uid);
        setHasPendingRequest(userPending.length > 0);
      } catch (err) {}

      // 2. Submission Limit Checklist
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const tenantId = TenantContext.getTenantId();
        const querySnap = await profileRequestRepository.getAll(TenantContext.getContext() as any);
        const userRequests = querySnap.filter(r => r.userId === coreUser.uid);
        
        if (userRequests.length > 0) {
          const submittedToday = userRequests.some((data: any) => {
            if (data.status === 'draft') return false;
            if (!data.createdAt) return false;
            let dateStr = '';
            if (typeof data.createdAt === 'string') {
              dateStr = data.createdAt;
            } else if (typeof data.createdAt === 'number') {
              dateStr = new Date(data.createdAt).toISOString();
            }
            return dateStr && dateStr.startsWith(todayStr);
          });
          setAlreadySubmittedToday(submittedToday);
        }
      } catch (err) {
        console.error('Error checking today submission limit:', err);
      }

      // 3. System Stats for Admin/Kamad
      const userRole = coreUser.role as UserRole;
      if ([UserRole.ADMIN, UserRole.KEPALA_MADRASAH, UserRole.STAF].includes(userRole)) {
        try {
          const sysStats = await useSystemStore.getState().fetchSystemStats();
          if (sysStats) setStats({ totalStudents: sysStats.totalStudents || 0 });
        } catch (e) {}
      }
    };

    checkBackgroundData();
  }, [coreUser]);

  const handleSaveDraft = () => {
    if (!profile) return;
    const draftKey = `draft_profile_update_${profile.uid}`;
    localStorage.setItem(draftKey, JSON.stringify(editForm));
    toast.success('📝 Draf perubahan data berhasil disimpan secara lokal!');
  };

  const handleClearDraft = () => {
    if (!profile) return;
    const draftKey = `draft_profile_update_${profile.uid}`;
    localStorage.removeItem(draftKey);
    setEditForm({
      displayName: profile.displayName || '',
      phone: profile.phone || '',
      address: profile.address || '',
      nomorHpSiswa: (profile as any).noTelepon || profile.phone || '',
      namaWali: (profile as any).namaWali || '',
      hubunganWali: (profile as any).hubunganWali || '',
      nomorHpWaliWhatsApp: (profile as any).nomorHpWaliWhatsApp || '',
      alamatRumah: (profile as any).alamat || profile.address || '',
      namaAyah: (profile as any).namaAyah || '',
      namaIbu: (profile as any).namaIbu || '',
      pekerjaanAyah: (profile as any).pekerjaanAyah || '',
      pekerjaanIbu: (profile as any).pekerjaanIbu || '',
      penghasilanOrtu: (profile as any).penghasilanOrtu || '',
      penghasilanAyahNominal: (profile as any).penghasilanAyahNominal || '',
      penghasilanIbuNominal: (profile as any).penghasilanIbuNominal || '',
      nik: (profile as any).nik || '',
      nisn: (profile as any).nisn || '',
      idUnik: profile.idUnik || '',
      jenisKelamin: (profile as any).jenisKelamin || '',
      status: profile.status || '',
      tempatLahir: (profile as any).tempatLahir || '',
      tanggalLahir: (profile as any).tanggalLahir || '',
      nomorKIPP_PIP: (profile as any).nomorKIPP_PIP || '',
      kebutuhanKhusus: (profile as any).kebutuhanKhusus || '',
      disabilitas: (profile as any).disabilitas || '',
      subject: (profile as any).subject || '',
      mapel: (profile as any).mapel || '',
      tingkatRombel: (profile as any).tingkatRombel || profile.class || '',
      tahunAngkatan: (profile as any).tahunAngkatan || '',
      targetRombel: (profile as any).targetRombel || '',
      tanggalDiterima: (profile as any).tanggalDiterima || '',
    });
    toast.success('🗑️ Draf berhasil dihapus, formulir kembali ke data profil asli.');
  };

  const handleOpenEditModal = (title: string, defaultFields: any) => {
    if (hasPendingRequest) {
      toast.error('Anda masih memiliki pengajuan edit profil yang sedang diproses.');
      return;
    }

    let initialForm = { ...editForm, ...defaultFields };

    // Try to load local draft if exists
    if (profile) {
      const draftKey = `draft_profile_update_${profile.uid}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          initialForm = { ...initialForm, ...parsed };
          toast.success('📝 Draf perubahan sebelumnya berhasil dimuat otomatis!');
        } catch (e) {
          console.error('Failed to parse draft:', e);
        }
      }
    }

    setEditForm(initialForm);
    setModalTitle(title);
    setIsEditOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!isMockMode && profile) {
        await safeCall(async () => {
          // 1. UPDATE LOGIC BASED ON MODAL TITLE
          if (modalTitle === 'Edit Profil Pengguna') {
            const isStudent = isStudentService(profile.role?.toLowerCase() || '');
            const sId = profile.studentsId || profile.studentId || profile.id;
            const tId = profile.teachersId || profile.teacherId || profile.id;

            if (isStudent && sId) {
              if (alreadySubmittedToday) {
                toast.error('⚠️ Anda hanya bisa mengirimkan pengajuan koreksi sekali dalam sehari.');
                setSaving(false);
                return;
              }

              const requestedChanges = {
                displayName: editForm.displayName || profile.displayName || '',
                phone: editForm.phone || '',
                address: editForm.address || '',
              };

              await submitProfileUpdateRequest(
                profile.uid,
                sId,
                editForm.displayName || profile.displayName || 'Siswa',
                (profile as any).nisn || '',
                requestedChanges,
                profile.tenantId,
                'student',
                'students',
              );

              // Clear draft because we submitted
              const draftKey = `draft_profile_update_${profile.uid}`;
              localStorage.removeItem(draftKey);

              setAlreadySubmittedToday(true);
              setHasPendingRequest(true);
              toast.success(
                'Pengajuan perubahan profil berhasil dikirim dan menunggu verifikasi persetujuan data.',
              );
              setIsEditOpen(false);
              return;
            }

            const isTeacher = ['guru', 'wali_kelas', 'guru_bk', 'staf', 'kepala_madrasah'].includes(
              profile.role?.toLowerCase() || '',
            );
            if (isTeacher && tId) {
              if (alreadySubmittedToday) {
                toast.error('⚠️ Anda hanya bisa mengirimkan pengajuan koreksi sekali dalam sehari.');
                setSaving(false);
                return;
              }

              const requestedChanges = {
                displayName: editForm.displayName || profile.displayName || '',
                phone: editForm.phone || '',
                address: editForm.address || '',
              };

              await submitProfileUpdateRequest(
                profile.uid,
                tId,
                editForm.displayName || profile.displayName || 'Guru',
                '',
                requestedChanges,
                profile.tenantId || 'default',
                'teacher',
                'teachers',
              );

              const draftKey = `draft_profile_update_${profile.uid}`;
              localStorage.removeItem(draftKey);

              setAlreadySubmittedToday(true);
              setHasPendingRequest(true);
              toast.success(
                'Pengajuan perubahan profil guru berhasil dikirim dan menunggu verifikasi persetujuan data.',
              );
              setIsEditOpen(false);
              return;
            }

            // UPDATE USERS COLLECTION (Admins, developers, others) via service
            await updateFullProfileAndAuth(
              profile.uid,
              {
                displayName: editForm.displayName,
                phoneNumber: editForm.phone,
              },
              isStudent,
              editForm.displayName
            );

          } else if (modalTitle === 'Update Data Pokok (Induk)') {
            // Strict Input Validation
            const isNumeric = (val: string) => /^[0-9]+$/.test(val);
            const isValidPhone = (val: string) => /^(08|\+62|62)[0-9]{8,12}$/.test(val);

            // NIK Validation
            if (editForm.nik && (editForm.nik.length !== 16 || !isNumeric(editForm.nik))) {
              toast.error('Format data salah: NIK harus berupa 16 digit angka.');
              setSaving(false);
              return;
            }

            // NISN Validation
            if (editForm.nisn && (editForm.nisn.length !== 10 || !isNumeric(editForm.nisn))) {
              toast.error('Format data salah: NISN harus berupa 10 digit angka.');
              setSaving(false);
              return;
            }

            // Phone Siswa Validation
            const phoneSiswa = editForm.nomorHpSiswa || editForm.phone;
            if (phoneSiswa && !isValidPhone(phoneSiswa)) {
              toast.error(
                'Format data salah: Nomor HP Siswa tidak valid. Harus dimulai dengan 08, +62, atau 62 (10-14 digit).',
              );
              setSaving(false);
              return;
            }

            // Phone Wali Validation
            if (editForm.nomorHpWaliWhatsApp && !isValidPhone(editForm.nomorHpWaliWhatsApp)) {
              toast.error(
                'Format data salah: Nomor WhatsApp Wali tidak valid. Harus dimulai dengan 08, +62, atau 62 (10-14 digit).',
              );
              setSaving(false);
              return;
            }

            // UPDATE COLLECTION via Service
            const sId = profile.studentsId || profile.studentId;
            const isStudent = isStudentService(profile.role?.toLowerCase() || '');
            
            if (sId && isStudent) {
              if (alreadySubmittedToday) {
                toast.error(
                  '⚠️ Anda hanya bisa mengirimkan pengajuan koreksi sekali dalam sehari.',
                );
                setSaving(false);
                return;
              }

              const requestedChanges = {
                displayName: editForm.displayName || profile.displayName || '',
                tingkatRombel: editForm.tingkatRombel || '',
                nik: editForm.nik || '',
                tempatLahir: editForm.tempatLahir || '',
                tanggalLahir: editForm.tanggalLahir || '',
                namaAyah: editForm.namaAyah || '',
                namaIbu: editForm.namaIbu || '',
                pekerjaanAyah: editForm.pekerjaanAyah || '',
                pekerjaanIbu: editForm.pekerjaanIbu || '',
                penghasilanOrtu: editForm.penghasilanOrtu || '',
                nomorKIPP_PIP: editForm.nomorKIPP_PIP || '',
                kebutuhanKhusus: editForm.kebutuhanKhusus || '',
                disabilitas: editForm.disabilitas || '',
                phone: editForm.phone || '',
                address: editForm.address || '',
                nomorHpSiswa: editForm.nomorHpSiswa || editForm.phone || '',
                namaWali: editForm.namaWali || '',
                hubunganWali: editForm.hubunganWali || '',
                nomorHpWaliWhatsApp: editForm.nomorHpWaliWhatsApp || '',
                alamatRumah: editForm.alamatRumah || editForm.address || '',
              };

              await submitProfileUpdateRequest(
                profile.uid,
                sId,
                editForm.displayName || profile.displayName || 'Siswa',
                editForm.nisn || (profile as any).nisn || '',
                requestedChanges,
                profile.tenantId,
                'student',
                'students',
              );

              const draftKey = `draft_profile_update_${profile.uid}`;
              localStorage.removeItem(draftKey);

              setAlreadySubmittedToday(true);
              setHasPendingRequest(true);
              toast.success(
                'Pengajuan perubahan data pokok berhasil dikirim dan menunggu persetujuan admin.',
              );
              setIsEditOpen(false);
              return;
            }

            // Directly update via service for Admin/GTK
            await updateFullProfileAndAuth(
              profile.uid,
              {
                ...editForm,
                displayName: editForm.displayName,
                phoneNumber: editForm.phone,
              },
              isStudent,
              editForm.displayName
            );
          }

          // Update local state with edited details
          setProfile((prev) => {
            if (!prev) return null;

            const updatedProfile = { ...prev };

            if (modalTitle === 'Edit Profil Pengguna') {
              updatedProfile.displayName = editForm.displayName;
            } else if (modalTitle === 'Update Data Pokok (Induk)') {
              // Update fields related to data pokok
              updatedProfile.displayName = editForm.displayName;
              updatedProfile.phone = editForm.phone;
              updatedProfile.address = editForm.address;
              (updatedProfile as any).nik = editForm.nik;
              (updatedProfile as any).tempatLahir = editForm.tempatLahir;
              (updatedProfile as any).tanggalLahir = editForm.tanggalLahir;
              (updatedProfile as any).namaAyah = editForm.namaAyah;
              (updatedProfile as any).namaIbu = editForm.namaIbu;
              (updatedProfile as any).namaWali = editForm.namaWali;
              (updatedProfile as any).pekerjaanAyah = editForm.pekerjaanAyah;
              (updatedProfile as any).pekerjaanIbu = editForm.pekerjaanIbu;
              (updatedProfile as any).penghasilanOrtu = editForm.penghasilanOrtu;
              (updatedProfile as any).nomorKIPP_PIP = editForm.nomorKIPP_PIP;
              (updatedProfile as any).kebutuhanKhusus = editForm.kebutuhanKhusus;
              (updatedProfile as any).disabilitas = editForm.disabilitas;
              (updatedProfile as any).tingkatRombel = editForm.tingkatRombel;
              updatedProfile.class = editForm.tingkatRombel || (prev as any).class;
            }

            return updatedProfile;
          });

          // Update missing fields status immediately
          const combinedProfile = { ...profile, ...editForm, displayName: editForm.displayName };
          const required = [
            'nik',
            'namaAyah',
            'namaIbu',
            'namaWali',
            'tempatLahir',
            'tanggalLahir',
            'address',
            'phone',
          ];
          const missing = required.filter((f) => !(combinedProfile as any)[f]);
          setMissingFields(missing);

          toast.success('Profil berhasil diperbarui.');
          setIsEditOpen(false);
        }, 'Profile.SubmitDirect');
      } else if (isMockMode && profile) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                ...editForm,
                displayName: editForm.displayName,
                class: editForm.tingkatRombel || (prev as any).class,
              }
            : null,
        );
        toast.success('Profil diperbarui (Mode Demo).');
        setIsEditOpen(false);
      }
    } catch (error: any) {
      console.error('Gagal simpan:', error?.message || 'Error');
      toast.error('Gagal menyimpan data ke sistem.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const compressImage = (
    base64Str: string,
    maxWidth = 500,
    maxHeight = 500,
    quality = 0.8,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;

        // Kompresi otomatis
        const compressedBase64 = await compressImage(base64Image);

        const user = useAuthStore.getState().user;
        if (isMockMode || !user) {
          localStorage.setItem('mock_photo_mock-user-123', compressedBase64);
          setProfile((prev) => (prev ? { ...prev, photoURL: compressedBase64 } : null));
          toast.success('Foto profil diperbarui (Mode Demo)!');
          setUploading(false);
          return;
        }

        await safeCall(async () => {
          const user = useAuthStore.getState().user;
          if (user) await updateUserProfilePhoto(user.uid, compressedBase64);
          setProfile((prev) => (prev ? { ...prev, photoURL: compressedBase64 } : null));
          toast.success('Foto profil diperbarui!');
        }, 'Profile.updatePhoto');

        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Gagal membaca file.');
        setUploading(false);
      };
    } catch (error) {
      toast.error('Gagal mengunggah foto.');
      setUploading(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;

        // Optimized cover size
        const compressedBase64 = await compressImage(base64Image, 1200, 480, 0.7);

        const user = useAuthStore.getState().user;
        if (isMockMode || !user) {
          localStorage.setItem('mock_cover_mock-user-123', compressedBase64);
          setProfile((prev) => (prev ? { ...prev, coverURL: compressedBase64 } : null));
          toast.success('Foto sampul diperbarui (Mode Demo)!');
          setUploadingCover(false);
          return;
        }

        await safeCall(async () => {
          const user = useAuthStore.getState().user;
          if (user) await updateUserCoverPhoto(user.uid, compressedBase64);
          setProfile((prev) => (prev ? { ...prev, coverURL: compressedBase64 } : null));
          toast.success('Foto sampul diperbarui!');
        }, 'Profile.updateCover');

        setUploadingCover(false);
      };
      reader.onerror = () => {
        toast.error('Gagal membaca file.');
        setUploadingCover(false);
      };
    } catch (error) {
      toast.error('Gagal mengunggah foto sampul.');
      setUploadingCover(false);
    }
  };

  const [archiving, setArchiving] = useState(false);
  const archiveInputRef = useRef<HTMLInputElement>(null);

  const handleUploadArchive = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const tId = profile?.teachersId || profile?.teacherId;
    if (!file || !tId) return;

    setArchiving(true);
    const toastId = toast.loading('Mengunggah dokumen arsip...');
    try {
      const fileUrl = await uploadTeacherFile(file, tId);
      const context = TenantContext.getContext() as any;
      const teacher = (await teacherRepository.getById(context, tId)) as any;
      if (teacher) {
        await teacherRepository.save(context, {
          ...teacher,
          archives: [
            ...(teacher.archives || []),
            {
              name: file.name,
              url: fileUrl,
              date: new Date().toISOString(),
            }
          ]
        });
        
        // Update local state if teachers archives was visible
        setProfile((prev) => ({
          ...prev!,
          archives: [
            ...((prev as any).archives || []),
            { name: file.name, url: fileUrl, date: new Date().toISOString() },
          ],
        }));
        toast.success('Arsip berhasil disimpan!', { id: toastId });
      }
    } catch (err) {
      toast.error('Gagal mengunggah arsip.', { id: toastId });
    } finally {
      setArchiving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    [UserRole.ADMIN]: 'Admin Madrasah',
    [UserRole.DEVELOPER]: 'Developer',
    [UserRole.KEPALA_MADRASAH]: 'Kepala Madrasah',
    [UserRole.WAKAMAD]: 'Wakamad / Waka',
    [UserRole.KEPALA_TU]: 'Tata Usaha (TU)',
    [UserRole.GURU]: 'Guru',
    [UserRole.WALI_KELAS]: 'Wali Kelas',
    [UserRole.GURU_BK]: 'Guru BK',
    [UserRole.STAF]: 'Staf Administrasi',
    [UserRole.KETUA_KELAS]: 'Ketua Kelas',
    [UserRole.SISWA]: 'Siswa',
    [UserRole.ORANG_TUA]: 'Orang Tua',
    [UserRole.PUSTAKAWAN]: 'Pustakawan',
    [UserRole.LABORAN]: 'Laboran',
    [UserRole.PEMBINA_EKSKUL]: 'Pembina Ekskul',
    gtk: 'Tenaga Kependidikan',
  };

  const getRoleTheme = (role: string) => {
    const normalized = String(role || 'gtk').toLowerCase();
    const label = roleLabels[normalized] || role;
    const icon = roleIcons[normalized] || ShieldCheckIcon;

    if (normalized === 'admin' || normalized === 'developer') {
      return {
        label,
        icon,
        gradient: 'from-rose-500 to-red-600',
        bgLight: 'bg-rose-50 dark:bg-rose-900/20',
        text: 'text-rose-600 dark:text-rose-400',
      };
    }
    if (normalized === 'siswa' || normalized === 'ketua kelas') {
      return {
        label,
        icon,
        gradient: 'from-teal-400 to-emerald-600',
        bgLight: 'bg-teal-50 dark:bg-teal-900/20',
        text: 'text-teal-600 dark:text-teal-400',
      };
    }
    if (normalized === 'kepala_madrasah') {
      return {
        label,
        icon,
        gradient: 'from-amber-400 to-orange-600',
        bgLight: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
      };
    }
    return {
      label,
      icon,
      gradient: 'from-indigo-500 to-violet-600',
      bgLight: 'bg-indigo-50 dark:bg-indigo-900/20',
      text: 'text-indigo-600 dark:text-indigo-400',
    };
  };

  const theme = profile ? getRoleTheme(profile.role) : getRoleTheme('GTK');
  const getInitials = (name: string) =>
    (name || '?')
      .split(' ')
      .map((n) => (n ? n[0] : ''))
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <Layout
      title="Profil Saya"
      subtitle="Identitas & Pengaturan"
      icon={UserIcon}
      onBack={onBack}
      onOpenSidebar={onOpenSidebar}
      withBottomNav={true}
      hideHeader={true}
    >
      <div className="profile-container p-4 lg:p-8 pb-32 max-w-6xl mx-auto w-full space-y-6">
        {hasPendingRequest && (
          <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-3xl p-4 flex items-start gap-3 text-amber-600 dark:text-amber-400">
            <ShieldCheckIcon className="w-5 h-5 shrink-0 mt-0.5 text-amber-500 animate-pulse" />
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider">
                Pengajuan Perubahan Data Sedang Ditinjau Admin
              </h4>
              <p className="text-[10.5px] leading-relaxed font-medium opacity-90 mt-1">
                Anda telah melakukan pengajuan edit data pokok / profil siswa. Saat ini pengajuan
                tersebut sedang masuk antrean proses verifikasi persetujuan data oleh tim
                admin/operator madrasah. Data Anda di sistem akan diperbarui secara otomatis setelah
                disetujui.
              </p>
              <div className="mt-3 flex items-center">
                <a
                  href={`https://wa.me/6285194030064?text=${encodeURIComponent(
                    `Halo Admin/Developer, saya ${profile?.displayName || ''} (${profile?.email || ''}) baru saja mengirimkan pengajuan perubahan data profil di e-Mam System. Mohon untuk memverifikasi dan menyetujuinya.`,
                  )}`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wide px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  id="whatsapp_profile_pending_btn" rel="noreferrer"
                >
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.978L2 22l5.133-1.343a9.933 9.933 0 0 0 4.876 1.28l.005.003c5.503 0 9.987-4.479 9.989-9.985.002-2.67-1.037-5.18-2.93-7.073A9.925 9.925 0 0 0 12.012 2zm5.835 14.123c-.32.902-1.85 1.765-2.53 1.83-.58.055-1.346.073-2.155-.183a12.872 12.872 0 0 1-5.35-3.328c-1.39-1.442-2.42-3.195-2.73-4.103-.323-.902-.034-1.39.255-1.682.253-.255.56-.622.842-.93.284-.31.378-.517.568-.88.19-.36.094-.67-.046-.954-.142-.284-1.28-3.093-1.754-4.238-.46-1.11-.93-.96-1.28-.96h-1.1c-.378 0-.994.142-1.516.71-.522.568-1.99 1.94-1.99 4.73 0 2.793 2.036 5.485 2.32 5.87.284.39 4.01 6.13 9.713 8.583 1.357.583 2.417.933 3.243 1.2.19.062.378.05.52.03.14-.02.568-.23 1.23-.93.663-.7 1.423-1.6 1.423-1.6.094-.125.048-.25-.047-.34-.095-.095-.237-.215-.474-.352z" />
                  </svg>
                  Hubungi Admin/Developer (WhatsApp)
                </a>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-3" />
          </div>
        ) : profile ? (
          <>
            {/* --- HEADER BANNER --- */}
            {profile && (
              <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700">
                <div className={`absolute top-0 inset-x-0 h-48 bg-gradient-to-r ${theme.gradient}`}>
                  {profile.coverURL ? (
                    <div className="absolute inset-0">
                      <img
                        src={profile.coverURL}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOCIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiLz48L3N2Zz4=')] opacity-20 mix-blend-overlay"></div>
                  )}

                  {/* Change Cover Button */}
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute top-4 right-4 p-2.5 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-all border border-white/20 group z-10"
                    title="Ubah Foto Sampul"
                  >
                    {uploadingCover ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CameraIcon className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={coverInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverChange}
                  />
                </div>
                <div className="relative pt-24 px-6 pb-6 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                  <div className="relative shrink-0 group">
                    <div className="w-32 h-32 rounded-full p-1 bg-white dark:bg-slate-800 shadow-2xl relative">
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center relative">
                        {profile.photoURL ? (
                          <img
                            src={profile.photoURL}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className={`text-4xl font-bold ${theme.text}`}>
                            {getInitials(profile.displayName)}
                          </span>
                        )}
                        <button
                          onClick={handleAvatarClick}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <CameraIcon className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="flex-1 pb-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                      {profile.displayName}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-1.5 mt-1.5">
                      {(() => {
                        const IconComp = theme.icon || ShieldCheckIcon;
                        return <IconComp className={`w-3.5 h-3.5 shrink-0 ${theme.text}`} />;
                      })()}
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                        {theme.label} • MAN 1 HST
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => {
                        const defaultFields = isStudentService(profile.role?.toLowerCase() || '')
                          ? profile
                          : { displayName: profile.displayName || '' };
                        const title = isStudentService(profile.role?.toLowerCase() || '')
                          ? 'Update Data Pokok (Induk)'
                          : 'Edit Profil Pengguna';
                        handleOpenEditModal(title, defaultFields);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wide border border-slate-100 dark:border-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                    >
                      Edit Profil
                    </button>
                    {onLogout && (
                      <button
                        onClick={onLogout}
                        className="md:hidden px-5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase tracking-wide border border-rose-100 dark:border-rose-800 shadow-sm transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center gap-2"
                      >
                        <LogOutIcon className="w-3.5 h-3.5" />
                        Keluar
                      </button>
                    )}
                  </div>
                </div>

                {/* Section Switcher (Tabs) */}
                <div className="px-6 pb-2 flex items-center gap-1 border-t border-slate-50 dark:border-slate-800 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'home', label: 'Beranda' },
                    { id: 'akun', label: 'Akun' },
                    { id: 'dataPokok', label: 'Biodata' },
                    { id: 'kontak', label: 'Alamat' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setOpenSection(tab.id)}
                      className={`px-6 py-4 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-all shrink-0 ${openSection === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* --- CONTENT AREA --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* --- LEFT / MAIN CONTENT --- */}
              <div
                className={`lg:col-span-2 ${openSection === 'home' ? 'max-w-none' : 'max-w-2xl mx-auto'} w-full space-y-6 pb-8`}
              >
                {/* HOME VIEW (DASHBOARD PROFIL) */}
                {openSection === 'home' && (
                  <React.Suspense
                    fallback={
                      <div className="py-20 text-center">
                        <Loader2 className="animate-spin mx-auto text-indigo-500" />
                      </div>
                    }
                  >
                    <ProfileHome
                      profile={profile}
                      theme={theme}
                      onEdit={(section: string) => setOpenSection(section)}
                    />
                  </React.Suspense>
                )}

                {/* SETTINGS VIEW (ACCORDIONS) */}
                {openSection !== 'home' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <React.Suspense
                      fallback={
                        <div className="py-20 text-center">
                          <Loader2 className="animate-spin mx-auto text-indigo-500" />
                        </div>
                      }
                    >
                      <ProfileAccordion
                        profile={profile}
                        theme={theme}
                        missingFields={missingFields}
                        onEdit={handleOpenEditModal}
                      />
                    </React.Suspense>
                  </div>
                )}
              </div>

              {/* --- RIGHT SIDEBAR --- */}
              <div className="lg:col-span-1 space-y-6">
                <button
                  onClick={onLogout}
                  className="w-full py-4 bg-rose-50 text-rose-600 font-bold rounded-2xl border border-rose-100 active:scale-[0.98] transition-all text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  <LogOutIcon className="w-4 h-4" /> Keluar Akun
                </button>

                {/* GTK ARCHIVE SECTION */}
                {profile.teacherId && (
                  <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <ClipboardDocumentListIcon className="w-4 h-4 text-indigo-500" /> Arsiparis &
                      Sertifikat
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                      Penyimpanan aman untuk SK, Sertifikat, dan dokumen kepegawaian Anda.
                    </p>

                    <div className="space-y-3 mb-6">
                      {((profile as any).archives || [])
                        .slice(0, 3)
                        .map((file: any, index: number) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-500 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                                <CreditCardIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                                  {file.name}
                                </p>
                                <p className="text-[8px] text-slate-400 uppercase font-bold">
                                  {new Date(file.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <SparklesIcon className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                          </a>
                        ))}
                      {(!(profile as any).archives || (profile as any).archives.length === 0) && (
                        <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Belum ada dokumen
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={archiveInputRef}
                        className="hidden"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleUploadArchive}
                      />
                      <button
                        onClick={() => archiveInputRef.current?.click()}
                        disabled={archiving}
                        className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl text-[9px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                      >
                        {archiving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PlusIcon className="w-4 h-4" />
                        )}{' '}
                        Tambah Arsip
                      </button>
                      {((profile as any).archives || []).length > 3 && (
                        <button className="px-4 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-[9px] uppercase tracking-wide">
                          Semua
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Dummy space for SPPReportModal rendering if needed */}
              </div>
            </div>

            {/* Modal Edit */}
            {isEditOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <div className="bg-white dark:bg-[#0B1121] w-full max-w-md rounded-3xl p-5 shadow-2xl border border-white/10 animate-in zoom-in duration-200">
                  <h3 className="font-bold text-sm md:text-base mb-3 text-center text-slate-800 dark:text-white capitalize tracking-tight">
                    {modalTitle}
                  </h3>
                  <form
                    onSubmit={handleSaveProfile}
                    className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar p-1"
                  >
                    {/* SECTION: INFORMASI AKUN (USERS COLLECTION) */}
                    {modalTitle === 'Edit Profil Pengguna' && (
                      <div className="space-y-3">
                        <h4 className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                          <UserIcon className="w-3 h-3" /> Informasi Akun
                        </h4>
                        <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35">
                          <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                            Nama Pengguna (Display Name)
                          </label>
                          <input
                            type="text"
                            value={editForm.displayName || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, displayName: e.target.value })
                            }
                            className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                            placeholder="Nama Lengkap"
                            required
                          />
                        </div>
                        <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35">
                          <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                            No. WhatsApp Siswa Panggilan / Anda (628...)
                          </label>
                          <input
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^\d+]/g, '');
                              if (val.startsWith('+62')) val = '62' + val.substring(3);
                              if (val.startsWith('08')) val = '628' + val.substring(2);
                              if (val.startsWith('8')) val = '628' + val.substring(1);
                              setEditForm({ ...editForm, phone: val, nomorHpSiswa: val });
                            }}
                            className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                            placeholder="628123456789"
                          />
                        </div>
                        <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35">
                          <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                            Alamat Domisili / Tempat Tinggal Sekarang
                          </label>
                          <textarea
                            rows={2}
                            value={editForm.address}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                address: e.target.value,
                                alamatRumah: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none resize-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    )}

                    {/* SECTION: DATA INDUK (STUDENTS / TEACHERS COLLECTION) */}
                    {modalTitle === 'Update Data Pokok (Induk)' && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-[9px] font-bold text-amber-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                          <IdentificationIcon className="w-3 h-3" />{' '}
                          {isStudentService(profile.role?.toLowerCase() || '')
                            ? 'Informasi Siswa (Data Pokok)'
                            : 'Informasi Tenaga Pendidik'}
                        </h4>

                        {isStudentService(profile.role?.toLowerCase() || '') && (
                          <>
                            <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35">
                              <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                Tingkat / Rombel Kelas
                              </label>
                              <select
                                value={editForm.tingkatRombel}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, tingkatRombel: e.target.value })
                                }
                                className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                              >
                                <option value="">- Pilih Tingkat Rombel -</option>
                                {classes &&
                                  classes.map((cls) => (
                                    <option key={cls.id || cls.name} value={cls.name}>
                                      {cls.name}
                                    </option>
                                  ))}
                                {(!classes || classes.length === 0) && (
                                  <>
                                    <option value="10 A">10 A</option>
                                    <option value="10 B">10 B</option>
                                    <option value="11 A">11 A</option>
                                    <option value="11 B">11 B</option>
                                    <option value="12 A">12 A</option>
                                    <option value="12 B">12 B</option>
                                  </>
                                )}
                              </select>
                            </div>

                            <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  NIK (16 Digit)
                                </label>
                                <input
                                  type="text"
                                  maxLength={16}
                                  value={editForm.nik}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setEditForm({ ...editForm, nik: val.substring(0, 16) });
                                  }}
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                  placeholder="16 Digit NIK"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  Nama Wali
                                </label>
                                <input
                                  type="text"
                                  value={editForm.namaWali}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, namaWali: e.target.value })
                                  }
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  Hubungan Wali (opsional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Contoh: Paman, Kakek"
                                  value={editForm.hubunganWali}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, hubunganWali: e.target.value })
                                  }
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  No. WhatsApp Wali
                                </label>
                                <input
                                  type="text"
                                  value={editForm.nomorHpWaliWhatsApp}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/[^\d+]/g, '');
                                    if (val.startsWith('+62')) val = '62' + val.substring(3);
                                    if (val.startsWith('08')) val = '628' + val.substring(2);
                                    if (val.startsWith('8')) val = '628' + val.substring(1);
                                    setEditForm({ ...editForm, nomorHpWaliWhatsApp: val });
                                  }}
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                  placeholder="628..."
                                />
                              </div>
                            </div>

                            <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  Tempat Lahir
                                </label>
                                <input
                                  type="text"
                                  value={editForm.tempatLahir}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, tempatLahir: e.target.value })
                                  }
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  Tanggal Lahir
                                </label>
                                <input
                                  type="date"
                                  value={editForm.tanggalLahir}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, tanggalLahir: e.target.value })
                                  }
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  Nama Ayah
                                </label>
                                <input
                                  type="text"
                                  value={editForm.namaAyah}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, namaAyah: e.target.value })
                                  }
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  Nama Ibu
                                </label>
                                <input
                                  type="text"
                                  value={editForm.namaIbu}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, namaIbu: e.target.value })
                                  }
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  Pekerjaan Ayah
                                </label>
                                <input
                                  type="text"
                                  value={editForm.pekerjaanAyah}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, pekerjaanAyah: e.target.value })
                                  }
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  Pekerjaan Ibu
                                </label>
                                <input
                                  type="text"
                                  value={editForm.pekerjaanIbu}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, pekerjaanIbu: e.target.value })
                                  }
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35">
                              <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                Penghasilan Orang Tua
                              </label>
                              <select
                                value={editForm.penghasilanOrtu}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, penghasilanOrtu: e.target.value })
                                }
                                className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                              >
                                <option value="-">- Pilih Penghasilan -</option>
                                <option value="Kurang dari 1 Juta">Kurang dari 1 Juta</option>
                                <option value="1 Juta - 3 Juta">1 Juta - 3 Juta</option>
                                <option value="3 Juta - 5 Juta">3 Juta - 5 Juta</option>
                                <option value="Lebih dari 5 Juta">Lebih dari 5 Juta</option>
                              </select>
                            </div>

                            <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35">
                              <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                No KIP / PIP (Jika Ada)
                              </label>
                              <input
                                type="text"
                                value={editForm.nomorKIPP_PIP}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, nomorKIPP_PIP: e.target.value })
                                }
                                className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  Kebutuhan Khusus
                                </label>
                                <select
                                  value={editForm.kebutuhanKhusus}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, kebutuhanKhusus: e.target.value })
                                  }
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                >
                                  <option value="Tidak Ada">Tidak Ada</option>
                                  <option value="Lamban Belajar">Lamban Belajar</option>
                                  <option value="Kesulitan Belajar Spesifik">
                                    Kesulitan Belajar Spesifik
                                  </option>
                                  <option value="Gangguan Komunikasi">Gangguan Komunikasi</option>
                                  <option value="Bakat Luar Biasa">Bakat Luar Biasa</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                                  Disabilitas
                                </label>
                                <select
                                  value={editForm.disabilitas}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, disabilitas: e.target.value })
                                  }
                                  className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                                >
                                  <option value="Tidak Ada">Tidak Ada</option>
                                  <option value="Netra">Netra</option>
                                  <option value="Rungu">Rungu</option>
                                  <option value="Grahita">Grahita</option>
                                  <option value="Daksa">Daksa</option>
                                  <option value="Autis">Autis</option>
                                </select>
                              </div>
                            </div>
                          </>
                        )}

                        {!isStudentService(profile.role?.toLowerCase() || '') && (
                          <div className="bg-sky-50/50 dark:bg-sky-950/20 backdrop-blur-md p-3 rounded-2xl border border-sky-100/85 dark:border-sky-900/35">
                            <label className="text-[10px] font-bold text-sky-800 dark:text-sky-300 capitalize ml-1">
                              Mata Pelajaran Utama
                            </label>
                            <input
                              type="text"
                              value={editForm.mapel || editForm.subject || ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  mapel: e.target.value,
                                  subject: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 mt-1 bg-white/80 dark:bg-slate-950/65 border border-sky-200/60 dark:border-sky-800/40 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                              placeholder="Contoh: Matematika"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {/* DRAF BANNER */}
                    {profile && localStorage.getItem(`draft_profile_update_${profile.uid}`) && (
                      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3 rounded-2xl flex items-center justify-between gap-2 mt-2">
                        <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold">
                          📝 Terdapat draf tersimpan belum diajukan
                        </span>
                        <button
                          type="button"
                          onClick={handleClearDraft}
                          className="text-[8px] font-bold text-rose-600 dark:text-rose-400 uppercase bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded-lg"
                        >
                          Hapus Draf
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs capitalize flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform"
                        >
                          💾 Simpan Draf
                        </button>
                        <button
                          type="submit"
                          disabled={
                            saving ||
                            (alreadySubmittedToday &&
                              isStudentService(profile?.role?.toLowerCase() || ''))
                          }
                          className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-xl text-xs capitalize flex items-center justify-center gap-1 shadow-md active:scale-95 transition-transform"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <SaveIcon className="w-4 h-4" />
                          )}{' '}
                          {alreadySubmittedToday &&
                          isStudentService(profile?.role?.toLowerCase() || '')
                            ? 'Batas Pengajuan Habis'
                            : 'Kirim Pengajuan'}
                        </button>
                      </div>
                      {alreadySubmittedToday &&
                        isStudentService(profile?.role?.toLowerCase() || '') && (
                          <p className="text-[9px] text-center text-rose-500 font-semibold mt-1">
                            ⚠️ Anda sudah mengirim pengajuan hari ini. Silakan simpan draf terlebih
                            dahulu untuk dikirim besok.
                          </p>
                        )}
                      <button
                        type="button"
                        onClick={() => setIsEditOpen(false)}
                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs capitalize hover:bg-slate-200 transition-colors"
                      >
                        Tutup
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default Profile;
