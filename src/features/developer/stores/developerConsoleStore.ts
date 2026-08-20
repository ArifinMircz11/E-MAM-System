import { create } from 'zustand';
import { DeveloperTabKey } from '../types/DeveloperTab';
import { DevSystemAlert, DevConfirmModalState } from '../types/DeveloperConsole';

interface DeveloperConsoleState {
  activeTab: DeveloperTabKey;
  searchQuery: string;
  systemAlert: DevSystemAlert;
  confirmModal: DevConfirmModalState | null;
  isCustomCollectionModalOpen: boolean;
  isEditorOpen: boolean;
  
  setActiveTab: (tab: DeveloperTabKey) => void;
  setSearchQuery: (query: string) => void;
  setSystemAlert: (alert: DevSystemAlert | ((prev: DevSystemAlert) => DevSystemAlert)) => void;
  setConfirmModal: (modal: DevConfirmModalState | null) => void;
  setIsCustomCollectionModalOpen: (open: boolean) => void;
  setIsEditorOpen: (open: boolean) => void;
}

export const useDeveloperConsoleStore = create<DeveloperConsoleState>((set) => ({
  activeTab: 'overview',
  searchQuery: '',
  systemAlert: {
    enabled: false,
    message: '',
    type: 'info',
  },
  confirmModal: null,
  isCustomCollectionModalOpen: false,
  isEditorOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSystemAlert: (alert) =>
    set((state) => ({
      systemAlert: typeof alert === 'function' ? alert(state.systemAlert) : alert,
    })),
  setConfirmModal: (modal) => set({ confirmModal: modal }),
  setIsCustomCollectionModalOpen: (open) => set({ isCustomCollectionModalOpen: open }),
  setIsEditorOpen: (open) => set({ isEditorOpen: open }),
}));
