import { runFirestoreAudit } from "./FirestoreAudit";
import fs from "fs";
import path from "path";

function scanDir(dir: string) {
  let result: any[] = [];
  if (!fs.existsSync(dir)) return result;
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== "node_modules" && file !== "dist") {
        result.push(...scanDir(full));
      }
    } else if (
      file.endsWith(".ts") ||
      file.endsWith(".tsx")
    ) {
      result.push({
        path: full,
        content: fs.readFileSync(full, "utf8")
      });
    }
  });

  return result;
}

const files = scanDir("src");
runFirestoreAudit(files);
