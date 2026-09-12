export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  checkmatesDelivered: number;
  currentStreak: number;
  bestStreak: number;
  bestVictoryAi: number | null; // e.g. 94 for 94% AI
  quickestWinMoves: number | null;
  lastUpdated: string;
}

export const INITIAL_STATS: PlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  checkmatesDelivered: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestVictoryAi: null,
  quickestWinMoves: null,
  lastUpdated: new Date().toISOString(),
};

const STORAGE_KEY = 'caissa_chess_stats_v1';

export function loadPlayerStats(): PlayerStats {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { ...INITIAL_STATS };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_STATS };
    const parsed = JSON.parse(raw);
    return {
      gamesPlayed: Number(parsed.gamesPlayed) || 0,
      wins: Number(parsed.wins) || 0,
      losses: Number(parsed.losses) || 0,
      draws: Number(parsed.draws) || 0,
      checkmatesDelivered: Number(parsed.checkmatesDelivered) || 0,
      currentStreak: Number(parsed.currentStreak) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
      bestVictoryAi: typeof parsed.bestVictoryAi === 'number' ? parsed.bestVictoryAi : null,
      quickestWinMoves: typeof parsed.quickestWinMoves === 'number' ? parsed.quickestWinMoves : null,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch {
    return { ...INITIAL_STATS };
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save player stats to localStorage:', err);
  }
}

export interface RecordGameParams {
  isPlayerWinner: boolean;
  isDraw: boolean;
  isCheckmate: boolean;
  movesCount: number;
  isAiMode: boolean;
  aiStrength: number;
}

export function recordGameStats(params: RecordGameParams): {
  updatedStats: PlayerStats;
  isNewBestAiVictory: boolean;
} {
  const current = loadPlayerStats();
  const next: PlayerStats = { ...current };

  next.gamesPlayed += 1;
  let isNewBestAiVictory = false;

  if (params.isDraw) {
    next.draws += 1;
    next.currentStreak = 0;
  } else if (params.isPlayerWinner) {
    next.wins += 1;
    next.currentStreak += 1;
    if (next.currentStreak > next.bestStreak) {
      next.bestStreak = next.currentStreak;
    }
    if (params.isCheckmate) {
      next.checkmatesDelivered += 1;
    }
    if (params.movesCount > 0) {
      if (!next.quickestWinMoves || params.movesCount < next.quickestWinMoves) {
        next.quickestWinMoves = params.movesCount;
      }
    }
    // Check if player beat AI at higher strength
    if (params.isAiMode) {
      if (next.bestVictoryAi === null || params.aiStrength > next.bestVictoryAi) {
        next.bestVictoryAi = params.aiStrength;
        isNewBestAiVictory = true;
      }
    }
  } else {
    // Loss
    next.losses += 1;
    next.currentStreak = 0;
  }

  next.lastUpdated = new Date().toISOString();
  savePlayerStats(next);

  return { updatedStats: next, isNewBestAiVictory };
}

export function resetPlayerStats(): PlayerStats {
  savePlayerStats(INITIAL_STATS);
  return { ...INITIAL_STATS };
}
