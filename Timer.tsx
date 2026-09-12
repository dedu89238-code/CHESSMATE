import React from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  seconds: number;
  isActive: boolean;
  isUnlimited: boolean;
  label: string;
}

export const Timer: React.FC<TimerProps> = React.memo(({ seconds, isActive, isUnlimited, label }) => {
  const isLowTime = !isUnlimited && seconds <= 30;

  const formatTime = (totalSeconds: number) => {
    if (isUnlimited) return '∞ Casual';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-200 border ${
        isActive
          ? 'bg-slate-900 border-amber-500 shadow-md ring-2 ring-amber-500/20 text-white'
          : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
      } ${isLowTime && isActive ? '!bg-red-950/80 !border-red-500 !text-red-200 animate-pulse' : ''}`}
    >
      <Clock
        className={`w-4 h-4 ${
          isActive ? (isLowTime ? 'text-red-400' : 'text-amber-400') : 'text-slate-400'
        }`}
      />
      <div className="flex flex-col">
        <span className="text-[10px] font-medium tracking-wide uppercase text-slate-400 leading-none">
          {label}
        </span>
        <span className="text-base font-mono font-bold tracking-tight">
          {formatTime(seconds)}
        </span>
      </div>
    </div>
  );
});
