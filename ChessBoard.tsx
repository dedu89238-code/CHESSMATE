import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Board, BoardTheme, Move, PieceColor, Square, Piece, PieceType } from '../types/chess';
import { ChessPieceIcon } from './ChessPieces';
import { RoyalAura, getRoyalSilhouetteGlow } from './RoyalAura';

export interface ActiveAnimation {
  id: string;
  from: Square;
  to: Square;
  piece: Piece;
  captured?: Piece | null;
  promotion?: PieceType;
  isEnPassant?: boolean;
  secondaryMove?: {
    from: Square;
    to: Square;
    piece: Piece;
  };
}

interface ChessBoardProps {
  board: Board;
  flipped: boolean;
  selectedSquare: Square | null;
  validMoves: Move[];
  lastMove: Move | null;
  kingInCheck: PieceColor | null;
  theme: BoardTheme;
  showLegalMoves: boolean;
  highlightLastMove: boolean;
  animatingMove: ActiveAnimation | null;
  onSquareClick: (square: Square) => void;
  disabled?: boolean;
}

// Sophisticated luxury finishes for each board theme
const THEME_STYLES: Record<
  BoardTheme,
  {
    lightSquare: string;
    darkSquare: string;
    lightText: string;
    darkText: string;
    frameBorder: string;
    inlayBorder: string;
    frameBg: string;
  }
> = {
  wood: {
    // Handcrafted Walnut & Canadian Maple
    lightSquare: 'bg-[#ede0c8] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]',
    darkSquare: 'bg-[#8d5b32] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]',
    lightText: 'text-[#8d5b32]',
    darkText: 'text-[#ede0c8]/90',
    frameBorder: 'border-[#3f2514]',
    inlayBorder: 'border-[#c29853]/60',
    frameBg: 'from-[#382012] via-[#2d190e] to-[#1e1008]',
  },
  emerald: {
    // Classic Tournament Green Velvet & Cream
    lightSquare: 'bg-[#eaebd3] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]',
    darkSquare: 'bg-[#5b8344] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]',
    lightText: 'text-[#5b8344]',
    darkText: 'text-[#eaebd3]/90',
    frameBorder: 'border-[#1b2b18]',
    inlayBorder: 'border-[#b8a168]/50',
    frameBg: 'from-[#1b2818] via-[#141e12] to-[#0c130b]',
  },
  slate: {
    // Polished Belgian Obsidian & Carrara Limestone
    lightSquare: 'bg-[#d8dfe8] shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]',
    darkSquare: 'bg-[#3b4554] shadow-[inset_0_1px_3px_rgba(0,0,0,0.45)]',
    lightText: 'text-[#3b4554]',
    darkText: 'text-[#d8dfe8]/90',
    frameBorder: 'border-[#1c222b]',
    inlayBorder: 'border-[#94a3b8]/40',
    frameBg: 'from-[#1e242d] via-[#161a21] to-[#0e1115]',
  },
  blue: {
    // Royal Sapphire & Frosted Maple
    lightSquare: 'bg-[#dce6f0] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]',
    darkSquare: 'bg-[#436b94] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
    lightText: 'text-[#436b94]',
    darkText: 'text-[#dce6f0]/90',
    frameBorder: 'border-[#182738]',
    inlayBorder: 'border-[#7ea1c4]/50',
    frameBg: 'from-[#172637] via-[#101b28] to-[#0a111a]',
  },
  coral: {
    // Terracotta & Warm Rosewood
    lightSquare: 'bg-[#f4e1d7] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]',
    darkSquare: 'bg-[#a35967] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]',
    lightText: 'text-[#a35967]',
    darkText: 'text-[#f4e1d7]/90',
    frameBorder: 'border-[#381a20]',
    inlayBorder: 'border-[#d49ea8]/50',
    frameBg: 'from-[#33181e] via-[#271217] to-[#190a0e]',
  },
};

interface ChessSquareProps {
  r: number;
  c: number;
  isLight: boolean;
  piece: Piece | null;
  isTravelingFrom: boolean;
  isBeingCaptured: boolean;
  isSelected: boolean;
  isLastMoveFrom: boolean;
  isLastMoveTo: boolean;
  isKingCheckedSquare: boolean;
  showRankLabel: boolean;
  rankNumber: number;
  showFileLabel: boolean;
  fileLetter: string;
  isLegalDestination: boolean;
  isCapture: boolean;
  disabled: boolean;
  hasAnimatingMove: boolean;
  animatingMoveId?: string;
  lightSquareClass: string;
  darkSquareClass: string;
  lightTextClass: string;
  darkTextClass: string;
  onSquareClick: (square: Square) => void;
}

const ChessSquare: React.FC<ChessSquareProps> = React.memo(({
  r,
  c,
  isLight,
  piece,
  isTravelingFrom,
  isBeingCaptured,
  isSelected,
  isLastMoveFrom,
  isLastMoveTo,
  isKingCheckedSquare,
  showRankLabel,
  rankNumber,
  showFileLabel,
  fileLetter,
  isLegalDestination,
  isCapture,
  disabled,
  hasAnimatingMove,
  animatingMoveId,
  lightSquareClass,
  darkSquareClass,
  lightTextClass,
  darkTextClass,
  onSquareClick,
}) => {
  const handleClick = React.useCallback(() => {
    if (disabled || hasAnimatingMove) return;
    onSquareClick({ row: r, col: c });
  }, [disabled, hasAnimatingMove, onSquareClick, r, c]);

  return (
    <div
      id={`square-${r}-${c}`}
      onClick={handleClick}
      className={`relative flex items-center justify-center transition-colors duration-150 ${
        disabled || hasAnimatingMove ? 'cursor-default pointer-events-none' : 'cursor-pointer'
      } ${
        isLight ? lightSquareClass : darkSquareClass
      } ${
        isSelected
          ? 'ring-4 ring-inset ring-amber-400/90 !bg-amber-300/35 z-10'
          : ''
      } ${
        isLastMoveFrom || isLastMoveTo
          ? '!bg-amber-400/25 ring-1 ring-inset ring-amber-400/30'
          : ''
      } ${
        isKingCheckedSquare
          ? '!bg-red-600/75 animate-pulse ring-4 ring-inset ring-red-500 z-10 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
          : ''
      }`}
    >
      {/* Subtle top-left light sheen on square edge */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-white/30 via-transparent to-black/20" />

      {/* Rank notation (1 - 8) */}
      {showRankLabel && (
        <span
          className={`absolute top-1 left-1.5 text-[11px] font-bold font-mono tracking-tight pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] ${
            isLight ? lightTextClass : darkTextClass
          }`}
        >
          {rankNumber}
        </span>
      )}

      {/* File notation (a - h) */}
      {showFileLabel && (
        <span
          className={`absolute bottom-1 right-1.5 text-[11px] font-bold font-mono tracking-tight pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] ${
            isLight ? lightTextClass : darkTextClass
          }`}
        >
          {fileLetter}
        </span>
      )}

      {/* Stationed Piece (hidden if in-flight, or smoothly dissolves if being captured) */}
      {piece && !isTravelingFrom && (
        isBeingCaptured ? (
          <motion.div
            key={`captured-${r}-${c}-${animatingMoveId}`}
            initial={{ opacity: 1, scale: 1.0 }}
            animate={{ opacity: [1, 1, 0.25, 0], scale: [1, 1, 0.9, 0.75] }}
            transition={{
              duration: 0.48,
              times: [0, 0.55, 0.85, 1],
              ease: 'easeInOut',
            }}
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
            className="relative w-[84%] h-[84%] flex items-center justify-center pointer-events-none z-10"
          >
            <RoyalAura type={piece.type} color={piece.color} />
            <div className={`w-full h-full flex items-center justify-center relative z-10 ${getRoyalSilhouetteGlow(piece.type, piece.color)}`}>
              <ChessPieceIcon type={piece.type} color={piece.color} />
            </div>
          </motion.div>
        ) : (
          <div className="relative w-[84%] h-[84%] flex items-center justify-center transition-transform active:scale-95 z-10">
            <RoyalAura type={piece.type} color={piece.color} />
            <div className={`w-full h-full flex items-center justify-center relative z-10 ${getRoyalSilhouetteGlow(piece.type, piece.color)}`}>
              <ChessPieceIcon type={piece.type} color={piece.color} />
            </div>
          </div>
        )
      )}

      {/* Move Target Hints */}
      {isLegalDestination && !hasAnimatingMove && !disabled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          {isCapture ? (
            <div className="w-[82%] h-[82%] rounded-full border-4 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-stone-900/40 backdrop-blur-xs border border-white/40 shadow-md" />
          )}
        </div>
      )}
    </div>
  );
});

export const ChessBoard: React.FC<ChessBoardProps> = React.memo(({
  board,
  flipped,
  selectedSquare,
  validMoves,
  lastMove,
  kingInCheck,
  theme,
  showLegalMoves,
  highlightLastMove,
  animatingMove,
  onSquareClick,
  disabled = false,
}) => {
  const currentTheme = THEME_STYLES[theme] || THEME_STYLES.wood;

  // Compute visual coordinates for squares based on board orientation
  const displayRows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const displayCols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  // Map board square (r, c) to display coordinates
  const getDisplayCoords = (r: number, c: number) => {
    return {
      dRow: flipped ? 7 - r : r,
      dCol: flipped ? 7 - c : c,
    };
  };

  // Memoize legal moves lookup map for O(1) square queries
  const legalMoveMap = React.useMemo(() => {
    if (!showLegalMoves || validMoves.length === 0) return new Map<string, Move>();
    const map = new Map<string, Move>();
    for (let i = 0; i < validMoves.length; i++) {
      const m = validMoves[i];
      map.set(`${m.to.row}-${m.to.col}`, m);
    }
    return map;
  }, [showLegalMoves, validMoves]);

  const primaryCoords = animatingMove
    ? {
        from: getDisplayCoords(animatingMove.from.row, animatingMove.from.col),
        to: getDisplayCoords(animatingMove.to.row, animatingMove.to.col),
      }
    : null;

  const secondaryCoords = animatingMove?.secondaryMove
    ? {
        from: getDisplayCoords(
          animatingMove.secondaryMove.from.row,
          animatingMove.secondaryMove.from.col
        ),
        to: getDisplayCoords(
          animatingMove.secondaryMove.to.row,
          animatingMove.secondaryMove.to.col
        ),
      }
    : null;

  const deltaXPercent = primaryCoords
    ? (primaryCoords.to.dCol - primaryCoords.from.dCol) * 100
    : 0;
  const deltaYPercent = primaryCoords
    ? (primaryCoords.to.dRow - primaryCoords.from.dRow) * 100
    : 0;

  const secDeltaXPercent = secondaryCoords
    ? (secondaryCoords.to.dCol - secondaryCoords.from.dCol) * 100
    : 0;
  const secDeltaYPercent = secondaryCoords
    ? (secondaryCoords.to.dRow - secondaryCoords.from.dRow) * 100
    : 0;

  return (
    <div
      id="chess-board-wrapper"
      className={`relative w-full max-w-[560px] aspect-square rounded-2xl p-3 sm:p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border-4 ${currentTheme.frameBorder} bg-gradient-to-br ${currentTheme.frameBg} select-none transition-colors duration-300`}
    >
      {/* Precision Handcrafted Brass / Gold Inlay Groove */}
      <div
        className={`w-full h-full rounded-lg p-0.5 border ${currentTheme.inlayBorder} shadow-[0_2px_8px_rgba(0,0,0,0.6)] relative overflow-hidden`}
      >
        {/* The 8x8 Chess Playing Surface */}
        <div
          id="chess-grid"
          className="relative grid grid-cols-8 grid-rows-8 w-full h-full rounded shadow-inner overflow-hidden"
        >
          {displayRows.map((r, rIdx) =>
            displayCols.map((c, cIdx) => {
              const isLight = (r + c) % 2 === 0;
              const piece = board[r][c];

              // Check if this square is currently origin of an in-flight piece animation
              const isTravelingFrom =
                !!animatingMove &&
                ((animatingMove.from.row === r && animatingMove.from.col === c) ||
                  (animatingMove.secondaryMove?.from.row === r &&
                    animatingMove.secondaryMove?.from.col === c));

              // Check if this square is currently the victim square of an in-flight piece capture
              const isBeingCaptured =
                !!animatingMove &&
                !!animatingMove.captured &&
                ((animatingMove.to.row === r && animatingMove.to.col === c) ||
                  (animatingMove.isEnPassant && animatingMove.from.row === r && animatingMove.to.col === c));

              const isSelected = selectedSquare?.row === r && selectedSquare?.col === c;
              const isLastMoveFrom =
                highlightLastMove && lastMove?.from.row === r && lastMove?.from.col === c;
              const isLastMoveTo =
                highlightLastMove && lastMove?.to.row === r && lastMove?.to.col === c;

              // Target legal destination move
              const targetMove = showLegalMoves
                ? legalMoveMap.get(`${r}-${c}`) || null
                : null;
              const isLegalDestination = !!targetMove;
              const isCapture = isLegalDestination && (!!piece || targetMove.isEnPassant);

              // King in check highlight
              const isKingCheckedSquare =
                !!kingInCheck && piece?.type === 'k' && piece?.color === kingInCheck;

              // Notation labels
              const showFileLabel = rIdx === 7;
              const fileLetter = String.fromCharCode('a'.charCodeAt(0) + c);
              const showRankLabel = cIdx === 0;
              const rankNumber = 8 - r;

              return (
                <ChessSquare
                  key={`${r}-${c}`}
                  r={r}
                  c={c}
                  isLight={isLight}
                  piece={piece}
                  isTravelingFrom={isTravelingFrom}
                  isBeingCaptured={isBeingCaptured}
                  isSelected={isSelected}
                  isLastMoveFrom={isLastMoveFrom}
                  isLastMoveTo={isLastMoveTo}
                  isKingCheckedSquare={isKingCheckedSquare}
                  showRankLabel={showRankLabel}
                  rankNumber={rankNumber}
                  showFileLabel={showFileLabel}
                  fileLetter={fileLetter}
                  isLegalDestination={isLegalDestination}
                  isCapture={isCapture}
                  disabled={disabled}
                  hasAnimatingMove={!!animatingMove}
                  animatingMoveId={animatingMove?.id}
                  lightSquareClass={currentTheme.lightSquare}
                  darkSquareClass={currentTheme.darkSquare}
                  lightTextClass={currentTheme.lightText}
                  darkTextClass={currentTheme.darkText}
                  onSquareClick={onSquareClick}
                />
              );
            })
          )}

          {/* VISIBLE HARDWARE-ACCELERATED TRAVEL ANIMATION OVERLAY (480ms visible smooth glide) */}
          <AnimatePresence>
            {animatingMove && primaryCoords && (
              <>
                {/* Primary Traveling Piece (Pawn, Knight, Bishop, Rook, Queen, King) */}
                <motion.div
                  key={`anim-primary-${animatingMove.id}`}
                  initial={{
                    x: '0%',
                    y: '0%',
                    z: 0,
                    scale: 1.0,
                  }}
                  animate={{
                    x: `${deltaXPercent}%`,
                    y: `${deltaYPercent}%`,
                    z: 0,
                    scale: [1.0, 1.14, 1.0],
                  }}
                  transition={{
                    duration: 0.48,
                    ease: [0.25, 0.1, 0.25, 1], // Smooth physical glide with gentle lift and soft touchdown
                  }}
                  style={{
                    top: `${primaryCoords.from.dRow * 12.5}%`,
                    left: `${primaryCoords.from.dCol * 12.5}%`,
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                  }}
                  className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center pointer-events-none z-40 drop-shadow-[0_8px_16px_rgba(0,0,0,0.42)]"
                >
                  {/* Hardware-accelerated ground shadow during physical elevation */}
                  <motion.div
                    aria-hidden="true"
                    initial={{ scale: 1, opacity: 0.35 }}
                    animate={{
                      scale: [1.0, 1.25, 1.0],
                      opacity: [0.35, 0.65, 0.35],
                    }}
                    transition={{
                      duration: 0.48,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    style={{ willChange: 'transform, opacity', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
                    className="absolute bottom-[4%] w-[68%] h-[20%] rounded-full bg-black/55 blur-[3px] pointer-events-none -z-10"
                  />

                  {animatingMove.promotion ? (
                    <div className="relative w-[84%] h-[84%] flex items-center justify-center">
                      {/* Traveling pawn */}
                      <motion.div
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: [1, 1, 0.1, 0], scale: [1, 1, 0.9, 0.75] }}
                        transition={{ duration: 0.48, times: [0, 0.65, 0.88, 1] }}
                        style={{ willChange: 'transform, opacity', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <ChessPieceIcon type="p" color={animatingMove.piece.color} />
                      </motion.div>
                      {/* Promoted piece crowning on touchdown */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.75 }}
                        animate={{ opacity: [0, 0, 0.9, 1], scale: [0.75, 0.75, 1.05, 1] }}
                        transition={{ duration: 0.48, times: [0, 0.65, 0.88, 1] }}
                        style={{ willChange: 'transform, opacity', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <RoyalAura type={animatingMove.promotion} color={animatingMove.piece.color} />
                        <div className={`w-full h-full flex items-center justify-center relative z-10 ${getRoyalSilhouetteGlow(animatingMove.promotion, animatingMove.piece.color)}`}>
                          <ChessPieceIcon type={animatingMove.promotion} color={animatingMove.piece.color} />
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="relative w-[84%] h-[84%] flex items-center justify-center">
                      <RoyalAura type={animatingMove.piece.type} color={animatingMove.piece.color} />
                      <div className={`w-full h-full flex items-center justify-center relative z-10 ${getRoyalSilhouetteGlow(animatingMove.piece.type, animatingMove.piece.color)}`}>
                        <ChessPieceIcon
                          type={animatingMove.piece.type}
                          color={animatingMove.piece.color}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Secondary Traveling Piece (for Castling: the traveling Rook) */}
                {animatingMove.secondaryMove && secondaryCoords && (
                  <motion.div
                    key={`anim-secondary-${animatingMove.id}`}
                    initial={{
                      x: '0%',
                      y: '0%',
                      z: 0,
                      scale: 1.0,
                    }}
                    animate={{
                      x: `${secDeltaXPercent}%`,
                      y: `${secDeltaYPercent}%`,
                      z: 0,
                      scale: [1.0, 1.12, 1.0],
                    }}
                    transition={{
                      duration: 0.48,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    style={{
                      top: `${secondaryCoords.from.dRow * 12.5}%`,
                      left: `${secondaryCoords.from.dCol * 12.5}%`,
                      willChange: 'transform',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                    }}
                    className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center pointer-events-none z-40 drop-shadow-[0_8px_16px_rgba(0,0,0,0.42)]"
                  >
                    {/* Hardware-accelerated ground shadow for castling rook */}
                    <motion.div
                      aria-hidden="true"
                      initial={{ scale: 1, opacity: 0.35 }}
                      animate={{
                        scale: [1.0, 1.2, 1.0],
                        opacity: [0.35, 0.6, 0.35],
                      }}
                      transition={{
                        duration: 0.48,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      style={{ willChange: 'transform, opacity', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
                      className="absolute bottom-[4%] w-[68%] h-[20%] rounded-full bg-black/55 blur-[3px] pointer-events-none -z-10"
                    />
                    <div className="w-[84%] h-[84%] flex items-center justify-center">
                      <ChessPieceIcon
                        type={animatingMove.secondaryMove.piece.type}
                        color={animatingMove.secondaryMove.piece.color}
                      />
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
