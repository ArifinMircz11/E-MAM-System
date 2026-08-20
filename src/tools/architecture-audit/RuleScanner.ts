import { AuditReport } from "./AuditReport";

export class RuleScanner {
  constructor(private report: AuditReport) {}

  scanFile(
    file: string,
    content: string,
    rules: any[]
  ) {
    rules.forEach(rule => {
      if (content.includes(rule.pattern)) {
        this.report.add({
          file,
          severity: rule.severity,
          rule: rule.pattern,
          message: rule.message
        });
      }
    });
  }
}
