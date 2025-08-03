// src/components/Card.tsx
import React from "react";
import type { Card as CardType } from "../types/spades";

// Eagerly load all card images from assets/cards
const modules = import.meta.glob("../assets/cards/*.png", {
  eager: true,
  as: "url",
});
const cardImages: Record<string, string> = {};
for (const path in modules) {
  const fileName = path.split("/").pop()!;
  cardImages[fileName] = (modules as Record<string, any>)[path];
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  card: CardType;
  onClick?: () => void;
  faceUp?: boolean;
  // Optionally allow overriding size if needed
  className?: string;
}

const rankToDisplay = (rank: CardType["rank"]) => String(rank);

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  faceUp = true,
  className = "",
  ...rest
}) => {
  // Construct expected filename (e.g., "spades-2.png" or "hearts-A.png")
  const key = `${card.suit}-${rankToDisplay(card.rank)}.png`;
  const src = cardImages[key];

  // Back image (fallback)
  const backSrc = cardImages["back-maroon.png"] || cardImages["back-blue.png"];

  return (
    <div
      onClick={onClick}
      className={`card relative rounded overflow-hidden w-16 h-24 flex items-center justify-center bg-white shadow ${className} ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
      {...rest}
    >
      {faceUp ? (
        src ? (
          <img
            src={src}
            alt={`${rankToDisplay(card.rank)} of ${card.suit}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          // fallback if the specific card image is missing
          <div className="flex flex-col items-center justify-center text-xs text-center p-1">
            <div className="font-bold">{rankToDisplay(card.rank)}</div>
            <div className="capitalize">{card.suit}</div>
          </div>
        )
      ) : backSrc ? (
        <img
          src={backSrc}
          alt="Card back"
          className="w-full h-full object-contain"
          draggable={false}
        />
      ) : (
        // fallback face-down
        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
          <span className="text-lg">🂠</span>
        </div>
      )}
    </div>
  );
};
