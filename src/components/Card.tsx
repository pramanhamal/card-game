import React from "react";
import type { Card as CardType } from "../types/spades";

interface Props {
  card: CardType;
  faceUp?: boolean;
}

export const Card: React.FC<Props> = ({ card, faceUp = false }) => {
  return (
    <div className="w-16 h-24 bg-white rounded shadow flex flex-col justify-center items-center text-black font-bold">
      {faceUp ? (
        <>
          <div>{card.rank}</div>
          <div className="text-xs">{card.suit}</div>
        </>
      ) : (
        <div className="text-gray-400">🂠</div>
      )}
    </div>
  );
};
