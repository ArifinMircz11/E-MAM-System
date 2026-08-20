import React from 'react';
import { useImpersonation } from './useImpersonation';
import { UserCheck, ArrowLeftRight, ShieldAlert, Sparkles } from 'lucide-react';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, session, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !session) {
    return null;
  }

  const targetUser = session.targetUserSnapshot || {};
  const devUser = session.originalUserSnapshot || {};

  const roleLabel = (targetUser.role || 'PENGGUNA').toUpperCase();
  const targetName = targetUser.name || targetUser.displayName || 'Pengguna Terdaftar';
  const orgName = targetUser.organizationName || targetUser.tenantId || 'Madrasah / Organisasi';
  const devName = devUser.name || devUser.email || 'Developer Staff';

  return (
    <div className="sticky top-0 z-[9999] bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-2xl border-b border-amber-400/40 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-semibold">
        
        {/* Left Side: Information */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md flex-shrink-0 animate-pulse">
            <UserCheck className="w-5 h-5 text-amber-200" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-amber-400/30">
                Mode Impersonasi Aktif
              </span>
              <span className="text-[10px] text-amber-100 font-medium hidden sm:inline">
                ANDA SEDANG MASUK SEBAGAI
              </span>
            </div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 flex-wrap">
              <span className="text-amber-200 uppercase font-bold text-xs">[{roleLabel}]</span>
              <span>{targetName}</span>
              <span className="text-amber-300 font-normal text-xs">({orgName})</span>
            </div>
          </div>
        </div>

        {/* Right Side: Developer Info & Action Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-amber-500/40 pt-2 md:pt-0">
          <div className="text-[10px] text-amber-100/90 text-right font-mono">
            Developer: <span className="font-bold text-white uppercase">{devName}</span>
          </div>

          <button
            onClick={stopImpersonation}
            className="flex items-center gap-2 bg-white text-amber-900 hover:bg-amber-50 px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wide shadow-md transition-all active:scale-95 cursor-pointer border border-white/50"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-700" />
            <span>Kembali sebagai Developer</span>
          </button>
        </div>

      </div>
    </div>
  );
};
