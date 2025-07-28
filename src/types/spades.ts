export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 2|3|4|5|6|7|8|9|10|'J'|'Q'|'K'|'A';
export interface Card { suit: Suit; rank: Rank; }
export type PlayerId = 'north' | 'east' | 'south' | 'west';

export interface GameResult {
  gameId: number;
  scores: Record<PlayerId, number>;
  bids: Record<PlayerId, number>;
  tricksWon: Record<PlayerId, number>;
  totalScores: Record<PlayerId, number>; // Added total scores snapshot
}

export interface GameState {
  deck:       Card[];
  hands:      Record<PlayerId, Card[]>;
  trick:      Record<PlayerId, Card | null>;
  scores:     Record<PlayerId, number>;
  tricksWon:  Record<PlayerId, number>;
  turn:       PlayerId;
  round:      number;
  bids:       Record<PlayerId, number>;
}