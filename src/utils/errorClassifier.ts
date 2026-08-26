export type ErrorCategory = 'Network' | 'Permission' | 'Validation' | 'Sync' | 'Database' | 'Unknown';

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  originalError: any;
}

export const classifyError = (error: any): ClassifiedError => {
  const msg = error?.message || String(error);
  if (msg.includes('network') || msg.includes('offline') || msg.includes('fetch')) {
    return { category: 'Network', message: msg, originalError: error };
  }
  if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('denied')) {
    return { category: 'Permission', message: msg, originalError: error };
  }
  if (msg.includes('validation') || msg.includes('invalid') || msg.includes('required')) {
    return { category: 'Validation', message: msg, originalError: error };
  }
  if (msg.includes('sync') || msg.includes('queue')) {
    return { category: 'Sync', message: msg, originalError: error };
  }
  if (msg.includes('dexie') || msg.includes('database') || msg.includes('indexeddb')) {
    return { category: 'Database', message: msg, originalError: error };
  }
  return { category: 'Unknown', message: msg, originalError: error };
};
