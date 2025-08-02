// src/components/Scoreboard.tsx
import React from "react";

type PlayerId = "north" | "east" | "south" | "west";

export interface ScoreboardProps {
  bids?: Partial<Record<PlayerId, number>>;
  tricksWon?: Partial<Record<PlayerId, number>>;
}

const defaultBidTrick: Record<PlayerId, number> = {
  north: 0,
  east: 0,
  south: 0,
  west: 0,
};

/**
 * Simple per-player score calculation:
 * - If player makes their bid: score = bid * 10 + (tricksWon - bid)  (overtricks count as 1 each)
 * - If player fails bid: score = -bid * 10
 * This is a common baseline; actual Spades scoring can be adjusted upstream.
 */
function computePlayerScore(bid: number, tricks: number) {
  if (tricks >= bid) {
    return bid * 10 + (tricks - bid);
  } else {
    return -bid * 10;
  }
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const Scoreboard: React.FC<ScoreboardProps> = ({
  bids = {},
  tricksWon = {},
}) => {
  // Merge with defaults to avoid undefined
  const safeBids: Record<PlayerId, number> = {
    ...defaultBidTrick,
    ...bids,
  } as Record<PlayerId, number>;
  const safeTricks: Record<PlayerId, number> = {
    ...defaultBidTrick,
    ...tricksWon,
  } as Record<PlayerId, number>;

  // Compute per-player scores
  const playerScores: Record<PlayerId, number> = {
    north: computePlayerScore(safeBids.north, safeTricks.north),
    east: computePlayerScore(safeBids.east, safeTricks.east),
    south: computePlayerScore(safeBids.south, safeTricks.south),
    west: computePlayerScore(safeBids.west, safeTricks.west),
  };

  // Team totals: North+South vs East+West
  const teamNSScore = playerScores.north + playerScores.south;
  const teamEWScore = playerScores.east + playerScores.west;

  const renderPlayerRow = (player: PlayerId) => {
    const bid = safeBids[player];
    const tricks = safeTricks[player];
    const score = playerScores[player];
    const delta = tricks - bid;
    const made = tricks >= bid;

    return (
      <tr key={player} className="border-b">
        <td className="px-2 py-1 font-medium">{capitalize(player)}</td>
        <td className="px-2 py-1 text-center">{bid}</td>
        <td className="px-2 py-1 text-center">{tricks}</td>
        <td
          className={`px-2 py-1 text-center ${
            made ? "text-green-400" : "text-red-400"
          }`}
        >
          {delta >= 0 ? `+${delta}` : delta}
        </td>
        <td className="px-2 py-1 text-center">{score}</td>
      </tr>
    );
  };

  return (
    <div
      aria-label="Scoreboard"
      className="bg-white bg-opacity-90 rounded shadow p-3 text-sm w-full max-w-md"
    >
      <div className="mb-2 flex justify-between">
        <div className="font-semibold">Individual Scores</div>
        <div className="flex gap-4">
          <div className="text-xs">
            <div className="font-semibold">NS Team:</div>
            <div>{teamNSScore}</div>
          </div>
          <div className="text-xs">
            <div className="font-semibold">EW Team:</div>
            <div>{teamEWScore}</div>
          </div>
        </div>
      </div>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="text-left text-xs uppercase">
            <th className="px-2 py-1">Player</th>
            <th className="px-2 py-1 text-center">Bid</th>
            <th className="px-2 py-1 text-center">Tricks</th>
            <th className="px-2 py-1 text-center">Δ</th>
            <th className="px-2 py-1 text-center">Score</th>
          </tr>
        </thead>
        <tbody>{["north", "east", "south", "west"].map(renderPlayerRow as any)}</tbody>
      </table>
    </div>
  );
};

export default Scoreboard;
