/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * © 2026 Akhmad Arifin | 199010042025211012. All rights reserved.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
import { ViewState, UserRole } from '@/types';
import type { TickerItem } from '@/types';
import { toast, Toaster } from 'sonner';
import {
  Loader2,
  ZapIcon,
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
} from '@/shared/Icons';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUserStore } from '@/stores/userStore';
import { normalizeRoleStr, logoutUser } from '@/services/authService';
import { setupOnMessageListener } from '@/services/notificationService';
import { subscribeToAnnouncements } from '@/services/realtime/announcementListener';
import { MOCK_TICKER } from '@/services/mockData';
import { resilientLazy } from '@/utils/resilientLazy';
import { MonitoringModule } from '@/app/boot/modules/MonitoringModule';
import { TenantContext } from '@/core/context/TenantContext';


// Lazy Loaded Components
const FloatingActionMenu = resilientLazy(() => import('@/components/ui/FloatingActionMenu'));
const ChatbotContainer = resilientLazy(() => import('@/features/ai/components/ChatbotContainer'));
const AiAgentContainer = resilientLazy(() => import('@/features/ai/components/AiAgentContainer'));
const ChatWindowContainer = resilientLazy(() => import('@/features/ai/components/ChatWindowContainer'));
const PushNotificationPrompt = resilientLazy(
  () => import('@/features/notifications/components/PushNotificationPrompt'),
);
const OnboardingForm = resilientLazy(() => import('@/features/auth/components/OnboardingForm'));
const WaitingGate = resilientLazy(() => import('@/features/auth/components/WaitingGate'));
const ReferenceIdEntryModal = resilientLazy(
  () => import('@/features/dashboard/components/ReferenceIdEntryModal'),
);

// Core Layout & Context Assemblies (Statically Imported)
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

const ViewRenderer = resilientLazy(() =>
  import('@/routes/ViewRenderer').then((m) => ({ default: m.ViewRenderer })),
);

import { ViewLoader } from '@/components/ui/ViewLoader';
import MaintenanceGuard from '@/components/ui/MaintenanceGuard';
import { useProfileStore } from '@/stores/profileStore';
import { useAppStore } from '@/stores/appStore';
import { useProfileValidation } from '@/hooks/useProfileValidation';
import { useStudentAttendance } from '@/hooks/useStudentAttendance';
import { useMemo } from 'react';
import {
  LoadingScreen,
  MaintenanceScreen,
  SelfHealingScreen,
} from '@/components/ui/SystemScreens';
import { AppInitializationService } from '@/services/AppInitializationService';

import { ImpersonationProvider, ImpersonationBanner } from '@/core/impersonation';

const RealtimeSubscriptionTracker: React.FC = () => {
  useRealtimeSubscriptions();
  return null;
};

const App: React.FC = () => {
  useEffect(() => {
    MonitoringModule();
  }, []);

  const { authLoading } = useAuthInitialization();
  const { isOnline } = useAppInitialization();
  const { currentState, initializationLog, globalError } = useAppStore();

  // 1. Store Declarations (Zustand & Context)
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

  const roles = useUserStore((state) => state.roles);
  const accountType = useUserStore((state) => state.accountType);
  const isUserLoaded = useUserStore((state) => state.isLoaded);
  const tenantId = useUserStore((state) => state.tenantId);
  const setUserData = useUserStore((state) => state.setUserData);
  const clearUserData = useUserStore((state) => state.clearUserData);
  const autoFixStatus = useUIStore((state) => state.autoFixStatus);

  const profile = useProfileStore((state) => state.profile);

  // 2. React State & Derived Configurations
  let securityContext: any = null;
  try {
    securityContext = TenantContext.getContext();
  } catch {
    securityContext = null;
  }

  // Canonical role/roles resolution from SecurityContext (SSOT)
  const activeRoles = securityContext?.roles?.length > 0 
    ? securityContext.roles 
    : [UserRole.TAMU];

  const userRole = securityContext?.role || activeRoles[0];
  
  const isLoginPage =
    currentView === ViewState.LOGIN ||
    currentView === ViewState.PUBLIC_SERVICES ||
    currentView === ViewState.SCANNER ||
    currentView === ViewState.NEWS;

  const isStandaloneWorkspace =
    currentView === ViewState.DEVELOPER ||
    currentView === ViewState.KANWIL_DASHBOARD ||
    currentView === ViewState.KANWIL_SATUAN_KERJA ||
    currentView === ViewState.DEV_ASSIGNMENTS ||
    currentView === ViewState.DEV_ROLES ||
    currentView === ViewState.DEV_PERMISSIONS ||
    currentView === ViewState.DEV_SYNC ||
    currentView === ViewState.DEV_AUDIT_LOG ||
    currentView === ViewState.DEV_SECURITY ||
    currentView === ViewState.DEV_SYSTEM_SETTINGS;

  const { isProfileComplete } = useProfileValidation(profile);

  // 3. Effects
  useEffect(() => {
    // console.log('[App] authLoading:', authLoading);
  }, [authLoading]);

  // Synchronize unauthenticated state to prevent Sidebar/Dashboard crashes
  useEffect(() => {
    // console.log('[App] authLoading:', authLoading, 'user:', user, 'isLoginPage:', isLoginPage);
    if (!authLoading && !user && !isLoginPage) {
      console.log(
        '[AuthGuard] No authenticated user found on a protected view. Redirecting to LOGIN.',
      );
      setCurrentView(ViewState.LOGIN);
      setNavigationHistory([]);
    }
  }, [authLoading, user, isLoginPage, setCurrentView, setNavigationHistory]);

  useEffect(() => {
    // Profil completion is now handled via floating banner in the dashboard for students.
    // Kept empty to respect floating banner logic requested by user.
  }, [user, profile, isProfileComplete, currentView]);

  useEffect(() => {
    eventBus.subscribe('PROFILE_COMPLETED', async (event) => {
      await IdentityEngine.provisionAccess(event.data.uid, event.data.userData);
    });
  }, []);

  useEffect(() => {
    // High-Integrity Theme Sync (Kernel Level)
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  useEffect(() => {
    initPointAuditListeners();
    initUserAuditListeners();
    initNotificationEventListeners();
  }, []);

  const [viewKey, setViewKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emam_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emam_sidebar_collapsed', String(isDesktopSidebarCollapsed));
    }
  }, [isDesktopSidebarCollapsed]);

  // Touch Swipe-to-Open & Swipe-to-Close Gesture Listener for Mobile Sidebar
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Verify horizontal swipe is dominant over vertical scrolling
        if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 60) {
          // Edge swipe right starting from left edge (<= 35px) opens sidebar
          if (touchStartX <= 35 && deltaX > 50 && !isSidebarOpen) {
            setIsSidebarOpen(true);
          }
          // Swipe left anywhere closes sidebar if open
          else if (deltaX < -60 && isSidebarOpen) {
            setIsSidebarOpen(false);
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSidebarOpen]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);

  const isStudentRole = userRole === UserRole.SISWA || userRole === UserRole.KETUA_KELAS;
  const { attendanceRecords: appStudentRecords } = useStudentAttendance(
    isStudentRole ? (user?.idUnik || user?.studentsId || undefined) : undefined
  );

  const remainingSessionsCount = useMemo(() => {
    if (!isStudentRole || !appStudentRecords || appStudentRecords.length === 0) return 0;
    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayRec = appStudentRecords.find((r: any) => r.date === todayStr);
    
    if (!todayRec) {
      const day = new Date().getDay();
      if (day === 0 || day === 6) return 0; // Weekend
      return 5;
    }

    let count = 0;
    const sessionsList = ['masuk', 'duha', 'zuhur', 'ashar', 'pulang'];
    for (const key of sessionsList) {
      const s = todayRec.sessions?.[key];
      if (!s || s.status === 'TS' || s.time === '--:--') {
        const isPrayer = ['duha', 'zuhur', 'ashar'].includes(key);
        if (isPrayer && todayRec.isHaid) {
          continue;
        }
        count++;
      }
    }
    return count;
  }, [isStudentRole, appStudentRecords]);

  const unreadNotifCount = useNotificationStore((state) => state.unreadCount);
  const unreadChatCount = useNotificationStore((state) => state.unreadChatCount);
  const pendingLetterCount = useNotificationStore((state) => state.pendingLetterCount);
  const pendingApprovalCount = useAuthStore((state) => state.pendingApprovalCount);

  // Fetch Ticker for Public View
  useEffect(() => {
    setTickerItems(MOCK_TICKER.filter((item: any) => item.isActive));
  }, []);

  const handleNavigate = (view: ViewState) => {
    if (view === currentView) return;

    const isDeveloper =
      securityContext?.isDeveloper ||
      activeRoles.includes(UserRole.DEVELOPER) ||
      user?.email === 'developer@example.com' ||
      user?.email === 'admin@example.com';
    const lockedFeatures = useUIStore.getState().lockedFeatures;

    if (!isDeveloper && lockedFeatures.includes(view)) {
      toast.error('Halaman ini sedang dalam perbaikan (Maintenance) dan tidak dapat diakses.');
      return;
    }

    React.startTransition(() => {
      if (currentView !== ViewState.LOGIN) {
        setNavigationHistory((prev) => [...prev, currentView]);
      }

      // Sync Developer Console Active Tab based on ViewState
      const devViewStateMap: Record<string, string> = {
        [ViewState.DEV_DASHBOARD]: 'manajemen_madrasah',
        [ViewState.DEV_INSTITUTIONS]: 'tenant_mgmt',
        [ViewState.DEV_WORK_UNITS]: 'tenant_mgmt',
        [ViewState.DEV_EDUCATION_LEVELS]: 'tenant_mgmt',
        [ViewState.DEV_MADRASAH]: 'manajemen_madrasah',
        [ViewState.DEV_USERS]: 'user_control',
        [ViewState.DEV_ASSIGNMENTS]: 'user_control',
        [ViewState.DEV_ROLES]: 'features',
        [ViewState.DEV_PERMISSIONS]: 'features',
        [ViewState.DEV_SYNC]: 'schema_engine',
        [ViewState.DEV_AUDIT_LOG]: 'audit_test',
        [ViewState.DEV_SECURITY]: 'firestore_gov',
        [ViewState.DEV_SYSTEM_SETTINGS]: 'master_version',
        [ViewState.DEVELOPER]: 'manajemen_madrasah',
      };

      if (devViewStateMap[view]) {
        useUIStore.getState().setDevConsoleActiveTab(devViewStateMap[view]);
      }

      setViewKey((prev) => prev + 1);
      setCurrentView(view);
      setIsSidebarOpen(false); // Close sidebar on navigate
    });
  };

  const handleRevertImpersonation = () => {
    toast.info('Gunakan Refresh untuk mengembalikan sesi asli.');
  };

  useEffect(() => {
    if (!user) return;

    const unsubForeground = setupOnMessageListener((payload: any) => {
      const title = payload.notification?.title || payload.data?.title || 'Notifikasi Baru';
      const body = payload.notification?.body || payload.data?.message;
      toast.message(title, {
        description: body,
        action: {
          label: 'BUKA',
          onClick: () => handleNavigate(ViewState.NOTIFICATIONS),
        },
        duration: 8000,
      });
    });

    const activeTenantId = securityContext?.tenantId || tenantId;
    if (!activeTenantId) return;
    const unsubAnnouncements = subscribeToAnnouncements(activeTenantId, handleNavigate, ViewState);

    return () => {
      unsubAnnouncements();
      if (unsubForeground) unsubForeground();
    };
  }, [user?.uid]);

  const handleBack = () => {
    React.startTransition(() => {
      if (navigationHistory.length > 0) {
        const historyCopy = [...navigationHistory];
        const previousView = historyCopy.pop()!;
        setNavigationHistory(historyCopy);
        setViewKey((prev) => prev + 1);
        setCurrentView(previousView);
      } else {
        if (currentView === ViewState.PUBLIC_SERVICES) {
          setCurrentView(ViewState.LOGIN);
          setNavigationHistory([]);
          setViewKey((prev) => prev + 1);
        } else if (currentView !== ViewState.DASHBOARD && currentView !== ViewState.GUEST_DASHBOARD) {
          const isGuest = activeRoles.includes(UserRole.TAMU) || userRole === UserRole.TAMU;
          setCurrentView(isGuest ? ViewState.GUEST_DASHBOARD : ViewState.DASHBOARD);
          setNavigationHistory([]);
          setViewKey((prev) => prev + 1);
        }
      }
    });
  };

  const handleLoginSuccess = (role: UserRole) => {
    const normalizedRole = normalizeRoleStr(role);

    if (lockList.includes('auth_login') && normalizedRole !== UserRole.DEVELOPER) {
      toast.error('Sistem Sedang Maintenance', {
        description: 'Hanya akun Developer yang dapat mengakses sistem saat ini.',
      });
      handleLogout();
      return;
    }

    React.startTransition(() => {
      (setUserData as any)({
        uid: user?.uid || 'logged-in',
        roles: [normalizedRole],
        displayName: user?.displayName || 'Pengguna',
        photoURL: user?.photoURL || null,
        tenantId: securityContext?.tenantId || tenantId || '30315537',
      });
      setNavigationHistory([]);
      
      // Redirect GUEST to GUEST_DASHBOARD
      if (normalizedRole === UserRole.TAMU) {
        handleNavigate(ViewState.GUEST_DASHBOARD);
      } else {
        handleNavigate(ViewState.DASHBOARD);
      }
    });
  };

  const handleImpersonate = (role: UserRole, name: string, sid?: string) => {
    (setUserData as any)({
      roles: [role],
      displayName: name,
      assignment: { studentId: sid || null, teacherId: null, classId: null },
    });
    toast.success(`Impersonasi sebagai ${role} (${name}) aktif.`);
  };

  const handleLogout = async () => {
    try {
      const { realtimeHub } = await import('@/services/realtime/realtimeHub');
      realtimeHub.unsubscribeAll();
    } catch (e) {
      console.warn('Failed to clear realtime hub subscriptions:', e);
    }
    
    try {
      await logoutUser();
    } catch (error) {
      console.warn('Silent signout failure during cleanup:', error);
    }

    React.startTransition(() => {
      clearUserData();
      setUser(null);
      setAccountStatus(null);
      setNavigationHistory([]);
      setCurrentView(ViewState.LOGIN);
    });
  };
  if (authLoading) {
    return (
      <div className="fixed inset-0 h-screen w-full flex flex-col items-center justify-center bg-[#020617] z-[1000] overflow-hidden">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    if (user && currentView !== ViewState.LOGIN) {
      const canonicalValidation = IdentityCompletionService.validate(user);
      if (!canonicalValidation.valid) {
        return (
          <Suspense
            fallback={
              <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
                <ViewLoader />
              </div>
            }
          >
            <IdentityCompletionPage
              user={user}
              onCompleted={(updatedUser) => {
                setUser(updatedUser);
                handleNavigate(ViewState.DASHBOARD);
              }}
            />
          </Suspense>
        );
      }
    }

    if (user && accountStatus === 'needs_id_verification' && currentView !== ViewState.LOGIN) {
      return (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
              <ViewLoader />
            </div>
          }
        >
          <ReferenceIdEntryModal isOpen={true} onLogout={handleLogout} />
        </Suspense>
      );
    }

    if (
      user &&
      (accountStatus === 'needs_profile_completion' || accountStatus === 'rejected') &&
      currentView !== ViewState.LOGIN
    ) {
      const adminNote = (user as any)?.adminNote || '';
      return (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
              <ViewLoader />
            </div>
          }
        >
          <OnboardingForm
            onLogout={handleLogout}
            isRejected={accountStatus === 'rejected'}
            adminNote={adminNote}
          />
        </Suspense>
      );
    }

    if (
      user &&
      (accountStatus === 'pending' ||
        accountStatus === 'pending_profile_approval' ||
        accountStatus === 'pending_account_approval' ||
        accountStatus === 'needs_data_linkage' ||
        accountStatus === 'pending_data_approval') &&
      currentView !== ViewState.LOGIN &&
      currentView !== ViewState.PROFILE
    ) {
      return (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
              <ViewLoader />
            </div>
          }
        >
          <WaitingGate onLogout={handleLogout} accountStatus={accountStatus as any} user={user} />
        </Suspense>
      );
    }

    if (currentState === 'initializing') {
      return <LoadingScreen log={initializationLog} />;
    }
    if (currentState === 'self-healing') {
      return <SelfHealingScreen log={initializationLog} />;
    }
    if (currentState === 'maintenance') {
      return (
        <MaintenanceScreen
          error={globalError}
          onRetry={() => AppInitializationService.retryInitialization()}
        />
      );
    }

    return (
      <MaintenanceGuard>
        <RealtimeSubscriptionTracker />
        <ProfileCompletionModal />
        <div
          className={`h-[100dvh] w-full flex flex-col relative overflow-hidden transition-colors duration-500`}
        >
              <div className="flex-1 w-full flex flex-col lg:flex-row relative overflow-hidden bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500">
                {!isLoginPage && !isStandaloneWorkspace && (
                  <>
                    {/* Desktop Sidebar (Left) */}
                    <motion.aside
                      layout
                      initial={false}
                      animate={{ width: isDesktopSidebarCollapsed ? 64 : 280 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="hidden lg:flex flex-col h-full max-h-full min-h-0 shrink-0 border-r border-slate-100 dark:border-slate-800/50 shadow-sm z-30 relative overflow-hidden"
                      id="app-desktop-sidebar"
                    >
                      <button
                        onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
                        className="absolute -right-3.5 top-4 z-40 hidden lg:flex items-center justify-center w-7 h-7 bg-white dark:bg-slate-800 hover:bg-indigo-600 text-slate-500 dark:text-slate-400 hover:text-white border border-slate-200 dark:border-slate-700 rounded-full shadow-md transition-all duration-200 cursor-pointer focus:outline-none hover:scale-110"
                        title={isDesktopSidebarCollapsed ? 'Buka Sidebar' : 'Ciutkan Sidebar'}
                        aria-label={isDesktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        id="app-desktop-sidebar-toggle-btn"
                      >
                        {isDesktopSidebarCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronLeft className="w-4 h-4" />
                        )}
                      </button>
                      <GlobalSidebar
                        currentView={currentView}
                        onNavigate={handleNavigate}
                        onClose={undefined}
                        isCollapsed={isDesktopSidebarCollapsed}
                      />
                    </motion.aside>

                    {/* Mobile Sidebar Overlay with Swipe-to-Close Gesture */}
                    <AnimatePresence>
                      {isSidebarOpen && (
                        <>
                          <motion.aside
                            key="mobileSidebarDrawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            drag="x"
                            dragConstraints={{ left: -320, right: 0 }}
                            dragElastic={{ left: 0.1, right: 0 }}
                            onDragEnd={(_e, info) => {
                              if (info.offset.x < -60 || info.velocity.x < -250) {
                                setIsSidebarOpen(false);
                              }
                            }}
                            className="fixed inset-0 z-50 lg:hidden w-[85%] max-w-[320px] shadow-2xl h-full border-r border-slate-100 dark:border-slate-800 touch-pan-y"
                          >
                            <GlobalSidebar
                              currentView={currentView}
                              onNavigate={handleNavigate}
                              onClose={() => setIsSidebarOpen(false)}
                            />
                          </motion.aside>

                          {/* Mobile Sidebar Backdrop with Click / Tap Dismiss */}
                          <motion.div
                            key="mobileSidebarBackdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                          />
                        </>
                      )}
                    </AnimatePresence>
                  </>
                )}

                <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                  <ImpersonationBanner />
                  <div className="flex-1 overflow-hidden flex flex-col relative w-full">
                    
                    <EmergencyAlert userRole={userRole} />
                    <Toaster
                      position="top-center"
                      expand={true}
                      richColors
                      closeButton
                      toastOptions={{
                        style: { zIndex: 99999 },
                      }}
                    />

                    <Suspense fallback={<ViewLoader />}>
                      {currentView === ViewState.DASHBOARD && (
                        <FloatingActionMenu onNavigate={handleNavigate} />
                      )}
                      <ChatbotContainer />
                      <AiAgentContainer />
                      <ChatWindowContainer />
                      <PushNotificationPrompt />
                    </Suspense>

                    <div className="flex-1 w-full relative flex flex-col overflow-y-auto">
                      <Suspense fallback={<ViewLoader />}>
                        
                          <ViewRenderer
                            key={viewKey}
                            currentView={currentView}
                            handleBack={handleBack}
                            handleNavigate={handleNavigate}
                            onOpenSidebar={() => setIsSidebarOpen(true)}
                            handleLogout={handleLogout}
                            isDarkMode={isDarkMode}
                            toggleTheme={toggleTheme}
                            unreadNotifCount={unreadNotifCount}
                            unreadChatCount={unreadChatCount}
                            pendingLetterCount={pendingLetterCount}
                            pendingApprovalCount={pendingApprovalCount}
                            handleLoginSuccess={handleLoginSuccess}
                            handleImpersonate={handleImpersonate}
                            user={user as any}
                          />
                        
                      </Suspense>
                    </div>

                    {!isLoginPage && !isStandaloneWorkspace && (
                      <BottomNav
                        currentView={currentView}
                        onNavigate={handleNavigate}
                        userRole={userRole}
                        unreadNotifCount={unreadNotifCount}
                        unreadChatCount={unreadChatCount}
                        pendingLetterCount={pendingLetterCount}
                        pendingApprovalCount={pendingApprovalCount}
                        remainingSessionsCount={remainingSessionsCount}
                      />
                    )}
                  </div>

                  {/* --- AUTO-FIX OVERLAY --- */}
                  {autoFixStatus.isFixing && (
                    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in duration-500">
                      <div className="bg-white dark:bg-[#151E32] p-8 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping scale-150"></div>
                          <div className="relative w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                            <ZapIcon className="w-8 h-8 text-white animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide leading-none">
                            Self-Healing Protocol
                          </h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
                            Sistem mendeteksi inkonsistensi pada{' '}
                            <span className="text-indigo-500">{autoFixStatus.message}</span>.
                            Memulihkan integritas data harian...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isOnline && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] bg-orange-600/95 backdrop-blur-md text-white text-[9px] font-bold lowercase tracking-wide px-6 py-2 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-500 ring-4 ring-orange-500/20">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      bekerja offline - data tersimpan lokal
                    </div>
                  )}
                </main>
              </div>
            </div>
      </MaintenanceGuard>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ImpersonationProvider>
        <ChatProvider>
          {renderContent()}
        </ChatProvider>
      </ImpersonationProvider>
    </QueryClientProvider>
  );
};


export default App;
