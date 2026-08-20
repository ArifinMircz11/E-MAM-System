import { listenerRegistry } from "./ListenerRegistry";
import { useMonitorStore } from "./MonitorStore";

const WARNING_LIMIT = 30;
const STOP_LIMIT = 50;

export function checkListenerSafety() {
  const total = listenerRegistry.count();

  if (total > WARNING_LIMIT) {
    useMonitorStore.getState().setMetric({
      lastError: `Listener tinggi: ${total}`
    });
  }

  if (total > STOP_LIMIT) {
    listenerRegistry.destroyAll();

    useMonitorStore.getState().setMetric({
      realtimeDisabled: true,
      errors: useMonitorStore.getState().errors + 1,
      lastError: "Realtime disabled - listener leak protection"
    });
  }
}
