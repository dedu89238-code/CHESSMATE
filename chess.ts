export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export type Board = (Piece | null)[][];

export interface Square {
  row: number; // 0 to 7 (0 is rank 8, 7 is rank 1)
  col: number; // 0 to 7 (0 is file a, 7 is file h)
}

export interface Move {
  from: Square;
  to: Square;
  piece: Piece;
  captured?: Piece | null;
  isCastling?: 'kingside' | 'queenside';
  isEnPassant?: boolean;
  promotion?: PieceType;
  san: string;
}

export type GameStatus = 
  | 'in-progress' 
  | 'checkmate' 
  | 'stalemate' 
  | 'draw-insufficient' 
  | 'draw-50-moves' 
  | 'timeout' 
  | 'resigned';

export type BoardTheme = 'wood' | 'emerald' | 'slate' | 'blue' | 'coral';
export type TimeControl = 'none' | '1' | '3' | '5' | '10' | '15';
export type GameMode = 'ai' | 'pvp';
export type PlayerColor = 'w' | 'b' | 'random';

export interface GameSettings {
  aiStrength: number; // 1 to 100 on continuous meter (Green -> Yellow -> Orange -> Red)
  gameMode: GameMode;
  playerColor: PlayerColor;
  timeControl: TimeControl;
  boardTheme: BoardTheme;
  soundEnabled: boolean;
  showLegalMoves: boolean;
  highlightLastMove: boolean;
}
