import React from 'react';
import { Piece } from '../types/chess';
import { ChessPieceIcon } from './ChessPieces';

interface CapturedPiecesProps {
  pieces: Piece[];
  advantage: number; // positive means this side has material lead
  side: 'w' | 'b';
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = React.memo(({ pieces, advantage, side }) => {
  return (
    <div className="flex items-center gap-1.5 min-h-[28px] flex-wrap text-slate-400">
      <div className="flex items-center -space-x-1 overflow-x-auto max-w-[240px] py-0.5">
        {pieces.map((piece, index) => (
          <div
            key={index}
            className="w-5 h-5 flex-shrink-0 filter drop-shadow-sm transition-transform hover:scale-125"
            title={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type.toUpperCase()}`}
          >
            <ChessPieceIcon type={piece.type} color={piece.color} />
          </div>
        ))}
      </div>
      {advantage > 0 && (
        <span
          id={`advantage-${side}`}
          className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
        >
          +{advantage}
        </span>
      )}
    </div>
  );
});
