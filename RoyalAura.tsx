import React from 'react';
import { PieceColor, PieceType } from '../types/chess';

interface RoyalAuraProps {
  type: PieceType;
  color: PieceColor;
}

/**
 * Returns the CSS drop-shadow classes for the royal piece silhouette contour.
 */
export const getRoyalSilhouetteGlow = (type: PieceType, color: PieceColor): string => {
  if (type !== 'k' && type !== 'q') return '';

  const isWhite = color === 'w';

  if (isWhite) {
    return type === 'k'
      ? 'drop-shadow-[0_0_7px_rgba(245,158,11,0.52)] drop-shadow-[0_0_13px_rgba(251,191,36,0.22)]'
      : 'drop-shadow-[0_0_7px_rgba(251,191,36,0.58)] drop-shadow-[0_0_14px_rgba(254,240,138,0.25)]';
  } else {
    return type === 'k'
      ? 'drop-shadow-[0_0_7px_rgba(168,85,247,0.62)] drop-shadow-[0_0_14px_rgba(129,140,248,0.26)]'
      : 'drop-shadow-[0_0_7px_rgba(192,132,252,0.66)] drop-shadow-[0_0_15px_rgba(168,85,247,0.30)]';
  }
};

/**
 * Luminous royal aura rendering behind the King and Queen.
 * Features an organic multi-stop ambient light burst and a crown halo
 * with a soft breathing pulse.
 */
export const RoyalAura: React.FC<RoyalAuraProps> = React.memo(({ type, color }) => {
  if (type !== 'k' && type !== 'q') return null;

  const isWhite = color === 'w';
  const isKing = type === 'k';

  // White Royals: Radiant Imperial Sunburst & Champagne Gold
  // Black Royals: Sovereign Astral Amethyst & Royal Orchid-Violet
  const bgGradient = isWhite
    ? isKing
      ? 'radial-gradient(ellipse at 50% 48%, rgba(245, 158, 11, 0.38) 0%, rgba(251, 191, 36, 0.20) 42%, rgba(254, 240, 138, 0.08) 68%, transparent 84%)'
      : 'radial-gradient(ellipse at 50% 48%, rgba(251, 191, 36, 0.40) 0%, rgba(245, 158, 11, 0.22) 42%, rgba(254, 240, 138, 0.09) 68%, transparent 84%)'
    : isKing
      ? 'radial-gradient(ellipse at 50% 48%, rgba(147, 51, 234, 0.44) 0%, rgba(129, 140, 248, 0.24) 42%, rgba(192, 132, 252, 0.09) 68%, transparent 84%)'
      : 'radial-gradient(ellipse at 50% 48%, rgba(168, 85, 247, 0.46) 0%, rgba(147, 51, 234, 0.26) 42%, rgba(216, 180, 254, 0.10) 68%, transparent 84%)';

  // Secondary soft crown crest aura hovering near the top finial / coronet
  const crownGradient = isWhite
    ? 'radial-gradient(circle at 50% 20%, rgba(254, 240, 138, 0.35) 0%, rgba(245, 158, 11, 0.14) 50%, transparent 80%)'
    : 'radial-gradient(circle at 50% 20%, rgba(216, 180, 254, 0.38) 0%, rgba(147, 51, 234, 0.16) 50%, transparent 80%)';

  return (
    <div
      className="absolute inset-[-14%] pointer-events-none select-none z-0 overflow-visible"
      aria-hidden="true"
    >
      {/* Primary Ambient Breathing Aura (GPU Composited) */}
      <div
        className={`w-full h-full rounded-full ${isKing ? 'royal-aura-king' : 'royal-aura-queen'}`}
        style={{
          background: bgGradient,
          filter: 'blur(5px)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Top Crown/Coronet Accent Luster (GPU Composited) */}
      <div
        className={`absolute inset-0 rounded-full ${isKing ? 'royal-crown-king' : 'royal-crown-queen'}`}
        style={{
          background: crownGradient,
          filter: 'blur(3px)',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  );
});
