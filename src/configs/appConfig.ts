/**
 * e-Mam System - Global Application Configuration
 * Provides centralized typed facade for application branding, client environment, and feature flags.
 * DOES NOT contain business data (tenantId, user profiles, academic sessions, etc.).
 */

import { env } from '../core/config/env';

export const APP_CONFIG = {
  VERSION: '8.0.0',
  PLATFORM_NAME: 'e-Mam System',

  // Fallback NPSN branding metadata (Constant default)
  DEFAULT_TENANT_ID: '30315537',

  // Client Environment Facade
  ENV: env,

  // FEATURE_FLAGS: Derived from env and application features
  FEATURES: {
    ATTENDANCE: true,
    REPORTS: true,
    ADVISOR_AI: true,
    PARENT_PORTAL: true,
    TEACHER_JOURNAL: true,
    DIGITAL_LETTERS: true,
    QR_SCANNER: true,
    PREMIUM_MODULES: false,
    MOCK_MODE: env.MOCK_MODE,
  },

  // DOMAIN_BOUNDARIES: Metadata for domain governance
  DOMAINS: {
    SISWA: 'siswa',
    GURU: 'guru',
    ACADEMIC: 'akademik',
    ATTENDANCE: 'presensi',
    FINANCE: 'keuangan',
    ADMIN: 'admin',
  },
};

export type AppConfigType = typeof APP_CONFIG;
export default APP_CONFIG;
