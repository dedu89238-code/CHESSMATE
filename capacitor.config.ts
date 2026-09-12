import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'studio.ai.chessmate.twa',
  appName: 'CHESSMATE',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
