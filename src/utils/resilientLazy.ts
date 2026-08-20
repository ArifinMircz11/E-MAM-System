import type { ComponentType, LazyExoticComponent } from 'react';
import { lazy as reactLazy } from 'react';

export function resilientLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>,
): LazyExoticComponent<T> {
  return reactLazy(async () => {
    let retriesLeft = 3;
    const interval = 800;

    async function executeWithRetry(): Promise<any> {
      try {
        const res = await factory();
        // Handle non-standard default export if it's dynamic
        if (res && !res.default && typeof res === 'object') {
          const keys = Object.keys(res);
          if (keys.length === 1) {
            return { default: res[keys[0]] };
          }
        }
        return res;
      } catch (error) {
        if (retriesLeft > 1) {
          retriesLeft--;
          console.warn(
            `[Chunk Guard] Load failed. Retrying in ${interval}ms... (${retriesLeft} retries left). Error:`,
            error,
          );
          await new Promise((resolve) => setTimeout(resolve, interval));
          return executeWithRetry();
        }
        throw error;
      }
    }

    try {
      return await executeWithRetry();
    } catch (error) {
      console.error('[Chunk Loader Error] Failed to dynamically load module after retries:', error);

      if (typeof window !== 'undefined') {
        const lastReload = sessionStorage.getItem('chunk_error_reload_time');
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('chunk_error_reload_time', String(now));
          console.warn('[Chunk Guard] Force refreshing page to sync with latest server assets...');
          window.location.reload();
        }
      }
      throw error;
    }
  });
}
