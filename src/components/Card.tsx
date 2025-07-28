import React from 'react';
import { Card as CardType } from '../types/spades';

const modules = import.meta.glob('../assets/cards/*.png', {
  eager: true,
  as: 'url',
});
const cardImages: Record<string, string> = {};
for (const path in modules) {
  const fileName = path.split('/').pop()!;
  cardImages[fileName] = modules[path];
}

interface CardProps {
  card: CardType;
  onClick?: () => void;
  faceUp?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, onClick, faceUp = true }) => {
  // build the lookup key
  const key = `${card.suit}-${card.rank}.png`;
  // grab the URL (or undefined if missing)
  const src = cardImages[key];

  return (
    <div onClick={onClick} className="card rounded cursor-pointer w-16 h-24 flex items-center justify-center">
      {faceUp && src ? (
        <img src={src} alt={`${card.rank} of ${card.suit}`} className="w-full h-full object-contain" />
      ) : (
        // fallback when faceDown or missing image
        faceUp ? (
          <span className="text-xl">{`${card.rank} of ${card.suit}`}</span>
        ) : (
          <img
            src={cardImages['back-maroon.png']}
            alt="Card back"
            className="w-full h-full object-contain"
          />
        )
      )}
    </div>
  );
};
