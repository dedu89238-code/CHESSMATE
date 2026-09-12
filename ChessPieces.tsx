import React from 'react';
import { PieceColor, PieceType } from '../types/chess';

interface PieceIconProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export const ChessPieceIcon: React.FC<PieceIconProps> = React.memo(({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  const idPrefix = isWhite ? 'pearl' : 'obsidian';

  // Crisp, high-contrast outlines and inner carving lines
  // White: Polished pearl/ivory with warm antique bronze/umber edge definition
  // Black: Volcanic obsidian with refined dark edge, clear inner carving, and subtle garnet accents
  const outerStroke = isWhite ? '#2e1f14' : '#140e14';
  const innerLine = isWhite ? '#5a4430' : '#735665';
  const rimColor = isWhite ? '#ffffff' : '#b8abb4';
  const crimsonAccent = '#a3163d';
  const champagneGoldAccent = '#c89e3a';

  // Dynamic filter for optimal contrast on both light & dark squares
  // Pearl: soft grounding contact shadow
  // Obsidian: deep contact shadow + ultra-fine 1px specular silhouette separation against dark board squares
  const dropShadowFilter = isWhite
    ? 'drop-shadow-[0_3px_5px_rgba(0,0,0,0.42)]'
    : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] drop-shadow-[0_0_1.2px_rgba(235,225,230,0.28)]';

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} filter ${dropShadowFilter} select-none pointer-events-none`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* ============================================================== */}
        {/* WHITE SIDE: Lustrous Polished Pearl & Warm Ivory Alabaster    */}
        {/* Multi-stop mother-of-pearl sheen, crystalline specular highlight */}
        {/* ============================================================== */}
        <linearGradient id={`${idPrefix}-body-grad`} x1="18%" y1="0%" x2="82%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="16%" stopColor="#fdfbf8" />
          <stop offset="42%" stopColor="#f5ede2" />
          <stop offset="70%" stopColor="#e5dacb" />
          <stop offset="88%" stopColor="#d3c4b1" />
          <stop offset="100%" stopColor="#bfaea0" />
        </linearGradient>

        <linearGradient id={`${idPrefix}-base-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="28%" stopColor="#f6eee4" />
          <stop offset="65%" stopColor="#e3d7c7" />
          <stop offset="100%" stopColor="#bdaaa0" />
        </linearGradient>

        {/* ============================================================== */}
        {/* BLACK SIDE: Volcanic Obsidian Glass with Subtle Crimson Accents*/}
        {/* Deep jet black, glassy metallic glint, deep garnet shadow edge */}
        {/* ============================================================== */}
        <linearGradient id={`${idPrefix}-black-grad`} x1="18%" y1="0%" x2="82%" y2="100%">
          <stop offset="0%" stopColor="#504650" />
          <stop offset="18%" stopColor="#302630" />
          <stop offset="52%" stopColor="#1a141a" />
          <stop offset="80%" stopColor="#0e0a0e" />
          <stop offset="95%" stopColor="#2c0c16" />
          <stop offset="100%" stopColor="#160509" />
        </linearGradient>

        <linearGradient id={`${idPrefix}-black-base`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3e343d" />
          <stop offset="30%" stopColor="#221a23" />
          <stop offset="75%" stopColor="#120c12" />
          <stop offset="100%" stopColor="#2a0a13" />
        </linearGradient>

        {/* Ambient Contact Ground Shadow */}
        <radialGradient id={`${idPrefix}-contact-shadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.52" />
          <stop offset="70%" stopColor="#000000" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ============================================================== */}
      {/* PAWN: Traditional weighted base, slender trunk, spherical head */}
      {/* ============================================================== */}
      {type === 'p' && (
        <g id="staunton-pawn">
          {/* Ground Contact Shadow */}
          <ellipse cx="22.5" cy="40.5" rx="13.5" ry="1.8" fill={`url(#${idPrefix}-contact-shadow)`} />

          {/* Base Plinth */}
          <path
            d="M 9,39.5 L 36,39.5 C 36,37.5 34.5,36 32.5,36 L 12.5,36 C 10.5,36 9,37.5 9,39.5 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.2"
          />

          {/* Stepped Pedestal Base */}
          <path
            d="M 12,36 C 12,33.5 14,32 17,31 L 28,31 C 31,32 33,33.5 33,36 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.1"
          />

          {/* Body & Spherical Head */}
          <path
            d="M 22.5,9 C 20.29,9 18.5,10.79 18.5,13 C 18.5,13.89 18.79,14.71 19.28,15.38 C 17.33,16.5 16,18.59 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11.5,31.5 11.5,36 L 33.5,36 C 33.5,31.5 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,18.59 27.67,16.5 25.72,15.38 C 26.21,14.71 26.5,13.89 26.5,13 C 26.5,10.79 24.71,9 22.5,9 Z"
            fill={isWhite ? `url(#${idPrefix}-body-grad)` : `url(#${idPrefix}-black-grad)`}
            stroke={outerStroke}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Waist and Collar Carved Accent Rings */}
          <path
            d="M 17,21 C 17,21 19,22 22.5,22 C 26,22 28,21 28,21"
            stroke={innerLine}
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 18.5,15.5 C 18.5,15.5 20,16.5 22.5,16.5 C 25,16.5 26.5,15.5 26.5,15.5"
            stroke={innerLine}
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />

          {/* Spherical Head Specular Glint */}
          <circle
            cx="20.5"
            cy="11.5"
            r="1.2"
            fill="#ffffff"
            opacity={isWhite ? '0.9' : '0.5'}
          />

          {/* Subtle Head Reflection (Pearl Champagne Gold vs Obsidian Crimson) */}
          <ellipse
            cx="23.8"
            cy="13.8"
            rx="1.6"
            ry="1.1"
            fill={isWhite ? champagneGoldAccent : crimsonAccent}
            opacity={isWhite ? '0.3' : '0.45'}
          />

          {/* Left Shoulder Specular Rim Highlight */}
          <path
            d="M 17,27 C 16,29 14,33 13.5,35"
            stroke={rimColor}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity={isWhite ? '0.65' : '0.52'}
          />

          {/* Flank Contour Rim (Pearl Champagne Gold vs Obsidian Crimson) */}
          <path
            d="M 28,27 C 29,29 31,33 31.5,35"
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth="0.85"
            strokeLinecap="round"
            opacity={isWhite ? '0.62' : '0.58'}
          />
        </g>
      )}

      {/* ============================================================== */}
      {/* ROOK: Fortress castle tower, 4 crenels, 3 battlements embrasures */}
      {/* ============================================================== */}
      {type === 'r' && (
        <g id="staunton-rook">
          {/* Ground Contact Shadow */}
          <ellipse cx="22.5" cy="40.5" rx="14.5" ry="1.8" fill={`url(#${idPrefix}-contact-shadow)`} />

          {/* Base Plinth */}
          <path
            d="M 9,39.5 L 36,39.5 L 36,36 L 9,36 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.2"
          />

          {/* Base Stepped Torus */}
          <path
            d="M 12,36 L 12,32 L 33,32 L 33,36 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.2"
          />

          {/* Tapered Tower Trunk */}
          <path
            d="M 14,32 L 14,17 L 31,17 L 31,32 Z"
            fill={isWhite ? `url(#${idPrefix}-body-grad)` : `url(#${idPrefix}-black-grad)`}
            stroke={outerStroke}
            strokeWidth="1.2"
          />

          {/* Capital Rampart Cornice Band */}
          <path
            d="M 11,17 L 34,17 L 34,14 L 11,14 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.2"
          />

          {/* Castellated Battlements (4 upright crenels, 3 embrasures) */}
          <path
            d="M 11,14 L 11,9 L 15,9 L 15,11.5 L 20,11.5 L 20,9 L 25,9 L 25,11.5 L 30,11.5 L 30,9 L 34,9 L 34,14 Z"
            fill={isWhite ? `url(#${idPrefix}-body-grad)` : `url(#${idPrefix}-black-grad)`}
            stroke={outerStroke}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Horizontal Masonry Detail Lines */}
          <path
            d="M 14,29.5 L 31,29.5"
            stroke={innerLine}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M 14,23.5 L 31,23.5"
            stroke={innerLine}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="2.5 2"
            opacity="0.65"
          />

          {/* Left Edge Architectural Rim Highlight */}
          <path
            d="M 12.5,13.5 L 12.5,9.5 M 15,31 L 15,17.5"
            stroke={rimColor}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity={isWhite ? '0.7' : '0.55'}
          />

          {/* Right Edge Reflection (Pearl Champagne Gold vs Obsidian Crimson) */}
          <path
            d="M 32.5,13.5 L 32.5,9.5 M 30,31 L 30,17.5"
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth="0.85"
            strokeLinecap="round"
            opacity={isWhite ? '0.62' : '0.56'}
          />
        </g>
      )}

      {/* ============================================================== */}
      {/* KNIGHT: Canonical Staunton horse head, arched neck, mane ridges */}
      {/* ============================================================== */}
      {type === 'n' && (
        <g id="staunton-knight">
          {/* Ground Contact Shadow */}
          <ellipse cx="22.5" cy="40.5" rx="14" ry="1.8" fill={`url(#${idPrefix}-contact-shadow)`} />

          {/* Base Plinth */}
          <path
            d="M 9,39.5 L 36,39.5 C 36,36.5 34,35 32,35 L 13,35 C 11,35 9,36.5 9,39.5 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.2"
          />

          {/* Solid Base Collar Accent */}
          <path
            d="M 11.5,37 L 33.5,37"
            stroke={innerLine}
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Full Staunton Horse Bust (Neck, Crest, Head, and Muzzle) */}
          <path
            d="M 22,10 C 32.5,11 38.5,18 38,35 L 15,35 C 15,29 20,29 22.5,23 C 24,19.5 24.5,19 24.5,18 C 24.38,15.66 20.5,9.5 20.5,9.5 C 20.5,9.5 18,12 18.5,14 C 16.5,15.5 14,19.5 15,24 C 16,23 17,22.5 17.5,22.5 C 16.5,25.5 16,28 17.5,31 C 18.5,33 20.5,34 22.5,33.5 C 24,33 25,31 25,29 C 24,28.5 23.5,28 24.5,26 C 25.5,24 27.5,23.5 28.5,24 C 29,23 28.5,21.5 27.5,21 C 26.5,20.5 25.5,20.5 24.5,21 C 24.5,19.5 24,18.5 24,18 C 23.5,15 22.5,12 22,10 Z"
            fill={isWhite ? `url(#${idPrefix}-body-grad)` : `url(#${idPrefix}-black-grad)`}
            stroke={outerStroke}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Carved Mane Grooves along the Arched Neck */}
          <path
            d="M 24.5,13.5 C 26.5,15 28.5,17 29.5,19"
            stroke={innerLine}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M 27,18.5 C 29,21 31.5,23.5 32.5,26.5"
            stroke={innerLine}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M 29.5,24 C 32,27 34,30.5 35,34"
            stroke={innerLine}
            strokeWidth="1.1"
            strokeLinecap="round"
          />

          {/* Horse Ear Ridge & Fold */}
          <path
            d="M 20.5,9.5 L 21.5,13 M 18.5,14 C 19.5,14.5 20.5,15.5 21,17"
            stroke={innerLine}
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Sculpted Horse Eye */}
          {isWhite ? (
            <>
              <ellipse
                cx="19.5"
                cy="17"
                rx="1.2"
                ry="1.6"
                transform="rotate(15 19.5 17)"
                fill="#342517"
                stroke={champagneGoldAccent}
                strokeWidth="0.8"
              />
              <circle
                cx="19.2"
                cy="16.5"
                r="0.5"
                fill="#ffffff"
                opacity="0.92"
              />
            </>
          ) : (
            <>
              {/* Obsidian Garnet-Crimson Jewel Eye */}
              <ellipse
                cx="19.5"
                cy="17"
                rx="1.2"
                ry="1.6"
                transform="rotate(15 19.5 17)"
                fill="#130407"
                stroke={crimsonAccent}
                strokeWidth="0.8"
              />
              <circle
                cx="19.5"
                cy="17"
                r="0.8"
                fill="#881337"
              />
              <circle
                cx="19.2"
                cy="16.5"
                r="0.45"
                fill="#ffffff"
                opacity="0.8"
              />
            </>
          )}

          {/* Nostril and Muzzle Crease */}
          <path
            d="M 24.5,27.5 C 24,28 23.5,28.5 24,29"
            stroke={innerLine}
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M 26.5,22 C 26,22.5 25.5,23 25.5,24"
            stroke={innerLine}
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Left Crest Lighting Rim */}
          <path
            d="M 20,10.5 C 19,12 17.5,15 16,19 M 17,25 C 17.5,29 19,32 21,33.5"
            stroke={rimColor}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity={isWhite ? '0.72' : '0.56'}
          />

          {/* Lower Neck Contour Accent (Pearl Champagne Gold vs Obsidian Crimson) */}
          <path
            d="M 33.5,14 C 36.5,19 37,27 36.5,34"
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth="0.85"
            strokeLinecap="round"
            opacity={isWhite ? '0.62' : '0.54'}
          />
        </g>
      )}

      {/* ============================================================== */}
      {/* BISHOP: Traditional mitre-shaped head, diagonal slit, finial ball */}
      {/* ============================================================== */}
      {type === 'b' && (
        <g id="staunton-bishop">
          {/* Ground Contact Shadow */}
          <ellipse cx="22.5" cy="40.5" rx="14" ry="1.8" fill={`url(#${idPrefix}-contact-shadow)`} />

          {/* Base Plinth */}
          <path
            d="M 9,39.5 L 36,39.5 C 36,37 34,35.5 32,35.5 L 13,35.5 C 11,35.5 9,37 9,39.5 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.2"
          />

          {/* Base Stepped Collar */}
          <path
            d="M 11.5,35.5 L 11.5,32 L 33.5,32 L 33.5,35.5 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.1"
          />

          {/* Slender Waist & Pedestal Body */}
          <path
            d="M 14,32 C 16,30 18,28.5 18,25.5 L 27,25.5 C 27,28.5 29,30 31,32 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.1"
          />

          {/* Mitre Bulb Body */}
          <path
            d="M 15,25.5 C 15,27.5 17.5,28.5 22.5,28.5 C 27.5,28.5 30,27.5 30,25.5 C 30,23 28.5,21.5 28.5,21.5 C 33.5,20 34,11.5 22.5,9 C 11,11.5 11.5,20 16.5,21.5 C 16.5,21.5 15,23 15,25.5 Z"
            fill={isWhite ? `url(#${idPrefix}-body-grad)` : `url(#${idPrefix}-black-grad)`}
            stroke={outerStroke}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Characteristic Diagonal Mitre Slit / Cut */}
          <path
            d="M 24.5,11 C 25.5,14 23.5,18 22.5,20"
            stroke={isWhite ? innerLine : '#881337'}
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity={isWhite ? '1' : '0.85'}
          />

          {/* Carved Mitre Collar Lines */}
          <path
            d="M 16.5,21.5 L 28.5,21.5"
            stroke={innerLine}
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M 15,25.5 L 30,25.5"
            stroke={innerLine}
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Top Spherical Finial Ball */}
          <circle
            cx="22.5"
            cy="7.5"
            r="2.2"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1"
          />
          <circle
            cx="21.7"
            cy="6.9"
            r="0.7"
            fill="#ffffff"
            opacity={isWhite ? '0.9' : '0.5'}
          />
          <circle
            cx="23.2"
            cy="8.1"
            r="0.65"
            fill={isWhite ? champagneGoldAccent : crimsonAccent}
            opacity={isWhite ? '0.55' : '0.5'}
          />

          {/* Left Highlight Rim */}
          <path
            d="M 17,16 C 16,18 16,21 16.5,22 M 13.5,31 L 12.5,35"
            stroke={rimColor}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity={isWhite ? '0.65' : '0.52'}
          />

          {/* Right Flank Accent (Pearl Champagne Gold vs Obsidian Crimson) */}
          <path
            d="M 28,16 C 29,18 29,21 28.5,22 M 31.5,31 L 32.5,35"
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth="0.85"
            strokeLinecap="round"
            opacity={isWhite ? '0.62' : '0.54'}
          />
        </g>
      )}

      {/* ============================================================== */}
      {/* QUEEN: Elegant royal coronet with 5 pearl finials, velvet dome */}
      {/* ============================================================== */}
      {type === 'q' && (
        <g id="staunton-queen">
          {/* Ground Contact Shadow */}
          <ellipse cx="22.5" cy="40.5" rx="14.5" ry="1.8" fill={`url(#${idPrefix}-contact-shadow)`} />

          {/* Base Plinth */}
          <path
            d="M 9,39.5 L 36,39.5 C 36,37.5 34.5,36 32.5,36 L 12.5,36 C 10.5,36 9,37.5 9,39.5 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.2"
          />

          {/* Stepped Torus Base Rings */}
          <path
            d="M 11.5,36 L 11.5,33 L 33.5,33 L 33.5,36 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.1"
          />

          {/* Waist & Gown Robe */}
          <path
            d="M 11.5,30 C 12.5,31.5 12.5,33 12,34.5 C 11,35.5 12,36 12,36 L 33,36 C 33,36 34,35.5 33,34.5 C 32.5,33 32.5,31.5 33.5,30 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.1"
          />

          {/* Inner Velvet Dome (Champagne Silk for Pearl, Dark Wine for Obsidian) */}
          <path
            d="M 12,25 C 14.5,17 30.5,17 33,25 Z"
            fill={isWhite ? '#d7c7b0' : '#1b0811'}
            stroke={outerStroke}
            strokeWidth="1"
          />

          {/* Flared Royal Coronet with 5 Radiating Peaks */}
          <path
            d="M 9,26 C 17.5,24.5 27.5,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 L 9,26 Z"
            fill={isWhite ? `url(#${idPrefix}-body-grad)` : `url(#${idPrefix}-black-grad)`}
            stroke={outerStroke}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* 5 Pearl Finials Tipping the Coronet Peaks (Lustrous White vs Polished Obsidian Garnet) */}
          <circle
            cx="6.5"
            cy="13.5"
            r="1.9"
            fill={isWhite ? '#ffffff' : '#281720'}
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth={isWhite ? '0.9' : '0.8'}
          />
          <circle
            cx="14.3"
            cy="10.5"
            r="1.9"
            fill={isWhite ? '#ffffff' : '#281720'}
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth={isWhite ? '0.9' : '0.8'}
          />
          <circle
            cx="22.5"
            cy="8.5"
            r="2.1"
            fill={isWhite ? '#ffffff' : '#281720'}
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth={isWhite ? '0.9' : '0.8'}
          />
          <circle
            cx="30.7"
            cy="10.5"
            r="1.9"
            fill={isWhite ? '#ffffff' : '#281720'}
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth={isWhite ? '0.9' : '0.8'}
          />
          <circle
            cx="38.5"
            cy="13.5"
            r="1.9"
            fill={isWhite ? '#ffffff' : '#281720'}
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth={isWhite ? '0.9' : '0.8'}
          />

          {/* Specular Catchlights on the 5 Finial Pearls */}
          <circle cx="6" cy="13" r="0.6" fill="#ffffff" opacity={isWhite ? '0.85' : '0.6'} />
          <circle cx="13.8" cy="10" r="0.6" fill="#ffffff" opacity={isWhite ? '0.85' : '0.6'} />
          <circle cx="22" cy="8" r="0.7" fill="#ffffff" opacity={isWhite ? '0.9' : '0.65'} />
          <circle cx="30.2" cy="10" r="0.6" fill="#ffffff" opacity={isWhite ? '0.85' : '0.6'} />
          <circle cx="38" cy="13" r="0.6" fill="#ffffff" opacity={isWhite ? '0.85' : '0.6'} />

          {/* Carved Waist Rings */}
          <path
            d="M 11.5,30 C 15,29 30,29 33.5,30"
            stroke={innerLine}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M 12,33.5 C 18,32.5 27,32.5 33,33.5"
            stroke={innerLine}
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Left Edge Light Rim */}
          <path
            d="M 8.5,16 L 10.5,24 M 13,31 L 12.5,35"
            stroke={rimColor}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity={isWhite ? '0.7' : '0.55'}
          />

          {/* Flank Rim (Pearl Champagne Gold vs Obsidian Crimson) */}
          <path
            d="M 36.5,16 L 34.5,24 M 32,31 L 32.5,35"
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth="0.85"
            strokeLinecap="round"
            opacity={isWhite ? '0.62' : '0.55'}
          />
        </g>
      )}

      {/* ============================================================== */}
      {/* KING: Tall royal piece, imperial cross on top, arched dome     */}
      {/* ============================================================== */}
      {type === 'k' && (
        <g id="staunton-king">
          {/* Ground Contact Shadow */}
          <ellipse cx="22.5" cy="40.5" rx="14.5" ry="1.8" fill={`url(#${idPrefix}-contact-shadow)`} />

          {/* Base Plinth */}
          <path
            d="M 9,40 L 36,40 C 36,38 34.5,37 32.5,37 L 12.5,37 C 10.5,37 9,38 9,40 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.2"
          />

          {/* Grand Pedestal & Robe Mantle */}
          <path
            d="M 12.5,37 C 15,40.5 30,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 35.5,13.5 29,14 27.5,17 C 26,20 22.5,25 22.5,25 C 22.5,25 19,20 17.5,17 C 16,14 9.5,13.5 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37 Z"
            fill={isWhite ? `url(#${idPrefix}-body-grad)` : `url(#${idPrefix}-black-grad)`}
            stroke={outerStroke}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Royal Closed Crown Dome */}
          <path
            d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 Z"
            fill={isWhite ? `url(#${idPrefix}-base-grad)` : `url(#${idPrefix}-black-base)`}
            stroke={outerStroke}
            strokeWidth="1.1"
          />

          {/* IMPERIAL LATIN CROSS FINIAL (Prominent, Sharp & Stately) */}
          <path
            d="M 22.5,3 L 22.5,11.5 M 18.5,6.2 L 26.5,6.2"
            stroke={outerStroke}
            strokeWidth="2.4"
            strokeLinecap="square"
          />
          <path
            d="M 22.5,3.2 L 22.5,11.3 M 18.7,6.2 L 26.3,6.2"
            stroke={isWhite ? '#ffffff' : '#9c8894'}
            strokeWidth="1.2"
            strokeLinecap="square"
          />
          {/* Stately Core Accent on the Imperial Cross (Pearl Champagne Gold vs Obsidian Crimson) */}
          <circle
            cx="22.5"
            cy="6.2"
            r="0.85"
            fill={isWhite ? champagneGoldAccent : crimsonAccent}
            opacity={isWhite ? '0.85' : '0.8'}
          />

          {/* Royal Waist & Neck Horizontal Accent Rings */}
          <path
            d="M 12.5,30 C 18,28.5 27,28.5 32.5,30"
            stroke={innerLine}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M 12.5,33.5 C 18,32 27,32 32.5,33.5"
            stroke={innerLine}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M 12.5,37 C 18,35.5 27,35.5 32.5,37"
            stroke={innerLine}
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Left Mantle Specular Light Rim */}
          <path
            d="M 8.5,20 C 11,16 16,14.5 17.5,17 M 13.5,31 L 13.5,36"
            stroke={rimColor}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity={isWhite ? '0.7' : '0.55'}
          />

          {/* Right Robe Mantle Rim (Pearl Champagne Gold vs Obsidian Crimson) */}
          <path
            d="M 36.5,20 C 34,16 29,14.5 27.5,17 M 31.5,31 L 31.5,36"
            stroke={isWhite ? champagneGoldAccent : crimsonAccent}
            strokeWidth="0.85"
            strokeLinecap="round"
            opacity={isWhite ? '0.62' : '0.55'}
          />
        </g>
      )}
    </svg>
  );
});
