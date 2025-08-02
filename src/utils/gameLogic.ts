// src/utils/gameLogic.ts
import {
  GameState,
  PlayerId,
  Card,
  Rank,
  GameResult,
} from "../types/spades";

/** Rank ordering from low to high */
export const rankOrder: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

export function rankValue(r: Rank): number {
  return rankOrder.indexOf(r);
}

const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];

/** Determine the trick winner given the current trick (canonical seats) */
export function determineTrickWinner(
  trick: Record<PlayerId, Card | null>
): PlayerId | null {
  const played = Object.entries(trick).filter(
    ([, card]) => card !== null
  ) as [PlayerId, Card][];
  if (played.length === 0) return null;

  const leadSuit = played[0][1].suit;

  // Any spades played?
  const spadesPlayed = played.filter(([, card]) => card.suit === "spades");
  let winner: [PlayerId, Card];

  if (spadesPlayed.length > 0) {
    winner = spadesPlayed.reduce((best, curr) =>
      rankValue(curr[1].rank) > rankValue(best[1].rank) ? curr : best
    );
  } else {
    const leadSuitPlays = played.filter(([, card]) => card.suit === leadSuit);
    if (leadSuitPlays.length > 0) {
      winner = leadSuitPlays.reduce((best, curr) =>
        rankValue(curr[1].rank) > rankValue(best[1].rank) ? curr : best
      );
    } else {
      winner = played[0];
    }
  }

  return winner[0];
}

/**
 * legalMoves enforces:
 *  - follow suit if possible
 *  - cannot lead spades until broken unless only spades left
 */
export function legalMoves(state: Partial<GameState>, player: PlayerId): Card[] {
  const hand = state.hands?.[player] ?? [];
  if (!hand || hand.length === 0) return [];

  const trick = state.trick ?? {
    north: null,
    east: null,
    south: null,
    west: null,
  };
  const spadesBroken = state.spadesBroken ?? false;

  // If leading
  const playedThisTrick = Object.values(trick).filter((c) => c !== null);
  if (playedThisTrick.length === 0) {
    // Can't lead spades if not broken, unless all cards are spades
    const hasNonSpade = hand.some((c) => c.suit !== "spades");
    if (!spadesBroken && hasNonSpade) {
      return hand.filter((c) => c.suit !== "spades");
    }
    return hand;
  }

  // Not leading: must follow suit if possible
  const leadSeat = Object.entries(trick).find(([, c]) => c !== null);
  const leadSuit = leadSeat ? leadSeat[1]!.suit : null;
  if (leadSuit) {
    const hasLead = hand.some((c) => c.suit === leadSuit);
    if (hasLead) {
      return hand.filter((c) => c.suit === leadSuit);
    }
  }

  // Otherwise any card
  return hand;
}

/** Build and shuffle a standard 52-card deck */
export function createDeck(): Card[] {
  const suits: Array<"clubs" | "diamonds" | "hearts" | "spades"> = [
    "clubs",
    "diamonds",
    "hearts",
    "spades",
  ];
  const ranks: Rank[] = rankOrder;

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/** Fisher-Yates shuffle */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deal a new hand, return hands per seat and starting turn */
export function dealNewHand(): {
  hands: Record<PlayerId, Card[]>;
  startingSeat: PlayerId;
} {
  const deck = shuffle(createDeck());
  const hands: Record<PlayerId, Card[]> = {
    north: deck.slice(0, 13),
    east: deck.slice(13, 26),
    south: deck.slice(26, 39),
    west: deck.slice(39, 52),
  };

  // Random starting seat
  const idx = Math.floor(Math.random() * 4);
  const startingSeat: PlayerId = SEAT_ORDER[idx];
  return { hands, startingSeat };
}

/** Simple scoring: if tricks >= bid: 10*bid + (tricks - bid), else -10*bid */
export function computeHandScores(
  bids: Record<PlayerId, number | null>,
  tricksWon: Record<PlayerId, number>
): Record<PlayerId, number> {
  const scores: Record<PlayerId, number> = {
    north: 0,
    east: 0,
    south: 0,
    west: 0,
  };
  (["north", "east", "south", "west"] as PlayerId[]).forEach((p) => {
    const bid = bids[p] ?? 0;
    const tricks = tricksWon[p] ?? 0;
    if (tricks >= bid) {
      scores[p] = bid * 10 + (tricks - bid);
    } else {
      scores[p] = -bid * 10;
    }
  });
  return scores;
}
