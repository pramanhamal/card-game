// src/components/Opponent.tsx
import React from 'react';
import backMaroon from '../assets/cards/back-maroon.png';

interface OpponentProps {
  /** Display name (e.g. “Harry”) */
  name: string;
  /** How many cards remain in their hand */
  cardsCount: number;
  /** How many tricks they’ve won so far */
  tricks: number;
  /** Seat on the table */
  position: 'north' | 'west' | 'east';
}

export const Opponent: React.FC<OpponentProps> = ({
  name,
  cardsCount,
  tricks,
  position,
}) => {
  // Positioning classes for each seat
  const posClasses: Record<OpponentProps['position'], string> = {
    north: 'absolute top-4 left-1/2 transform -translate-x-1/2',
    west:  'absolute left-4 top-1/2 transform -translate-y-1/2',
    east:  'absolute right-4 top-1/2 transform -translate-y-1/2',
  };
  const posClass = posClasses[position];

  // Create a little fan of face‑down cards
  const fan = Array.from({ length: cardsCount }).map((_, i) => {
    // Spread each card by a small angle around vertical
    const offset = (i - (cardsCount - 1) / 2) * 6;
    return (
      <img
        key={i}
        src={backMaroon}
        alt="Back of card"
        className="absolute w-12 h-20"
        style={{
          transform: `rotate(${offset}deg) translateY(-10px)`,
          transformOrigin: '50% 100%',
        }}
      />
    );
  });

  return (
    <div className={`${posClass} flex flex-col items-center pointer-events-none`}>
      <div className="relative w-24 h-20">
        {fan}
      </div>
      <div className="mt-2 text-white font-semibold">{name}</div>
      <div className="text-white text-sm">{tricks} tricks</div>
    </div>
  );
};
