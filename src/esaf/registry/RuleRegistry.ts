/**
 * @license
 * e-Mam System - ESAF Rule Registry
 */

import type { ESAFRule, ESAFEvidence, ESAFContext } from '../types';

// Rule 1: OFFLINE-001 - Enforce Offline-First (No direct firestore/firebase in UI, hooks, repos)
const OfflineEnforcementRule: ESAFRule = {
  id: 'OFFLINE-001',
  name: 'Offline-First Layer Enforcement',
  category: 'offline',
  severity: 'CRITICAL',
  description: 'Prohibits direct firebase/firestore imports in components, hooks, and repositories.',
  analyze(context: ESAFContext): ESAFEvidence[] {
    const violations: ESAFEvidence[] = [];
    const sourceFiles = context.project.getSourceFiles();

    for (const file of sourceFiles) {
      const filePath = file.getFilePath();
      // Whitelist services and sync engine
      if (
        filePath.includes('/src/services/') ||
        filePath.includes('SyncEngine') ||
        filePath.includes('masterSyncService')
      ) {
        continue;
      }

      // Check imports
      const importDeclarations = file.getImportDeclarations();
      for (const imp of importDeclarations) {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        if (moduleSpecifier.includes('firebase/') || moduleSpecifier === 'firebase') {
          violations.push({
            ruleId: 'OFFLINE-001',
            filePath: filePath.replace(context.projectRoot, ''),
            line: imp.getStartLineNumber(),
            column: imp.getStart(),
            severity: 'CRITICAL',
            evidence: `Direct Firebase import "${moduleSpecifier}" in non-service file.`,
            recommendation: 'Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.',
          });
        }
      }
    }
    return violations;
  },
};

// Rule 2: SEC-001 - RBAC Policy Enforcement in UI
const RBACPolicyRule: ESAFRule = {
  id: 'SEC-001',
  name: 'RBAC Policy Enforcement',
  category: 'security',
  severity: 'ERROR',
  description: 'Prohibits direct role evaluation in UI components (e.g. user.role === admin).',
  analyze(context: ESAFContext): ESAFEvidence[] {
    const violations: ESAFEvidence[] = [];
    const sourceFiles = context.project.getSourceFiles();

    for (const file of sourceFiles) {
      const filePath = file.getFilePath();
      if (!filePath.includes('/src/components/')) {
        continue;
      }

      const text = file.getFullText();
      // Check for raw role checks
      if (text.includes('.role ===') || text.includes('.role ==') || text.includes('user.role')) {
        violations.push({
          ruleId: 'SEC-001',
          filePath: filePath.replace(context.projectRoot, ''),
          line: 1,
          column: 0,
          severity: 'ERROR',
          evidence: 'Direct user role evaluation found inside UI component.',
          recommendation: 'Delegate all permission and role checks to PermissionChecker or SecurityService.',
        });
      }
    }
    return violations;
  },
};

// Rule 3: ARCH-001 - Repository Layer Isolation
const RepositoryIsolationRule: ESAFRule = {
  id: 'ARCH-001',
  name: 'Repository Layer Isolation',
  category: 'repository',
  severity: 'ERROR',
  description: 'Repositories must only access Dexie and must not import React, UI, or Firebase.',
  analyze(context: ESAFContext): ESAFEvidence[] {
    const violations: ESAFEvidence[] = [];
    const sourceFiles = context.project.getSourceFiles();

    for (const file of sourceFiles) {
      const filePath = file.getFilePath();
      if (!filePath.includes('/repositories/')) {
        continue;
      }

      const importDeclarations = file.getImportDeclarations();
      for (const imp of importDeclarations) {
        const mod = imp.getModuleSpecifierValue();
        if (mod.includes('react') || mod.includes('firebase') || mod.includes('@tanstack')) {
          violations.push({
            ruleId: 'ARCH-001',
            filePath: filePath.replace(context.projectRoot, ''),
            line: imp.getStartLineNumber(),
            column: 0,
            severity: 'ERROR',
            evidence: `Repository imports forbidden module "${mod}".`,
            recommendation: 'Repositories must be pure TypeScript classes interacting only with Dexie.',
          });
        }
      }
    }
    return violations;
  },
};

// Rule 4: SYNC-001 - SyncQueue Atomicity Enforcement
const SyncQueueAtomicityRule: ESAFRule = {
  id: 'SYNC-001',
  name: 'SyncQueue Transaction Atomicity',
  category: 'sync',
  severity: 'ERROR',
  description: 'Ensures mutation operations wrap Dexie storage and SyncQueue additions in a single atomic transaction.',
  analyze(context: ESAFContext): ESAFEvidence[] {
    const violations: ESAFEvidence[] = [];
    const sourceFiles = context.project.getSourceFiles();

    for (const file of sourceFiles) {
      const filePath = file.getFilePath();
      if (!filePath.includes('/repositories/')) {
        continue;
      }

      const text = file.getFullText();
      // If repository performs writes but doesn't use db.transaction
      if ((text.includes('.put(') || text.includes('.add(') || text.includes('.delete(')) && !text.includes('db.transaction')) {
        violations.push({
          ruleId: 'SYNC-001',
          filePath: filePath.replace(context.projectRoot, ''),
          line: 1,
          column: 0,
          severity: 'ERROR',
          evidence: 'Repository performs write without db.transaction enclosing syncQueue operations.',
          recommendation: 'Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.',
        });
      }
    }
    return violations;
  },
};

// Rule 5: TENANT-001 - Tenant Isolation Check
const TenantIsolationRule: ESAFRule = {
  id: 'TENANT-001',
  name: 'Multi-Tenant Isolation Enforcement',
  category: 'architecture',
  severity: 'CRITICAL',
  description: 'Queries in repositories must filter or scope by tenantId to prevent cross-tenant data leaks.',
  analyze(context: ESAFContext): ESAFEvidence[] {
    const violations: ESAFEvidence[] = [];
    const sourceFiles = context.project.getSourceFiles();

    for (const file of sourceFiles) {
      const filePath = file.getFilePath();
      if (!filePath.includes('/repositories/')) {
        continue;
      }

      const text = file.getFullText();
      // If repository queries collection without tenantId index or filter
      if (text.includes('.where(') && !text.includes('tenantId') && !filePath.includes('tenant')) {
        violations.push({
          ruleId: 'TENANT-001',
          filePath: filePath.replace(context.projectRoot, ''),
          line: 1,
          column: 0,
          severity: 'CRITICAL',
          evidence: 'Dexie query in repository missing tenantId scoping.',
          recommendation: 'Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])).',
        });
      }
    }
    return violations;
  },
};

// Rule 6: HOOK-001 - Hook Layer Isolation
const HookIsolationRule: ESAFRule = {
  id: 'HOOK-001',
  name: 'Hook Layer Pure Orchestration',
  category: 'hook',
  severity: 'WARNING',
  description: 'Hooks must only orchestrate services and manage state; no direct Firebase or Dexie calls.',
  analyze(context: ESAFContext): ESAFEvidence[] {
    const violations: ESAFEvidence[] = [];
    const sourceFiles = context.project.getSourceFiles();

    for (const file of sourceFiles) {
      const filePath = file.getFilePath();
      if (!filePath.includes('/hooks/')) {
        continue;
      }

      const importDeclarations = file.getImportDeclarations();
      for (const imp of importDeclarations) {
        const mod = imp.getModuleSpecifierValue();
        if (mod.includes('firebase') || mod.includes('dexie')) {
          violations.push({
            ruleId: 'HOOK-001',
            filePath: filePath.replace(context.projectRoot, ''),
            line: imp.getStartLineNumber(),
            column: 0,
            severity: 'ERROR',
            evidence: `Hook imports forbidden low-level database/cloud module "${mod}".`,
            recommendation: 'Hooks must interact exclusively with Services.',
          });
        }
      }
    }
    return violations;
  },
};

// Rule 7: QR-001 - QR Scanner Architectural Boundary Governance
const QRScannerGovernanceRule: ESAFRule = {
  id: 'QR-001',
  name: 'QR Scanner Architecture & Boundary Governance',
  category: 'architecture',
  severity: 'CRITICAL',
  description:
    'Enforces architectural boundaries for QR Scanner: UI -> Hook -> Service -> Repository -> Dexie (Sync Engine gateway only for Firestore). Prohibits direct DB/cloud calls in QR UI.',
  analyze(context: ESAFContext): ESAFEvidence[] {
    const violations: ESAFEvidence[] = [];
    const sourceFiles = context.project.getSourceFiles();

    for (const file of sourceFiles) {
      const filePath = file.getFilePath();
      if (!filePath.includes('QRScanner')) {
        continue;
      }

      // 1. Boundary check: No direct Firebase/Firestore or Dexie imports in QR Scanner UI
      const importDeclarations = file.getImportDeclarations();
      for (const imp of importDeclarations) {
        const mod = imp.getModuleSpecifierValue();
        if (mod.includes('firebase') || mod.includes('firestore')) {
          violations.push({
            ruleId: 'QR-001',
            filePath: filePath.replace(context.projectRoot, ''),
            line: imp.getStartLineNumber(),
            column: 0,
            severity: 'CRITICAL',
            evidence: `QR Scanner imports cloud database module "${mod}".`,
            recommendation:
              'QR Scanner UI must delegate scanning to useAttendance or attendanceService.',
          });
        }
        if (mod === 'dexie' || mod.includes('/database/dexie')) {
          violations.push({
            ruleId: 'QR-001',
            filePath: filePath.replace(context.projectRoot, ''),
            line: imp.getStartLineNumber(),
            column: 0,
            severity: 'ERROR',
            evidence: `QR Scanner UI directly imports low-level IndexedDB/Dexie module "${mod}".`,
            recommendation: 'QR Scanner UI must interact only via Hooks or Repositories.',
          });
        }
      }

      const text = file.getFullText();

      // 2. Application Flow: QR UI must call attendance service/hook (recordScan or recordAttendanceByScan)
      if (
        !text.includes('recordScan') &&
        !text.includes('recordAttendanceByScan') &&
        !text.includes('useAttendance')
      ) {
        violations.push({
          ruleId: 'QR-001',
          filePath: filePath.replace(context.projectRoot, ''),
          line: 1,
          column: 0,
          severity: 'ERROR',
          evidence:
            'QR Scanner UI does not delegate scan processing to useAttendance or attendanceService.',
          recommendation:
            'Connect QR Scanner UI to useAttendance hook or attendanceService.recordAttendanceByScan.',
        });
      }
    }
    return violations;
  },
};

export class RuleRegistry {
  private static rules: Map<string, ESAFRule> = new Map([
    ['OFFLINE-001', OfflineEnforcementRule],
    ['SEC-001', RBACPolicyRule],
    ['ARCH-001', RepositoryIsolationRule],
    ['SYNC-001', SyncQueueAtomicityRule],
    ['TENANT-001', TenantIsolationRule],
    ['HOOK-001', HookIsolationRule],
    ['QR-001', QRScannerGovernanceRule],
  ]);

  public static registerRule(rule: ESAFRule): void {
    RuleRegistry.rules.set(rule.id, rule);
  }

  public static getRule(id: string): ESAFRule | undefined {
    return RuleRegistry.rules.get(id);
  }

  public static getAllRules(): ESAFRule[] {
    return Array.from(RuleRegistry.rules.values());
  }

  public static getActiveRules(enabledRuleIds: string[]): ESAFRule[] {
    return enabledRuleIds
      .map(id => RuleRegistry.rules.get(id))
      .filter((r): r is ESAFRule => r !== undefined);
  }
}
