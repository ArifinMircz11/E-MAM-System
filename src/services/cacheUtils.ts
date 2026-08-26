export const clearAllCaches = async (): Promise<void> => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
};

export const setCacheWithTTL = async (key: string, data: any, ttlMs: number = 3600000): Promise<void> => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const item = {
    data,
    expiry: Date.now() + ttlMs,
  };
  window.localStorage.setItem(key, JSON.stringify(item));
};

export const getCacheIfValid = async <T>(key: string): Promise<T | null> => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const itemStr = window.localStorage.getItem(key);
  if (!itemStr) return null;
  try {
    const item = JSON.parse(itemStr);
    if (!item || typeof item.expiry !== 'number') return null;
    if (Date.now() > item.expiry) {
      window.localStorage.removeItem(key);
      return null;
    }
    return item.data as T;
  } catch {
    return null;
  }
};

export const cacheUtils = {
  clearAllCaches,
  setCacheWithTTL,
  getCacheIfValid,
};
