import { reportArchitectureViolation } from "./ArchitectureGuard";

export function checkDexieAccess(source: string) {
  if (source.includes("components") || source.includes("features")) {
    reportArchitectureViolation(
      "Dexie Boundary",
      `Direct Dexie access: ${source}`
    );
  }
}
