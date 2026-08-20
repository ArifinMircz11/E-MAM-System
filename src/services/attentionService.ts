import { isMockMode } from '@/services/firebase';
import { UserRole, ViewState } from '@/types';
import { userRepository } from '@/repositories/userRepository';
import { profileRequestRepository } from '@/repositories/ProfileRequestRepository';
import { letterRepository } from '@/repositories/letterRepository';

export interface AttentionItem {
  id: string;
  title: string;
  description: string;
  type:
    | 'approval'
    | 'data_change'
    | 'letter_pending'
    | 'chat_unread'
    | 'attendance_warning'
    | 'point_added'
    | 'letter_done';
  severity: 'high' | 'medium' | 'info';
  actionLabel: string;
  targetView: ViewState;
  count: number;
}

export const getAttentionItems = async (
  userRole: UserRole,
  userId: string,
  tenantId: string,
): Promise<AttentionItem[]> => {
  if (isMockMode) {
    // Return rich domain mocks based on user role
    const mocks: AttentionItem[] = [];
    const isAdmin = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPER_ADMIN].includes(userRole);
    const isStaff = [
      UserRole.KEPALA_MADRASAH,
      UserRole.KEPALA_TU,
      UserRole.WAKAMAD,
      UserRole.STAF,
      UserRole.HUMAS,
      UserRole.KURIKULUM,
      UserRole.KESISWAAN,
      UserRole.GTK,
    ].includes(userRole);
    const isGuru = [UserRole.GURU, UserRole.WALI_KELAS, UserRole.GURU_BK].includes(userRole);

    if (isAdmin || isStaff) {
      mocks.push({
        id: 'mock_pending_accounts',
        title: 'Persetujuan Registrasi Akun',
        description:
          'Terdapat 3 pengguna baru mendaftar menunggu persetujuan masuk: Ahmad Dahlan (Guru Matematika), Siti Aminah (Wali/Orang Tua), & Budi Santoso (Siswa).',
        type: 'approval',
        severity: 'high',
        actionLabel: 'Tinjau Akun',
        targetView: ViewState.ACCOUNT_APPROVAL,
        count: 3,
      });
      mocks.push({
        id: 'mock_onboarding_data',
        title: 'Verifikasi Onboarding Santri',
        description:
          'Terdapat 2 pengisian data induk santri baru menunggu verifikasi berkas: Muhammad Yusuf (Kelas VII) & Aisyah Az-Zahra (Kelas VIII).',
        type: 'data_change',
        severity: 'high',
        actionLabel: 'Verifikasi Berkas',
        targetView: ViewState.ACCOUNT_APPROVAL,
        count: 2,
      });
      mocks.push({
        id: 'mock_pending_letters',
        title: 'Dispensasi & Surat Masuk (e-Letter)',
        description:
          'Terdapat 5 pengajuan surat izin sakit/dispensasi santri menunggu keputusan: Fatimah Azzahra (Sakit), Ryan Hidayat (Dispensasi), dkk.',
        type: 'letter_pending',
        severity: 'medium',
        actionLabel: 'Proses Surat',
        targetView: ViewState.LETTERS,
        count: 5,
      });
    } else if (isGuru) {
      mocks.push({
        id: 'mock_class_letters',
        title: 'Permohonan Surat Izin Siswa',
        description:
          'Ada 4 santri bimbingan Anda mengajukan dispensasi/izin: Farhan (Dispensasi), Naura (Sakit), dkk. Harap verifikasi demi kehadiran kelas.',
        type: 'letter_pending',
        severity: 'high',
        actionLabel: 'Tinjau Izin',
        targetView: ViewState.LETTERS,
        count: 4,
      });
      mocks.push({
        id: 'mock_class_journal',
        title: 'Jurnal Kegiatan Kelas',
        description: 'Jurnal pengajaran harian Anda untuk 2 rombel belum diisi sepenuhnya.',
        type: 'attendance_warning',
        severity: 'medium',
        actionLabel: 'Isi Jurnal',
        targetView: ViewState.SCHEDULE,
        count: 2,
      });
    } else {
      // Siswa / Orang Tua
      mocks.push({
        id: 'mock_letter_approved',
        title: 'E-Surat Selesai & Disetujui',
        description: 'Pengajuan Surat Izin Dispensasi Anda telah diterbitkan dan siap diunduh.',
        type: 'letter_done',
        severity: 'info',
        actionLabel: 'Unduh Surat',
        targetView: ViewState.LETTERS,
        count: 1,
      });
      mocks.push({
        id: 'mock_bk_warning',
        title: 'Catatan Kedisiplinan BK',
        description:
          'Ada tambahan rekam poin pelanggaran (+15 Poin) kemarin. Harap tinjau perilaku Anda.',
        type: 'attendance_warning',
        severity: 'high',
        actionLabel: 'Lihat Poin',
        targetView: ViewState.POINTS,
        count: 1,
      });
    }
    return mocks;
  }

  if (!userId) return [];

  try {
    const items: AttentionItem[] = [];
    const isAdmin = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPER_ADMIN].includes(userRole);
    const isStaff = [
      UserRole.KEPALA_MADRASAH,
      UserRole.KEPALA_TU,
      UserRole.WAKAMAD,
      UserRole.STAF,
      UserRole.HUMAS,
      UserRole.KURIKULUM,
      UserRole.KESISWAAN,
      UserRole.GTK,
    ].includes(userRole);
    const isGuru = [UserRole.GURU, UserRole.WALI_KELAS, UserRole.GURU_BK].includes(userRole);

    if (isAdmin || isStaff) {
      // 1. Persetujuan registrasi akun (pending_approval)
      try {
        const users = await userRepository.findAll(tenantId);
        const pendingUsers = users.filter(u => (u as any).accountStatus === 'pending_approval');
        
        if (pendingUsers.length > 0) {
          const sampleNames = pendingUsers
            .slice(0, 3)
            .map((u: any) => {
              const name = u.displayName || u.namaLengkap || 'Tanpa Nama';
              const role = (u.peran || u.role || 'Siswa').replace(/_/g, ' ');
              return `${name} (${role})`;
            })
            .join(', ');
          const extra = pendingUsers.length > 3 ? `, dkk (${pendingUsers.length} total)` : '';

          items.push({
            id: 'pending_accounts_action',
            title: 'Persetujuan Registrasi Akun',
            description: `Terdapat ${pendingUsers.length} akun baru terdaftar menunggu persetujuan masuk: ${sampleNames}${extra}.`,
            type: 'approval',
            severity: 'high',
            actionLabel: 'Tinjau Akun',
            targetView: ViewState.ACCOUNT_APPROVAL,
            count: pendingUsers.length,
          });
        }
      } catch (err) {
        console.warn('Gagal mengambil persetujuan akun:', err);
      }

      // 2. Persetujuan Onboarding (pending_data_approval)
      try {
        const users = await userRepository.findAll(tenantId);
        const onboardingPending = users.filter(u => (u as any).accountStatus === 'pending_data_approval');
        
        if (onboardingPending.length > 0) {
          const sampleNames = onboardingPending
            .slice(0, 3)
            .map((u: any) => {
              return u.displayName || u.namaLengkap || 'Tanpa Nama';
            })
            .join(', ');
          const extra = onboardingPending.length > 3 ? `, dkk (${onboardingPending.length} total)` : '';

          items.push({
            id: 'pending_onboarding_action',
            title: 'Onboarding Data Siswa',
            description: `Terdapat ${onboardingPending.length} pengisian data induk santri menunggu verifikasi berkas: ${sampleNames}${extra}.`,
            type: 'data_change',
            severity: 'high',
            actionLabel: 'Tinjau Wali',
            targetView: ViewState.ACCOUNT_APPROVAL,
            count: onboardingPending.length,
          });
        }
      } catch (err) {
        console.warn('Gagal mengambil onboarding data:', err);
      }

      // 3. Permintaan Pembaruan Profil (profile_update_requests)
      try {
        const profileRequests = await profileRequestRepository.findAll(tenantId);
        const pendingProfile = profileRequests.filter(p => p.status === 'pending');
        
        if (pendingProfile.length > 0) {
          const sampleNames = pendingProfile
            .slice(0, 3)
            .map((p: any) => {
              return p.userName || p.namaLengkap || 'Siswa';
            })
            .join(', ');
          const extra = pendingProfile.length > 3 ? `, dkk (${pendingProfile.length} total)` : '';

          items.push({
            id: 'pending_profile_update_action',
            title: 'Koreksi Data Mandiri',
            description: `Terdapat ${pendingProfile.length} siswa mengajukan revisi profil KK/NISN menunggu koreksi: ${sampleNames}${extra}.`,
            type: 'data_change',
            severity: 'medium',
            actionLabel: 'Koreksi Data',
            targetView: ViewState.DATA_APPROVAL,
            count: pendingProfile.length,
          });
        }
      } catch (err) {
        console.warn('Gagal mengambil permohonan perubahan profil:', err);
      }

      // 4. Pengajuan Surat/Dispensasi (letters with status Pending, Verified)
      try {
        const letters = await letterRepository.findAll(tenantId);
        const pendingLetters = letters.filter(l => ['Pending', 'Verified'].includes(l.status as string));
        
        if (pendingLetters.length > 0) {
          const sampleNames = pendingLetters
            .slice(0, 3)
            .map((l: any) => {
              const name = l.userName || l.namaSiswa || 'Siswa';
              const type = l.type || 'Surat';
              return `${name} (${type})`;
            })
            .join(', ');
          const extra = pendingLetters.length > 3 ? `, dkk (${pendingLetters.length} total)` : '';

          items.push({
            id: 'pending_letters_action',
            title: 'Persetujuan Surat & Izin Masuk',
            description: `Terdapat ${pendingLetters.length} permohonan surat izin sakit/dispensasi santri menunggu tindakan: ${sampleNames}${extra}.`,
            type: 'letter_pending',
            severity: 'high',
            actionLabel: 'Proses Surat',
            targetView: ViewState.LETTERS,
            count: pendingLetters.length,
          });
        }
      } catch (err) {
        console.warn('Gagal mengambil permohonan surat:', err);
      }
    } else if (isGuru) {
      // 1. Guru & Wali Kelas: Surat Izin Siswa Pending
      try {
        const letters = await letterRepository.findAll(tenantId);
        const pendingLetters = letters.filter(l => l.status === 'Pending');
        
        if (pendingLetters.length > 0) {
          const sampleNames = pendingLetters
            .slice(0, 3)
            .map((l: any) => {
              const name = l.userName || l.namaSiswa || 'Siswa';
              const type = l.type || 'Surat';
              return `${name} (${type})`;
            })
            .join(', ');
          const extra = pendingLetters.length > 3 ? `, dkk (${pendingLetters.length} total)` : '';

          items.push({
            id: 'pending_letters_guru_action',
            title: 'Verifikasi Surat Izin/Sakit Siswa',
            description: `Ada ${pendingLetters.length} santri bimbingan Anda mengajukan dispensasi/izin: ${sampleNames}${extra}. Harap verifikasi demi kehadiran kelas.`,
            type: 'letter_pending',
            severity: 'high',
            actionLabel: 'Tinjau Izin',
            targetView: ViewState.LETTERS,
            count: pendingLetters.length,
          });
        }
      } catch (err) {
        console.warn('Gagal mengambil surat oleh guru:', err);
      }
    } else {
      // Siswa & Orang Tua: Surat Izin Disetujui / Selesai
      try {
        const letters = await letterRepository.getByUserId(userId);
        const completed = letters.filter((d: any) =>
          ['Selesai', 'Approved', 'Disetujui'].includes(d.status),
        );
        if (completed.length > 0) {
          items.push({
            id: 'siswa_letter_ready_action',
            title: 'Pemberitahuan Surat Disetujui',
            description: `Pengajuan surat '${completed[0].type || 'Izin/Sakit'}' Anda telah resmi disetujui!`,
            type: 'letter_done',
            severity: 'info',
            actionLabel: 'Buka Surat',
            targetView: ViewState.LETTERS,
            count: completed.length,
          });
        }

        // Profile update rejected/need revision
        const profileRequests = await profileRequestRepository.findAll(tenantId);
        const userProfileRequests = profileRequests.filter(p => p.userId === userId);
        const returned = userProfileRequests.filter((d: any) => ['revised', 'rejected'].includes(d.status));
        if (returned.length > 0) {
          items.push({
            id: 'siswa_profile_revisi_action',
            title: 'Revisi Profil Diperlukan',
            description: `Koreksi data profil mandiri Anda memerlukan revisi segera: ${(returned[0] as any).adminNote || 'Harap periksa berkas lampiran.'}`,
            type: 'data_change',
            severity: 'high',
            actionLabel: 'Revisi Profil',
            targetView: ViewState.DATA_SUBMISSION,
            count: returned.length,
          });
        }
      } catch (err) {
        console.warn('Gagal mengambil status surat/profil siswa:', err);
      }
    }

    return items;
  } catch (error) {
    console.error('Gagal memuat getAttentionItems:', error);
    return [];
  }
};
