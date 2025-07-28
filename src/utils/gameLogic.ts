// src/utils/gameLogic.ts
import { PlayerId, Card, GameState, Rank, Suit } from '../types/spades';

/** All valid suits and ranks, typed to the exact unions in your types */
export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10,
  'J', 'Q', 'K', 'A'
];

/** Map a Rank to a numeric value for comparison */
function rankValue(rank: Rank): number {
  if (typeof rank === 'number') return rank;
  switch (rank) {
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    case 'A': return 14;
  }
}

/** Build a full 52‑card deck */
export function createDeck(): Card[] {
  return SUITS.flatMap(suit =>
    RANKS.map(rank => ({ suit, rank }))
  );
}

/** Fisher–Yates shuffle */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deal evenly into four hands */
export function deal(deck: Card[]): Record<PlayerId, Card[]> {
  const hands: Record<PlayerId, Card[]> = {
    north: [], east: [], south: [], west: []
  };
  deck.forEach((card, idx) => {
    const player: PlayerId = (['north','east','south','west'] as PlayerId[])[idx % 4];
    hands[player].push(card);
  });
  return hands;
}

/** Initialize game state */
export function initializeGame(first: PlayerId = 'north'): GameState {
  const deck = shuffle(createDeck());
  return {
    deck,
    hands:     deal(deck),
    trick:     { north: null, east: null, south: null, west: null },
    turn:      first,
    round:     1,
    bids:      { north: 0, east: 0, south: 0, west: 0 },
    tricksWon: { north: 0, east: 0, south: 0, west: 0 },
    scores:    { north: 0, east: 0, south: 0, west: 0 },
  };
}

/** Play a card: remove from hand and add to current trick */
export function playCard(
  state: GameState,
  player: PlayerId,
  card: Card
): GameState {
  const hands = { ...state.hands };
  hands[player] = hands[player].filter(
    c => !(c.suit === card.suit && c.rank === card.rank)
  );
  return { ...state, hands, trick: { ...state.trick, [player]: card } };
}

/** Determine trick winner given all 4 cards played */
export function determineTrickWinner(
  trick: Record<PlayerId, Card | null>
): PlayerId {
  const entries = Object.entries(trick) as [PlayerId, Card | null][];
  if (entries.length !== 4 || entries.some(([,c])=>c===null)) {
    throw new Error('Need exactly 4 cards to determine trick winner');
  }
  const plays = entries as [PlayerId, Card][];
  const leadSuit = plays[0][1].suit;
  const trumpPlays = plays.filter(([, c]) => c.suit === 'spades');
  const contenders = trumpPlays.length > 0
    ? trumpPlays
    : plays.filter(([, c]) => c.suit === leadSuit);

  const [winner] = contenders.reduce((best, current) =>
    rankValue(current[1].rank) > rankValue(best[1].rank) ? current : best
  );
  return winner;
}

/** Evaluate a full trick: update tricksWon, reset trick, advance turn & round */
export function evaluateTrick(state: GameState): GameState {
  const cardsPlayed = Object.values(state.trick).filter(c=>c!==null).length;
  if (cardsPlayed < 4) return state;
  const winner = determineTrickWinner(state.trick);
  const tricksWon = { ...state.tricksWon, [winner]: state.tricksWon[winner] + 1 };
  return {
    ...state,
    trick:     { north: null, east: null, south: null, west: null },
    turn:      winner,
    round:     state.round + 1,
    tricksWon,
  };
}

/**
 * Returns an array of legally playable cards based on the current game state.
 */
export function legalMoves(gs: GameState, player: PlayerId): Card[] {
  const hand = gs.hands[player];
  const entries = Object.entries(gs.trick) as [PlayerId, Card | null][];
  const playedCards = entries.filter(([, card]) => card !== null);

  // Case 1: Player is leading the trick.
  if (playedCards.length === 0) {
    return hand;
  }

  // Case 2: Player is following.
  const leadSuit = (playedCards[0][1] as Card).suit;
  const cardsInSuit = hand.filter(c => c.suit === leadSuit);

  if (cardsInSuit.length > 0) {
    // Player can follow suit. They must play a higher card of that suit if possible.
    const playedOfSuit = playedCards
      .map(([, card]) => card as Card)
      .filter(c => c.suit === leadSuit);
    const highestRankPlayed = Math.max(0, ...playedOfSuit.map(c => rankValue(c.rank)));

    const strongerCards = cardsInSuit.filter(c => rankValue(c.rank) > highestRankPlayed);

    if (strongerCards.length > 0) {
      return strongerCards;
    } else {
      return cardsInSuit;
    }
  } else {
    // Player cannot follow suit. They must play a spade if they have one.
    const spadesInHand = hand.filter(c => c.suit === 'spades');

    if (spadesInHand.length > 0) {
      return spadesInHand;
    } else {
      // If the player has no cards of the lead suit AND no spades,
      // they can play any other card.
      return hand;
    }
  }
}

/** Final scoring from bids & tricksWon */
export function calculateScores(
  bids: Record<PlayerId, number>,
  tricksWon: Record<PlayerId, number>
): Record<PlayerId, number> {
  const result: Record<PlayerId, number> = { north:0,east:0,south:0,west:0 };
  for (const pid of ['north','east','south','west'] as PlayerId[]) {
    const bid = bids[pid], won = tricksWon[pid];
    result[pid] = won < bid ? -bid : bid + (won - bid) * 0.1;
  }
  return result;
}