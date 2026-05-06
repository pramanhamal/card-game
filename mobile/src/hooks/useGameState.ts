import { useState, useCallback, useEffect, useRef } from "react";
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
  const [state, setState] = useState<GameState | null>(initial ?? null);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [isHandOver, setIsHandOver] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [completedRound, setCompletedRound] = useState<number>(-1);

  const totalScores = history.reduce(
    (acc, r) => {
      (Object.keys(r.totalScores) as PlayerId[]).forEach((p) => {
        acc[p] = (acc[p] ?? 0) + (r.totalScores[p] ?? 0);
      });
      return acc;
    },
    { north: 0, east: 0, south: 0, west: 0 } as Record<PlayerId, number>
  );

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
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev)) as GameState;
      logicPlayCard(copy, player, card);
      return copy;
    });
  }, []);

  const evaluateAndAdvanceTrick = useCallback(() => {
    // Trick completion and hand-over detection is handled by the useEffect below.
    // This callback is kept for animation coordination in Table.tsx.
    setState((prev) => prev);
  }, []);

  // Detect when a hand is complete (13 tricks played) — fires once per round
  useEffect(() => {
    if (!state || isHandOver) return;

    const totalTricksPlayed = Object.values(state.tricksWon).reduce(
      (sum, t) => sum + t,
      0
    );

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

  const clearGame = useCallback(() => {
    setState(null);
    setIsHandOver(false);
    setIsGameOver(false);
    setCompletedRound(-1);
    setHistory([]);
  }, []);

  // Deal next hand without clearing history
  const dealNextHand = useCallback(() => {
    setState(initializeGame());
    setIsHandOver(false);
    setCompletedRound(-1);
  }, []);

  const applyServerState = useCallback((serverState: GameState) => {
    setState(serverState);
  }, []);

  const applyServerStateNewHand = useCallback((serverState: GameState) => {
    setState(serverState);
    setIsHandOver(false);
    setCompletedRound(-1);
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
    clearGame,
  };
}
