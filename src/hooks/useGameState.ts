// src/hooks/useGameState.ts
import { useState, useCallback, useMemo } from "react";
import {
  GameState,
  PlayerId,
  Card,
  GameResult,
} from "../types/spades";
import {
  dealNewHand,
  determineTrickWinner,
  legalMoves,
  computeHandScores,
} from "../utils/gameLogic";

const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];

function initialEmptyGameState(): GameState {
  return {
    trick: { north: null, east: null, south: null, west: null },
    round: 1,
    turn: null,
    hands: { north: [], east: [], south: [], west: [] },
    tricksWon: { north: 0, east: 0, south: 0, west: 0 },
    bids: { north: null, east: null, south: null, west: null },
    spadesBroken: false,
  };
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    const gs = initialEmptyGameState();
    return gs;
  });

  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [totalScores, setTotalScores] = useState<Record<PlayerId, number>>({
    north: 0,
    east: 0,
    south: 0,
    west: 0,
  });

  const isHandOver = useMemo(() => {
    // Hand over when all hands are empty
    return Object.values(state.hands).every((h) => h.length === 0);
  }, [state.hands]);

  const isGameOver = useMemo(() => {
    // Example: stop after 5 hands (customize)
    return gameHistory.length >= 5;
  }, [gameHistory]);

  const startGame = useCallback(() => {
    const { hands, startingSeat } = dealNewHand();
    setState((prev) => ({
      ...prev,
      hands,
      turn: startingSeat,
      round: prev.round + 1,
      trick: { north: null, east: null, south: null, west: null },
      tricksWon: { north: 0, east: 0, south: 0, west: 0 },
      bids: { north: null, east: null, south: null, west: null },
      spadesBroken: false,
    }));
  }, []);

  const placeBid = useCallback((player: PlayerId, bid: number) => {
    setState((prev) => ({
      ...prev,
      bids: {
        ...prev.bids,
        [player]: bid,
      },
    }));
  }, []);

  const playCard = useCallback((player: PlayerId, card: Card) => {
    setState((prev) => {
      if (prev.turn !== player) return prev; // not their turn
      const legal = legalMoves(prev, player);
      const isLegal = legal.some(
        (c) => c.suit === card.suit && c.rank === card.rank
      );
      if (!isLegal) return prev;

      // Remove card from hand
      const newHands = {
        ...prev.hands,
        [player]: prev.hands[player].filter(
          (c) => !(c.suit === card.suit && c.rank === card.rank)
        ),
      };

      // Update trick
      const newTrick = {
        ...prev.trick,
        [player]: card,
      };

      // If leading and played spades, break spades
      const spadesBroken =
        prev.spadesBroken ||
        (Object.values(prev.trick).every((c) => c === null) &&
          card.suit === "spades");

      // Determine next turn or finish trick
      let nextTurn = prev.turn;
      let newTricksWon = { ...prev.tricksWon };
      let clearedTrick: Record<PlayerId, Card | null> = newTrick;

      const filled =
        Object.values(newTrick).filter((c) => c !== null).length === 4;
      if (filled) {
        const winner = determineTrickWinner(newTrick);
        if (winner) {
          newTricksWon[winner] = (newTricksWon[winner] || 0) + 1;
          nextTurn = winner;
        }
        clearedTrick = { north: null, east: null, south: null, west: null };
      } else {
        // rotate to next seat
        const currentIndex = SEAT_ORDER.indexOf(player);
        nextTurn = SEAT_ORDER[(currentIndex + 1) % 4];
      }

      return {
        ...prev,
        hands: newHands,
        trick: clearedTrick,
        turn: nextTurn,
        tricksWon: newTricksWon,
        spadesBroken,
      };
    });
  }, []);

  const evaluateAndAdvanceTrick = useCallback(() => {
    // This is mostly handled inside playCard; placeholder if you want external trigger.
  }, []);

  const resetGame = useCallback(() => {
    setState(initialEmptyGameState());
    setGameHistory([]);
    setTotalScores({ north: 0, east: 0, south: 0, west: 0 });
  }, []);

  // Whenever a hand finishes, compute scores, push to history
  useMemo(() => {
    if (isHandOver) {
      const scores = computeHandScores(state.bids, state.tricksWon);
      const winner = Object.entries(scores).reduce<[PlayerId, number]>(
        (best, curr) => (curr[1] > best[1] ? (curr as any) : best),
        ["north", -Infinity]
      )[0];

      const newTotal: Record<PlayerId, number> = { ...totalScores };
      (["north", "east", "south", "west"] as PlayerId[]).forEach((p) => {
        newTotal[p] = (newTotal[p] || 0) + scores[p];
      });

      const result: GameResult = {
        handNumber: gameHistory.length + 1,
        bids: state.bids,
        tricksWon: state.tricksWon,
        scores,
        totalScores: newTotal,
        winner,
      };

      // Avoid double-pushing if already recorded
      if (
        !gameHistory.find((h) => h.handNumber === result.handNumber)
      ) {
        setGameHistory((prev) => [...prev, result]);
        setTotalScores(newTotal);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHandOver]);

  return {
    state,
    isHandOver,
    isGameOver,
    gameHistory,
    totalScores,
    startGame,
    placeBid,
    playCard,
    evaluateAndAdvanceTrick,
    resetGame,
  };
}
