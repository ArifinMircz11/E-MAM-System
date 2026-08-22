import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

import { ViewState, UserRole } from '@/types';
import type { TickerItem } from '@/types';
import { toast, Toaster } from 'sonner';
import { Loader2, ZapIcon } from '@/shared/Icons';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUserStore } from '@/stores/userStore';
import { normalizeRoleStr, logoutUser } from '@/services/authService';
import { MOCK_TICKER } from '@/services/mockData';
import { resilientLazy } from '@/utils/resilientLazy';
import { MonitoringModule } from '@/app/boot/modules/MonitoringModule';
import { SecurityContextService } from '@/core/security/SecurityContextService';

const FloatingActionMenu = resilientLazy(() => import('@/components/ui/FloatingActionMenu'));
const ChatbotContainer = resilientLazy(() => import('@/features/ai/components/ChatbotContainer'));
const AiAgentContainer = resilientLazy(() => import('@/features/ai/components/AiAgentContainer'));
const ChatWindowContainer = resilientLazy(() => import('@/features/ai/components/ChatWindowContainer'));
const PushNotificationPrompt = resilientLazy(() => import('@/features/notifications/components/PushNotificationPrompt'));
const OnboardingForm = resilientLazy(() => import('@/features/auth/components/OnboardingForm'));
const WaitingGate = resilientLazy(() => import('@/features/auth/components/WaitingGate'));
const ReferenceIdEntryModal = resilientLazy(() => import('@/features/dashboard/components/ReferenceIdEntryModal'));

import BottomNav from '@/components/layout/BottomNav';
import GlobalSidebar from '@/navigation/components/GlobalSidebar';
import { ChatProvider } from '@/lib/context/ChatContext';
import EmergencyAlert from '@/features/emergency/components/EmergencyAlert';
import { ProfileCompletionModal } from '@/features/profile/components/ProfileCompletionModal';
import { eventBus } from '@/events/eventBus';
import { IdentityEngine } from '@/domain/identityEngine';
import { initPointAuditListeners, initUserAuditListeners } from '@/services/auditLogService';
import { initNotificationEventListeners } from '@/services/notificationService';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useAuthInitialization } from '@/hooks/useAuthInitialization';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import { IdentityCompletionService } from '@/services/IdentityCompletionService';
import { IdentityCompletionPage } from '@/features/profile/components';
import { ViewLoader } from '@/components/ui/ViewLoader';
import MaintenanceGuard from '@/components/ui/MaintenanceGuard';
import { useProfileStore } from '@/stores/profileStore';
import { useAppStore } from '@/stores/appStore';
import { useProfileValidation } from '@/hooks/useProfileValidation';
import { useStudentAttendance } from '@/hooks/useStudentAttendance';
import { LoadingScreen, MaintenanceScreen, SelfHealingScreen } from '@/components/ui/SystemScreens';
import { AppInitializationService } from '@/services/AppInitializationService';
import { ImpersonationProvider, ImpersonationBanner } from '@/core/impersonation';

const ViewRenderer = resilientLazy(() => import('@/routes/ViewRenderer').then((m) => ({ default: m.ViewRenderer })));

const RealtimeSubscriptionTracker: React.FC = () => {
  useRealtimeSubscriptions();
  return null;
};

const App: React.FC = () => {
  useEffect(() => { MonitoringModule(); }, []);

  const { authLoading } = useAuthInitialization();
  const { isOnline } = useAppInitialization();
  const { currentState, initializationLog, globalError } = useAppStore();

  const currentView = useUIStore((state) => state.currentView);
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  const lockList = useUIStore((state) => state.lockedFeatures);
  const navigationHistory = useUIStore((state) => state.navigationHistory);
  const setNavigationHistory = useUIStore((state) => state.setNavigationHistory);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const accountStatus = useAuthStore((state) => state.accountStatus);
  const setAccountStatus = useAuthStore((state) => state.setAccountStatus);
  const clearUserData = useUserStore((state) => state.clearUserData);
  const autoFixStatus = useUIStore((state) => state.autoFixStatus);
  const profile = useProfileStore((state) => state.profile);

  const securityContext = SecurityContextService.getNullableContext();
  const activeRoles = securityContext?.roles?.length ? securityContext.roles : [UserRole.TAMU];
  const userRole = securityContext?.role || activeRoles[0];
  const isLoginPage = currentView === ViewState.LOGIN || currentView === ViewState.PUBLIC_SERVICES || currentView === ViewState.SCANNER || currentView === ViewState.NEWS;
  const isStandaloneWorkspace = [ViewState.DEVELOPER, ViewState.KANWIL_DASHBOARD, ViewState.KANWIL_SATUAN_KERJA, ViewState.DEV_ASSIGNMENTS, ViewState.DEV_ROLES, ViewState.DEV_PERMISSIONS, ViewState.DEV_SYNC, ViewState.DEV_AUDIT_LOG, ViewState.DEV_SECURITY, ViewState.DEV_SYSTEM_SETTINGS].includes(currentView);
  useProfileValidation(profile);

  useEffect(() => {
    if (!authLoading && !user && !isLoginPage) {
      setCurrentView(ViewState.LOGIN);
      setNavigationHistory([]);
    }
  }, [authLoading, user, isLoginPage, setCurrentView, setNavigationHistory]);

  useEffect(() => {
    const unsubscribe = eventBus.subscribe('PROFILE_COMPLETED', async (event) => {
      await IdentityEngine.provisionAccess(event.data.uid, event.data.userData);
    });
    return () => { unsubscribe?.(); };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) { root.classList.add('dark'); root.style.colorScheme = 'dark'; }
    else { root.classList.remove('dark'); root.style.colorScheme = 'light'; }
  }, [isDarkMode]);

  useEffect(() => { initPointAuditListeners(); initUserAuditListeners(); initNotificationEventListeners(); }, []);

  const [viewKey, setViewKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emam_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });
  useEffect(() => { localStorage.setItem('emam_sidebar_collapsed', String(isDesktopSidebarCollapsed)); }, [isDesktopSidebarCollapsed]);

  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const isStudentRole = userRole === UserRole.SISWA || userRole === UserRole.KETUA_KELAS;
  const { attendanceRecords: appStudentRecords } = useStudentAttendance(isStudentRole ? (user?.idUnik || user?.studentsId || undefined) : undefined);
  const remainingSessionsCount = useMemo(() => {
    if (!isStudentRole || !appStudentRecords?.length) return 0;
    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayRec = appStudentRecords.find((r: any) => r.date === todayStr);
    if (!todayRec) { const day = new Date().getDay(); return day === 0 || day === 6 ? 0 : 5; }
    let count = 0;
    for (const key of ['masuk', 'duha', 'zuhur', 'ashar', 'pulang']) {
      const s = todayRec.sessions?.[key];
      if (!s || s.status === 'TS' || s.time === '--:--') {
        if (['duha', 'zuhur', 'ashar'].includes(key) && todayRec.isHaid) continue;
        count++;
      }
    }
    return count;
  }, [isStudentRole, appStudentRecords]);

  const unreadNotifCount = useNotificationStore((state) => state.unreadCount);
  const unreadChatCount = useNotificationStore((state) => state.unreadChatCount);
  const pendingLetterCount = useNotificationStore((state) => state.pendingLetterCount);
  const pendingApprovalCount = useAuthStore((state) => state.pendingApprovalCount);

  useEffect(() => { setTickerItems(MOCK_TICKER.filter((item: any) => item.isActive)); }, []);

  const handleNavigate = (view: ViewState) => {
    if (view === currentView) return;
    const isDeveloper = securityContext?.isDeveloper === true || activeRoles.includes(UserRole.DEVELOPER);
    if (!isDeveloper && lockList.includes(view)) {
      toast.error('Halaman ini sedang dalam perbaikan (Maintenance) dan tidak dapat diakses.');
      return;
    }
    React.startTransition(() => {
      if (currentView !== ViewState.LOGIN) setNavigationHistory((prev) => [...prev, currentView]);
      setViewKey((prev) => prev + 1);
      setCurrentView(view);
      setIsSidebarOpen(false);
    });
  };

  const handleBack = () => {
    React.startTransition(() => {
      if (navigationHistory.length > 0) {
        const historyCopy = [...navigationHistory];
        const previousView = historyCopy.pop()!;
        setNavigationHistory(historyCopy);
        setViewKey((prev) => prev + 1);
        setCurrentView(previousView);
      } else if (currentView === ViewState.PUBLIC_SERVICES) {
        setCurrentView(ViewState.LOGIN); setNavigationHistory([]); setViewKey((prev) => prev + 1);
      } else if (currentView !== ViewState.DASHBOARD && currentView !== ViewState.GUEST_DASHBOARD) {
        const isGuest = activeRoles.includes(UserRole.TAMU) || userRole === UserRole.TAMU;
        setCurrentView(isGuest ? ViewState.GUEST_DASHBOARD : ViewState.DASHBOARD); setNavigationHistory([]); setViewKey((prev) => prev + 1);
      }
    });
  };

  const handleLoginSuccess = (role: UserRole) => {
    const normalizedRole = normalizeRoleStr(role);
    const context = SecurityContextService.getNullableContext();
    if (!context || !context.uid || !context.tenantId || !context.role) {
      toast.error('Security Context belum siap. Login dibatalkan.');
      return;
    }
    if (lockList.includes('auth_login') && normalizedRole !== UserRole.DEVELOPER) {
      toast.error('Sistem Sedang Maintenance', { description: 'Akses login sedang dibatasi.' });
      void handleLogout();
      return;
    }
    setNavigationHistory([]);
    handleNavigate(normalizedRole === UserRole.TAMU ? ViewState.GUEST_DASHBOARD : ViewState.DASHBOARD);
  };

  const handleImpersonate = (_role: UserRole, _name: string, _sid?: string) => {
    throw new Error('IMPERSONATION_DISABLED: client-side identity mutation is forbidden');
  };

  const handleLogout = async () => {
    try { const { realtimeHub } = await import('@/services/realtime/realtimeHub'); realtimeHub.unsubscribeAll(); } catch (e) { console.warn('Failed to clear realtime hub subscriptions:', e); }
    try { await logoutUser(); } catch (error) { console.warn('Silent signout failure during cleanup:', error); }
    React.startTransition(() => {
      clearUserData(); setUser(null); setAccountStatus(null); setNavigationHistory([]); setCurrentView(ViewState.LOGIN);
    });
  };

  if (authLoading) {
    return <div className="fixed inset-0 h-screen w-full flex flex-col items-center justify-center bg-[#020617] z-[1000] overflow-hidden"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>;
  }

  const renderContent = () => {
    if (user && currentView !== ViewState.LOGIN) {
      const canonicalValidation = IdentityCompletionService.validate(user);
      if (!canonicalValidation.valid) {
        return <Suspense fallback={<div className="fixed inset-0 bg-[#020617] flex items-center justify-center"><ViewLoader /></div>}><IdentityCompletionPage user={user} onCompleted={(updatedUser) => { setUser(updatedUser); handleNavigate(ViewState.DASHBOARD); }} /></Suspense>;
      }
    }
    if (user && accountStatus === 'needs_id_verification' && currentView !== ViewState.LOGIN) {
      return <Suspense fallback={<ViewLoader />}><ReferenceIdEntryModal isOpen={true} onLogout={handleLogout} /></Suspense>;
    }
    if (user && (accountStatus === 'needs_profile_completion' || accountStatus === 'rejected') && currentView !== ViewState.LOGIN) {
      return <Suspense fallback={<ViewLoader />}><OnboardingForm onLogout={handleLogout} isRejected={accountStatus === 'rejected'} adminNote={(user as any)?.adminNote || ''} /></Suspense>;
    }
    if (user && ['pending','pending_profile_approval','pending_account_approval','needs_data_linkage','pending_data_approval'].includes(accountStatus as string) && currentView !== ViewState.LOGIN && currentView !== ViewState.PROFILE) {
      return <Suspense fallback={<ViewLoader />}><WaitingGate onLogout={handleLogout} accountStatus={accountStatus as any} user={user} /></Suspense>;
    }

    if (currentState === 'initializing' && !isLoginPage) return <LoadingScreen log={initializationLog} />;
    if (currentState === 'self-healing' && !isLoginPage) return <SelfHealingScreen log={initializationLog} />;
    if (currentState === 'maintenance' && !isLoginPage) return <MaintenanceScreen error={globalError} onRetry={() => AppInitializationService.retryInitialization()} />;

    return (
      <MaintenanceGuard>
        <RealtimeSubscriptionTracker />
        <ProfileCompletionModal />
        <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden transition-colors duration-500">
          <div className="flex-1 w-full flex flex-col lg:flex-row relative overflow-hidden bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500">
            {!isLoginPage && !isStandaloneWorkspace && <GlobalSidebar currentView={currentView} onNavigate={handleNavigate} onClose={() => setIsSidebarOpen(false)} isCollapsed={isDesktopSidebarCollapsed} />}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
              <ImpersonationBanner />
              <div className="flex-1 overflow-hidden flex flex-col relative w-full">
                <EmergencyAlert userRole={userRole} />
                <Toaster position="top-center" expand richColors closeButton toastOptions={{ style: { zIndex: 99999 } }} />
                <Suspense fallback={<ViewLoader />}>
                  {currentView === ViewState.DASHBOARD && <FloatingActionMenu onNavigate={handleNavigate} />}
                  <ChatbotContainer /><AiAgentContainer /><ChatWindowContainer /><PushNotificationPrompt />
                </Suspense>
                <div className="flex-1 w-full relative flex flex-col overflow-y-auto">
                  <Suspense fallback={<ViewLoader />}>
                    <ViewRenderer key={viewKey} currentView={currentView} handleBack={handleBack} handleNavigate={handleNavigate} onOpenSidebar={() => setIsSidebarOpen(true)} handleLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} unreadNotifCount={unreadNotifCount} unreadChatCount={unreadChatCount} pendingLetterCount={pendingLetterCount} pendingApprovalCount={pendingApprovalCount} handleLoginSuccess={handleLoginSuccess} handleImpersonate={handleImpersonate} user={user as any} />
                  </Suspense>
                </div>
                {!isLoginPage && !isStandaloneWorkspace && <BottomNav currentView={currentView} onNavigate={handleNavigate} userRole={userRole} unreadNotifCount={unreadNotifCount} unreadChatCount={unreadChatCount} pendingLetterCount={pendingLetterCount} pendingApprovalCount={pendingApprovalCount} remainingSessionsCount={remainingSessionsCount} />}
              </div>
              {autoFixStatus.isFixing && <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in duration-500"><div className="bg-white dark:bg-[#151E32] p-8 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center"><div className="relative"><div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping scale-150"></div><div className="relative w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center"><ZapIcon className="w-8 h-8 text-white animate-pulse" /></div></div><h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">Self-Healing Protocol</h3></div></div>}
              {!isOnline && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] bg-orange-600/95 text-white text-[9px] font-bold px-6 py-2 rounded-2xl">bekerja offline - data tersimpan lokal</div>}
            </main>
          </div>
        </div>
      </MaintenanceGuard>
    );
  };

  return <QueryClientProvider client={queryClient}><ImpersonationProvider><ChatProvider>{renderContent()}</ChatProvider></ImpersonationProvider></QueryClientProvider>;
};

export default App;
