// src/hooks/useGameState.ts
import { useState, useEffect } from 'react';
import { GameState, PlayerId, Card, GameResult } from '../types/spades';
import {
  initializeGame as initGame,
  playCard as logicPlay,
  evaluateTrick,
  legalMoves,
  calculateScores
} from '../utils/gameLogic';

/** Maps a card rank to a numeric value for comparison */
const rankValue = (r: Card['rank']): number =>
  typeof r === 'number' ? r : r === 'J' ? 11 : r === 'Q' ? 12 : r === 'K' ? 13 : 14;

/**
 * A smarter AI logic function to select the best card to play from a list of legal moves.
 */
function chooseBestCard(state: GameState, legalMoves: Card[]): Card {
    if (legalMoves.length === 1) {
        return legalMoves[0];
    }

    const { trick } = state;
    const playedCards = Object.values(trick).filter((c): c is Card => c !== null);

    // If leading, play a random legal card (can be improved later).
    if (playedCards.length === 0) {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    // Determine the current winning card on the table
    const leadSuit = playedCards[0].suit;
    const spadesOnTable = playedCards.filter(c => c.suit === 'spades');
    let winningCardOnTable: Card | null = null;

    if (spadesOnTable.length > 0) {
        winningCardOnTable = spadesOnTable.reduce((best, current) => (rankValue(current.rank) > rankValue(best.rank) ? current : best));
    } else {
        const leadSuitCardsOnTable = playedCards.filter(c => c.suit === leadSuit);
        if (leadSuitCardsOnTable.length > 0) {
            winningCardOnTable = leadSuitCardsOnTable.reduce((best, current) => (rankValue(current.rank) > rankValue(best.rank) ? current : best));
        }
    }

    // 1. Check if any of our legal moves can win the trick.
    const winningMoves = legalMoves.filter(myCard => {
        if (!winningCardOnTable) return true; // Should not happen if not leading, but a safe check
        if (winningCardOnTable.suit === 'spades') {
            return myCard.suit === 'spades' && rankValue(myCard.rank) > rankValue(winningCardOnTable.rank);
        } else {
            if (myCard.suit === 'spades') return true;
            if (myCard.suit === leadSuit) {
                return rankValue(myCard.rank) > rankValue(winningCardOnTable.rank);
            }
        }
        return false;
    });

    if (winningMoves.length > 0) {
        // If we can win, play the most efficient (lowest) winning card.
        winningMoves.sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
        return winningMoves[0];
    }

    // 2. We cannot win. We must discard our least valuable card.
    // Prioritize discarding non-spades.
    const nonSpadeLosingMoves = legalMoves.filter(c => c.suit !== 'spades');
    if (nonSpadeLosingMoves.length > 0) {
        // Play the lowest-ranking non-spade card.
        nonSpadeLosingMoves.sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
        return nonSpadeLosingMoves[0];
    }

    // 3. If we must play a spade but cannot win, play the lowest spade to save valuable ones.
    legalMoves.sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    return legalMoves[0];
}

/** Simple AI bid estimator based on high cards */
function estimateBid(hand: Card[]): number {
  const calculatedBid = hand.reduce((count, { suit, rank }) => {
    const v = rankValue(rank);
    // count high spades (J or above) and high non‑spades (K or above)
    if (suit === 'spades') {
      return count + (v >= 11 ? 1 : 0);
    } else {
      return count + (v >= 13 ? 1 : 0);
    }
  }, 0);

  // Ensure the AI never bids zero.
  return Math.max(1, calculatedBid);
}

export function useGameState() {
  const [state, setState] = useState<GameState>(initGame());
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [totalScores, setTotalScores] = useState<Record<PlayerId, number>>({ north: 0, east: 0, south: 0, west: 0 });
  const [gameId, setGameId] = useState(1);
  const [isHandOver, setIsHandOver] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [startingPlayer, setStartingPlayer] = useState<PlayerId>('south');
  const [isBiddingPhase, setIsBiddingPhase] = useState(true); // New state for bidding phase

  const seatingOrder: PlayerId[] = ['north', 'east', 'south', 'west'];

  function placeBid(player: PlayerId, bid: number) {
    setState(prev => ({ ...prev, bids: { ...prev.bids, [player]: bid } }));
    // When the human player ('south') bids, the bidding phase is over.
    if (player === 'south') {
      setIsBiddingPhase(false);
    }
    setIsHandOver(false);
  }

  function playCard(player: PlayerId, card: Card) {
    setState(prev => {
      if (prev.turn !== player || prev.trick[player] !== null) return prev;
      const afterPlay = logicPlay(prev, player, card);
      const nextIdx = (seatingOrder.indexOf(player) + 1) % 4;
      const nextPlayer = seatingOrder[nextIdx];
      return { ...afterPlay, turn: nextPlayer };
    });
  }

  function evaluateAndAdvanceTrick() {
    setState(prev => evaluateTrick(prev));
  }

  useEffect(() => {
    // If we are in the bidding phase, do not proceed with game logic.
    if (isBiddingPhase) {
      return;
    }

    const { trick, turn, round, bids, tricksWon, hands } = state;
    const playedCount = Object.values(trick).filter(c => c !== null).length;

    if (round > 13 && !isHandOver) {
      const handScores = calculateScores(bids, tricksWon);
      const newTotalScores = { ...totalScores };
      for (const p in handScores) {
        newTotalScores[p as PlayerId] += handScores[p as PlayerId];
      }
      setTotalScores(newTotalScores);

      const result: GameResult = { gameId, scores: handScores, bids, tricksWon, totalScores: newTotalScores };
      setGameHistory(prev => [result, ...prev.slice(0, 4)]);

      const currentStarterIndex = seatingOrder.indexOf(startingPlayer);
      const nextStarter = seatingOrder[(currentStarterIndex + 1) % 4];
      setStartingPlayer(nextStarter);
      
      if (gameId >= 5) {
        setIsGameOver(true);
      } else {
        setGameId(prev => prev + 1);
        setIsHandOver(true);
      }
      return;
    }

    if (round === 13 && playedCount < 4) {
        const lastCard = hands[turn][0];
        if(lastCard) {
            setTimeout(() => playCard(turn, lastCard), 500);
        }
        return;
    }

    if (playedCount < 4 && turn !== 'south') {
      const moves = legalMoves(state, turn);
      if (moves.length > 0) {
        const randomDelay = Math.random() * 1000 + 1000;
        const timer = setTimeout(() => {
          const choice = chooseBestCard(state, moves);
          playCard(turn, choice);
        }, randomDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [state, gameId, isHandOver, totalScores, startingPlayer, isBiddingPhase]);

  function startGame() {
    const gs = initGame(startingPlayer);
    const aiBids = {
      north: estimateBid(gs.hands.north), east: estimateBid(gs.hands.east), west: estimateBid(gs.hands.west),
    };
    gs.bids = { ...aiBids, south: 0 };
    setState(gs);
    setIsHandOver(false);
    setIsBiddingPhase(true); // Reset bidding phase for new game
  }
  
  function resetGame() {
    setGameHistory([]);
    setTotalScores({ north: 0, east: 0, south: 0, west: 0 });
    setGameId(1);
    setIsGameOver(false);
    setStartingPlayer('south');
    startGame();
  }

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