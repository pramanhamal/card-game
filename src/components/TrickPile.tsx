import React from "react";
import type { PlayerId, Card } from "../types/spades";

interface TrickPileProps {
  trick: Record<PlayerId, Card | null>;
  winner: PlayerId | null;
  onFlyOutEnd: () => void;
}

export const TrickPile: React.FC<TrickPileProps> = ({
  trick,
  winner,
  onFlyOutEnd,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <div className="bg-black/60 text-white rounded p-3 mb-2">
        Current Trick:
      </div>
      <div className="flex gap-4">
        {(["north", "east", "south", "west"] as PlayerId[]).map((p) => (
          <div
            key={p}
            className={`w-16 h-24 flex flex-col items-center justify-center border rounded ${
              winner === p ? "ring-2 ring-green-400" : ""
            }`}
          >
            {trick[p] ? (
              <>
                <div>{trick[p]!.rank}</div>
                <div className="text-xs">{trick[p]!.suit}</div>
              </>
            ) : (
              <div className="text-gray-400">—</div>
            )}
            <div className="text-xs mt-1 capitalize">{p}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
