import { Board, Move, Piece, PieceColor, PieceType, Square } from '../types/chess';

export interface CastlingRights {
  w: { kingside: boolean; queenside: boolean };
  b: { kingside: boolean; queenside: boolean };
}

export interface ChessPosition {
  board: Board;
  turn: PieceColor;
  castling: CastlingRights;
  enPassant: Square | null; // target square behind double-pushed pawn
  halfmoveClock: number; // for 50-move rule
  fullmoveNumber: number;
}

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Back rank pieces
  const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

  for (let c = 0; c < 8; c++) {
    // Black back rank (row 0)
    board[0][c] = { type: backRank[c], color: 'b' };
    // Black pawns (row 1)
    board[1][c] = { type: 'p', color: 'b' };

    // White pawns (row 6)
    board[6][c] = { type: 'p', color: 'w' };
    // White back rank (row 7)
    board[7][c] = { type: backRank[c], color: 'w' };
  }

  return board;
}

export function createInitialPosition(): ChessPosition {
  return {
    board: createInitialBoard(),
    turn: 'w',
    castling: {
      w: { kingside: true, queenside: true },
      b: { kingside: true, queenside: true },
    },
    enPassant: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
  };
}

export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(piece => (piece ? { ...piece } : null)));
}

export function clonePosition(pos: ChessPosition): ChessPosition {
  return {
    board: cloneBoard(pos.board),
    turn: pos.turn,
    castling: {
      w: { ...pos.castling.w },
      b: { ...pos.castling.b },
    },
    enPassant: pos.enPassant ? { ...pos.enPassant } : null,
    halfmoveClock: pos.halfmoveClock,
    fullmoveNumber: pos.fullmoveNumber,
  };
}

export function squareToCoord(row: number, col: number): string {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = 8 - row;
  return `${file}${rank}`;
}

export function coordToSquare(coord: string): Square {
  const col = coord.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(coord[1], 10);
  return { row, col };
}

export function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

export function findKing(board: Board, color: PieceColor): Square | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k' && piece.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function isSquareAttacked(board: Board, target: Square, attackingColor: PieceColor): boolean {
  const { row: tr, col: tc } = target;

  // 1. Pawn attacks
  const pawnDir = attackingColor === 'w' ? 1 : -1; // attacking White pawn moves up (-1 in rank, so +1 in row index)
  const pawnRow = tr + pawnDir;
  if (pawnRow >= 0 && pawnRow < 8) {
    for (const pawnCol of [tc - 1, tc + 1]) {
      if (pawnCol >= 0 && pawnCol < 8) {
        const piece = board[pawnRow][pawnCol];
        if (piece && piece.color === attackingColor && piece.type === 'p') {
          return true;
        }
      }
    }
  }

  // 2. Knight attacks
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  for (const [dr, dc] of knightOffsets) {
    const nr = tr + dr;
    const nc = tc + dc;
    if (isInsideBoard(nr, nc)) {
      const piece = board[nr][nc];
      if (piece && piece.color === attackingColor && piece.type === 'n') {
        return true;
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
          return true;
        }
        break; // blocked
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
          return true;
        }
        break; // blocked
      }
      currR += dr;
      currC += dc;
    }
  }

  // 5. King attacks (adjacent squares)
  const kingOffsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  for (const [dr, dc] of kingOffsets) {
    const kr = tr + dr;
    const kc = tc + dc;
    if (isInsideBoard(kr, kc)) {
      const piece = board[kr][kc];
      if (piece && piece.color === attackingColor && piece.type === 'k') {
        return true;
      }
    }
  }

  return false;
}

export function isKingInCheck(board: Board, color: PieceColor): boolean {
  const kingSq = findKing(board, color);
  if (!kingSq) return false;
  const opponentColor: PieceColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, kingSq, opponentColor);
}

// Generates pseudo-legal moves for a piece at square
function getPseudoLegalMoves(pos: ChessPosition, from: Square): Move[] {
  const { board, castling, enPassant } = pos;
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const moves: Move[] = [];
  const color = piece.color;
  const opponentColor: PieceColor = color === 'w' ? 'b' : 'w';
  const r = from.row;
  const c = from.col;

  // PAWN
  if (piece.type === 'p') {
    const forward = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    const promoRow = color === 'w' ? 0 : 7;

    // 1-step forward
    const f1Row = r + forward;
    if (isInsideBoard(f1Row, c) && !board[f1Row][c]) {
      if (f1Row === promoRow) {
        // Promotion options
        const promoTypes: PieceType[] = ['q', 'r', 'b', 'n'];
        for (const pt of promoTypes) {
          moves.push({
            from,
            to: { row: f1Row, col: c },
            piece,
            promotion: pt,
            san: '',
          });
        }
      } else {
        moves.push({
          from,
          to: { row: f1Row, col: c },
          piece,
          san: '',
        });

        // 2-step forward from starting row
        const f2Row = r + 2 * forward;
        if (r === startRow && !board[f2Row][c]) {
          moves.push({
            from,
            to: { row: f2Row, col: c },
            piece,
            san: '',
          });
        }
      }
    }

    // Diagonal captures & En Passant
    for (const dc of [-1, 1]) {
      const capCol = c + dc;
      if (isInsideBoard(f1Row, capCol)) {
        const targetPiece = board[f1Row][capCol];
        if (targetPiece && targetPiece.color === opponentColor) {
          if (f1Row === promoRow) {
            const promoTypes: PieceType[] = ['q', 'r', 'b', 'n'];
            for (const pt of promoTypes) {
              moves.push({
                from,
                to: { row: f1Row, col: capCol },
                piece,
                captured: targetPiece,
                promotion: pt,
                san: '',
              });
            }
          } else {
            moves.push({
              from,
              to: { row: f1Row, col: capCol },
              piece,
              captured: targetPiece,
              san: '',
            });
          }
        } else if (enPassant && enPassant.row === f1Row && enPassant.col === capCol) {
          // En passant capture!
          const capturedPawn = board[r][capCol];
          moves.push({
            from,
            to: { row: f1Row, col: capCol },
            piece,
            captured: capturedPawn,
            isEnPassant: true,
            san: '',
          });
        }
      }
    }
  }

  // KNIGHT
  else if (piece.type === 'n') {
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (isInsideBoard(nr, nc)) {
        const targetPiece = board[nr][nc];
        if (!targetPiece) {
          moves.push({ from, to: { row: nr, col: nc }, piece, san: '' });
        } else if (targetPiece.color === opponentColor) {
          moves.push({ from, to: { row: nr, col: nc }, piece, captured: targetPiece, san: '' });
        }
      }
    }
  }

  // BISHOP / ROOK / QUEEN
  else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
    const dirs: number[][] = [];
    if (piece.type === 'b' || piece.type === 'q') {
      dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (piece.type === 'r' || piece.type === 'q') {
      dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }

    for (const [dr, dc] of dirs) {
      let currR = r + dr;
      let currC = c + dc;
      while (isInsideBoard(currR, currC)) {
        const targetPiece = board[currR][currC];
        if (!targetPiece) {
          moves.push({ from, to: { row: currR, col: currC }, piece, san: '' });
        } else {
          if (targetPiece.color === opponentColor) {
            moves.push({ from, to: { row: currR, col: currC }, piece, captured: targetPiece, san: '' });
          }
          break; // ray blocked
        }
        currR += dr;
        currC += dc;
      }
    }
  }

  // KING
  else if (piece.type === 'k') {
    const kingOffsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    for (const [dr, dc] of kingOffsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (isInsideBoard(nr, nc)) {
        const targetPiece = board[nr][nc];
        if (!targetPiece) {
          moves.push({ from, to: { row: nr, col: nc }, piece, san: '' });
        } else if (targetPiece.color === opponentColor) {
          moves.push({ from, to: { row: nr, col: nc }, piece, captured: targetPiece, san: '' });
        }
      }
    }

    // CASTLING
    const kingRow = color === 'w' ? 7 : 0;
    if (r === kingRow && c === 4 && !isSquareAttacked(board, { row: r, col: c }, opponentColor)) {
      // Kingside (e1->g1 or e8->g8)
      if (castling[color].kingside) {
        const fSqEmpty = !board[kingRow][5];
        const gSqEmpty = !board[kingRow][6];
        const rook = board[kingRow][7];
        if (fSqEmpty && gSqEmpty && rook && rook.type === 'r' && rook.color === color) {
          if (!isSquareAttacked(board, { row: kingRow, col: 5 }, opponentColor) &&
              !isSquareAttacked(board, { row: kingRow, col: 6 }, opponentColor)) {
            moves.push({
              from,
              to: { row: kingRow, col: 6 },
              piece,
              isCastling: 'kingside',
              san: '',
            });
          }
        }
      }

      // Queenside (e1->c1 or e8->c8)
      if (castling[color].queenside) {
        const dSqEmpty = !board[kingRow][3];
        const cSqEmpty = !board[kingRow][2];
        const bSqEmpty = !board[kingRow][1];
        const rook = board[kingRow][0];
        if (dSqEmpty && cSqEmpty && bSqEmpty && rook && rook.type === 'r' && rook.color === color) {
          if (!isSquareAttacked(board, { row: kingRow, col: 3 }, opponentColor) &&
              !isSquareAttacked(board, { row: kingRow, col: 2 }, opponentColor)) {
            moves.push({
              from,
              to: { row: kingRow, col: 2 },
              piece,
              isCastling: 'queenside',
              san: '',
            });
          }
        }
      }
    }
  }

  return moves;
}

// Executes a move on a position and returns the new position
export function makeMove(pos: ChessPosition, move: Move): ChessPosition {
  const newPos = clonePosition(pos);
  const { board, castling } = newPos;
  const { from, to, piece, isCastling, isEnPassant, promotion } = move;

  // Move the piece
  board[from.row][from.col] = null;

  if (promotion) {
    board[to.row][to.col] = { type: promotion, color: piece.color };
  } else {
    board[to.row][to.col] = { ...piece };
  }

  // Handle en passant capture removal
  if (isEnPassant) {
    board[from.row][to.col] = null;
  }

  // Handle rook movement for castling
  if (isCastling === 'kingside') {
    const row = from.row;
    board[row][7] = null;
    board[row][5] = { type: 'r', color: piece.color };
  } else if (isCastling === 'queenside') {
    const row = from.row;
    board[row][0] = null;
    board[row][3] = { type: 'r', color: piece.color };
  }

  // Update Castling Rights
  if (piece.type === 'k') {
    castling[piece.color].kingside = false;
    castling[piece.color].queenside = false;
  } else if (piece.type === 'r') {
    if (from.row === 7 && from.col === 0) castling.w.queenside = false;
    if (from.row === 7 && from.col === 7) castling.w.kingside = false;
    if (from.row === 0 && from.col === 0) castling.b.queenside = false;
    if (from.row === 0 && from.col === 7) castling.b.kingside = false;
  }
  // If opponent's rook was captured
  if (to.row === 7 && to.col === 0) castling.w.queenside = false;
  if (to.row === 7 && to.col === 7) castling.w.kingside = false;
  if (to.row === 0 && to.col === 0) castling.b.queenside = false;
  if (to.row === 0 && to.col === 7) castling.b.kingside = false;

  // Update En Passant target
  if (piece.type === 'p' && Math.abs(to.row - from.row) === 2) {
    newPos.enPassant = {
      row: (from.row + to.row) / 2,
      col: from.col,
    };
  } else {
    newPos.enPassant = null;
  }

  // Update halfmove clock (50-move rule)
  if (piece.type === 'p' || move.captured) {
    newPos.halfmoveClock = 0;
  } else {
    newPos.halfmoveClock += 1;
  }

  // Update fullmove number and turn
  if (piece.color === 'b') {
    newPos.fullmoveNumber += 1;
  }
  newPos.turn = piece.color === 'w' ? 'b' : 'w';

  return newPos;
}

// Generate all strictly legal moves in the position
export function getLegalMoves(pos: ChessPosition, fromSquare?: Square): Move[] {
  const moves: Move[] = [];
  const { board, turn } = pos;

  const rows = fromSquare !== undefined ? [fromSquare.row] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = fromSquare !== undefined ? [fromSquare.col] : [0, 1, 2, 3, 4, 5, 6, 7];

  for (const r of rows) {
    for (const c of cols) {
      const piece = board[r][c];
      if (piece && piece.color === turn) {
        const pseudoMoves = getPseudoLegalMoves(pos, { row: r, col: c });
        for (const pm of pseudoMoves) {
          // Test move
          const nextPos = makeMove(pos, pm);
          // If own king is NOT in check, move is legal
          if (!isKingInCheck(nextPos.board, turn)) {
            // Generate SAN notation
            pm.san = generateSAN(pos, pm, nextPos);
            moves.push(pm);
          }
        }
      }
    }
  }

  return moves;
}

// Generates Standard Algebraic Notation (SAN)
function generateSAN(pos: ChessPosition, move: Move, nextPos: ChessPosition): string {
  if (move.isCastling === 'kingside') return 'O-O';
  if (move.isCastling === 'queenside') return 'O-O-O';

  let san = '';
  const pieceChar = move.piece.type.toUpperCase();
  const toCoord = squareToCoord(move.to.row, move.to.col);
  const isCapture = !!move.captured;

  if (move.piece.type === 'p') {
    if (isCapture) {
      const fromFile = String.fromCharCode('a'.charCodeAt(0) + move.from.col);
      san = `${fromFile}x${toCoord}`;
    } else {
      san = toCoord;
    }
    if (move.promotion) {
      san += `=${move.promotion.toUpperCase()}`;
    }
  } else {
    san = pieceChar;
    // Check disambiguation if multiple pieces of same type can reach target
    const legalMoves = getPseudoLegalMoves(pos, move.from).filter(m => {
      if (m.to.row !== move.to.row || m.to.col !== move.to.col) return false;
      const testPos = makeMove(pos, m);
      return !isKingInCheck(testPos.board, move.piece.color);
    });

    const sameTypeCandidates: Square[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === move.from.row && c === move.from.col) continue;
        const p = pos.board[r][c];
        if (p && p.type === move.piece.type && p.color === move.piece.color) {
          const candMoves = getPseudoLegalMoves(pos, { row: r, col: c });
          for (const cm of candMoves) {
            if (cm.to.row === move.to.row && cm.to.col === move.to.col) {
              const tp = makeMove(pos, cm);
              if (!isKingInCheck(tp.board, move.piece.color)) {
                sameTypeCandidates.push({ row: r, col: c });
              }
            }
          }
        }
      }
    }

    if (sameTypeCandidates.length > 0) {
      const sameFile = sameTypeCandidates.some(sq => sq.col === move.from.col);
      const sameRank = sameTypeCandidates.some(sq => sq.row === move.from.row);

      if (!sameFile) {
        san += String.fromCharCode('a'.charCodeAt(0) + move.from.col);
      } else if (!sameRank) {
        san += `${8 - move.from.row}`;
      } else {
        san += squareToCoord(move.from.row, move.from.col);
      }
    }

    if (isCapture) {
      san += `x${toCoord}`;
    } else {
      san += toCoord;
    }
  }

  // Check and Checkmate symbol
  const opponentColor: PieceColor = move.piece.color === 'w' ? 'b' : 'w';
  const opponentInCheck = isKingInCheck(nextPos.board, opponentColor);
  if (opponentInCheck) {
    const oppMoves = getLegalMoves(nextPos);
    if (oppMoves.length === 0) {
      san += '#';
    } else {
      san += '+';
    }
  }

  return san;
}

// Check for insufficient material draw
export function isInsufficientMaterial(board: Board): boolean {
  const pieces: Piece[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) pieces.push(p);
    }
  }

  // K vs K
  if (pieces.length === 2) return true;

  // K+B vs K or K+N vs K
  if (pieces.length === 3) {
    return pieces.some(p => p.type === 'b' || p.type === 'n');
  }

  // K+B vs K+B with same square color
  if (pieces.length === 4) {
    const bishops = pieces.filter(p => p.type === 'b');
    if (bishops.length === 2 && bishops[0].color !== bishops[1].color) {
      // Check bishop square colors
      let b1Color: 'light' | 'dark' | null = null;
      let b2Color: 'light' | 'dark' | null = null;

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.type === 'b') {
            const sqColor = (r + c) % 2 === 0 ? 'light' : 'dark';
            if (!b1Color) b1Color = sqColor;
            else b2Color = sqColor;
          }
        }
      }

      if (b1Color === b2Color) return true;
    }
  }

  return false;
}

// Material values calculation and captured pieces
export const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export function getCapturedPieces(history: Move[]): { whiteCaptured: Piece[]; blackCaptured: Piece[]; advantage: number } {
  const whiteCaptured: Piece[] = []; // pieces White captured (so Black pieces)
  const blackCaptured: Piece[] = []; // pieces Black captured (so White pieces)

  let whiteScore = 0;
  let blackScore = 0;

  for (const move of history) {
    if (move.captured) {
      if (move.piece.color === 'w') {
        whiteCaptured.push(move.captured);
        whiteScore += PIECE_VALUES[move.captured.type];
      } else {
        blackCaptured.push(move.captured);
        blackScore += PIECE_VALUES[move.captured.type];
      }
    }
  }

  // Sort pieces by value descending (q, r, b, n, p)
  const order: Record<PieceType, number> = { q: 5, r: 4, b: 3, n: 2, p: 1, k: 0 };
  whiteCaptured.sort((a, b) => order[b.type] - order[a.type]);
  blackCaptured.sort((a, b) => order[b.type] - order[a.type]);

  return {
    whiteCaptured,
    blackCaptured,
    advantage: whiteScore - blackScore,
  };
}
