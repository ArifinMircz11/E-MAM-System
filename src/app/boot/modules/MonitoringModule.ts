import { startRuntimeMonitor, scanRuntime } from "@/core/monitoring";

export async function MonitoringModule() {
  startRuntimeMonitor();
  scanRuntime();
}
