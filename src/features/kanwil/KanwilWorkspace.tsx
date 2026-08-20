import React, { useState, Suspense } from 'react';
import * as LucideIcons from 'lucide-react';
import { motion } from 'motion/react';
import { ViewState, UserRole } from '@/types';
import { KanwilNavbar } from './components/KanwilNavbar';
import GlobalSidebar from '@/navigation/components/GlobalSidebar';
import { ViewLoader } from '@/components/ui/ViewLoader';
import {
  KanwilDashboardView,
  KanwilSatuanKerjaView,
  OrganizationManagement,
  MadrasahMaster,
  UserManagement,
  AccountApproval,
  Reports,
  Profile,
  SupportModule,
} from '@/routes/ViewRegistry';

interface KanwilWorkspaceProps {
  activeTitle: string;
  children: React.ReactNode;
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
  userRole?: UserRole;
  userName?: string;
  userPhoto?: string;
  unreadNotifCount?: number;
}

export const KanwilWorkspace: React.FC<KanwilWorkspaceProps> = ({
  activeTitle,
  children,
  onNavigate,
  currentView,
  userRole = UserRole.ADMIN,
  userName,
  userPhoto,
  unreadNotifCount = 0,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emam_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emam_sidebar_collapsed', String(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <KanwilNavbar
        activeTitle={activeTitle}
        userName={userName}
        userPhoto={userPhoto}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        unreadNotifCount={unreadNotifCount}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Workspace Sidebar */}
        <motion.div
          layout
          initial={false}
          animate={{ width: isSidebarCollapsed ? 64 : 288 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden lg:flex flex-col shrink-0 h-full relative overflow-hidden"
        >
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3.5 top-4 z-40 hidden lg:flex items-center justify-center w-7 h-7 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 rounded-full shadow-md transition-all duration-200 cursor-pointer focus:outline-none hover:scale-110"
            title={isSidebarCollapsed ? 'Buka Sidebar' : 'Ciutkan Sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            id="kanwil-sidebar-toggle-btn"
          >
            {isSidebarCollapsed ? <LucideIcons.ChevronRight className="w-4 h-4" /> : <LucideIcons.ChevronLeft className="w-4 h-4" />}
          </button>
          <GlobalSidebar
            currentView={currentView}
            onNavigate={onNavigate}
            isCollapsed={isSidebarCollapsed}
          />
        </motion.div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative z-10 w-64 h-full">
              <GlobalSidebar
                currentView={currentView}
                onNavigate={onNavigate}
                onClose={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Workspace Main Content View */}
        <main className="flex-1 overflow-y-auto bg-slate-900/90 text-slate-100 custom-scrollbar p-2 sm:p-6">
          <Suspense fallback={<ViewLoader />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default KanwilWorkspace;
