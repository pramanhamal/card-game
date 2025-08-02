// src/types/spades.ts
export type PlayerId = "north" | "east" | "south" | "west";

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

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface GameState {
  trick: Record<PlayerId, Card | null>;
  round: number;
  turn: PlayerId | null;
  hands: Record<PlayerId, Card[]>;
  tricksWon: Record<PlayerId, number>;
  bids: Record<PlayerId, number | null>;
  spadesBroken: boolean;
}
