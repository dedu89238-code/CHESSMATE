import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, Sparkles, AlertCircle, RefreshCw, ChevronRight, WifiOff } from 'lucide-react';
import { ChatMessage, ChessmateGameContext } from '../types/chessmate';
import { generateLocalChessmateReply, isChessRelated } from '../utils/chessmateLocal';

interface ChessmatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameContext: ChessmateGameContext;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClearChat: () => void;
}

const QUICK_PROMPTS = [
  'Was my last move good?',
  'What is attacking my king?',
  'What should I watch out for?',
  'How does en passant work?',
];

export const ChessmatePanel: React.FC<ChessmatePanelProps> = ({
  isOpen,
  onClose,
  gameContext,
  messages,
  onSendMessage,
  isLoading,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Monitor network connectivity for graceful offline feedback
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    onSendMessage(text);
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  return (
    <div
      id="chessmate-panel-container"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] max-w-full bg-stone-950/95 border-l border-stone-800 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-250"
    >
      {/* Premium Header */}
      <div className="p-4 border-b border-stone-800/80 bg-stone-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <span className="text-lg select-none">♟️</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-stone-100 tracking-wide">
                CHESSMATE
              </h2>
              {isOnline ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1" title="Internet required for full AI companion">
                  <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                  Offline
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 font-medium">
              Your chess companion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="chessmate-clear-btn"
            onClick={onClearChat}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition text-xs"
            title="Clear Chat History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            id="chessmate-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
            title="Close CHESSMATE"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Offline Advisory Notice */}
      {!isOnline && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-200 flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Internet connection is required for CHESSMATE online companion. Offline chess against CAISSA remains 100% active.</span>
        </div>
      )}

      {/* Role Reminder Banner */}
      <div className="px-4 py-2 bg-stone-900/40 border-b border-stone-800/60 text-[11px] text-stone-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 font-semibold">CAISSA:</span>
          <span>Opponent</span>
          <span className="text-stone-600 mx-1">|</span>
          <span className="text-emerald-400 font-semibold">CHESSMATE:</span>
          <span>Companion</span>
        </div>
        <span className="font-mono text-stone-500 text-[10px]">Chess Only ♟️</span>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 bg-stone-950/40 border-b border-stone-800/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickPrompt(prompt)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-amber-500/15 text-stone-300 hover:text-amber-300 border border-stone-800 hover:border-amber-500/40 transition whitespace-nowrap active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1"
          >
            <span>{prompt}</span>
            <ChevronRight className="w-3 h-3 text-stone-500" />
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isAuto = msg.isAutoComment;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
            >
              <div className="flex items-start gap-2 max-w-[92%]">
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 text-xs mt-0.5">
                    ♟️
                  </div>
                )}

                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-xs shadow-md shadow-amber-500/10'
                      : isAuto
                      ? 'bg-stone-900 border border-amber-500/40 text-stone-200 rounded-tl-xs shadow-sm'
                      : msg.text.startsWith('CHESSMATE was unable') || msg.text.startsWith('CHESSMATE is unavailable')
                      ? 'bg-red-950/40 border border-red-800/50 text-red-200 rounded-tl-xs shadow-sm'
                      : 'bg-stone-900/90 border border-stone-800 text-stone-200 rounded-tl-xs shadow-sm'
                  }`}
                >
                  {isAuto && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400 font-bold mb-1 uppercase">
                      <Sparkles className="w-2.5 h-2.5" />
                      Game Insight
                    </div>
                  )}

                  <div className="whitespace-pre-wrap break-words select-text">{msg.text}</div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0 text-stone-300 text-xs mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <span className="text-[10px] text-stone-500 mt-1 px-9 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2 max-w-[90%] animate-in fade-in">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 text-xs mt-0.5">
              ♟️
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-xs bg-stone-900 border border-stone-800 text-stone-400 text-xs flex items-center gap-2">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>CHESSMATE is evaluating...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-stone-900/80 border-t border-stone-800/80 flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          id="chessmate-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask CHESSMATE about chess, tactics, your moves..."
          className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40 transition"
          disabled={isLoading}
        />

        <button
          id="chessmate-send-btn"
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-stone-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          title="Send to CHESSMATE"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
