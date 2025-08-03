// src/components/Hand.tsx
import React from "react";
import type { PlayerId, Card } from "../types/spades";
import { Card as CardComp } from "./Card";

interface HandProps {
  player: PlayerId;
  cards: Card[];
  onPlay: (player: PlayerId, card: Card) => void;
  currentPlayer: PlayerId | null;
  legal?: Card[]; // optional list of legal moves for this player
}

const keyFor = (card: Card, idx: number) => `${card.suit}-${card.rank}-${idx}`;

export const Hand: React.FC<HandProps> = ({
  player,
  cards,
  onPlay,
  currentPlayer,
  legal,
}) => {
  const isActive = currentPlayer === player;
  const legalSet = legal
    ? new Set(legal.map((c) => `${c.suit}-${c.rank}`))
    : null;

  return (
    <div className="flex gap-2">
      {cards.map((c, i) => {
        const cardKey = keyFor(c, i);
        const isLegal = !legalSet || legalSet.has(`${c.suit}-${c.rank}`);
        const canPlay = isActive && isLegal;
        return (
          <div
            key={cardKey}
            className={`relative transition-transform ${
              canPlay ? "cursor-pointer scale-105" : "opacity-60"
            }`}
            onClick={() => {
              if (canPlay) onPlay(player, c);
            }}
          >
            <CardComp card={c} faceUp />
          </div>
        );
      })}
    </div>
  );
};
