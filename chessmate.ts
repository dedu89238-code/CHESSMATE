import { Move, PieceColor, PieceType, Square } from './chess';
import { DetailedPositionAnalysis } from '../utils/chessPositionAnalysis';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  type?: 'chat' | 'auto' | 'system';
  isAutoComment?: boolean;
}

export interface ChessmateGameContext {
  fen?: string;
  playerColor: PieceColor;
  turn: PieceColor;
  fullmoveNumber: number;
  moveHistorySan: string[];
  lastMoveSan: string | null;
  lastMove?: Move | null;
  inCheck: boolean;
  caissaInCheck?: boolean;
  isCheckmate?: boolean;
  isStalemate?: boolean;
  kingSquare?: string;
  kingAttackers?: string[];
  kingSafetyAssessment?: string;
  materialSummary?: string;
  materialDiff?: number;
  capturedByPlayer?: string[];
  capturedByOpponent?: string[];
  canCastleKingside?: boolean;
  canCastleQueenside?: boolean;
  castlingRights?: { kingside: boolean; queenside: boolean };
  enPassantAvailable?: boolean;
  enPassantTarget?: string | null;
  promotionPossibilities?: string[];
  tacticalThreats?: string[];
  tacticalOpportunities?: string[];
  hangingPiecesPlayer?: string[];
  hangingPiecesCaissa?: string[];
  legalMovesCount?: number;
  keyLegalMovesSan?: string[];
  aiStrength?: number;
  aiStrengthZone?: string;
  analysis?: DetailedPositionAnalysis;
}

