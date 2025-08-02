// src/utils/gameLogic.ts
import { PlayerId, Card, GameState, Rank, Suit } from "../types/spades";

/** Constants */
export const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];
export const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];

/** Rank numeric ordering for comparisons */
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

/** Create and shuffle deck */
function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deal hands evenly (13 each) */
function dealHands(deck: Card[]): Record<PlayerId, Card[]> {
  return {
    north: deck.slice(0, 13),
    east: deck.slice(13, 26),
    south: deck.slice(26, 39),
    west: deck.slice(39, 52),
  };
}

/** Initialize a new game state */
export function initializeGame(): GameState {
  const deck = createDeck();
  const hands = dealHands(deck);
  const turn = SEAT_ORDER[Math.floor(Math.random() * 4)]; // random starting player
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

/** Determine legal moves for a given player given current trick */
export function legalMoves(state: GameState, player: PlayerId): Card[] {
  const hand = state.hands[player];
  const trick = state.trick;
  const leadSuit = Object.values(trick).find((c) => c !== null)
    ? (() => {
        const entries = Object.entries(trick) as [PlayerId, Card | null][];
        const lead = entries.find(([, c]) => c !== null);
        return lead && lead[1] ? lead[1].suit : null;
      })()
    : null;

  if (!leadSuit) {
    // no lead yet: any card is legal (ignore spades-breaking nuance for simplicity)
    return [...hand];
  }

  // if player has any card of leadSuit, must follow
  const hasLead = hand.some((c) => c.suit === leadSuit);
  if (hasLead) {
    return hand.filter((c) => c.suit === leadSuit);
  }
  return [...hand];
}

/** Evaluate trick winner, update tricksWon, clear trick, set next turn */
export function evaluateTrick(state: GameState): PlayerId {
  const trickEntries = Object.entries(state.trick) as [PlayerId, Card | null][];
  if (trickEntries.some(([, c]) => c === null)) {
    throw new Error("Trick is incomplete");
  }
  // Determine lead suit (first non-null)
  const leadEntry = trickEntries.find(([, c]) => c !== null);
  const leadSuit = leadEntry && leadEntry[1] ? leadEntry[1].suit : null;

  // Trump is spades
  const trumpPlays = trickEntries
    .filter(([, c]) => c && c.suit === "spades")
    .map(([p, c]) => [p, c] as [PlayerId, Card]);

  const contenders =
    trumpPlays.length > 0
      ? trumpPlays
      : trickEntries
          .filter(([, c]) => c && c.suit === leadSuit)
          .map(([p, c]) => [p, c] as [PlayerId, Card]);

  const winner = contenders.reduce((best, current) => {
    const bestCard = best[1];
    const currCard = current[1];
    return rankValue(currCard.rank) > rankValue(bestCard.rank) ? current : best;
  })[0];

  // award trick
  state.tricksWon[winner] = (state.tricksWon[winner] ?? 0) + 1;

  // clear trick
  state.trick = { north: null, east: null, south: null, west: null };

  // next turn is winner
  state.turn = winner;

  return winner;
}

/** Apply a play (card) by a player, handling finishing the trick if needed */
export function playCard(state: GameState, player: PlayerId, card: Card): void {
  if (state.turn !== player) return; // not player's turn

  // remove card from hand
  const idx = state.hands[player].findIndex(
    (c) => c.suit === card.suit && c.rank === card.rank
  );
  if (idx === -1) return;
  state.hands[player].splice(idx, 1);

  // place into trick
  state.trick[player] = card;

  // advance turn to next seat (if trick not full)
  const trickFilled = Object.values(state.trick).every((c) => c !== null);
  if (trickFilled) {
    evaluateTrick(state);
  } else {
    // find next seat in order
    const currentIdx = SEAT_ORDER.indexOf(player);
    const nextIdx = (currentIdx + 1) % SEAT_ORDER.length;
    state.turn = SEAT_ORDER[nextIdx];
  }
}

/** Final scoring from bids & tricksWon (simple version) */
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
    result[pid] = won < bid ? -bid : bid + (won - bid) * 0.1;
  }
  return result;
}
