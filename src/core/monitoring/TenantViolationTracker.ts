import { useMonitorStore } from "./MonitorStore";

export function registerTenantViolation() {
  const state = useMonitorStore.getState();
  state.setMetric({
    tenantErrors: state.tenantErrors + 1
  });
}
