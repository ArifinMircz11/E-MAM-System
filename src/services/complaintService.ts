import { complaintRepository } from '@/repositories/complaintRepository';
import { messageRepository } from '@/repositories/messageRepository';
import type { SecurityContext } from '@/core/security/types';
import { useUserStore } from '@/stores/userStore';
import { authGateway } from './auth/AuthGateway';
import { generateManualId } from '../utils/firestoreHelpers';

export interface ComplaintRoom {
  id: string; // Pola 4: complaint_internal_idUnik atau complaint_publik_sessionId
  roomType: 'complaint_internal' | 'complaint_publik';
  participants: string[];
  lastMessage: string;
  lastTimestamp: any;
  unreadCount: Record<string, number>;
  statusTiket: 'terbuka' | 'selesai';
  targetRombel: string; // Pola 4: Berisi nama kelas jika internal, 'Publik' jika publik
  tenantId?: string; // Tenant isolation key
  metaData: {
    nama: string;
    peran: 'siswa' | 'guru' | 'orang_tua' | 'publik';
    kontak?: string; // No WA jika publik
  };
}

/**
 * Pola 1 & Pola 4: Transaksi Atomik Pengiriman Pesan Keluhan
 */
export const sendComplaintSecure = async (
  uidManual: string,
  nama: string,
  peran: 'siswa' | 'guru' | 'orang_tua' | 'publik',
  rombel: string,
  text: string,
  priority: 'high' | 'normal' = 'normal',
  bypassOutbox: boolean = false,
): Promise<void> => {
  // Pola 1: Validasi Input Hulu
  const cleanUid = uidManual?.trim();
  const cleanText = text?.trim();
  if (!cleanUid || !cleanText) {
    throw new Error('Gagal mengirim keluhan: Identitas atau teks pesan kosong.');
  }

  let tenantId = useUserStore.getState().tenantId;
  if (!tenantId || tenantId === 'global') {
    tenantId = '30315537';
  }
  const context = { tenantId, uid: authGateway.getCurrentUser()?.uid || 'anonymous' } as SecurityContext;

  const isPublik = peran === 'publik';
  const roomId = isPublik ? `complaint_publik_${cleanUid}` : `complaint_internal_${cleanUid}`;

  // Pola 1: Blok Penanganan Error Utama
  try {
    // 1. Update/Create Room (Complaint)
    const existingComplaint = await complaintRepository.getComplaintById(context.tenantId, roomId);

    let currentAdminUnread = 0;
    if (existingComplaint) {
      currentAdminUnread = existingComplaint.unreadCount?.['ADMIN_MADRASAH'] || 0;
    }

    const roomData: Partial<any> = {
      id: roomId,
      roomType: isPublik ? 'complaint_publik' : 'complaint_internal',
      participants: [cleanUid, 'ADMIN_MADRASAH'],
      lastMessage: cleanText,
      lastTimestamp: Date.now(),
      statusTiket: 'terbuka',
      targetRombel: isPublik ? 'Publik' : rombel,
      tenantId: tenantId,
      metaData: {
        nama: nama || 'Pengguna',
        peran: peran || 'publik',
        ...(isPublik ? { kontak: rombel || 'Anonim' } : { kontak: '-' }),
      },
      unreadCount: {
        [cleanUid]: 0,
        ADMIN_MADRASAH: currentAdminUnread + 1,
      },
    };

    await complaintRepository.createComplaint(roomData as any);

    // 2. Tulis dokumen pesan baru
    const messageId = generateManualId(`${tenantId}_complaint_msg_${Date.now()}`);
    await messageRepository.createMessage(context, {
      id: messageId,
      chatId: roomId,
      senderId: cleanUid,
      receiverId: 'ADMIN_MADRASAH',
      messageText: cleanText,
      timestamp: Date.now(),
      isRead: false,
      priority: priority,
      createdAt: Date.now(),
      tenantId,
    });
  } catch (error: any) {
    console.error('Error pada sendComplaintSecure:', error);
    throw new Error(`Gagal mengirim keluhan. Detail: ${error.message}`);
  }
};

export const addComplaintReply = async (roomId: string, replyText: string) => {
  let tenantId = useUserStore.getState().tenantId;
  if (!tenantId || tenantId === 'global') {
    tenantId = '30315537';
  }
  const context = { tenantId, uid: authGateway.getCurrentUser()?.uid || 'anonymous' } as SecurityContext;

  try {
    await messageRepository.createMessage(context, {
      id: generateManualId(`${tenantId}_complaint_reply_${Date.now()}`),
      chatId: roomId,
      senderId: 'ADMIN_MADRASAH',
      messageText: replyText,
      timestamp: Date.now(),
      isRead: false,
      priority: 'normal',
      createdAt: Date.now(),
      tenantId,
    });
  } catch (error) {
    console.error('Error pada addComplaintReply:', error);
  }
};

/**
 * Pola 2: Kueri Daftar Pengaduan dengan Proteksi Filter Massal "Semua Rombel"
 */
export const getComplaintsQuerySafe = async (filterRombel: string, fallbackKelasWali: string) => {
  try {
    let tenantId = useUserStore.getState().tenantId;
    if (!tenantId || tenantId === 'global') {
      tenantId = '30315537';
    }

    // Pola 2: Barikade Pengalihan Otomatis filter "semua rombel" ke kelas tertentu
    const targetFilter = filterRombel === 'semua rombel' ? fallbackKelasWali : filterRombel;

    // Call repository instead
    const context = { tenantId, uid: authGateway.getCurrentUser()?.uid || 'anonymous' } as SecurityContext;
    return await complaintRepository.getComplaints(context.tenantId, targetFilter);
  } catch (error) {
    console.error('Error pada getComplaintsQuerySafe:', error);
    throw new Error('Target spesifik diperlukan. Gagal mengambil daftar keluhan.');
  }
};
