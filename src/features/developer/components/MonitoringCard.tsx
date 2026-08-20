import React, { useState } from 'react';

interface MonitoringCardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'teal' | 'violet';
  cardNumber?: string;
  backContent?: React.ReactNode;
  onClick?: () => void;
  isLive?: boolean;
}

const MonitoringCard: React.FC<MonitoringCardProps> = ({
  title,
  value,
  sub,
  icon: Icon,
  color,
  cardNumber = '•••• •••• •••• ••••',
  backContent,
  onClick,
  isLive,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const colorConfig = {
    indigo: 'from-indigo-900 via-[#0f142b] to-slate-900 border-indigo-500/20 text-indigo-200',
    emerald: 'from-emerald-900 via-[#061712] to-slate-900 border-emerald-500/20 text-emerald-200',
    amber: 'from-amber-900 via-[#1a1408] to-slate-900 border-amber-500/20 text-amber-200',
    rose: 'from-rose-900 via-[#1a080c] to-slate-900 border-rose-500/20 text-rose-200',
    teal: 'from-teal-900 via-[#0a1a17] to-slate-900 border-teal-500/20 text-teal-200',
    violet: 'from-violet-900 via-[#150a24] to-slate-900 border-violet-500/20 text-violet-200',
  };

  return (
    <div className="w-[340px] shrink-0 snap-start h-[215px]">
      <div
        style={{ perspective: '1200px' }}
        className="relative w-full h-full cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
          className="relative w-full h-full"
        >
          {/* FRONT FACE */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className={`absolute inset-0 rounded-[24px] p-5 text-white shadow-2xl flex flex-col justify-between bg-gradient-to-br ${colorConfig[color]} border border-white/5 overflow-hidden`}
          >
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors"></div>

            {/* Live Indicator */}
            {isLive && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute"></div>
                <span className="text-[7px] font-bold text-emerald-400 uppercase tracking-wide bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
            )}

            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex flex-col">
                <span
                  className={`text-[9px] font-bold uppercase tracking-[0.2em] opacity-70 mb-1`}
                >
                  Monitoring System
                </span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
              </div>
              <div className={`p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="flex justify-start w-full relative z-10">
              <div>
                <span className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                  {value}
                </span>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wide mt-1">
                  {sub}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center relative z-10">
              <span className="text-sm font-mono tracking-[0.2em] text-white/60">{cardNumber}</span>
              <div className="flex -space-x-1">
                <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm"></div>
                <div className="w-5 h-5 rounded-full bg-white/20 border border-white/20 backdrop-blur-sm"></div>
              </div>
            </div>
          </div>

          {/* BACK FACE */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 rounded-[24px] bg-gradient-to-bl from-slate-900 to-[#0B0F1A] border border-white/10 overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="w-full h-10 bg-black/40 mt-4 shadow-inner shrink-0"></div>
            <div className="flex-1 px-5 py-4 flex flex-col justify-center relative">
              {backContent ? (
                backContent
              ) : (
                <div className="text-center space-y-3">
                  {onClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                      }}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[9px] uppercase font-bold tracking-wide rounded-xl transition-all active:scale-95"
                    >
                      Buka Detail Modul
                    </button>
                  )}
                </div>
              )}
              <div className="mt-auto pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wide">
                  e-Mam System Enterprise Card
                </span>
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringCard;
