import { useState, useCallback } from "react";
import type {
  GameState,
  PlayerId,
  Card,
  GameResult,
} from "../types/spades";
import {
  initializeGame,
  playCard as logicPlayCard,
  calculateScores,
} from "../utils/gameLogic";

export function useGameState(initial?: GameState) {
  // Start with null - game state is set only when server sends start_game event
  // This allows the lobby to show while waiting for players
  const [state, setState] = useState<GameState | null>(initial ?? null);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [isHandOver, setIsHandOver] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [completedRound, setCompletedRound] = useState<number>(-1);

  const totalScores = history.reduce((acc, r) => {
    (Object.keys(r.totalScores) as PlayerId[]).forEach((p) => {
      acc[p] = (acc[p] ?? 0) + (r.totalScores[p] ?? 0);
    });
    return acc;
  }, { north: 0, east: 0, south: 0, west: 0 } as Record<PlayerId, number>);

  const startGame = useCallback(() => {
    setState(initializeGame());
    setIsHandOver(false);
    setIsGameOver(false);
    setHistory([]);
    setCompletedRound(-1);
  }, []);

  const placeBid = useCallback((player: PlayerId, bid: number) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        bids: { ...prev.bids, [player]: bid },
      };
    });
  }, []);

  const playCard = useCallback((player: PlayerId, card: Card) => {
    setState((prev) => {
      const copy = structuredClone(prev) as GameState;
      logicPlayCard(copy, player, card);
      return copy;
    });
  }, []);

  const evaluateAndAdvanceTrick = useCallback(() => {
    // This callback is called when trick animations end
    // The actual hand completion detection is handled by a useEffect below
    // So we just need to update the state for visual purposes
    setState((prev) => {
      if (!prev) return prev;
      return prev;
    });
  }, []);

  // Detect when a hand is complete (13 tricks played) and only trigger once per round
  useEffect(() => {
    if (!state || isHandOver) return;

    const totalTricksPlayed = Object.values(state.tricksWon).reduce((sum, tricks) => sum + tricks, 0);

    // Only trigger if: (1) all 13 tricks played, (2) this round hasn't been marked complete yet
    if (totalTricksPlayed >= 13 && state.round !== completedRound) {
      setCompletedRound(state.round);
      setIsHandOver(true);
      const scores = calculateScores(state.bids, state.tricksWon);
      setHistory((h) => [
        ...h,
        {
          gameId: state.round,
          bids: { ...state.bids },
          tricksWon: { ...state.tricksWon },
          scores,
          totalScores: totalScores as Record<PlayerId, number>,
        },
      ]);
    }
  }, [state, isHandOver, completedRound, totalScores]);

  const resetGame = useCallback(() => {
    startGame();
  }, [startGame]);

  // Automatically deal new hand after current hand ends
  const dealNextHand = useCallback(() => {
    setIsHandOver(false);
    startGame();
  }, [startGame]);

  const applyServerState = useCallback((serverState: GameState) => {
    setState(serverState);
  }, []);

  const applyServerStateNewHand = useCallback((serverState: GameState) => {
    setState(serverState);
    setIsHandOver(false);  // Reset hand completion for new hand
    setCompletedRound(-1); // Reset so next round can be detected
  }, []);

  const endGame = useCallback(() => {
    setIsGameOver(true);
  }, []);

  return {
    state,
    isHandOver,
    isGameOver,
    gameHistory: history,
    totalScores: totalScores as Record<PlayerId, number>,
    startGame,
    placeBid,
    playCard,
    evaluateAndAdvanceTrick,
    resetGame,
    dealNextHand,
    applyServerState,
    applyServerStateNewHand,
    endGame,
  };
}
