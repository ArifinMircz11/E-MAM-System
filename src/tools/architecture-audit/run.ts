import { runFirestoreAudit } from "./FirestoreAudit";
import fs from "fs";
import path from "path";

const EXCLUDED_DIRS = new Set([
  "node_modules",
  "dist",
  "tools/architecture-audit",
  "esaf/registry",
]);

function scanDir(dir: string) {
  const result: { path: string; content: string }[] = [];
  if (!fs.existsSync(dir)) return result;

  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      const relative = path.relative("src", full).replaceAll(path.sep, "/");
      if (!EXCLUDED_DIRS.has(relative)) {
        result.push(...scanDir(full));
      }
      continue;
    }

    if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      result.push({
        path: full,
        content: fs.readFileSync(full, "utf8"),
      });
    }
  }

  return result;
}

const files = scanDir("src");
runFirestoreAudit(files);
