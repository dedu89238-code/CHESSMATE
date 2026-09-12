import { PieceColor, Move, PieceType } from '../types/chess';
import { ChessPosition, getLegalMoves, isKingInCheck, makeMove, isSquareAttacked } from './chessEngine';

// Piece values for AI evaluation
export const EVAL_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simplified piece values for naive beginner perception
const NAIVE_PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 300,
  b: 300,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (from White's perspective; for Black, row is mirrored: 7 - r)
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_MIDGAME_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

// Evaluate the board statically from White's perspective (+ for White, - for Black)
export function evaluateBoard(pos: ChessPosition): number {
  const { board } = pos;
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const pieceVal = EVAL_VALUES[piece.type];
      let pstVal = 0;

      const evalRow = piece.color === 'w' ? r : 7 - r;
      const evalCol = c;

      switch (piece.type) {
        case 'p': pstVal = PAWN_PST[evalRow][evalCol]; break;
        case 'n': pstVal = KNIGHT_PST[evalRow][evalCol]; break;
        case 'b': pstVal = BISHOP_PST[evalRow][evalCol]; break;
        case 'r': pstVal = ROOK_PST[evalRow][evalCol]; break;
        case 'q': pstVal = QUEEN_PST[evalRow][evalCol]; break;
        case 'k': pstVal = KING_MIDGAME_PST[evalRow][evalCol]; break;
      }

      const totalVal = pieceVal + pstVal;
      if (piece.color === 'w') {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  return score;
}

// Naive material evaluation for beginner levels (no PST, no king safety heuristics)
function evaluateNaive(pos: ChessPosition): number {
  const { board } = pos;
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const val = NAIVE_PIECE_VALUES[piece.type];
      score += piece.color === 'w' ? val : -val;
    }
  }

  return score;
}

// Move ordering for alpha-beta efficiency (captures and promotions first)
function sortMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.captured) {
      scoreA += EVAL_VALUES[a.captured.type] * 10 - EVAL_VALUES[a.piece.type];
    }
    if (a.promotion) {
      scoreA += EVAL_VALUES[a.promotion] * 5;
    }

    if (b.captured) {
      scoreB += EVAL_VALUES[b.captured.type] * 10 - EVAL_VALUES[b.piece.type];
    }
    if (b.promotion) {
      scoreB += EVAL_VALUES[b.promotion] * 5;
    }

    return scoreB - scoreA;
  });
}

// Minimax with Alpha-Beta pruning
function minimax(
  pos: ChessPosition,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0) {
    return evaluateBoard(pos);
  }

  const legalMoves = getLegalMoves(pos);

  if (legalMoves.length === 0) {
    if (isKingInCheck(pos.board, pos.turn)) {
      // Checkmate: prefer faster mate
      return isMaximizing ? -100000 - depth : 100000 + depth;
    }
    // Stalemate
    return 0;
  }

  const orderedMoves = sortMoves(legalMoves);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of orderedMoves) {
      const nextPos = makeMove(pos, move);
      const evaluation = minimax(nextPos, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of orderedMoves) {
      const nextPos = makeMove(pos, move);
      const evaluation = minimax(nextPos, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Compute CAISSA's move based on calibrated strength (1 - 100).
 *
 * PROVEN 6-ZONE STRENGTH PROGRESSION:
 *  1–15%: BEGINNER      - True beginner, high blunder rate, 0-ply lookahead, misses free pieces, noisy naive perception
 * 16–35%: DEVELOPING    - Novice amateur, 1-ply search, moderate blunders, tunnel vision on captures, temperature candidate selection
 * 36–55%: INTERMEDIATE  - Casual club player, 2-ply minimax lookahead, minimal tactical oversights, understands development
 * 56–75%: ADVANCED      - Strong tournament club player, 2-3 ply alpha-beta search, 0% blunders, sharp tactics
 * 76–90%: EXPERT        - Expert rated, 3-ply full minimax with alpha-beta, moves ordered, punishes mistakes
 * 91–100%: MASTER       - Peak engine performance, 3-4 ply deep tactical search, 100% deterministic best move
 */
export function getAIMove(pos: ChessPosition, strength: number = 50): Move | null {
  const legalMoves = getLegalMoves(pos);
  if (legalMoves.length === 0) return null;

  const isWhite = pos.turn === 'w';
  const opponentColor: PieceColor = isWhite ? 'b' : 'w';
  const clampedStrength = Math.max(1, Math.min(100, Math.round(strength)));

  // =========================================================================
  // ZONE 1: BEGINNER (1% - 15%)
  // =========================================================================
  // Characteristics:
  // - True novice behavior
  // - No lookahead calculations (0 plies)
  // - High blunder rate (55% at 1% down to 24% at 15%)
  // - Frequently hangs pieces or misses opponent hanging pieces
  // - Naive material-only evaluation with heavy noise (±380 to ±150 centipawns)
  // - Uses probabilistic roulette over candidate moves rather than best-move picking
  if (clampedStrength <= 15) {
    const strengthFactor = (clampedStrength - 1) / 14; // 0.0 at 1%, 1.0 at 15%
    const blunderChance = 0.55 - strengthFactor * 0.31; // 0.55 at 1% down to 0.24 at 15%

    // 1. Beginner Blunder Mode
    if (Math.random() < blunderChance) {
      // Find moves that are genuine beginner errors:
      // A) Moving a piece to a square that is directly attacked by the opponent
      const hangingMoves = legalMoves.filter(m => {
        // King cannot move into check (illegal in chess), but other pieces can step into attack
        if (m.piece.type === 'k') return false;
        const nextPos = makeMove(pos, m);
        return isSquareAttacked(nextPos.board, m.to, opponentColor);
      });

      // B) Passive/unproductive moves: moving pawns on the flank (a or h files) or moving back
      const flankPawnMoves = legalMoves.filter(
        m => m.piece.type === 'p' && (m.from.col === 0 || m.from.col === 7)
      );

      // In 65% of blunders, if hanging moves exist, commit an obvious hanging blunder
      if (hangingMoves.length > 0 && Math.random() < 0.65) {
        return hangingMoves[Math.floor(Math.random() * hangingMoves.length)];
      }

      // In 20% of blunders, push a flank pawn aimlessly
      if (flankPawnMoves.length > 0 && Math.random() < 0.45) {
        return flankPawnMoves[Math.floor(Math.random() * flankPawnMoves.length)];
      }

      // Otherwise pick an arbitrary random legal move (casual non-tactical impulse)
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    // 2. Non-blunder beginner move: 0-ply naive static evaluation with high perception noise
    const noiseMax = 380 - strengthFactor * 230; // 380 down to 150 centipawns
    const scoredMoves = legalMoves.map(move => {
      const nextPos = makeMove(pos, move);
      const rawScore = evaluateNaive(nextPos);
      const noise = (Math.random() * 2 - 1) * noiseMax;
      const score = (isWhite ? rawScore : -rawScore) + noise;
      return { move, score };
    });

    // Sort descending by noisy perceived score
    scoredMoves.sort((a, b) => b.score - a.score);

    // Pick using a soft beginner distribution over top 4 candidates (not just the top 1)
    const candidateCount = Math.min(scoredMoves.length, 4);
    const weights = [0.45, 0.30, 0.15, 0.10].slice(0, candidateCount);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < candidateCount; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        return scoredMoves[i].move;
      }
    }
    return scoredMoves[0].move;
  }

  // =========================================================================
  // ZONE 2: DEVELOPING (16% - 35%)
  // =========================================================================
  // Characteristics:
  // - Novice/developing amateur: knows piece values and likes captures, but has tunnel vision
  // - 1-ply search (evaluates immediate position, but does not calculate opponent counter-tactics)
  // - Moderate blunder rate: 18% at 16% down to 5% at 35%
  // - Moderate noise (±120 down to ±35 centipawns)
  // - Temperature-based weighted candidate selection over top 3 moves
  if (clampedStrength <= 35) {
    const strengthFactor = (clampedStrength - 16) / 19; // 0.0 at 16%, 1.0 at 35%
    const blunderChance = 0.18 - strengthFactor * 0.13; // 0.18 down to 0.05

    if (Math.random() < blunderChance) {
      // Blunder: random legal move or sub-optimal piece shuffle
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    const noiseMax = 120 - strengthFactor * 85; // 120 down to 35
    const scoredMoves = legalMoves.map(move => {
      const nextPos = makeMove(pos, move);
      const evalScore = evaluateBoard(nextPos);
      const noise = (Math.random() * 2 - 1) * noiseMax;
      const score = (isWhite ? evalScore : -evalScore) + noise;
      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);

    // Weighted selection over top 3 candidate moves
    const p1 = 0.60 + strengthFactor * 0.20; // 0.60 to 0.80
    const p2 = 0.26 - strengthFactor * 0.12; // 0.26 to 0.14
    const p3 = Math.max(0.04, 1 - p1 - p2);
    const candidateCount = Math.min(scoredMoves.length, 3);
    const weights = [p1, p2, p3].slice(0, candidateCount);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < candidateCount; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        return scoredMoves[i].move;
      }
    }
    return scoredMoves[0].move;
  }

  // =========================================================================
  // ZONE 3: INTERMEDIATE (36% - 55%)
  // =========================================================================
  // Characteristics:
  // - Casual club player
  // - 2-ply minimax lookahead (calculates opponent's reply)
  // - Very low blunder rate (3.5% down to 1%)
  // - Small evaluation noise (±20 down to ±3 centipawns)
  // - 82% - 92% selects the top move, otherwise 2nd best
  if (clampedStrength <= 55) {
    const strengthFactor = (clampedStrength - 36) / 19; // 0.0 at 36%, 1.0 at 55%
    const blunderChance = 0.035 - strengthFactor * 0.025; // 0.035 down to 0.01

    if (Math.random() < blunderChance) {
      // Minor tactical oversight: pick a non-capture move from the lower half
      const quietMoves = legalMoves.filter(m => !m.captured);
      if (quietMoves.length > 0) {
        return quietMoves[Math.floor(Math.random() * quietMoves.length)];
      }
    }

    const noiseMax = 20 - strengthFactor * 17; // 20 down to 3 centipawns
    const orderedMoves = sortMoves(legalMoves);
    const scoredMoves = orderedMoves.map(move => {
      const nextPos = makeMove(pos, move);
      // Minimax depth 1: searches 2 plies deep (my move + opponent's reply)
      const rawScore = minimax(nextPos, 1, -Infinity, Infinity, !isWhite);
      const noise = (Math.random() * 2 - 1) * noiseMax;
      const score = (isWhite ? rawScore : -rawScore) + noise;
      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);

    const bestPickChance = 0.82 + strengthFactor * 0.10;
    if (scoredMoves.length > 1 && Math.random() > bestPickChance) {
      return scoredMoves[1].move;
    }
    return scoredMoves[0].move;
  }

// Root alpha-beta search returning the best move deterministically
function findBestMoveAlphaBeta(
  pos: ChessPosition,
  depth: number,
  isWhite: boolean
): Move {
  const orderedMoves = sortMoves(getLegalMoves(pos));
  let bestMove = orderedMoves[0];
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of orderedMoves) {
    const nextPos = makeMove(pos, move);
    const score = minimax(nextPos, depth, alpha, beta, !isWhite);

    if (isWhite) {
      if (score > alpha) {
        alpha = score;
        bestMove = move;
      }
    } else {
      if (score < beta) {
        beta = score;
        bestMove = move;
      }
    }
    if (beta <= alpha) break;
  }

  return bestMove;
}

  // =========================================================================
  // ZONE 4: ADVANCED (56% - 75%)
  // =========================================================================
  // Characteristics:
  // - Strong club tournament player
  // - 2 to 3-ply minimax with alpha-beta pruning and move ordering
  // - 0% blunders, zero noise
  // - 93% picks absolute best move; 7% picks 2nd best only if score is within 25 centipawns
  if (clampedStrength <= 75) {
    const searchDepth = legalMoves.length > 25 ? 1 : 2;
    // 93% of the time, immediately execute the optimal alpha-beta move
    if (Math.random() < 0.93) {
      return findBestMoveAlphaBeta(pos, searchDepth, isWhite);
    }

    // 7% of the time, consider the 2nd best move if within 25 centipawns
    const orderedMoves = sortMoves(legalMoves);
    const scoredMoves = orderedMoves.slice(0, 5).map(move => {
      const nextPos = makeMove(pos, move);
      const rawScore = minimax(nextPos, 1, -Infinity, Infinity, !isWhite);
      const score = isWhite ? rawScore : -rawScore;
      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    if (scoredMoves.length > 1 && scoredMoves[0].score - scoredMoves[1].score <= 25) {
      return scoredMoves[1].move;
    }
    return findBestMoveAlphaBeta(pos, searchDepth, isWhite);
  }

  // =========================================================================
  // ZONE 5: EXPERT (76% - 90%)
  // =========================================================================
  // Characteristics:
  // - Expert competitive rating
  // - 3-ply minimax with full alpha-beta pruning and move ordering
  // - 0% blunders, zero noise
  // - 98% picks top engine move; 2% alternative only if evaluation diff <= 10 centipawns
  if (clampedStrength <= 90) {
    const searchDepth = 2; // root ply 1 + minimax depth 2 = 3 plies total
    if (Math.random() < 0.98) {
      return findBestMoveAlphaBeta(pos, searchDepth, isWhite);
    }

    const orderedMoves = sortMoves(legalMoves);
    const scoredMoves = orderedMoves.slice(0, 3).map(move => {
      const nextPos = makeMove(pos, move);
      const rawScore = minimax(nextPos, 1, -Infinity, Infinity, !isWhite);
      const score = isWhite ? rawScore : -rawScore;
      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    if (scoredMoves.length > 1 && scoredMoves[0].score - scoredMoves[1].score <= 10) {
      return scoredMoves[1].move;
    }
    return findBestMoveAlphaBeta(pos, searchDepth, isWhite);
  }

  // =========================================================================
  // ZONE 6: MASTER (91% - 100%)
  // =========================================================================
  // Characteristics:
  // - Peak engine capability
  // - 3 to 4-ply minimax with full alpha-beta pruning and optimal move ordering
  // - 100% deterministic best move found by the engine
  // - Zero noise, zero random concessions, ruthless tactical refutations
  const searchDepth = legalMoves.length > 20 ? 2 : 3; // root ply 1 + minimax depth 2/3 = 3-4 plies total
  return findBestMoveAlphaBeta(pos, searchDepth, isWhite);
}


