import { ChessmateGameContext } from '../types/chessmate';
import { Board, PieceColor, Square } from '../types/chess';
import { findKing, isInsideBoard, squareToCoord } from './chessEngine';

// Identify attackers threatening a specific target square
export function getAttackersOnSquare(board: Board, target: Square, attackingColor: PieceColor): string[] {
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

  return attackers;
}

// Strictly verify if message is related to chess
export function isChessRelated(message: string): boolean {
  const text = message.toLowerCase().trim();

  // Known non-chess trigger words
  const nonChess = [
    /\b(weather|temperature|forecast|rain|cloud|sunny|humid)\b/,
    /\b(love story|girlfriend|boyfriend|romance|dating|marry)\b/,
    /\b(recipe|cook|baking|dinner|lunch|breakfast|pizza|burger)\b/,
    /\b(crypto|bitcoin|ethereum|stock|investing|forex|wallet)\b/,
    /\b(president|politics|biden|trump|congress|election)\b/,
    /\b(movie|film|netflix|actor|actress|hollywood|cinema)\b/,
    /\b(music|song|album|spotify|artist|singer|guitar)\b/,
    /\b(joke|funny story)\b/,
  ];

  // Strong chess keywords
  const chessKeywords = [
    'chess', 'king', 'queen', 'rook', 'bishop', 'knight', 'pawn',
    'square', 'file', 'rank', 'check', 'mate', 'checkmate', 'stalemate',
    'castle', 'castling', 'en passant', 'promotion', 'opening', 'defense',
    'gambit', 'tactic', 'fork', 'pin', 'skewer', 'endgame', 'blunder',
    'caissa', 'move', 'attack', 'threat', 'piece', 'capture', 'board',
    'turn', 'game', 'sicilian', 'caro', 'french', 'ruy lopez', 'fischer',
    'kasparov', 'carlsen', 'elo', 'grandmaster', 'advantage', 'tempo',
    'fianchetto', 'discovered', 'passed pawn', 'outpost', 'zugzwang',
    'center', 'development', 'sacrifice', 'exchange',
  ];

  const hasChessKeyword = chessKeywords.some(kw => text.includes(kw));

  // If matches non-chess list and has no explicit chess keyword, it's definitely non-chess
  if (nonChess.some(rx => rx.test(text)) && !hasChessKeyword) {
    return false;
  }

  // If short greeting (e.g. "hi", "hello", "who are you")
  if (/^(hi|hello|hey|greetings|who are you|help|what can you do)/i.test(text)) {
    return true;
  }

  // If asking about the game, moves, danger, or strategic advice
  if (/\b(last move|good move|my king|watch out|winning|ahead|position|play|danger|safe|safety|advice|recommend|what should i do|what to do|what next|next step|threat|threatened|defend)\b/i.test(text)) {
    return true;
  }

  return hasChessKeyword;
}

// Local smart analyzer when offline or responding to position queries
export function generateLocalChessmateReply(
  message: string,
  context?: ChessmateGameContext
): string {
  const trimmed = message.trim();

  // STRICT REFUSAL FOR NON-CHESS QUESTIONS
  if (!isChessRelated(trimmed)) {
    return 'Sorry! I can only talk about chess. ♟️';
  }

  const lower = trimmed.toLowerCase();
  const analysis = context?.analysis;

  // 1. Greetings
  if (/^(hi|hello|hey|greetings)\b/i.test(lower)) {
    return 'Greetings! I am CHESSMATE, your chess companion. I can help analyze your moves against CAISSA, discuss openings, tactics, endgames, or review your current position. What is on your mind? ♟️';
  }

  // 2. Who are you?
  if (/who are you|what are you|what can you do/i.test(lower)) {
    return 'I am **CHESSMATE**, your personal chess companion and advisor. You are playing against **CAISSA**, the AI opponent. My role is to observe your game, answer questions about chess strategy and rules, and help you sharpen your play without interfering in the match! ♟️';
  }

  // 3. Question: "Am I in danger?" / Threats
  if (/am i in danger|are my pieces in danger|is there a threat|any danger|am i safe|what is threatening me/i.test(lower)) {
    if (!context) {
      return 'I cannot view the board right now, but always check for checks, captures, and undefended pieces! ♟️';
    }

    // A. Check
    if (context.inCheck || analysis?.inCheck) {
      const attackers = analysis?.playerKing.attackers || context.kingAttackers || [];
      const atkStr = attackers.length > 0 ? attackers.join(', ') : 'an opposing piece';
      return `⚠️ **Direct Danger**: Your King on **${context.kingSquare || 'the board'}** is in **CHECK** by ${atkStr}! You must resolve this check on this turn by moving the King, blocking the attack, or capturing the checker.`;
    }

    // B. Hanging pieces
    if (analysis && analysis.hangingPiecesPlayer.length > 0) {
      return `⚠️ **Tactical Threat**: You have undefended piece(s) under attack:
• ${analysis.hangingPiecesPlayer.join('\n• ')}

Consider moving or defending them immediately so CAISSA doesn't win material!`;
    }

    // C. Other threats
    if (analysis && analysis.threatsToPlayer.length > 0) {
      return `⚠️ **Threat Alert**: ${analysis.threatsToPlayer[0].description}`;
    }

    // D. Safe
    return `🛡️ **You are not in any immediate danger.** Your King on **${context.kingSquare || 'the back rank'}** is safe and your pieces are defended. You have the freedom to develop your plans and put pressure on CAISSA.`;
  }

  // 4. Question: "What should I do?"
  if (/what should i do|what to do|recommend a move|any advice|what move should i play|next step/i.test(lower)) {
    if (!context) {
      return 'Focus on classical chess principles: control the center, develop minor pieces, and ensure your King is safe!';
    }

    // A. In check
    if (context.inCheck || analysis?.inCheck) {
      return '🚨 **Immediate Priority**: Your King is in check! You must defend by moving the King to a safe square, blocking the line of attack, or capturing the checking piece.';
    }

    // B. Defend hanging piece
    if (analysis && analysis.hangingPiecesPlayer.length > 0) {
      return `🛡️ **Defensive Priority**: Your **${analysis.hangingPiecesPlayer[0]}** is currently undefended and attacked. Safeguard it by moving it or defending it with another piece.`;
    }

    // C. Capture opponent hanging piece
    if (analysis && analysis.hangingPiecesCaissa.length > 0) {
      return `🎯 **Tactical Opportunity**: CAISSA has left **${analysis.hangingPiecesCaissa[0]}** undefended! Look for a clean capture to win material.`;
    }

    // D. Castle if uncastled and legal
    if (analysis && !analysis.playerKing.isCastled && (analysis.castling.playerCanCastleKingsideNow || analysis.castling.playerCanCastleQueensideNow)) {
      return '👑 **Recommended Action**: Your King is still in the center. Castle now to tuck your King into safety and connect your Rooks for the middlegame.';
    }

    // E. Opening principles
    if (context.fullmoveNumber <= 8) {
      return '♟️ **Opening Development**: Focus on central control (e4, d4, e5, d5), developing your knights and bishops toward active squares, and preparing King safety.';
    }

    // F. Positional / Material advice
    if (analysis) {
      if (analysis.materialDiff > 2) {
        return `📈 **Strategic Plan**: You hold a +${analysis.materialDiff} material lead. Trade off pieces (not pawns) to simplify cleanly toward a winning endgame!`;
      }
      if (analysis.materialDiff < -2) {
        return `⚔️ **Counterplay**: You are down by ${Math.abs(analysis.materialDiff)} points. Avoid passive piece exchanges and look for active threats against CAISSA's position.`;
      }
      return `♟️ **Plan**: ${analysis.recommendedAction}`;
    }

    return 'Look for candidate moves that activate your least active piece, contest open files, and keep your pieces coordinated! ♟️';
  }

  // 5. Question: "Is my king safe?"
  if (/is my king safe|how safe is my king|king safety|what is attacking my king|attackers on my king|king attacked/i.test(lower)) {
    if (!context) {
      return 'I cannot see the board right now, but always monitor open diagonals and knight jumps targeting your king! ♟️';
    }

    const kingSq = context.kingSquare || 'the board';

    if (context.inCheck || analysis?.inCheck) {
      const attackers = analysis?.playerKing.attackers || context.kingAttackers || [];
      const atkText = attackers.length > 0 ? attackers.join(', ') : 'enemy pieces';
      return `🚨 **Your King is in CHECK!** It is under direct attack by ${atkText} on square **${kingSq}**. You must respond to the check immediately.`;
    }

    if (analysis) {
      if (analysis.playerKing.isCastled) {
        if (analysis.playerKing.pawnShield === 'intact') {
          return `👑 **Your King is very safe.** It is securely castled on **${kingSq}** behind an intact pawn shield with no direct lines of attack open.`;
        }
        return `👑 Your King is castled on **${kingSq}**. The pawn shield has advanced or shifted, so stay vigilant about open files or diagonals, but the king is generally well-placed.`;
      } else {
        if (context.fullmoveNumber > 7) {
          return `⚠️ Your King remains in the center on **${kingSq}**. Uncastled kings can quickly become targets if the central files open up. Prioritize castling soon!`;
        }
        return `Your King is currently on its starting square **${kingSq}**. In the opening, prepare castling by developing your minor pieces to secure your King.`;
      }
    }

    return `Your King on **${kingSq}** is not in check. Keep your pawn shield intact and ensure back-rank escape squares are ready when heavy pieces are in play! 👑`;
  }

  // 6. Question: "Who is winning?" / Evaluation
  if (/who is winning|who is ahead|evaluation|who has the advantage|am i winning|is caissa winning|score/i.test(lower)) {
    if (!context) {
      return 'I cannot view the board right now to evaluate the position.';
    }

    if (context.isCheckmate || analysis?.isCheckmate) {
      return context.turn === context.playerColor
        ? 'Game over: CAISSA has delivered checkmate.'
        : 'Game over: You have delivered checkmate against CAISSA! Victory is yours! 🏆';
    }

    if (context.isStalemate || analysis?.isStalemate) {
      return 'The game is a draw by stalemate.';
    }

    if (analysis) {
      const diff = analysis.materialDiff;
      if (diff >= 4) {
        return `🏆 **You are clearly winning!** You hold a commanding +${diff} point material advantage (${analysis.materialSummary}). Maintain solid piece coordination and convert cleanly.`;
      }
      if (diff >= 1) {
        return `📈 **You have the advantage.** You are up by +${diff} in material (${analysis.materialSummary}). Keep the pressure on CAISSA without allowing counter-tactics.`;
      }
      if (diff === 0) {
        return `⚖️ **The position is balanced.** Material is completely equal (0). The outcome hinges on tactical sharpness, central control, and King safety.`;
      }
      if (diff >= -3) {
        return `📉 **CAISSA holds a slight edge.** CAISSA is up by +${Math.abs(diff)} material. Look for active counterplay and tactical opportunities to recover the balance.`;
      }
      return `⚠️ **CAISSA has a decisive material advantage.** CAISSA is up by +${Math.abs(diff)} material (${analysis.materialSummary}). Fight on with tactical complications and counter-attacks!`;
    }

    return 'The position is in progress. Check material balance and King safety to assess who holds the initiative! ♟️';
  }

  // 7. Question: "Can I castle?"
  if (/can i castle|can i still castle|castling possible|is castling available/i.test(lower)) {
    let response = `**Castling Rules Summary:**
• King moves two squares toward the chosen Rook; the Rook moves to the square immediately adjacent over the King.
• Mandatory conditions: King has not moved, Rook has not moved, intermediate squares are clear, and the King is neither in check, passing through check, nor landing in check. 👑\n\n`;

    if (analysis) {
      const canK = analysis.castling.playerCanCastleKingsideNow;
      const canQ = analysis.castling.playerCanCastleQueensideNow;

      if (canK && canQ) {
        response += `**Current Position:** ✅ You can legally castle **both Kingside (O-O) and Queenside (O-O-O)** on this move!`;
      } else if (canK) {
        response += `**Current Position:** ✅ You can legally castle **Kingside (O-O)** right now!\n• Queenside: ${analysis.castling.playerQueensideReason}`;
      } else if (canQ) {
        response += `**Current Position:** ✅ You can legally castle **Queenside (O-O-O)** right now!\n• Kingside: ${analysis.castling.playerKingsideReason}`;
      } else {
        response += `**Current Position:** ❌ Castling is not legally available right now:\n• **Kingside**: ${analysis.castling.playerKingsideReason}\n• **Queenside**: ${analysis.castling.playerQueensideReason}`;
      }
      return response;
    }

    if (context && (context.canCastleKingside !== undefined || context.canCastleQueenside !== undefined)) {
      const canK = context.canCastleKingside;
      const canQ = context.canCastleQueenside;
      if (canK && canQ) {
        response += `**Current Game:** You can legally castle both **Kingside (O-O)** and **Queenside (O-O-O)** right now!`;
      } else if (canK) {
        response += `**Current Game:** You can legally castle **Kingside (O-O)** right now!`;
      } else if (canQ) {
        response += `**Current Game:** You can legally castle **Queenside (O-O-O)** right now!`;
      } else {
        response += `**Current Game:** Castling is not legally available on this move.`;
      }
      return response;
    }

    return response;
  }

  // 8. Question: "Did I make a good move?" / "Was my last move good?"
  if (/did i make a good move|was my last move good|how was my move|how was my last move|rate my move|is my move good|was that good/i.test(lower)) {
    if (!context || !context.lastMoveSan) {
      return 'You haven\'t made any moves yet in this match. Open with a central pawn push like **e4** or **d4**, or develop a knight with **Nf3**! ♟️';
    }

    const last = context.lastMoveSan;

    // Check if player hung a piece with that move
    if (analysis && analysis.hangingPiecesPlayer.length > 0 && analysis.lastMoveDetail) {
      const movedCoord = analysis.lastMoveDetail.to;
      const hungHere = analysis.hangingPiecesPlayer.find(hp => hp.includes(movedCoord));
      if (hungHere) {
        return `⚠️ Caution: Your move **${last}** left your ${hungHere} undefended and directly under attack. Watch out for CAISSA's immediate reply!`;
      }
    }

    if (context.inCheck || analysis?.caissaInCheck) {
      return `🔥 Your move **${last}** put CAISSA's King in **CHECK**! A forcing, aggressive move that seizes the initiative.`;
    }

    if (last.includes('x')) {
      return `🎯 Your move **${last}** was a material capture! Winning material or removing active defenders shifts the game balance in your favor.`;
    }

    if (last === 'O-O' || last === 'O-O-O') {
      return `👑 Castling (**${last}**) is an excellent classical move! It tucks your King into safety and connects your Rooks along the back rank.`;
    }

    if (/^[NnBb]/.test(last)) {
      return `♟️ Developing with **${last}** is solid. Active minor piece development and controlling central squares is the cornerstone of great chess.`;
    }

    if (/^[a-h]/.test(last)) {
      return `Pawn move **${last}** stakes claim to space. Make sure your pieces develop swiftly behind your pawn framework.`;
    }

    return `Your last move was **${last}**. It keeps tension on the board. Always consider CAISSA's top candidate responses before choosing your next move!`;
  }

  // 9. En Passant rule
  if (/en passant/i.test(lower)) {
    let epReply = `**En Passant** ("in passing") is a special pawn capture rule in chess:
• When a pawn advances two squares from its starting rank and lands directly adjacent to an opposing pawn on the same rank, the opponent has the option to capture it as if it had only moved one square.
• **Crucial rule**: The capture must be made on the very next turn, or the right to capture en passant is permanently lost! ♟️`;

    if (analysis && analysis.enPassant.available) {
      epReply += `\n\n**In this position:** En passant is currently available! A pawn can capture on **${analysis.enPassant.targetSquare}**.`;
    }
    return epReply;
  }

  // 10. General Castling query (general rule)
  if (/castle|castling/i.test(lower)) {
    return `**Castling** is a special maneuver involving the King and one of your Rooks to safeguard the King and activate the Rook in a single turn.

### How the Pieces Move:
• **The King moves two squares toward the chosen Rook.**
• **The Rook moves to the square immediately on the other side of the King.**

For example:
• **Kingside Castling (Short Castling, O-O):**
  - White: King **e1 → g1**, Rook **h1 → f1**
  - Black: King **e8 → g8**, Rook **h8 → f8**
• **Queenside Castling (Long Castling, O-O-O):**
  - White: King **e1 → c1**, Rook **a1 → d1**
  - Black: King **e8 → c8**, Rook **a8 → d8**

### All Mandatory Conditions to Castle:
1. **The King has never moved.**
2. **The chosen Rook has never moved.**
3. **There are no pieces between them** (all intermediate squares must be vacant).
4. **The King is not currently in check.**
5. **The King does not pass through a square attacked by an enemy piece.**
6. **The King does not finish on a square attacked by an enemy piece.** 👑`;
  }

  // 11. Pawn Promotion rule
  if (/promotion|promote/i.test(lower)) {
    return `**Pawn Promotion** occurs when a pawn reaches the farthest rank from its starting position (the 8th rank for White, or the 1st rank for Black):
• The player immediately transforms the pawn into a **Queen, Rook, Bishop, or Knight** of the same color.
• You can promote to a Queen even if your original Queen is still on the board (multiple Queens are completely legal).
• The promotion takes effect immediately on that turn. ♟️`;
  }

  // 12. Stalemate vs Checkmate
  if (/stalemate|checkmate|draw/i.test(lower)) {
    return `In chess, the difference between **Checkmate** and **Stalemate** is decisive:
• **Checkmate**: The King is placed in **check** (under attack), and there is **no legal move** to escape, block, or capture the attacker. The attacking player wins immediately.
• **Stalemate**: The player to move is **NOT in check**, but has **no legal moves anywhere on the board**. The game immediately ends in a **draw (tie)**.
• **Other Draws**: Threefold repetition of position, the 50-move rule (no pawn moves or captures in 50 full moves), or insufficient material to deliver checkmate. ♟️`;
  }

  // 13. General Advice / Openings
  if (/opening|sicilian|french|caro|ruy lopez/i.test(lower)) {
    return `Classical opening principles recommend:
1. **Control the center** (e4, d4, e5, d5) with pawns and pieces.
2. **Develop knights before bishops** toward active central squares.
3. **Castle early** to safeguard your King and connect your rooks.
4. **Avoid moving the same piece twice** in the opening unless tactically forced. ♟️`;
  }

  // General helpful chess companion fallback
  return `As your chess companion, I am observing your match against CAISSA. Focus on piece coordination, controlling key central squares, and scanning for tactical motifs (forks, pins, and skewers). Ask me anytime about your moves, rules, or tactical ideas! ♟️`;
}

