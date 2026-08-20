// src/lib/schemaGuard.ts

import { ModuleManifest } from '../manifest/ModuleManifest';

interface ValidationContext {
  moduleName: string;
  operatorRole: string;
}

export const SchemaGuard = {
  /**
   * Memvalidasi data input dan hak akses berdasarkan manifest resmi
   * @throws Error jika melanggar RBAC atau terjadi Schema Drift
   */
  enforce(data: any[], context: ValidationContext): void {
    const config = ModuleManifest[context.moduleName];

    if (!config) {
      throw new Error(
        `[Governance Alert] Modul '${context.moduleName}' tidak terdaftar di ModuleManifest.`,
      );
    }

    // 1. RBAC Binding Verification
    if (!config.allowedRoles.includes(context.operatorRole)) {
      throw new Error(
        `[Security Violation] Role '${context.operatorRole}' dilarang menulis ke modul ${context.moduleName}.`,
      );
    }

    // 2. Field-Level Contract Verification
    for (const record of data) {
      for (const [field, expectedType] of Object.entries(config.fields)) {
        if (field === 'id') continue; // Diabaikan karena ditangani deterministik oleh repository

        const value = record[field];
        if (value === undefined) {
          throw new Error(
            `[Schema Drift Blocked] Field wajib '${field}' hilang pada modul ${context.moduleName}.`,
          );
        }
        if (typeof value !== expectedType) {
          throw new Error(
            `[Schema Drift Blocked] Ketidakcocokan tipe data pada field '${field}'. Ekspektasi: ${expectedType}, Diterima: ${typeof value}.`,
          );
        }
      }
    }
  },
};
