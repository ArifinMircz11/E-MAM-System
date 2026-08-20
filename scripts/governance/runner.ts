/**
 * @license
 * e-Mam System - Architecture Governance Runner
 * LAYER: SCRIPTS / GOVERNANCE
 */

import { Project } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import * as yaml from 'js-yaml';
import { Severity, Violation, AuditResult, GovernanceRule } from './types';

export class GovernanceRunner {
  private project: Project;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    // Initialize ts-morph project using tsconfig.json
    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    console.log(`[Governance] Initializing ts-morph project with tsconfig: ${tsConfigPath}`);
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
    });
    // Add source files
    this.project.addSourceFilesAtPaths('src/**/*.{ts,tsx}');
  }

  /**
   * Load rules configuration from governance-manifest.yaml
   */
  private loadManifest(): GovernanceRule[] {
    const manifestPath = path.join(this.projectRoot, 'governance-manifest.yaml');
    if (!fs.existsSync(manifestPath)) {
      console.warn(`[Governance] Manifest not found at ${manifestPath}. Using empty rules list.`);
      return [];
    }

    try {
      const fileContent = fs.readFileSync(manifestPath, 'utf8');
      const doc = yaml.load(fileContent) as { rules?: GovernanceRule[] };
      return doc.rules || [];
    } catch (err: any) {
      console.error('[Governance] Error reading/parsing governance-manifest.yaml:', err);
      return [];
    }
  }

  /**
   * Dynamically import and run governance plugins
   */
  private async loadAndRunPlugins(enabledRules: string[]): Promise<Violation[]> {
    const violations: Violation[] = [];
    const currentFileUrl = import.meta.url;
    const currentDir = path.dirname(fileURLToPath(currentFileUrl));
    const pluginsDir = path.join(currentDir, 'plugins');

    if (!fs.existsSync(pluginsDir)) {
      console.warn(`[Governance] Plugins directory not found at ${pluginsDir}`);
      return [];
    }

    const files = fs.readdirSync(pluginsDir);
    console.log(`[Governance] Found ${files.length} plugin file(s) in plugins/ directory.`);

    for (const file of files) {
      if (file.endsWith('.plugin.ts') || file.endsWith('.plugin.js')) {
        const pluginPath = path.join(pluginsDir, file);
        const pluginUrl = pathToFileURL(pluginPath).href;

        try {
          console.log(`[Governance] Dynamically importing plugin: ${file}`);
          const pluginModule = await import(pluginUrl);
          
          if (typeof pluginModule.run === 'function') {
            const pluginViolations = await pluginModule.run(this.project, enabledRules);
            violations.push(...pluginViolations);
          } else {
            console.warn(`[Governance] Plugin ${file} does not export a "run" function.`);
          }
        } catch (err: any) {
          console.error(`[Governance] Failed to execute plugin ${file}:`, err);
        }
      }
    }

    return violations;
  }

  /**
   * Main audit execution method
   */
  public async executeAudit(): Promise<void> {
    console.log('[Governance] Starting Architecture Governance Audit...');
    const rules = this.loadManifest();
    const enabledRules = rules.filter(r => r.enabled).map(r => r.id);

    console.log(`[Governance] Active Rules: ${enabledRules.join(', ') || 'None'}`);

    // Run custom dynamic plugins
    const violations = await this.loadAndRunPlugins(enabledRules);

    // Calculate count per severity
    const violationsCount = {
      INFO: 0,
      WARNING: 0,
      ERROR: 0,
      CRITICAL: 0,
    };

    // Filter violations based on the manifest definitions
    const finalViolations: Violation[] = [];
    for (const v of violations) {
      const ruleConfig = rules.find(r => r.id === v.ruleId);
      if (ruleConfig && ruleConfig.enabled) {
        // Enforce severity declared in manifest over the default plugin severity
        const severity = ruleConfig.severity || v.severity;
        const mappedViolation = { ...v, severity };
        violationsCount[severity]++;
        finalViolations.push(mappedViolation);
      }
    }

    // Determine if audit passed (No ERROR or CRITICAL violations allowed)
    const passed = violationsCount.ERROR === 0 && violationsCount.CRITICAL === 0;

    // Build final report
    const auditResult: AuditResult = {
      timestamp: new Date().toISOString(),
      passed,
      violationsCount,
      violations: finalViolations,
    };

    // Write physical report file to governance-report.json
    const reportPath = path.join(this.projectRoot, 'governance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResult, null, 2), 'utf8');
    console.log(`[Governance] Audit report written to: ${reportPath}`);

    // Print detailed violations to console
    if (finalViolations.length > 0) {
      console.log('\n--- DETAILED ARCHITECTURE GOVERNANCE VIOLATIONS ---');
      for (const v of finalViolations) {
        const severityPrefix = v.severity === 'CRITICAL' ? '🔴 CRITICAL' :
                               v.severity === 'ERROR' ? '❌ ERROR' :
                               v.severity === 'WARNING' ? '⚠️ WARNING' : 'ℹ️ INFO';
        console.log(`[${severityPrefix}] [Rule: ${v.ruleId}] in ${v.filePath}${v.line ? `:${v.line}` : ''}`);
        console.log(`  Message: ${v.message}\n`);
      }
      console.log('--------------------------------------------------\n');
    }

    // Output final summary
    console.log(`[Governance] Summary of Violations:`);
    console.log(`  🔴 CRITICAL : ${violationsCount.CRITICAL}`);
    console.log(`  ❌ ERROR    : ${violationsCount.ERROR}`);
    console.log(`  ⚠️ WARNING  : ${violationsCount.WARNING}`);
    console.log(`  ℹ️ INFO     : ${violationsCount.INFO}`);

    if (passed) {
      console.log('\n[Governance] ✅ SUCCESS: Architecture Governance audit passed perfectly.\n');
    } else {
      console.error('\n[Governance] 🔴 FAILURE: Architecture Governance audit failed due to ERROR or CRITICAL violations.\n');
      process.exit(1);
    }
  }
}
