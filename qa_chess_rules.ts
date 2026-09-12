import {
  createInitialPosition,
  getLegalMoves,
  makeMove,
  isKingInCheck,
  isInsufficientMaterial,
  coordToSquare,
  squareToCoord,
  ChessPosition,
} from '../src/utils/chessEngine';
import { Move, Square, Piece } from '../src/types/chess';
import { getAIMove, evaluateBoard } from '../src/utils/chessAi';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✓ ${testName}`);
  } else {
    failCount++;
    console.error(`  ✗ ${testName} - FAILED: ${detail || ''}`);
  }
}

console.log('=== CHESS RULES QA SUITE ===\n');

// 1. Initial Position and Pawn Movement
{
  const p0 = createInitialPosition();
  const moves = getLegalMoves(p0);
  assert(moves.length === 20, 'Initial position has exactly 20 legal moves (16 pawn pushes + 4 knight moves)');

  // 1-step and 2-step pawn moves
  const e3 = moves.find(m => m.san === 'e3');
  const e4 = moves.find(m => m.san === 'e4');
  assert(!!e3, 'Pawn single step e3 is legal');
  assert(!!e4, 'Pawn double step e4 is legal');

  // Blocked pawn: place a piece directly in front of e2
  const pBlocked = createInitialPosition();
  pBlocked.board[5][4] = { type: 'p', color: 'b' }; // e3 blocked
  const blockedMoves = getLegalMoves(pBlocked).filter(m => m.from.row === 6 && m.from.col === 4);
  assert(blockedMoves.length === 0, 'Pawn cannot move forward if blocked on e3');

  // Diagonal pawn captures (place Black pawns on d3 and f3, NOT a knight that checks e1)
  const pCapt = createInitialPosition();
  pCapt.board[5][3] = { type: 'p', color: 'b' }; // d3 piece
  pCapt.board[5][5] = { type: 'p', color: 'b' }; // f3 pawn (Black pawns on d3/f3 attack c2/e2 and e2/g2, neither checks e1)
  const captMoves = getLegalMoves(pCapt).filter(m => m.from.row === 6 && m.from.col === 4);
  assert(captMoves.some(m => m.to.col === 3 && m.captured), 'Pawn can capture diagonally left (exd3)');
  assert(captMoves.some(m => m.to.col === 5 && m.captured), 'Pawn can capture diagonally right (exf3)');
}

// 2. Knight Movement
{
  const p0 = createInitialPosition();
  const knightMoves = getLegalMoves(p0).filter(m => m.piece.type === 'n');
  assert(knightMoves.length === 4, 'Knights can jump over pawns initially (Na3, Nc3, Nf3, Nh3)');
  // Verify knight cannot land on friendly piece
  const badLandings = knightMoves.filter(m => {
    const target = p0.board[m.to.row][m.to.col];
    return target && target.color === 'w';
  });
  assert(badLandings.length === 0, 'Knight cannot land on friendly piece');
}

// 3. Bishop, Rook, Queen Rays and Blockers
{
  const p0 = createInitialPosition();
  // Initially bishop, rook, queen have 0 moves because they are blocked by pawns
  const brqMoves = getLegalMoves(p0).filter(m => ['b', 'r', 'q'].includes(m.piece.type));
  assert(brqMoves.length === 0, 'Bishops, Rooks, Queen blocked by pawns on move 1');

  // Open e4, then Bishop and Queen should have ray moves
  const e4Move = getLegalMoves(p0).find(m => m.san === 'e4')!;
  const p1 = makeMove(p0, e4Move);
  // It is now Black turn, make dummy move e5
  const e5Move = getLegalMoves(p1).find(m => m.san === 'e5')!;
  const p2 = makeMove(p1, e5Move);

  const whiteAfterMoves = getLegalMoves(p2);
  const bishopMoves = whiteAfterMoves.filter(m => m.piece.type === 'b');
  const queenMoves = whiteAfterMoves.filter(m => m.piece.type === 'q');
  assert(bishopMoves.length > 0, 'Light-square bishop has diagonal moves after e4');
  assert(queenMoves.length > 0, 'Queen has diagonal moves after e4 (Qh5, Qg4, Qf3, Qe2)');
}

// 4. King Movement and Safety
{
  const p0 = createInitialPosition();
  // King cannot move initially (blocked)
  const kMoves = getLegalMoves(p0).filter(m => m.piece.type === 'k');
  assert(kMoves.length === 0, 'King has no moves in initial setup');

  // Moving into check must be illegal
  const pCheck = createInitialPosition();
  pCheck.board[6][4] = null; // remove e2 pawn
  pCheck.board[5][4] = { type: 'r', color: 'b' }; // black rook on e3
  // King on e1 is in check from e3 rook
  assert(isKingInCheck(pCheck.board, 'w'), 'King is correctly detected in check');
  const movesInCheck = getLegalMoves(pCheck);
  // King cannot move to d1 or f1 if attacked, and any move made must resolve check
  for (const m of movesInCheck) {
    const nextPos = makeMove(pCheck, m);
    assert(!isKingInCheck(nextPos.board, 'w'), 'All legal moves resolve check');
  }
}

// 5. En Passant
{
  const pEP = createInitialPosition();
  // White plays e4, Black plays a6, White plays e5, Black plays d5 (2-square step next to e5)
  let pos = pEP;
  pos = makeMove(pos, getLegalMoves(pos).find(m => m.san === 'e4')!);
  pos = makeMove(pos, getLegalMoves(pos).find(m => m.san === 'a6')!);
  pos = makeMove(pos, getLegalMoves(pos).find(m => m.san === 'e5')!);
  pos = makeMove(pos, getLegalMoves(pos).find(m => m.san === 'd5')!);

  assert(pos.enPassant !== null, 'En passant target square exists after d5');
  assert(pos.enPassant?.row === 2 && pos.enPassant?.col === 3, 'En passant target is d6');

  const epMoves = getLegalMoves(pos).filter(m => m.isEnPassant);
  assert(epMoves.length === 1, 'White has 1 en passant capture (exd6)');

  if (epMoves.length > 0) {
    const posAfterEP = makeMove(pos, epMoves[0]);
    assert(posAfterEP.board[3][3] === null, 'Black pawn on d5 was removed by en passant');
    assert(posAfterEP.board[2][3]?.type === 'p' && posAfterEP.board[2][3]?.color === 'w', 'White pawn lands on d6');
    assert(posAfterEP.enPassant === null, 'En passant target cleared after move');
  }

  // En passant expires on subsequent move
  const posSkip = makeMove(pos, getLegalMoves(pos).find(m => m.san === 'a3')!);
  const posSkipBlack = makeMove(posSkip, getLegalMoves(posSkip).find(m => m.san === 'h6')!);
  assert(posSkipBlack.enPassant === null, 'En passant target expired after not being taken');
}

// 6. Castling Kingside and Queenside
{
  const pCastle = createInitialPosition();
  // Clear f1, g1 for White Kingside castling
  pCastle.board[7][5] = null; // f1
  pCastle.board[7][6] = null; // g1
  const kCastleMoves = getLegalMoves(pCastle).filter(m => m.isCastling === 'kingside');
  assert(kCastleMoves.length === 1, 'Kingside castling O-O is legal when empty');

  const afterKingside = makeMove(pCastle, kCastleMoves[0]);
  assert(afterKingside.board[7][6]?.type === 'k', 'King lands on g1 after O-O');
  assert(afterKingside.board[7][5]?.type === 'r', 'Rook lands on f1 after O-O');
  assert(!afterKingside.castling.w.kingside && !afterKingside.castling.w.queenside, 'White lost castling rights after O-O');

  // Clear b1, c1, d1 for White Queenside castling
  const pQCastle = createInitialPosition();
  pQCastle.board[7][1] = null; // b1
  pQCastle.board[7][2] = null; // c1
  pQCastle.board[7][3] = null; // d1
  const qCastleMoves = getLegalMoves(pQCastle).filter(m => m.isCastling === 'queenside');
  assert(qCastleMoves.length === 1, 'Queenside castling O-O-O is legal when empty');

  const afterQueenside = makeMove(pQCastle, qCastleMoves[0]);
  assert(afterQueenside.board[7][2]?.type === 'k', 'King lands on c1 after O-O-O');
  assert(afterQueenside.board[7][3]?.type === 'r', 'Rook lands on d1 after O-O-O');

  // Castling blocked if square crossed by King is attacked
  const pThroughCheck = createInitialPosition();
  pThroughCheck.board[7][5] = null; // f1
  pThroughCheck.board[7][6] = null; // g1
  pThroughCheck.board[6][5] = null; // clear f2 pawn so f-file is open
  pThroughCheck.board[1][5] = null; // clear f7 pawn
  pThroughCheck.board[0][5] = { type: 'r', color: 'b' }; // Black rook on f8 attacking f1 through open file
  const blockedCastleMoves = getLegalMoves(pThroughCheck).filter(m => m.isCastling === 'kingside');
  assert(blockedCastleMoves.length === 0, 'Castling through check (f1 attacked) is illegal');

  // Castling while in check is illegal
  const pInCheckCastle = createInitialPosition();
  pInCheckCastle.board[7][5] = null; // f1
  pInCheckCastle.board[7][6] = null; // g1
  pInCheckCastle.board[6][4] = null; // clear e2 pawn so e-file is open
  pInCheckCastle.board[1][4] = null; // clear e7 pawn
  pInCheckCastle.board[0][4] = { type: 'r', color: 'b' }; // Black rook on e8 checking e1 through open file
  const inCheckCastleMoves = getLegalMoves(pInCheckCastle).filter(m => m.isCastling === 'kingside');
  assert(inCheckCastleMoves.length === 0, 'Castling out of check is illegal');
}

// 7. Pawn Promotion
{
  const pPromo = createInitialPosition();
  // Clear path for White pawn on e7 to e8
  pPromo.board[1][4] = { type: 'p', color: 'w' }; // e7
  pPromo.board[0][4] = null; // e8 empty
  pPromo.board[0][3] = null; // d8 empty
  const promoMoves = getLegalMoves(pPromo).filter(m => m.from.row === 1 && m.from.col === 4);
  const promotions = promoMoves.map(m => m.promotion).filter(Boolean);
  assert(promotions.includes('q'), 'Pawn can promote to Queen');
  assert(promotions.includes('r'), 'Pawn can promote to Rook');
  assert(promotions.includes('b'), 'Pawn can promote to Bishop');
  assert(promotions.includes('n'), 'Pawn can promote to Knight');

  const qPromoMove = promoMoves.find(m => m.promotion === 'q')!;
  const afterPromo = makeMove(pPromo, qPromoMove);
  assert(afterPromo.board[0][4]?.type === 'q' && afterPromo.board[0][4]?.color === 'w', 'Promoted piece is Queen on e8');
}

// 8. Checkmate Detection (Fool’s Mate: 1. f3 e5 2. g4 Qh4#)
{
  let pos = createInitialPosition();
  pos = makeMove(pos, getLegalMoves(pos).find(m => m.san === 'f3')!);
  pos = makeMove(pos, getLegalMoves(pos).find(m => m.san === 'e5')!);
  pos = makeMove(pos, getLegalMoves(pos).find(m => m.san === 'g4')!);
  const qh4 = getLegalMoves(pos).find(m => m.san === 'Qh4#');
  assert(!!qh4, "Fool's mate move Qh4# exists with '#' notation");
  if (qh4) {
    pos = makeMove(pos, qh4);
    assert(isKingInCheck(pos.board, 'w'), 'White king is in check');
    assert(getLegalMoves(pos).length === 0, 'White has 0 legal moves (Checkmate)');
  }
}

// 9. Stalemate Detection
{
  const pStale = createInitialPosition();
  // Clear the board except Black King on a8, White King on c7, White Queen on b6
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      pStale.board[r][c] = null;
    }
  }
  pStale.board[0][0] = { type: 'k', color: 'b' }; // Ka8
  pStale.board[1][2] = { type: 'k', color: 'w' }; // Kc7
  pStale.board[2][1] = { type: 'q', color: 'w' }; // Qb6
  pStale.turn = 'b';

  assert(!isKingInCheck(pStale.board, 'b'), 'Black King is NOT in check');
  assert(getLegalMoves(pStale).length === 0, 'Black has 0 legal moves (Stalemate)');
}

// 10. Insufficient Material Detection
{
  const bKK = Array(8).fill(null).map(() => Array(8).fill(null));
  bKK[0][0] = { type: 'k', color: 'w' };
  bKK[7][7] = { type: 'k', color: 'b' };
  assert(isInsufficientMaterial(bKK), 'K vs K is insufficient material');

  bKK[0][1] = { type: 'b', color: 'w' };
  assert(isInsufficientMaterial(bKK), 'K+B vs K is insufficient material');

  bKK[0][1] = { type: 'n', color: 'w' };
  assert(isInsufficientMaterial(bKK), 'K+N vs K is insufficient material');

  // K+B vs K+B same color
  bKK[0][1] = { type: 'b', color: 'w' }; // row 0, col 1: (0+1)%2 = 1 (dark)
  bKK[7][6] = { type: 'b', color: 'b' }; // row 7, col 6: (7+6)%2 = 1 (dark)
  assert(isInsufficientMaterial(bKK), 'K+B vs K+B on same colored squares is insufficient material');
}

console.log(`\nQA Suite Complete: ${passCount} Passed, ${failCount} Failed.`);
process.exit(failCount === 0 ? 0 : 1);
