import React from 'react';
import { RotateCcw, Eye, Award, Trophy, BarChart3, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { GameStatus, PieceColor, GameMode } from '../types/chess';
import { ChessPieceIcon } from './ChessPieces';
import { MotivationalInsight } from '../utils/motivationalLines';
import { PlayerStats } from '../types/stats';

interface GameOverModalProps {
  status: GameStatus;
  winner: PieceColor | null;
  playerColor?: PieceColor;
  gameMode?: GameMode;
  movesCount: number;
  insight?: MotivationalInsight | null;
  stats?: PlayerStats | null;
  aiStrength?: number;
  onNewGame: () => void;
  onClose: () => void;
  onOpenStats?: () => void;
  onOpenCelebration?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  winner,
  playerColor = 'w',
  gameMode = 'ai',
  movesCount,
  insight,
  stats,
  aiStrength,
  onNewGame,
  onClose,
  onOpenStats,
  onOpenCelebration,
}) => {
  const isAiMode = gameMode === 'ai';
  const isPlayerWinner = winner === playerColor;
  const isDraw = !winner;

  const winnerSideName = winner === 'w' ? 'White' : 'Black';
  const opponentSideName = winner === 'w' ? 'Black' : 'White';

  let mainTitle = 'MATCH CONCLUDED';
  let outcomeSubtitle = '';
  let decisiveDetail = '';

  if (isAiMode) {
    if (status === 'checkmate') {
      mainTitle = isPlayerWinner ? 'VICTORY' : 'DEFEAT';
      outcomeSubtitle = `${winnerSideName} Wins by Checkmate`;
      decisiveDetail = 'The opposing King is under direct check with zero legal evasions.';
    } else if (status === 'timeout') {
      mainTitle = isPlayerWinner ? 'VICTORY ON TIME' : 'FLAG FELL';
      outcomeSubtitle = `${winnerSideName} Wins on Time`;
      decisiveDetail = 'The chess clock expired.';
    } else if (status === 'resigned') {
      mainTitle = isPlayerWinner ? 'VICTORY BY RESIGNATION' : 'RESIGNATION';
      outcomeSubtitle = `${opponentSideName} Resigned`;
      decisiveDetail = 'The position was conceded.';
    } else if (status === 'stalemate') {
      mainTitle = 'STALEMATE';
      outcomeSubtitle = 'Drawn by Stalemate';
      decisiveDetail = 'The active side has no legal moves remaining and is not in check.';
    } else if (status === 'draw-insufficient') {
      mainTitle = 'INSUFFICIENT MATERIAL';
      outcomeSubtitle = 'Drawn by FIDE Rule';
      decisiveDetail = 'Neither player has adequate piece value to force a checkmate.';
    } else if (status === 'draw-50-moves') {
      mainTitle = '50-MOVE DRAW';
      outcomeSubtitle = 'Technical Draw';
      decisiveDetail = 'Fifty consecutive turns elapsed without a pawn push or capture.';
    }
  } else {
    // Local 2-Player (Pass & Play) mode
    if (status === 'checkmate') {
      mainTitle = isPlayerWinner ? 'YOU WIN' : `${winnerSideName.toUpperCase()} WINS`;
      outcomeSubtitle = `${winnerSideName} defeated ${opponentSideName}`;
      decisiveDetail = `${winnerSideName} delivered checkmate.`;
    } else if (status === 'timeout') {
      mainTitle = isPlayerWinner ? 'YOU WIN' : `${winnerSideName.toUpperCase()} WINS`;
      outcomeSubtitle = `${winnerSideName} defeated ${opponentSideName} on time`;
      decisiveDetail = `${opponentSideName} chess clock expired.`;
    } else if (status === 'resigned') {
      mainTitle = isPlayerWinner ? 'YOU WIN' : `${winnerSideName.toUpperCase()} WINS`;
      outcomeSubtitle = `${winnerSideName} defeated ${opponentSideName} by resignation`;
      decisiveDetail = `${opponentSideName} conceded the position.`;
    } else if (status === 'stalemate') {
      mainTitle = 'STALEMATE';
      outcomeSubtitle = 'Drawn by Stalemate';
      decisiveDetail = 'The active player has no legal moves remaining and is not in check.';
    } else if (status === 'draw-insufficient') {
      mainTitle = 'INSUFFICIENT MATERIAL';
      outcomeSubtitle = 'Drawn by FIDE Rule';
      decisiveDetail = 'Neither player has adequate piece value to force checkmate.';
    } else if (status === 'draw-50-moves') {
      mainTitle = '50-MOVE DRAW';
      outcomeSubtitle = 'Technical Draw';
      decisiveDetail = 'Fifty consecutive turns elapsed without a pawn push or capture.';
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="relative bg-gradient-to-b from-stone-900 via-stone-925 to-stone-950 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_30px_90px_rgba(0,0,0,0.95)] max-w-md w-full text-center flex flex-col items-center overflow-hidden my-auto">
        {/* Subtle Ambient Radial Light Aura */}
        <div
          className="absolute -top-24 w-72 h-72 rounded-full pointer-events-none blur-3xl opacity-25"
          style={{
            backgroundColor: isDraw ? '#94a3b8' : isPlayerWinner ? '#10b981' : '#f59e0b',
          }}
        />

        {/* Top Crest / Winner Piece Emblem */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 border border-amber-500/40 flex items-center justify-center shadow-xl p-3">
            {winner ? (
              <ChessPieceIcon type="k" color={winner} className="w-full h-full" />
            ) : (
              <Award className="w-10 h-10 text-stone-300" />
            )}
          </div>
          {winner && (
            <div className="absolute -bottom-2 -right-2 bg-stone-950 rounded-full p-1 border border-amber-500/40">
              <span
                className={`w-3 h-3 rounded-full block ${
                  winner === 'w' ? 'bg-white shadow-[0_0_8px_white]' : 'bg-stone-700'
                }`}
              />
            </div>
          )}
        </div>

        {/* Title & Hierarchy */}
        <span className="text-[11px] font-mono tracking-[0.25em] text-amber-500/80 uppercase font-bold mb-1">
          Final Result
        </span>
        <h2 className="text-3xl sm:text-4xl font-serif tracking-wider text-stone-100 font-bold mb-1">
          {mainTitle}
        </h2>
        <p className="text-sm font-medium text-stone-300 mb-1">{outcomeSubtitle}</p>
        <p className="text-xs text-stone-400 max-w-xs leading-relaxed mb-4">{decisiveDetail}</p>

        {/* Psychological / Motivational Commentary from CAISSA (AI mode only) */}
        {isAiMode && insight && (
          <div className="w-full relative py-3 px-4 rounded-2xl bg-stone-950/70 border border-amber-500/25 mb-4 text-left shadow-inner">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{insight.source}</span>
            </div>
            <p className="text-xs sm:text-[13px] text-stone-200 italic font-serif leading-relaxed">
              "{insight.quote}"
            </p>
          </div>
        )}

        {/* Game Stats Overview Card */}
        <div className="w-full grid grid-cols-2 gap-2.5 py-2.5 px-3.5 rounded-2xl bg-stone-950/80 border border-stone-800/80 mb-4 text-left">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono text-stone-500">Total Moves</span>
            <span className="text-sm font-bold font-mono text-stone-200">
              {movesCount} turns
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono text-stone-500">Decisive Reason</span>
            <span className="text-sm font-bold text-stone-200 capitalize truncate">
              {status.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Best Victory Career Achievement Ribbon / Match Mode */}
        {stats && isAiMode ? (
          <div className="w-full py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5 flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>🏆 Best Victory:</span>
            </span>
            <span className="font-mono font-bold text-amber-300">
              {stats.bestVictoryAi !== null ? `${stats.bestVictoryAi}% AI` : '—'}
            </span>
          </div>
        ) : stats && !isAiMode ? (
          <div className="w-full py-2 px-3 rounded-xl bg-stone-850 border border-stone-800 mb-5 flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Match Mode:</span>
            </span>
            <span className="font-mono font-medium text-stone-300">
              Local 2-Player (Pass &amp; Play)
            </span>
          </div>
        ) : null}

        {/* Action Controls */}
        <div className="flex flex-col w-full gap-2.5">
          {/* Re-trigger celebration if player won */}
          {isPlayerWinner && onOpenCelebration && (
            <button
              onClick={onOpenCelebration}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-400/40 transition active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>View Victory Celebration</span>
            </button>
          )}

          <button
            id="modal-new-game-btn"
            onClick={onNewGame}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-stone-950 font-bold text-sm shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start New Match</span>
          </button>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              id="modal-review-btn"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold text-xs border border-stone-800 transition active:scale-[0.98]"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Review Board</span>
            </button>

            {onOpenStats && (
              <button
                id="modal-stats-btn"
                onClick={onOpenStats}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold text-xs border border-stone-800 transition active:scale-[0.98]"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Statistics</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
