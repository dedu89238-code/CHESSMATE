import { GameMode, GameSettings, GameStatus, Move, Piece, PieceColor, Square, TimeControl } from '../types/chess';
import { ChatMessage } from '../types/chessmate';
import { ChessPosition, getCapturedPieces } from './chessEngine';
import { positionToFen } from './chessPositionAnalysis';

export const ACTIVE_GAME_STORAGE_KEY = 'chessmate_active_game_state';

export interface SavedActiveGameState {
  version: 1;
  savedAt: number; // Unix timestamp
  gameStatus: GameStatus; // 'in-progress' for active games
  winner: PieceColor | null;
  gameMode: GameMode; // 'ai' | 'pvp'
  userColor: PieceColor; // 'w' | 'b'
  flipped: boolean;

  // Board & Position
  fen: string;
  position: ChessPosition;
  positionHistory: ChessPosition[];

  // Moves & Captures
  moveHistory: Move[];
  lastMove: Move | null;
  capturedPieces: {
    whiteCaptured: Piece[];
    blackCaptured: Piece[];
    advantage: number;
  };

  // Clocks & Timers
  timeControl: TimeControl;
  whiteTime: number; // seconds remaining
  blackTime: number; // seconds remaining

  // AI Difficulty & Settings
  aiStrength: number;
  settingsSnapshot?: Partial<GameSettings>;

  // CAISSA State
  caissa: {
    messages: ChatMessage[];
    isChessmateOpen: boolean;
    activeRightTab: 'moves' | 'chessmate';
    lastCommentMoveNumber: number;
  };
}

export interface SaveGameInput {
  position: ChessPosition;
  positionHistory: ChessPosition[];
  moveHistory: Move[];
  lastMove: Move | null;
  gameStatus: GameStatus;
  winner: PieceColor | null;
  gameMode: GameMode;
  userColor: PieceColor;
  flipped: boolean;
  timeControl: TimeControl;
  whiteTime: number;
  blackTime: number;
  aiStrength: number;
  caissa: {
    messages: ChatMessage[];
    isChessmateOpen: boolean;
    activeRightTab: 'moves' | 'chessmate';
    lastCommentMoveNumber: number;
  };
  settingsSnapshot?: Partial<GameSettings>;
}

/**
 * Persists the active game state to localStorage.
 */
export function saveActiveGameState(input: SaveGameInput): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;

    // Do not save as an active game if the game is already finished
    if (input.gameStatus !== 'in-progress') {
      clearActiveGameState();
      return;
    }

    const fen = positionToFen(input.position);
    const capturedPieces = getCapturedPieces(input.moveHistory);

    const state: SavedActiveGameState = {
      version: 1,
      savedAt: Date.now(),
      gameStatus: input.gameStatus,
      winner: input.winner,
      gameMode: input.gameMode,
      userColor: input.userColor,
      flipped: input.flipped,
      fen,
      position: input.position,
      positionHistory: input.positionHistory,
      moveHistory: input.moveHistory,
      lastMove: input.lastMove,
      capturedPieces,
      timeControl: input.timeControl,
      whiteTime: Math.max(0, input.whiteTime),
      blackTime: Math.max(0, input.blackTime),
      aiStrength: input.aiStrength,
      settingsSnapshot: input.settingsSnapshot,
      caissa: {
        messages: input.caissa.messages.slice(-50), // keep latest 50 messages to maintain clean storage
        isChessmateOpen: input.caissa.isChessmateOpen,
        activeRightTab: input.caissa.activeRightTab,
        lastCommentMoveNumber: input.caissa.lastCommentMoveNumber,
      },
    };

    localStorage.setItem(ACTIVE_GAME_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save active chess game state:', err);
  }
}

/**
 * Loads and validates an active, unfinished game from localStorage.
 * Returns null if there is no saved game, if the game is already finished,
 * or if the saved data is corrupted.
 */
export function loadActiveGameState(): SavedActiveGameState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;

    const raw = localStorage.getItem(ACTIVE_GAME_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SavedActiveGameState;
    if (!parsed || typeof parsed !== 'object') return null;

    // Strict validation: Game must be in-progress (not finished)
    if (parsed.gameStatus !== 'in-progress') {
      return null;
    }

    // Validate board and position
    if (
      !parsed.position ||
      !Array.isArray(parsed.position.board) ||
      parsed.position.board.length !== 8 ||
      !parsed.position.board.every(row => Array.isArray(row) && row.length === 8)
    ) {
      return null;
    }

    // Validate active turn
    if (parsed.position.turn !== 'w' && parsed.position.turn !== 'b') {
      return null;
    }

    // Validate moveHistory
    if (!Array.isArray(parsed.moveHistory)) {
      return null;
    }

    // Validate positionHistory
    if (!Array.isArray(parsed.positionHistory) || parsed.positionHistory.length === 0) {
      parsed.positionHistory = [parsed.position];
    }

    // Validate player colors and mode
    if (parsed.gameMode !== 'ai' && parsed.gameMode !== 'pvp') {
      parsed.gameMode = 'ai';
    }

    if (parsed.userColor !== 'w' && parsed.userColor !== 'b') {
      parsed.userColor = 'w';
    }

    // Ensure clocks are valid numbers
    if (typeof parsed.whiteTime !== 'number' || isNaN(parsed.whiteTime)) {
      parsed.whiteTime = 300;
    }
    if (typeof parsed.blackTime !== 'number' || isNaN(parsed.blackTime)) {
      parsed.blackTime = 300;
    }

    // Ensure AI strength is valid
    if (typeof parsed.aiStrength !== 'number' || isNaN(parsed.aiStrength)) {
      parsed.aiStrength = 65;
    }

    // Ensure CAISSA state structure
    if (!parsed.caissa || typeof parsed.caissa !== 'object') {
      parsed.caissa = {
        messages: [],
        isChessmateOpen: false,
        activeRightTab: 'moves',
        lastCommentMoveNumber: -10,
      };
    } else {
      if (!Array.isArray(parsed.caissa.messages)) {
        parsed.caissa.messages = [];
      }
      if (typeof parsed.caissa.lastCommentMoveNumber !== 'number') {
        parsed.caissa.lastCommentMoveNumber = -10;
      }
    }

    // Compute FEN if missing
    if (!parsed.fen) {
      parsed.fen = positionToFen(parsed.position);
    }

    // Compute captured pieces if missing
    if (!parsed.capturedPieces) {
      parsed.capturedPieces = getCapturedPieces(parsed.moveHistory);
    }

    return parsed;
  } catch (err) {
    console.warn('Failed to load active chess game state:', err);
    return null;
  }
}

/**
 * Removes the active game record from storage.
 */
export function clearActiveGameState(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear active chess game state:', err);
  }
}
