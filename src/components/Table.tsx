// src/components/Table.tsx
import React from "react";
import { GameState, PlayerId, Card } from "../types/spades";

interface TableProps {
  state: GameState;
  playCard: (player: PlayerId, card: Card) => void;
  you: PlayerId;
  onEvaluateTrick: () => void;
  nameMap?: Record<PlayerId, string>;
}

const defaultNameMap: Record<PlayerId, string> = {
  north: "North",
  east: "East",
  south: "You",
  west: "West",
};

export const Table: React.FC<TableProps> = ({
  state,
  playCard,
  you,
  nameMap = defaultNameMap,
}) => {
  const { hands, trick, turn, tricksWon } = state;

  return (
    <div className="w-full h-full bg-teal-800 text-white p-6">
      <div className="mb-4">
        <div>
          <strong>Turn:</strong> {turn === you ? "You" : turn ? nameMap[turn] : "—"}
        </div>
        <div className="mt-2 flex gap-4">
          {(["north", "east", "south", "west"] as PlayerId[]).map((p) => (
            <div key={p} className="border p-2 rounded flex-1">
              <div className="font-semibold">
                {nameMap[p]} ({p})
              </div>
              <div>
                Cards: {hands[p].length}
              </div>
              <div>
                Tricks Won: {tricksWon[p]}
              </div>
              <div className="mt-1">
                Played: {trick[p] ? `${trick[p]?.rank} of ${trick[p]?.suit}` : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="font-bold mb-2">Your Hand:</div>
        <div className="flex gap-2 flex-wrap">
          {hands[you].map((c, i) => (
            <div
              key={`${c.suit}-${c.rank}-${i}`}
              className="border rounded px-3 py-2 cursor-pointer bg-white text-black"
              onClick={() => playCard(you, c)}
            >
              {c.rank} {c.suit[0].toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
