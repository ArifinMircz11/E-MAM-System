import { DeveloperTabKey } from './DeveloperTab';

export interface DevSystemAlert {
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'danger';
}

export interface DevConfirmModalState {
  title: string;
  message: string;
  action: () => Promise<void> | void;
  confirmText?: string;
}

export interface DevTableStats {
  totalDocs: number;
  totalSizeEstimated: string;
  lastUpdated: string;
}

export interface DeveloperConsoleProps {
  onClose?: () => void;
  onBack?: () => void;
  initialTab?: DeveloperTabKey;
}
