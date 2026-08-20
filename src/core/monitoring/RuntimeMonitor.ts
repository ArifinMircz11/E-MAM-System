import { startRuntimeMetrics } from "./RuntimeMetrics";
import { startRuntimeErrorCapture } from "./RuntimeErrorCapture";
import { checkListenerSafety } from "./ListenerCircuitBreaker";
import { env } from "../config/env";

let monitorStarted = false;

export function startRuntimeMonitor() {
  if (monitorStarted) return;
  if (env.IS_PROD) return;

  monitorStarted = true;

  startRuntimeMetrics();
  startRuntimeErrorCapture();

  setInterval(() => {
    checkListenerSafety();
  }, 5000);
}
