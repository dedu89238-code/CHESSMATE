import React, { useEffect, useState, useRef } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  RotateCcw,
  Eye,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  Users,
} from 'lucide-react';
import { ChessPieceIcon } from './ChessPieces';
import { PieceColor, GameStatus, GameMode } from '../types/chess';
import { PlayerStats } from '../types/stats';
import { MotivationalInsight } from '../utils/motivationalLines';

interface GrandVictoryCelebrationProps {
  status: GameStatus;
  winner: PieceColor;
  playerColor: PieceColor;
  gameMode?: GameMode;
  aiStrength: number;
  movesCount: number;
  stats: PlayerStats;
  isNewRecord: boolean;
  insight?: MotivationalInsight | null;
  onNewGame: () => void;
  onReviewBoard: () => void;
  onOpenStats: () => void;
}

// Lightweight, elegant gold particle canvas for cinematic ambient floating embers
const SubtleGoldParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 35 subtle golden stardust particles
    const particles = Array.from({ length: 36 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedY: Math.random() * 0.5 + 0.25,
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.55 + 0.2,
      pulse: Math.random() * 0.02 + 0.008,
      pulseDir: Math.random() > 0.5 ? 1 : -1,
      color: Math.random() > 0.3 ? '245, 158, 11' : '251, 191, 36', // Warm amber / gold
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y -= p.speedY;
        p.x += p.speedX;

        p.opacity += p.pulse * p.pulseDir;
        if (p.opacity > 0.75) {
          p.opacity = 0.75;
          p.pulseDir = -1;
        } else if (p.opacity < 0.15) {
          p.opacity = 0.15;
          p.pulseDir = 1;
        }

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.shadowColor = `rgba(${p.color}, 0.8)`;
        ctx.shadowBlur = p.size * 3;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
};

export const GrandVictoryCelebration: React.FC<GrandVictoryCelebrationProps> = ({
  status,
  winner,
  playerColor,
  gameMode = 'ai',
  aiStrength,
  movesCount,
  stats,
  isNewRecord,
  insight,
  onNewGame,
  onReviewBoard,
  onOpenStats,
}) => {
  // Two-stage cinematic sequence:
  // stage 'moment': The impactful cinematic "CHECKMATE" proclamation
  // stage 'result': Smoothly transitions into the comprehensive final-result view
  const [stage, setStage] = useState<'moment' | 'result'>('moment');

  useEffect(() => {
    // Automatically transition to the detailed result card after the dramatic moment
    const timer = setTimeout(() => {
      setStage('result');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const isAiMode = gameMode === 'ai';
  const isPlayerWinner = winner === playerColor;

  const decisiveText = status === 'checkmate'
    ? 'Checkmate'
    : status === 'timeout'
    ? 'Victory on Time'
    : 'Victory by Resignation';

  const winnerSideName = winner === 'w' ? 'White' : 'Black';
  const opponentSideName = winner === 'w' ? 'Black' : 'White';
  const victoryMatchSummary = `${winnerSideName} defeated ${opponentSideName}`;
  const displayTitle = isAiMode
    ? 'YOU DEFEATED CAISSA'
    : isPlayerWinner
    ? 'YOU WIN'
    : `${winnerSideName.toUpperCase()} WINS`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-300">
      {/* Subtle, elegant ambient gold particle system */}
      <SubtleGoldParticles />

      {/* Cinematic Ambient Glow Backdrops */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-amber-500/15 via-yellow-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-amber-400/20 rounded-full blur-3xl" />
      </div>

      {/* STAGE 1: DRAMATIC CHECKMATE MOMENT */}
      {stage === 'moment' && (
        <div
          onClick={() => setStage('result')}
          className="relative z-20 flex flex-col items-center justify-center text-center cursor-pointer select-none max-w-lg w-full animate-in zoom-in-95 duration-500"
        >
          {/* Glowing King Icon in Laurel Halo */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 rounded-full bg-amber-400/25 blur-2xl animate-ping" />
            <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-1.5 shadow-[0_0_50px_rgba(245,158,11,0.4)] border border-amber-300/80">
              <div className="w-full h-full rounded-[20px] bg-stone-950/95 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent pointer-events-none" />
                <div className="w-20 h-20 relative">
                  <ChessPieceIcon
                    type="k"
                    color={winner}
                    className="w-full h-full drop-shadow-[0_0_16px_rgba(251,191,36,0.9)]"
                  />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-amber-600 to-amber-400 p-2 rounded-2xl shadow-lg border border-yellow-200">
              <Trophy className="w-5 h-5 text-stone-950" />
            </div>
          </div>

          {/* Tagline */}
          <span className="text-xs font-mono tracking-[0.4em] text-amber-400/90 uppercase font-bold mb-2">
            Decisive Move
          </span>

          {/* Massive, Crisp Serif Headline */}
          <h1 className="text-5xl sm:text-6xl font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 font-black drop-shadow-[0_4px_30px_rgba(245,158,11,0.5)] mb-2">
            {status === 'checkmate' ? 'CHECKMATE' : 'VICTORY'}
          </h1>

          {/* Sub-Headline */}
          <h2 className="text-xl sm:text-2xl font-serif tracking-wider text-stone-200 font-bold mb-3">
            {isAiMode ? 'VICTORY' : isPlayerWinner ? 'YOU WIN' : `${winnerSideName.toUpperCase()} WINS`}
          </h2>

          {isAiMode ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>You Defeated CAISSA • {aiStrength}% AI</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-6">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>{victoryMatchSummary} • 2-Player Match</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
          )}

          <span className="text-[11px] font-mono tracking-widest text-stone-400/80 uppercase flex items-center gap-1">
            Tap anywhere to view summary <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}

      {/* STAGE 2: FINAL RESULT SCREEN */}
      {stage === 'result' && (
        <div className="relative z-20 bg-gradient-to-b from-stone-900 via-stone-925 to-stone-950 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_25px_100px_rgba(245,158,11,0.25)] max-w-lg w-full text-center flex flex-col items-center my-auto animate-in fade-in zoom-in-95 duration-400">
          
          {/* Top Floating King Emblem */}
          <div className="relative mb-3 mt-1">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-1 shadow-2xl flex items-center justify-center border border-amber-300/60">
              <div className="w-full h-full rounded-[14px] bg-stone-950/95 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent pointer-events-none" />
                <div className="w-14 h-14 relative">
                  <ChessPieceIcon
                    type="k"
                    color={winner}
                    className="w-full h-full drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                  />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-amber-600 to-amber-400 p-1.5 rounded-xl shadow-lg border border-yellow-200">
              <Trophy className="w-4 h-4 text-stone-950" />
            </div>
          </div>

          {/* New Record Banner if personal best AI level defeated */}
          {isAiMode && isNewRecord && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-400/30 to-amber-500/25 border border-amber-400/60 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2 animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>New Best Victory Record!</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
          )}

          {/* Decisive Result Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-1.5">
            <span>{decisiveText}</span>
          </div>

          {/* Main Title: Clearly communicates victory */}
          <h2 className="text-2xl sm:text-3xl font-serif tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 font-extrabold mb-1">
            {displayTitle}
          </h2>

          {isAiMode ? (
            <p className="text-xs sm:text-sm font-semibold text-stone-300 mb-4 flex items-center gap-2 justify-center">
              <span>Defeated at</span>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                {aiStrength}% Neural Strength
              </span>
            </p>
          ) : (
            <p className="text-xs sm:text-sm font-semibold text-stone-300 mb-4 flex items-center gap-2 justify-center">
              <span>{victoryMatchSummary}</span>
              <span className="px-2.5 py-0.5 rounded-md bg-stone-800 text-emerald-300 font-mono font-bold border border-stone-700">
                Pass &amp; Play
              </span>
            </p>
          )}

          {/* Quote / Commentary / Match Insight Block */}
          {isAiMode && insight ? (
            <div className="w-full relative py-3.5 px-4 rounded-2xl bg-amber-950/25 border border-amber-500/30 mb-5 text-left shadow-inner">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-400/95 font-bold mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>CAISSA • FINAL THOUGHT</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-200 italic font-serif leading-relaxed">
                "{insight.quote}"
              </p>
            </div>
          ) : !isAiMode ? (
            <div className="w-full relative py-3.5 px-4 rounded-2xl bg-stone-900/80 border border-stone-800 mb-5 text-left shadow-inner">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold mb-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>LOCAL 2-PLAYER MATCH</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
                {winnerSideName} triumphed over {opponentSideName} in this pass-and-play match.
              </p>
            </div>
          ) : null}

          {/* Key Match Statistics Grid */}
          <div className="w-full grid grid-cols-3 gap-2.5 py-3 px-3 rounded-2xl bg-stone-950/80 border border-stone-800/90 mb-5 text-center">
            <div className="flex flex-col p-1">
              <span className="text-[10px] uppercase font-mono text-stone-400 tracking-wider">Method</span>
              <span className="text-xs sm:text-sm font-bold text-amber-300 truncate">
                {decisiveText}
              </span>
            </div>
            <div className="flex flex-col p-1 border-x border-stone-800">
              <span className="text-[10px] uppercase font-mono text-stone-400 tracking-wider">Moves</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-stone-100">
                {movesCount}
              </span>
            </div>
            <div className="flex flex-col p-1">
              <span className="text-[10px] uppercase font-mono text-stone-400 tracking-wider">Win Streak</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400">
                {stats.currentStreak} 🔥
              </span>
            </div>
          </div>

          {/* Career Record Ribbon */}
          {isAiMode ? (
            <div className="w-full py-2 px-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 mb-6 flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>🏆 Best Victory Record:</span>
              </span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {stats.bestVictoryAi !== null ? `${stats.bestVictoryAi}% AI` : `${aiStrength}% AI`}
              </span>
            </div>
          ) : (
            <div className="w-full py-2 px-3.5 rounded-xl bg-stone-900 border border-stone-800 mb-6 flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Player Record:</span>
              </span>
              <span className="font-mono font-bold text-stone-200 text-sm">
                {stats.wins}W - {stats.losses}L ({stats.gamesPlayed} Played)
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-2.5">
            <button
              id="celebration-new-game-btn"
              onClick={onNewGame}
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-stone-950 font-bold text-sm shadow-[0_4px_25px_rgba(245,158,11,0.4)] transition active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Next Match</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                id="celebration-review-btn"
                onClick={onReviewBoard}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold text-xs border border-stone-800 transition active:scale-[0.98] cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-stone-400" />
                <span>Review Board</span>
              </button>
              <button
                id="celebration-stats-btn"
                onClick={onOpenStats}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold text-xs border border-stone-800 transition active:scale-[0.98] cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Full Statistics</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
