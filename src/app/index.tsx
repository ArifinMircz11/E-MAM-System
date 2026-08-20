/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin (Lead Developer & System Architect)
 * NIP: 19901004 202521 1012
 * Role: Fullstack & UI/UX Engineer
 */

import { env } from '../core/config/env';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';

// Register Service Worker in production
if (typeof window !== 'undefined' && !env.IS_DEV && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] New content available, please refresh.');
    },
    onOfflineReady() {
      console.log('[PWA] Application is ready to work offline.');
    },
  });
}

// Global Guard for Dev Environment Noise (Vite HMR & WebSocket rejections)
const isChunkLoadError = (err: any) => {
  const msg = String(err?.message || err || '');
  const stack = String(err?.stack || '');
  return (
    msg.includes('Importing a module script failed') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes("Cannot read properties of null (reading 'useState')") ||
    msg.includes("Cannot read properties of null (reading 'use") ||
    msg.includes('Invalid hook call') ||
    stack.includes('Importing a module script failed') ||
    stack.includes('Failed to fetch dynamically imported module')
  );
};

const handleChunkError = () => {
  if (typeof window === 'undefined') return;
  const lastReload = sessionStorage.getItem('chunk_error_reload_time');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem('chunk_error_reload_time', String(now));
    console.warn('[Chunk Guard] Dynamic import failed. Refreshing page to load latest chunks...');
    window.location.reload();
  }
};

if (typeof window !== 'undefined') {
  // Auto-unregister Service Workers in Development to prevent cache interception errors (e.g. net::ERR_CONNECTION_REFUSED)
  if (env.IS_DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      let unregisteredAny = false;
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            unregisteredAny = true;
            console.log(
              '[Dev SW Guard] Unregistered stale Service Worker to prevent cache pollution.',
            );
          }
        });
      }
      if (unregisteredAny) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    });
  }

  const isViteError = (err: any) => {
    const msg = String(err?.message || err || '');
    return msg.includes('WebSocket') || msg.includes('vite') || msg.includes('hmr');
  };

  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
    if (isViteError(event.reason)) {
      return;
    }
    if (isChunkLoadError(event.reason)) {
      handleChunkError();
      return;
    }

    const reasonMsg =
      event.reason instanceof Error
        ? event.reason.stack || event.reason.message
        : typeof event.reason === 'object' && event.reason !== null
        ? (event.reason.message || JSON.stringify(event.reason))
        : String(event.reason || 'Unknown Rejection');

    console.warn('[Unhandled Rejection Caught]:', reasonMsg);
  });

  window.addEventListener('error', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
    const err = event.error || event.message;
    if (isViteError(err)) {
      return;
    }
    if (isChunkLoadError(err)) {
      handleChunkError();
      return;
    }

    const errMsg =
      event.error instanceof Error
        ? event.error.stack || event.error.message
        : typeof event.error === 'object' && event.error !== null
        ? (event.error.message || JSON.stringify(event.error))
        : String(err || 'Unknown Global Error');

    console.warn('[Global Error Caught]:', errMsg);
  });

  // Suppress specific Vite logs in console
  const suppressPatterns = [
    '[vite] failed to connect',
    'WebSocket connection to',
    'WebSocket closed',
  ];

  const wrapConsole = (method: 'error' | 'warn' | 'log') => {
    const original = console[method];
    console[method] = (...args: any[]) => {
      const logMsg = String(args[0] || '');
      if (suppressPatterns.some((p) => logMsg.includes(p))) return;

      const safeArgs = args.map((arg) => {
        if (arg instanceof Error) {
          return arg.stack || arg.message;
        }
        if (typeof arg === 'object' && arg !== null) {
          // Check if it is an error-like object with code/message/stack
          const isErrLike = 'message' in arg || 'code' in arg || 'stack' in arg;
          if (isErrLike) {
            const errName = arg.name || arg.constructor?.name || 'CapturedError';
            const codeStr = arg.code ? ` (Code: ${arg.code})` : '';
            const stackStr = arg.stack ? `\nStack: ${arg.stack}` : '';
            return `[Captured Object Error] ${errName}: ${arg.message || 'unknown message'}${codeStr}${stackStr}`;
          }

          try {
            // For warning and error, serialize the entire object to ensure it does not display as [object Object]
            if (method === 'error' || method === 'warn') {
              return JSON.stringify(arg, null, 2);
            }
            // For standard console.log, try serializing to ensure no circular structures, but return the object itself
            JSON.stringify(arg);
            return arg;
          } catch (e) {
            try {
              // Try to safely stringify if possible, or fallback
              if (arg.constructor && arg.constructor.name) {
                return `[Circular or Complex: ${arg.constructor.name}] Keys: ${Object.keys(arg).join(', ')}`;
              }
            } catch (e2) {}
            return '[Circular or Complex Object]';
          }
        }
        return arg;
      });

      original.apply(console, safeArgs);
    };
  };

  wrapConsole('error');
  wrapConsole('warn');
  wrapConsole('log');

  // Security Deterrents for Production
  if (env.IS_PROD) {
    console.log('[CoreSystem]: Production Security Active (Optimized for Preview).');
  }
}

// -------------------------------------------------------------
// Root Error Boundary for High Integrity Error Recovery
// -------------------------------------------------------------
interface RootErrorBoundaryProps {
  children: React.ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
  error: any;
  copied: boolean;
}

class RootErrorBoundary extends React.Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, copied: false };
  }

  static getDerivedStateFromError(error: any): RootErrorBoundaryState {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error(
            typeof error === 'object' && error !== null
              ? (error.message || JSON.stringify(error))
              : String(error || 'Unknown Error')
          );
    return { hasError: true, error: normalizedError, copied: false };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error(
            typeof error === 'object' && error !== null
              ? (error.message || JSON.stringify(error))
              : String(error || 'Unknown Error')
          );
    console.error('[Diagnostic] Core App crash triggered:', normalizedError, errorInfo);
    if (isChunkLoadError(normalizedError)) {
      handleChunkError();
    }
  }

  handleCopyLog = () => {
    if (this.state.error) {
      let log = '';
      if (this.state.error instanceof Error) {
        log = `Error: ${this.state.error.message}\nStack: ${this.state.error.stack}`;
      } else if (typeof this.state.error === 'object') {
        log = `Captured Raw Error Object:\n${JSON.stringify(this.state.error, null, 2)}`;
      } else {
        log = `Captured Error: ${String(this.state.error)}`;
      }
      navigator.clipboard.writeText(log).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 3000);
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const isBoundaryError = this.state.error instanceof ArchitectureBoundaryError;
      const title = isBoundaryError ? `Pelanggaran Boundary: ${this.state.error.boundary.toUpperCase()}` : 'Integritas Sistem Terputus';
      const subtitle = isBoundaryError ? this.state.error.toSafeUserMessage() : 'Aplikasi mengalami kesalahan fatal saat memuat modul.';

      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#020617] font-sans text-slate-100 p-6 selection:bg-indigo-500/30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-lg w-full flex flex-col items-center bg-slate-900/40 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-2xl">
            {/* Warning Icon with pulse effect */}
            <div className="relative w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-rose-500 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.1}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-[11px] font-bold text-rose-400 uppercase tracking-[0.3em] leading-none mb-1 text-center">
              {title}
            </h2>
            <p className="text-[9px] font-medium text-slate-400 text-center tracking-[0.05em] mb-6 px-4">
              {subtitle}
            </p>

            {/* Terminal View for the trace */}
            <div className="w-full bg-[#010409]/90 rounded-2xl p-4 border border-white/5 font-mono text-[9px] text-zinc-400 overflow-auto max-h-48 text-left mb-6 whitespace-pre-wrap leading-relaxed select-all">
              {this.state.error instanceof Error
                ? this.state.error.stack || this.state.error.message
                : typeof this.state.error === 'object' && this.state.error !== null
                ? JSON.stringify(this.state.error, null, 2)
                : String(this.state.error || 'Tertangkap eksepsi inisialisasi yang tidak diketahui.')}
            </div>

            <div className="flex gap-4 w-full">
              <button
                onClick={this.handleCopyLog}
                className="flex-1 py-3.5 bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-300 text-[9px] uppercase font-bold tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98]"
              >
                {this.state.copied ? 'Tersalin!' : 'Salin Log'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] uppercase font-bold tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = createRoot(rootElement);
root.render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
);

// Remove initial loader with fade out
if (typeof window !== 'undefined') {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        loader.remove();
      }, 500);
    }, 500);
  }
}
