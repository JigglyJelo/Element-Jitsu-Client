// ───────────────────────────────────────────────────────────────────────────────
// useGameScreenLogic.ts
// ───────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { getUsername } from '../../globals';
import { socket } from '../../socket';
import type {
  LobbySettings,
  PlayerStats,
  MoveElement,
  RoundStatsPayload,
  GameOverPayload,
} from '../../types';

export type Phase = 'pick' | 'reveal' | 'gameOver';

interface ChosenCard {
  element: MoveElement;
  power: number;
}

export function useGameScreenLogic(lobbyId: number, players: string[]) {
  const username = getUsername();
  const opponentName = players.find((u) => u !== username) || '';

  const [lobbySettings, setLobbySettings] = useState<LobbySettings | null>(null);

  // Both players’ stats (updated each round/at gameOver)
  const [stats, setStats] = useState<Record<string, PlayerStats>>({});

  //  Current UI phase
  const [phase, setPhase] = useState<Phase>('pick');

  //  Local’s choice this round
  const [selectedElement, setSelectedElement] = useState<MoveElement | null>(null);
  const [selectedPower, setSelectedPower] = useState<number>(0);

  // Track whether each player has clicked “Choose” (before reveal)
  const [hasPicked, setHasPicked] = useState<{ [user: string]: boolean }>({});

  //  Once “Choose” is clicked (or server sends roundStats), store actual cards here.
  const [chosenCards, setChosenCards] = useState<{ [user: string]: ChosenCard | null }>({});

  // Game‐over payload + message We will hold the incoming payload here, but only switch to `phase='gameOver'` after reveal.
  const [gameOverResult, setGameOverResult] = useState<GameOverPayload | null>(null);
  const [gameOverMessage, setGameOverMessage] = useState<string>('');

  // Whether to show the “round result” text in the header (only after delay)
  const [revealTextVisible, setRevealTextVisible] = useState(false);

  // Keep refs to timeouts so we can clear them
  const revealTimeout = useRef<number | null>(null);
  const statsTimeoutRef = useRef<number | null>(null);

  // Initialize chosenCards + hasPicked once opponentName is known
  useEffect(() => {
    if (opponentName) {
      setChosenCards({
        [username]: null,
        [opponentName]: null,
      });
      setHasPicked({
        [username]: false,
        [opponentName]: false,
      });
    }
  }, [opponentName, username]);

  // Fetch settings + register listeners
  useEffect(() => {
    // Fetch LobbySettings once
    socket.emit('getLobbySettings', (settings: LobbySettings | null) => {
      if (settings) {
        setLobbySettings(settings);
        // Set slider default: half of startingElementPoints capped at half maxElementalPower
        const halfStart = Math.ceil(settings.startingElementPoints / 2);
        const halfMax = Math.ceil(settings.maxElementalPower / 2);
        setSelectedPower(Math.min(halfStart, halfMax));
      }
    });

    // “playerPicked” from server (opponent or you) – only marks hasPicked
    const handlePlayerPicked = (payload: { username: string }) => {
      const picker = payload.username;
      setHasPicked((prev) => {
        if (!(picker in prev)) return prev;
        return { ...prev, [picker]: true };
      });
    };
    socket.on('playerPicked', handlePlayerPicked);

    // “roundStats” when both submitted
    const handleRoundStats = (payload: RoundStatsPayload) => {
      // Re‐initialize chosenCards from payload.moves (in case of race)
      const newChosen: { [user: string]: ChosenCard | null } = {
        [username]: null,
        [opponentName]: null,
      };
      for (const [user, mv] of Object.entries(payload.moves)) {
        newChosen[user] = { element: mv.element, power: mv.power };
      }
      setChosenCards(newChosen);

      // Clear hasPicked flags for next round
      setHasPicked({
        [username]: false,
        [opponentName]: false,
      });

      // Switch to ‘reveal’ right away (so the flip‐card CSS can start)
      setPhase('reveal');

      // Hide the header text until after the flip animation (~700ms)
      setRevealTextVisible(false);

      // Delay stats update AND header‐text update until after flip (~700ms)
      if (statsTimeoutRef.current !== null) {
        clearTimeout(statsTimeoutRef.current);
      }
      statsTimeoutRef.current = window.setTimeout(() => {
        setStats(payload.stats);
        setRevealTextVisible(true);
        statsTimeoutRef.current = null;
      }, 700);
    };
    socket.on('roundStats', handleRoundStats);

    // “gameOver” → store payload, but defer “phase = gameOver”
    const handleGameOver = (payload: GameOverPayload) => {
      // Don’t clear revealTimeout/ statsTimeout here, so that the final‐round reveal can still play.
      // We simply stash the payload and message; we’ll transition to gameOver phase after reveal finishes.
      setGameOverResult(payload);

      const winner = payload.winner;
      if (winner === 'draw') {
        setGameOverMessage('Game ended in a draw!');
      } else if (winner === username) {
        setGameOverMessage('Congratulations! You won the game!');
      } else {
        setGameOverMessage('You lost the game. Better luck next time.');
      }
      // If we’re NOT currently in a “reveal” phase, immediately jump to gameOver.
      // If we are in reveal, let the existing revealTimeout effect handle it.
      setPhase((currentPhase) => {
        return currentPhase !== 'reveal' ? 'gameOver' : currentPhase;
      });
    };
    socket.on('gameOver', handleGameOver);

    // “opponentDisconnected” → instantly force a game-over (skip any reveal)
    const handleDisconnect = (wrapper: { disconnected: string; gameOver: GameOverPayload }) => {
      const payload = wrapper.gameOver;
      setGameOverResult(payload);
      const winner = payload.winner;
      if (winner === 'draw') {
        setGameOverMessage('Game ended in a draw!');
      } else if (winner === username) {
        setGameOverMessage('Opponent disconnected—You win!');
      } else {
        setGameOverMessage('You lost the game. Better luck next time.');
      }
      // Immediately cut to “gameOver” regardless of current phase
      setPhase('gameOver');
    };
    socket.on('opponentDisconnected', handleDisconnect);

    return () => {
      socket.off('playerPicked', handlePlayerPicked);
      socket.off('roundStats', handleRoundStats);
      socket.off('gameOver', handleGameOver);
      socket.off('opponentDisconnected', handleDisconnect);

      if (revealTimeout.current !== null) {
        clearTimeout(revealTimeout.current);
      }
      if (statsTimeoutRef.current !== null) {
        clearTimeout(statsTimeoutRef.current);
      }
    };
  }, [lobbyId, username, opponentName]);

  // ───────────────────────────────────────────────────────────────────────────────
  // Once both chosenCards slots are non‐null, schedule nextRound() or game‐over transition
  const nextRound = useCallback(() => {
    setChosenCards({
      [username]: null,
      [opponentName]: null,
    });
    setHasPicked({
      [username]: false,
      [opponentName]: false,
    });
    setSelectedElement(null);
    setSelectedPower(0);
    setPhase('pick');
    setGameOverResult(null);
    setGameOverMessage('');
    setRevealTextVisible(false);
  }, [username, opponentName]);

  useEffect(() => {
    // Only schedule if we’re still in “reveal” and both cards are present
    if (phase !== 'reveal' || !opponentName) return;

    const my = chosenCards[username];
    const opp = chosenCards[opponentName];
    if (my !== null && opp !== null) {
      // Clear any existing revealTimeout
      if (revealTimeout.current !== null) {
        clearTimeout(revealTimeout.current);
      }
      // If a gameOverResult is pending, then after this same 1s delay, switch to gameOver
      // Otherwise, go to nextRound()
      revealTimeout.current = window.setTimeout(() => {
        if (gameOverResult) {
          // Final‐round: show gameOver screen
          setPhase('gameOver');
        } else {
          // Normal round: reset to pick
          nextRound();
        }
        revealTimeout.current = null;
      }, 700 + 1500); // ← adjust this ms to control how long “reveal” lasts
    }
  }, [chosenCards, username, opponentName, phase, gameOverResult, nextRound]);

  // ───────────────────────────────────────────────────────────────────────────────
  // Helper: derive a PlayerStats or fallback if none yet
  const getStatsOrDefault = (user: string): PlayerStats => {
    if (stats[user]) {
      return stats[user]!;
    }
    if (lobbySettings) {
      return {
        fireWinPowers: [],
        waterWinPowers: [],
        grassWinPowers: [],
        firePoints: lobbySettings.startingElementPoints,
        waterPoints: lobbySettings.startingElementPoints,
        grassPoints: lobbySettings.startingElementPoints,
      };
    }
    return {
      fireWinPowers: [],
      waterWinPowers: [],
      grassWinPowers: [],
      firePoints: 0,
      waterPoints: 0,
      grassPoints: 0,
    };
  };
  const yourStats = getStatsOrDefault(username);
  const oppStats = opponentName ? getStatsOrDefault(opponentName) : getStatsOrDefault('');

  // Called when user clicks a radio to select an element
  function selectElement(el: MoveElement) {
    setSelectedElement(el);
    if (!lobbySettings) return;

    // Compute how many points remain in that element
    const baseStats: PlayerStats = stats[username] || {
      fireWinPowers: [],
      waterWinPowers: [],
      grassWinPowers: [],
      firePoints: lobbySettings.startingElementPoints,
      waterPoints: lobbySettings.startingElementPoints,
      grassPoints: lobbySettings.startingElementPoints,
    };
    const key = (el + 'Points') as 'firePoints' | 'waterPoints' | 'grassPoints';
    const availablePts = baseStats[key];

    // Default slider = half of available, capped at half of maxElementalPower
    const halfMax = Math.ceil(lobbySettings.maxElementalPower / 2);
    setSelectedPower(Math.min(Math.ceil(availablePts / 2), halfMax));
  }

  // Called when user moves the slider
  function changePower(value: number) {
    setSelectedPower(value);
  }

  // Called when user clicks “Choose”
  function submitMove(card: { element: MoveElement; power: number }) {
    // Emit to server and wait for confirmation before entering “reveal”
    socket.emit(
      'playerMove',
      { lobbyId, username, move: card },
      (resp: { success: boolean; error?: string }) => {
        if (resp.success) {
          // Only after server ACK do we store our card & enter reveal
          setChosenCards((prev) => ({
            ...prev,
            [username]: { element: card.element, power: card.power },
          }));
          setPhase('reveal');
        } else {
          alert('Error: ' + (resp.error || 'Unknown'));
          // stay in pick phase; no need to rollback because we never set chosenCards early
        }
      }
    );
  }

  // Convert MoveElement → emoji
  function labelElement(el: MoveElement) {
    switch (el) {
      case 'fire':
        return '🔥';
      case 'water':
        return '💧';
      case 'grass':
        return '🌿';
    }
  }

  return {
    username,
    lobbySettings,
    stats,
    phase,
    opponentName,
    yourStats,
    oppStats,
    selectedElement,
    selectedPower,
    available:
      selectedElement && lobbySettings
        ? yourStats[
            (selectedElement + 'Points') as 'firePoints' | 'waterPoints' | 'grassPoints'
          ]
        : 0,
    sliderMax:
      selectedElement && lobbySettings
        ? Math.min(
            lobbySettings.maxElementalPower,
            yourStats[
              (selectedElement + 'Points') as 'firePoints' | 'waterPoints' | 'grassPoints'
            ]
          )
        : 0,
    labelElement,
    submitMove,
    selectElement,
    changePower,
    chosenCards,
    hasPicked,
    gameOverResult,
    gameOverMessage,
    nextRound,
    revealTextVisible,
  };
}
