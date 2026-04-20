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
    setState((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev) as GameState;

      // Check if all 13 tricks have been played by summing tricksWon
      const totalTricksPlayed = Object.values(copy.tricksWon).reduce((sum, tricks) => sum + tricks, 0);
      const isHandDone = totalTricksPlayed >= 13;

      // Only mark hand as over if:
      // 1. All 13 tricks have been played
      // 2. We haven't already marked this round as complete (checked by round number)
      if (isHandDone && copy.round !== completedRound) {
        setCompletedRound(copy.round);
        setIsHandOver(true);
        const scores = calculateScores(copy.bids, copy.tricksWon);
        setHistory((h) => [
          ...h,
          {
            gameId: copy.round,
            bids: { ...copy.bids },
            tricksWon: { ...copy.tricksWon },
            scores,
            totalScores: totalScores as Record<PlayerId, number>,
          },
        ]);
      }
      return copy;
    });
  }, [totalScores, completedRound]);

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
