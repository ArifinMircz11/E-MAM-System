import { AuditReport } from "./AuditReport";
import { RuleScanner } from "./RuleScanner";
import { firestoreRules } from "./rules/firestore.rules";
import { listenerRules } from "./rules/listener.rules";
import { tenantRules } from "./rules/tenant.rules";
import path from "node:path";

const repoRoot = process.cwd();

function relative(file: string): string {
  return path.relative(repoRoot, file).replaceAll(path.sep, "/");
}

function isApprovedFirestoreBoundary(file: string): boolean {
  const p = relative(file);
  return [
    "src/services/sync/",
    "src/services/realtime/",
    "src/services/SyncEngine.ts",
    "src/sync/",
    "src/infrastructure/sync/",
  ].some((prefix) => p.startsWith(prefix) || p === prefix.slice(0, -1));
}

export function runFirestoreAudit(files: { path: string; content: string }[]) {
  const report = new AuditReport();
  const scanner = new RuleScanner(report);

  const rules = [
    ...firestoreRules.map((rule) => ({
      ...rule,
      ignore:
        rule.id === "direct-firestore-import"
          ? (file: string) => isApprovedFirestoreBoundary(file)
          : rule.ignore,
    })),
    ...listenerRules,
    ...tenantRules,
  ];

  for (const file of files) {
    scanner.scanFile(file.path, file.content, rules);
  }

  report.print();
  return report;
}
