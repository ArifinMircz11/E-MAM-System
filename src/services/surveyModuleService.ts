import { SecurityContext } from '@/core/security/SecurityContext';
import { serviceSurveyRepository } from '@/repositories/ServiceSurveyRepository';
import { surveyQuestionRepository } from '@/repositories/SurveyQuestionRepository';
import { surveyAnswerRepository } from '@/repositories/SurveyAnswerRepository';
import { surveyTemplateRepository } from '@/repositories/SurveyTemplateRepository';
import { surveyStatisticsRepository } from '@/repositories/SurveyStatisticsRepository';
import type { ServiceSurvey, SurveyQuestion, SurveyTemplate, SurveyStatistics } from '@/types/survey';
import { useUserStore } from '@/stores/userStore';
import { SyncStatus } from '@/domain/entities/base';

import { TenantContext } from '@/core/context/TenantContext';

export const getSurveySecurityContext = (): SecurityContext => {
  return TenantContext.getContext() as any;
};

export const surveyModuleService = {
  async seedDefaultSurveyData() {
    const context = getSurveySecurityContext();
    const templates = await surveyTemplateRepository.findAll(context.tenantId);
    
    if (templates.length === 0) {
      const defaultTemplates: SurveyTemplate[] = [
        { id: 'tpl_ptsp', tenantId: context.tenantId, name: 'PTSP & Layanan Surat', serviceType: 'ptsp', description: 'Survei kepuasan layanan Pelayanan Terpadu Satu Pintu', isDefault: true, isActive: true },
        { id: 'tpl_live_agent', tenantId: context.tenantId, name: 'Live Agent Chat', serviceType: 'live_agent', description: 'Survei kepuasan interaksi dengan live agent', isDefault: true, isActive: true },
        { id: 'tpl_bk', tenantId: context.tenantId, name: 'Bimbingan Konseling', serviceType: 'bk', description: 'Survei bimbingan konseling dan penanganan siswa', isDefault: true, isActive: true },
        { id: 'tpl_perpus', tenantId: context.tenantId, name: 'Perpustakaan', serviceType: 'perpus', description: 'Survei layanan peminjaman dan perpustakaan', isDefault: true, isActive: true },
        { id: 'tpl_keuangan', tenantId: context.tenantId, name: 'Keuangan & Pembayaran', serviceType: 'finance', description: 'Survei layanan administrasi keuangan', isDefault: true, isActive: true },
        { id: 'tpl_sarpras', tenantId: context.tenantId, name: 'Sarana & Prasarana', serviceType: 'sarpras', description: 'Survei pemeliharaan dan fasilitas sekolah', isDefault: true, isActive: true },
        { id: 'tpl_akademik', tenantId: context.tenantId, name: 'Akademik & KBM', serviceType: 'academic', description: 'Survei layanan pembelajaran dan akademik', isDefault: true, isActive: true },
        { id: 'tpl_absensi', tenantId: context.tenantId, name: 'Absensi & Kehadiran', serviceType: 'attendance', description: 'Survei pengelolaan kehadiran siswa/guru', isDefault: true, isActive: true },
        { id: 'tpl_inventaris', tenantId: context.tenantId, name: 'Inventaris & Barang', serviceType: 'inventory', description: 'Survei peminjaman dan pengelolaan inventaris', isDefault: true, isActive: true },
      ].map(t => ({
        ...t,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: SyncStatus.SYNCED,
        version: 1,
        deleted: false
      }));

      for (const tpl of defaultTemplates) {
        await surveyTemplateRepository.update(tpl);
      }

      const defaultQuestions: SurveyQuestion[] = [
        { id: 'q_1', npsn: context.tenantId, tenantId: context.tenantId, serviceType: 'all', question: 'Apakah prosedur pelayanan mudah dipahami?', answerType: 'rating', isRequired: true, order: 1, isActive: true },
        { id: 'q_2', npsn: context.tenantId, tenantId: context.tenantId, serviceType: 'all', question: 'Apakah petugas ramah dan profesional?', answerType: 'rating', isRequired: true, order: 2, isActive: true },
        { id: 'q_3', npsn: context.tenantId, tenantId: context.tenantId, serviceType: 'all', question: 'Apakah kecepatan pelayanan memuaskan?', answerType: 'rating', isRequired: true, order: 3, isActive: true },
        { id: 'q_4', npsn: context.tenantId, tenantId: context.tenantId, serviceType: 'all', question: 'Apakah masalah atau kebutuhan Anda terselesaikan?', answerType: 'yes_no', isRequired: true, order: 4, isActive: true },
        { id: 'q_5', npsn: context.tenantId, tenantId: context.tenantId, serviceType: 'all', question: 'Secara keseluruhan, seberapa puas Anda dengan layanan ini?', answerType: 'rating', isRequired: true, order: 5, isActive: true },
        { id: 'q_6', npsn: context.tenantId, tenantId: context.tenantId, serviceType: 'all', question: 'Apa yang paling Anda sukai dari layanan ini?', answerType: 'text', isRequired: false, order: 6, isActive: true },
        { id: 'q_7', npsn: context.tenantId, tenantId: context.tenantId, serviceType: 'all', question: 'Apa yang perlu diperbaiki dari layanan ini?', answerType: 'text', isRequired: false, order: 7, isActive: true },
        { id: 'q_8', npsn: context.tenantId, tenantId: context.tenantId, serviceType: 'all', question: 'Apakah Anda bersedia menggunakan layanan ini kembali?', answerType: 'yes_no', isRequired: false, order: 8, isActive: true },
      ].map(q => ({
        ...q,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: SyncStatus.SYNCED,
        version: 1,
        deleted: false
      })) as any;

      for (const q of defaultQuestions) {
        await surveyQuestionRepository.update(q);
      }
    }
  },

  async getTemplates() {
    const context = getSurveySecurityContext();
    await this.seedDefaultSurveyData();
    return await surveyTemplateRepository.findAll(context.tenantId);
  },

  async getQuestions(serviceType: string) {
    const context = getSurveySecurityContext();
    await this.seedDefaultSurveyData();
    return await surveyQuestionRepository.getQuestionsForService(context.tenantId, serviceType);
  },

  async submitSurveyResponse(data: {
    serviceType: string;
    serviceId: string;
    ticketId?: string;
    conversationId?: string;
    respondentType: 'guru' | 'siswa' | 'orang_tua' | 'tendik' | 'umum';
    agentId?: string;
    answers: { questionId: string; rating?: number; answer?: string }[];
  }) {
    const context = getSurveySecurityContext();
    const surveyId = 'srv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = Date.now();
    const currentUser = useUserStore.getState().user;
    const respondentId = currentUser?.id || context.uid || 'guest';

    const surveyRecord: ServiceSurvey = {
      id: surveyId,
      npsn: context.tenantId,
      tenantId: context.tenantId,
      serviceType: data.serviceType,
      serviceId: data.serviceId,
      ticketId: data.ticketId,
      conversationId: data.conversationId,
      respondentId,
      respondentType: data.respondentType,
      agentId: data.agentId,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: SyncStatus.PENDING,
      deleted: false,
    };

    await serviceSurveyRepository.update(surveyRecord);

    let totalRatingSum = 0;
    let ratingCount = 0;
    let isSatisfied = false;
    let isUnsatisfied = false;

    for (const ans of data.answers) {
      const answerRecord: any = {
        id: 'ans_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        tenantId: context.tenantId,
        surveyId,
        questionId: ans.questionId,
        rating: ans.rating,
        answer: ans.answer,
        createdAt: now,
      };
      await surveyAnswerRepository.update(answerRecord);

      if (ans.rating && typeof ans.rating === 'number') {
        totalRatingSum += ans.rating;
        ratingCount++;
      }
    }

    const avgRating = ratingCount > 0 ? Number((totalRatingSum / ratingCount).toFixed(2)) : 5;
    if (avgRating >= 4) isSatisfied = true;
    if (avgRating <= 2) isUnsatisfied = true;

    // Update Statistics
    await this.updateStatisticsForService(context.tenantId, data.serviceType, avgRating, isSatisfied, isUnsatisfied);

    return surveyRecord;
  },

  async updateStatisticsForService(tenantId: string, serviceType: string, newRating: number, satisfied: boolean, unsatisfied: boolean) {
    const statsList = await surveyStatisticsRepository.findAll(tenantId);
    let stat = statsList.find((s) => s.serviceType === serviceType);

    if (!stat) {
      stat = {
        id: 'stat_' + serviceType,
        npsn: tenantId,
        tenantId: tenantId,
        serviceType,
        totalResponses: 0,
        averageRating: 0,
        satisfiedCount: 0,
        unsatisfiedCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: SyncStatus.SYNCED,
        version: 1,
        deleted: false,
      };
    }

    const totalResponses = stat.totalResponses + 1;
    const currentTotalScore = stat.averageRating * stat.totalResponses;
    const averageRating = Number(((currentTotalScore + newRating) / totalResponses).toFixed(2));
    const satisfiedCount = stat.satisfiedCount + (satisfied ? 1 : 0);
    const unsatisfiedCount = stat.unsatisfiedCount + (unsatisfied ? 1 : 0);

    const updatedStat: SurveyStatistics = {
      ...stat,
      totalResponses,
      averageRating,
      satisfiedCount,
      unsatisfiedCount,
      updatedAt: Date.now(),
    };

    await surveyStatisticsRepository.update(updatedStat);
  },

  async getAllStatistics() {
    const context = getSurveySecurityContext();
    return await surveyStatisticsRepository.findAll(context.tenantId);
  },

  async getAllSurveys() {
    const context = getSurveySecurityContext();
    return await serviceSurveyRepository.findAll(context.tenantId);
  },
};
