// src/utils/gameLogic.ts
import {
  Card,
  GameState,
  PlayerId,
} from "../types/spades";

/**
 * Convert a string Rank ('2'..'10','J','Q','K','A') into a numeric value for comparison.
 */
function rankValue(rank: Card["rank"]): number {
  if (rank === "J") return 11;
  if (rank === "Q") return 12;
  if (rank === "K") return 13;
  if (rank === "A") return 14;
  // '2'..'10'
  return parseInt(rank, 10);
}

type Suit = Card["suit"];

/**
 * Determine the winner of the current trick under Spades rules.
 */
export function determineTrickWinner(
  trick: Record<PlayerId, Card | null>
): PlayerId | null {
  const playedEntries = (Object.entries(trick) as [PlayerId, Card | null][])
    .filter(([, card]) => card !== null) as [PlayerId, Card][];

  if (playedEntries.length === 0) return null;

  // Lead suit is suit of first played card
  const leadSuit: Suit = playedEntries[0][1].suit;

  // Check for any spades
  const spadesPlayed = playedEntries.filter(([, card]) => card.suit === "spades");

  let winnerEntry: [PlayerId, Card];

  if (spadesPlayed.length > 0) {
    // Highest spade wins
    winnerEntry = spadesPlayed.reduce((best, curr) => {
      return rankValue(curr[1].rank) > rankValue(best[1].rank) ? curr : best;
    });
  } else {
    const leadSuitPlays = playedEntries.filter(([, card]) => card.suit === leadSuit);
    if (leadSuitPlays.length === 0) {
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
 * Returns legal plays for the given player according to Spades rules.
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

  // Determine lead suit if any cards on trick
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
    return hand; // cannot follow suit
  }

  // Leading: can't lead spades unless broken or only spades in hand
  const nonSpades = hand.filter((c) => c.suit !== "spades");
  if (nonSpades.length === 0) {
    return hand; // only spades
  }
  if (!spadesBroken) {
    return nonSpades; // must lead non-spade
  }
  return hand; // spades broken: anything allowed
}
