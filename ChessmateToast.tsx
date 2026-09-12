import React, { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface ChessmateToastProps {
  message: string | null;
  onDismiss: () => void;
  onOpenPanel: () => void;
}

export const ChessmateToast: React.FC<ChessmateToastProps> = ({
  message,
  onDismiss,
  onOpenPanel,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      id="chessmate-toast"
      className="fixed bottom-6 right-6 z-40 max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto shadow-2xl"
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-stone-900/95 border border-amber-500/40 text-stone-100 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <button
          onClick={onOpenPanel}
          className="flex items-center gap-2.5 text-left cursor-pointer group"
          title="Click to view CHESSMATE"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition">
            <span className="text-sm select-none">♟️</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1">
              CHESSMATE
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            </span>
            <span className="text-xs font-medium text-stone-200 group-hover:text-stone-100 transition">
              {message}
            </span>
          </div>
        </button>

        <button
          onClick={onDismiss}
          className="p-1 text-stone-500 hover:text-stone-300 rounded-lg transition ml-1 cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
