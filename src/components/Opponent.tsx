// src/components/Opponent.tsx
import React from "react";
import backMaroon from "../assets/cards/back-maroon.png";

export type OpponentPosition = "north" | "west" | "east";

interface OpponentProps {
  /** Display name (e.g. “Harry”) */
  name: string;
  /** How many cards remain in their hand */
  cardsCount: number;
  /** How many tricks they’ve won so far */
  tricks: number;
  /** Seat on the table (only opponents) */
  position: OpponentPosition;
  /** Optional flag for AI/bot */
  isAI?: boolean;
}

export const Opponent: React.FC<OpponentProps> = ({
  name,
  cardsCount,
  tricks,
  position,
  isAI = false,
}) => {
  // Positioning classes for each seat
  const posClasses: Record<OpponentPosition, string> = {
    north: "absolute top-4 left-1/2 transform -translate-x-1/2",
    west: "absolute left-4 top-1/2 transform -translate-y-1/2",
    east: "absolute right-4 top-1/2 transform -translate-y-1/2",
  };
  const posClass = posClasses[position];

  // Cap fan size to something reasonable visually, but allow showing full if needed.
  const displayCount = Math.min(cardsCount, 13);
  // Create a little fan of face-down cards
  const fan = Array.from({ length: displayCount }).map((_, i) => {
    // Spread each card by a small angle around vertical
    const offset = (i - (displayCount - 1) / 2) * 6; // degrees
    return (
      <img
        key={i}
        src={backMaroon}
        alt="Back of card"
        className="absolute w-12 h-20 rounded shadow"
        style={{
          transform: `rotate(${offset}deg) translateY(-10px)`,
          transformOrigin: "50% 100%",
        }}
        draggable={false}
      />
    );
  });

  return (
    <div
      className={`${posClass} flex flex-col items-center pointer-events-none`}
      aria-label={`${name} opponent area`}
    >
      <div className="relative w-28 h-24">
        {fan}
        {isAI && (
          <div className="absolute bottom-0 right-0 bg-yellow-300 text-black text-xs px-2 rounded">
            Bot
          </div>
        )}
      </div>
      <div className="mt-2 text-white font-semibold">{name}</div>
      <div className="text-white text-sm">{tricks} tricks</div>
    </div>
  );
};
