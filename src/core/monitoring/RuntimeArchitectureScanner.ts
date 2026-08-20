import { reportArchitectureViolation } from "./ArchitectureGuard";
import { env } from "../config/env";

export function scanRuntime() {
  if (env.IS_PROD) return;

  const modules = Object.keys(
    import.meta.glob("/src/features/**/*.{ts,tsx}", { eager: false })
  );

  modules.forEach(file => {
    if (file.includes("features") && file.includes("firebase")) {
      reportArchitectureViolation(
        "UI",
        `Firebase import detected ${file}`
      );
    }
  });
}
