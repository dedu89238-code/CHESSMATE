import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { isResponseTextComplete } from './src/utils/chessmateResponseValidation';

dotenv.config();

let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Helper to prevent hanging API requests
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// System prompt enforcing chess-only companion identity and strict chess accuracy
const CHESSMATE_SYSTEM_INSTRUCTION = `You are CHESSMATE, a dedicated, highly intelligent chess companion inside an interactive chess application.
The player is currently playing a game of chess against CAISSA (the AI chess engine opponent).
You are CHESSMATE, the player's supportive, sharp, and insightful chess companion and advisor. You are NOT the opponent.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULE 1: STRICTLY CHESS ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You must ONLY respond to chess-related questions and conversations.
Allowed topics:
- Chess rules, mechanics, and terminology (castling, en passant, promotion, stalemate, etc.)
- Chess openings, defenses, and gambits
- Tactics (pins, forks, skewers, discovered attacks, deflection, sacrifices)
- Strategy, pawn structures, piece coordination, and endgames
- Chess history, famous grandmasters (Kasparov, Fischer, Carlsen, Tal, Capablanca, etc.), and iconic games
- Advice on improving chess skills
- Analysis of the player's current game, moves, and board position
- The opponent CAISSA (e.g. general tips on how to play against AI engines)

CRITICAL REFUSAL REQUIREMENT:
If the user asks about ANYTHING outside the domain of chess (for example: romance, dating, politics, coding, programming, general knowledge, entertainment, movies, music, weather, cooking, personal life advice, etc.):
You MUST POLITELY AND BRIEFLY REFUSE.
Use exactly:
"Sorry! I can only talk about chess. ♟️"
DO NOT answer the unrelated question first. Refuse immediately. Keep refusals short. Do not allow the live game context to override this restriction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULE 2: POSITION-AWARE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When the player asks about their current game or position, analyze the actual live board state provided in [CURRENT MATCH CONTEXT WITH CAISSA] instead of giving generic answers:

1. "Am I in danger?"
   - Inspect the current position:
   - Is the King in check? State the checking piece(s) and square.
   - Are there hanging pieces? (friendly pieces attacked and undefended).
   - If there are no threats, state clearly and accurately that the player's King is secure and all pieces are defended.

2. "What should I do?"
   - Give a concise recommendation based strictly on the current board:
   - If in check: advise on escaping, blocking, or capturing.
   - If a piece is hanging: advise saving or defending it.
   - If CAISSA has left a piece hanging: point out the capture opportunity.
   - If uncastled and castling is available: recommend castling.
   - If in the opening: recommend developing pieces, controlling the center, and king safety.
   - If in material advantage: recommend trading pieces toward a winning endgame.

3. "Is my king safe?"
   - Inspect the King's square, castling status, pawn shield integrity, and whether enemy pieces are targeting it. Explain the situation clearly.

4. "Who is winning?"
   - Compare material balance (+ points) and positional factors (king safety, piece activity) from the current board.

5. "Can I castle?"
   - Check the exact castling status: tell the player whether they can legally castle Kingside or Queenside on this move, and if not, cite the exact reason (e.g., King moved, Rook moved, pieces in between, in check, through check).

6. "Did I make a good move?" / "Was my last move good?"
   - Analyze the player's most recent move: did it deliver check, win material, hang a piece, castle safely, or develop a piece?

IMPORTANT ACCURACY MANDATE:
Never claim a move is brilliant, a blunder, winning, losing, or tactically significant unless the actual chess position supports that conclusion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULE 3: CHESS RULES ACCURACY & ENGINE ALIGNMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You must provide strictly accurate official chess information according to FIDE rules.
Do NOT invent chess rules. Prioritize the actual chess engine state and rules already implemented in this application whenever the question concerns the current game.

1. CASTLING ACCURACY (MANDATORY):
- Piece movement:
  • The King moves two squares toward the chosen Rook.
  • The Rook moves to the square immediately on the other side of the King.
- Concrete coordinates:
  • Kingside (Short Castling): White King e1 → g1, Rook h1 → f1. Black King e8 → g8, Rook h8 → f8.
  • Queenside (Long Castling): White King e1 → c1, Rook a1 → d1. Black King e8 → c8, Rook a8 → d8.
- CRITICAL: NEVER say "the rook jumps over the king" or "hops over". That is inaccurate terminology. The rook moves to the square immediately on the other side of the King.
- All 6 mandatory conditions for castling:
  1. The King has never moved.
  2. The chosen Rook has never moved.
  3. There are no pieces between them (all intermediate squares are vacant).
  4. The King is not currently in check.
  5. The King does not pass through a square attacked by an enemy piece.
  6. The King does not finish on a square attacked by an enemy piece.
  The same principles apply to both kingside and queenside castling. (During queenside castling, an enemy piece may attack the b-file square that the Rook crosses, but the King may never pass through or land on an attacked square).

2. EN PASSANT ACCURACY:
- When a pawn advances two squares from its starting rank and lands adjacent to an enemy pawn, that enemy pawn can capture it as if it had only moved one square.
- Must be executed on the very next turn, or the right to capture en passant is permanently lost.

3. PAWN PROMOTION ACCURACY:
- A pawn reaching the 8th rank (or 1st rank for Black) promotes immediately to a Queen, Rook, Bishop, or Knight of the same color. Having multiple Queens on the board is completely legal.

4. STALEMATE vs CHECKMATE:
- Checkmate: King is in check and has no legal escape moves. Attacker wins.
- Stalemate: Player to move is NOT in check, but has NO legal moves anywhere on the board. The result is an immediate draw.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULE 4: COMPLETE RESPONSES ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Responses must ALWAYS be complete, fully articulated, and finished with clear conclusions.
- NEVER stop in the middle of a sentence, phrase, or line.
- Conclude every paragraph, bullet point, or thought with proper terminal punctuation (. ! ? or closing emoji).
- Never leave dangling sentences or trailing words.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE & TONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Sophisticated, concise, warm, and encouraging.
- Format with clean paragraphs, bullet points, or bold text where helpful.
- Keep answers focused and complete (1 to 3 paragraphs or neat bullet points). Never write overly long walls of text.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Embedded default Digital Asset Links for CHESSMATE Android TWA
  const DEFAULT_ASSET_LINKS = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "studio.ai.chessmate.twa",
        sha256_cert_fingerprints: [
          "4A:22:23:D8:43:01:05:E9:E6:5D:83:9B:AF:B5:16:86:94:4B:B8:58:15:06:23:85:C7:BE:20:41:65:16:92:D9",
          "85:5F:7A:51:28:BD:00:14:7E:5E:C7:63:9B:A6:3F:76:4D:07:31:D0:1D:71:06:CD:AE:35:33:FF:6D:FA:08:E1",
          "62:FA:76:29:9E:24:5A:27:E6:E0:8B:73:D2:18:C8:FB:F4:28:48:A6:86:B7:6E:62:8F:46:97:DC:DB:29:3B:FB"
        ]
      }
    }
  ];

  // Digital Asset Links endpoint for Android Trusted Web Activity (TWA) verification
  const handleAssetLinks = (_req: express.Request, res: express.Response) => {
    const candidates = [
      path.join(process.cwd(), 'dist', '.well-known', 'assetlinks.json'),
      path.join(process.cwd(), 'public', '.well-known', 'assetlinks.json'),
      path.join(process.cwd(), '.well-known', 'assetlinks.json'),
    ];
    const target = candidates.find(p => fs.existsSync(p));

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let outputData: any = DEFAULT_ASSET_LINKS;

    if (target) {
      try {
        const rawContent = fs.readFileSync(target, 'utf-8');
        outputData = JSON.parse(rawContent);
        return res.status(200).json(outputData);
      } catch (e) {
        console.warn('Error reading assetlinks.json from disk, using embedded fallback:', e);
      }
    }

    return res.status(200).json(outputData);
  };

  // Top-level middleware to intercept .well-known immediately before any other routing or static handling
  app.use((req, res, next) => {
    const cleanPath = (req.path || '').toLowerCase().replace(/\/+$/, '');
    if (cleanPath === '/.well-known/assetlinks.json' || cleanPath === '/.well-known/assetlinks') {
      return handleAssetLinks(req, res);
    }
    next();
  });

  app.all(['/.well-known/assetlinks.json', '/.well-known/assetlinks.json/', '/.well-known/assetlinks'], handleAssetLinks);

  app.use(express.json({ limit: '1mb' }));

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // CHESSMATE Chat Endpoint
  app.post('/api/chessmate/chat', async (req, res) => {
    try {
      const { message, history = [], gameContext } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const trimmed = message.trim();

      // Quick deterministic check for non-chess questions to guarantee instant refusal
      const nonChessPatterns = [
        /\b(weather|temperature|forecast|rain|cloudy|sunny)\b/i,
        /\b(love story|romantic|romance|girlfriend|boyfriend|dating|marry me|crush)\b/i,
        /\b(recipe|cook|baking|ingredient|dinner|lunch|breakfast|food)\b/i,
        /\b(crypto|bitcoin|ethereum|stock market|investing|forex)\b/i,
        /\b(president|politics|election|democrat|republican|senate|government)\b/i,
        /\b(movie|cinema|netflix|actor|actress|hollywood|film|tv show)\b/i,
        /\b(music|song|album|spotify|artist|singer|band|guitar)\b/i,
        /\b(coding|javascript|python|react|html|css|software bug|programming|write code)\b/i,
        /\b(joke|tell me a joke|riddle|funny story)\b/i,
        /\b(personal advice|life advice|therapy|depression|anxiety|career advice)\b/i,
        /\b(general knowledge|capital of|who invented|history of rome|geography)\b/i,
      ];

      const chessKeywords = /\b(chess|king|queen|rook|bishop|knight|pawn|board|square|file|rank|check|mate|checkmate|stalemate|castle|castling|en passant|promotion|opening|defense|gambit|tactic|fork|pin|skewer|endgame|blunder|caissa|elo|fischer|kasparov|carlsen|move|attack|threat|piece|capture|danger|safe|winning|ahead|lead|advantage|position)\b/i;

      // If clearly unrelated to chess and doesn't mention chess
      if (nonChessPatterns.some(pat => pat.test(trimmed)) && !chessKeywords.test(trimmed)) {
        res.json({
          reply: 'Sorry! I can only talk about chess. ♟️',
          source: 'guardrail',
        });
        return;
      }

      const ai = getGemini();

      if (!ai) {
        // Safe fallback when GEMINI_API_KEY is not provisioned or offline
        res.json({
          reply: null,
          fallbackNeeded: true,
          message: 'Gemini client offline',
        });
        return;
      }

      // Build context summary for prompt
      let contextNote = '';
      if (gameContext) {
        const a = gameContext.analysis;
        contextNote = `\n\n[CURRENT MATCH CONTEXT WITH CAISSA]:
- Board FEN: ${gameContext.fen || a?.fen || 'Standard'}
- Player Color: ${gameContext.playerColor === 'w' ? 'White' : 'Black'}
- Side to Move: ${gameContext.turn === 'w' ? 'White' : 'Black'}
- Move Count: ${gameContext.fullmoveNumber || 1}
- Moves Played so far: ${gameContext.moveHistorySan?.join(' ') || 'Game just started'}
- Last Move: ${gameContext.lastMoveSan || 'None'}
- Is Player King In Check: ${gameContext.inCheck ? 'YES (In Check!)' : 'No'}
- King Position: ${gameContext.kingSquare || a?.playerKing?.square || 'Unknown'}
- Attackers on King: ${gameContext.kingAttackers?.length ? gameContext.kingAttackers.join(', ') : 'None'}
- King Safety: ${a?.playerKing?.safetyAssessment || (gameContext.inCheck ? 'In Check' : 'Secure')}
- Material Summary: ${a?.materialSummary || gameContext.materialSummary || 'Equal'}
- Material Diff: ${a?.materialDiff !== undefined ? a.materialDiff : (gameContext.materialDiff ?? 0)} (positive means player ahead)
- Pieces Captured by Player: ${gameContext.capturedByPlayer?.join(', ') || 'None'}
- Pieces Captured by CAISSA: ${gameContext.capturedByOpponent?.join(', ') || 'None'}
- Can Player Castle Kingside Now: ${a?.castling?.playerCanCastleKingsideNow ? 'YES' : 'NO'} (${a?.castling?.playerKingsideReason || (gameContext.canCastleKingside ? 'Available' : 'Unavailable')})
- Can Player Castle Queenside Now: ${a?.castling?.playerCanCastleQueensideNow ? 'YES' : 'NO'} (${a?.castling?.playerQueensideReason || (gameContext.canCastleQueenside ? 'Available' : 'Unavailable')})
- En Passant Available: ${a?.enPassant?.available ? `YES on square ${a.enPassant.targetSquare}` : (gameContext.enPassantAvailable ? 'YES' : 'No')}
- Promotion Possibilities: ${a?.promotion?.threats?.join('; ') || gameContext.promotionPossibilities?.join('; ') || 'None'}
- Hanging Pieces (Player): ${a?.hangingPiecesPlayer?.join(', ') || gameContext.hangingPiecesPlayer?.join(', ') || 'None'}
- Hanging Pieces (CAISSA): ${a?.hangingPiecesCaissa?.join(', ') || gameContext.hangingPiecesCaissa?.join(', ') || 'None'}
- Key Tactical Threats: ${a?.threatsToPlayer?.map((t: any) => t.description).join('; ') || gameContext.tacticalThreats?.join('; ') || 'None'}
- Key Tactical Opportunities: ${a?.opportunitiesForPlayer?.map((t: any) => t.description).join('; ') || gameContext.tacticalOpportunities?.join('; ') || 'None'}
- Legal Moves Count: ${a?.legalMovesCount || gameContext.legalMovesCount || 'Unknown'}
- Sample Legal Moves: ${a?.keyLegalMovesSan?.join(', ') || gameContext.keyLegalMovesSan?.join(', ') || 'None'}
- CAISSA Current Strength: ${gameContext.aiStrength || a?.caissaStrength?.percentage || 65}% (${gameContext.aiStrengthZone || a?.caissaStrength?.zoneName || 'Advanced'})
- Position Assessment: ${a?.positionAssessment || 'In progress'}
- Recommended Action: ${a?.recommendedAction || 'Develop pieces and control the center'}`;
      }

      // Format previous conversation history
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Add relevant past messages (limit to last 6 for prompt efficiency)
      const pastMessages = history.slice(-6);
      for (const msg of pastMessages) {
        if (msg.role === 'user' || msg.role === 'model') {
          contents.push({
            role: msg.role,
            parts: [{ text: msg.text }],
          });
        }
      }

      // Add current user message with context attached
      contents.push({
        role: 'user',
        parts: [{ text: `${trimmed}${contextNote}` }],
      });

      let replyText: string | null = null;
      let finishReason: string | null = null;

      // Robust candidate model fallback list
      // 1. gemini-flash-latest: high performance, active project quota
      // 2. gemini-3.8-flash: standard modern text model for general Q&A
      // 3. gemini-3.1-flash-lite: lightweight resilient fallback
      const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

      for (const modelName of candidateModels) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction: CHESSMATE_SYSTEM_INSTRUCTION,
                temperature: 0.5,
                maxOutputTokens: 2048,
              },
            }),
            6500
          );
          const candidate = response.candidates?.[0];
          const reason = candidate?.finishReason || null;
          const text = response.text ? response.text.trim() : null;

          if (text && reason !== 'MAX_TOKENS' && isResponseTextComplete(text)) {
            replyText = text;
            finishReason = reason;
            break;
          }
        } catch (modelErr: any) {
          // Gracefully catch rate limit (429) or high demand (503) and proceed to next candidate
          const code = modelErr?.status || (modelErr?.error && modelErr.error.code) || 'busy';
          console.log(`[CHESSMATE] Model ${modelName} unavailable (${code}), failing over to next model...`);
        }
      }

      // Completeness verification: Check for token-exhaustion cutoffs or dangling sentence fragments
      const isCandidateTruncated = finishReason === 'MAX_TOKENS';
      const isTextFullyFormed = replyText ? isResponseTextComplete(replyText) : false;

      if (replyText && !isCandidateTruncated && isTextFullyFormed) {
        res.json({
          reply: replyText,
          source: 'gemini',
        });
      } else if (replyText && (isCandidateTruncated || !isTextFullyFormed)) {
        res.json({
          reply: null,
          fallbackNeeded: true,
          error: 'CHESSMATE was unable to complete this response. Please try asking again.',
        });
      } else {
        // Signal client to seamlessly use local chess intelligence
        res.json({
          reply: null,
          fallbackNeeded: true,
        });
      }
    } catch (err: any) {
      console.error('CHESSMATE route error:', err);
      res.json({
        reply: null,
        fallbackNeeded: true,
        error: 'CHESSMATE is unavailable right now. Please try again.',
      });
    }
  });

  // Web App Manifest endpoints for PWA / PWABuilder with explicit MIME type headers
  const handleManifest = (_req: express.Request, res: express.Response) => {
    const prodPath = path.join(process.cwd(), 'dist', 'manifest.json');
    const publicPath = path.join(process.cwd(), 'public', 'manifest.json');
    const target = fs.existsSync(prodPath) ? prodPath : publicPath;
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.sendFile(target);
  };
  app.get('/manifest.json', handleManifest);
  app.get('/manifest.webmanifest', handleManifest);

  // Vite middleware in dev; static file serving in prod
  if (process.env.NODE_ENV !== 'production') {
    app.use('/.well-known', express.static(path.join(process.cwd(), 'public', '.well-known')));
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { dotfiles: 'allow' }));
    app.get('*', (_req, res) => {
      if (_req.path.startsWith('/.well-known')) {
        return handleAssetLinks(_req, res);
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chess application with CHESSMATE running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
