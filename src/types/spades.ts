// src/types/spades.ts

// canonical identifiers for seats
export type PlayerId = "north" | "east" | "south" | "west";

// Card suit and rank
export type Suit = "clubs" | "diamonds" | "hearts" | "spades";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

// A playing card
export interface Card {
  suit: Suit;
  rank: Rank;
}

// Core game state
export interface GameState {
  trick: Record<PlayerId, Card | null>;
  round: number;
  turn: PlayerId | null;
  hands: Record<PlayerId, Card[]>;
  tricksWon: Record<PlayerId, number>;
  bids: Record<PlayerId, number | null>;
  spadesBroken: boolean;
}

// Result after a full hand (for history/dashboard)
export interface GameResult {
  handNumber: number;
  bids: Record<PlayerId, number | null>;
  tricksWon: Record<PlayerId, number>;
  scores: Record<PlayerId, number>; // per player score for that hand
  totalScores: Record<PlayerId, number>; // cumulative up to that hand
  winner: PlayerId | null; // who won the hand (could be based on highest score)
}
