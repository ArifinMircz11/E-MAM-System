import React, { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * resilientLazy wraps React.lazy to handle chunk loading failures
 * and reload gracefully if an updated deploy changed chunk hashes.
 */
export function resilientLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      // Check if error is due to chunk/dynamically imported module load failure
      const isChunkError =
        error?.message?.includes('dynamically imported module') ||
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError && typeof window !== 'undefined') {
        const lastReload = sessionStorage.getItem('chunk_error_reload_time');
        const now = Date.now();
        // If not reloaded in the last 10 seconds, retry by reloading
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('chunk_error_reload_time', String(now));
          window.location.reload();
        }
      }
      throw error;
    }
  });
}

export default resilientLazy;
