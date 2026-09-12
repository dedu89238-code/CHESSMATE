import { Move, PieceColor, Square, Board, PieceType, Piece } from '../types/chess';
import { isSquareAttacked, findKing, PIECE_VALUES, isInsideBoard, isKingInCheck } from './chessEngine';

export interface CommentContext {
  move: Move;
  prevBoard?: Board;
  board: Board;
  playerColor: PieceColor;
  inCheck: boolean;
  isCheckmate?: boolean;
  moveCount: number;
  lastCommentMoveNumber?: number;
  timestamp?: number;
}

interface CommentaryMemory {
  lastMoveNumber: number;
  lastTimestamp: number;
  lastCategory: string | null;
  recentMessages: string[];
}

const memory: CommentaryMemory = {
  lastMoveNumber: -10,
  lastTimestamp: 0,
  lastCategory: null,
  recentMessages: [],
};

export function resetCommentaryMemory(): void {
  memory.lastMoveNumber = -10;
  memory.lastTimestamp = 0;
  memory.lastCategory = null;
  memory.recentMessages = [];
}

// ---------------------------------------------------------------------------
// Context-Aware Chess Position Analyzers
// ---------------------------------------------------------------------------

interface AttackerInfo {
  square: Square;
  piece: Piece;
  value: number;
}

/**
 * Accurately finds all attacking pieces of `attackingColor` targeting `target`.
 */
function getDetailedAttackers(board: Board, target: Square, attackingColor: PieceColor): AttackerInfo[] {
  const attackers: AttackerInfo[] = [];
  const { row: tr, col: tc } = target;

  // 1. Pawns
  // White pawns at row tr + 1 move to tr; Black pawns at row tr - 1 move to tr
  const pawnRow = attackingColor === 'w' ? tr + 1 : tr - 1;
  if (pawnRow >= 0 && pawnRow < 8) {
    for (const pawnCol of [tc - 1, tc + 1]) {
      if (pawnCol >= 0 && pawnCol < 8) {
        const p = board[pawnRow][pawnCol];
        if (p && p.color === attackingColor && p.type === 'p') {
          attackers.push({ square: { row: pawnRow, col: pawnCol }, piece: p, value: PIECE_VALUES.p });
        }
      }
    }
  }

  // 2. Knights
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of knightOffsets) {
    const nr = tr + dr;
    const nc = tc + dc;
    if (isInsideBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.color === attackingColor && p.type === 'n') {
        attackers.push({ square: { row: nr, col: nc }, piece: p, value: PIECE_VALUES.n });
      }
    }
  }

  // 3. Straight rays (Rook & Queen)
  const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of straightDirs) {
    let cr = tr + dr;
    let cc = tc + dc;
    while (isInsideBoard(cr, cc)) {
      const p = board[cr][cc];
      if (p) {
        if (p.color === attackingColor && (p.type === 'r' || p.type === 'q')) {
          attackers.push({ square: { row: cr, col: cc }, piece: p, value: PIECE_VALUES[p.type] });
        }
        break;
      }
      cr += dr;
      cc += dc;
    }
  }

  // 4. Diagonal rays (Bishop & Queen)
  const diagonalDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of diagonalDirs) {
    let cr = tr + dr;
    let cc = tc + dc;
    while (isInsideBoard(cr, cc)) {
      const p = board[cr][cc];
      if (p) {
        if (p.color === attackingColor && (p.type === 'b' || p.type === 'q')) {
          attackers.push({ square: { row: cr, col: cc }, piece: p, value: PIECE_VALUES[p.type] });
        }
        break;
      }
      cr += dr;
      cc += dc;
    }
  }

  // 5. King
  const kingOffsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];
  for (const [dr, dc] of kingOffsets) {
    const kr = tr + dr;
    const kc = tc + dc;
    if (isInsideBoard(kr, kc)) {
      const p = board[kr][kc];
      if (p && p.color === attackingColor && p.type === 'k') {
        attackers.push({ square: { row: kr, col: kc }, piece: p, value: PIECE_VALUES.k });
      }
    }
  }

  return attackers;
}

/**
 * Finds all enemy targets attacked from `sq` by `pieceType` of `pieceColor`.
 */
function getAttackedEnemySquares(board: Board, sq: Square, pieceType: PieceType, pieceColor: PieceColor): Square[] {
  const oppColor: PieceColor = pieceColor === 'w' ? 'b' : 'w';
  const targets: Square[] = [];
  const { row: r, col: c } = sq;

  if (pieceType === 'p') {
    const dir = pieceColor === 'w' ? -1 : 1;
    const pr = r + dir;
    for (const pc of [c - 1, c + 1]) {
      if (isInsideBoard(pr, pc)) {
        const p = board[pr][pc];
        if (p && p.color === oppColor) {
          targets.push({ row: pr, col: pc });
        }
      }
    }
    return targets;
  }

  if (pieceType === 'n') {
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of offsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (isInsideBoard(nr, nc)) {
        const p = board[nr][nc];
        if (p && p.color === oppColor) targets.push({ row: nr, col: nc });
      }
    }
    return targets;
  }

  if (pieceType === 'r' || pieceType === 'q') {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      let cr = r + dr;
      let cc = c + dc;
      while (isInsideBoard(cr, cc)) {
        const p = board[cr][cc];
        if (p) {
          if (p.color === oppColor) targets.push({ row: cr, col: cc });
          break;
        }
        cr += dr;
        cc += dc;
      }
    }
  }

  if (pieceType === 'b' || pieceType === 'q') {
    const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of dirs) {
      let cr = r + dr;
      let cc = c + dc;
      while (isInsideBoard(cr, cc)) {
        const p = board[cr][cc];
        if (p) {
          if (p.color === oppColor) targets.push({ row: cr, col: cc });
          break;
        }
        cr += dr;
        cc += dc;
      }
    }
  }

  return targets;
}

/**
 * Checks if a specific piece on square `sq` is hanging:
 * - Attacked by opponent
 * - AND either completely undefended by friendly pieces OR attacked by a piece of strictly lower value.
 */
function checkPieceHanging(board: Board, sq: Square, piece: Piece): boolean {
  if (piece.type === 'k' || piece.type === 'p') return false;
  const oppColor: PieceColor = piece.color === 'w' ? 'b' : 'w';
  const attackers = getDetailedAttackers(board, sq, oppColor);
  if (attackers.length === 0) return false;

  const isDefended = isSquareAttacked(board, sq, piece.color);
  if (!isDefended) return true;

  // Even if defended, if attacked by a pawn (value 1) or minor piece against heavy piece
  const pieceVal = PIECE_VALUES[piece.type];
  const lowestAttackerVal = Math.min(...attackers.map(a => a.value));
  if (lowestAttackerVal < pieceVal && (pieceVal >= 5 || lowestAttackerVal === 1)) {
    return true;
  }

  return false;
}

/**
 * Checks for a hanging piece on the board.
 * Prioritizes the piece that just moved, then checks any newly hanging high-value piece.
 */
function findHangingPiece(
  board: Board,
  prevBoard: Board | undefined,
  move: Move,
  sideToCheck: PieceColor
): { type: PieceType; name: string; isMovedPiece: boolean } | null {
  const oppColor: PieceColor = sideToCheck === 'w' ? 'b' : 'w';

  // 1. Did the piece that just moved hang itself?
  if (move.piece.color === sideToCheck && move.piece.type !== 'k' && move.piece.type !== 'p') {
    if (checkPieceHanging(board, move.to, move.piece)) {
      const names: Record<PieceType, string> = {
        q: 'queen',
        r: 'rook',
        b: 'bishop',
        n: 'knight',
        p: 'pawn',
        k: 'king',
      };
      return { type: move.piece.type, name: names[move.piece.type], isMovedPiece: true };
    }
  }

  // 2. Did the move uncover or leave another piece hanging?
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== sideToCheck || p.type === 'k' || p.type === 'p') continue;
      const sq = { row: r, col: c };
      if (checkPieceHanging(board, sq, p)) {
        // Confirm it wasn't already hanging on prevBoard to avoid repeating
        const wasHangingBefore = prevBoard ? checkPieceHanging(prevBoard, sq, p) : false;
        if (!wasHangingBefore) {
          const names: Record<PieceType, string> = {
            q: 'queen',
            r: 'rook',
            b: 'bishop',
            n: 'knight',
            p: 'pawn',
            k: 'king',
          };
          return { type: p.type, name: names[p.type], isMovedPiece: false };
        }
      }
    }
  }

  return null;
}

/**
 * Accurately detects whether a king has become exposed.
 * Checks pawn shield weakening, uncastled center exposure, or opening of lines.
 */
function isKingExposedAfterMove(
  board: Board,
  prevBoard: Board | undefined,
  move: Move,
  kingColor: PieceColor
): boolean {
  const kingSq = findKing(board, kingColor);
  if (!kingSq) return false;
  const oppColor: PieceColor = kingColor === 'w' ? 'b' : 'w';

  // 1. Player/CAISSA moved their king away from safety without castling into central danger
  if (move.piece.color === kingColor && move.piece.type === 'k' && !move.isCastling) {
    const attackersAroundKing = getDetailedAttackers(board, kingSq, oppColor);
    if (attackersAroundKing.length > 0 || kingSq.row >= 2 && kingSq.row <= 5) {
      return true;
    }
  }

  // 2. Moving an f or g pawn near the king
  if (move.piece.color === kingColor && move.piece.type === 'p') {
    const distToKing = Math.max(Math.abs(move.from.row - kingSq.row), Math.abs(move.from.col - kingSq.col));
    if (distToKing <= 2) {
      // f or g file pawn push opening diagonals to king (e.g. e1-h4 or e8-h5 or a2-g8)
      if (move.from.col === 5 || move.from.col === 6 || move.from.col === 2) {
        // Check if opponent has Queen, Bishop, or Rook that can exploit this
        let hasRangedThreat = false;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === oppColor && (p.type === 'q' || p.type === 'b' || p.type === 'r')) {
              hasRangedThreat = true;
              break;
            }
          }
          if (hasRangedThreat) break;
        }
        if (hasRangedThreat) return true;
      }
    }
  }

  // 3. Pawn shield completely stripped in front of king
  const shieldRow = kingColor === 'w' ? kingSq.row - 1 : kingSq.row + 1;
  if (shieldRow >= 0 && shieldRow < 8 && (kingSq.col === 6 || kingSq.col === 2 || kingSq.col === 1)) {
    let pawnsInShield = 0;
    for (let c = Math.max(0, kingSq.col - 1); c <= Math.min(7, kingSq.col + 1); c++) {
      const p = board[shieldRow][c];
      if (p && p.color === kingColor && p.type === 'p') {
        pawnsInShield++;
      }
    }
    if (pawnsInShield === 0) {
      // Shield is missing, check if opponent has attacking pieces aimed at king sector
      const attackersNearKing = getDetailedAttackers(board, kingSq, oppColor);
      if (attackersNearKing.length > 0) return true;
    }
  }

  return false;
}

/**
 * Accurately detects when a dangerous coordinated attack develops against the enemy king.
 */
function isDangerousAttackDeveloping(board: Board, move: Move, attackingColor: PieceColor): boolean {
  const defenderColor: PieceColor = attackingColor === 'w' ? 'b' : 'w';
  const kingSq = findKing(board, defenderColor);
  if (!kingSq) return false;

  // Chebyshev distance from move.to to enemy king
  const dist = Math.max(Math.abs(move.to.row - kingSq.row), Math.abs(move.to.col - kingSq.col));
  if (dist > 2) return false;

  // Must be an attacking piece (Q, R, B, N)
  if (move.piece.type !== 'q' && move.piece.type !== 'r' && move.piece.type !== 'b' && move.piece.type !== 'n') {
    return false;
  }

  // Count attacking pieces exerting pressure in the 3x3 box surrounding the enemy king
  let attackingPressure = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = kingSq.row + dr;
      const nc = kingSq.col + dc;
      if (isInsideBoard(nr, nc)) {
        if (isSquareAttacked(board, { row: nr, col: nc }, attackingColor)) {
          attackingPressure++;
        }
      }
    }
  }

  return attackingPressure >= 3;
}

/**
 * Detects double attacks (forks) targeting 2+ high-value pieces (King, Queen, Rook, Bishop, Knight).
 */
function isDoubleAttackOrFork(board: Board, move: Move): boolean {
  const attackedSquares = getAttackedEnemySquares(board, move.to, move.piece.type, move.piece.color);
  const oppColor: PieceColor = move.piece.color === 'w' ? 'b' : 'w';

  // Count high-value targets (King, Queen, Rook, Bishop, Knight)
  const targets = attackedSquares.filter(sq => {
    const p = board[sq.row][sq.col];
    return p && p.color === oppColor && (p.type === 'k' || PIECE_VALUES[p.type] >= 3);
  });

  return targets.length >= 2;
}

/**
 * Detects discovered attacks: moving a piece unmasks a friendly ray piece (R, B, Q)
 * that now attacks an enemy King, Queen, or Rook.
 */
function isDiscoveredAttack(prevBoard: Board | undefined, board: Board, move: Move): boolean {
  if (!prevBoard) return false;
  const friendlyColor = move.piece.color;
  const oppColor: PieceColor = friendlyColor === 'w' ? 'b' : 'w';

  // Check 8 directions from move.from to see if a friendly slider was behind it
  const allDirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  for (const [dr, dc] of allDirs) {
    const isStraight = dr === 0 || dc === 0;
    // Look backwards from move.from
    let br = move.from.row - dr;
    let bc = move.from.col - dc;
    let sliderPiece: Piece | null = null;

    while (isInsideBoard(br, bc)) {
      const p = board[br][bc];
      if (p) {
        if (p.color === friendlyColor) {
          if (isStraight && (p.type === 'r' || p.type === 'q')) sliderPiece = p;
          if (!isStraight && (p.type === 'b' || p.type === 'q')) sliderPiece = p;
        }
        break;
      }
      br -= dr;
      bc -= dc;
    }

    if (!sliderPiece) continue;

    // Look forward from move.from in the new board
    let fr = move.from.row + dr;
    let fc = move.from.col + dc;
    while (isInsideBoard(fr, fc)) {
      const p = board[fr][fc];
      if (p) {
        if (p.color === oppColor && (p.type === 'k' || p.type === 'q' || p.type === 'r')) {
          // Verify that this was blocked on prevBoard
          const prevBlocking = prevBoard[move.from.row][move.from.col];
          if (prevBlocking) {
            return true;
          }
        }
        break;
      }
      fr += dr;
      fc += dc;
    }
  }

  return false;
}

/**
 * Detects a successful, active defense:
 * - Parried check or saved an attacked piece of value >= 3 to a safe or solidly defended square.
 */
function isSuccessfulDefense(prevBoard: Board | undefined, board: Board, move: Move): boolean {
  if (!prevBoard) return false;
  const defenderColor = move.piece.color;
  const oppColor: PieceColor = defenderColor === 'w' ? 'b' : 'w';

  // 1. King was in check on prevBoard and is now resolved
  const wasInCheck = isKingInCheck(prevBoard, defenderColor);
  const nowInCheck = isKingInCheck(board, defenderColor);
  if (wasInCheck && !nowInCheck) {
    return true;
  }

  // 2. High-value piece was attacked on move.from and moved to safety
  if (move.piece.type !== 'p' && move.piece.type !== 'k') {
    const wasAttacked = isSquareAttacked(prevBoard, move.from, oppColor);
    const nowAttacked = isSquareAttacked(board, move.to, oppColor);
    const nowDefended = isSquareAttacked(board, move.to, defenderColor);

    if (wasAttacked && (!nowAttacked || nowDefended)) {
      // Piece was under threat and successfully moved or blocked
      if (PIECE_VALUES[move.piece.type] >= 3) {
        return true;
      }
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Varied, Natural Chess Commentary Phrases
// ---------------------------------------------------------------------------

const PHRASES = {
  tactical_move: [
    'Sharp move.',
    'CAISSA sees the tactic.',
    'Surprising tactical move.',
    'A sharp tactical strike.',
    'Sharp double attack.',
  ],
  serious_threat: [
    'That move creates a serious threat.',
    'A dangerous threat is created.',
    'Sharp threat on the board.',
  ],
  blunder: [
    'Careful. A costly oversight.',
    'Careful. That leaves your piece vulnerable.',
    'That move drops material.',
    'A dangerous oversight.',
  ],
  won_material_player: [
    'You just won material.',
    'Clean win of material.',
    'Material gained.',
  ],
  won_material_caissa: [
    'CAISSA won material.',
    'CAISSA claims the piece.',
    'Material lost to CAISSA.',
  ],
  won_exchange_player: [
    'You have gained the exchange.',
    'Winning the exchange.',
  ],
  won_exchange_caissa: [
    'CAISSA has gained the exchange.',
    'CAISSA wins the exchange.',
  ],
  king_exposed_player: [
    'Careful. Your king is exposed.',
    "Your king's defense is weakened.",
    'Lines are opening toward your king.',
  ],
  king_exposed_caissa: [
    "CAISSA's king is exposed.",
    "CAISSA weakened its king's shelter.",
  ],
  attack_player: [
    'Your attack is gaining momentum.',
    'That move creates a serious threat.',
    'A dangerous attack is developing.',
  ],
  attack_caissa: [
    'CAISSA is mounting an attack.',
    'A dangerous attack develops.',
    'That move creates a serious threat.',
  ],
  defense: [
    'Excellent defense.',
    'Solid defense.',
    'Danger parried.',
    'Well defended.',
  ],
  strong_capture: [
    'Strong capture.',
    'Decisive capture.',
    'Accurate capture.',
  ],
  check_player: [
    'Check.',
    'Sharp check.',
    'Check delivered.',
  ],
  check_caissa: [
    'Check.',
    'CAISSA delivers check.',
    'Your king is under check.',
  ],
};

function pickVariedMessage(category: string, pool: string[]): string {
  // Avoid repeating any message currently in recentMessages
  const available = pool.filter(msg => !memory.recentMessages.includes(msg));
  const selectionPool = available.length > 0 ? available : pool;
  const chosen = selectionPool[Math.floor(Math.random() * selectionPool.length)];

  // Update memory
  memory.lastCategory = category;
  memory.recentMessages.push(chosen);
  if (memory.recentMessages.length > 8) {
    memory.recentMessages.shift();
  }

  return chosen;
}

// ---------------------------------------------------------------------------
// Main Evaluation Function
// ---------------------------------------------------------------------------

/**
 * Evaluates the move and returns a short, context-aware, strategically accurate comment
 * ONLY when something genuinely meaningful happens.
 * Returns `null` for ordinary moves to strictly prevent chat/toast spam.
 */
export function evaluateMoveForAutomaticComment(context: CommentContext): string | null {
  const {
    move,
    prevBoard,
    board,
    playerColor,
    inCheck,
    isCheckmate,
    moveCount,
    lastCommentMoveNumber,
    timestamp,
  } = context;

  const now = timestamp || Date.now();
  const isPlayerMove = move.piece.color === playerColor;
  const oppColor: PieceColor = isPlayerMove ? (playerColor === 'w' ? 'b' : 'w') : playerColor;

  // Cooldown calculation: moves since last comment
  const lastMoveNum = lastCommentMoveNumber ?? memory.lastMoveNumber;
  const movesSinceLast = moveCount - lastMoveNum;
  const timeSinceLast = now - memory.lastTimestamp;

  // 1. CHECKMATE (Immediate, bypasses cooldown)
  if (isCheckmate) {
    memory.lastMoveNumber = moveCount;
    memory.lastTimestamp = now;
    return isPlayerMove ? 'Checkmate. Excellent victory.' : 'Checkmate. Game over.';
  }

  // Minimum time cooldown: at least 4.5 seconds between toasts to prevent stacking
  if (timeSinceLast < 4500) {
    return null;
  }

  // 2. CHECK FOR WINNING THE EXCHANGE (Rook for Minor Piece)
  // Gaining a Rook (5) with a Bishop or Knight (3) is mathematically winning the exchange.
  if (move.captured && move.captured.type === 'r' && (move.piece.type === 'b' || move.piece.type === 'n')) {
    if (movesSinceLast >= 2) {
      memory.lastMoveNumber = moveCount;
      memory.lastTimestamp = now;
      return isPlayerMove
        ? pickVariedMessage('won_exchange_player', PHRASES.won_exchange_player)
        : pickVariedMessage('won_exchange_caissa', PHRASES.won_exchange_caissa);
    }
  }

  // 3. CHECK FOR WINNING MATERIAL (Clean Capture of Undefended Piece or Queen)
  if (move.captured && prevBoard) {
    const capType = move.captured.type;
    const moveType = move.piece.type;
    const wasDefended = isSquareAttacked(prevBoard, move.to, oppColor);
    const isProfitable = PIECE_VALUES[capType] > PIECE_VALUES[moveType] || !wasDefended;

    if (isProfitable && PIECE_VALUES[capType] >= 3) {
      if (movesSinceLast >= 2) {
        memory.lastMoveNumber = moveCount;
        memory.lastTimestamp = now;
        if (isPlayerMove) {
          if (capType === 'q') return "You captured CAISSA's queen.";
          return pickVariedMessage('won_material_player', PHRASES.won_material_player);
        } else {
          if (capType === 'q') return 'CAISSA captured your queen.';
          return pickVariedMessage('won_material_caissa', PHRASES.won_material_caissa);
        }
      }
    }
  }

  // 4. CHECK FOR A PIECE HANGING / SERIOUS BLUNDER
  // Check if player or CAISSA left a piece hanging
  const playerHanging = findHangingPiece(board, prevBoard, move, playerColor);
  const caissaHanging = findHangingPiece(board, prevBoard, move, oppColor);

  if (playerHanging && isPlayerMove) {
    // Player just hung a piece! (Blunder)
    if (movesSinceLast >= 2) {
      memory.lastMoveNumber = moveCount;
      memory.lastTimestamp = now;
      if (playerHanging.type === 'n') return 'That knight is hanging.';
      if (playerHanging.type === 'b') return 'That bishop is hanging.';
      if (playerHanging.type === 'r') return 'That rook is hanging.';
      if (playerHanging.type === 'q') return 'Careful. Your queen is exposed.';
      return pickVariedMessage('blunder', PHRASES.blunder);
    }
  }

  if (caissaHanging && !isPlayerMove) {
    // CAISSA left a piece hanging (Opportunity for player)
    if (movesSinceLast >= 3 && memory.lastCategory !== 'caissa_hanging') {
      memory.lastMoveNumber = moveCount;
      memory.lastTimestamp = now;
      if (caissaHanging.type === 'n') return 'That knight is hanging.';
      if (caissaHanging.type === 'b') return 'That bishop is hanging.';
      if (caissaHanging.type === 'r') return 'That rook is hanging.';
      return 'That piece is hanging.';
    }
  }

  // Strict routine cooldown for tactical and positional messages: at least 3 plies
  if (movesSinceLast < 3) {
    return null;
  }

  // 5. STRONG TACTICAL MOVE: Fork / Double Attack or Discovered Attack
  const isFork = isDoubleAttackOrFork(board, move);
  const isDiscovery = isDiscoveredAttack(prevBoard, board, move);

  if (isFork || isDiscovery) {
    if (memory.lastCategory !== 'tactical_move') {
      memory.lastMoveNumber = moveCount;
      memory.lastTimestamp = now;
      return pickVariedMessage('tactical_move', PHRASES.tactical_move);
    }
  }

  // 6. KING EXPOSED
  const playerKingExposed = isKingExposedAfterMove(board, prevBoard, move, playerColor);
  const caissaKingExposed = isKingExposedAfterMove(board, prevBoard, move, oppColor);

  if (playerKingExposed && isPlayerMove && memory.lastCategory !== 'king_exposed_player') {
    memory.lastMoveNumber = moveCount;
    memory.lastTimestamp = now;
    return pickVariedMessage('king_exposed_player', PHRASES.king_exposed_player);
  }

  if (caissaKingExposed && !isPlayerMove && memory.lastCategory !== 'king_exposed_caissa') {
    memory.lastMoveNumber = moveCount;
    memory.lastTimestamp = now;
    return pickVariedMessage('king_exposed_caissa', PHRASES.king_exposed_caissa);
  }

  // 7. DANGEROUS ATTACK DEVELOPING
  const attackDeveloping = isDangerousAttackDeveloping(board, move, move.piece.color);
  if (attackDeveloping && memory.lastCategory !== 'attack') {
    memory.lastMoveNumber = moveCount;
    memory.lastTimestamp = now;
    return isPlayerMove
      ? pickVariedMessage('attack_player', PHRASES.attack_player)
      : pickVariedMessage('attack_caissa', PHRASES.attack_caissa);
  }

  // 8. SUCCESSFUL DEFENSE
  if (isPlayerMove && isSuccessfulDefense(prevBoard, board, move)) {
    if (memory.lastCategory !== 'defense') {
      memory.lastMoveNumber = moveCount;
      memory.lastTimestamp = now;
      return pickVariedMessage('defense', PHRASES.defense);
    }
  }

  // 9. STRONG CAPTURE
  if (move.captured && PIECE_VALUES[move.captured.type] >= 3) {
    if (memory.lastCategory !== 'strong_capture') {
      memory.lastMoveNumber = moveCount;
      memory.lastTimestamp = now;
      return pickVariedMessage('strong_capture', PHRASES.strong_capture);
    }
  }

  // 10. CHECK DELIVERED
  if (inCheck) {
    if (memory.lastCategory !== 'check') {
      memory.lastMoveNumber = moveCount;
      memory.lastTimestamp = now;
      return isPlayerMove
        ? pickVariedMessage('check_player', PHRASES.check_player)
        : pickVariedMessage('check_caissa', PHRASES.check_caissa);
    }
  }

  // Ordinary move: strictly return null (no comment, zero spam)
  return null;
}
