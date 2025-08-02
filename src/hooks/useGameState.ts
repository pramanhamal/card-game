// src/hooks/useGameState.ts
import { useState, useCallback } from "react";
import {
  GameState,
  PlayerId,
  Card,
  GameResult,
} from "../types/spades";
import {
  initializeGame,
  legalMoves,
  playCard as logicPlayCard,
  evaluateTrick,
  calculateScores,
} from "../utils/gameLogic";

/** Simplified version of your hook that allows overriding from server */
export function useGameState(initial?: GameState) {
  const [state, setState] = useState<GameState>(
    initial ?? {
      ...initializeGame(),
    }
  );
  const [history, setHistory] = useState<GameResult[]>([]);
  const [isHandOver, setIsHandOver] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

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
    setState({ ...initializeGame() });
    setIsHandOver(false);
    setIsGameOver(false);
  }, []);

  const placeBid = useCallback((player: PlayerId, bid: number) => {
    setState((prev) => ({
      ...prev,
      bids: { ...prev.bids, [player]: bid },
    }));
  }, []);

  const playCard = useCallback((player: PlayerId, card: Card) => {
    setState((prev) => {
      const copy = structuredClone(prev);
      logicPlayCard(copy, player, card);
      // if trick just finished, maybe evaluate scores
      return copy;
    });
  }, []);

  const evaluateAndAdvanceTrick = useCallback(() => {
    setState((prev) => {
      const copy = structuredClone(prev);
      evaluateTrick(copy);
      // if hand over (all cards gone), mark
      const isHandDone = Object.values(copy.hands).every((h) => h.length === 0);
      if (isHandDone) {
        setIsHandOver(true);
        const scores = calculateScores(copy.bids, copy.tricksWon);
        // push to history
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
  }, [totalScores]);

  const resetGame = useCallback(() => {
    startGame();
    setHistory([]);
  }, [startGame]);

  /** Replace internal state from authoritative server state */
  const applyServerState = useCallback((serverState: GameState) => {
    setState(serverState);
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
    applyServerState,
  };
}
