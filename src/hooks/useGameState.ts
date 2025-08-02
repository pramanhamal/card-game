// src/utils/gameLogic.ts
import {
  Card,
  GameState,
  PlayerId,
  Rank,
  Suit,
} from "../types/spades";

/**
 * Helper to get numeric value of a rank.
 */
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
      return 0; // unreachable
  }
}

/**
 * Determine the winner of the current trick under Spades rules.
 * @param trick Mapping of seat -> card (null if not yet played)
 * @returns Winning PlayerId or null if no cards played
 */
export function determineTrickWinner(
  trick: Record<PlayerId, Card | null>
): PlayerId | null {
  // Entries with actual cards played
  const playedEntries = (Object.entries(trick) as [PlayerId, Card | null][])
    .filter(([, card]) => card !== null) as [PlayerId, Card][];

  if (playedEntries.length === 0) return null;

  // Lead suit is the suit of the first played card in iteration order
  const leadSuit: Suit = playedEntries[0][1].suit;

  // Check if any spades were played
  const spadesPlayed = playedEntries.filter(([, card]) => card.suit === "spades");

  let winnerEntry: [PlayerId, Card];

  if (spadesPlayed.length > 0) {
    // Highest spade wins
    winnerEntry = spadesPlayed.reduce((best, curr) => {
      return rankValue(curr[1].rank) > rankValue(best[1].rank) ? curr : best;
    });
  } else {
    // Highest card of lead suit among those who followed
    const leadSuitPlays = playedEntries.filter(([, card]) => card.suit === leadSuit);
    if (leadSuitPlays.length === 0) {
      // Fallback (shouldn't happen): take first played
      winnerEntry = playedEntries[0];
    } else {
      winnerEntry = leadSuitPlays.reduce((best, curr) => {
        return rankValue(curr[1].rank) > rankValue(best[1].rank) ? curr : best;
      });
    }
  }

  return winnerEntry[0];
}

/**
 * Returns legal cards the player can play given the current state.
 * Enforces following suit and spades-breaking rules.
 * 
 * Note: `spadesBroken` is not part of the canonical GameState type, so we
 * look for it optionally on the passed state object.
 */
export function legalMoves(
  state: Partial<GameState> | undefined & { spadesBroken?: boolean },
  player: PlayerId
): Card[] {
  if (!state) return [];

  const hands: Record<PlayerId, Card[]> = state.hands ?? {
    north: [],
    east: [],
    south: [],
    west: [],
  };
  const trick: Record<PlayerId, Card | null> = state.trick ?? {
    north: null,
    east: null,
    south: null,
    west: null,
  };
  const spadesBroken: boolean = !!(state as any).spadesBroken;

  const hand = hands[player] ?? [];

  // Lead suit if trick has any cards
  const currentTrickCards = Object.values(trick).filter(
    (c): c is Card => c !== null
  );
  const leadSuit: Suit | null =
    currentTrickCards.length > 0 ? currentTrickCards[0].suit : null;

  if (leadSuit) {
    const hasLead = hand.some((c) => c.suit === leadSuit);
    if (hasLead) {
      return hand.filter((c) => c.suit === leadSuit);
    }
    // Can't follow suit; can play anything
    return hand;
  }

  // Leading: can't lead spades unless broken or only spades in hand
  const nonSpades = hand.filter((c) => c.suit !== "spades");
  if (nonSpades.length === 0) {
    // Only spades, allowed
    return hand;
  }
  if (!spadesBroken) {
    // Must lead non-spade
    return nonSpades;
  }
  // Spades broken: anything goes
  return hand;
}
