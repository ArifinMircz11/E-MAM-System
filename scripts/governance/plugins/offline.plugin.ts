/**
 * @license
 * e-Mam System - Offline Architecture Governance Plugin
 * LAYER: SCRIPTS / GOVERNANCE / PLUGINS
 */

import { Project } from 'ts-morph';
import { Violation, Severity } from '../types';
import * as path from 'path';

// Whitelisted folders/files that are allowed to access Firestore
const FIRESTORE_WHITELIST = [
  'src/infrastructure/firebase',
  'src/services',
  'src/sync',
  'src/utils',
  'src/core/realtime',
  'src/database/offlineService.ts',
];

// Whitelisted folders/files that are allowed to define/access Dexie database/tables
const DEXIE_WHITELIST = [
  'repositories',
  '/repositories/',
  '/repository/',
  '/data/',
  'src/database',
  'src/sync',
];

export async function run(project: Project, enabledRules: string[]): Promise<Violation[]> {
  const violations: Violation[] = [];
  const isOfflineEnforcementEnabled = enabledRules.includes('offline-enforcement');

  if (!isOfflineEnforcementEnabled) {
    return [];
  }

  const sourceFiles = project.getSourceFiles();

  for (const file of sourceFiles) {
    const filePath = file.getFilePath();
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    // Skip node_modules or governance scripts themselves
    if (relativePath.includes('node_modules') || relativePath.startsWith('scripts/')) {
      continue;
    }

    const isFirestoreWhitelisted = FIRESTORE_WHITELIST.some(w => relativePath.startsWith(w) || relativePath.includes(w));
    const isDexieWhitelisted = DEXIE_WHITELIST.some(w => relativePath.includes(w));

    // A. Check for Firestore violation if NOT in Firestore Whitelist
    if (!isFirestoreWhitelisted) {
      // 1. Check imports
      const importDeclarations = file.getImportDeclarations();
      for (const imp of importDeclarations) {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        if (moduleSpecifier.includes('firebase/firestore') || moduleSpecifier.includes('@firebase/firestore')) {
          const line = imp.getStartLineNumber();
          violations.push({
            ruleId: 'offline-enforcement',
            filePath: relativePath,
            severity: 'CRITICAL',
            message: `Impor Firestore terdeteksi di luar whitelist: "${moduleSpecifier}"`,
            line,
          });
        }
      }

      // 2. AST scanning for specific forbidden firestore function call names
      file.forEachDescendant(node => {
        if (node.getKindName() === 'CallExpression') {
          const callText = node.getText();
          // Match collection(, doc(, setDoc(, getDoc(, addDoc(, updateDoc(, deleteDoc(
          if (/^(collection|doc|setDoc|getDoc|addDoc|updateDoc|deleteDoc)\(/.test(callText)) {
            const line = node.getStartLineNumber();
            violations.push({
              ruleId: 'offline-enforcement',
              filePath: relativePath,
              severity: 'CRITICAL',
              message: `Pemanggilan fungsi Firestore "${callText.split('(')[0]}" terdeteksi di luar whitelist.`,
              line,
            });
          }
        }
      });
    }

    // B. Check for Dexie table access (".table(") outside repository or data folders
    if (!isDexieWhitelisted) {
      const fileText = file.getText();
      if (fileText.includes('.table(')) {
        // Find line numbers for .table(
        const lines = fileText.split('\n');
        lines.forEach((lineText, idx) => {
          if (lineText.includes('.table(')) {
            violations.push({
              ruleId: 'offline-enforcement',
              filePath: relativePath,
              severity: 'ERROR',
              message: `Akses tabel Dexie (.table() atau .table) terdeteksi di luar folder /repositories/ atau /data/.`,
              line: idx + 1,
            });
          }
        });
      }
    }
  }

  return violations;
}
