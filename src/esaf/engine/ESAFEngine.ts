/**
 * @license
 * e-Mam System - ESAF Core Engine Runner
 */

// @ts-ignore
import { Project } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';
// @ts-ignore
import * as yaml from 'js-yaml';
import type { ESAFEvidence, ESAFReport, GovernanceRule } from '../types';
import { RuleRegistry } from '../registry/RuleRegistry';
import { SeverityScoringEngine } from './SeverityScoringEngine';
import { WOGenerator } from './WOGenerator';
import { ReportEngine } from './ReportEngine';

export class ESAFEngine {
  private project: Project;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    console.log(`[ESAF] Initializing ts-morph project with tsconfig: ${tsConfigPath}`);
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
    });
    this.project.addSourceFilesAtPaths('src/**/*.{ts,tsx}');
  }

  private loadEnabledRuleIds(): string[] {
    const manifestPath = path.join(this.projectRoot, 'governance-manifest.yaml');
    if (!fs.existsSync(manifestPath)) {
      return RuleRegistry.getAllRules().map(r => r.id);
    }

    try {
      const content = fs.readFileSync(manifestPath, 'utf8');
      const doc = yaml.load(content) as { rules?: GovernanceRule[] };
      if (!doc || !doc.rules) {
        return RuleRegistry.getAllRules().map(r => r.id);
      }
      return doc.rules.filter(r => r.enabled).map(r => r.id);
    } catch (err) {
      console.warn('[ESAF] Failed to read governance-manifest.yaml, running all registered rules.');
      return RuleRegistry.getAllRules().map(r => r.id);
    }
  }

  public async runAudit(): Promise<ESAFReport> {
    console.log('[ESAF] Starting Enterprise Static Analysis Framework (ESAF v1.0) Audit...');
    
    const enabledRuleIds = this.loadEnabledRuleIds();
    const activeRules = RuleRegistry.getActiveRules(enabledRuleIds);
    console.log(`[ESAF] Active Rules (${activeRules.length}): ${activeRules.map(r => r.id).join(', ')}`);

    const context = {
      projectRoot: this.projectRoot,
      project: this.project,
      enabledRules: enabledRuleIds,
    };

    const violations: ESAFEvidence[] = [];
    for (const rule of activeRules) {
      try {
        console.log(`[ESAF] Running rule: ${rule.id} (${rule.name})`);
        const result = await rule.analyze(context);
        if (result && Array.isArray(result)) {
          violations.push(...result);
        }
      } catch (err: any) {
        console.error(`[ESAF] Error executing rule ${rule.id}:`, err);
      }
    }

    const violationsCount = SeverityScoringEngine.calculateCounts(violations);
    const architectureScore = SeverityScoringEngine.calculateScore(violationsCount);
    const passed = SeverityScoringEngine.isPassed(violationsCount);
    const workOrders = WOGenerator.generateWorkOrders(violations);

    const report: ESAFReport = {
      timestamp: new Date().toISOString(),
      passed,
      architectureScore,
      violationsCount,
      violations,
      workOrders,
    };

    ReportEngine.writeReports(this.projectRoot, report);

    console.log(`[ESAF] Audit Complete. Score: ${architectureScore}/100. Status: ${passed ? 'PASSED' : 'FAILED'}`);
    return report;
  }
}
