import { AuditReport } from "./AuditReport";

export interface AuditRule {
  id?: string;
  pattern: string;
  severity: string;
  message: string;
  ignore?: (file: string, content: string) => boolean;
}

export class RuleScanner {
  constructor(private report: AuditReport) {}

  scanFile(file: string, content: string, rules: AuditRule[]) {
    for (const rule of rules) {
      if (rule.ignore?.(file, content)) continue;

      if (content.includes(rule.pattern)) {
        this.report.add({
          file,
          severity: rule.severity,
          rule: rule.pattern,
          message: rule.message,
        });
      }
    }
  }
}
