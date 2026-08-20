import { useEffect, useRef } from 'react';
import { useMonitorStore } from './MonitorStore';

export interface PerformanceMetricLog {
  componentName: string;
  renderTimeMs: number;
  renderCount: number;
  timestamp: string;
  extraDetails?: Record<string, any>;
}

const memoryLogs: PerformanceMetricLog[] = [];

/**
 * Custom React hook for performance monitoring.
 * Measures component render duration and logs detailed timing information to the browser console.
 * Integrates with MonitorStore to help identify bottleneck components in Madrasah management workflow.
 *
 * @param componentName Name of the critical component being profiled (e.g., 'Dashboard', 'ViewRenderer')
 * @param extraDetails Optional metadata or props context to include in the console log
 */
export function useRenderProfiler(componentName: string, extraDetails?: Record<string, any>): void {
  const renderCountRef = useRef(0);
  const renderStartRef = useRef(performance.now());

  renderCountRef.current += 1;
  const currentRender = renderCountRef.current;

  // Capture start time before the component JSX is committed
  renderStartRef.current = performance.now();

  useEffect(() => {
    const durationMs = performance.now() - renderStartRef.current;
    const roundedMs = Math.round(durationMs * 100) / 100;

    const logEntry: PerformanceMetricLog = {
      componentName,
      renderTimeMs: roundedMs,
      renderCount: currentRender,
      timestamp: new Date().toISOString(),
      extraDetails,
    };

    memoryLogs.push(logEntry);
    if (memoryLogs.length > 200) {
      memoryLogs.shift();
    }

    // Update global monitoring store
    try {
      useMonitorStore.getState().recordRenderMetric(componentName, roundedMs);
    } catch {
      // Guard against store initialization timing
    }

    // Output formatted console log for visual debugging
    const speedBadge =
      roundedMs > 100
        ? 'color: #f43f5e; font-weight: bold;'
        : roundedMs > 30
        ? 'color: #f59e0b; font-weight: bold;'
        : 'color: #10b981; font-weight: bold;';

    console.log(
      `%c[PerfMonitor]%c %c${componentName}%c render #${currentRender} completed in %c${roundedMs}ms%c`,
      'background: #0f172a; color: #38bdf8; font-weight: bold; padding: 2px 6px; border-radius: 3px; font-size: 11px;',
      'color: inherit;',
      'color: #38bdf8; font-weight: bold;',
      'color: #94a3b8;',
      speedBadge,
      'color: inherit;',
      extraDetails ? extraDetails : ''
    );
  });
}

/**
 * Retrieves the recorded performance logs from memory.
 */
export function getPerformanceLogs(): PerformanceMetricLog[] {
  return [...memoryLogs];
}
