import { GameStatus } from '../types/chess';

export interface MotivationalInsight {
  quote: string;
  source: string;
  category: 'defeat' | 'victory' | 'draw';
}

const CAISSA_VICTORY_LINES = [
  "The board never lies. Your tactical intent was visible three moves before execution. Regroup, calculate deeper, and strike again.",
  "Calculation triumphed over intuition this round. In chess, every defeat is a masterclass in disguise.",
  "You allowed tension to mount without securing critical central outposts. Master the center, and you master CAISSA.",
  "Even Kasparov and Carlsen suffered bitter defeats before attaining greatness. Analyze where your tempo softened, then challenge me once more.",
  "True grandmasters are not forged by effortless victories, but by how ruthlessly they study their own tactical oversights.",
  "You fought with sharp initiative, but ruthless precision in the endgame remains the ultimate arbiter.",
  "A brave tactical sequence, yet the structural weakness in your pawn skeleton proved decisive. Study the opening and return stronger.",
  "Defeat is merely data. Every blind spot you uncover today becomes an impenetrable shield tomorrow.",
  "Your kingside attack had ambition, but uncalculated complications favor the prepared mind. Review the exchange on move 20.",
  "In the crucible of the 64 squares, every mistake is an opportunity for cognitive evolution. Reset and conquer.",
];

const CAISSA_TIMEOUT_DEFEAT_LINES = [
  "The clock is a merciless adversary. In rapid chess, time management is half the tactical struggle.",
  "Hesitation under pressure drains precious seconds. Trust your tactical pattern recognition and move with conviction.",
  "Seconds slipped away while seeking absolute perfection. In chess, practical play often triumphs over theoretical ideal.",
];

const CAISSA_RESIGNATION_LINES = [
  "Recognizing an irrecoverable position is the signature of an objective player. Conserve your energy, review the breach, and begin anew.",
  "Surrendering the initiative is painful, but evaluating reality without delusion is the first step toward superiority.",
];

const PLAYER_VICTORY_LINES = [
  "Magnificent. Your tactical calculation penetrated my deepest horizon search. Outstanding play.",
  "A sublime tactical breakthrough. You seized the tempo, coordinated your pieces with harmony, and left zero counterplay.",
  "Impeccable foresight. You proved that human strategic intuition and creative aggression still conquer silicon precision.",
  "Textbook execution. You converted a subtle positional edge into an unstoppable mating net. Well deserved.",
  "Honored by this defeat. Your king safety and tactical alertness were of grandmaster caliber.",
  "Brilliant conversion. You dictated the terms of engagement from the middlegame onward.",
  "A masterwork of positional patience and decisive tactical liquidation. Take pride in this victory.",
];

const DRAW_LINES = [
  "An equilibrium of razor-sharp wills. Neither side conceded an inch of ground. A hard-fought split point.",
  "Stalemate: the supreme tactical refuge where imminent defeat dissolves into sheer mathematical balance.",
  "Total deadlock forged by resilience. When both defensive structures hold firm, peace is earned.",
  "A grandmaster draw. Mutual respect across 64 squares.",
];

export function getPsychologicalLine(params: {
  isPlayerWinner: boolean;
  isDraw: boolean;
  status: GameStatus;
  aiStrength: number;
}): MotivationalInsight {
  const { isPlayerWinner, isDraw, status, aiStrength } = params;

  if (isDraw) {
    const quote = DRAW_LINES[Math.floor(Math.random() * DRAW_LINES.length)];
    return {
      quote,
      source: 'CAISSA • Final Thought',
      category: 'draw',
    };
  }

  if (isPlayerWinner) {
    const quoteTemplate = PLAYER_VICTORY_LINES[Math.floor(Math.random() * PLAYER_VICTORY_LINES.length)];
    const quote = quoteTemplate.includes('{aiStrength}')
      ? quoteTemplate.replace('{aiStrength}', `${aiStrength}%`)
      : quoteTemplate;

    return {
      quote,
      source: 'CAISSA • Final Thought',
      category: 'victory',
    };
  }

  // Player loss / CAISSA victory
  if (status === 'timeout') {
    const quote = CAISSA_TIMEOUT_DEFEAT_LINES[Math.floor(Math.random() * CAISSA_TIMEOUT_DEFEAT_LINES.length)];
    return {
      quote,
      source: 'CAISSA • Final Thought',
      category: 'defeat',
    };
  }

  if (status === 'resigned') {
    const quote = CAISSA_RESIGNATION_LINES[Math.floor(Math.random() * CAISSA_RESIGNATION_LINES.length)];
    return {
      quote,
      source: 'CAISSA • Final Thought',
      category: 'defeat',
    };
  }

  const quote = CAISSA_VICTORY_LINES[Math.floor(Math.random() * CAISSA_VICTORY_LINES.length)];
  return {
    quote,
    source: 'CAISSA • Final Thought',
    category: 'defeat',
  };
}
