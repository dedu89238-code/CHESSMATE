import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  X,
  RotateCcw,
  BarChart2,
  Swords,
  Timer,
  Trash2,
} from 'lucide-react';
import { PlayerStats, resetPlayerStats } from '../types/stats';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onStatsReset: (newStats: PlayerStats) => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onStatsReset,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const winRate =
    stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  const handleReset = () => {
    const fresh = resetPlayerStats();
    onStatsReset(fresh);
    setConfirmReset(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative bg-gradient-to-b from-stone-900 via-stone-925 to-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)] max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-100">
                Player Statistics
              </h3>
              <p className="text-xs text-stone-400">Lifetime career performance</p>
            </div>
          </div>
          <button
            id="stats-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Crown Jewel: BEST VICTORY CARD */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 border border-amber-500/40 p-4.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/30">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    Highest Milestone
                  </span>
                  <h4 className="text-base sm:text-lg font-serif font-black text-amber-100 tracking-wide">
                    🏆 BEST VICTORY
                  </h4>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-mono font-black text-amber-300 block">
                  {stats.bestVictoryAi !== null ? `${stats.bestVictoryAi}% AI` : '—'}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  {stats.bestVictoryAi !== null ? 'CAISSA Conquered' : 'No AI win yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Record Triad (Wins, Losses, Draws) */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-stone-950/70 border border-stone-800/90 rounded-2xl p-3">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold block">
                Victories
              </span>
              <span className="text-xl font-mono font-bold text-stone-100">
                {stats.wins}
              </span>
              <span className="text-[10px] text-stone-500 block mt-0.5">
                {winRate}% rate
              </span>
            </div>

            <div className="bg-stone-950/70 border border-stone-800/90 rounded-2xl p-3">
              <span className="text-[10px] uppercase font-mono text-rose-400 font-semibold block">
                Defeats
              </span>
              <span className="text-xl font-mono font-bold text-stone-100">
                {stats.losses}
              </span>
              <span className="text-[10px] text-stone-500 block mt-0.5">
                Total losses
              </span>
            </div>

            <div className="bg-stone-950/70 border border-stone-800/90 rounded-2xl p-3">
              <span className="text-[10px] uppercase font-mono text-stone-400 font-semibold block">
                Draws
              </span>
              <span className="text-xl font-mono font-bold text-stone-100">
                {stats.draws}
              </span>
              <span className="text-[10px] text-stone-500 block mt-0.5">
                Split points
              </span>
            </div>
          </div>

          {/* Win Rate Bar */}
          <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-stone-300 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Overall Win Rate</span>
              </span>
              <span className="font-mono font-bold text-amber-300">{winRate}%</span>
            </div>
            <div className="w-full h-2.5 bg-stone-800/80 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{
                  width: `${stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0}%`,
                }}
                title={`Wins: ${stats.wins}`}
              />
              <div
                className="h-full bg-stone-600 transition-all duration-500"
                style={{
                  width: `${stats.gamesPlayed > 0 ? (stats.draws / stats.gamesPlayed) * 100 : 0}%`,
                }}
                title={`Draws: ${stats.draws}`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{
                  width: `${stats.gamesPlayed > 0 ? (stats.losses / stats.gamesPlayed) * 100 : 0}%`,
                }}
                title={`Losses: ${stats.losses}`}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 mt-2">
              <span>{stats.gamesPlayed} Total Matches</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Win
                <span className="w-2 h-2 rounded-full bg-stone-500 ml-1.5" /> Draw
                <span className="w-2 h-2 rounded-full bg-rose-400 ml-1.5" /> Loss
              </span>
            </div>
          </div>

          {/* Detailed Performance Metrics */}
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-2xl divide-y divide-stone-800/60 text-xs">
            <div className="flex items-center justify-between p-3">
              <span className="text-stone-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Current Win Streak</span>
              </span>
              <span className="font-mono font-bold text-stone-100">
                {stats.currentStreak} {stats.currentStreak > 0 ? '🔥' : ''}
              </span>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="text-stone-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>All-Time Best Streak</span>
              </span>
              <span className="font-mono font-bold text-amber-300">
                {stats.bestStreak} games
              </span>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="text-stone-300 flex items-center gap-2">
                <Swords className="w-4 h-4 text-emerald-400" />
                <span>Checkmates Delivered</span>
              </span>
              <span className="font-mono font-bold text-stone-100">
                {stats.checkmatesDelivered}
              </span>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="text-stone-300 flex items-center gap-2">
                <Timer className="w-4 h-4 text-sky-400" />
                <span>Fastest Checkmate</span>
              </span>
              <span className="font-mono font-bold text-stone-100">
                {stats.quickestWinMoves !== null ? `${stats.quickestWinMoves} moves` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer / Reset Action */}
        <div className="pt-4 mt-2 border-t border-stone-800/80 flex items-center justify-between">
          {confirmReset ? (
            <div className="flex items-center gap-2 w-full justify-between animate-in fade-in">
              <span className="text-xs text-rose-300 font-medium">Reset all stats?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-100 bg-rose-600 hover:bg-rose-500 transition shadow-sm"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                id="reset-stats-btn"
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-rose-400 transition"
                title="Reset Statistics"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>

              <button
                id="stats-done-btn"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition active:scale-95"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
