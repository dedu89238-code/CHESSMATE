import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Beautiful SVG for CHESSMATE with gold King & Chess Crown
const standardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1c1917" />
      <stop offset="50%" stop-color="#0c0a09" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="30%" stop-color="#f59e0b" />
      <stop offset="70%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
      <stop offset="70%" stop-color="#f59e0b" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <filter id="dropGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#f59e0b" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <circle cx="256" cy="240" r="210" fill="url(#glowGrad)" />

  <!-- Subtle border ring -->
  <rect x="12" y="12" width="488" height="488" rx="100" fill="none" stroke="url(#accentGrad)" stroke-width="3" stroke-opacity="0.3" />

  <!-- Chessboard subtle motif in background -->
  <g opacity="0.06">
    <rect x="96" y="96" width="40" height="40" fill="#fbbf24" />
    <rect x="176" y="96" width="40" height="40" fill="#fbbf24" />
    <rect x="256" y="96" width="40" height="40" fill="#fbbf24" />
    <rect x="336" y="96" width="40" height="40" fill="#fbbf24" />
    <rect x="136" y="136" width="40" height="40" fill="#fbbf24" />
    <rect x="216" y="136" width="40" height="40" fill="#fbbf24" />
    <rect x="296" y="136" width="40" height="40" fill="#fbbf24" />
    <rect x="376" y="136" width="40" height="40" fill="#fbbf24" />
  </g>

  <!-- Main Golden King Chess Piece -->
  <g filter="url(#dropGlow)" transform="translate(0, -6)">
    <!-- Top Cross -->
    <path d="M256 92 L256 136 M236 108 L276 108" stroke="url(#goldGrad)" stroke-width="12" stroke-linecap="round" />

    <!-- Crown Finial Sphere -->
    <circle cx="256" cy="144" r="14" fill="url(#goldGrad)" />

    <!-- Crown Diadem Curves -->
    <path d="M190 200 C204 162 230 156 256 156 C282 156 308 162 322 200 C306 208 284 212 256 212 C228 212 206 208 190 200 Z" fill="url(#goldGrad)" />
    
    <!-- Crown Ornaments -->
    <circle cx="204" cy="184" r="7" fill="#fef08a" />
    <circle cx="256" cy="174" r="9" fill="#fef08a" />
    <circle cx="308" cy="184" r="7" fill="#fef08a" />

    <!-- Head / Neck Collar -->
    <path d="M210 208 C218 240 224 258 226 270 L286 270 C288 258 294 240 302 208 C280 216 232 216 210 208 Z" fill="url(#goldGrad)" />

    <!-- Neck Ring -->
    <rect x="214" y="270" width="84" height="14" rx="7" fill="url(#goldGrad)" />

    <!-- Body Pillar -->
    <path d="M224 284 C216 324 200 354 186 376 L326 376 C312 354 296 324 288 284 Z" fill="url(#goldGrad)" />

    <!-- Base Pedestal Level 1 -->
    <rect x="174" y="376" width="164" height="18" rx="8" fill="url(#goldGrad)" />

    <!-- Base Pedestal Level 2 -->
    <path d="M152 402 C152 396 160 394 172 394 L340 394 C352 394 360 396 360 402 L368 418 C368 424 358 426 344 426 L168 426 C154 426 144 424 144 418 Z" fill="url(#goldGrad)" />
  </g>
</svg>
`;

// Maskable version: Full bleed background (no border-radius) + icon in safe 80% circle (scale ~0.76)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradMask" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1c1917" />
      <stop offset="50%" stop-color="#0c0a09" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="goldGradMask" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="30%" stop-color="#f59e0b" />
      <stop offset="70%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <radialGradient id="glowGradMask" cx="50%" cy="50%" r="45%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
      <stop offset="70%" stop-color="#f59e0b" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <filter id="dropGlowMask" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#f59e0b" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Full-bleed background for Android adaptive icon clipping -->
  <rect width="512" height="512" fill="url(#bgGradMask)" />
  <circle cx="256" cy="256" r="230" fill="url(#glowGradMask)" />

  <!-- Scaled content centered strictly within safe zone (center 80% circle) -->
  <g transform="translate(64, 60) scale(0.75)" filter="url(#dropGlowMask)">
    <!-- Top Cross -->
    <path d="M256 92 L256 136 M236 108 L276 108" stroke="url(#goldGradMask)" stroke-width="12" stroke-linecap="round" />

    <!-- Crown Finial Sphere -->
    <circle cx="256" cy="144" r="14" fill="url(#goldGradMask)" />

    <!-- Crown Diadem Curves -->
    <path d="M190 200 C204 162 230 156 256 156 C282 156 308 162 322 200 C306 208 284 212 256 212 C228 212 206 208 190 200 Z" fill="url(#goldGradMask)" />
    
    <!-- Crown Ornaments -->
    <circle cx="204" cy="184" r="7" fill="#fef08a" />
    <circle cx="256" cy="174" r="9" fill="#fef08a" />
    <circle cx="308" cy="184" r="7" fill="#fef08a" />

    <!-- Head / Neck Collar -->
    <path d="M210 208 C218 240 224 258 226 270 L286 270 C288 258 294 240 302 208 C280 216 232 216 210 208 Z" fill="url(#goldGradMask)" />

    <!-- Neck Ring -->
    <rect x="214" y="270" width="84" height="14" rx="7" fill="url(#goldGradMask)" />

    <!-- Body Pillar -->
    <path d="M224 284 C216 324 200 354 186 376 L326 376 C312 354 296 324 288 284 Z" fill="url(#goldGradMask)" />

    <!-- Base Pedestal Level 1 -->
    <rect x="174" y="376" width="164" height="18" rx="8" fill="url(#goldGradMask)" />

    <!-- Base Pedestal Level 2 -->
    <path d="M152 402 C152 396 160 394 172 394 L340 394 C352 394 360 396 360 402 L368 418 C368 424 358 426 344 426 L168 426 C154 426 144 424 144 418 Z" fill="url(#goldGradMask)" />
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save base SVGs
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardSvg.trim());

  // Generate 512x512
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Generated pwa-512x512.png');

  // Also create icon-512.png alias
  fs.copyFileSync(
    path.join(publicDir, 'pwa-512x512.png'),
    path.join(publicDir, 'icon-512.png')
  );

  // Generate 192x192
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Generated pwa-192x192.png');

  // Also create icon-192.png alias
  fs.copyFileSync(
    path.join(publicDir, 'pwa-192x192.png'),
    path.join(publicDir, 'icon-192.png')
  );

  // Generate 512x512 maskable icon
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Generated pwa-maskable-512x512.png');

  // Generate Apple Touch Icon 180x180
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');

  // Generate 64x64 favicon.png
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Generated favicon.png');

  console.log('All PWA and Android icon assets generated successfully!');
}

generate().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
