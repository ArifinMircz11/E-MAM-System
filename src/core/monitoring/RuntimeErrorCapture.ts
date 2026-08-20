import { useMonitorStore } from "./MonitorStore";
import { env } from "../config/env";

export function startRuntimeErrorCapture() {
  if (env.IS_PROD) return;

  const formatErr = (err: any): string => {
    if (!err) return '';
    if (err instanceof Error) return err.stack || err.message || err.name;
    if (typeof err === 'object') {
      try {
        return err.message || JSON.stringify(err);
      } catch {
        return '[Complex Error Object]';
      }
    }
    return String(err);
  };

  window.addEventListener("error", (event) => {
    queueMicrotask(() => {
      try {
        const state = useMonitorStore.getState();
        state.setMetric({
          errors: state.errors + 1,
          lastError: event.message || formatErr(event.error)
        });
      } catch (e) {
        // silent fail
      }
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    queueMicrotask(() => {
      try {
        const state = useMonitorStore.getState();
        state.setMetric({
          errors: state.errors + 1,
          lastError: formatErr(event.reason)
        });
      } catch (e) {
        // silent fail
      }
    });
  });
}
