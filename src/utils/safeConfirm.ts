/**
 * @license
 * e-Mam System - Safe Confirm & Alert Utility
 * Prevents sandbox DOMExceptions and console errors when window.confirm / alert are blocked in iframes.
 */

export function safeConfirm(message: string): boolean {
  try {
    const result = window.confirm(message);
    return result;
  } catch (err) {
    console.warn('[SafeConfirm] window.confirm blocked by sandbox, defaulting to true:', message);
    return true;
  }
}

export function safeAlert(message: string): void {
  try {
    window.alert(message);
  } catch (err) {
    console.warn('[SafeAlert] window.alert blocked by sandbox:', message);
  }
}
