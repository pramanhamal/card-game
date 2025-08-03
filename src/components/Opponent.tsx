import React from "react";

interface OpponentProps {
  position: "north" | "east" | "west" | "south";
  name: string;
  cardsCount: number;
  tricks: number;
  isAI?: boolean;
}

export const Opponent: React.FC<OpponentProps> = ({
  position,
  name,
  cardsCount,
  tricks,
  isAI = false,
}) => {
  return (
    <div
      className={`absolute text-white flex flex-col items-center ${
        position === "north"
          ? "top-4 left-1/2 transform -translate-x-1/2"
          : position === "west"
          ? "left-4 top-1/2 transform -translate-y-1/2"
          : position === "east"
          ? "right-4 top-1/2 transform -translate-y-1/2"
          : ""
      }`}
    >
      <div className="flex items-center gap-1">
        <div className="font-semibold">{name}</div>
        {isAI && (
          <div className="text-xs bg-yellow-400 text-black px-2 rounded">Bot</div>
        )}
      </div>
      <div className="text-sm">Cards: {cardsCount}</div>
      <div className="text-sm">Tricks: {tricks}</div>
    </div>
  );
};
