export type AuditSeverity =
  | "P0"
  | "P1"
  | "P2";

export interface AuditFinding {
  file: string;
  line?: number;
  severity: AuditSeverity;
  rule: string;
  message: string;
}

export class AuditReport {
  private findings: AuditFinding[] = [];

  add(finding: AuditFinding) {
    this.findings.push(finding);
  }

  getAll() {
    return this.findings;
  }

  print() {
    console.table(
      this.findings.map(item => ({
        Severity: item.severity,
        File: item.file,
        Rule: item.rule,
        Message: item.message
      }))
    );
  }
}
