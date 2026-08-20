import React, { Suspense } from 'react';
import { Loader2 } from '@/shared/Icons';
import { useSecurity } from '@/hooks/useSecurity';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { DeveloperHeader } from './components/header/DeveloperHeader';
import { DeveloperSidebar } from './components/sidebar/DeveloperSidebar';
import { ViewState } from '@/types';
import { DevConsoleProvider, useDevConsoleContext } from './context/DeveloperContext';
import {
  DevConfirmModal,
  DevCustomCollectionModal,
  DevJsonEditorModal,
} from './components/DeveloperConsole/Modals';

const LoadingPlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4 opacity-50">
    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
      Memuat Modul Engine...
    </p>
  </div>
);

// Internal component to use context for modals
const DeveloperConsoleContent: React.FC<{
  children?: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onClose: () => void;
}> = ({ children, currentView, onNavigate, onClose }) => {
  const dev = useDevConsoleContext();

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <DeveloperHeader onClose={onClose} />
      <div className="flex flex-1 overflow-hidden">
        <DeveloperSidebar currentView={currentView} onNavigate={onNavigate} onClose={onClose} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-900/50">
          <Suspense fallback={<LoadingPlaceholder />}>
            {children || <LoadingPlaceholder />}
          </Suspense>
        </main>
      </div>

      <DevConfirmModal modal={dev?.confirmModal ?? null} onClose={() => dev?.setConfirmModal(null)} />
      <DevCustomCollectionModal open={dev?.isCustomCollectionModalOpen ?? false} onClose={() => dev?.setIsCustomCollectionModalOpen(false)} name={dev?.customCollectionName ?? ''} setName={dev?.setCustomCollectionName ?? (() => {})} json={dev?.customCollectionJson ?? ''} setJson={dev?.setCustomCollectionJson ?? (() => {})} onSave={dev?.handleCreateCustomCollection ?? (async () => {})} saving={dev?.saving ?? false} onBeautify={dev?.beautifyCustomCollectionJson ?? (() => {})} />
      <DevJsonEditorModal open={dev?.isEditorOpen ?? false} onClose={() => dev?.setIsEditorOpen(false)} mode={dev?.editorMode ?? 'add'} id={dev?.editingId ?? null} json={dev?.jsonContent ?? ''} setJson={dev?.setJsonContent ?? (() => {})} onSave={dev?.saveDocument ?? (async () => {})} saving={dev?.saving ?? false} onBeautify={dev?.beautifyJsonContent ?? (() => {})} />
    </div>
  );
};

export const DeveloperConsole: React.FC<{ 
  onClose?: () => void; 
  onBack?: () => void;
  children?: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}> = ({
  onClose,
  onBack,
  children,
  currentView,
  onNavigate,
}) => {
  const { can } = useSecurity();
  const handleClose = onClose || onBack || (() => {});

  if (!can('developer.console')) {
    return <AccessDenied onBack={handleClose} />;
  }

  return (
    <DevConsoleProvider>
      <DeveloperConsoleContent 
        currentView={currentView} 
        onNavigate={onNavigate} 
        onClose={handleClose}
      >
        {children}
      </DeveloperConsoleContent>
    </DevConsoleProvider>
  );
};

export default DeveloperConsole;
