// src/types/spades.ts

export type PlayerId = "north" | "east" | "south" | "west";

export type Rank = number | "J" | "Q" | "K" | "A";

export interface Card {
  suit: "clubs" | "diamonds" | "hearts" | "spades";
  rank: Rank;
}

export interface GameState {
  trick: Record<PlayerId, Card | null>;
  round: number;
  turn: PlayerId;
  hands: Record<PlayerId, Card[]>;
  tricksWon: Record<PlayerId, number>;
  bids: Record<PlayerId, number | null>; // now nullable
  scores: Record<PlayerId, number>;
  deck: Card[];
}
