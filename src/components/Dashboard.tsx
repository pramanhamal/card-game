// src/components/Dashboard.tsx
import React from "react";
import type { GameResult, PlayerId } from "../types/spades";

interface Props {
  history: GameResult[];
  onClose: () => void;
  playerNames: Record<PlayerId, string>;
  avatars: Record<PlayerId, string | undefined>;
  yourSeat?: PlayerId;
}

// Medal icons for 1st–4th
const MEDALS = ["🥇", "🥈", "🥉", "🎖"];

export const Dashboard: React.FC<Props> = ({
  history,
  onClose,
  playerNames,
  avatars,
  yourSeat,
}) => {
  if (history.length === 0) return null;

  const lastRound = history[history.length - 1]!;
  const scores: Record<PlayerId, number> =
    lastRound.totalScores != null
      ? lastRound.totalScores
      : lastRound.scores;

  const players = Object.keys(scores) as PlayerId[];
  const sorted = [...players].sort((a, b) => scores[b] - scores[a]);

  const displayName = (p: PlayerId) => {
    const base = playerNames[p] || p.toUpperCase();
    return p === yourSeat ? `${base} (You)` : base;
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/60 p-6">
      <div className="bg-red-900 border-2 border-yellow-500 rounded-lg p-4 w-full max-w-3xl">
        <div className="grid grid-cols-4 gap-4">
          {sorted.map((p, idx) => (
            <div key={p} className="text-center text-white">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl mr-2">{MEDALS[idx] || ""}</span>

                {avatars[p] ? (
                  <img
                    src={avatars[p]!}
                    alt={displayName(p)}
                    className="w-12 h-12 rounded-full border-2 border-white"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 border-2 border-white" />
                )}
              </div>

              <div className="font-semibold text-lg">{displayName(p)}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          {sorted.map((p) => (
            <div key={p} className="text-center">
              <span className="text-yellow-400 text-3xl">
                {scores[p].toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onClose}
        className="mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg"
      >
        NEXT ROUND
      </button>
    </div>
  );
};

export default Dashboard;
