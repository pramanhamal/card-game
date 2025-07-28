import React from 'react';
import { Card as CardType, PlayerId } from '../types/spades';
import { Card } from './Card';

interface HandProps {
  cards: CardType[];
  onPlay: (player: PlayerId, card: CardType) => void;
  player: PlayerId;
  currentPlayer: PlayerId;
}

export const Hand: React.FC<HandProps> = ({ cards, onPlay, player, currentPlayer }) => (
  <div className="hand flex space-x-2">
    {cards.map((card, idx) => (
      <Card
        key={idx}
        card={card}
        faceUp={player === currentPlayer}
        onClick={player === currentPlayer ? () => onPlay(player, card) : undefined}
      />
    ))}
  </div>
);