import React from 'react';
import { Play, Users, Bot, BarChart3, Sliders, ArrowLeft, Trophy, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { PlayerStats } from '../types/stats';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeScreenProps {
  onStartVsCaissa: () => void;
  onStartWithFriend: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  stats: PlayerStats;
  currentScreen: 'home' | 'mode_select';
  setCurrentScreen: (screen: 'home' | 'mode_select') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartVsCaissa,
  onStartWithFriend,
  onOpenStats,
  onOpenSettings,
  stats,
  currentScreen,
  setCurrentScreen,
}) => {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  return (
    <div
      id="chessmate-home-screen"
      className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-925 to-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 relative overflow-hidden"
    >
      {/* Subtle luxury ambient chess atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-25">
        <div className="w-[600px] h-[600px] rounded-full bg-radial from-amber-500/10 via-amber-700/5 to-transparent blur-3xl animate-pulse" />
      </div>

      {/* Top Navigation & Status Bar */}
      <header className="w-full border-b border-stone-800/80 bg-stone-900/80 backdrop-blur-md px-4 sm:px-6 py-3.5 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/25">
              <span className="text-lg select-none">♟</span>
            </div>
            <div>
              <span className="text-base font-serif font-black tracking-wider text-stone-100 uppercase">
                CHESSMATE
              </span>
              <span className="hidden sm:inline-block ml-2.5 text-[10px] uppercase font-sans font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
                Grandmaster Edition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton variant="compact" />
            <button
              id="home-header-stats-btn"
              onClick={onOpenStats}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">Statistics</span>
            </button>
            <button
              id="home-header-settings-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 z-10 w-full max-w-5xl mx-auto">
        {currentScreen === 'home' ? (
          /* ================= SCREEN 1: HOMEPAGE ================= */
          <div className="w-full max-w-md flex flex-col items-center text-center animate-in fade-in duration-300">
            {/* Elegant Crest / Brand Logo */}
            <div className="relative mb-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 border border-amber-500/30 p-1 shadow-2xl shadow-amber-500/10 flex items-center justify-center">
                <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-amber-400/20 via-transparent to-amber-600/10 border border-amber-400/30 flex items-center justify-center relative">
                  <span className="text-5xl sm:text-6xl filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)] select-none">
                    ♚
                  </span>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shadow-md">
                    ♟
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <h1
              id="home-title"
              className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold tracking-tight text-stone-100 mb-2.5"
            >
              CHESSMATE
            </h1>
            <p className="text-sm sm:text-base text-stone-400 max-w-sm mb-8 leading-relaxed">
              The premier chess experience. Challenge the neural arbiter <span className="text-amber-400 font-semibold">CAISSA</span> or duel a friend on the same device.
            </p>

            {/* Action Buttons Section */}
            <div className="w-full space-y-3.5">
              {/* PRIMARY DOMINANT BUTTON: START THE GAME */}
              <button
                id="home-start-game-btn"
                onClick={() => setCurrentScreen('mode_select')}
                className="w-full group relative overflow-hidden py-4 sm:py-4.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-base sm:text-lg tracking-wide uppercase shadow-[0_12px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_16px_36px_rgba(245,158,11,0.5)] transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 border border-amber-300/40"
              >
                <Play className="w-5 h-5 fill-stone-950 stroke-stone-950 transition-transform group-hover:scale-110" />
                <span>START THE GAME</span>
              </button>

              {/* SECONDARY ACTION 1: STATISTICS */}
              <button
                id="home-statistics-btn"
                onClick={onOpenStats}
                className="w-full py-3.5 px-6 rounded-2xl bg-stone-900/90 hover:bg-stone-850 text-stone-200 hover:text-white font-bold text-sm sm:text-base tracking-wide border border-stone-800/90 hover:border-amber-500/40 shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2.5"
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>STATISTICS</span>
              </button>

              {/* SECONDARY ACTION 2: SETTINGS */}
              <button
                id="home-settings-btn"
                onClick={onOpenSettings}
                className="w-full py-3.5 px-6 rounded-2xl bg-stone-900/90 hover:bg-stone-850 text-stone-200 hover:text-white font-bold text-sm sm:text-base tracking-wide border border-stone-800/90 hover:border-amber-500/40 shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2.5"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>SETTINGS</span>
              </button>
            </div>

            {/* Quick Player Career Ribbon */}
            <div className="mt-8 w-full py-3 px-4 rounded-2xl bg-stone-900/60 border border-stone-800/70 flex items-center justify-around text-xs text-stone-400">
              <div className="flex flex-col items-center">
                <span className="text-stone-500 text-[10px] uppercase font-bold tracking-wider">Games</span>
                <span className="font-mono font-bold text-stone-200 text-sm">{stats.gamesPlayed}</span>
              </div>
              <div className="h-6 w-px bg-stone-800" />
              <div className="flex flex-col items-center">
                <span className="text-stone-500 text-[10px] uppercase font-bold tracking-wider">Win Rate</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{winRate}%</span>
              </div>
              <div className="h-6 w-px bg-stone-800" />
              <div className="flex flex-col items-center">
                <span className="text-stone-500 text-[10px] uppercase font-bold tracking-wider">Streak</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{stats.currentWinStreak} 🔥</span>
              </div>
            </div>
          </div>
        ) : (
          /* ================= SCREEN 2: GAME MODE SELECTION ================= */
          <div className="w-full max-w-md flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Back to Homepage Button */}
            <div className="w-full flex items-center justify-start mb-6">
              <button
                id="mode-back-home-btn"
                onClick={() => setCurrentScreen('home')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Back to Home</span>
              </button>
            </div>

            <div className="mb-6">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25">
                Game Setup
              </span>
              <h2
                id="mode-select-title"
                className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 mt-2.5"
              >
                Choose Game Mode
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">
                Select how you would like to play your match today.
              </p>
            </div>

            {/* Game Mode Cards */}
            <div className="w-full space-y-4">
              {/* MODE 1: PLAY VS CAISSA */}
              <button
                id="mode-play-caissa-btn"
                onClick={onStartVsCaissa}
                className="w-full group text-left p-5 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-875 to-stone-900 hover:from-stone-850 hover:to-stone-800 border border-amber-500/30 hover:border-amber-400/70 shadow-lg hover:shadow-amber-500/15 transition-all duration-200 active:scale-[0.99] cursor-pointer flex items-start gap-4 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-stone-100 group-hover:text-amber-300 transition-colors">
                      PLAY VS CAISSA
                    </h3>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Neural AI
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Challenge the adaptive chess engine with continuous strength slider (1% to 100% GM), real-time evaluation, and in-game guidance.
                  </p>
                </div>
              </button>

              {/* MODE 2: PLAY WITH FRIEND */}
              <button
                id="mode-play-friend-btn"
                onClick={onStartWithFriend}
                className="w-full group text-left p-5 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-875 to-stone-900 hover:from-stone-850 hover:to-stone-800 border border-stone-800 hover:border-amber-400/60 shadow-lg hover:shadow-amber-500/10 transition-all duration-200 active:scale-[0.99] cursor-pointer flex items-start gap-4 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-105 transition-transform shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-stone-100 group-hover:text-emerald-300 transition-colors">
                      PLAY WITH FRIEND
                    </h3>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Same Device
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Pass-and-play two-player chess on this device. Player 1 commands White; Player 2 commands Black with turn-based clocks.
                  </p>
                </div>
              </button>
            </div>

            {/* Footer returning note */}
            <p className="text-[11px] text-stone-500 mt-6">
              You can return to this menu at any time during a match via the Home button in the header.
            </p>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full border-t border-stone-900 py-3 text-center text-xs text-stone-500 z-10">
        <span>CHESSMATE &copy; {new Date().getFullYear()} &bull; Master-Grade Offline Chess</span>
      </footer>
    </div>
  );
};
