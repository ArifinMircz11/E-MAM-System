/**
 * @license
 * e-Mam System - RBAC Architecture Governance Plugin
 * LAYER: SCRIPTS / GOVERNANCE / PLUGINS
 */

import { Project } from 'ts-morph';
import { Violation } from '../types';
import * as path from 'path';

export async function run(project: Project, enabledRules: string[]): Promise<Violation[]> {
  const violations: Violation[] = [];
  const isRbacEnabled = enabledRules.includes('rbac-policy');

  if (!isRbacEnabled) {
    return [];
  }

  const sourceFiles = project.getSourceFiles();

  for (const file of sourceFiles) {
    const filePath = file.getFilePath();
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    // Skip node_modules, tests, and governance files
    if (relativePath.includes('node_modules') || relativePath.startsWith('scripts/')) {
      continue;
    }

    // Core security files or legacy demo components whitelist
    const isCoreSecurityFile = relativePath.includes('PermissionChecker') || 
                                relativePath.includes('SecurityService') || 
                                relativePath.includes('security') || 
                                relativePath.includes('roleRegistry') ||
                                relativePath.includes('src/components/') ||
                                relativePath.includes('src/store/') ||
                                relativePath.includes('src/features/');

    if (isCoreSecurityFile) {
      continue;
    }

    // Scan for pattern: user.role ===, user?.role ===, profile.role ===, etc.
    const fileText = file.getText();
    const lines = fileText.split('\n');

    lines.forEach((lineText, idx) => {
      // Look for direct comparisons to roles like "=== 'admin'" or ".role ===" or similar pattern
      const directRoleCheckRegex = /(user|profile|account|u|p)\??\.role\s*==?=?/i;
      
      if (directRoleCheckRegex.test(lineText)) {
        // Exclude lines that are comments or just importing types
        if (!lineText.trim().startsWith('//') && !lineText.trim().startsWith('*') && !lineText.includes('import')) {
          violations.push({
            ruleId: 'rbac-policy',
            filePath: relativePath,
            severity: 'ERROR',
            message: `Evaluasi peran langsung terdeteksi: "${lineText.trim()}". Gunakan PermissionChecker atau SecurityService untuk penegakan RBAC.`,
            line: idx + 1,
          });
        }
      }
    });
  }

  return violations;
}
