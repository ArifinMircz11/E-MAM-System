import { SecurityContext } from '@/core/security/SecurityContext';
import { faqCategoryRepository } from '@/repositories/FaqCategoryRepository';
import { faqRepository } from '@/repositories/FaqRepository';
import { supportAgentRepository } from '@/repositories/SupportAgentRepository';
import { supportConversationRepository } from '@/repositories/SupportConversationRepository';
import { supportMessageRepository } from '@/repositories/SupportMessageRepository';
import { supportTicketRepository } from '@/repositories/SupportTicketRepository';
import { faqFeedbackRepository } from '@/repositories/FaqFeedbackRepository';
import { useUserStore } from '@/stores/userStore';
import { authGateway } from '@/services/auth/AuthGateway';

export const getSecurityContext = (): SecurityContext => {
  let tenantId = useUserStore.getState().tenantId;
  if (!tenantId || tenantId === 'global') {
    tenantId = '30315537';
  }

  const state = useUserStore.getState();
  const roles = state.roles || ['user'];
  
  return new SecurityContext(
    authGateway.getCurrentUser()?.uid || 'anonymous',
    tenantId,
    new Set((state as any).user?.permissions || []),
    { level: 'tenant' }, // Scope
    roles, // Roles
    'madrasah' // Default accountType
  );
};

export const supportModuleService = {
  async seedDefaultFaqs() {
    const context = getSecurityContext();
    const categories = await faqCategoryRepository.findAll(context.tenantId);
    if (categories.length === 0) {
      const defaultCats = [
        { id: 'cat_akademik', tenantId: context.tenantId, npsn: context.tenantId, name: 'Akademik', description: 'Jadwal, nilai, raport, dan KBM', icon: 'BookOpen', sortOrder: 1, isActive: true },
        { id: 'cat_absensi', tenantId: context.tenantId, npsn: context.tenantId, name: 'Absensi', description: 'Kehadiran siswa dan guru', icon: 'Clock', sortOrder: 2, isActive: true },
        { id: 'cat_ptsp', tenantId: context.tenantId, npsn: context.tenantId, name: 'PTSP & Surat', description: 'Pengajuan surat menyurat dan perizinan', icon: 'FileText', sortOrder: 3, isActive: true },
        { id: 'cat_keuangan', tenantId: context.tenantId, npsn: context.tenantId, name: 'Keuangan', description: 'SPP, infak, dan pembayaran', icon: 'CreditCard', sortOrder: 4, isActive: true },
        { id: 'cat_bk', tenantId: context.tenantId, npsn: context.tenantId, name: 'Bimbingan Konseling', description: 'Poin pelanggaran, prestasi, dan konseling', icon: 'Shield', sortOrder: 5, isActive: true },
      ];
      for (const cat of defaultCats) {
        await faqCategoryRepository.update(cat as any);
      }

      const defaultFaqs = [
        {
          id: 'faq_1',
          tenantId: context.tenantId,
          npsn: context.tenantId,
          categoryId: 'cat_akademik',
          question: 'Bagaimana cara melihat jadwal pelajaran?',
          answer: 'Anda dapat melihat jadwal pelajaran melalui menu Jadwal di navigasi utama aplikasi e-MAM System.',
          keywords: ['jadwal', 'pelajaran', 'kbm', 'jam'],
          isPublished: true,
          viewCount: 120,
          helpfulCount: 45,
          notHelpfulCount: 2,
        },
        {
          id: 'faq_2',
          tenantId: context.tenantId,
          npsn: context.tenantId,
          categoryId: 'cat_absensi',
          question: 'Bagaimana cara melakukan absensi harian?',
          answer: 'Guru piket atau wali kelas dapat melakukan absensi melalui menu Kehadiran / Absensi di dashboard.',
          keywords: ['absensi', 'hadir', 'kehadiran', 'alpha', 'sakit', 'izin'],
          isPublished: true,
          viewCount: 95,
          helpfulCount: 38,
          notHelpfulCount: 1,
        },
        {
          id: 'faq_3',
          tenantId: context.tenantId,
          npsn: context.tenantId,
          categoryId: 'cat_ptsp',
          question: 'Bagaimana cara mengajukan surat keterangan aktif siswa?',
          answer: 'Buka menu PTSP / Layanan Surat, pilih buat surat baru, isi data yang diperlukan, lalu ajukan ke bagian tata usaha.',
          keywords: ['surat', 'keterangan', 'aktif', 'ptsp', 'tu'],
          isPublished: true,
          viewCount: 150,
          helpfulCount: 60,
          notHelpfulCount: 3,
        },
        {
          id: 'faq_4',
          tenantId: context.tenantId,
          npsn: context.tenantId,
          categoryId: 'cat_bk',
          question: 'Bagaimana cara mengecek poin pelanggaran siswa?',
          answer: 'Poin pelanggaran dapat dilihat pada menu Bimbingan Konseling (BK) atau detail profil siswa.',
          keywords: ['poin', 'pelanggaran', 'bk', 'konseling', 'prestasi'],
          isPublished: true,
          viewCount: 80,
          helpfulCount: 30,
          notHelpfulCount: 0,
        },
      ];

      for (const faq of defaultFaqs) {
        await faqRepository.update(faq as any);
      }
    }
  },

  async getFaqCategories() {
    const context = getSecurityContext();
    await this.seedDefaultFaqs();
    return await faqCategoryRepository.getActiveCategories(context.tenantId);
  },

  async getFaqs(categoryId?: string) {
    const context = getSecurityContext();
    await this.seedDefaultFaqs();
    return await faqRepository.getPublishedFaqs(context.tenantId, categoryId);
  },

  async searchFaqs(queryText: string) {
    const context = getSecurityContext();
    await this.seedDefaultFaqs();
    return await faqRepository.searchFaqs(context.tenantId, queryText);
  },

  async rateFaq(faqId: string, helpful: boolean, comment?: string) {
    const context = getSecurityContext();
    await faqFeedbackRepository.update({
      id: crypto.randomUUID(),
      tenantId: context.tenantId,
      faqId,
      userId: context.uid,
      helpful,
      comment,
      createdAt: Date.now(),
    } as any);
    const faq = await faqRepository.findById(faqId, context.tenantId);
    if (faq) {
      await faqRepository.update({
        ...faq,
        helpfulCount: helpful ? (faq.helpfulCount || 0) + 1 : faq.helpfulCount,
        notHelpfulCount: !helpful ? (faq.notHelpfulCount || 0) + 1 : faq.notHelpfulCount,
      });
    }
  },

  async getConversations() {
    const context = getSecurityContext();
    return await supportConversationRepository.getByUser(context.tenantId, context.uid);
  },

  async createConversation(subject: string, categoryId: string, priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat' = 'Sedang', initialMessage?: string) {
    const context = getSecurityContext();
    const convId = crypto.randomUUID();
    const ticketNo = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = Date.now();

    const conversation: any = {
      id: convId,
      tenantId: context.tenantId,
      npsn: context.tenantId,
      ticketNumber: ticketNo,
      userId: context.uid,
      subject,
      categoryId,
      priority,
      status: 'Open',
      startedAt: now,
    };

    await supportConversationRepository.create(conversation);

    if (initialMessage) {
      await supportMessageRepository.create({
        id: crypto.randomUUID(),
        tenantId: context.tenantId,
        conversationId: convId,
        senderId: context.uid,
        senderType: 'user',
        message: initialMessage,
        messageType: 'text',
        isRead: false,
        sentAt: now,
      } as any);
    }

    return conversation;
  },

  async getMessages(conversationId: string) {
    const context = getSecurityContext();
    return await supportMessageRepository.getMessagesByConversation(context.tenantId, conversationId);
  },

  async sendMessage(conversationId: string, message: string, messageType: 'text' | 'image' | 'pdf' | 'audio' = 'text', attachmentUrl?: string) {
    const context = getSecurityContext();
    const now = Date.now();
    const msg: any = {
      id: crypto.randomUUID(),
      tenantId: context.tenantId,
      conversationId,
      senderId: context.uid,
      senderType: 'user',
      message,
      messageType,
      attachmentUrl,
      isRead: false,
      sentAt: now,
    };
    await supportMessageRepository.create(msg);

    setTimeout(async () => {
      try {
        const replyContext = getSecurityContext();
        await supportMessageRepository.create({
          id: crypto.randomUUID(),
          tenantId: replyContext.tenantId,
          conversationId,
          senderId: 'system_agent',
          senderType: 'agent',
          message: `Terima kasih pesan Anda telah diterima oleh Tim Layanan e-MAM System. Petugas kami sedang meninjau pertanyaan Anda.`,
          messageType: 'text',
          isRead: false,
          sentAt: Date.now(),
        } as any);
      } catch (e) {
        console.error('Agent auto reply error:', e);
      }
    }, 1500);

    return msg;
  },

  async getTickets() {
    const context = getSecurityContext();
    return await supportTicketRepository.getByUser(context.tenantId, context.uid);
  },

  async createTicket(title: string, categoryId: string, description: string, priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat' = 'Sedang') {
    const context = getSecurityContext();
    const ticketNo = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticket: any = {
      id: crypto.randomUUID(),
      tenantId: context.tenantId,
      ticketNumber: ticketNo,
      userId: context.uid,
      categoryId,
      title,
      description,
      priority,
      status: 'Open',
    };
    await supportTicketRepository.create(ticket);
    return ticket;
  },

  async getAgents() {
    const context = getSecurityContext();
    const agents = await supportAgentRepository.getActiveAgents(context.tenantId);
    if (agents.length === 0) {
      const defaultAgents = [
        { id: 'ag_1', tenantId: context.tenantId, userId: 'agent_01', name: 'Ustadz Ahmad Fauzi', role: 'Support Lead', department: 'Akademik & PTSP', status: 'online' as const, lastActive: Date.now(), maxChats: 10 },
        { id: 'ag_2', tenantId: context.tenantId, userId: 'agent_02', name: 'Ibu Siti Aminah', role: 'Helpdesk Officer', department: 'Keuangan & Absensi', status: 'online' as const, lastActive: Date.now(), maxChats: 10 },
        { id: 'ag_3', tenantId: context.tenantId, userId: 'agent_03', name: 'Bapak Rahmat Hidayat', role: 'Technical Support', department: 'Sistem & IT', status: 'busy' as const, lastActive: Date.now(), maxChats: 5 },
      ];
      for (const ag of defaultAgents) {
        await supportAgentRepository.update(ag as any);
      }
      return defaultAgents;
    }
    return agents;
  },
};
