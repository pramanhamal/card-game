// src/utils/gameLogic.ts
import type { GameState, PlayerId, Card, Rank } from "../types/spades";

export const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];
const SUITS: Card["suit"][] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rankValue(rank: Rank): number {
  if (typeof rank === "number") return rank;
  switch (rank) {
    case "J":
      return 11;
    case "Q":
      return 12;
    case "K":
      return 13;
    case "A":
      return 14;
    default:
      return 0;
  }
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return shuffle(deck);
}

function dealHands(deck: Card[]): Record<PlayerId, Card[]> {
  return {
    north: deck.slice(0, 13),
    east: deck.slice(13, 26),
    south: deck.slice(26, 39),
    west: deck.slice(39, 52),
  };
}

export function initializeGame(): GameState {
  const deck = createDeck();
  const hands = dealHands(deck);
  const turn = SEAT_ORDER[Math.floor(Math.random() * SEAT_ORDER.length)];
  return {
    deck,
    hands,
    trick: { north: null, east: null, south: null, west: null },
    scores: { north: 0, east: 0, south: 0, west: 0 },
    tricksWon: { north: 0, east: 0, south: 0, west: 0 },
    turn,
    round: 1,
    bids: { north: 0, east: 0, south: 0, west: 0 },
  };
}

export function legalMoves(state: GameState, player: PlayerId): Card[] {
  const hand = state.hands[player];
  const leadSuit =
    Object.entries(state.trick).find(([, c]) => c !== null)?.[1]?.suit || null;

  if (!leadSuit) return [...hand];

  const hasLead = hand.some((c) => c.suit === leadSuit);
  if (hasLead) {
    return hand.filter((c) => c.suit === leadSuit);
  }
  return [...hand];
}

export function determineTrickWinner(
  trick: Record<PlayerId, Card | null>
): PlayerId {
  const entries = Object.entries(trick) as [PlayerId, Card | null][];
  if (entries.some(([, c]) => c === null)) {
    throw new Error("Trick incomplete");
  }

  const leadSuit =
    entries.find(([, c]) => c !== null)?.[1]?.suit || null;

  const trumpPlays: [PlayerId, Card][] = entries
    .filter(([, c]) => c && c.suit === "spades")
    .map(([p, c]) => [p, c as Card]);

  let contenders: [PlayerId, Card][];
  if (trumpPlays.length > 0) {
    contenders = trumpPlays;
  } else if (leadSuit) {
    contenders = entries
      .filter(([, c]) => c && c.suit === leadSuit)
      .map(([p, c]) => [p, c as Card]);
  } else {
    contenders = entries
      .filter(([, c]) => c !== null)
      .map(([p, c]) => [p, c as Card]);
  }

  const winner = contenders.reduce((best, current) => {
    const bestCard = best[1];
    const currCard = current[1];
    return rankValue(currCard.rank) > rankValue(bestCard.rank)
      ? current
      : best;
  })[0];

  return winner;
}

export function playCard(
  state: GameState,
  player: PlayerId,
  card: Card
): void {
  if (state.turn !== player) return;
  const hand = state.hands[player];
  const idx = hand.findIndex(
    (c) => c.suit === card.suit && c.rank === card.rank
  );
  if (idx === -1) return;
  hand.splice(idx, 1);
  state.trick[player] = card;

  const full = Object.values(state.trick).every((c) => c !== null);
  if (full) {
    const winner = determineTrickWinner(state.trick);
    // The server state update will handle incrementing tricksWon and clearing the trick.
    // We just set the turn for client-side prediction.
    state.turn = winner;
  } else {
    const currentIdx = SEAT_ORDER.indexOf(player);
    const nextIdx = (currentIdx + 1) % SEAT_ORDER.length;
    state.turn = SEAT_ORDER[nextIdx];
  }
}

export function calculateScores(
  bids: Record<PlayerId, number>,
  tricksWon: Record<PlayerId, number>
): Record<PlayerId, number> {
  const result: Record<PlayerId, number> = {
    north: 0,
    east: 0,
    south: 0,
    west: 0,
  };
  for (const pid of SEAT_ORDER) {
    const bid = bids[pid];
    const won = tricksWon[pid];
    result[pid] = won < bid ? -bid : bid + (won - bid);
  }
  return result;
}