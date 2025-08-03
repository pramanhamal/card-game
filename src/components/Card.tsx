import React from "react";
import type { Card as CardType } from "../types/spades";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  card: CardType;
  faceUp?: boolean;
}

export const Card: React.FC<Props> = ({
  card,
  faceUp = false,
  className = "",
  ...rest
}) => {
  return (
    <div
      {...rest}
      className={`w-16 h-24 rounded shadow flex flex-col justify-center items-center font-bold text-black bg-white relative ${className}`}
      style={{ userSelect: "none" }}
    >
      {faceUp ? (
        <>
          <div className="text-lg">{card.rank}</div>
          <div className="text-xs capitalize">{card.suit}</div>
        </>
      ) : (
        <div className="text-2xl text-gray-400">🂠</div>
      )}
    </div>
  );
};
