import { Board, Move, Piece, PieceColor, PieceType, Square } from '../types/chess';
import {
  ChessPosition,
  findKing,
  getLegalMoves,
  isInsideBoard,
  isKingInCheck,
  isSquareAttacked,
  makeMove,
  PIECE_VALUES,
  squareToCoord,
} from './chessEngine';

// 6-zone classification for CAISSA strength:
// 1–15%: BEGINNER, 16–35%: DEVELOPING, 36–55%: INTERMEDIATE, 56–75%: ADVANCED, 76–90%: EXPERT, 91–100%: MASTER
function getZoneName(strength: number): string {
  const s = Math.max(1, Math.min(100, Math.round(strength)));
  if (s <= 15) return 'Beginner';
  if (s <= 35) return 'Developing';
  if (s <= 55) return 'Intermediate';
  if (s <= 75) return 'Advanced';
  if (s <= 90) return 'Expert';
  return 'Master';
}

export interface PieceDetail {
  type: PieceType;
  color: PieceColor;
  square: string;
  isDefended: boolean;
  attackers: string[];
}

export interface TacticalThreat {
  type: 'hanging' | 'fork' | 'pin' | 'mate' | 'check';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface DetailedPositionAnalysis {
  fen: string;
  turn: PieceColor;
  turnName: string;
  playerColor: PieceColor;
  isPlayerTurn: boolean;
  fullmoveNumber: number;
  lastMoveSan: string | null;
  lastMoveDetail: {
    san: string;
    from: string;
    to: string;
    piece: string;
    isCapture: boolean;
    captured?: string;
  } | null;

  // Status
  inCheck: boolean;
  caissaInCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;

  // Legal moves
  legalMovesCount: number;
  keyLegalMovesSan: string[];

  // Material
  whiteMaterial: number;
  blackMaterial: number;
  materialDiff: number; // positive = player advantage, negative = caissa advantage
  materialSummary: string;
  capturedByPlayer: PieceType[];
  capturedByCaissa: PieceType[];

  // King safety
  playerKing: {
    square: string;
    isCastled: boolean;
    inCheck: boolean;
    attackers: string[];
    pawnShield: 'intact' | 'weakened' | 'open';
    safetyAssessment: string;
  };
  caissaKing: {
    square: string;
    isCastled: boolean;
    inCheck: boolean;
    attackers: string[];
    pawnShield: 'intact' | 'weakened' | 'open';
  };

  // Castling
  castling: {
    playerCanCastleKingsideNow: boolean;
    playerCanCastleQueensideNow: boolean;
    playerKingsideReason: string;
    playerQueensideReason: string;
    caissaCanCastleKingside: boolean;
    caissaCanCastleQueenside: boolean;
  };

  // Special conditions
  enPassant: {
    available: boolean;
    targetSquare: string | null;
    capturingPawns: string[];
  };
  promotion: {
    playerCanPromoteNow: boolean;
    caissaCanPromoteNow: boolean;
    threats: string[];
  };

  // Tactical Threats
  threatsToPlayer: TacticalThreat[];
  opportunitiesForPlayer: TacticalThreat[];
  hangingPiecesPlayer: string[];
  hangingPiecesCaissa: string[];

  // AI Strength
  caissaStrength: {
    percentage: number;
    zoneName: string;
  };

  // Overall recommendation & summary
  positionAssessment: string;
  recommendedAction: string;
}

// Convert ChessPosition to FEN notation
export function positionToFen(pos: ChessPosition): string {
  const ranks: string[] = [];

  for (let r = 0; r < 8; r++) {
    let emptyCount = 0;
    let rankStr = '';
    for (let c = 0; c < 8; c++) {
      const piece = pos.board[r][c];
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rankStr += emptyCount;
          emptyCount = 0;
        }
        const char = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
        rankStr += char;
      }
    }
    if (emptyCount > 0) {
      rankStr += emptyCount;
    }
    ranks.push(rankStr);
  }

  const piecePlacement = ranks.join('/');
  const activeColor = pos.turn;

  let castlingStr = '';
  if (pos.castling.w.kingside) castlingStr += 'K';
  if (pos.castling.w.queenside) castlingStr += 'Q';
  if (pos.castling.b.kingside) castlingStr += 'k';
  if (pos.castling.b.queenside) castlingStr += 'q';
  if (!castlingStr) castlingStr = '-';

  const epStr = pos.enPassant ? squareToCoord(pos.enPassant.row, pos.enPassant.col) : '-';
  const halfmove = pos.halfmoveClock ?? 0;
  const fullmove = pos.fullmoveNumber ?? 1;

  return `${piecePlacement} ${activeColor} ${castlingStr} ${epStr} ${halfmove} ${fullmove}`;
}

// Identify exact attackers on a specific square
export function getAttackersList(board: Board, target: Square, attackingColor: PieceColor): string[] {
  const attackers: string[] = [];
  const { row: tr, col: tc } = target;

  // 1. Pawns
  const pawnDir = attackingColor === 'w' ? 1 : -1;
  const pawnRow = tr + pawnDir;
  if (pawnRow >= 0 && pawnRow < 8) {
    for (const pawnCol of [tc - 1, tc + 1]) {
      if (pawnCol >= 0 && pawnCol < 8) {
        const piece = board[pawnRow][pawnCol];
        if (piece && piece.color === attackingColor && piece.type === 'p') {
          attackers.push(`${attackingColor === 'w' ? 'White' : 'Black'} Pawn on ${squareToCoord(pawnRow, pawnCol)}`);
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
      const piece = board[nr][nc];
      if (piece && piece.color === attackingColor && piece.type === 'n') {
        attackers.push(`${attackingColor === 'w' ? 'White' : 'Black'} Knight on ${squareToCoord(nr, nc)}`);
      }
    }
  }

  // 3. Straight rays (Rook & Queen)
  const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of straightDirs) {
    let currR = tr + dr;
    let currC = tc + dc;
    while (isInsideBoard(currR, currC)) {
      const piece = board[currR][currC];
      if (piece) {
        if (piece.color === attackingColor && (piece.type === 'r' || piece.type === 'q')) {
          const typeName = piece.type === 'q' ? 'Queen' : 'Rook';
          attackers.push(`${attackingColor === 'w' ? 'White' : 'Black'} ${typeName} on ${squareToCoord(currR, currC)}`);
        }
        break;
      }
      currR += dr;
      currC += dc;
    }
  }

  // 4. Diagonal rays (Bishop & Queen)
  const diagonalDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of diagonalDirs) {
    let currR = tr + dr;
    let currC = tc + dc;
    while (isInsideBoard(currR, currC)) {
      const piece = board[currR][currC];
      if (piece) {
        if (piece.color === attackingColor && (piece.type === 'b' || piece.type === 'q')) {
          const typeName = piece.type === 'q' ? 'Queen' : 'Bishop';
          attackers.push(`${attackingColor === 'w' ? 'White' : 'Black'} ${typeName} on ${squareToCoord(currR, currC)}`);
        }
        break;
      }
      currR += dr;
      currC += dc;
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
      const piece = board[kr][kc];
      if (piece && piece.color === attackingColor && piece.type === 'k') {
        attackers.push(`${attackingColor === 'w' ? 'White' : 'Black'} King on ${squareToCoord(kr, kc)}`);
      }
    }
  }

  return attackers;
}

// Compute captured pieces directly from the board state
export function computeCapturedFromBoard(board: Board): {
  whiteCaptured: PieceType[]; // Black pieces that were taken by White
  blackCaptured: PieceType[]; // White pieces that were taken by Black
} {
  const initialCounts: Record<PieceColor, Record<PieceType, number>> = {
    w: { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 },
    b: { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 },
  };

  const currentCounts: Record<PieceColor, Record<PieceType, number>> = {
    w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
    b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
  };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        currentCounts[piece.color][piece.type]++;
      }
    }
  }

  const whiteCaptured: PieceType[] = [];
  const blackCaptured: PieceType[] = [];

  const types: PieceType[] = ['q', 'r', 'b', 'n', 'p'];
  for (const type of types) {
    const missingBlack = Math.max(0, initialCounts.b[type] - currentCounts.b[type]);
    for (let i = 0; i < missingBlack; i++) whiteCaptured.push(type);

    const missingWhite = Math.max(0, initialCounts.w[type] - currentCounts.w[type]);
    for (let i = 0; i < missingWhite; i++) blackCaptured.push(type);
  }

  return { whiteCaptured, blackCaptured };
}

// Analyze King Pawn Shield
function evaluatePawnShield(board: Board, kingSq: Square, color: PieceColor): 'intact' | 'weakened' | 'open' {
  const homeRank = color === 'w' ? 7 : 0;
  const shieldRank = color === 'w' ? 6 : 1;

  // If king is in the center (col 3, 4)
  if (kingSq.col >= 3 && kingSq.col <= 4) {
    // Check if e or d file pawns are still on starting squares
    const p1 = board[shieldRank][3];
    const p2 = board[shieldRank][4];
    if (p1 && p2 && p1.color === color && p2.color === color) return 'intact';
    if ((p1 && p1.color === color) || (p2 && p2.color === color)) return 'weakened';
    return 'open';
  }

  // If castled kingside (col 6)
  if (kingSq.col >= 5) {
    let pawnsInPlace = 0;
    for (let col = 5; col <= 7; col++) {
      const p = board[shieldRank][col];
      if (p && p.color === color && p.type === 'p') {
        pawnsInPlace++;
      }
    }
    if (pawnsInPlace === 3) return 'intact';
    if (pawnsInPlace >= 1) return 'weakened';
    return 'open';
  }

  // If castled queenside (col 1, 2)
  let pawnsInPlace = 0;
  for (let col = 0; col <= 2; col++) {
    const p = board[shieldRank][col];
    if (p && p.color === color && p.type === 'p') {
      pawnsInPlace++;
    }
  }
  if (pawnsInPlace === 3) return 'intact';
  if (pawnsInPlace >= 1) return 'weakened';
  return 'open';
}

// Detailed Comprehensive Position Analysis
export function getDetailedPositionAnalysis(
  pos: ChessPosition,
  playerColor: PieceColor,
  lastMove: Move | null,
  moveHistory: Move[],
  aiStrength: number
): DetailedPositionAnalysis {
  const opponentColor: PieceColor = playerColor === 'w' ? 'b' : 'w';
  const board = pos.board;
  const fen = positionToFen(pos);

  // Check & Legal Moves
  const playerInCheck = isKingInCheck(board, playerColor);
  const caissaInCheck = isKingInCheck(board, opponentColor);
  const legalMoves = getLegalMoves(pos);
  const isCheckmate = legalMoves.length === 0 && isKingInCheck(board, pos.turn);
  const isStalemate = legalMoves.length === 0 && !isKingInCheck(board, pos.turn);

  // Material
  let whiteMaterial = 0;
  let blackMaterial = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        const val = PIECE_VALUES[p.type];
        if (p.color === 'w') whiteMaterial += val;
        else blackMaterial += val;
      }
    }
  }

  const playerMat = playerColor === 'w' ? whiteMaterial : blackMaterial;
  const caissaMat = playerColor === 'w' ? blackMaterial : whiteMaterial;
  const materialDiff = playerMat - caissaMat;

  let materialSummary = 'Material is exactly equal (0).';
  if (materialDiff > 0) {
    materialSummary = `You are ahead by +${materialDiff} points of material.`;
  } else if (materialDiff < 0) {
    materialSummary = `CAISSA is ahead by +${Math.abs(materialDiff)} points of material.`;
  }

  const { whiteCaptured, blackCaptured } = computeCapturedFromBoard(board);
  const capturedByPlayer = playerColor === 'w' ? whiteCaptured : blackCaptured;
  const capturedByCaissa = playerColor === 'w' ? blackCaptured : whiteCaptured;

  // Kings
  const playerKingSq = findKing(board, playerColor) || { row: playerColor === 'w' ? 7 : 0, col: 4 };
  const caissaKingSq = findKing(board, opponentColor) || { row: opponentColor === 'w' ? 7 : 0, col: 4 };

  const playerKingCoord = squareToCoord(playerKingSq.row, playerKingSq.col);
  const caissaKingCoord = squareToCoord(caissaKingSq.row, caissaKingSq.col);

  const playerKingAttackers = getAttackersList(board, playerKingSq, opponentColor);
  const caissaKingAttackers = getAttackersList(board, caissaKingSq, playerColor);

  const playerCastled = playerKingSq.col === 6 || playerKingSq.col === 2 || playerKingSq.col === 1;
  const caissaCastled = caissaKingSq.col === 6 || caissaKingSq.col === 2 || caissaKingSq.col === 1;

  const playerPawnShield = evaluatePawnShield(board, playerKingSq, playerColor);
  const caissaPawnShield = evaluatePawnShield(board, caissaKingSq, opponentColor);

  let playerSafetyAssessment = 'Your king is secure.';
  if (playerInCheck) {
    playerSafetyAssessment = `Your King is currently under CHECK by ${playerKingAttackers.join(' and ')}!`;
  } else if (playerKingAttackers.length > 0) {
    playerSafetyAssessment = `Warning: Enemy pieces are exerting pressure toward your King square (${playerKingCoord}).`;
  } else if (!playerCastled && pos.fullmoveNumber > 7) {
    playerSafetyAssessment = 'Your King remains in the center. Prioritize castling to reach safety.';
  } else if (playerPawnShield === 'open') {
    playerSafetyAssessment = 'Your King pawn shield is broken or opened up, creating vulnerable diagonals.';
  }

  // Castling Rights
  const playerRights = pos.castling[playerColor];
  const canCastleKingsideLegal = legalMoves.some(m => m.isCastling && m.to.col === 6);
  const canCastleQueensideLegal = legalMoves.some(m => m.isCastling && m.to.col === 2);

  // Diagnose exact reasons if cannot castle
  let playerKingsideReason = 'Available right now.';
  if (!canCastleKingsideLegal) {
    if (!playerRights.kingside) {
      playerKingsideReason = 'Lost rights: King or kingside Rook has already moved.';
    } else if (playerInCheck) {
      playerKingsideReason = 'Cannot castle while currently in check.';
    } else {
      const row = playerColor === 'w' ? 7 : 0;
      if (board[row][5] || board[row][6]) {
        playerKingsideReason = 'Squares between King and Rook are not empty.';
      } else if (isSquareAttacked(board, { row, col: 5 }, opponentColor)) {
        playerKingsideReason = 'Transit square (f1/f8) is attacked by enemy piece.';
      } else if (isSquareAttacked(board, { row, col: 6 }, opponentColor)) {
        playerKingsideReason = 'Destination square (g1/g8) is attacked by enemy piece.';
      } else {
        playerKingsideReason = 'Castling condition not met.';
      }
    }
  }

  let playerQueensideReason = 'Available right now.';
  if (!canCastleQueensideLegal) {
    if (!playerRights.queenside) {
      playerQueensideReason = 'Lost rights: King or queenside Rook has already moved.';
    } else if (playerInCheck) {
      playerQueensideReason = 'Cannot castle while currently in check.';
    } else {
      const row = playerColor === 'w' ? 7 : 0;
      if (board[row][1] || board[row][2] || board[row][3]) {
        playerQueensideReason = 'Squares between King and Rook are not empty.';
      } else if (isSquareAttacked(board, { row, col: 3 }, opponentColor)) {
        playerQueensideReason = 'Transit square (d1/d8) is attacked by enemy piece.';
      } else if (isSquareAttacked(board, { row, col: 2 }, opponentColor)) {
        playerQueensideReason = 'Destination square (c1/c8) is attacked by enemy piece.';
      } else {
        playerQueensideReason = 'Castling condition not met.';
      }
    }
  }

  // En Passant
  let epAvailable = false;
  let epSquareStr: string | null = null;
  const epCapturingPawns: string[] = [];

  if (pos.enPassant) {
    epSquareStr = squareToCoord(pos.enPassant.row, pos.enPassant.col);
    // Find if player has a pawn that can capture it
    const pawnRow = pos.enPassant.row + (pos.turn === 'w' ? 1 : -1);
    for (const c of [pos.enPassant.col - 1, pos.enPassant.col + 1]) {
      if (c >= 0 && c < 8 && pawnRow >= 0 && pawnRow < 8) {
        const piece = board[pawnRow][c];
        if (piece && piece.color === pos.turn && piece.type === 'p') {
          epAvailable = true;
          epCapturingPawns.push(squareToCoord(pawnRow, c));
        }
      }
    }
  }

  // Promotion
  const promoRow = playerColor === 'w' ? 1 : 6;
  let playerCanPromoteNow = false;
  const promoThreats: string[] = [];
  for (let c = 0; c < 8; c++) {
    const p = board[promoRow][c];
    if (p && p.color === playerColor && p.type === 'p') {
      playerCanPromoteNow = true;
      promoThreats.push(`Your pawn on ${squareToCoord(promoRow, c)} is one rank away from promotion.`);
    }
  }

  const oppPromoRow = opponentColor === 'w' ? 1 : 6;
  let caissaCanPromoteNow = false;
  for (let c = 0; c < 8; c++) {
    const p = board[oppPromoRow][c];
    if (p && p.color === opponentColor && p.type === 'p') {
      caissaCanPromoteNow = true;
      promoThreats.push(`CAISSA's pawn on ${squareToCoord(oppPromoRow, c)} is one rank away from promotion!`);
    }
  }

  // Tactical Threats & Hanging Pieces
  const hangingPlayerPieces: string[] = [];
  const hangingCaissaPieces: string[] = [];
  const threatsToPlayer: TacticalThreat[] = [];
  const opportunitiesForPlayer: TacticalThreat[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.type === 'k') continue;

      const sq = { row: r, col: c };
      const coord = squareToCoord(r, c);
      const isAttackedByOpp = isSquareAttacked(board, sq, opponentColor);
      const isDefendedByPlayer = isSquareAttacked(board, sq, playerColor);

      const isAttackedByPlayer = isSquareAttacked(board, sq, playerColor);
      const isDefendedByOpp = isSquareAttacked(board, sq, opponentColor);

      if (piece.color === playerColor) {
        // Player's piece
        if (isAttackedByOpp && !isDefendedByPlayer) {
          const attackers = getAttackersList(board, sq, opponentColor);
          const pieceName = piece.type === 'q' ? 'Queen' : piece.type === 'r' ? 'Rook' : piece.type === 'b' ? 'Bishop' : piece.type === 'n' ? 'Knight' : 'Pawn';
          hangingPlayerPieces.push(`${pieceName} on ${coord}`);
          threatsToPlayer.push({
            type: 'hanging',
            description: `Your ${pieceName} on ${coord} is undefended and attacked by ${attackers[0] || 'CAISSA'}.`,
            severity: piece.type === 'q' || piece.type === 'r' ? 'high' : 'medium',
          });
        }
      } else {
        // CAISSA's piece
        if (isAttackedByPlayer && !isDefendedByOpp) {
          const pieceName = piece.type === 'q' ? 'Queen' : piece.type === 'r' ? 'Rook' : piece.type === 'b' ? 'Bishop' : piece.type === 'n' ? 'Knight' : 'Pawn';
          hangingCaissaPieces.push(`${pieceName} on ${coord}`);
          opportunitiesForPlayer.push({
            type: 'hanging',
            description: `CAISSA's ${pieceName} on ${coord} is completely undefended! You can capture it.`,
            severity: piece.type === 'q' || piece.type === 'r' ? 'high' : 'medium',
          });
        }
      }
    }
  }

  // Check if player is in check
  if (playerInCheck) {
    threatsToPlayer.unshift({
      type: 'check',
      description: `Your King is in check from ${playerKingAttackers.join(', ')}!`,
      severity: 'high',
    });
  }

  // Key Legal Moves
  const keyLegalMovesSan = legalMoves.slice(0, 8).map(m => m.san);

  // Overall recommendation
  let positionAssessment = 'The position is balanced with equal chances.';
  let recommendedAction = 'Continue developing pieces, control central files, and keep your King safe.';

  if (isCheckmate) {
    positionAssessment = pos.turn === playerColor ? 'Checkmate. CAISSA has won.' : 'Checkmate! You have defeated CAISSA!';
    recommendedAction = 'Game concluded.';
  } else if (isStalemate) {
    positionAssessment = 'Stalemate. The game is drawn.';
    recommendedAction = 'Game concluded.';
  } else if (playerInCheck) {
    positionAssessment = 'Your King is under direct check!';
    recommendedAction = 'Defend immediately: capture the checking piece, block the line of sight, or move your King to safety.';
  } else if (hangingPlayerPieces.length > 0) {
    positionAssessment = `Tactical threat: You have undefended material (${hangingPlayerPieces.join(', ')}).`;
    recommendedAction = `Safeguard your ${hangingPlayerPieces[0]} by retreating it or defending it with another piece.`;
  } else if (hangingCaissaPieces.length > 0) {
    positionAssessment = `Tactical opportunity: CAISSA has left piece(s) undefended (${hangingCaissaPieces.join(', ')}).`;
    recommendedAction = `Look for a clean capture on ${hangingCaissaPieces[0]}.`;
  } else if (!playerCastled && (canCastleKingsideLegal || canCastleQueensideLegal)) {
    positionAssessment = 'Your position is solid, but your King is still in the center.';
    recommendedAction = 'Castle now to tuck your King into safety and connect your Rooks.';
  } else if (materialDiff > 2) {
    positionAssessment = `You hold a material advantage of +${materialDiff}.`;
    recommendedAction = 'Trade pieces (not pawns) to simplify into a comfortably winning endgame.';
  } else if (materialDiff < -2) {
    positionAssessment = `CAISSA holds a material advantage of +${Math.abs(materialDiff)}.`;
    recommendedAction = 'Avoid passive trades; create counterplay against CAISSA\'s king or seek tactical swindles.';
  }

  const zoneName = getZoneName(aiStrength);

  return {
    fen,
    turn: pos.turn,
    turnName: pos.turn === 'w' ? 'White' : 'Black',
    playerColor,
    isPlayerTurn: pos.turn === playerColor,
    fullmoveNumber: pos.fullmoveNumber,
    lastMoveSan: lastMove?.san || null,
    lastMoveDetail: lastMove
      ? {
          san: lastMove.san,
          from: squareToCoord(lastMove.from.row, lastMove.from.col),
          to: squareToCoord(lastMove.to.row, lastMove.to.col),
          piece: lastMove.piece.type.toUpperCase(),
          isCapture: Boolean(lastMove.captured),
          captured: lastMove.captured ? lastMove.captured.type.toUpperCase() : undefined,
        }
      : null,
    inCheck: playerInCheck,
    caissaInCheck,
    isCheckmate,
    isStalemate,
    legalMovesCount: legalMoves.length,
    keyLegalMovesSan,
    whiteMaterial,
    blackMaterial,
    materialDiff,
    materialSummary,
    capturedByPlayer,
    capturedByCaissa,
    playerKing: {
      square: playerKingCoord,
      isCastled: playerCastled,
      inCheck: playerInCheck,
      attackers: playerKingAttackers,
      pawnShield: playerPawnShield,
      safetyAssessment: playerSafetyAssessment,
    },
    caissaKing: {
      square: caissaKingCoord,
      isCastled: caissaCastled,
      inCheck: caissaInCheck,
      attackers: caissaKingAttackers,
      pawnShield: caissaPawnShield,
    },
    castling: {
      playerCanCastleKingsideNow: canCastleKingsideLegal,
      playerCanCastleQueensideNow: canCastleQueensideLegal,
      playerKingsideReason,
      playerQueensideReason,
      caissaCanCastleKingside: pos.castling[opponentColor].kingside,
      caissaCanCastleQueenside: pos.castling[opponentColor].queenside,
    },
    enPassant: {
      available: epAvailable,
      targetSquare: epSquareStr,
      capturingPawns: epCapturingPawns,
    },
    promotion: {
      playerCanPromoteNow,
      caissaCanPromoteNow,
      threats: promoThreats,
    },
    threatsToPlayer,
    opportunitiesForPlayer,
    hangingPiecesPlayer: hangingPlayerPieces,
    hangingPiecesCaissa: hangingCaissaPieces,
    caissaStrength: {
      percentage: aiStrength,
      zoneName,
    },
    positionAssessment,
    recommendedAction,
  };
}
