import React from 'react';
import { ArrowLeftIcon, Bars3Icon } from '@/shared/Icons';

interface LayoutProps {
  title: string | React.ReactNode;
  subtitle?: any;
  icon?: React.ComponentType<{ className?: string }>;
  onBack?: () => void;
  onOpenSidebar?: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  withBottomNav?: boolean;
  hideHeader?: boolean;
  customHeader?: React.ReactNode;
  contentClassName?: string;
  onNavigate?: (...args: any[]) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  title,
  subtitle,
  icon: Icon,
  onBack,
  onOpenSidebar,
  children,
  actions,
  hideHeader,
  customHeader,
  contentClassName,
}) => {
  if (hideHeader) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <main className={`flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 ${contentClassName || ''}`} id="layout-main-content">
          {children}
        </main>
      </div>
    );
  }

  if (customHeader) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {customHeader}
        <main className={`flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 ${contentClassName || ''}`} id="layout-main-content">
          {children}
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
              aria-label="Back"
              id="layout-back-btn"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          )}

          {/* Icon */}
          {Icon && (
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Icon className="w-5 h-5" />
            </div>
          )}

          {/* Title & Subtitle */}
          {(title || subtitle) ? (
            <div>
              {title ? (
                <h1 className="text-lg font-semibold tracking-tight text-slate-900" id="layout-title">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="text-xs font-medium text-slate-500" id="layout-subtitle">
                  {subtitle}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Actions & Sidebar Toggle Button for mobile/responsive */}
        <div className="flex items-center space-x-2">
          {actions && <div className="flex items-center space-x-2" id="layout-actions">{actions}</div>}
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg md:hidden transition-all"
              aria-label="Open menu"
              id="layout-menu-btn"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8" id="layout-main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
