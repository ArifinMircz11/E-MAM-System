import { listenerRegistry } from "./ListenerRegistry";
import { useMonitorStore } from "./MonitorStore";
import { env } from "../config/env";

let started = false;

export function startRuntimeMetrics() {
  if (started) return;
  if (env.IS_PROD) return;

  started = true;

  setInterval(() => {
    useMonitorStore.getState().setMetric({
      listeners: listenerRegistry.count()
    });
  }, 3000);
}
