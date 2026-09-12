import { isChessRelated, generateLocalChessmateReply } from '../src/utils/chessmateLocal';
import { isResponseTextComplete } from '../src/utils/chessmateResponseValidation';
import { getDetailedPositionAnalysis } from '../src/utils/chessPositionAnalysis';
import { createInitialPosition, makeMove } from '../src/utils/chessEngine';

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

console.log('=== CHESSMATE QA SUITE ===\n');

// 1. Non-Chess Queries Rejection
const nonChessQueries = [
  'What is the weather today?',
  'Tell me a romantic story',
  'Can you cook a steak dinner for me?',
  'Should I buy Bitcoin or Ethereum?',
  'Who won the presidential election?',
  'What is the latest Hollywood movie?',
  'Write some JavaScript code for me',
  'Tell me a funny joke',
  'What is the capital of Australia?',
];

for (const query of nonChessQueries) {
  const isRelated = isChessRelated(query);
  const reply = generateLocalChessmateReply(query);
  assert(!isRelated, `Non-chess detected: "${query}"`);
  assert(reply === 'Sorry! I can only talk about chess. ♟️', `Refusal exact phrasing for: "${query}"`);
}

// 2. Chess Queries Acceptance
const chessQueries = [
  'How does en passant work?',
  'What is the French Defense?',
  'What is the difference between checkmate and stalemate?',
  'Can I castle kingside or queenside?',
  'Explain what a knight fork is',
  'What is a pin in chess?',
  'Who is winning right now?',
  'Am I in danger?',
  'What should I do next?',
  'Can I capture en passant?',
  'Who are you and who is CAISSA?',
];

for (const query of chessQueries) {
  const isRelated = isChessRelated(query);
  assert(isRelated, `Chess query accepted: "${query}"`);
}

// 3. Response Completeness Verification
const sampleContexts = [
  undefined,
  {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    playerColor: 'w' as const,
    turn: 'w' as const,
    fullmoveNumber: 1,
    inCheck: false,
    canCastleKingside: true,
    canCastleQueenside: true,
    enPassantAvailable: false,
    materialSummary: 'Equal',
    materialDiff: 0,
    capturedByPlayer: [],
    capturedByOpponent: [],
    moveHistorySan: [],
    lastMoveSan: null,
    aiStrength: 65,
    analysis: getDetailedPositionAnalysis(createInitialPosition(), 'w', null, [], 65),
  },
];

for (const ctx of sampleContexts) {
  for (const query of chessQueries) {
    const reply = generateLocalChessmateReply(query, ctx);
    const complete = isResponseTextComplete(reply);
    assert(complete, `Response is complete for "${query}" (${ctx ? 'with' : 'without'} context)`);
    assert(!reply.includes('undefined') && !reply.includes('NaN'), `No corrupt text tokens in "${query}"`);
  }
}

// 4. Offline Resilience (No Crashes)
{
  let noCrash = true;
  try {
    // Calling with empty object, malformed properties
    generateLocalChessmateReply('Is my king safe?', {} as any);
    generateLocalChessmateReply('What should I do?', { inCheck: true, kingAttackers: [] } as any);
    generateLocalChessmateReply('Who is winning?', { materialDiff: 5 } as any);
  } catch (err) {
    noCrash = false;
  }
  assert(noCrash, 'generateLocalChessmateReply is resilient to malformed context data');
}

console.log(`\nCHESSMATE QA Suite Complete: ${passCount} Passed, ${failCount} Failed.`);
process.exit(failCount === 0 ? 0 : 1);
