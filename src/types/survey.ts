import type { AppEntity, SyncStatus } from '@/domain/entities/base';

export type AnswerType = 'rating' | 'yes_no' | 'text' | 'choice';
export type RespondentType = 'guru' | 'siswa' | 'orang_tua' | 'tendik' | 'umum';
export type ServiceType = 
  | 'ptsp' 
  | 'live_agent' 
  | 'bk' 
  | 'perpustakaan' 
  | 'keuangan' 
  | 'sarpras' 
  | 'akademik' 
  | 'absensi' 
  | 'inventaris' 
  | string;

export interface ServiceSurvey extends AppEntity {
  npsn: string;
  serviceType: ServiceType;
  serviceId: string;
  ticketId?: string;
  conversationId?: string;
  respondentId: string;
  respondentType: RespondentType;
  agentId?: string;
  submittedAt: number;
  version: number;
  syncStatus: SyncStatus;
}

export interface SurveyQuestion extends AppEntity {
  npsn: string;
  serviceType: ServiceType | 'all';
  question: string;
  answerType: AnswerType;
  isRequired: boolean;
  order: number;
  isActive: boolean;
}

export interface SurveyAnswer extends AppEntity {
  surveyId: string;
  questionId: string;
  rating?: number; // 1-5
  answer?: string;
  createdAt: number;
}

export interface SurveyTemplate extends AppEntity {
  name: string;
  serviceType: ServiceType;
  description: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface SurveyStatistics extends AppEntity {
  npsn: string;
  serviceType: ServiceType;
  totalResponses: number;
  averageRating: number;
  satisfiedCount: number; // rating >= 4
  unsatisfiedCount: number; // rating <= 2
  updatedAt: number;
}
