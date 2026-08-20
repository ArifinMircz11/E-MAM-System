export interface ISyncOperation {
  id: string;
  collection?: string;
  docId?: string;
  operation?: string;
  action?: string;
  data?: any;
  payload?: any;
  createdAt?: number;
  updatedAt?: number;
  tenantId?: string;
  type?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'synced';
  retryCount?: number;
  lastRetry?: number;
  errorLog?: string;
}
