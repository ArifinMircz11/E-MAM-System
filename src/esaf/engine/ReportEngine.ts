/**
 * @license
 * e-Mam System - ESAF Report Engine
 */

import type { ESAFReport } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class ReportEngine {
  public static writeReports(projectRoot: string, report: ESAFReport): void {
    // 1. Write JSON Report
    const jsonPath = path.join(projectRoot, 'esaf-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

    // Also update governance-report.json for backward compatibility
    const govJsonPath = path.join(projectRoot, 'governance-report.json');
    fs.writeFileSync(govJsonPath, JSON.stringify({
      timestamp: report.timestamp,
      passed: report.passed,
      violationsCount: report.violationsCount,
      violations: report.violations
    }, null, 2), 'utf8');

    // 2. Write Markdown Report
    const mdPath = path.join(projectRoot, 'ESAF-AUDIT-REPORT.md');
    const mdContent = `# ESAF Architecture Governance Audit Report

- **Timestamp**: ${report.timestamp}
- **Architecture Score**: **${report.architectureScore} / 100**
- **Status**: ${report.passed ? '✅ PASSED' : '❌ FAILED'}

## Violation Summary
- 🔴 **CRITICAL (P0)**: ${report.violationsCount.CRITICAL}
- ❌ **ERROR (P1)**: ${report.violationsCount.ERROR}
- ⚠️ **WARNING (P2)**: ${report.violationsCount.WARNING}
- ℹ️ **INFO (P3)**: ${report.violationsCount.INFO}

## Generated Work Orders (${report.workOrders.length})
${report.workOrders.map(wo => `### [${wo.severity}] ${wo.woId}: ${wo.title}
- **Target Rule**: ${wo.targetRule}
- **Affected Files**:
${wo.affectedFiles.map(f => `  - \`${f}\``).join('\n')}
- **Objective**: ${wo.objective}
- **Steps**:
${wo.steps.map(s => `  - ${s}`).join('\n')}
`).join('\n')}

## Detailed Violations (${report.violations.length})
| Rule ID | Severity | File:Line | Evidence & Recommendation |
|---|---|---|---|
${report.violations.map(v => `| \`${v.ruleId}\` | **${v.severity}** | \`${v.filePath}:${v.line}\` | **Evidence**: \`${v.evidence}\`<br/>**Fix**: ${v.recommendation} |`).join('\n')}
`;

    fs.writeFileSync(mdPath, mdContent, 'utf8');
    console.log(`[ESAF] Reports generated successfully at:\n  - ${jsonPath}\n  - ${mdPath}`);
  }
}
