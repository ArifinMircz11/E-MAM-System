import { AuditReport } from "./AuditReport";
import { RuleScanner } from "./RuleScanner";
import { firestoreRules } from "./rules/firestore.rules";
import { listenerRules } from "./rules/listener.rules";
import { tenantRules } from "./rules/tenant.rules";

export function runFirestoreAudit(
  files: { path: string; content: string }[]
) {
  const report = new AuditReport();
  const scanner = new RuleScanner(report);

  const rules = [
    ...firestoreRules,
    ...listenerRules,
    ...tenantRules
  ];

  files.forEach(file => {
    scanner.scanFile(
      file.path,
      file.content,
      rules
    );
  });

  report.print();
  return report;
}
