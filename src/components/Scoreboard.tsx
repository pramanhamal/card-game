import React from "react";
import type { PlayerId } from "../types/spades";

interface Props {
  bids: Record<PlayerId, number>;
  tricksWon: Record<PlayerId, number>;
  nameMap?: Record<PlayerId, string>;
  yourSeat?: PlayerId;
}

export const Scoreboard: React.FC<Props> = ({
  bids,
  tricksWon,
  nameMap,
  yourSeat,
}) => {
  const order: PlayerId[] = ["north", "east", "south", "west"];

  const statusColor = (p: PlayerId) => {
    const bid = bids[p];
    const won = tricksWon[p];
    if (won >= bid) return "#4ade80";   // making bid — green
    if (won >= bid - 1) return "#facc15"; // one under — yellow
    return "#f87171";                     // behind — red
  };

  return (
    <div
      className="rounded-2xl px-4 py-3 flex gap-4"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {order.map((p) => {
        const isYou = p === yourSeat;
        const bid = bids[p];
        const won = tricksWon[p];
        const color = statusColor(p);
        const displayName = nameMap?.[p] || p.toUpperCase();

        return (
          <div key={p} className="text-center min-w-[52px]">
            <div
              className="text-xs font-bold truncate max-w-[52px]"
              style={{ color: isYou ? "#ffd700" : "rgba(255,255,255,0.7)" }}
            >
              {isYou ? "You" : displayName}
            </div>
            <div
              className="text-lg font-black tabular-nums leading-tight mt-0.5"
              style={{ color }}
            >
              {won}
              <span
                className="text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                /{bid}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
