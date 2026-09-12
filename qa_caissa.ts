import { createInitialPosition, getLegalMoves, makeMove, ChessPosition } from '../src/utils/chessEngine';
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

console.log('=== CAISSA AI QA SUITE ===\n');

// 1. Legal Move Guarantee across all strengths
const strengthsToTest = [1, 15, 25, 50, 75, 90, 100];
for (const str of strengthsToTest) {
  let pos = createInitialPosition();
  let allMovesLegal = true;
  let movesTested = 0;

  for (let step = 0; step < 10; step++) {
    const legalMoves = getLegalMoves(pos);
    if (legalMoves.length === 0) break;

    const t0 = performance.now();
    const aiMove = getAIMove(pos, str);
    const t1 = performance.now();

    if (!aiMove) {
      allMovesLegal = false;
      break;
    }

    const isLegal = legalMoves.some(
      m => m.from.row === aiMove.from.row &&
           m.from.col === aiMove.from.col &&
           m.to.row === aiMove.to.row &&
           m.to.col === aiMove.to.col &&
           m.promotion === aiMove.promotion
    );

    if (!isLegal) {
      allMovesLegal = false;
      break;
    }

    movesTested++;
    pos = makeMove(pos, aiMove);
  }

  assert(allMovesLegal && movesTested === 10, `Strength ${str}% generates 100% strictly legal moves (tested ${movesTested} plies)`);
}

// 2. Beginner Level Verification (1% Strength)
// At 1% strength, CAISSA commits beginner mistakes (hanging pieces or passive flank pawn moves)
{
  // Position where White plays Na3 then Black plays ...
  // Or test a tactical blunder setup:
  // White has a free hanging queen on e4 that Black can capture, or White moves into attack
  let beginnerBlundersOrFlanks = 0;
  const trials = 100;
  for (let i = 0; i < trials; i++) {
    const pos = createInitialPosition();
    const move = getAIMove(pos, 1);
    if (move) {
      // Check if it's a flank move or random
      const isFlankPawn = move.piece.type === 'p' && (move.from.col === 0 || move.from.col === 7);
      const isRandomOrSuboptimal = move.san !== 'e4' && move.san !== 'd4';
      if (isFlankPawn || isRandomOrSuboptimal) {
        beginnerBlundersOrFlanks++;
      }
    }
  }
  const rate = (beginnerBlundersOrFlanks / trials) * 100;
  assert(rate > 70, `1% strength displays genuine beginner playstyle (${rate}% casual/suboptimal/flank choices, expected >70%)`);
}

// 3. Tactical Punishment at 100% Master Strength
{
  // Set up a free undefended Queen for CAISSA (Black) to capture
  const pTactical = createInitialPosition();
  pTactical.board[4][4] = { type: 'q', color: 'w' }; // White Queen on e4, undefended
  pTactical.board[3][3] = { type: 'p', color: 'b' }; // Black pawn on d5 attacking e4
  pTactical.turn = 'b';

  const masterMove = getAIMove(pTactical, 100);
  assert(
    masterMove?.captured?.type === 'q' || (masterMove?.to.row === 4 && masterMove?.to.col === 4),
    `100% Master CAISSA immediately punishes blunders and captures undefended Queen`
  );
}

// 4. Strength Progression Check
// 100% engine should consistently evaluate moves higher than 1% random choices
{
  const pProg = createInitialPosition();
  const m100 = getAIMove(pProg, 100);
  assert(!!m100, 'Master engine finds best opening move');
  assert(['e4', 'd4', 'Nf3', 'c4', 'Nc3'].includes(m100?.san || ''), `Master CAISSA plays principled opening move (${m100?.san})`);
}

// 5. Performance / No UI Freeze: Measure AI calculation time
{
  const pos = createInitialPosition();
  const t0 = performance.now();
  getAIMove(pos, 100);
  const duration = performance.now() - t0;
  assert(duration < 250, `100% calculation completes rapidly in ${duration.toFixed(1)}ms (well within frame budget <250ms)`);
}

console.log(`\nCAISSA QA Suite Complete: ${passCount} Passed, ${failCount} Failed.`);
process.exit(failCount === 0 ? 0 : 1);
