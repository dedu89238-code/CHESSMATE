import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  RotateCcw,
  RefreshCw,
  Sliders,
  Volume2,
  VolumeX,
  Flag,
  Bot,
  User,
  CheckCircle2,
  Sparkles,
  Award,
  Trophy,
  BarChart3,
  Home,
} from 'lucide-react';
import {
  GameMode,
  GameSettings,
  GameStatus,
  Move,
  Piece,
  PieceColor,
  PieceType,
  Square,
} from './types/chess';
import {
  createInitialPosition,
  getCapturedPieces,
  getLegalMoves,
  isInsufficientMaterial,
  isKingInCheck,
  makeMove,
  ChessPosition,
} from './utils/chessEngine';
import { getAIMove } from './utils/chessAi';
import { chessAudio } from './utils/audio';
import { ChessBoard, ActiveAnimation } from './components/ChessBoard';
import { CapturedPieces } from './components/CapturedPieces';
import { Timer } from './components/Timer';
import { MoveHistory } from './components/MoveHistory';
import { PromotionModal } from './components/PromotionModal';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { AiStrengthMeter } from './components/AiStrengthMeter';
import { GrandVictoryCelebration } from './components/GrandVictoryCelebration';
import { StatisticsModal } from './components/StatisticsModal';
import { HomeScreen } from './components/HomeScreen';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PlayerStats, loadPlayerStats, recordGameStats } from './types/stats';
import { getPsychologicalLine, MotivationalInsight } from './utils/motivationalLines';
import { ChessmatePanel } from './components/ChessmatePanel';
import { ChessmateToast } from './components/ChessmateToast';
import { ChatMessage, ChessmateGameContext } from './types/chessmate';
import { getAttackersOnSquare, generateLocalChessmateReply, isChessRelated } from './utils/chessmateLocal';
import { evaluateMoveForAutomaticComment, resetCommentaryMemory } from './utils/chessmateComments';
import { isResponseTextComplete } from './utils/chessmateResponseValidation';
import { findKing, squareToCoord } from './utils/chessEngine';
import { getDetailedPositionAnalysis } from './utils/chessPositionAnalysis';
import {
  loadActiveGameState,
  saveActiveGameState,
  clearActiveGameState,
  SavedActiveGameState,
} from './utils/gameStorage';

const DEFAULT_SETTINGS: GameSettings = {
  aiStrength: 65, // 1 to 100 on continuous spectrum (Green -> Yellow -> Orange -> Red)
  gameMode: 'ai',
  playerColor: 'w',
  timeControl: '5',
  boardTheme: 'wood',
  soundEnabled: true,
  showLegalMoves: true,
  highlightLastMove: true,
};

export default function App() {
  // Check once on renderer boot/creation for an active, unfinished game
  const initialSavedGameRef = useRef<SavedActiveGameState | null>(null);
  const isFirstRenderRef = useRef<boolean>(true);
  if (isFirstRenderRef.current) {
    initialSavedGameRef.current = loadActiveGameState();
    isFirstRenderRef.current = false;
  }
  const restoredGame = initialSavedGameRef.current;

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('chess_settings');
      let base = DEFAULT_SETTINGS;
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure aiStrength is migrated if old difficulty string existed
        if (typeof parsed.aiStrength !== 'number') {
          parsed.aiStrength = 65;
        }
        base = { ...DEFAULT_SETTINGS, ...parsed };
      }
      if (restoredGame) {
        if (typeof restoredGame.aiStrength === 'number') {
          base.aiStrength = restoredGame.aiStrength;
        }
        if (restoredGame.timeControl) {
          base.timeControl = restoredGame.timeControl;
        }
      }
      return base;
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Top-level Application Screen State: 'home' | 'mode_select' | 'game'
  // When starting or when web renderer is recreated with an unfinished game, restore 'game' screen immediately!
  const [currentScreen, setCurrentScreen] = useState<'home' | 'mode_select' | 'game'>(() => {
    return restoredGame ? 'game' : 'home';
  });

  const [position, setPosition] = useState<ChessPosition>(() => {
    return restoredGame ? restoredGame.position : createInitialPosition();
  });
  const [positionHistory, setPositionHistory] = useState<ChessPosition[]>(() => {
    return restoredGame ? restoredGame.positionHistory : [createInitialPosition()];
  });
  const [moveHistory, setMoveHistory] = useState<Move[]>(() => {
    return restoredGame ? restoredGame.moveHistory : [];
  });
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMovesForSelected, setValidMovesForSelected] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(() => {
    return restoredGame ? restoredGame.lastMove : null;
  });
  const [gameStatus, setGameStatus] = useState<GameStatus>(() => {
    return restoredGame ? restoredGame.gameStatus : 'in-progress';
  });
  const [winner, setWinner] = useState<PieceColor | null>(() => {
    return restoredGame ? restoredGame.winner : null;
  });
  const [isThinking, setIsThinking] = useState(false);
  const [flipped, setFlipped] = useState<boolean>(() => {
    if (restoredGame) return restoredGame.flipped;
    return settings.gameMode === 'ai' && settings.playerColor === 'b';
  });

  // Active match game mode: tracks the mode assigned when match starts ('ai' | 'pvp')
  const [activeMatchMode, setActiveMatchMode] = useState<GameMode>(() => {
    return restoredGame ? restoredGame.gameMode : settings.gameMode;
  });
  const activeMatchModeRef = useRef<GameMode>(restoredGame ? restoredGame.gameMode : settings.gameMode);
  activeMatchModeRef.current = activeMatchMode;

  // In-flight piece travel animation state
  const [animatingMove, setAnimatingMove] = useState<ActiveAnimation | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{ from: Square; to: Square } | null>(null);

  // Statistics & Psychological / Motivational Commentary
  const [stats, setStats] = useState<PlayerStats>(loadPlayerStats);
  const [currentInsight, setCurrentInsight] = useState<MotivationalInsight | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Clocks
  const getTimeInSeconds = (tc: string) => (tc === 'none' ? 0 : parseInt(tc, 10) * 60);
  const [whiteTime, setWhiteTime] = useState<number>(() => {
    if (restoredGame && typeof restoredGame.whiteTime === 'number') {
      return restoredGame.whiteTime;
    }
    return getTimeInSeconds(settings.timeControl);
  });
  const [blackTime, setBlackTime] = useState<number>(() => {
    if (restoredGame && typeof restoredGame.blackTime === 'number') {
      return restoredGame.blackTime;
    }
    return getTimeInSeconds(settings.timeControl);
  });

  // High-precision clock refs to guarantee synchronization without closure drift
  const whiteTimeRef = useRef<number>(restoredGame ? restoredGame.whiteTime : getTimeInSeconds(settings.timeControl));
  const blackTimeRef = useRef<number>(restoredGame ? restoredGame.blackTime : getTimeInSeconds(settings.timeControl));
  const moveHistoryRef = useRef<Move[]>(restoredGame ? restoredGame.moveHistory : moveHistory);
  moveHistoryRef.current = moveHistory;
  const positionHistoryRef = useRef<ChessPosition[]>(restoredGame ? restoredGame.positionHistory : [position]);
  positionHistoryRef.current = positionHistory;

  // Determine effective user color
  const [userColor, setUserColor] = useState<PieceColor>(() => {
    if (restoredGame) return restoredGame.userColor;
    return settings.playerColor === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : settings.playerColor;
  });

  // Stable references to avoid race conditions during async AI turns
  const positionRef = useRef<ChessPosition>(position);
  positionRef.current = position;

  const gameStatusRef = useRef<GameStatus>(gameStatus);
  gameStatusRef.current = gameStatus;

  const settingsRef = useRef<GameSettings>(settings);
  settingsRef.current = settings;

  const userColorRef = useRef<PieceColor>(userColor);
  userColorRef.current = userColor;

  const lastMoveRef = useRef<Move | null>(lastMove);
  lastMoveRef.current = lastMove;

  // Asynchronous AI turn synchronization & cancellation counter
  const aiTurnCounterRef = useRef<number>(0);
  const triggerAiTurnRef = useRef<(pos: ChessPosition) => void>(() => {});

  // Cleanup all pending timers on unmount
  useEffect(() => {
    return () => {
      aiTurnCounterRef.current++;
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  // CHESSMATE Companion State
  const [isChessmateOpen, setIsChessmateOpen] = useState<boolean>(() => {
    return restoredGame?.caissa?.isChessmateOpen ?? false;
  });
  const isChessmateOpenRef = useRef<boolean>(isChessmateOpen);
  isChessmateOpenRef.current = isChessmateOpen;

  const [activeRightTab, setActiveRightTab] = useState<'moves' | 'chessmate'>(() => {
    return restoredGame?.caissa?.activeRightTab ?? 'moves';
  });
  const activeRightTabRef = useRef<'moves' | 'chessmate'>(activeRightTab);
  activeRightTabRef.current = activeRightTab;

  const [chessmateMessages, setChessmateMessages] = useState<ChatMessage[]>(() => {
    if (restoredGame?.caissa?.messages && restoredGame.caissa.messages.length > 0) {
      return restoredGame.caissa.messages;
    }
    return [
      {
        id: 'welcome',
        role: 'model',
        text: 'Greetings! I am **CHESSMATE**, your chess companion. Ask me anything about chess rules, openings, strategy, tactics, or your current match with CAISSA! ♟️',
        timestamp: Date.now(),
      },
    ];
  });
  const chessmateMessagesRef = useRef<ChatMessage[]>(chessmateMessages);
  chessmateMessagesRef.current = chessmateMessages;

  const [isChessmateLoading, setIsChessmateLoading] = useState(false);
  const [chessmateToast, setChessmateToast] = useState<string | null>(null);
  const lastCommentMoveNumberRef = useRef<number>(restoredGame?.caissa?.lastCommentMoveNumber ?? -10);

  const flippedRef = useRef<boolean>(flipped);
  flippedRef.current = flipped;

  const isThinkingRef = useRef<boolean>(isThinking);
  isThinkingRef.current = isThinking;

  // Robust automatic game-state persistence handler
  const saveCurrentGame = useCallback(() => {
    if (gameStatusRef.current !== 'in-progress') {
      clearActiveGameState();
      return;
    }

    saveActiveGameState({
      position: positionRef.current,
      positionHistory: positionHistoryRef.current,
      moveHistory: moveHistoryRef.current,
      lastMove: lastMoveRef.current,
      gameStatus: gameStatusRef.current,
      winner: null,
      gameMode: activeMatchModeRef.current,
      userColor: userColorRef.current,
      flipped: flippedRef.current,
      timeControl: settingsRef.current.timeControl,
      whiteTime: whiteTimeRef.current,
      blackTime: blackTimeRef.current,
      aiStrength: settingsRef.current.aiStrength,
      caissa: {
        messages: chessmateMessagesRef.current,
        isChessmateOpen: isChessmateOpenRef.current,
        activeRightTab: activeRightTabRef.current,
        lastCommentMoveNumber: lastCommentMoveNumberRef.current,
      },
      settingsSnapshot: settingsRef.current,
    });
  }, []);

  // Sync companion UI open/tab state with storage
  useEffect(() => {
    isChessmateOpenRef.current = isChessmateOpen;
    activeRightTabRef.current = activeRightTab;
    if (gameStatusRef.current === 'in-progress') {
      saveCurrentGame();
    }
  }, [isChessmateOpen, activeRightTab, saveCurrentGame]);

  // Sync companion message updates with storage
  useEffect(() => {
    chessmateMessagesRef.current = chessmateMessages;
    if (gameStatusRef.current === 'in-progress') {
      saveCurrentGame();
    }
  }, [chessmateMessages, saveCurrentGame]);

  // Handle page visibility / background / foreground transitions safely
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App backgrounded (e.g. user pressed home, switched apps, locked screen)
        saveCurrentGame();
      } else if (document.visibilityState === 'visible') {
        // App returning to foreground
        // If match vs CAISSA is active and it is currently AI's turn, resume AI calculation
        if (
          activeMatchModeRef.current === 'ai' &&
          gameStatusRef.current === 'in-progress' &&
          positionRef.current.turn !== userColorRef.current &&
          !isThinkingRef.current
        ) {
          triggerAiTurnRef.current(positionRef.current);
        }
      }
    };

    const handleLifecycleUnload = () => {
      saveCurrentGame();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleLifecycleUnload);
    window.addEventListener('beforeunload', handleLifecycleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleLifecycleUnload);
      window.removeEventListener('beforeunload', handleLifecycleUnload);
    };
  }, [saveCurrentGame]);

  // Resume pending AI turn if a restored game was waiting for AI's move
  useEffect(() => {
    const restored = initialSavedGameRef.current;
    if (
      restored &&
      restored.gameMode === 'ai' &&
      restored.gameStatus === 'in-progress' &&
      restored.position.turn !== restored.userColor
    ) {
      const resumeTimer = setTimeout(() => {
        if (gameStatusRef.current === 'in-progress') {
          triggerAiTurnRef.current(restored.position);
        }
      }, 500);
      return () => clearTimeout(resumeTimer);
    }
  }, []);

  const getLiveGameContext = useCallback((): ChessmateGameContext => {
    const currentPos = positionRef.current;
    const playerCol = userColorRef.current;
    const strength = settingsRef.current.aiStrength;
    const analysis = getDetailedPositionAnalysis(
      currentPos,
      playerCol,
      lastMoveRef.current,
      moveHistoryRef.current,
      strength
    );

    return {
      fen: analysis.fen,
      playerColor: playerCol,
      turn: currentPos.turn,
      fullmoveNumber: currentPos.fullmoveNumber,
      moveHistorySan: moveHistoryRef.current.map(m => m.san),
      lastMoveSan: lastMoveRef.current ? lastMoveRef.current.san : null,
      lastMove: lastMoveRef.current,
      inCheck: analysis.inCheck,
      caissaInCheck: analysis.caissaInCheck,
      isCheckmate: analysis.isCheckmate,
      isStalemate: analysis.isStalemate,
      kingSquare: analysis.playerKing.square,
      kingAttackers: analysis.playerKing.attackers,
      kingSafetyAssessment: analysis.playerKing.safetyAssessment,
      materialSummary: analysis.materialSummary,
      materialDiff: analysis.materialDiff,
      capturedByPlayer: analysis.capturedByPlayer.map(t => t.toUpperCase()),
      capturedByOpponent: analysis.capturedByCaissa.map(t => t.toUpperCase()),
      canCastleKingside: analysis.castling.playerCanCastleKingsideNow,
      canCastleQueenside: analysis.castling.playerCanCastleQueensideNow,
      castlingRights: {
        kingside: currentPos.castling[playerCol]?.kingside ?? false,
        queenside: currentPos.castling[playerCol]?.queenside ?? false,
      },
      enPassantAvailable: analysis.enPassant.available,
      enPassantTarget: analysis.enPassant.targetSquare,
      promotionPossibilities: analysis.promotion.threats,
      tacticalThreats: analysis.threatsToPlayer.map(t => t.description),
      tacticalOpportunities: analysis.opportunitiesForPlayer.map(t => t.description),
      hangingPiecesPlayer: analysis.hangingPiecesPlayer,
      hangingPiecesCaissa: analysis.hangingPiecesCaissa,
      legalMovesCount: analysis.legalMovesCount,
      keyLegalMovesSan: analysis.keyLegalMovesSan,
      aiStrength: strength,
      aiStrengthZone: analysis.caissaStrength.zoneName,
      analysis,
    };
  }, []);

  const handleSendChessmateMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    setChessmateMessages(prev => [...prev, userMsg]);
    setIsChessmateLoading(true);

    const context = getLiveGameContext();

    try {
      const res = await fetch('/api/chessmate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: chessmateMessagesRef.current
            .filter(m => !m.isAutoComment)
            .slice(-6)
            .map(m => ({ role: m.role, text: m.text })),
          gameContext: context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          if (isResponseTextComplete(data.reply)) {
            setChessmateMessages(prev => [
              ...prev,
              {
                id: `model-${Date.now()}`,
                role: 'model',
                text: data.reply,
                timestamp: Date.now(),
              },
            ]);
            setIsChessmateLoading(false);
            return;
          } else {
            console.warn('Truncated or incomplete response received. Displaying completion error notice.');
            setChessmateMessages(prev => [
              ...prev,
              {
                id: `model-${Date.now()}`,
                role: 'model',
                text: 'CHESSMATE was unable to complete this response. Please try asking again.',
                timestamp: Date.now(),
              },
            ]);
            setIsChessmateLoading(false);
            return;
          }
        } else if (data.error && !data.fallbackNeeded) {
          setChessmateMessages(prev => [
            ...prev,
            {
              id: `model-${Date.now()}`,
              role: 'model',
              text: data.error,
              timestamp: Date.now(),
            },
          ]);
          setIsChessmateLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('CHESSMATE server fetch error, falling back to local chess analyzer:', err);
    }

    // Graceful fallback to local chess analysis engine (always works offline, instant)
    try {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const localReply = generateLocalChessmateReply(userText, context);
      let textToDisplay = isResponseTextComplete(localReply)
        ? localReply
        : 'CHESSMATE was unable to complete this response. Please try asking again.';

      if (isOffline && isChessRelated(userText)) {
        textToDisplay = `*(Internet connection required for full CHESSMATE online features. Offline chess with CAISSA is active.)*\n\n${textToDisplay}`;
      }

      setChessmateMessages(prev => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: textToDisplay,
          timestamp: Date.now(),
        },
      ]);
    } catch (fallbackErr) {
      setChessmateMessages(prev => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: 'Internet connection is required for CHESSMATE online companion. Offline chess against CAISSA remains fully playable.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsChessmateLoading(false);
    }
  };

  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const isAnimatingRef = useRef<boolean>(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MOVE_ANIMATION_DURATION_MS = 480;

  // Sync user color on setting change (only on subsequent user settings changes, not initial mount if restored)
  const isInitialColorSyncRef = useRef<boolean>(true);
  useEffect(() => {
    if (isInitialColorSyncRef.current) {
      isInitialColorSyncRef.current = false;
      return;
    }
    if (settings.playerColor === 'random') {
      setUserColor(Math.random() < 0.5 ? 'w' : 'b');
    } else {
      setUserColor(settings.playerColor);
    }
  }, [settings.playerColor]);

  // Sync audio mute state
  useEffect(() => {
    chessAudio.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('chess_settings', JSON.stringify(settings));
    } catch {
      // Ignore
    }
    // Also update active game if settings like AI strength changed
    if (gameStatusRef.current === 'in-progress') {
      saveCurrentGame();
    }
  }, [settings, saveCurrentGame]);

  // Automatically orient the board for Black if user plays Black
  useEffect(() => {
    if (settings.gameMode === 'ai') {
      setFlipped(userColor === 'b');
    }
  }, [userColor, settings.gameMode]);

  // Handle Game Conclusion (Checkmate, Stalemate, Resignation, Timeout, Draw)
  const handleGameOver = useCallback(
    (finalStatus: GameStatus, finalWinner: PieceColor | null, totalMoves: number) => {
      aiTurnCounterRef.current++;
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      setIsThinking(false);
      setGameStatus(finalStatus);
      gameStatusRef.current = finalStatus;
      setWinner(finalWinner);

      // Finished games must NEVER be restored as an active game
      clearActiveGameState();

      const isPlayerWinner = finalWinner !== null && finalWinner === userColorRef.current;
      const isDraw = !finalWinner;
      const isCheckmate = finalStatus === 'checkmate';
      const isAiMode = activeMatchModeRef.current === 'ai';
      const aiStrength = settingsRef.current.aiStrength;

      // 1. Record stats persistently to localStorage
      const { updatedStats, isNewBestAiVictory } = recordGameStats({
        isPlayerWinner,
        isDraw,
        isCheckmate,
        movesCount: totalMoves,
        isAiMode,
        aiStrength,
      });
      setStats(updatedStats);
      setIsNewRecord(isNewBestAiVictory);

      // 2. Generate psychological / motivational commentary from CAISSA (AI mode only)
      if (isAiMode) {
        const insight = getPsychologicalLine({
          isPlayerWinner,
          isDraw,
          status: finalStatus,
          aiStrength,
        });
        setCurrentInsight(insight);
      } else {
        setCurrentInsight(null);
      }

      // 3. Play audio & open appropriate result view
      if (isPlayerWinner) {
        chessAudio.playVictory();
        setIsCelebrationOpen(true);
        setIsGameOverModalOpen(false);
      } else {
        if (isDraw) {
          chessAudio.playCheck();
        } else {
          chessAudio.playDefeat();
        }
        setIsCelebrationOpen(false);
        setIsGameOverModalOpen(true);
      }
    },
    []
  );

  // Evaluate post-move audio and game-ending states
  const evaluateEndConditions = (newPos: ChessPosition, executedMove: Move) => {
    const opponentColor: PieceColor = executedMove.piece.color === 'w' ? 'b' : 'w';
    const opponentInCheck = isKingInCheck(newPos.board, opponentColor);
    const opponentLegalMoves = getLegalMoves(newPos);

    if (opponentLegalMoves.length === 0) {
      if (opponentInCheck) {
        handleGameOver('checkmate', executedMove.piece.color, moveHistory.length + 1);
      } else {
        handleGameOver('stalemate', null, moveHistory.length + 1);
      }
      return true; // Game over
    }

    if (isInsufficientMaterial(newPos.board)) {
      handleGameOver('draw-insufficient', null, moveHistory.length + 1);
      return true;
    }

    if (newPos.halfmoveClock >= 100) {
      handleGameOver('draw-50-moves', null, moveHistory.length + 1);
      return true;
    }

    // Play appropriate sound effect
    if (opponentInCheck) {
      chessAudio.playCheck();
    } else if (executedMove.isCastling) {
      chessAudio.playCastle();
    } else if (executedMove.captured) {
      chessAudio.playCapture();
    } else {
      chessAudio.playMove();
    }

    return false; // Game continues
  };

  // Visible piece animation and official state application
  const animateAndApplyMove = useCallback((move: Move, onFinish?: () => void) => {
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setSelectedSquare(null);
    setValidMovesForSelected([]);

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Check for castling secondary rook movement
    let secondaryMove: { from: Square; to: Square; piece: Piece } | undefined;
    if (move.isCastling === 'kingside') {
      secondaryMove = {
        from: { row: move.from.row, col: 7 },
        to: { row: move.from.row, col: 5 },
        piece: { type: 'r', color: move.piece.color },
      };
    } else if (move.isCastling === 'queenside') {
      secondaryMove = {
        from: { row: move.from.row, col: 0 },
        to: { row: move.from.row, col: 3 },
        piece: { type: 'r', color: move.piece.color },
      };
    }

    const animToken: ActiveAnimation = {
      id: `${Date.now()}-${Math.random()}`,
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: move.captured,
      promotion: move.promotion,
      isEnPassant: move.isEnPassant,
      secondaryMove,
    };

    setAnimatingMove(animToken);

    // 480ms smooth, perfectly visible travel duration
    animationTimeoutRef.current = setTimeout(() => {
      const prevBoard = positionRef.current.board;
      const nextPos = makeMove(positionRef.current, move);

      setPosition(nextPos);
      positionRef.current = nextPos;
      setPositionHistory(prev => {
        const next = [...prev, nextPos];
        positionHistoryRef.current = next;
        return next;
      });
      setMoveHistory(prev => {
        const next = [...prev, move];
        moveHistoryRef.current = next;
        return next;
      });
      setLastMove(move);
      lastMoveRef.current = move;
      setAnimatingMove(null);
      isAnimatingRef.current = false;
      setIsAnimating(false);

      const isGameOver = evaluateEndConditions(nextPos, move);

      if (!isGameOver) {
        saveCurrentGame();
        // Automatic CHESSMATE occasional comments (strictly context-worthy, strictly non-spammy)
        const comment = evaluateMoveForAutomaticComment({
          move,
          prevBoard,
          board: nextPos.board,
          playerColor: userColorRef.current,
          inCheck: isKingInCheck(nextPos.board, nextPos.turn),
          isCheckmate: false,
          moveCount: moveHistoryRef.current.length + 1,
          lastCommentMoveNumber: lastCommentMoveNumberRef.current,
          timestamp: Date.now(),
        });

        if (comment) {
          lastCommentMoveNumberRef.current = moveHistoryRef.current.length + 1;
          setChessmateToast(comment);
          setChessmateMessages(prev => [
            ...prev,
            {
              id: `auto-${Date.now()}`,
              role: 'model',
              text: comment,
              timestamp: Date.now(),
              isAutoComment: true,
            },
          ]);
        }
      }

      if (onFinish) onFinish();

      // If game is still active and it is AI's turn, trigger AI calculation
      if (!isGameOver && settingsRef.current.gameMode === 'ai' && nextPos.turn !== userColorRef.current) {
        triggerAiTurnRef.current(nextPos);
      }
    }, MOVE_ANIMATION_DURATION_MS);
  }, [evaluateEndConditions]);

  // Schedule AI Turn (fully decoupled, non-blocking calculation, robust against race conditions)
  const triggerAiTurn = useCallback((currentPosition: ChessPosition) => {
    if (
      settingsRef.current.gameMode !== 'ai' ||
      gameStatusRef.current !== 'in-progress' ||
      currentPosition.turn === userColorRef.current
    ) {
      return;
    }

    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }

    const turnId = ++aiTurnCounterRef.current;
    setIsThinking(true);

    // Realistic calculation delay based on AI strength and time control
    const strength = settingsRef.current.aiStrength;
    const tc = settingsRef.current.timeControl;

    let thinkingDelay = 600;
    if (tc === 'none') {
      // Untimed casual mode: snappy, responsive
      thinkingDelay = Math.min(850, Math.max(450, Math.floor(strength * 3.5 + 380)));
    } else {
      const tcMinutes = parseInt(tc, 10);
      const remainingTime = currentPosition.turn === 'w' ? whiteTimeRef.current : blackTimeRef.current;

      if (remainingTime <= 3) {
        // Scramble: speed up to avoid flagging (250ms - 500ms)
        thinkingDelay = Math.max(250, Math.min(500, Math.floor(remainingTime * 120)));
      } else if (tcMinutes === 1) {
        // 1-minute game: realistic 1.2s - 2.1s thinking time so player
        // visibly sees CAISSA's clock count down in real time every turn!
        const base = 1350 + (strength / 100) * 650;
        const variance = (Math.random() - 0.5) * 350;
        thinkingDelay = Math.max(1050, Math.min(2200, Math.floor(base + variance)));
      } else if (tcMinutes <= 5) {
        // 3m or 5m game: 1.8s - 3.2s
        const base = 1800 + (strength / 100) * 1100;
        const variance = (Math.random() - 0.5) * 500;
        thinkingDelay = Math.max(1300, Math.min(3400, Math.floor(base + variance)));
      } else {
        // 10m+ game: 2.4s - 4.5s
        const base = 2400 + (strength / 100) * 1600;
        const variance = (Math.random() - 0.5) * 600;
        thinkingDelay = Math.max(1600, Math.min(4800, Math.floor(base + variance)));
      }
    }

    // Yield to the event loop so the browser renders CAISSA's "thinking" status and clocks tick smoothly
    const movePromise = new Promise<Move | null>((resolve) => {
      setTimeout(() => {
        if (turnId !== aiTurnCounterRef.current || gameStatusRef.current !== 'in-progress') {
          resolve(null);
          return;
        }
        const move = getAIMove(currentPosition, strength);
        resolve(move);
      }, 24);
    });

    const delayPromise = new Promise<void>((resolve) => {
      aiTimeoutRef.current = setTimeout(() => {
        resolve();
      }, thinkingDelay);
    });

    Promise.all([movePromise, delayPromise]).then(([aiMove]) => {
      if (turnId !== aiTurnCounterRef.current || gameStatusRef.current !== 'in-progress') {
        setIsThinking(false);
        return;
      }

      if (aiMove) {
        // Execute AI move with the exact same visible travel animation
        animateAndApplyMove(aiMove, () => {
          setIsThinking(false);
        });
      } else {
        setIsThinking(false);
      }
    });
  }, [animateAndApplyMove]);

  triggerAiTurnRef.current = triggerAiTurn;

  // Reset Game
  const startNewGame = useCallback((overrideMode?: 'ai' | 'pvp' | unknown) => {
    aiTurnCounterRef.current++;
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    // Ensure targetMode is strictly 'ai' or 'pvp' (never an event object from onClick)
    const targetMode: GameMode =
      overrideMode === 'ai' || overrideMode === 'pvp'
        ? overrideMode
        : (settingsRef.current.gameMode === 'pvp' ? 'pvp' : 'ai');

    setActiveMatchMode(targetMode);
    activeMatchModeRef.current = targetMode;

    if (settings.gameMode !== targetMode) {
      setSettings(prev => ({ ...prev, gameMode: targetMode }));
      settingsRef.current = { ...settingsRef.current, gameMode: targetMode };
    }

    const initial = createInitialPosition();
    resetCommentaryMemory();
    lastCommentMoveNumberRef.current = -10;

    // Reset board and position states and synchronous refs
    setPosition(initial);
    positionRef.current = initial;
    setPositionHistory([initial]);
    setMoveHistory([]);
    moveHistoryRef.current = [];
    setSelectedSquare(null);
    setValidMovesForSelected([]);
    setLastMove(null);

    // Reset game-over and thinking states
    setGameStatus('in-progress');
    gameStatusRef.current = 'in-progress';
    setWinner(null);
    setIsThinking(false);

    // Close all modals, popups, and toast overlays to guarantee clean interaction layer
    setIsGameOverModalOpen(false);
    setIsCelebrationOpen(false);
    setIsSettingsOpen(false);
    setIsStatsOpen(false);
    setPendingPromotionMove(null);
    setChessmateToast(null);

    // Reset piece movement animations
    setAnimatingMove(null);
    isAnimatingRef.current = false;
    setIsAnimating(false);

    // Clocks and timer resets
    const initialTime = getTimeInSeconds(settings.timeControl);
    setWhiteTime(initialTime);
    setBlackTime(initialTime);
    whiteTimeRef.current = initialTime;
    blackTimeRef.current = initialTime;

    // Determine user color
    const effectiveColor: PieceColor =
      settings.playerColor === 'random'
        ? Math.random() < 0.5
          ? 'w'
          : 'b'
        : settings.playerColor;

    setUserColor(effectiveColor);
    userColorRef.current = effectiveColor;

    if (targetMode === 'ai') {
      setFlipped(effectiveColor === 'b');
    }

    // Ensure we are viewing the active game screen
    setCurrentScreen('game');

    // Immediately persist initial game state
    saveActiveGameState({
      position: initial,
      positionHistory: [initial],
      moveHistory: [],
      lastMove: null,
      gameStatus: 'in-progress',
      winner: null,
      gameMode: targetMode,
      userColor: effectiveColor,
      flipped: targetMode === 'ai' ? effectiveColor === 'b' : false,
      timeControl: settingsRef.current.timeControl,
      whiteTime: initialTime,
      blackTime: initialTime,
      aiStrength: settingsRef.current.aiStrength,
      caissa: {
        messages: chessmateMessagesRef.current,
        isChessmateOpen: false,
        activeRightTab: 'moves',
        lastCommentMoveNumber: -10,
      },
      settingsSnapshot: settingsRef.current,
    });

    // If AI is playing White, trigger AI's opening move cleanly
    if (targetMode === 'ai' && effectiveColor === 'b') {
      const turnTimer = setTimeout(() => {
        if (gameStatusRef.current === 'in-progress') {
          triggerAiTurnRef.current(initial);
        }
      }, 400);
      aiTimeoutRef.current = turnTimer;
    }
  }, [settings.timeControl, settings.playerColor, settings.gameMode]);

  const clockTickCountRef = useRef<number>(0);

  // Precision Chess Clocks Loop (Synchronized turn-by-turn with background safety)
  useEffect(() => {
    if (gameStatus !== 'in-progress' || settings.timeControl === 'none') {
      return;
    }

    let lastTimestamp = performance.now();

    const timerInterval = setInterval(() => {
      // Safe background transition handling: If document is hidden, don't drain clock
      if (document.hidden) {
        lastTimestamp = performance.now();
        return;
      }

      const now = performance.now();
      let elapsed = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      // If elapsed is abnormally large (e.g. process was suspended or timer was throttled), clamp to 0.1s
      if (elapsed > 1.0) {
        elapsed = 0.1;
      }

      if (gameStatusRef.current !== 'in-progress') {
        clearInterval(timerInterval);
        return;
      }

      const activeTurn = positionRef.current.turn;

      if (activeTurn === 'w') {
        const nextTime = Math.max(0, whiteTimeRef.current - elapsed);
        whiteTimeRef.current = nextTime;
        const displaySecs = Math.ceil(nextTime);
        setWhiteTime(prev => (prev !== displaySecs ? displaySecs : prev));

        if (nextTime <= 0) {
          clearInterval(timerInterval);
          aiTurnCounterRef.current++;
          if (aiTimeoutRef.current) {
            clearTimeout(aiTimeoutRef.current);
            aiTimeoutRef.current = null;
          }
          setIsThinking(false);
          handleGameOver('timeout', 'b', moveHistoryRef.current.length);
        }
      } else {
        const nextTime = Math.max(0, blackTimeRef.current - elapsed);
        blackTimeRef.current = nextTime;
        const displaySecs = Math.ceil(nextTime);
        setBlackTime(prev => (prev !== displaySecs ? displaySecs : prev));

        if (nextTime <= 0) {
          clearInterval(timerInterval);
          aiTurnCounterRef.current++;
          if (aiTimeoutRef.current) {
            clearTimeout(aiTimeoutRef.current);
            aiTimeoutRef.current = null;
          }
          setIsThinking(false);
          handleGameOver('timeout', 'w', moveHistoryRef.current.length);
        }
      }

      // Periodically persist remaining time (every ~2 seconds = 20 ticks)
      clockTickCountRef.current++;
      if (clockTickCountRef.current % 20 === 0) {
        saveCurrentGame();
      }
    }, 100);

    return () => clearInterval(timerInterval);
  }, [gameStatus, settings.timeControl, handleGameOver, saveCurrentGame]);

  // Square Click Handling (Human Player)
  const handleSquareClick = useCallback((square: Square) => {
    if (
      gameStatusRef.current !== 'in-progress' ||
      isAnimatingRef.current ||
      animatingMove !== null
    ) {
      return;
    }
    if (settingsRef.current.gameMode === 'ai' && (position.turn !== userColorRef.current || isThinking)) return;

    const clickedPiece = position.board[square.row][square.col];

    // If clicked square is a valid destination for currently selected piece
    if (selectedSquare) {
      const matchingMove = validMovesForSelected.find(
        m => m.to.row === square.row && m.to.col === square.col
      );

      if (matchingMove) {
        // Check for pawn promotion
        const isPromotion =
          matchingMove.piece.type === 'p' &&
          (matchingMove.to.row === 0 || matchingMove.to.row === 7);

        if (isPromotion && !matchingMove.promotion) {
          setPendingPromotionMove({ from: selectedSquare, to: square });
          return;
        }

        animateAndApplyMove(matchingMove);
        return;
      }
    }

    // Select piece if it belongs to active turn player
    if (clickedPiece && clickedPiece.color === position.turn) {
      setSelectedSquare(square);
      const legalMoves = getLegalMoves(position, square);
      setValidMovesForSelected(legalMoves);
    } else {
      setSelectedSquare(null);
      setValidMovesForSelected([]);
    }
  }, [position, selectedSquare, validMovesForSelected, isThinking, animatingMove, animateAndApplyMove]);

  // Promotion Selection
  const handlePromotionSelect = useCallback((promoType: PieceType) => {
    if (!pendingPromotionMove) return;
    const moves = getLegalMoves(position, pendingPromotionMove.from);
    const chosenMove = moves.find(
      m =>
        m.to.row === pendingPromotionMove.to.row &&
        m.to.col === pendingPromotionMove.to.col &&
        m.promotion === promoType
    );

    setPendingPromotionMove(null);
    if (chosenMove) {
      animateAndApplyMove(chosenMove);
    }
  }, [pendingPromotionMove, position, animateAndApplyMove]);

  // Undo Move
  const handleUndo = useCallback(() => {
    if (
      positionHistory.length <= 1 ||
      gameStatusRef.current !== 'in-progress' ||
      isThinking ||
      isAnimatingRef.current ||
      animatingMove !== null
    )
      return;

    aiTurnCounterRef.current++;
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    isAnimatingRef.current = false;
    setIsAnimating(false);
    setAnimatingMove(null);
    setIsThinking(false);

    // In AI mode, revert 2 half-moves so it returns to player's turn
    const stepsToUndo = settingsRef.current.gameMode === 'ai' && positionHistory.length >= 3 ? 2 : 1;
    const newPosIndex = positionHistory.length - 1 - stepsToUndo;

    if (newPosIndex >= 0) {
      const targetPos = positionHistory[newPosIndex];
      const newPosHistory = positionHistory.slice(0, newPosIndex + 1);
      const newMoveHistory = moveHistory.slice(0, newPosIndex);

      setPosition(targetPos);
      positionRef.current = targetPos;
      setPositionHistory(newPosHistory);
      positionHistoryRef.current = newPosHistory;
      setMoveHistory(newMoveHistory);
      moveHistoryRef.current = newMoveHistory;
      const prevLastMove = newMoveHistory[newMoveHistory.length - 1] || null;
      setLastMove(prevLastMove);
      lastMoveRef.current = prevLastMove;
      setSelectedSquare(null);
      setValidMovesForSelected([]);
      chessAudio.playMove();
      saveCurrentGame();
    }
  }, [positionHistory, moveHistory, isThinking, animatingMove, saveCurrentGame]);

  // Resign Game
  const handleResign = useCallback(() => {
    if (gameStatusRef.current !== 'in-progress') return;
    aiTurnCounterRef.current++;
    const winningSide: PieceColor = position.turn === 'w' ? 'b' : 'w';
    handleGameOver('resigned', winningSide, moveHistory.length);
  }, [position.turn, moveHistory.length, handleGameOver]);

  // Computed Info (Memoized for high performance)
  const capturedInfo = useMemo(() => getCapturedPieces(moveHistory), [moveHistory]);
  const activeCheckColor: PieceColor | null = useMemo(
    () => (isKingInCheck(position.board, position.turn) ? position.turn : null),
    [position]
  );
  const liveGameContext = useMemo(
    () => getLiveGameContext(),
    [position, moveHistory, settings.aiStrength, userColor, getLiveGameContext]
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* If currentScreen is 'home' or 'mode_select', render the CHESSMATE Homepage */}
      {currentScreen !== 'game' ? (
        <HomeScreen
          onStartVsCaissa={() => {
            startNewGame('ai');
            setCurrentScreen('game');
          }}
          onStartWithFriend={() => {
            startNewGame('pvp');
            setCurrentScreen('game');
          }}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          stats={stats}
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
        />
      ) : (
        <>
          {/* Premium Header Bar */}
          <header className="w-full border-b border-stone-800/80 bg-stone-900/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 sticky top-0 z-30 shadow-md">
            <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-y-2 gap-x-2 md:gap-x-3">
              {/* Row 1 on Mobile / Left Section on Desktop: Brand */}
              <div className="order-1 flex items-center gap-2 sm:gap-2.5 shrink-0">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="flex items-center gap-2 sm:gap-2.5 hover:opacity-90 transition text-left cursor-pointer"
                  title="Return to CHESSMATE Homepage"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-black shadow-md shadow-amber-500/20 shrink-0">
                    <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h1 className="text-sm sm:text-base font-bold tracking-tight font-serif text-stone-100 whitespace-nowrap">
                      CHESSMATE
                    </h1>
                    <span className="text-[9px] sm:text-[10px] uppercase font-sans font-semibold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 whitespace-nowrap">
                      <span className="hidden sm:inline">Grandmaster Edition</span>
                      <span className="sm:hidden">GM Edition</span>
                    </span>
                  </div>
                </button>
              </div>

              {/* Best Victory Trophy Badge in Header (Visible on Desktop / Large Screens) */}
              <button
                id="header-best-victory-btn"
                onClick={() => setIsStatsOpen(true)}
                className="hidden lg:flex order-2 items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition shadow-xs active:scale-95 cursor-pointer shrink-0 lg:ml-auto"
                title="View Career Statistics"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono font-bold">
                  {stats.bestVictoryAi !== null ? `Best: ${stats.bestVictoryAi}% AI` : 'Best: None'}
                </span>
              </button>

              {/* PWA Install Button (Unobtrusive; appears only when installable) */}
              <div className="order-2 flex items-center shrink-0">
                <PWAInstallButton variant="compact" />
              </div>

              {/* CHESSMATE Companion Button (Right-aligned in Row 1 on Mobile; grouped on Desktop) */}
              <button
                id="header-chessmate-btn"
                onClick={() => setIsChessmateOpen(prev => !prev)}
                className="order-2 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-stone-200 hover:text-stone-50 bg-stone-900 hover:bg-stone-850 border border-amber-500/40 hover:border-amber-500/70 transition text-xs font-semibold shadow-xs active:scale-95 cursor-pointer relative shrink-0 ml-auto md:ml-auto lg:ml-0"
                title="Talk to CHESSMATE (Chess Companion)"
              >
                <span className="text-sm select-none">♟️</span>
                <span className="font-serif font-bold tracking-wide text-amber-300">CHESSMATE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              {/* Row 2 on Mobile (Full Width Action Bar) / Right Side Controls on Desktop */}
              <div className="order-3 w-full basis-full md:basis-auto md:w-auto grid grid-cols-5 md:flex items-center gap-1.5 sm:gap-2 pt-1.5 md:pt-0 border-t border-stone-800/60 md:border-t-0">
                {/* 1. Home / Menu Navigation Button */}
                <button
                  id="header-home-btn"
                  onClick={() => setCurrentScreen('home')}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-stone-300 hover:text-stone-100 bg-stone-900 hover:bg-stone-800 border border-stone-800/90 transition text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
                  title="Return to CHESSMATE Homepage"
                >
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] sm:text-xs">Home</span>
                </button>

                {/* 2. Player Statistics Button */}
                <button
                  id="header-stats-btn"
                  onClick={() => setIsStatsOpen(true)}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-stone-300 hover:text-stone-100 bg-stone-900 hover:bg-stone-800 border border-stone-800/90 transition text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
                  title="Player Statistics"
                >
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] sm:text-xs">Stats</span>
                </button>

                {/* 3. Sound/Mute Toggle */}
                <button
                  id="header-sound-btn"
                  onClick={() =>
                    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
                  }
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 md:px-2.5 py-1.5 sm:py-2 rounded-xl text-stone-400 hover:text-stone-100 bg-stone-900 hover:bg-stone-800 border border-stone-800/90 transition text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
                  title={settings.soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
                >
                  {settings.soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  )}
                  <span className="text-[11px] sm:text-xs md:hidden">Sound</span>
                </button>

                {/* 4. Flip Board */}
                <button
                  id="header-flip-btn"
                  onClick={() => setFlipped(f => !f)}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 md:px-2.5 py-1.5 sm:py-2 rounded-xl text-stone-400 hover:text-stone-100 bg-stone-900 hover:bg-stone-800 border border-stone-800/90 transition text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
                  title="Flip Board Perspective"
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[11px] sm:text-xs md:hidden">Flip</span>
                </button>

                {/* 5. Game Settings Button */}
                <button
                  id="header-settings-btn"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-stone-300 hover:text-stone-100 bg-stone-900 hover:bg-stone-800 border border-stone-800/90 transition text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
                  title="Game Settings"
                >
                  <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] sm:text-xs">Settings</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Game Arena */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Board and Player Heads */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center w-full">
          {/* Top Opponent Bar */}
          <div className="w-full max-w-[560px] flex items-center justify-between py-2.5 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-200 shadow-sm">
                {settings.gameMode === 'ai' ? (
                  <Bot className="w-5 h-5 text-amber-400" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col justify-center">
                <div>
                  {settings.gameMode === 'ai' ? (
                    <span
                      id="ai-opponent-name"
                      className="text-sm font-serif font-bold tracking-[0.18em] text-stone-100 uppercase select-none"
                    >
                      CAISSA
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-stone-200">
                      {flipped ? 'White' : 'Black'}
                    </span>
                  )}
                </div>

                {/* Sub-status stacked directly below name */}
                <div className="flex items-center gap-2 mt-0.5">
                  {settings.gameMode === 'ai' ? (
                    isThinking ? (
                      <span
                        id="ai-thinking-indicator"
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-200 text-[10px] font-mono font-medium shadow-xs select-none"
                        title="AI is calculating"
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                        </span>
                        <span>Thinking...</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-stone-400 tracking-wide select-none">
                        {gameStatus === 'in-progress' ? 'Waiting for move' : 'Ready'}
                      </span>
                    )
                  ) : null}

                  <CapturedPieces
                    pieces={flipped ? capturedInfo.whiteCaptured : capturedInfo.blackCaptured}
                    advantage={flipped ? capturedInfo.advantage : -capturedInfo.advantage}
                    side={flipped ? 'w' : 'b'}
                  />
                </div>
              </div>
            </div>

            <Timer
              seconds={flipped ? whiteTime : blackTime}
              isActive={gameStatus === 'in-progress' && position.turn === (flipped ? 'w' : 'b')}
              isUnlimited={settings.timeControl === 'none'}
              label={flipped ? 'White' : 'Black'}
            />
          </div>

          {/* Realistic Chess Board */}
          <div className="my-1 w-full flex justify-center">
            <ChessBoard
              board={position.board}
              flipped={flipped}
              selectedSquare={selectedSquare}
              validMoves={validMovesForSelected}
              lastMove={lastMove}
              kingInCheck={activeCheckColor}
              theme={settings.boardTheme}
              showLegalMoves={settings.showLegalMoves}
              highlightLastMove={settings.highlightLastMove}
              animatingMove={animatingMove}
              onSquareClick={handleSquareClick}
              disabled={isThinking || isAnimating || animatingMove !== null || gameStatus !== 'in-progress'}
            />
          </div>

          {/* Bottom Player Bar */}
          <div className="w-full max-w-[560px] flex items-center justify-between py-2.5 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-200 shadow-sm">
                <User className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-stone-200">
                  {settings.gameMode === 'ai' ? 'You' : flipped ? 'Black' : 'White'}
                </span>
                <CapturedPieces
                  pieces={flipped ? capturedInfo.blackCaptured : capturedInfo.whiteCaptured}
                  advantage={flipped ? -capturedInfo.advantage : capturedInfo.advantage}
                  side={flipped ? 'b' : 'w'}
                />
              </div>
            </div>

            <Timer
              seconds={flipped ? blackTime : whiteTime}
              isActive={gameStatus === 'in-progress' && position.turn === (flipped ? 'b' : 'w')}
              isUnlimited={settings.timeControl === 'none'}
              label={flipped ? 'Black' : 'White'}
            />
          </div>
        </div>

        {/* Right Column: Controls, AI Strength Slider, and Move History */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full h-full max-h-[700px]">
          {/* Game Turn & Check Status Banner */}
          <div className="bg-stone-900 border border-stone-800/90 rounded-2xl p-4 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full shadow-md ${
                  position.turn === 'w'
                    ? 'bg-stone-100 shadow-[0_0_8px_white]'
                    : 'bg-stone-800 border border-stone-600'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  Active Turn
                </span>
                <span className="text-sm font-bold text-stone-100">
                  {position.turn === 'w' ? 'White to move' : 'Black to move'}
                  {activeCheckColor && (
                    <span className="text-red-400 font-bold ml-2 animate-pulse">(Check!)</span>
                  )}
                </span>
              </div>
            </div>

            {gameStatus !== 'in-progress' && (
              <button
                id="view-result-badge-btn"
                onClick={() => {
                  if (winner === userColor) {
                    setIsCelebrationOpen(true);
                  } else {
                    setIsGameOverModalOpen(true);
                  }
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition cursor-pointer flex items-center gap-1 active:scale-95"
                title="Click to view match result summary"
              >
                <span>
                  {gameStatus === 'checkmate' && winner === userColor
                    ? '🏆 VICTORY'
                    : gameStatus.replace('-', ' ').toUpperCase()}
                </span>
                <span className="text-[10px] text-amber-400/80 underline ml-0.5">Result</span>
              </button>
            )}
          </div>

          {/* AI STRENGTH METER (Green -> Yellow -> Orange -> Red) */}
          {settings.gameMode === 'ai' && (
            <AiStrengthMeter
              value={settings.aiStrength}
              onChange={newStrength => setSettings(prev => ({ ...prev, aiStrength: newStrength }))}
              disabled={isThinking}
            />
          )}

          {/* Premium Action Button Controls */}
          <div className="grid grid-cols-3 gap-2">
            <button
              id="new-game-btn"
              onClick={() => startNewGame()}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/15 transition active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Match</span>
            </button>

            <button
              id="undo-move-btn"
              onClick={handleUndo}
              disabled={positionHistory.length <= 1 || gameStatus !== 'in-progress' || isThinking}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 disabled:opacity-35 disabled:cursor-not-allowed border border-stone-800 text-xs font-semibold transition active:scale-95 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            <button
              id="resign-btn"
              onClick={handleResign}
              disabled={gameStatus !== 'in-progress'}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-stone-900 hover:bg-red-950/40 text-stone-300 hover:text-red-400 disabled:opacity-35 disabled:cursor-not-allowed border border-stone-800 hover:border-red-500/40 text-xs font-semibold transition active:scale-95 shadow-sm"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Resign</span>
            </button>
          </div>

          {/* Move Ledger & Companion Tabs */}
          <div className="flex-1 min-h-[260px] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 p-0.5 bg-stone-900/90 rounded-xl border border-stone-800">
                <button
                  id="tab-moves-ledger"
                  onClick={() => setActiveRightTab('moves')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeRightTab === 'moves'
                      ? 'bg-stone-800 text-stone-100 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Moves ({moveHistory.length})
                </button>
                <button
                  id="tab-chessmate"
                  onClick={() => {
                    setIsChessmateOpen(true);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    isChessmateOpen
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-stone-400 hover:text-amber-300'
                  }`}
                >
                  <span>♟️ CHESSMATE</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              </div>

              <button
                id="open-chessmate-link"
                onClick={() => setIsChessmateOpen(true)}
                className="text-[11px] text-amber-400/90 hover:text-amber-300 font-medium flex items-center gap-1 transition cursor-pointer"
              >
                <span>Companion</span>
                <span>💬</span>
              </button>
            </div>

            <MoveHistory history={moveHistory} />
          </div>

          {/* Technical Specs Footer & Quick Stats */}
          <div className="px-3.5 py-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
            <button
              onClick={() => setIsStatsOpen(true)}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold transition cursor-pointer"
              title="Click to view full player statistics"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>🏆 Best: {stats.bestVictoryAi !== null ? `${stats.bestVictoryAi}% AI` : 'None'}</span>
            </button>
            <span className="font-mono text-stone-400">{position.fullmoveNumber} turns</span>
          </div>
        </div>
      </main>
      </>
      )}

      {/* Pawn Promotion Modal */}
      {pendingPromotionMove && (
        <PromotionModal
          color={position.turn}
          onSelect={handlePromotionSelect}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdate={newSettings => {
          const tcChanged = newSettings.timeControl !== settings.timeControl;
          const modeChanged = newSettings.gameMode !== settings.gameMode;
          setSettings(newSettings);
          settingsRef.current = newSettings;
          if (modeChanged) {
            setActiveMatchMode(newSettings.gameMode);
            activeMatchModeRef.current = newSettings.gameMode;
            if (newSettings.gameMode === 'pvp') {
              aiTurnCounterRef.current++;
              if (aiTimeoutRef.current) {
                clearTimeout(aiTimeoutRef.current);
                aiTimeoutRef.current = null;
              }
              setIsThinking(false);
            }
          }
          if (tcChanged) {
            const newT = getTimeInSeconds(newSettings.timeControl);
            setWhiteTime(newT);
            setBlackTime(newT);
            whiteTimeRef.current = newT;
            blackTimeRef.current = newT;
          }
        }}
      />

      {/* Grand Victory Celebration Modal */}
      {isCelebrationOpen && winner && (
        <GrandVictoryCelebration
          status={gameStatus}
          winner={winner}
          playerColor={userColor}
          gameMode={activeMatchMode}
          aiStrength={settings.aiStrength}
          movesCount={moveHistory.length}
          stats={stats}
          isNewRecord={isNewRecord}
          insight={
            activeMatchMode === 'ai'
              ? (currentInsight || {
                  quote: 'Magnificent tactical triumph. You dismantled my defense with precision.',
                  source: 'CAISSA • Neural Arbiter',
                  category: 'victory',
                })
              : null
          }
          onNewGame={() => startNewGame()}
          onReviewBoard={() => setIsCelebrationOpen(false)}
          onOpenStats={() => {
            setIsCelebrationOpen(false);
            setIsStatsOpen(true);
          }}
        />
      )}

      {/* Statistics Modal */}
      <StatisticsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onStatsReset={fresh => setStats(fresh)}
      />

      {/* Cinematic Game Over Modal */}
      {isGameOverModalOpen && (
        <GameOverModal
          status={gameStatus}
          winner={winner}
          playerColor={userColor}
          gameMode={activeMatchMode}
          movesCount={moveHistory.length}
          insight={activeMatchMode === 'ai' ? currentInsight : null}
          stats={stats}
          aiStrength={settings.aiStrength}
          onNewGame={() => startNewGame()}
          onClose={() => setIsGameOverModalOpen(false)}
          onOpenStats={() => {
            setIsGameOverModalOpen(false);
            setIsStatsOpen(true);
          }}
          onOpenCelebration={
            winner
              ? () => {
                  setIsGameOverModalOpen(false);
                  setIsCelebrationOpen(true);
                }
              : undefined
          }
        />
      )}

      {/* CHESSMATE Companion Flyout Panel */}
      <ChessmatePanel
        isOpen={isChessmateOpen}
        onClose={() => setIsChessmateOpen(false)}
        gameContext={liveGameContext}
        messages={chessmateMessages}
        onSendMessage={handleSendChessmateMessage}
        isLoading={isChessmateLoading}
        onClearChat={() => {
          setChessmateMessages([
            {
              id: 'welcome',
              role: 'model',
              text: 'Greetings! I am **CHESSMATE**, your chess companion. Ask me anything about chess rules, openings, strategy, tactics, or your current match with CAISSA! ♟️',
              timestamp: Date.now(),
            },
          ]);
        }}
      />

      {/* CHESSMATE Non-Intrusive In-Game Toast for Automatic Commentary */}
      <ChessmateToast
        message={chessmateToast}
        onDismiss={() => setChessmateToast(null)}
        onOpenPanel={() => {
          setChessmateToast(null);
          setIsChessmateOpen(true);
        }}
      />
    </div>
  );
}
