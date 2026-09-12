import React from 'react';
import { PieceColor, PieceType } from '../types/chess';
import { ChessPieceIcon } from './ChessPieces';

interface PromotionModalProps {
  color: PieceColor;
  onSelect: (type: PieceType) => void;
  onCancel?: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ color, onSelect }) => {
  const promotionPieces: { type: PieceType; name: string }[] = [
    { type: 'q', name: 'Queen' },
    { type: 'r', name: 'Rook' },
    { type: 'b', name: 'Bishop' },
    { type: 'n', name: 'Knight' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center">
        <h3 className="text-lg font-bold text-white mb-2">Pawn Promotion</h3>
        <p className="text-xs text-slate-400 mb-6">
          Choose a piece to promote your pawn:
        </p>

        <div className="grid grid-cols-4 gap-3">
          {promotionPieces.map(({ type, name }) => (
            <button
              key={type}
              id={`promo-btn-${type}`}
              onClick={() => onSelect(type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500 transition-all duration-200 group"
            >
              <div className="w-12 h-12 transition-transform group-hover:scale-110">
                <ChessPieceIcon type={type} color={color} />
              </div>
              <span className="text-xs font-semibold text-slate-300 group-hover:text-amber-400 mt-2">
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
