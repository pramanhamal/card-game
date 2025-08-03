import React from "react";
import type { PlayerId } from "../types/spades";

interface Props {
  bids: Record<PlayerId, number>;
  tricksWon: Record<PlayerId, number>;
}

export const Scoreboard: React.FC<Props> = ({ bids, tricksWon }) => {
  const order: PlayerId[] = ["north", "east", "south", "west"];
  return (
    <div className="bg-gray-900 text-white rounded p-3 flex gap-4">
      {order.map((p) => (
        <div key={p} className="text-center">
          <div className="uppercase font-semibold">{p}</div>
          <div>Bid: {bids[p]}</div>
          <div>Tricks: {tricksWon[p]}</div>
        </div>
      ))}
    </div>
  );
};
